// Petit serveur local de ViceCityClips.
//
// Il ne parle qu'a votre machine : il ecoute sur le reseau local pour que
// l'iPhone puisse s'y connecter, mais n'appelle aucun service en ligne et ne
// demande aucun compte.

import express, { type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

import { DOSSIER_PIECES, RACINE, creerDossiers, trouverFichierExcel } from './chemins';
import { baseEstVide, ecrireReglages, lireReglages, ouvrirBase } from './db';
import {
  calculerTableauDeBord,
  lireClip,
  listerCampagnes,
  listerClips,
  listerComptes,
  listerPaiements,
  listerTaches,
  type FiltresClips,
} from './enrichir';
import { importerClasseur } from './import-excel';
import { exporterCsv, exporterExcel } from './export';
import { creerSauvegarde, restaurerSauvegarde } from './sauvegarde';
import {
  MOYENS_PAIEMENT,
  PLATEFORMES,
  STATUTS_CLIP,
  STATUTS_TACHE,
  TYPES_CAMPAGNE,
} from '../shared/types';
import { choisirAdresses, type AdresseReseau } from '../shared/reseau';

export const PORT_API = Number(process.env.PORT_API ?? 4317);

creerDossiers();
const db = ouvrirBase();

/* ------------------------------------------------------------------ */
/* Lecture du corps des requetes                                       */
/* ------------------------------------------------------------------ */

type TypeChamp = 'texte' | 'nombre' | 'entier' | 'booleen' | 'date' | 'heure';

interface Champ {
  cle: string;
  colonne: string;
  type: TypeChamp;
  /** Valeurs autorisees (sinon la valeur est refusee). */
  parmi?: readonly string[];
}

class ErreurRequete extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ErreurRequete';
  }
}

function convertir(champ: Champ, valeur: unknown): unknown {
  if (valeur === null || valeur === undefined || valeur === '') {
    return champ.type === 'booleen' ? 0 : null;
  }
  switch (champ.type) {
    case 'texte': {
      const t = String(valeur).trim();
      if (t === '') return null;
      if (champ.parmi && !champ.parmi.includes(t)) {
        throw new ErreurRequete(`Valeur « ${t} » refusee pour « ${champ.cle} ».`);
      }
      return t;
    }
    case 'nombre': {
      const n = Number(valeur);
      if (!Number.isFinite(n)) throw new ErreurRequete(`« ${champ.cle} » doit etre un nombre.`);
      return n;
    }
    case 'entier': {
      const n = Number(valeur);
      if (!Number.isFinite(n)) throw new ErreurRequete(`« ${champ.cle} » doit etre un nombre entier.`);
      return Math.round(n);
    }
    case 'booleen':
      return valeur === true || valeur === 'true' || valeur === 1 || valeur === '1' ? 1 : 0;
    case 'date': {
      const t = String(valeur).trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) {
        throw new ErreurRequete(`« ${champ.cle} » doit etre une date au format AAAA-MM-JJ.`);
      }
      return t;
    }
    case 'heure': {
      const t = String(valeur).trim();
      const m = /^(\d{1,2}):(\d{2})/.exec(t);
      if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) {
        throw new ErreurRequete(`« ${champ.cle} » doit etre une heure au format HH:MM.`);
      }
      return `${m[1].padStart(2, '0')}:${m[2]}`;
    }
  }
}

function corpsObjet(requete: Request): Record<string, unknown> {
  const corps = requete.body;
  if (corps === null || typeof corps !== 'object' || Array.isArray(corps)) {
    throw new ErreurRequete('Le corps de la requete doit etre un objet JSON.');
  }
  return corps as Record<string, unknown>;
}

/** Insere une ligne a partir du corps de la requete. Renvoie l'identifiant cree. */
function inserer(table: string, champs: Champ[], corps: Record<string, unknown>): number | string {
  const colonnes: string[] = [];
  const marqueurs: string[] = [];
  const params: unknown[] = [];

  for (const champ of champs) {
    if (!(champ.cle in corps)) continue;
    colonnes.push(champ.colonne);
    marqueurs.push('?');
    params.push(convertir(champ, corps[champ.cle]));
  }

  if (colonnes.length === 0) throw new ErreurRequete('Aucun champ a enregistrer.');

  const info = db
    .prepare(`INSERT INTO ${table} (${colonnes.join(', ')}) VALUES (${marqueurs.join(', ')})`)
    .run(...params);
  return Number(info.lastInsertRowid);
}

