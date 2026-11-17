// Export de toutes les donnees : un classeur Excel (.xlsx) ou une archive de
// fichiers CSV. Les colonnes reprennent celles du fichier de suivi, valeurs
// calculees comprises.

import ExcelJS from 'exceljs';
import AdmZip from 'adm-zip';
import type { BaseDonnees } from './db';
import { lireReglages } from './db';
import {
  calculerTableauDeBord,
  listerCampagnes,
  listerClips,
  listerComptes,
  listerPaiements,
  listerTaches,
} from './enrichir';
import { arrondi2 } from '../shared/calculs';

/** Valeur affichee quand une campagne n'est pas estimable (Pool, Par post, Forfait). */
const NON_ESTIME = 'non estime';

type Valeur = string | number | null;

interface TableExport {
  nom: string;
  enTetes: string[];
  lignes: Valeur[][];
}

function ouiNon(valeur: boolean): string {
  return valeur ? 'Oui' : 'Non';
}

function montant(valeur: number | null): Valeur {
  return valeur === null ? NON_ESTIME : arrondi2(valeur);
}

/** Construit toutes les tables a exporter. */
export function construireTables(db: BaseDonnees): TableExport[] {
  const reglages = lireReglages(db);
  const tableau = calculerTableauDeBord(db, reglages);
  const clips = listerClips(db, reglages);
  const campagnes = listerCampagnes(db, reglages);
  const comptes = listerComptes(db, reglages);
  const paiements = listerPaiements(db, reglages);
  const taches = listerTaches(db);

  const tableauDeBord: TableExport = {
    nom: 'Tableau de bord',
    enTetes: ['Indicateur', 'Valeur'],
    lignes: [
      ['Frais Content Rewards sur les campagnes CPM', reglages.fraisCpm],
      ['Taux de change par defaut (EUR pour 1 $)', reglages.tauxEurParUsd],
      ['Objectif mensuel (EUR recus)', reglages.objectifMensuelEur],
      ['Clips publies', tableau.clipsPublies],
      ['Clips approuves ou payes', tableau.clipsApprouvesOuPayes],
      ['Clips en attente', tableau.clipsEnAttente],
      ['Clips refuses', tableau.clipsRefuses],
      [
        "Taux d'approbation",
        tableau.tauxApprobation === null ? '' : arrondi2(tableau.tauxApprobation * 100),
      ],
      ['Vues comptees (total)', tableau.vuesComptees],
      [
        'Delai moyen de soumission (min)',
        tableau.delaiMoyenSoumissionMin === null ? '' : arrondi2(tableau.delaiMoyenSoumissionMin),
      ],
      ['Clips soumis apres 30 min', tableau.clipsHorsDelai],
      ['Gain net estime - clips approuves ou payes ($)', arrondi2(tableau.gainNetEstimeApprouveUsd)],
      ['Gain net potentiel - clips en attente ($)', arrondi2(tableau.gainNetPotentielEnAttenteUsd)],
      ['Paiements recus nets ($)', arrondi2(tableau.paiementsRecusNetUsd)],
      ['Paiements recus nets (EUR)', arrondi2(tableau.paiementsRecusNetEur)],
      ['Reste a recevoir estime ($)', arrondi2(tableau.resteARecevoirUsd)],
      ['Clips non estimes (campagnes Pool, Par post, Forfait)', tableau.clipsNonEstimes],
    ],
  };

  const suiviMensuel: TableExport = {
    nom: 'Suivi mensuel',
    enTetes: [
      'Mois',
      'Clips publies',
      'Vues comptees',
      'Gain net estime approuve ($)',
      'Recu net (EUR)',
      "% de l'objectif",
    ],
    lignes: tableau.suiviMensuel.map((l) => [
      l.mois,
      l.clipsPublies,
      l.vuesComptees,
      arrondi2(l.gainNetEstimeApprouveUsd),
      arrondi2(l.recuNetEur),
      l.partObjectif === null ? '' : arrondi2(l.partObjectif * 100),
    ]),
  };

  const tableClips: TableExport = {
    nom: 'Clips',
    enTetes: [
      'Date de publication',
      'Heure de publication',
      'Heure de soumission',
      'Delai de soumission (min)',
      'Hors delai (> 30 min)',
      'Compte',
      'Plateforme',
      'ID campagne',
      'Campagne',
      'Type',
      'CPM ($/1 000 vues)',
      'Paiement min ($)',
      'Plafond par clip ($)',
      'Createur / streamer',
      'Lien de la publication',
      'Lien de la source',
      'Vues a J+3',
      'Vues finales comptees',
      'Statut',
      'Motif de refus',
      'Gain brut estime ($)',
      'Frais ($)',
      'Gain net estime ($)',
      'Pieces jointes',
      'Notes',
    ],
    lignes: clips.map((c) => [
      c.datePublication,
      c.heurePublication,
      c.heureSoumission,
      c.delaiSoumissionMin,
      c.delaiSoumissionMin === null ? '' : ouiNon(c.horsDelai),
      c.compteIdentifiant,
      c.plateforme,
      c.campagneId,
      c.campagneNom,
      c.campagneType,
      c.cpm,
      c.paiementMin,
      c.plafondParClip,
      c.createur,
      c.lienPublication,
      c.lienSource,
      c.vuesJ3,
      c.vuesFinales,
      c.statut,
      c.motifRefus,
      montant(c.gainBrutEstime),
      montant(c.frais),
      montant(c.gainNetEstime),
      c.piecesJointes.map((p) => p.nomOriginal).join(', ') || null,
      c.notes,
    ]),
  };

  const tableCampagnes: TableExport = {
    nom: 'Campagnes',
    enTetes: [
      'ID campagne (court, unique)',
      'Nom de la campagne',
      'Organisateur',
      'Plateforme de campagne',
      'Lien de la campagne',
      'Type',
      'CPM ($/1 000 vues)',
      'Paiement min ($)',
      'Plafond par clip ($)',
      'Vues minimum (calcule)',
      'Budget total ($)',
      'Plateformes eligibles',
      'Audience exigee',
      'Langue',
      'Hashtag / mention obligatoire',
      'Delai de soumission (min)',
      'Date limite',
      'Statut',
      'Verifie le',
      'Verification a refaire',
      'Regles cles / notes',
      'Nb de clips',
      'Vues comptees',
      'Gain net estime ($)',
      'Paiements recus nets ($)',
    ],
    lignes: campagnes.map((c) => [
      c.id,
      c.nom,
      c.organisateur,
      c.plateformeCampagne,
      c.lien,
      c.type,
      c.cpm,
      c.paiementMin,
      c.plafondParClip,
      c.vuesMinimum === null ? '' : Math.round(c.vuesMinimum),
      c.budgetTotal,
      c.plateformesEligibles,
      c.audienceExigee,
      c.langue,
      c.hashtagObligatoire,
      c.delaiSoumissionMin,
      c.dateLimite,
      c.statut,
      c.verifieLe,
      ouiNon(c.verificationPerimee),
      c.reglesCles,
      c.nbClips,
      c.vuesComptees,
      montant(c.gainNetEstime),
      arrondi2(c.paiementsRecusNetUsd),
    ]),
  };

  const tableComptes: TableExport = {
    nom: 'Comptes',
    enTetes: [
      'Identifiant (@...)',
      'Nom affiche',
      'Plateforme',
      'Niche',
      'Langue',
      'Configuration pays',
      'Date de creation',
      'Abonnes',
      'Abonnes mis a jour le',
      'Relie a Content Rewards',
      'Audience principale (pays, %)',
      'Notes',
      'Nb de clips',
      'Vues comptees',
      'Gain net estime ($)',
    ],
    lignes: comptes.map((c) => [
      c.identifiant,
      c.nomAffiche,
      c.plateforme,
      c.niche,
      c.langue,
      c.configurationPays,
      c.dateCreation,
      c.abonnes,
      c.abonnesMajLe,
      ouiNon(c.relieContentRewards),
      c.audiencePrincipale,
      c.notes,
      c.nbClips,
      c.vuesComptees,
      arrondi2(c.gainNetEstime ?? 0),
    ]),
  };

  const historiqueAbonnes: TableExport = {
    nom: 'Historique abonnes',
    enTetes: ['Compte', 'Date', 'Abonnes'],
    lignes: (
      db
        .prepare(
          `SELECT c.identifiant AS identifiant, h.date AS date, h.abonnes AS abonnes
           FROM abonnes_historique h JOIN comptes c ON c.id = h.compte_id
           ORDER BY c.identifiant, h.date`,
        )
        .all() as Array<{ identifiant: string; date: string; abonnes: number }>
    ).map((l) => [l.identifiant, l.date, l.abonnes]),
  };

  const tablePaiements: TableExport = {
    nom: 'Paiements',
    enTetes: [
      'Date de reception',
      'Source',
      'ID campagne',
      'Campagne',
      'Montant brut ($)',
      'Frais de retrait ($)',
      'Montant net ($)',
      'Taux EUR pour 1 $',
      'Taux par defaut utilise',
      'Montant net (EUR)',
      'Moyen',
      'Reference de la transaction',
      'Justificatifs',
      'Declare aux impots',
      'Notes',
    ],
    lignes: paiements.map((p) => [
      p.dateReception,
      p.source,
      p.campagneId,
      p.campagneNom,
      arrondi2(p.montantBrutUsd),
      arrondi2(p.fraisRetraitUsd),
      arrondi2(p.montantNetUsd),
      p.tauxApplique,
      ouiNon(p.tauxParDefautUtilise),
      arrondi2(p.montantNetEur),
      p.moyen,
      p.reference,
      p.piecesJointes.map((j) => j.nomOriginal).join(', ') || null,
      ouiNon(p.declareImpots),
      p.notes,
    ]),
  };

  const tableTaches: TableExport = {
    nom: 'Checklist de lancement',
    enTetes: ['#', 'Phase', 'Tache', 'Comment / detail', 'Echeance', 'Statut', 'Notes'],
    lignes: taches.map((t) => [t.numero, t.phase, t.tache, t.detail, t.echeance, t.statut, t.notes]),
  };

  return [
    tableauDeBord,
    suiviMensuel,
    tableClips,
    tableCampagnes,
    tableComptes,
    historiqueAbonnes,
    tablePaiements,
    tableTaches,
  ];
}

