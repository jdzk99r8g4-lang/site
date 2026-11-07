import type { ContractGroup, Offer } from '../offer';

/**
 * Résultat d’une collecte, tel qu’il est conservé.
 *
 * On garde `sources` et `warnings` et pas seulement les offres : le jour où le
 * nombre d’offres s’effondre, la seule question utile est « laquelle des
 * sources a échoué, et avec quel message ». Sans cette trace, il faut
 * reproduire la panne pour la comprendre.
 */
export interface SourceReport {
  id: string;
  label: string;
  count: number;
  error: string | null;
}

export interface Snapshot {
  collectedAt: string;
  offers: Offer[];
  sources: SourceReport[];
  warnings: string[];
}

export type SnapshotMeta = Omit<Snapshot, 'offers'> & { total: number; chunkCount: number };

/** Inscription à une alerte e-mail. Pas de compte, pas de mot de passe. */
export interface AlertSubscription {
  /** Dérivé de l’adresse, pour ne pas mettre l’e-mail dans une URL. */
  id: string;
  email: string;
  families: string[];
  cities: string[];
  groups: ContractGroup[];
  /** Faux jusqu’à ce que le destinataire clique le lien de confirmation. */
  confirmed: boolean;
  createdAt: string;
  confirmedAt: string | null;
  lastSentAt: string | null;
}

export interface OfferStore {
  getSnapshot(): Promise<Snapshot | null>;
  getSnapshotMeta(): Promise<SnapshotMeta | null>;
  saveSnapshot(snapshot: Snapshot): Promise<void>;

  /**
   * Verrou d’idempotence pour la tâche planifiée.
   *
   * Vercel peut rejouer un cron, et deux collectes simultanées écriraient
   * l’instantané l’une par-dessus l’autre tout en envoyant deux fois les
   * mêmes alertes.
   */
  acquireLock(key: string, ttlSeconds: number): Promise<boolean>;

  /** Identifiants d’offres déjà annoncées par e-mail. */
  filterUnannounced(ids: readonly string[]): Promise<string[]>;
  markAnnounced(ids: readonly string[]): Promise<void>;

  saveSubscription(subscription: AlertSubscription): Promise<void>;
  getSubscription(id: string): Promise<AlertSubscription | null>;
  listConfirmedSubscriptions(): Promise<AlertSubscription[]>;
  deleteSubscription(id: string): Promise<void>;

  /**
   * Compteurs agrégés et anonymes.
   *
   * `bucket` porte le mois (`clics:2026-11`), ce qui permet d’appliquer
   * réellement la durée de conservation annoncée : chaque seau expire de
   * lui-même au bout de 25 mois, conformément à la recommandation de la CNIL.
   * Aucun identifiant de visiteur, aucune adresse IP n’entre ici.
   */
  bump(bucket: string, field: string, by?: number): Promise<void>;
  readBucket(bucket: string): Promise<Record<string, number>>;
}

/** 25 mois, en secondes. Durée maximale recommandée par la CNIL. */
export const COUNTER_TTL_SECONDS = 25 * 31 * 24 * 60 * 60;
