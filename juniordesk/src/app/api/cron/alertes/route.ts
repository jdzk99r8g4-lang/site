/**
 * GET /api/cron/alertes — envoi du différentiel aux abonnés.
 *
 * ---------------------------------------------------------------------------
 * Pourquoi un passage séparé de la collecte
 * ---------------------------------------------------------------------------
 * Les deux font des métiers différents, et surtout leur durée ne dépend pas
 * des mêmes choses. La collecte dépend du volume du catalogue ; les envois
 * dépendent du nombre d'abonnés, avec un appel réseau par abonné, l'un après
 * l'autre.
 *
 * Enchaînés dans une seule fonction au temps borné, le second finissait par
 * faire tuer la fonction — quelque part entre quatre et cinq cents abonnés,
 * sans qu'aucune erreur ne l'annonce. Et comme les offres n'étaient marquées
 * « annoncées » qu'à la toute fin, une interruption faisait recevoir une
 * seconde fois, le lendemain, ce que les premiers de la file avaient déjà reçu.
 *
 * ---------------------------------------------------------------------------
 * Reprendre proprement
 * ---------------------------------------------------------------------------
 * Un passage sert un nombre borné d'abonnés (`ALERTS_PER_RUN`) et dit combien
 * il en reste. Les offres ne sont marquées comme annoncées QUE lorsqu'il n'en
 * reste aucun : les marquer plus tôt les ferait sortir du différentiel, et
 * les abonnés non encore servis ne les verraient jamais.
 *
 * Les abonnés déjà servis pour l'instantané en cours sont reconnus à leur
 * `lastSentAt`, postérieur à la date de cet instantané. C'est ce qui permet
 * à un passage interrompu d'être sans conséquence : le suivant reprend la
 * file où elle en était au lieu de la recommencer.
 *
 * Le cron passe plusieurs fois après la collecte, ce qui laisse le temps de
 * vider la file. Si elle ne se vide pas, le journal le dit à chaque passage —
 * c'est le signal qu'il faut relever `ALERTS_PER_RUN` ou rapprocher les
 * passages.
 */

import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { sendDigests } from '@/lib/alerts';
import { getStore } from '@/lib/store';
import { getLiveOffers } from '@/lib/offers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function authorized(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;

  const header = request.headers.get('authorization') ?? '';
  const provided = header.replace(/^Bearer\s+/i, '');
  const given = Buffer.from(provided);
  const wanted = Buffer.from(expected);
  if (given.length !== wanted.length) return false;
  return timingSafeEqual(given, wanted);
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'non autorise' }, { status: 401 });
  }

  const store = getStore();

  /*
   * Un verrou court : deux passages simultanés enverraient deux fois les
   * mêmes messages aux mêmes personnes. Il expire tout seul, pour qu'un
   * passage tué ne bloque pas les suivants.
   */
  const locked = await store.acquireLock('cron-alertes', 600);
  if (!locked) {
    return NextResponse.json({ skipped: 'un envoi est déjà en cours' }, { status: 409 });
  }

  const meta = await store.getSnapshotMeta();
  if (!meta) {
    return NextResponse.json({ skipped: 'aucun instantané : rien à annoncer' });
  }

  const offers = await getLiveOffers();
  const unannouncedIds = new Set(await store.filterUnannounced(offers.map((o) => o.id)));
  const newOffers = offers.filter((offer) => unannouncedIds.has(offer.id));

  const digests = await sendDigests(newOffers, { since: meta.collectedAt });

  /*
   * On ne marque QUE les offres effectivement envoyées, et seulement une fois
   * la file vide. Si un envoi échoue, l'offre repassera dans le différentiel
   * au prochain passage plutôt que d'être perdue pour tout le monde.
   */
  if (digests.remaining === 0 && digests.announcedIds.length > 0) {
    await store.markAnnounced(digests.announcedIds);
  }

  if (digests.remaining > 0) {
    console.warn(
      `[alertes] ${digests.remaining} abonné(s) restent à servir pour l’instantané du ` +
        `${meta.collectedAt}. Le prochain passage reprendra la file. Si ce message revient ` +
        'à chaque passage, relevez ALERTS_PER_RUN ou rapprochez les passages.',
    );
  }

  if (digests.mailsFailed > 0) {
    console.error(`[alertes] ${digests.mailsFailed} envoi(s) en échec.`);
  }

  return NextResponse.json({
    snapshot: meta.collectedAt,
    newOffers: newOffers.length,
    subscriptions: digests.subscriptions,
    mailsSent: digests.mailsSent,
    mailsFailed: digests.mailsFailed,
    remaining: digests.remaining,
    announced: digests.remaining === 0 ? digests.announcedIds.length : 0,
  });
}