/* ------------------------------------------------------------------ */
/* Excel                                                               */
/* ------------------------------------------------------------------ */

export async function exporterExcel(db: BaseDonnees): Promise<Buffer> {
  const classeur = new ExcelJS.Workbook();
  classeur.creator = 'ViceCityClips';
  classeur.created = new Date();

  for (const table of construireTables(db)) {
    const feuille = classeur.addWorksheet(table.nom);
    feuille.addRow(table.enTetes);
    feuille.getRow(1).font = { bold: true };
    feuille.getRow(1).alignment = { vertical: 'middle', wrapText: true };
    for (const ligne of table.lignes) {
      feuille.addRow(ligne.map((v) => (v === null ? '' : v)));
    }
    feuille.columns?.forEach((colonne, index) => {
      const enTete = table.enTetes[index] ?? '';
      colonne.width = Math.min(44, Math.max(14, enTete.length + 4));
    });
    feuille.views = [{ state: 'frozen', ySplit: 1 }];
  }

  const donnees = await classeur.xlsx.writeBuffer();
  return Buffer.from(donnees);
}

/* ------------------------------------------------------------------ */
/* CSV                                                                 */
/* ------------------------------------------------------------------ */

/**
 * Les CSV sont ecrits pour Excel en francais : separateur point-virgule,
 * virgule decimale et marque d'encodage UTF-8, pour que le double-clic ouvre
 * un tableau correct sans reglage.
 */
function celluleCsv(valeur: Valeur): string {
  if (valeur === null) return '';
  if (typeof valeur === 'number') return String(valeur).replace('.', ',');
  const texte = String(valeur);
  if (/[";\n\r]/.test(texte)) return `"${texte.replace(/"/g, '""')}"`;
  return texte;
}

function versCsv(table: TableExport): string {
  const lignes = [table.enTetes.map(celluleCsv).join(';')];
  for (const ligne of table.lignes) {
    lignes.push(ligne.map(celluleCsv).join(';'));
  }
  return '﻿' + lignes.join('\r\n') + '\r\n';
}

function nomFichier(nom: string): string {
  return nom
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

/** Toutes les tables en CSV, rassemblees dans une archive ZIP. */
export function exporterCsv(db: BaseDonnees): Buffer {
  const zip = new AdmZip();
  for (const table of construireTables(db)) {
    zip.addFile(`${nomFichier(table.nom)}.csv`, Buffer.from(versCsv(table), 'utf8'));
  }
  return zip.toBuffer();
}
