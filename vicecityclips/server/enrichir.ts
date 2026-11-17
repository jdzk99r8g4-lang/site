// Transforme les lignes de la base en objets prets a afficher, en appliquant
// les regles de shared/calculs.ts. C'est ici, et nulle part ailleurs, que les
// totaux sont assembles.

import type { BaseDonnees } from './db';
import {
  DELAI_SOUMISSION_REFERENCE_MIN,
  type CampagneCalculee,
  type ClipCalcule,
  type CompteCalcule,
  type LigneMensuelle,
  type PaiementCalcule,
  type PieceJointe,
  type Reglages,
  type Tache,
  type TableauDeBord,
} from '../shared/types';
import {
  delaiMoyenSoumissionMin,
  delaiSoumissionMin,
  fraisClip,
  gainBrutEstime,
  gainNetEstime,
  joursDepuis,
  moisDe,
  paiementNetEur,
  paiementNetUsd,
  partObjectif,
  resteARecevoirUsd,
  tauxApplique,
  tauxApprobation,
  verificationPerimee,
  vuesMinimum,
} from '../shared/calculs';

/* ------------------------------------------------------------------ */
/* Pieces jointes                                                      */
/* ------------------------------------------------------------------ */

function listerPiecesJointes(
  db: BaseDonnees,
  typeParent: 'clip' | 'paiement',
): Map<number, PieceJointe[]> {
  const lignes = db
    .prepare(
      `SELECT id, type_parent, parent_id, nom_fichier, nom_original, type_mime, taille, ajoute_le
       FROM pieces_jointes WHERE type_parent = ? ORDER BY id`,
    )
    .all(typeParent) as Array<Record<string, any>>;

  const carte = new Map<number, PieceJointe[]>();
  for (const l of lignes) {
    const piece: PieceJointe = {
      id: l.id,
      typeParent: l.type_parent,
      parentId: l.parent_id,
      nomFichier: l.nom_fichier,
      nomOriginal: l.nom_original,
      typeMime: l.type_mime,
      taille: l.taille,
      ajouteLe: l.ajoute_le,
      url: `/pieces-jointes/${encodeURIComponent(l.nom_fichier)}`,
    };
    const liste = carte.get(l.parent_id);
    if (liste) liste.push(piece);
    else carte.set(l.parent_id, [piece]);
  }
  return carte;
}

/* ------------------------------------------------------------------ */
/* Clips                                                               */
/* ------------------------------------------------------------------ */

export interface FiltresClips {
  compteId?: number | null;
  plateforme?: string | null;
  campagneId?: string | null;
  statut?: string | null;
  mois?: string | null;
}

