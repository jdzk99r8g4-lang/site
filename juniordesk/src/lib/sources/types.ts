/**
 * Contrat commun à toutes les sources d’offres.
 *
 * Même raisonnement que pour les fournisseurs d’une boutique : la pièce qu’on
 * change le plus souvent ne doit pas être supposée stable. Ici, la source est
 * carrément hors de notre contrôle — l’API publique sur laquelle reposait la
 * moitié du périmètre a été fermée du jour au lendemain en octobre 2026. Le
 * reste du site ne doit donc rien savoir d’aucune source en particulier.
 *
 * Une source produit des `Offer` déjà normalisées : c’est elle, et elle seule,
 * qui connaît la forme de ses données.
 */

import type { ContractKind, Offer } from '../offer';

export type FetchOutcome =
  | { ok: true; offers: Offer[]; warnings: string[] }
  | { ok: false; error: string; retryable: boolean };

export interface JobSource {
  readonly id: string;
  readonly label: string;
  /**
   * Types de contrat que cette source est capable de produire.
   *
   * Sert au contrôle de cohérence du périmètre annoncé : le site ne doit pas
   * promettre des stages si aucune source active n’en produit.
   */
  readonly contractKinds: readonly ContractKind[];
  /**
   * Récupère l’intégralité des offres disponibles, déjà restreintes au
   * périmètre finance et normalisées.
   *
   * Doit être idempotent : la collecte quotidienne l’appelle une fois, mais un
   * rattrapage peut l’appeler deux fois dans la même journée.
   */
  fetchAll(): Promise<FetchOutcome>;
}
