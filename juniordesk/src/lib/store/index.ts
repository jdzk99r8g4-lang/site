/**
 * Point d’accès unique au magasin.
 *
 * Bascule automatique : Redis si configuré, mémoire sinon. Le choix est
 * journalisé une seule fois, assez bruyamment pour qu’on ne déploie pas en
 * production sans persistance par inadvertance — avec une conséquence
 * particulière ici : sans Redis, les inscriptions aux alertes disparaissent au
 * redémarrage, et les gens ne reçoivent plus rien sans jamais être prévenus.
 */

import type { OfferStore } from './types';
import { createMemoryStore } from './memory';
import { createRedisStore } from './redis';

let store: OfferStore | null = null;

export function getStore(): OfferStore {
  if (store) return store;

  const hasRedis = Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );

  if (hasRedis) {
    store = createRedisStore();
  } else {
    if (process.env.NODE_ENV === 'production') {
      console.error(
        '[magasin] AUCUNE PERSISTANCE CONFIGUREE EN PRODUCTION. ' +
          'Les offres collectees et les inscriptions aux alertes seront perdues ' +
          'au redemarrage. Definissez UPSTASH_REDIS_REST_URL et ' +
          'UPSTASH_REDIS_REST_TOKEN.',
      );
    }
    store = createMemoryStore();
  }

  return store;
}

/** Réinitialisation, pour les tests. */
export function resetStore(): void {
  store = null;
}

export type { AlertSubscription, OfferStore, Snapshot, SnapshotMeta, SourceReport } from './types';