export function listerClips(
  db: BaseDonnees,
  reglages: Reglages,
  filtres: FiltresClips = {},
): ClipCalcule[] {
  const conditions: string[] = [];
  const params: Record<string, unknown> = {};

  if (filtres.compteId != null) {
    conditions.push('c.compte_id = @compteId');
    params.compteId = filtres.compteId;
  }
  if (filtres.plateforme) {
    conditions.push('c.plateforme = @plateforme');
    params.plateforme = filtres.plateforme;
  }
  if (filtres.campagneId) {
    conditions.push('c.campagne_id = @campagneId');
    params.campagneId = filtres.campagneId;
  }
  if (filtres.statut) {
    conditions.push('c.statut = @statut');
    params.statut = filtres.statut;
  }
  if (filtres.mois) {
    conditions.push("substr(c.date_publication, 1, 7) = @mois");
    params.mois = filtres.mois;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const lignes = db
    .prepare(
      `SELECT c.*, cp.identifiant AS compte_identifiant,
              ca.nom AS campagne_nom, ca.type AS campagne_type,
              ca.cpm AS cpm, ca.paiement_min AS paiement_min, ca.plafond_par_clip AS plafond_par_clip
       FROM clips c
       LEFT JOIN comptes cp ON cp.id = c.compte_id
       LEFT JOIN campagnes ca ON ca.id = c.campagne_id
       ${where}
       ORDER BY c.date_publication DESC, c.heure_publication DESC, c.id DESC`,
    )
    .all(params) as Array<Record<string, any>>;

  const pieces = listerPiecesJointes(db, 'clip');

  return lignes.map((l) => construireClip(l, reglages, pieces.get(l.id) ?? []));
}

function construireClip(
  l: Record<string, any>,
  reglages: Reglages,
  piecesJointes: PieceJointe[],
): ClipCalcule {
  const campagne =
    l.campagne_id === null
      ? null
      : {
          type: l.campagne_type as string,
          cpm: l.cpm as number | null,
          paiementMin: l.paiement_min as number | null,
          plafondParClip: l.plafond_par_clip as number | null,
        };

  const brut = gainBrutEstime(campagne, l.vues_finales, l.statut);
  const delai = delaiSoumissionMin(l.heure_publication, l.heure_soumission);

  return {
    id: l.id,
    datePublication: l.date_publication,
    heurePublication: l.heure_publication,
    heureSoumission: l.heure_soumission,
    compteId: l.compte_id,
    plateforme: l.plateforme,
    campagneId: l.campagne_id,
    createur: l.createur,
    lienPublication: l.lien_publication,
    lienSource: l.lien_source,
    vuesJ3: l.vues_j3,
    vuesFinales: l.vues_finales,
    statut: l.statut,
    motifRefus: l.motif_refus,
    notes: l.notes,
    compteIdentifiant: l.compte_identifiant ?? null,
    campagneNom: l.campagne_nom ?? null,
    campagneType: l.campagne_type ?? null,
    cpm: l.cpm ?? null,
    paiementMin: l.paiement_min ?? null,
    plafondParClip: l.plafond_par_clip ?? null,
    delaiSoumissionMin: delai,
    horsDelai: delai !== null && delai > DELAI_SOUMISSION_REFERENCE_MIN,
    gainBrutEstime: brut,
    frais: fraisClip(brut, reglages),
    gainNetEstime: gainNetEstime(brut, reglages),
    piecesJointes,
  };
}

export function lireClip(db: BaseDonnees, reglages: Reglages, id: number): ClipCalcule | null {
  const l = db
    .prepare(
      `SELECT c.*, cp.identifiant AS compte_identifiant,
              ca.nom AS campagne_nom, ca.type AS campagne_type,
              ca.cpm AS cpm, ca.paiement_min AS paiement_min, ca.plafond_par_clip AS plafond_par_clip
       FROM clips c
       LEFT JOIN comptes cp ON cp.id = c.compte_id
       LEFT JOIN campagnes ca ON ca.id = c.campagne_id
       WHERE c.id = ?`,
    )
    .get(id) as Record<string, any> | undefined;
  if (!l) return null;
  const pieces = listerPiecesJointes(db, 'clip').get(id) ?? [];
  return construireClip(l, reglages, pieces);
}

/* ------------------------------------------------------------------ */
/* Paiements                                                           */
/* ------------------------------------------------------------------ */

export function listerPaiements(db: BaseDonnees, reglages: Reglages): PaiementCalcule[] {
  const lignes = db
    .prepare(
      `SELECT p.*, ca.nom AS campagne_nom
       FROM paiements p
       LEFT JOIN campagnes ca ON ca.id = p.campagne_id
       ORDER BY p.date_reception DESC, p.id DESC`,
    )
    .all() as Array<Record<string, any>>;

  const pieces = listerPiecesJointes(db, 'paiement');

  return lignes.map((l) => {
    const netUsd = paiementNetUsd(l.montant_brut, l.frais_retrait);
    return {
      id: l.id,
      dateReception: l.date_reception,
      source: l.source,
      campagneId: l.campagne_id,
      montantBrutUsd: l.montant_brut,
      fraisRetraitUsd: l.frais_retrait,
      tauxEurParUsd: l.taux_eur_par_usd,
      moyen: l.moyen,
      reference: l.reference,
      declareImpots: l.declare_impots === 1,
      notes: l.notes,
      campagneNom: l.campagne_nom ?? null,
      montantNetUsd: netUsd,
      tauxApplique: tauxApplique(l.taux_eur_par_usd, reglages),
      tauxParDefautUtilise: l.taux_eur_par_usd === null,
      montantNetEur: paiementNetEur(netUsd, l.taux_eur_par_usd, reglages),
      piecesJointes: pieces.get(l.id) ?? [],
    };
  });
}

/* ------------------------------------------------------------------ */
/* Campagnes                                                           */
/* ------------------------------------------------------------------ */

export function listerCampagnes(db: BaseDonnees, reglages: Reglages): CampagneCalculee[] {
  const lignes = db.prepare('SELECT * FROM campagnes ORDER BY nom').all() as Array<Record<string, any>>;
  const clips = listerClips(db, reglages);
  const paiements = listerPaiements(db, reglages);
  const aujourdhui = new Date();

  return lignes.map((l) => {
    const sesClips = clips.filter((c) => c.campagneId === l.id);
    const estimations = sesClips.map((c) => c.gainNetEstime).filter((v): v is number => v !== null);

    return {
      id: l.id,
      nom: l.nom,
      organisateur: l.organisateur,
      plateformeCampagne: l.plateforme_campagne,
      lien: l.lien,
      type: l.type,
      cpm: l.cpm,
      paiementMin: l.paiement_min,
      plafondParClip: l.plafond_par_clip,
      budgetTotal: l.budget_total,
      plateformesEligibles: l.plateformes_eligibles,
      audienceExigee: l.audience_exigee,
      langue: l.langue,
      hashtagObligatoire: l.hashtag_obligatoire,
      delaiSoumissionMin: l.delai_soumission_min,
      dateLimite: l.date_limite,
      statut: l.statut,
      verifieLe: l.verifie_le,
      reglesCles: l.regles_cles,
      vuesMinimum: vuesMinimum(l.paiement_min, l.cpm),
      nbClips: sesClips.length,
      vuesComptees: sesClips.reduce((s, c) => s + (c.vuesFinales ?? 0), 0),
      // null = campagne non estimee (Pool, Par post, Forfait)
      gainNetEstime: l.type === 'CPM' ? estimations.reduce((s, v) => s + v, 0) : null,
      paiementsRecusNetUsd: paiements
        .filter((p) => p.campagneId === l.id)
        .reduce((s, p) => s + p.montantNetUsd, 0),
      verificationPerimee: verificationPerimee(l.verifie_le, aujourdhui),
      joursDepuisVerification: joursDepuis(l.verifie_le, aujourdhui),
    };
  });
}

/* ------------------------------------------------------------------ */
/* Comptes                                                             */
/* ------------------------------------------------------------------ */

export function listerComptes(db: BaseDonnees, reglages: Reglages): CompteCalcule[] {
  const lignes = db.prepare('SELECT * FROM comptes ORDER BY identifiant').all() as Array<
    Record<string, any>
  >;
  const clips = listerClips(db, reglages);

  const dernierReleve = db.prepare(
    'SELECT date, abonnes FROM abonnes_historique WHERE compte_id = ? ORDER BY date DESC, id DESC LIMIT 1',
  );

  return lignes.map((l) => {
    const sesClips = clips.filter((c) => c.compteId === l.id);
    const releve = dernierReleve.get(l.id) as { date: string; abonnes: number } | undefined;

    return {
      id: l.id,
      identifiant: l.identifiant,
      nomAffiche: l.nom_affiche,
      plateforme: l.plateforme,
      niche: l.niche,
      langue: l.langue,
      configurationPays: l.configuration_pays,
      dateCreation: l.date_creation,
      relieContentRewards: l.relie_content_rewards === 1,
      audiencePrincipale: l.audience_principale,
      notes: l.notes,
      abonnes: releve ? releve.abonnes : null,
      abonnesMajLe: releve ? releve.date : null,
      nbClips: sesClips.length,
      vuesComptees: sesClips.reduce((s, c) => s + (c.vuesFinales ?? 0), 0),
      gainNetEstime: sesClips.reduce((s, c) => s + (c.gainNetEstime ?? 0), 0),
    };
  });
}

/* ------------------------------------------------------------------ */
/* Taches                                                              */
/* ------------------------------------------------------------------ */

export function listerTaches(db: BaseDonnees): Tache[] {
  const lignes = db
    .prepare('SELECT * FROM taches ORDER BY ordre, numero, id')
    .all() as Array<Record<string, any>>;
  return lignes.map((l) => ({
    id: l.id,
    numero: l.numero,
    phase: l.phase,
    tache: l.tache,
    detail: l.detail,
    echeance: l.echeance,
    statut: l.statut,
    notes: l.notes,
    ordre: l.ordre,
  }));
}

/* ------------------------------------------------------------------ */
/* Tableau de bord                                                     */
/* ------------------------------------------------------------------ */

export function calculerTableauDeBord(db: BaseDonnees, reglages: Reglages): TableauDeBord {
  const clips = listerClips(db, reglages);
  const paiements = listerPaiements(db, reglages);

  const approuvesOuPayes = clips.filter((c) => c.statut === 'Approuvé' || c.statut === 'Payé');
  const enAttente = clips.filter((c) => c.statut === 'En attente');
  const refuses = clips.filter((c) => c.statut === 'Refusé');

  const somme = (liste: ClipCalcule[]): number =>
    liste.reduce((s, c) => s + (c.gainNetEstime ?? 0), 0);

  const gainNetApprouve = somme(approuvesOuPayes);
  const recusUsd = paiements.reduce((s, p) => s + p.montantNetUsd, 0);
  const recusEur = paiements.reduce((s, p) => s + p.montantNetEur, 0);

  const maintenant = new Date();
  const moisCourant = `${maintenant.getFullYear()}-${String(maintenant.getMonth() + 1).padStart(2, '0')}`;
  const recuMoisCourantEur = paiements
    .filter((p) => moisDe(p.dateReception) === moisCourant)
    .reduce((s, p) => s + p.montantNetEur, 0);

  return {
    reglages,
    clipsPublies: clips.length,
    clipsApprouvesOuPayes: approuvesOuPayes.length,
    clipsEnAttente: enAttente.length,
    clipsRefuses: refuses.length,
    tauxApprobation: tauxApprobation(approuvesOuPayes.length, refuses.length),
    vuesComptees: clips.reduce((s, c) => s + (c.vuesFinales ?? 0), 0),
    delaiMoyenSoumissionMin: delaiMoyenSoumissionMin(clips.map((c) => c.delaiSoumissionMin)),
    clipsHorsDelai: clips.filter((c) => c.horsDelai).length,
    gainNetEstimeApprouveUsd: gainNetApprouve,
    gainNetPotentielEnAttenteUsd: somme(enAttente),
    paiementsRecusNetUsd: recusUsd,
    paiementsRecusNetEur: recusEur,
    resteARecevoirUsd: resteARecevoirUsd(gainNetApprouve, recusUsd),
    objectifMensuelEur: reglages.objectifMensuelEur,
    recuMoisCourantEur,
    partObjectifMoisCourant: partObjectif(recuMoisCourantEur, reglages.objectifMensuelEur),
    moisCourant,
    suiviMensuel: construireSuiviMensuel(clips, paiements, reglages, moisCourant),
    clipsNonEstimes: clips.filter((c) => c.gainNetEstime === null).length,
  };
}

function construireSuiviMensuel(
  clips: ClipCalcule[],
  paiements: PaiementCalcule[],
  reglages: Reglages,
  moisCourant: string,
): LigneMensuelle[] {
  const mois = new Set<string>([moisCourant]);
  for (const c of clips) {
    const m = moisDe(c.datePublication);
    if (m) mois.add(m);
  }
  for (const p of paiements) {
    const m = moisDe(p.dateReception);
    if (m) mois.add(m);
  }

  return [...mois]
    .sort()
    .map((m) => {
      const clipsDuMois = clips.filter((c) => moisDe(c.datePublication) === m);
      const paiementsDuMois = paiements.filter((p) => moisDe(p.dateReception) === m);
      const recuNetEur = paiementsDuMois.reduce((s, p) => s + p.montantNetEur, 0);

      return {
        mois: m,
        clipsPublies: clipsDuMois.length,
        vuesComptees: clipsDuMois.reduce((s, c) => s + (c.vuesFinales ?? 0), 0),
        gainNetEstimeApprouveUsd: clipsDuMois
          .filter((c) => c.statut === 'Approuvé' || c.statut === 'Payé')
          .reduce((s, c) => s + (c.gainNetEstime ?? 0), 0),
        recuNetEur,
        partObjectif:
          reglages.objectifMensuelEur > 0 ? recuNetEur / reglages.objectifMensuelEur : null,
      };
    });
}