/** Met a jour une ligne : seuls les champs presents dans le corps sont touches. */
function mettreAJour(
  table: string,
  champs: Champ[],
  corps: Record<string, unknown>,
  id: string | number,
  colonneId = 'id',
): boolean {
  const affectations: string[] = [];
  const params: unknown[] = [];

  for (const champ of champs) {
    if (!(champ.cle in corps)) continue;
    affectations.push(`${champ.colonne} = ?`);
    params.push(convertir(champ, corps[champ.cle]));
  }

  if (affectations.length === 0) return true; // rien a changer

  const colonnesTable = (db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>).map(
    (c) => c.name,
  );
  if (colonnesTable.includes('maj_le')) affectations.push("maj_le = datetime('now')");

  params.push(id);
  const info = db
    .prepare(`UPDATE ${table} SET ${affectations.join(', ')} WHERE ${colonneId} = ?`)
    .run(...params);
  return info.changes > 0;
}

function supprimer(table: string, id: string | number, colonneId = 'id'): boolean {
  const info = db.prepare(`DELETE FROM ${table} WHERE ${colonneId} = ?`).run(id);
  return info.changes > 0;
}

function identifiantNumerique(valeur: string): number {
  const n = Number(valeur);
  if (!Number.isInteger(n) || n <= 0) throw new ErreurRequete('Identifiant invalide.');
  return n;
}

/* ------------------------------------------------------------------ */
/* Definition des champs                                               */
/* ------------------------------------------------------------------ */

const CHAMPS_CAMPAGNE: Champ[] = [
  { cle: 'id', colonne: 'id', type: 'texte' },
  { cle: 'nom', colonne: 'nom', type: 'texte' },
  { cle: 'organisateur', colonne: 'organisateur', type: 'texte' },
  { cle: 'plateformeCampagne', colonne: 'plateforme_campagne', type: 'texte' },
  { cle: 'lien', colonne: 'lien', type: 'texte' },
  { cle: 'type', colonne: 'type', type: 'texte', parmi: TYPES_CAMPAGNE },
  { cle: 'cpm', colonne: 'cpm', type: 'nombre' },
  { cle: 'paiementMin', colonne: 'paiement_min', type: 'nombre' },
  { cle: 'plafondParClip', colonne: 'plafond_par_clip', type: 'nombre' },
  { cle: 'budgetTotal', colonne: 'budget_total', type: 'nombre' },
  { cle: 'plateformesEligibles', colonne: 'plateformes_eligibles', type: 'texte' },
  { cle: 'audienceExigee', colonne: 'audience_exigee', type: 'texte' },
  { cle: 'langue', colonne: 'langue', type: 'texte' },
  { cle: 'hashtagObligatoire', colonne: 'hashtag_obligatoire', type: 'texte' },
  { cle: 'delaiSoumissionMin', colonne: 'delai_soumission_min', type: 'entier' },
  { cle: 'dateLimite', colonne: 'date_limite', type: 'date' },
  { cle: 'statut', colonne: 'statut', type: 'texte' },
  { cle: 'verifieLe', colonne: 'verifie_le', type: 'date' },
  { cle: 'reglesCles', colonne: 'regles_cles', type: 'texte' },
];

const CHAMPS_COMPTE: Champ[] = [
  { cle: 'identifiant', colonne: 'identifiant', type: 'texte' },
  { cle: 'nomAffiche', colonne: 'nom_affiche', type: 'texte' },
  { cle: 'plateforme', colonne: 'plateforme', type: 'texte' },
  { cle: 'niche', colonne: 'niche', type: 'texte' },
  { cle: 'langue', colonne: 'langue', type: 'texte' },
  { cle: 'configurationPays', colonne: 'configuration_pays', type: 'texte' },
  { cle: 'dateCreation', colonne: 'date_creation', type: 'date' },
  { cle: 'relieContentRewards', colonne: 'relie_content_rewards', type: 'booleen' },
  { cle: 'audiencePrincipale', colonne: 'audience_principale', type: 'texte' },
  { cle: 'notes', colonne: 'notes', type: 'texte' },
];

