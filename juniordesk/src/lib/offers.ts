/**
 * Lecture des offres par les pages.
 *
 * SERVEUR UNIQUEMENT. Ce module touche le magasin et, en dernier recours, les
 * sources : il ne doit jamais être importé par un composant client, sans quoi
 * la clé API partirait dans le bundle du navigateur. `tests/leakage.test.ts`
 * le vérifie, et la garde ci-dessous le rend impossible à l’exécution.
 */

if (typeof window !== 'undefined') {
  throw new Error(
    'src/lib/offers.ts a été chargé dans un navigateur. Ce module lit le magasin ' +
      'et les sources : il doit rester côté serveur. Passez les offres en props ' +
      'depuis un composant serveur.',
  );
}

import { cache } from 'react';
import type { Offer } from './offer';
import { isLive } from './offer';
import { collect } from './collect';
import { getStore } from './store';
import type { Snapshot } from './store/types';
import { hasRealSource } from './sources';

/**
 * Instantané courant.
 *
 * Enveloppé dans `cache()` de React : au sein d'une même requête, la page et
 * son `generateMetadata` lisent le magasin une seule fois. Sans cela, chaque
 * page paginée le lisait deux fois — une pour savoir combien il y a de pages,
 * une pour les afficher.
 *
 * Si le magasin est vide — première exécution, développement local, mémoire
 * perdue au redémarrage — on collecte à la demande une seule fois plutôt que
 * d’afficher une page vide. En production, c’est la tâche planifiée qui
 * alimente le magasin ; ce repli ne doit donc jamais être le cas courant, et
 * il est protégé par un verrou pour qu’un pic de trafic sur un magasin vide ne
 * déclenche pas vingt collectes simultanées.
 */
export const getSnapshot = cache(async function getSnapshot(): Promise<Snapshot> {
  const store = getStore();
  const existing = await store.getSnapshot();
  if (existing && existing.offers.length > 0) return existing;

  const locked = await store.acquireLock('collect-on-demand', 120);
  if (!locked) {
    // Une autre requête collecte déjà : on sert ce qu’on a, même vide.
    return existing ?? { collectedAt: new Date().toISOString(), offers: [], sources: [], warnings: [] };
  }

  await collect();
  const fresh = await store.getSnapshot();
  return fresh ?? { collectedAt: new Date().toISOString(), offers: [], sources: [], warnings: [] };
});

/** Offres encore valides, toutes familles et toutes villes. */
export async function getLiveOffers(now: Date = new Date()): Promise<Offer[]> {
  const snapshot = await getSnapshot();
  return snapshot.offers.filter((offer) => isLive(offer, now));
}

export async function findOfferBySlug(slug: string): Promise<Offer | null> {
  const offers = await getLiveOffers();
  const exact = offers.find((offer) => offer.slug === slug);
  if (exact) return exact;

  // Lien indexé avant un changement d’intitulé : on retombe sur le code court.
  const code = slug.match(/([a-z0-9]{8})$/)?.[1];
  if (!code) return null;
  return offers.find((offer) => offer.slug.endsWith(code)) ?? null;
}

export async function findOfferById(id: string): Promise<Offer | null> {
  const offers = await getLiveOffers();
  return offers.find((offer) => offer.id === id) ?? null;
}

/**
 * Vrai si le site tourne sur le jeu de démonstration. Les pages affichent
 * alors un bandeau : laisser croire que des offres fabriquées sont réelles
 * serait la pire sortie possible.
 */
export function isDemoMode(): boolean {
  return !hasRealSource();
}
