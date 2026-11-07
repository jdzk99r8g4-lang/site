/**
 * Orchestrateur de la collecte.
 *
 * Interroge chaque source active, réunit les résultats, dédoublonne, écarte
 * les offres expirées, écrit l’instantané et dit lesquelles sont nouvelles.
 *
 * Deux principes de robustesse, tous deux appris du fait que les sources sont
 * hors de notre contrôle :
 *
 * 1. UNE SOURCE QUI TOMBE N’EN FAIT PAS TOMBER UNE AUTRE. Chaque échec est
 *    consigné dans le rapport et la collecte continue avec ce qu’elle a.
 *
 * 2. UNE COLLECTE VIDE N’ÉCRASE PAS UN INSTANTANÉ PLEIN. Si toutes les sources
 *    échouent, on conserve les offres de la veille : un site qui affiche des
 *    offres d’hier est utile, un site vide ne l’est pas. C’est le cas de panne
 *    qui compte vraiment, parce qu’il se produit sans prévenir — l’API peut
 *    fermer du jour au lendemain, on en a déjà la preuve avec France Travail.
 */

import type { Offer } from './offer';
import { isLive } from './offer';
import { dedupe } from './dedupe';
import { activeSources } from './sources';
import type { JobSource } from './sources/types';
import { getStore } from './store';
import type { Snapshot, SourceReport } from './store/types';

export interface CollectReport {
  collectedAt: string;
  /** Offres retenues et enregistrées. */
  kept: number;
  /** Écartées parce que leur date d’expiration est passée. */
  expired: number;
  exactDuplicates: number;
  crossDuplicates: number;
  /** Offres jamais vues lors des collectes précédentes. */
  newOfferIds: string[];
  sources: SourceReport[];
  warnings: string[];
  /** Vrai si l’instantané précédent a été conservé faute de données fraîches. */
  keptPreviousSnapshot: boolean;
}

export async function collect(
  now: Date = new Date(),
  /** Sources à interroger. Injectable pour les tests ; par défaut, celles que
   *  la configuration active. */
  sources_: readonly JobSource[] = activeSources(),
): Promise<CollectReport> {
  const store = getStore();
  const collectedAt = now.toISOString();

  const gathered: Offer[] = [];
  const sources: SourceReport[] = [];
  const warnings: string[] = [];

  for (const source of sources_) {
    const outcome = await source.fetchAll();

    if (!outcome.ok) {
      sources.push({ id: source.id, label: source.label, count: 0, error: outcome.error });
      warnings.push(`${source.label} : ${outcome.error}`);
      continue;
    }

    gathered.push(...outcome.offers);
    sources.push({ id: source.id, label: source.label, count: outcome.offers.length, error: null });
    warnings.push(...outcome.warnings.map((w) => `${source.label} : ${w}`));
  }

  const everySourceFailed = sources.length > 0 && sources.every((s) => s.error !== null);

  if (everySourceFailed) {
    const previous = await store.getSnapshotMeta();
    if (previous && previous.total > 0) {
      // On ne touche pas à l’instantané. On met seulement à jour le rapport de
      // sources pour que l’exploitation voie l’échec.
      warnings.push(
        'Toutes les sources ont échoué : l’instantané précédent est conservé ' +
          `(${previous.total} offre(s), collectées le ${previous.collectedAt}).`,
      );
      return {
        collectedAt,
        kept: previous.total,
        expired: 0,
        exactDuplicates: 0,
        crossDuplicates: 0,
        newOfferIds: [],
        sources,
        warnings,
        keptPreviousSnapshot: true,
      };
    }
  }

  const deduped = dedupe(gathered);
  const live = deduped.offers.filter((offer) => isLive(offer, now));
  const expired = deduped.offers.length - live.length;

  // Les offres jamais annoncées sont celles qui alimenteront les alertes. On
  // interroge le magasin plutôt que de comparer à l’instantané précédent :
  // une offre retirée puis remise en ligne ne doit pas être annoncée deux fois.
  const newOfferIds = await store.filterUnannounced(live.map((o) => o.id));

  const snapshot: Snapshot = { collectedAt, offers: live, sources, warnings };
  await store.saveSnapshot(snapshot);

  return {
    collectedAt,
    kept: live.length,
    expired,
    exactDuplicates: deduped.exactDuplicates,
    crossDuplicates: deduped.crossDuplicates,
    newOfferIds,
    sources,
    warnings,
    keptPreviousSnapshot: false,
  };
}