const CHAMPS_CLIP: Champ[] = [
  { cle: 'datePublication', colonne: 'date_publication', type: 'date' },
  { cle: 'heurePublication', colonne: 'heure_publication', type: 'heure' },
  { cle: 'heureSoumission', colonne: 'heure_soumission', type: 'heure' },
  { cle: 'compteId', colonne: 'compte_id', type: 'entier' },
  { cle: 'plateforme', colonne: 'plateforme', type: 'texte', parmi: PLATEFORMES },
  { cle: 'campagneId', colonne: 'campagne_id', type: 'texte' },
  { cle: 'createur', colonne: 'createur', type: 'texte' },
  { cle: 'lienPublication', colonne: 'lien_publication', type: 'texte' },
  { cle: 'lienSource', colonne: 'lien_source', type: 'texte' },
  { cle: 'vuesJ3', colonne: 'vues_j3', type: 'entier' },
  { cle: 'vuesFinales', colonne: 'vues_finales', type: 'entier' },
  { cle: 'statut', colonne: 'statut', type: 'texte', parmi: STATUTS_CLIP },
  { cle: 'motifRefus', colonne: 'motif_refus', type: 'texte' },
  { cle: 'notes', colonne: 'notes', type: 'texte' },
];

const CHAMPS_PAIEMENT: Champ[] = [
  { cle: 'dateReception', colonne: 'date_reception', type: 'date' },
  { cle: 'source', colonne: 'source', type: 'texte' },
  { cle: 'campagneId', colonne: 'campagne_id', type: 'texte' },
  { cle: 'montantBrutUsd', colonne: 'montant_brut', type: 'nombre' },
  { cle: 'fraisRetraitUsd', colonne: 'frais_retrait', type: 'nombre' },
  { cle: 'tauxEurParUsd', colonne: 'taux_eur_par_usd', type: 'nombre' },
  { cle: 'moyen', colonne: 'moyen', type: 'texte', parmi: MOYENS_PAIEMENT },
  { cle: 'reference', colonne: 'reference', type: 'texte' },
  { cle: 'declareImpots', colonne: 'declare_impots', type: 'booleen' },
  { cle: 'notes', colonne: 'notes', type: 'texte' },
];

const CHAMPS_TACHE: Champ[] = [
  { cle: 'numero', colonne: 'numero', type: 'entier' },
  { cle: 'phase', colonne: 'phase', type: 'texte' },
  { cle: 'tache', colonne: 'tache', type: 'texte' },
  { cle: 'detail', colonne: 'detail', type: 'texte' },
  { cle: 'echeance', colonne: 'echeance', type: 'date' },
  { cle: 'statut', colonne: 'statut', type: 'texte', parmi: STATUTS_TACHE },
  { cle: 'notes', colonne: 'notes', type: 'texte' },
  { cle: 'ordre', colonne: 'ordre', type: 'entier' },
];

/* ------------------------------------------------------------------ */
/* Pieces jointes                                                      */
/* ------------------------------------------------------------------ */

const TYPES_FICHIERS_ACCEPTES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/gif',
  'application/pdf',
]);

