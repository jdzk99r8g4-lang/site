/**
 * Magasin Redis (Upstash).
 *
 * ---------------------------------------------------------------------------
 * Pourquoi l’instantané est découpé en tranches
 * ---------------------------------------------------------------------------
 * L’export de La bonne alternance couvre toute la France et tous les métiers.
 * Même réduit au périmètre finance, le volume n’est pas connu à l’avance, et
 * les API Redis gérées imposent une taille maximale par requête. Écrire
 * l’instantané complet dans une seule clé marcherait en développement et
 * casserait le jour où le gisement grossit — c’est-à-dire le jour où le site
 * commence à servir à quelque chose.
 *
 * On écrit donc une clé de métadonnées et N tranches d’offres, puis on relit
 * les tranches en une seule salve. Les tranches de l’instantané précédent qui
 * dépassent sont supprimées, sans quoi une collecte maigre laisserait traîner
 * les offres d’une collecte plus grasse.
 */

import { Redis } from '@upstash/redis';
import { randomBytes } from 'node:crypto';
import type { Offer } from '../offer';
import type { Account, AlertSubscription, OfferStore, Snapshot, SnapshotMeta } from './types';
import { COUNTER_TTL_SECONDS } from './types';

const META_KEY = 'jd:snapshot:meta';
const CHUNK_KEY = (index: number) => `jd:snapshot:chunk:${index}`;
const ANNOUNCED_KEY = 'jd:announced';
const SUBSCRIPTION_KEY = (id: string) => `jd:sub:${id}`;
const SUBSCRIPTION_INDEX = 'jd:subs';
const COUNTER_KEY = (bucket: string) => `jd:counter:${bucket}`;
const ACCOUNT_KEY = (id: string) => `jd:account:${id}`;
const SESSION_KEY = (token: string) => `jd:session:${token}`;
/** Index des sessions d'un compte, pour pouvoir toutes les révoquer d'un coup. */
const ACCOUNT_SESSIONS_KEY = (accountId: string) => `jd:account-sessions:${accountId}`;
const RATE_KEY = (key: string) => `jd:rate:${key}`;

/** Nombre d’offres par tranche. Compromis entre taille de requête et nombre d’allers-retours. */
const CHUNK_SIZE = 150;

