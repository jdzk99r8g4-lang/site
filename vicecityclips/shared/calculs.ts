// Regles de calcul de ViceCityClips.
//
// Ce fichier est la seule source de verite pour les calculs. Le serveur s'en sert
// pour enrichir les donnees envoyees a l'interface et aux exports ; les tests
// (tests/calculs.test.ts) verifient chaque regle. Ne recopiez pas ces formules
// ailleurs : importez-les.

import type { CampagneCalcul, Reglages, StatutClip } from './types';

/* ------------------------------------------------------------------ */
/* Petits utilitaires                                                  */
/* ------------------------------------------------------------------ */

/** Convertit en nombre fini, sinon renvoie 0. Les cases vides valent 0. */
export function nombreOuZero(valeur: unknown): number {
  const n = typeof valeur === 'number' ? valeur : Number(valeur);
  return Number.isFinite(n) ? n : 0;
}

/** Convertit en nombre fini, sinon renvoie null (case vide = non renseigne). */
export function nombreOuNull(valeur: unknown): number | null {
  if (valeur === null || valeur === undefined || valeur === '') return null;
  const n = typeof valeur === 'number' ? valeur : Number(valeur);
  return Number.isFinite(n) ? n : null;
}

/** Arrondi d'affichage a deux decimales (les calculs restent en pleine precision). */
export function arrondi2(valeur: number): number {
  return Math.round((valeur + Number.EPSILON) * 100) / 100;
}

/* ------------------------------------------------------------------ */
/* Delai de soumission                                                 */
/* ------------------------------------------------------------------ */

/**
 * Minutes ecoulees depuis minuit pour une heure « HH:MM » ou « HH:MM:SS ».
 * Renvoie null si l'heure est absente ou illisible.
 */
export function minutesDepuisMinuit(heure: string | null | undefined): number | null {
  if (typeof heure !== 'string') return null;
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(heure.trim());
  if (!m) return null;
  const heures = Number(m[1]);
  const minutes = Number(m[2]);
  if (heures > 23 || minutes > 59) return null;
  return heures * 60 + minutes;
}

/**
 * Delai de soumission en minutes = heure de soumission - heure de publication.
 * Le passage de minuit est gere : 23:50 -> 00:10 donne 20 minutes.
 * Renvoie null si l'une des deux heures manque.
 */
export function delaiSoumissionMin(
  heurePublication: string | null | undefined,
  heureSoumission: string | null | undefined,
): number | null {
  const publication = minutesDepuisMinuit(heurePublication);
  const soumission = minutesDepuisMinuit(heureSoumission);
  if (publication === null || soumission === null) return null;
  let delai = soumission - publication;
  if (delai < 0) delai += 24 * 60; // la soumission a eu lieu apres minuit
  return delai;
}

/* ------------------------------------------------------------------ */
/* Gain d'un clip                                                      */
/* ------------------------------------------------------------------ */

/**
 * Gain brut estime d'un clip, en dollars.
 *
 * - Seules les campagnes de type CPM sont estimees. Pour Pool, Par post et
 *   Forfait, la fonction renvoie null : l'interface affiche « non estime ».
 * - Un clip refuse rapporte 0.
 * - v = vues finales / 1000 x CPM ; si v est strictement inferieur au paiement
 *   minimum, le gain est 0 ; sinon v, limite au plafond par clip s'il existe.
 *
 * Un plafond absent, nul ou negatif est traite comme « pas de plafond »
 * (le fichier Excel laisse la case vide quand la campagne n'en annonce pas).
 */
export function gainBrutEstime(
  campagne: CampagneCalcul | null | undefined,
  vuesFinales: number | null | undefined,
  statut: StatutClip | string | null | undefined,
): number | null {
  if (!campagne || campagne.type !== 'CPM') return null;
  if (statut === 'Refusé') return 0;

  const cpm = nombreOuZero(campagne.cpm);
  const vues = nombreOuZero(vuesFinales);
  const brut = (vues / 1000) * cpm;

  const paiementMin = nombreOuZero(campagne.paiementMin);
  if (brut < paiementMin) return 0;

  const plafond = nombreOuNull(campagne.plafondParClip);
  if (plafond !== null && plafond > 0) return Math.min(brut, plafond);
  return brut;
}

/** Frais preleves sur le gain brut d'un clip. null si le gain n'est pas estime. */
export function fraisClip(gainBrut: number | null, reglages: Reglages): number | null {
  if (gainBrut === null) return null;
  return gainBrut * reglages.fraisCpm;
}

/** Gain net estime = gain brut - frais. null si le gain n'est pas estime. */
export function gainNetEstime(gainBrut: number | null, reglages: Reglages): number | null {
  if (gainBrut === null) return null;
  return gainBrut - gainBrut * reglages.fraisCpm;
}