const televersement = multer({
  storage: multer.diskStorage({
    destination: (_req, _fichier, suite) => suite(null, DOSSIER_PIECES),
    filename: (_req, fichier, suite) => {
      const extension = path.extname(fichier.originalname).toLowerCase().slice(0, 10) || '.bin';
      suite(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${extension}`);
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024, files: 1 },
  fileFilter: (_req, fichier, suite) => {
    if (TYPES_FICHIERS_ACCEPTES.has(fichier.mimetype)) suite(null, true);
    else suite(new ErreurRequete(`Type de fichier refuse : ${fichier.mimetype}. Images et PDF seulement.`));
  },
});

const archiveEnMemoire = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024, files: 1 },
});

/* ------------------------------------------------------------------ */
/* Application                                                         */
/* ------------------------------------------------------------------ */

export const app = express();
app.use(express.json({ limit: '10mb' }));
app.use('/pieces-jointes', express.static(DOSSIER_PIECES, { fallthrough: false }));

/** Enveloppe les routes pour que toute erreur remonte proprement. */
function route(gestionnaire: (req: Request, res: Response) => unknown | Promise<unknown>) {
  return (req: Request, res: Response, suivant: NextFunction): void => {
    Promise.resolve()
      .then(() => gestionnaire(req, res))
      .catch(suivant);
  };
}

const reglages = () => lireReglages(db);

/* --- Etat et reglages --- */

app.get(
  '/api/etat',
  route((_req, res) => {
    const fichierExcel = trouverFichierExcel();
    res.json({
      baseVide: baseEstVide(db),
      fichierExcel: fichierExcel ? path.basename(fichierExcel) : null,
      dossier: RACINE,
      port: PORT_API,
      adresses: adressesReseauLocal(),
    });
  }),
);

app.get(
  '/api/reglages',
  route((_req, res) => res.json(reglages())),
);

app.put(
  '/api/reglages',
  route((req, res) => {
    const corps = corpsObjet(req);
    const partiel: Record<string, number> = {};

    if ('fraisCpm' in corps) {
      const n = Number(corps.fraisCpm);
      if (!Number.isFinite(n) || n < 0 || n > 1) {
        throw new ErreurRequete('Les frais doivent etre une fraction entre 0 et 1 (0,1 = 10 %).');
      }
      partiel.fraisCpm = n;
    }
    if ('tauxEurParUsd' in corps) {
      const n = Number(corps.tauxEurParUsd);
      if (!Number.isFinite(n) || n <= 0) throw new ErreurRequete('Le taux de change doit etre positif.');
      partiel.tauxEurParUsd = n;
    }
    if ('objectifMensuelEur' in corps) {
      const n = Number(corps.objectifMensuelEur);
      if (!Number.isFinite(n) || n < 0) throw new ErreurRequete("L'objectif mensuel doit etre positif.");
      partiel.objectifMensuelEur = n;
    }

    res.json(ecrireReglages(db, partiel));
  }),
);

/* --- Tableau de bord --- */

app.get(
  '/api/tableau-de-bord',
  route((_req, res) => res.json(calculerTableauDeBord(db, reglages()))),
);

/* --- Campagnes --- */

app.get(
  '/api/campagnes',
  route((_req, res) => res.json(listerCampagnes(db, reglages()))),
);

app.post(
  '/api/campagnes',
  route((req, res) => {
    const corps = corpsObjet(req);
    const id = typeof corps.id === 'string' ? corps.id.trim() : '';
    if (!id) throw new ErreurRequete("L'identifiant court de la campagne est obligatoire.");
    if (db.prepare('SELECT 1 FROM campagnes WHERE id = ?').get(id)) {
      throw new ErreurRequete(`La campagne « ${id} » existe deja.`);
    }
    inserer('campagnes', CHAMPS_CAMPAGNE, { ...corps, id });
    res.status(201).json(listerCampagnes(db, reglages()).find((c) => c.id === id));
  }),
);

app.put(
  '/api/campagnes/:id',
  route((req, res) => {
    const corps = corpsObjet(req);
    const ancien = req.params.id;
    const nouveau = typeof corps.id === 'string' ? corps.id.trim() : ancien;

    if (!db.prepare('SELECT 1 FROM campagnes WHERE id = ?').get(ancien)) {
      throw new ErreurRequete(`La campagne « ${ancien} » n'existe pas.`);
    }
    if (nouveau !== ancien && db.prepare('SELECT 1 FROM campagnes WHERE id = ?').get(nouveau)) {
      throw new ErreurRequete(`La campagne « ${nouveau} » existe deja.`);
    }

    mettreAJour('campagnes', CHAMPS_CAMPAGNE, { ...corps, id: nouveau }, ancien);
    res.json(listerCampagnes(db, reglages()).find((c) => c.id === nouveau));
  }),
);

app.delete(
  '/api/campagnes/:id',
  route((req, res) => {
    if (!supprimer('campagnes', req.params.id)) throw new ErreurRequete('Campagne introuvable.');
    res.json({ supprime: true });
  }),
);

/* --- Comptes --- */

app.get(
  '/api/comptes',
  route((_req, res) => res.json(listerComptes(db, reglages()))),
);

app.post(
  '/api/comptes',
  route((req, res) => {
    const corps = corpsObjet(req);
    const identifiant = typeof corps.identifiant === 'string' ? corps.identifiant.trim() : '';
    if (!identifiant) throw new ErreurRequete("L'identifiant du compte est obligatoire.");
    if (db.prepare('SELECT 1 FROM comptes WHERE identifiant = ?').get(identifiant)) {
      throw new ErreurRequete(`Le compte « ${identifiant} » existe deja.`);
    }
    const id = inserer('comptes', CHAMPS_COMPTE, corps);
    res.status(201).json(listerComptes(db, reglages()).find((c) => c.id === id));
  }),
);

app.put(
  '/api/comptes/:id',
  route((req, res) => {
    const id = identifiantNumerique(req.params.id);
    if (!mettreAJour('comptes', CHAMPS_COMPTE, corpsObjet(req), id)) {
      throw new ErreurRequete('Compte introuvable.');
    }
    res.json(listerComptes(db, reglages()).find((c) => c.id === id));
  }),
);

app.delete(
  '/api/comptes/:id',
  route((req, res) => {
    if (!supprimer('comptes', identifiantNumerique(req.params.id))) {
      throw new ErreurRequete('Compte introuvable.');
    }
    res.json({ supprime: true });
  }),
);

app.get(
  '/api/comptes/:id/abonnes',
  route((req, res) => {
    const id = identifiantNumerique(req.params.id);
    res.json(
      db
        .prepare('SELECT id, compte_id AS compteId, date, abonnes FROM abonnes_historique WHERE compte_id = ? ORDER BY date DESC, id DESC')
        .all(id),
    );
  }),
);

app.post(
  '/api/comptes/:id/abonnes',
  route((req, res) => {
    const compteId = identifiantNumerique(req.params.id);
    const corps = corpsObjet(req);

    const date = String(corps.date ?? '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new ErreurRequete('La date doit etre au format AAAA-MM-JJ.');

    const abonnes = Number(corps.abonnes);
    if (!Number.isFinite(abonnes) || abonnes < 0) {
      throw new ErreurRequete("Le nombre d'abonnes doit etre positif.");
    }
    if (!db.prepare('SELECT 1 FROM comptes WHERE id = ?').get(compteId)) {
      throw new ErreurRequete('Compte introuvable.');
    }

    const info = db
      .prepare('INSERT INTO abonnes_historique (compte_id, date, abonnes) VALUES (?, ?, ?)')
      .run(compteId, date, Math.round(abonnes));
    res.status(201).json({ id: Number(info.lastInsertRowid), compteId, date, abonnes: Math.round(abonnes) });
  }),
);

app.delete(
  '/api/abonnes/:id',
  route((req, res) => {
    if (!supprimer('abonnes_historique', identifiantNumerique(req.params.id))) {
      throw new ErreurRequete('Releve introuvable.');
    }
    res.json({ supprime: true });
  }),
);

/* --- Clips --- */

app.get(
  '/api/clips',
  route((req, res) => {
    const q = req.query;
    const filtres: FiltresClips = {
      compteId: q.compteId ? Number(q.compteId) : null,
      plateforme: typeof q.plateforme === 'string' && q.plateforme ? q.plateforme : null,
      campagneId: typeof q.campagneId === 'string' && q.campagneId ? q.campagneId : null,
      statut: typeof q.statut === 'string' && q.statut ? q.statut : null,
      mois: typeof q.mois === 'string' && /^\d{4}-\d{2}$/.test(q.mois) ? q.mois : null,
    };
    res.json(listerClips(db, reglages(), filtres));
  }),
);

app.get(
  '/api/clips/:id',
  route((req, res) => {
    const clip = lireClip(db, reglages(), identifiantNumerique(req.params.id));
    if (!clip) throw new ErreurRequete('Clip introuvable.');
    res.json(clip);
  }),
);

app.post(
  '/api/clips',
  route((req, res) => {
    const id = inserer('clips', CHAMPS_CLIP, corpsObjet(req));
    res.status(201).json(lireClip(db, reglages(), Number(id)));
  }),
);

app.put(
  '/api/clips/:id',
  route((req, res) => {
    const id = identifiantNumerique(req.params.id);
    if (!mettreAJour('clips', CHAMPS_CLIP, corpsObjet(req), id)) {
      throw new ErreurRequete('Clip introuvable.');
    }
    res.json(lireClip(db, reglages(), id));
  }),
);

app.delete(
  '/api/clips/:id',
  route((req, res) => {
    const id = identifiantNumerique(req.params.id);
    supprimerPiecesJointes('clip', id);
    if (!supprimer('clips', id)) throw new ErreurRequete('Clip introuvable.');
    res.json({ supprime: true });
  }),
);

/* --- Paiements --- */

app.get(
  '/api/paiements',
  route((_req, res) => res.json(listerPaiements(db, reglages()))),
);

app.post(
  '/api/paiements',
  route((req, res) => {
    const id = inserer('paiements', CHAMPS_PAIEMENT, corpsObjet(req));
    res.status(201).json(listerPaiements(db, reglages()).find((p) => p.id === id));
  }),
);

app.put(
  '/api/paiements/:id',
  route((req, res) => {
    const id = identifiantNumerique(req.params.id);
    if (!mettreAJour('paiements', CHAMPS_PAIEMENT, corpsObjet(req), id)) {
      throw new ErreurRequete('Paiement introuvable.');
    }
    res.json(listerPaiements(db, reglages()).find((p) => p.id === id));
  }),
);

app.delete(
  '/api/paiements/:id',
  route((req, res) => {
    const id = identifiantNumerique(req.params.id);
    supprimerPiecesJointes('paiement', id);
    if (!supprimer('paiements', id)) throw new ErreurRequete('Paiement introuvable.');
    res.json({ supprime: true });
  }),
);

/* --- Taches --- */

app.get(
  '/api/taches',
  route((_req, res) => res.json(listerTaches(db))),
);

app.post(
  '/api/taches',
  route((req, res) => {
    const corps = corpsObjet(req);
    if (typeof corps.tache !== 'string' || !corps.tache.trim()) {
      throw new ErreurRequete("L'intitule de la tache est obligatoire.");
    }
    if (!('ordre' in corps)) {
      const max = db.prepare('SELECT COALESCE(MAX(ordre), -1) AS m FROM taches').get() as { m: number };
      corps.ordre = max.m + 1;
    }
    const id = inserer('taches', CHAMPS_TACHE, corps);
    res.status(201).json(listerTaches(db).find((t) => t.id === id));
  }),
);

app.put(
  '/api/taches/:id',
  route((req, res) => {
    const id = identifiantNumerique(req.params.id);
    if (!mettreAJour('taches', CHAMPS_TACHE, corpsObjet(req), id)) {
      throw new ErreurRequete('Tache introuvable.');
    }
    res.json(listerTaches(db).find((t) => t.id === id));
  }),
);

app.delete(
  '/api/taches/:id',
  route((req, res) => {
    if (!supprimer('taches', identifiantNumerique(req.params.id))) {
      throw new ErreurRequete('Tache introuvable.');
    }
    res.json({ supprime: true });
  }),
);

/* --- Pieces jointes --- */

function supprimerPiecesJointes(typeParent: 'clip' | 'paiement', parentId: number): void {
  const pieces = db
    .prepare('SELECT nom_fichier FROM pieces_jointes WHERE type_parent = ? AND parent_id = ?')
    .all(typeParent, parentId) as Array<{ nom_fichier: string }>;
  for (const piece of pieces) {
    fs.rmSync(path.join(DOSSIER_PIECES, piece.nom_fichier), { force: true });
  }
  db.prepare('DELETE FROM pieces_jointes WHERE type_parent = ? AND parent_id = ?').run(typeParent, parentId);
}

function routeAjoutPiece(typeParent: 'clip' | 'paiement', table: string) {
  return route((req: Request, res: Response) => {
    const parentId = identifiantNumerique(req.params.id);
    const fichier = (req as Request & { file?: Express.Multer.File }).file;
    if (!fichier) throw new ErreurRequete('Aucun fichier recu.');

    if (!db.prepare(`SELECT 1 FROM ${table} WHERE id = ?`).get(parentId)) {
      fs.rmSync(path.join(DOSSIER_PIECES, fichier.filename), { force: true });
      throw new ErreurRequete('Element introuvable.');
    }

    const info = db
      .prepare(
        `INSERT INTO pieces_jointes (type_parent, parent_id, nom_fichier, nom_original, type_mime, taille)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(typeParent, parentId, fichier.filename, fichier.originalname, fichier.mimetype, fichier.size);

    res.status(201).json({
      id: Number(info.lastInsertRowid),
      typeParent,
      parentId,
      nomFichier: fichier.filename,
      nomOriginal: fichier.originalname,
      typeMime: fichier.mimetype,
      taille: fichier.size,
      url: `/pieces-jointes/${encodeURIComponent(fichier.filename)}`,
    });
  });
}

app.post('/api/clips/:id/pieces-jointes', televersement.single('fichier'), routeAjoutPiece('clip', 'clips'));
app.post(
  '/api/paiements/:id/pieces-jointes',
  televersement.single('fichier'),
  routeAjoutPiece('paiement', 'paiements'),
);

app.delete(
  '/api/pieces-jointes/:id',
  route((req, res) => {
    const id = identifiantNumerique(req.params.id);
    const piece = db.prepare('SELECT nom_fichier FROM pieces_jointes WHERE id = ?').get(id) as
      | { nom_fichier: string }
      | undefined;
    if (!piece) throw new ErreurRequete('Piece jointe introuvable.');
    fs.rmSync(path.join(DOSSIER_PIECES, piece.nom_fichier), { force: true });
    db.prepare('DELETE FROM pieces_jointes WHERE id = ?').run(id);
    res.json({ supprime: true });
  }),
);

/* --- Import du classeur Excel --- */

app.post(
  '/api/import-excel',
  route(async (req, res) => {
    const corps = req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : {};
    const remplacer = corps.remplacer === true;

    if (!remplacer && !baseEstVide(db)) {
      throw new ErreurRequete(
        "La base contient deja des donnees. Pour repartir du fichier Excel, confirmez le remplacement : toutes les donnees actuelles seront effacees.",
      );
    }

    const fichier = trouverFichierExcel();
    if (!fichier) {
      throw new ErreurRequete(
        `Aucun fichier .xlsx trouve dans le dossier de l'application (${RACINE}). Placez-y « ViceCityClips - Tableau de pilotage.xlsx ».`,
      );
    }

    res.json(await importerClasseur(db, fichier, { remplacer }));
  }),
);

/* --- Exports --- */

app.get(
  '/api/export/excel',
  route(async (_req, res) => {
    const contenu = await exporterExcel(db);
    const nom = `vicecityclips-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${nom}"`);
    res.send(contenu);
  }),
);

app.get(
  '/api/export/csv',
  route((_req, res) => {
    const contenu = exporterCsv(db);
    const nom = `vicecityclips-csv-${new Date().toISOString().slice(0, 10)}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${nom}"`);
    res.send(contenu);
  }),
);