export function createRedisStore(): OfferStore {
  const redis = Redis.fromEnv();

  return {
    async getSnapshotMeta() {
      return (await redis.get<SnapshotMeta>(META_KEY)) ?? null;
    },

    async getSnapshot() {
      const meta = await redis.get<SnapshotMeta>(META_KEY);
      if (!meta) return null;

      const keys = Array.from({ length: meta.chunkCount }, (_, i) => CHUNK_KEY(i));
      const chunks = keys.length > 0 ? await redis.mget<Offer[][]>(...keys) : [];

      const offers: Offer[] = [];
      for (const chunk of chunks) {
        if (Array.isArray(chunk)) offers.push(...chunk);
      }

      return {
        collectedAt: meta.collectedAt,
        sources: meta.sources,
        warnings: meta.warnings,
        offers,
      } satisfies Snapshot;
    },

    async saveSnapshot(snapshot) {
      const previous = await redis.get<SnapshotMeta>(META_KEY);
      const chunks: Offer[][] = [];
      for (let i = 0; i < snapshot.offers.length; i += CHUNK_SIZE) {
        chunks.push(snapshot.offers.slice(i, i + CHUNK_SIZE));
      }

      const pipeline = redis.pipeline();
      chunks.forEach((chunk, index) => {
        pipeline.set(CHUNK_KEY(index), chunk);
      });

      // Les tranches en trop de l’instantané précédent doivent disparaître.
      const previousCount = previous?.chunkCount ?? 0;
      for (let index = chunks.length; index < previousCount; index += 1) {
        pipeline.del(CHUNK_KEY(index));
      }

      // Les métadonnées sont écrites EN DERNIER : jusque-là, une lecture
      // concurrente voit l’ancien instantané, cohérent, plutôt qu’un mélange.
      pipeline.set(META_KEY, {
        collectedAt: snapshot.collectedAt,
        sources: snapshot.sources,
        warnings: snapshot.warnings,
        total: snapshot.offers.length,
        chunkCount: chunks.length,
      } satisfies SnapshotMeta);

      await pipeline.exec();
    },

    async acquireLock(key, ttlSeconds) {
      const result = await redis.set(`jd:lock:${key}`, '1', { nx: true, ex: ttlSeconds });
      return result === 'OK';
    },

    async filterUnannounced(ids) {
      if (ids.length === 0) return [];
      const pipeline = redis.pipeline();
      for (const id of ids) pipeline.sismember(ANNOUNCED_KEY, id);
      const results = (await pipeline.exec()) as unknown[];
      return ids.filter((_, index) => results[index] !== 1);
    },

    async markAnnounced(ids) {
      if (ids.length === 0) return;
      await redis.sadd(ANNOUNCED_KEY, ids[0] as string, ...ids.slice(1));
    },

    async saveSubscription(subscription) {
      const pipeline = redis.pipeline();
      pipeline.set(SUBSCRIPTION_KEY(subscription.id), subscription);
      pipeline.sadd(SUBSCRIPTION_INDEX, subscription.id);
      await pipeline.exec();
    },

    async getSubscription(id) {
      return (await redis.get<AlertSubscription>(SUBSCRIPTION_KEY(id))) ?? null;
    },

    async listConfirmedSubscriptions() {
      const ids = await redis.smembers(SUBSCRIPTION_INDEX);
      if (ids.length === 0) return [];
      const keys = ids.map((id) => SUBSCRIPTION_KEY(id));
      const found = await redis.mget<AlertSubscription[]>(...keys);
      return found.filter((s): s is AlertSubscription => Boolean(s?.confirmed));
    },

    async deleteSubscription(id) {
      const pipeline = redis.pipeline();
      pipeline.del(SUBSCRIPTION_KEY(id));
      pipeline.srem(SUBSCRIPTION_INDEX, id);
      await pipeline.exec();
    },

    async bump(bucket, field, by = 1) {
      const key = COUNTER_KEY(bucket);
      const pipeline = redis.pipeline();
      pipeline.hincrby(key, field, by);
      // L’expiration est posée à chaque incrément : c’est idempotent, et cela
      // garantit que la durée de conservation annoncée est réellement
      // appliquée, sans tâche de ménage à écrire.
      pipeline.expire(key, COUNTER_TTL_SECONDS);
      await pipeline.exec();
    },

    async readBucket(bucket) {
      const raw = await redis.hgetall<Record<string, string | number>>(COUNTER_KEY(bucket));
      if (!raw) return {};
      const result: Record<string, number> = {};
      for (const [field, value] of Object.entries(raw)) {
        const parsed = typeof value === 'number' ? value : Number.parseInt(value, 10);
        if (Number.isFinite(parsed)) result[field] = parsed;
      }
      return result;
    },

    async saveAccount(account) {
      await redis.set(ACCOUNT_KEY(account.id), account);
    },

    async getAccount(id) {
      return (await redis.get<Account>(ACCOUNT_KEY(id))) ?? null;
    },

    async deleteAccount(id) {
      await redis.del(ACCOUNT_KEY(id));
    },

    async createSession(accountId, ttlSeconds) {
      // 32 octets issus du générateur cryptographique : un identifiant de
      // session doit être impossible à deviner, c'est tout ce qui protège le
      // compte une fois la connexion faite.
      const token = randomBytes(32).toString('base64url');
      const pipeline = redis.pipeline();
      pipeline.set(SESSION_KEY(token), accountId, { ex: ttlSeconds });
      pipeline.sadd(ACCOUNT_SESSIONS_KEY(accountId), token);
      pipeline.expire(ACCOUNT_SESSIONS_KEY(accountId), ttlSeconds);
      await pipeline.exec();
      return token;
    },

    async readSession(token) {
      return (await redis.get<string>(SESSION_KEY(token))) ?? null;
    },

    async deleteSession(token) {
      const accountId = await redis.get<string>(SESSION_KEY(token));
      const pipeline = redis.pipeline();
      pipeline.del(SESSION_KEY(token));
      if (accountId) pipeline.srem(ACCOUNT_SESSIONS_KEY(accountId), token);
      await pipeline.exec();
    },

    async deleteSessionsOf(accountId) {
      const tokens = await redis.smembers(ACCOUNT_SESSIONS_KEY(accountId));
      const pipeline = redis.pipeline();
      for (const token of tokens) pipeline.del(SESSION_KEY(token));
      pipeline.del(ACCOUNT_SESSIONS_KEY(accountId));
      await pipeline.exec();
    },

    async touchRateLimit(key, windowSeconds) {
      const redisKey = RATE_KEY(key);
      const pipeline = redis.pipeline();
      pipeline.incr(redisKey);
      // L'expiration n'est posée qu'au premier incrément, sinon la fenêtre
      // glisserait indéfiniment et la limite ne se relâcherait jamais.
      pipeline.expire(redisKey, windowSeconds, 'NX');
      const results = (await pipeline.exec()) as unknown[];
      const count = results[0];
      return typeof count === 'number' ? count : 1;
    },
  };
}
