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

/**
 * Le magasin est accroché à `globalThis`, pas à une variable de module.
 *
 * Ce n'est pas une coquetterie. Un build de production de Next découpe le
 * code en paquets par groupe de routes, et un même module importé depuis deux
 * routes différentes peut être instancié deux fois. Avec une simple variable
 * de module, le magasin en mémoire de la route d'inscription n'est alors pas
 * celui de la page de vérification : le compte créé une seconde plus tôt est
 * introuvable, et le message « ce compte n'existe plus » s'affiche sans que
 * rien ne soit cassé ailleurs.
 *
 * `globalThis` est partagé par tous les paquets d'un même processus, ce qui
 * suffit en développement et pour la démonstration. En production, plusieurs
 * processus servent le site : c'est Redis qui tient ce rôle, et c'est pour
 * cela qu'il est obligatoire dès qu'il y a des comptes.
 */
const STORE_KEY = Symbol.for('juniordesk.store');
type GlobalWithStore = typeof globalThis & { [STORE_KEY]?: OfferStore };

export function getStore(): OfferStore {
  const globalRef = globalThis as GlobalWithStore;
  const existing = globalRef[STORE_KEY];
  if (existing) return existing;

  const hasRedis = Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );

  let store: OfferStore;

  if (hasRedis) {
    store = createRedisStore();
  } else {
    if (process.env.NODE_ENV === 'production') {
      console.error(
        '[magasin] AUCUNE PERSISTANCE CONFIGUREE EN PRODUCTION. ' +
          'Les offres collectees, les comptes et les inscriptions aux alertes ' +
          'seront perdus au redemarrage, et ne seront pas partages entre ' +
          'plusieurs processus : la connexion a un compte echouera de maniere ' +
          'intermittente. Definissez UPSTASH_REDIS_REST_URL et ' +
          'UPSTASH_REDIS_REST_TOKEN.',
      );
    }
    store = createMemoryStore();
  }

  globalRef[STORE_KEY] = store;
  return store;
}

/** Réinitialisation, pour les tests. */
export function resetStore(): void {
  delete (globalThis as GlobalWithStore)[STORE_KEY];
}

export type { Account, AlertSubscription, OfferStore, Snapshot, SnapshotMeta, SourceReport } from './types';
export { SESSION_TTL_SECONDS } from './types';
