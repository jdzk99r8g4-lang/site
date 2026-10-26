/**
 * Données d'approvisionnement — SERVEUR UNIQUEMENT.
 *
 * Contient les prix d'achat et les références grossiste. Ces informations
 * ne doivent jamais arriver dans le bundle navigateur : un concurrent qui lit
 * vos coûts d'achat connaît votre marge et votre fournisseur.
 *
 * Trois protections se cumulent :
 *   1. la garde d'exécution ci-dessous (échec immédiat et bruyant) ;
 *   2. `tests/leakage.test.ts`, qui refuse tout import depuis un composant client ;
 *   3. la revue de code — ce fichier ne s'importe que depuis `src/app/api/**`
 *      ou un module lui-même serveur.
 */

if (typeof window !== 'undefined') {
  throw new Error(
    'sourcing.ts a été importé côté client : les prix d’achat fuiraient dans le bundle. ' +
      'Déplacez cet import vers une route API ou un composant serveur.',
  );
}

import { euros, type Cents } from './money';
import { products, getProductById } from './catalog';

export interface SourcingLine {
  /** Référence du produit chez le grossiste : ce qu'on écrit sur le bon de commande. */
  supplierSku: string;
  /** Prix d'achat unitaire HT, port exclu. */
  costNet: Cents;
  /** Délai de préparation annoncé par le fournisseur, en jours ouvrés. */
  leadTimeDays: number;
  /** Coût du transport amont payé au fournisseur, par unité. */
  inboundShipping: Cents;
}

/**
 * ATTENTION — ces coûts sont des HYPOTHÈSES DE TRAVAIL, pas des tarifs
 * négociés. Ils donnent un ordre de grandeur plausible pour un grossiste
 * européen de poêles à granulés (marge brute visée : 28 à 35 % sur les
 * appareils, 45 à 55 % sur les accessoires), mais ils doivent être remplacés
 * par vos vrais tarifs avant toute décision : toute la rentabilité du site
 * dépend de ces nombres, et une erreur de 100 € sur un coût d'achat suffit à
 * transformer une commande rentable en commande à perte.
 *
 * Le transport amont est séparé du coût marchandise : sur un appareil de
 * 200 kg il représente 40 à 90 € et il est trop lourd pour être noyé dans un
 * prix d'achat moyen.
 */
