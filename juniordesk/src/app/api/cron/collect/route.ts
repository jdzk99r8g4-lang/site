/**
 * GET /api/cron/collect — collecte quotidienne.
 *
 * Enchaîne : interroger les sources, dédoublonner, écrire l'instantané.
 *
 * Les alertes ne partent PLUS d'ici. Elles ont leur propre passage
 * (`/api/cron/alertes`), pour une raison de robustesse : les envois sont
 * séquentiels, un appel réseau par abonné, et les enchaîner derrière la
 * collecte faisait dépendre l'écriture de l'instantané du nombre d'abonnés.
 * Un dépassement de temps tuait alors la fonction quelque part dans la boucle
 * d'envoi, et comme rien n'était marqué « annoncé », le lendemain les
 * premiers de la file recevaient une seconde fois ce qu'ils avaient déjà reçu.
 * Deux métiers, deux passages.
 *
 * ---------------------------------------------------------------------------
 * Heure de passage
 * ---------------------------------------------------------------------------
 * `vercel.json` la planifie à 02h40 UTC. Ce n'est pas arbitraire : l'export de
 * La bonne alternance est rafraîchi une fois par jour à 3h00 heure de Paris,
 * soit 02h00 UTC en hiver et 01h00 UTC en été. 02h40 UTC tombe donc après le
 * rafraîchissement dans les deux cas — un cron en heure UTC fixe doit tenir
 * compte du changement d'heure, sinon il collecte la veille six mois par an.
 *
 * ---------------------------------------------------------------------------
 * Protection
 * ---------------------------------------------------------------------------
 * Sans `CRON_SECRET`, l'URL serait publique et déclenchable à volonté — ce qui
 * épuiserait le quota de l'API source et pourrait renvoyer des e-mails. La
 * comparaison se fait en temps constant.
 */

import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { collect } from '@/lib/collect';
import { getStore } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
/** L'export complet peut être volumineux : il faut de la marge. */
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

  // Vercel peut rejouer un cron. Deux collectes simultanées écriraient
  // l'instantané l'une par-dessus l'autre tout en envoyant deux fois les mêmes
  // alertes.
  const locked = await store.acquireLock('cron-collect', 600);
  if (!locked) {
    return NextResponse.json({ skipped: 'une collecte est déjà en cours' }, { status: 409 });
  }

  const report = await collect();

  if (report.warnings.length > 0) {
    console.warn('[collecte] avertissements :', report.warnings.join(' | '));
  }

  return NextResponse.json({
    ranAt: report.collectedAt,
    kept: report.kept,
    expired: report.expired,
    exactDuplicates: report.exactDuplicates,
    crossDuplicates: report.crossDuplicates,
    newOffers: report.newOfferIds.length,
    keptPreviousSnapshot: report.keptPreviousSnapshot,
    sources: report.sources,
    warnings: report.warnings,
  });
}