/* ------------------------------------------------------------------ */
/* Campagne                                                            */
/* ------------------------------------------------------------------ */

/**
 * Vues minimum a atteindre pour declencher le paiement minimum :
 * paiement minimum / CPM x 1000. null si la campagne n'a pas de CPM.
 */
export function vuesMinimum(
  paiementMin: number | null | undefined,
  cpm: number | null | undefined,
): number | null {
  const min = nombreOuNull(paiementMin);
  const parMille = nombreOuNull(cpm);
  if (min === null || parMille === null || parMille <= 0) return null;
  return (min / parMille) * 1000;
}

/** Nombre de jours entiers entre une date « AAAA-MM-JJ » et aujourd'hui. */
export function joursDepuis(date: string | null | undefined, aujourdhui = new Date()): number | null {
  if (!date) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date.trim());
  if (!m) return null;
  const reference = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const jour = Date.UTC(aujourdhui.getFullYear(), aujourdhui.getMonth(), aujourdhui.getDate());
  return Math.floor((jour - reference) / 86_400_000);
}

/** Seuil d'alerte sur la fraicheur du champ « Verifie le » d'une campagne. */
export const JOURS_AVANT_ALERTE_VERIFICATION = 7;

/**
 * Vrai si les conditions de la campagne n'ont pas ete revues depuis plus de
 * 7 jours (ou n'ont jamais ete verifiees).
 */
export function verificationPerimee(verifieLe: string | null | undefined, aujourdhui = new Date()): boolean {
  const jours = joursDepuis(verifieLe, aujourdhui);
  if (jours === null) return true;
  return jours > JOURS_AVANT_ALERTE_VERIFICATION;
}

/* ------------------------------------------------------------------ */
/* Paiements                                                           */
/* ------------------------------------------------------------------ */

/** Montant net d'un paiement en dollars = brut - frais de retrait. */
export function paiementNetUsd(
  montantBrut: number | null | undefined,
  fraisRetrait: number | null | undefined,
): number {
  return nombreOuZero(montantBrut) - nombreOuZero(fraisRetrait);
}

/**
 * Taux de change applique a un paiement : celui saisi sur la ligne, sinon le
 * taux par defaut des reglages. Un taux saisi a 0 est respecte.
 */
export function tauxApplique(tauxPaiement: number | null | undefined, reglages: Reglages): number {
  const taux = nombreOuNull(tauxPaiement);
  return taux === null ? reglages.tauxEurParUsd : taux;
}

/** Montant net d'un paiement en euros = net $ x taux applique. */
export function paiementNetEur(
  montantNetUsd: number,
  tauxPaiement: number | null | undefined,
  reglages: Reglages,
): number {
  return montantNetUsd * tauxApplique(tauxPaiement, reglages);
}

/* ------------------------------------------------------------------ */
/* Indicateurs du tableau de bord                                      */
/* ------------------------------------------------------------------ */

/**
 * Taux d'approbation = (approuves + payes) / (approuves + payes + refuses).
 * null quand il n'y a encore aucun clip tranche (pas de division par zero).
 */
export function tauxApprobation(
  approuvesOuPayes: number,
  refuses: number,
): number | null {
  const total = approuvesOuPayes + refuses;
  if (total <= 0) return null;
  return approuvesOuPayes / total;
}

/**
 * Reste a recevoir = max(0, gain net estime des clips approuves ou payes
 * - paiements recus nets en dollars).
 */
export function resteARecevoirUsd(
  gainNetEstimeApprouveUsd: number,
  paiementsRecusNetUsd: number,
): number {
  return Math.max(0, gainNetEstimeApprouveUsd - paiementsRecusNetUsd);
}

/** Moyenne des delais de soumission connus, en minutes. null si aucun. */
export function delaiMoyenSoumissionMin(delais: Array<number | null>): number | null {
  const connus = delais.filter((d): d is number => d !== null && Number.isFinite(d));
  if (connus.length === 0) return null;
  return connus.reduce((somme, d) => somme + d, 0) / connus.length;
}

/** Part d'un objectif atteinte, bornee a l'intervalle [0, 1] pour la jauge. */
export function partObjectif(recu: number, objectif: number): number {
  if (!Number.isFinite(objectif) || objectif <= 0) return 0;
  return Math.max(0, Math.min(1, recu / objectif));
}

/** Mois « AAAA-MM » d'une date « AAAA-MM-JJ ». null si la date est absente. */
export function moisDe(date: string | null | undefined): string | null {
  if (typeof date !== 'string') return null;
  const m = /^(\d{4})-(\d{2})/.exec(date.trim());
  return m ? `${m[1]}-${m[2]}` : null;
}