/* --- Sauvegarde et restauration --- */

app.get(
  '/api/sauvegarde',
  route(async (_req, res) => {
    const { nom, contenu } = await creerSauvegarde();
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${nom}"`);
    res.send(contenu);
  }),
);

app.post(
  '/api/restauration',
  archiveEnMemoire.single('archive'),
  route(async (req, res) => {
    const fichier = (req as Request & { file?: Express.Multer.File }).file;
    if (!fichier) throw new ErreurRequete('Aucune archive recue.');
    res.json(await restaurerSauvegarde(fichier.buffer));
  }),
);

/* --- Interface --- */

// L'interface compilee est servie par ce meme serveur : une seule adresse a
// ouvrir, sur l'ordinateur comme sur l'iPhone.
const DOSSIER_DIST = path.join(RACINE, 'dist');

app.use(
  express.static(DOSSIER_DIST, {
    // index.html n'est jamais mis en cache : une nouvelle version est prise en
    // compte des le rechargement de la page sur le telephone.
    setHeaders: (reponse, chemin) => {
      if (chemin.endsWith('index.html')) reponse.setHeader('Cache-Control', 'no-cache');
    },
  }),
);

app.get(/^(?!\/api\/).*/, (_req, res) => {
  const page = path.join(DOSSIER_DIST, 'index.html');
  if (fs.existsSync(page)) {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(page);
    return;
  }
  res
    .status(503)
    .type('html')
    .send(
      `<!doctype html><html lang="fr"><head><meta charset="utf-8">
       <meta name="viewport" content="width=device-width, initial-scale=1">
       <title>ViceCityClips</title></head>
       <body style="font-family:-apple-system,system-ui,sans-serif;margin:0;padding:24px;background:#0f172a;color:#e2e8f0">
       <h1 style="font-size:20px">ViceCityClips n'est pas encore compilee</h1>
       <p>L'interface doit etre construite une fois avant d'etre servie.</p>
       <p>Dans le Terminal, dans le dossier de l'application :</p>
       <pre style="background:#1e293b;padding:12px;border-radius:12px;overflow:auto">npm run build</pre>
       <p>Ou relancez simplement <strong>lancer.command</strong>, qui s'en charge.</p>
       </body></html>`,
    );
});

