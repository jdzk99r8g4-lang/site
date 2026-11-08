/**
 * Magasin en mémoire.
 *
 * Suffisant en développement et pour les tests ; inacceptable en production,
 * où `store/index.ts` le signale bruyamment. Les offres se reconstruisent à la
 * collecte suivante, mais les inscriptions aux alertes, elles, sont
 * définitivement perdues au redémarrage.
 */

import { randomBytes } from 'node:crypto';
import type { Account, AlertSubscription, OfferStore, Snapshot, SnapshotMeta } from './types';

export function createMemoryStore(): OfferStore {
  let snapshot: Snapshot | null = null;
  const locks = new Map<string, number>();
  const announced = new Set<string>();
  const subscriptions = new Map<string, AlertSubscription>();
  const counters = new Map<string, Map<string, number>>();
  const accounts = new Map<string, Account>();
  const sessions = new Map<string, { accountId: string; expiresAt: number }>();
  const rateLimits = new Map<string, { count: number; resetAt: number }>();

  return {
    async getSnapshot() {
      return snapshot;
    },

    async getSnapshotMeta() {
      if (!snapshot) return null;
      const { offers, ...rest } = snapshot;
      return { ...rest, total: offers.length, chunkCount: 1 } satisfies SnapshotMeta;
    },

    async saveSnapshot(next) {
      snapshot = next;
    },

    async acquireLock(key, ttlSeconds) {
      const now = Date.now();
      const existing = locks.get(key);
      if (existing && existing > now) return false;
      locks.set(key, now + ttlSeconds * 1000);
      return true;
    },

    async filterUnannounced(ids) {
      return ids.filter((id) => !announced.has(id));
    },

    async markAnnounced(ids) {
      for (const id of ids) announced.add(id);
    },

    async saveSubscription(subscription) {
      subscriptions.set(subscription.id, subscription);
    },

    async getSubscription(id) {
      return subscriptions.get(id) ?? null;
    },

    async listConfirmedSubscriptions() {
      return [...subscriptions.values()].filter((s) => s.confirmed);
    },

    async deleteSubscription(id) {
      subscriptions.delete(id);
    },

    async bump(bucket, field, by = 1) {
      const fields = counters.get(bucket) ?? new Map<string, number>();
      fields.set(field, (fields.get(field) ?? 0) + by);
      counters.set(bucket, fields);
    },

    async readBucket(bucket) {
      const fields = counters.get(bucket);
      if (!fields) return {};
      return Object.fromEntries(fields);
    },

    async saveAccount(account) {
      accounts.set(account.id, account);
    },

    async getAccount(id) {
      return accounts.get(id) ?? null;
    },

    async deleteAccount(id) {
      accounts.delete(id);
    },

    async createSession(accountId, ttlSeconds) {
      const token = randomBytes(32).toString('base64url');
      sessions.set(token, { accountId, expiresAt: Date.now() + ttlSeconds * 1000 });
      return token;
    },

    async readSession(token) {
      const session = sessions.get(token);
      if (!session) return null;
      if (session.expiresAt <= Date.now()) {
        sessions.delete(token);
        return null;
      }
      return session.accountId;
    },

    async deleteSession(token) {
      sessions.delete(token);
    },

    async deleteSessionsOf(accountId) {
      for (const [token, session] of sessions) {
        if (session.accountId === accountId) sessions.delete(token);
      }
    },

    async touchRateLimit(key, windowSeconds) {
      const now = Date.now();
      const current = rateLimits.get(key);
      if (!current || current.resetAt <= now) {
        rateLimits.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
        return 1;
      }
      current.count += 1;
      return current.count;
    },
  };
}
