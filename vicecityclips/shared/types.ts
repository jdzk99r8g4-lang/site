// Types partages entre le serveur, l'interface et les tests.
// Les libelles sont ceux du fichier Excel « ViceCityClips - Tableau de pilotage.xlsx ».

export const TYPES_CAMPAGNE = ['CPM', 'Pool', 'Par post', 'Forfait'] as const;
export type TypeCampagne = (typeof TYPES_CAMPAGNE)[number];

export const STATUTS_CLIP = ['En attente', 'Approuvé', 'Refusé', 'Payé'] as const;
export type StatutClip = (typeof STATUTS_CLIP)[number];

export const STATUTS_TACHE = ['À faire', 'En cours', 'Fait'] as const;
export type StatutTache = (typeof STATUTS_TACHE)[number];

export const STATUTS_CAMPAGNE = ['Active', 'Candidature envoyée', 'En pause', 'Terminée'] as const;
export type StatutCampagne = (typeof STATUTS_CAMPAGNE)[number];

export const PLATEFORMES = ['TikTok', 'Instagram', 'YouTube'] as const;
export type Plateforme = (typeof PLATEFORMES)[number];

export const MOYENS_PAIEMENT = ['Virement', 'Crypto', 'PayPal', 'Autre'] as const;
export type MoyenPaiement = (typeof MOYENS_PAIEMENT)[number];

/** Les trois parametres de l'ecran Reglages. */
export interface Reglages {
  /** Frais Content Rewards sur les campagnes CPM, en fraction (0.1 = 10 %). */
  fraisCpm: number;
  /** Taux de change par defaut : euros pour 1 dollar. */
  tauxEurParUsd: number;
  /** Objectif mensuel, en euros recus. */
  objectifMensuelEur: number;
}

export const REGLAGES_PAR_DEFAUT: Reglages = {
  fraisCpm: 0.1,
  tauxEurParUsd: 0.86,
  objectifMensuelEur: 1000,
};

/** Delai de soumission de reference, en minutes (regle des campagnes suivies). */
export const DELAI_SOUMISSION_REFERENCE_MIN = 30;

/** Champs d'une campagne necessaires au calcul du gain d'un clip. */
export interface CampagneCalcul {
  type: TypeCampagne | string | null;
  cpm: number | null;
  paiementMin: number | null;
  plafondParClip: number | null;
}

export interface Campagne extends CampagneCalcul {
  id: string;
  nom: string;
  organisateur: string | null;
  plateformeCampagne: string | null;
  lien: string | null;
  type: TypeCampagne | string;
  budgetTotal: number | null;
  plateformesEligibles: string | null;
  audienceExigee: string | null;
  langue: string | null;
  hashtagObligatoire: string | null;
  delaiSoumissionMin: number | null;
  dateLimite: string | null;
  statut: string | null;
  verifieLe: string | null;
  reglesCles: string | null;
}

/** Campagne enrichie des valeurs calculees par le serveur. */
export interface CampagneCalculee extends Campagne {
  vuesMinimum: number | null;
  nbClips: number;
  vuesComptees: number;
  gainNetEstime: number | null;
  paiementsRecusNetUsd: number;
  verificationPerimee: boolean;
  joursDepuisVerification: number | null;
}

export interface Compte {
  id: number;
  identifiant: string;
  nomAffiche: string | null;
  plateforme: string | null;
  niche: string | null;
  langue: string | null;
  configurationPays: string | null;
  dateCreation: string | null;
  relieContentRewards: boolean;
  audiencePrincipale: string | null;
  notes: string | null;
}

export interface CompteCalcule extends Compte {
  abonnes: number | null;
  abonnesMajLe: string | null;
  nbClips: number;
  vuesComptees: number;
  gainNetEstime: number | null;
}

export interface ReleveAbonnes {
  id: number;
  compteId: number;
  date: string;
  abonnes: number;
}

export interface PieceJointe {
  id: number;
  typeParent: 'clip' | 'paiement';
  parentId: number;
  nomFichier: string;
  nomOriginal: string;
  typeMime: string | null;
  taille: number | null;
  ajouteLe: string;
  url: string;
}

export interface Clip {
  id: number;
  datePublication: string | null;
  heurePublication: string | null;
  heureSoumission: string | null;
  compteId: number | null;
  plateforme: string | null;
  campagneId: string | null;
  createur: string | null;
  lienPublication: string | null;
  lienSource: string | null;
  vuesJ3: number | null;
  vuesFinales: number | null;
  statut: StatutClip | string;
  motifRefus: string | null;
  notes: string | null;
}

export interface ClipCalcule extends Clip {
  compteIdentifiant: string | null;
  campagneNom: string | null;
  campagneType: string | null;
  cpm: number | null;
  paiementMin: number | null;
  plafondParClip: number | null;
  delaiSoumissionMin: number | null;
  horsDelai: boolean;
  /** null = non estime (campagne Pool, Par post ou Forfait). */
  gainBrutEstime: number | null;
  frais: number | null;
  gainNetEstime: number | null;
  piecesJointes: PieceJointe[];
}

export interface Paiement {
  id: number;
  dateReception: string | null;
  source: string | null;
  campagneId: string | null;
  montantBrutUsd: number;
  fraisRetraitUsd: number;
  /** null ou vide = taux par defaut des reglages. */
  tauxEurParUsd: number | null;
  moyen: string | null;
  reference: string | null;
  declareImpots: boolean;
  notes: string | null;
}

export interface PaiementCalcule extends Paiement {
  campagneNom: string | null;
  montantNetUsd: number;
  tauxApplique: number;
  tauxParDefautUtilise: boolean;
  montantNetEur: number;
  piecesJointes: PieceJointe[];
}

export interface Tache {
  id: number;
  numero: number | null;
  phase: string | null;
  tache: string;
  detail: string | null;
  echeance: string | null;
  statut: StatutTache | string;
  notes: string | null;
  ordre: number;
}

export interface LigneMensuelle {
  mois: string;
  clipsPublies: number;
  vuesComptees: number;
  gainNetEstimeApprouveUsd: number;
  recuNetEur: number;
  partObjectif: number | null;
}

export interface TableauDeBord {
  reglages: Reglages;
  clipsPublies: number;
  clipsApprouvesOuPayes: number;
  clipsEnAttente: number;
  clipsRefuses: number;
  tauxApprobation: number | null;
  vuesComptees: number;
  delaiMoyenSoumissionMin: number | null;
  clipsHorsDelai: number;
  gainNetEstimeApprouveUsd: number;
  gainNetPotentielEnAttenteUsd: number;
  paiementsRecusNetUsd: number;
  paiementsRecusNetEur: number;
  resteARecevoirUsd: number;
  objectifMensuelEur: number;
  recuMoisCourantEur: number;
  partObjectifMoisCourant: number;
  moisCourant: string;
  suiviMensuel: LigneMensuelle[];
  clipsNonEstimes: number;
}