/* --- Erreurs --- */

app.use((erreur: unknown, _req: Request, res: Response, _suivant: NextFunction) => {
  const message =
    erreur instanceof Error ? erreur.message : "Une erreur inattendue s'est produite.";
  const attendue = erreur instanceof ErreurRequete;

  if (!attendue) console.error('[ViceCityClips] erreur :', erreur);
  res.status(attendue ? 400 : 500).json({ erreur: message });
});

/* ------------------------------------------------------------------ */
/* Demarrage                                                           */
/* ------------------------------------------------------------------ */

/** Au premier lancement, reprend le contenu du fichier Excel s'il est la. */
async function importPremierLancement(): Promise<void> {
  if (!baseEstVide(db)) return;
  const fichier = trouverFichierExcel();
  if (!fichier) {
    console.log(
      `[ViceCityClips] Base vide et aucun fichier .xlsx dans ${RACINE} : l'application demarre sans donnees.`,
    );
    return;
  }
  try {
    const r = await importerClasseur(db, fichier);
    console.log(
      `[ViceCityClips] Import de « ${path.basename(fichier)} » : ${r.campagnes} campagne(s), ` +
        `${r.comptes} compte(s), ${r.clips} clip(s), ${r.paiements} paiement(s), ${r.taches} tache(s), ` +
        `${r.lignesExempleIgnorees} ligne(s) EXEMPLE ignoree(s).`,
    );
    for (const a of r.avertissements) console.warn(`[ViceCityClips] ${a}`);
  } catch (erreur) {
    console.error(
      `[ViceCityClips] L'import du fichier Excel a echoue : ${erreur instanceof Error ? erreur.message : erreur}`,
    );
  }
}

