/**
 * Mesure d’audience — sans aucun traceur.
 *
 * ---------------------------------------------------------------------------
 * Pourquoi il n’y a pas de script de mesure sur ce site
 * ---------------------------------------------------------------------------
 * La page de la CNIL « Cookies : solutions pour les outils de mesure
 * d’audience » (mise à jour le 4 juillet 2025) fixe les conditions pour qu’un
 * traceur de mesure d’audience soit exempté de consentement : finalité
 * strictement limitée à la mesure d’audience du site, pour le compte exclusif
 * de l’éditeur, production de données statistiques anonymes uniquement, pas de
 * recoupement avec d’autres traitements, pas de transmission à des tiers, pas
 * de suivi de la navigation à travers plusieurs sites.
 *
 * Le plus simple moyen de respecter l’article 82 de la loi Informatique et
 * Libertés est de ne rien déposer du tout. Ici, aucun cookie n’est écrit,
 * aucun identifiant n’est attribué, aucune adresse IP n’est enregistrée et
 * aucun tiers n’est appelé : rien n’est lu ni écrit sur le terminal du
 * visiteur, donc l’article 82 ne s’applique pas et il n’y a pas d’exemption à
 * revendiquer. Il n’y a pas non plus de bandeau à afficher.
 *
 * Ce que l’on compte : des totaux. Combien de fois telle offre a été ouverte,
 * combien de clics sont partis vers tel employeur, quelles familles de métiers
 * et quelles villes intéressent. Jamais qui.
 *
 * Note : la CNIL interdit expressément de présenter une solution comme
 * « certifiée » ou « validée par la CNIL ». Rien ici ne doit jamais être
 * désigné ainsi.
 *
 * ---------------------------------------------------------------------------
 * Durée de conservation
 * ---------------------------------------------------------------------------
 * Chaque compteur vit dans un seau mensuel qui expire tout seul au bout de
 * 25 mois — la durée maximale recommandée par la CNIL. La promesse de la
 * politique de confidentialité est donc appliquée par le code, et non
 * seulement écrite.
 *
 * SERVEUR UNIQUEMENT.
 */

import { getStore } from './store';

export type Bucket = 'vues' | 'clics' | 'clics-metier' | 'clics-ville' | 'clics-alertes';

/** Seau mensuel : `clics:2026-11`. */
export function bucketKey(bucket: Bucket, now: Date = new Date()): string {
  const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  return `${bucket}:${month}`;
}

/**
 * Incrémente un compteur, sans jamais faire échouer la requête du visiteur.
 *
 * Un compteur est utile mais secondaire : si le magasin est indisponible, le
 * visiteur doit tout de même arriver sur l’offre. D’où l’absorption de
 * l’erreur, journalisée et pas plus.
 */
export async function bump(bucket: Bucket, field: string, now: Date = new Date()): Promise<void> {
  if (!field) return;
  try {
    await getStore().bump(bucketKey(bucket, now), field);
  } catch (error) {
    console.warn(`[mesure] compteur ${bucket} non incrémenté :`, error);
  }
}

/** Enregistre un clic vers un employeur, avec ses ventilations. */
export async function recordOfferClick(input: {
  offerId: string;
  families: readonly string[];
  citySlug: string | null;
  /** Identifiant d’inscription, uniquement si le clic vient d’un e-mail d’alerte. */
  subscriptionId?: string | null;
  now?: Date;
}): Promise<void> {
  const now = input.now ?? new Date();

  await bump('clics', input.offerId, now);
  for (const family of input.families) await bump('clics-metier', family, now);
  if (input.citySlug) await bump('clics-ville', input.citySlug, now);

  // Mesure de fidélité : uniquement pour les inscrits aux alertes, qui ont
  // consenti, et uniquement sous forme d’un total mensuel par inscription.
  // Aucun journal de clics, aucune chronologie, aucune offre associée à une
  // personne.
  if (input.subscriptionId) await bump('clics-alertes', input.subscriptionId, now);
}

export async function readCounters(bucket: Bucket, now: Date = new Date()): Promise<Record<string, number>> {
  try {
    return await getStore().readBucket(bucketKey(bucket, now));
  } catch {
    return {};
  }
}

export interface LoyaltySummary {
  /** Nombre d’inscriptions ayant cliqué au moins une fois ce mois-ci. */
  activeSubscribers: number;
  /** Clics totaux depuis les e-mails d’alerte ce mois-ci. */
  clicks: number;
  /** Clics moyens par inscription active, arrondi au dixième. */
  clicksPerActiveSubscriber: number;
}

/**
 * Fidélité, agrégée. Volontairement pauvre : trois nombres suffisent à savoir
 * si les alertes servent à quelque chose, et aucun d’eux ne désigne personne.
 */
export async function loyaltySummary(now: Date = new Date()): Promise<LoyaltySummary> {
  const counters = await readCounters('clics-alertes', now);
  const values = Object.values(counters);
  const clicks = values.reduce((sum, n) => sum + n, 0);
  const activeSubscribers = values.filter((n) => n > 0).length;

  return {
    activeSubscribers,
    clicks,
    clicksPerActiveSubscriber:
      activeSubscribers === 0 ? 0 : Math.round((clicks / activeSubscribers) * 10) / 10,
  };
}