export const sourcing: Record<string, SourcingLine> = {
  // PROVISOIRE — ETNA Luxe Anna 12EC. Ni la référence grossiste, ni le prix
  // d'achat, ni le transport amont ne sont négociés : ces trois nombres
  // doivent venir de votre tarif ETNA avant la première vente.
  'anna-12': { supplierSku: 'ETNA-ANNA-12EC', costNet: euros(1450), leadTimeDays: 3, inboundShipping: euros(62) },
  // PROVISOIRE — ETNA Vertigo Up. Même réserve que pour l'Anna : référence
  // grossiste, prix d'achat et transport amont restent à négocier.
  'vertigo-up': { supplierSku: 'ETNA-VERTIGO-UP', costNet: euros(1520), leadTimeDays: 3, inboundShipping: euros(64) },
  // PROVISOIRE — ETNA Vulcano Silenzio Up.
  'vulcano-silenzio-up': { supplierSku: 'ETNA-VULCANO-SIL-UP', costNet: euros(1460), leadTimeDays: 3, inboundShipping: euros(62) },

  // ─────────────────── FOYERS DÉCORATIFS — COÛTS CALCULÉS ───────────────────
  //
  // AUCUN de ces douze coûts n'est négocié. Ils sont CALCULÉS À L'ENVERS,
  // depuis le prix de vente, pour que le coût de revient complet (marchandise
  // + transport amont) laisse 45 % de marge brute sur le prix hors taxe —
  // l'ordre de grandeur usuel sur un objet décoratif importé, et la raison
  // pour laquelle ce rayon existe à côté des appareils.
  //
  // Les conséquences, à lire avant de s'appuyer sur un chiffre d'ici :
  //   — `npm run economics` renverra 45 % sur chacune des douze fiches. C'est
  //     une tautologie, pas un résultat : la marge a été posée, pas mesurée.
  //   — les `supplierSku` sont des codes de notre invention. Aucun grossiste
  //     ne les reconnaîtra sur un bon de commande.
  //   — un seul vrai tarif fournisseur remplace tout ce bloc, et c'est la
  //     première chose à faire avant de vendre un de ces articles.
  //
  // Le transport amont est estimé au poids et au volume. Il est posé d'abord,
  // et le coût marchandise s'en déduit : sur un panneau de 1,27 m, c'est le
  // port qui commande le prix de revient, pas la marchandise.

  // 39,90 € TTC → 33,25 € HT ; revient 18,30 € ; marge 45,0 %.
  'bio-etna-table': { supplierSku: 'BIO-KEK-ETNA', costNet: euros(14.8), leadTimeDays: 1, inboundShipping: euros(3.5) },
  // 44,90 € TTC → 37,42 € HT ; revient 20,60 € ; marge 44,9 %.
  'bio-homcom-floor': { supplierSku: 'BIO-HOM-820333', costNet: euros(16.1), leadTimeDays: 1, inboundShipping: euros(4.5) },
  // 69,90 € TTC → 58,25 € HT ; revient 32,00 € ; marge 45,1 %.
  'bio-mauna-loa': { supplierSku: 'BIO-KEK-MAUNA', costNet: euros(25.0), leadTimeDays: 2, inboundShipping: euros(7.0) },
  // 189,90 € TTC → 158,25 € HT ; revient 87,00 € ; marge 45,0 %.
  'bio-qlima-ffb4242': { supplierSku: 'BIO-QLI-FFB4242', costNet: euros(78.0), leadTimeDays: 3, inboundShipping: euros(9.0) },
  // 249,90 € TTC → 208,25 € HT ; revient 114,50 € ; marge 45,0 %.
  'bio-siena-wall': { supplierSku: 'BIO-FRK-SIENA90', costNet: euros(102.5), leadTimeDays: 3, inboundShipping: euros(12.0) },
  // 679,90 € TTC → 566,58 € HT ; revient 311,60 € ; marge 45,0 %.
  'bio-revello': { supplierSku: 'BIO-DMO-REVELLO', costNet: euros(289.6), leadTimeDays: 4, inboundShipping: euros(22.0) },
  // 129,90 € TTC → 108,25 € HT ; revient 59,50 € ; marge 45,0 %.
  'elec-minesota': { supplierSku: 'ELE-KEK-MINE84', costNet: euros(52.0), leadTimeDays: 1, inboundShipping: euros(7.5) },
  // 169,90 € TTC → 141,58 € HT ; revient 77,90 € ; marge 45,0 %.
  'elec-homcom-wall': { supplierSku: 'ELE-HOM-820234', costNet: euros(69.4), leadTimeDays: 1, inboundShipping: euros(8.5) },
  // 184,90 € TTC → 154,08 € HT ; revient 84,70 € ; marge 45,0 %.
  'elec-mercatools': { supplierSku: 'ELE-MCT-MT1800', costNet: euros(76.7), leadTimeDays: 2, inboundShipping: euros(8.0) },
  // 199,90 € TTC → 166,58 € HT ; revient 91,60 € ; marge 45,0 %.
  'elec-orbegozo-cm8000': { supplierSku: 'ELE-ORB-CM8000', costNet: euros(84.6), leadTimeDays: 2, inboundShipping: euros(7.0) },
  // 339,90 € TTC → 283,25 € HT ; revient 155,80 € ; marge 45,0 %.
  'elec-pzcc-121': { supplierSku: 'ELE-PZC-121INS', costNet: euros(136.8), leadTimeDays: 4, inboundShipping: euros(19.0) },
  // 409,90 € TTC → 341,58 € HT ; revient 187,90 € ; marge 45,0 %.
  'elec-oregon': { supplierSku: 'ELE-KEK-OREG127', costNet: euros(172.9), leadTimeDays: 3, inboundShipping: euros(15.0) },
  // 299,90 € TTC → 249,92 € HT ; revient 137,50 € ; marge 45,0 %,
  'elec-vicco-lynea': { supplierSku: 'ELE-VIC-LYNEA100', costNet: euros(128.5), leadTimeDays: 3, inboundShipping: euros(9.0) },
};

/** Coût d'achat marchandise d'un produit, HT, transport amont exclu. */
export function costOf(productId: string): Cents {
  const line = sourcing[productId];
  if (!line) {
    if (!getProductById(productId)) throw new Error(`produit inconnu : ${productId}`);
    throw new Error(`aucun coût d’achat défini pour « ${productId} »`);
  }
  return line.costNet;
}

/** Coût de revient complet d'une unité : marchandise + transport amont. */
export function landedCostOf(productId: string): Cents {
  const line = sourcing[productId];
  if (!line) throw new Error(`aucun coût d’achat défini pour « ${productId} »`);
  return line.costNet + line.inboundShipping;
}

/**
 * Marge brute en centimes sur une unité vendue au prix catalogue.
 * Le prix catalogue est TTC : on en retire la TVA avant de comparer à un
 * coût HT, sinon la marge affichée est fausse de 20 %.
 */
export function grossMarginOf(productId: string, vatRate = 0.2): Cents {
  const product = getProductById(productId);
  if (!product) throw new Error(`produit inconnu : ${productId}`);
  const netRevenue = Math.round(product.price / (1 + vatRate));
  return netRevenue - landedCostOf(productId);
}

/** Délai de préparation le plus long de la commande — base de la date annoncée. */
export function maxLeadTimeDays(productIds: readonly string[]): number {
  const leadTimes = productIds.map((id) => sourcing[id]?.leadTimeDays ?? 3);
  return leadTimes.length === 0 ? 3 : Math.max(...leadTimes);
}

/** Vérifie que chaque produit du catalogue a un coût calculable. */
export function assertSourcingComplete(): void {
  const missing = products.filter((product) => !sourcing[product.id]).map((p) => p.id);
  if (missing.length > 0) {
    throw new Error(`coût d’achat manquant pour : ${missing.join(', ')}`);
  }
}