/**
 * Adresse de la machine sur le reseau local : c'est celle a taper sur l'iPhone.
 * On prefere le Wi-Fi (en0 sur Mac).
 */
/** Adresses de ce Mac a proposer pour l'iPhone, la plus probable en tete. */
export function adressesReseauLocal(): AdresseReseau[] {
  return choisirAdresses(os.networkInterfaces() as never);
}

export function adresseReseauLocal(): string | null {
  const adresses = adressesReseauLocal();
  return adresses.length > 0 ? adresses[0].adresse : null;
}

// Le serveur demarre des que ce fichier est lance. VCC_PAS_DE_SERVEUR=1 permet
// de l'importer sans l'ouvrir (utile pour des tests).
if (process.env.VCC_PAS_DE_SERVEUR !== '1') {
  await importPremierLancement();

  // On ecoute sur toutes les interfaces : sans cela, l'iPhone ne peut pas
  // joindre l'application. Elle reste accessible aux seuls appareils du meme
  // reseau local, et n'est jamais exposee a internet.
  const serveur = app.listen(PORT_API, '0.0.0.0', () => {
    const ip = adresseReseauLocal();
    console.log(`[ViceCityClips] Pret sur http://localhost:${PORT_API}`);
    if (ip) console.log(`[ViceCityClips] Depuis l'iPhone : http://${ip}:${PORT_API}`);
  });

  serveur.on('error', (erreur: NodeJS.ErrnoException) => {
    if (erreur.code === 'EADDRINUSE') {
      console.error('');
      console.error(`  Le port ${PORT_API} est deja utilise.`);
      console.error("  ViceCityClips tourne sans doute deja dans une autre fenetre :");
      console.error(`  ouvrez simplement http://localhost:${PORT_API}`);
      console.error('');
      console.error('  Sinon, fermez l\'autre fenetre puis relancez lancer.command.');
      console.error('');
    } else {
      console.error('[ViceCityClips] Le serveur n\'a pas pu demarrer :', erreur.message);
    }
    process.exit(1);
  });
}
