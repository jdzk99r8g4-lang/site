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

/**
 * Compte étudiant.
 *
 * Volontairement pauvre : une adresse, un mot de passe haché, et ce que la
 * personne a mis de côté. Pas de nom, pas de date de naissance, pas d'école,
 * pas de CV — rien qui ne serve au service rendu. Moins on garde, moins il y a
 * à perdre.
 */
export interface Account {
  /** Dérivé de l'adresse, pour ne jamais faire circuler l'e-mail dans une URL. */
  id: string;
  email: string;
  /**
   * Format « scrypt$N$r$p$selHex$hashHex ». Jamais le mot de passe en clair.
   *
   * Null pour un compte créé via Google : il n'y a pas de mot de passe à
   * stocker, et en inventer un serait pire que de ne pas en avoir. La
   * personne peut s'en donner un plus tard par « mot de passe oublié ».
   */
  passwordHash: string | null;
  /**
   * Identifiant stable du compte Google rattaché, ou null.
   *
   * On garde l'identifiant (`sub`) et non l'adresse : chez Google l'adresse
   * peut changer, l'identifiant jamais.
   */
  googleId: string | null;
  verified: boolean;
  createdAt: string;
  verifiedAt: string | null;
  lastLoginAt: string | null;
  /** Identifiants d'offres mises de côté. */
  savedOfferIds: string[];
  /** Offres pour lesquelles la personne déclare avoir postulé. */
  applications: { offerId: string; markedAt: string }[];
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

  /* ---------------------------------------------------------------------
   * Comptes et sessions
   * ------------------------------------------------------------------- */

  saveAccount(account: Account): Promise<void>;
  getAccount(id: string): Promise<Account | null>;
  deleteAccount(id: string): Promise<void>;

  /** Crée une session et renvoie son identifiant opaque. */
  createSession(accountId: string, ttlSeconds: number): Promise<string>;
  /** Identifiant de compte derrière une session, ou null si elle n'existe plus. */
  readSession(token: string): Promise<string | null>;
  deleteSession(token: string): Promise<void>;
  /** Révoque toutes les sessions d'un compte (suppression, changement de mot de passe). */
  deleteSessionsOf(accountId: string): Promise<void>;

  /**
   * Compte les tentatives sur une clé dans une fenêtre glissante, et renvoie
   * le total APRÈS incrément. Sert à ralentir les attaques par force brute
   * sur la connexion.
   */
  touchRateLimit(key: string, windowSeconds: number): Promise<number>;
}

/** 25 mois, en secondes. Durée maximale recommandée par la CNIL. */
export const COUNTER_TTL_SECONDS = 25 * 31 * 24 * 60 * 60;

/** Durée de vie d'une session : 30 jours. */
export const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;
