/**
 * GET /api/cron/menage — applique la durée de conservation des comptes.
 *
 * Une durée de conservation qui n'est écrite que dans la politique de
 * confidentialité n'est pas une durée de conservation : c'est une phrase.
 * Cette tâche est ce qui la rend vraie.
 *
 * Elle supprime les comptes jamais confirmés passé l'expiration de leur lien,
 * avertit un mois à l'avance les comptes près d'atteindre deux ans sans
 * connexion, et supprime ceux qui les ont dépassés. Le détail des règles et
 * leurs raisons sont dans `src/lib/retention.ts`.
 *
 * Passage quotidien : les durées se comptent en mois, donc l'heure exacte
 * n'a aucune importance — mais un passage par jour garde l'écart entre
 * l'avertissement et la suppression conforme à ce qui est annoncé.
 */

import { NextResponse } from 'next/server';
import { cronAuthorized } from '@/lib/cron-auth';
import { getStore } from '@/lib/store';
import { purgeStaleAccounts } from '@/lib/retention';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!cronAuthorized(request)) {
    return NextResponse.json({ error: 'non autorise' }, { status: 401 });
  }

  const store = getStore();

  /*
   * Verrou : deux passages simultanés enverraient deux fois l'avertissement,
   * et surtout feraient deux fois le tour de tous les comptes pour rien.
   */
  const locked = await store.acquireLock('cron-menage', 600);
  if (!locked) {
    return NextResponse.json({ skipped: 'un ménage est déjà en cours' }, { status: 409 });
  }

  const report = await purgeStaleAccounts();

  if (report.warningsFailed > 0) {
    console.error(
      `[ménage] ${report.warningsFailed} avertissement(s) non envoyé(s). Les comptes ` +
        'concernés ne seront PAS supprimés tant que l’avertissement n’est pas parti.',
    );
  }

  if (report.unconfirmedDeleted + report.inactiveDeleted > 0) {
    console.info(
      `[ménage] ${report.unconfirmedDeleted} compte(s) jamais confirmé(s) et ` +
        `${report.inactiveDeleted} compte(s) inactif(s) supprimé(s).`,
    );
  }

  return NextResponse.json(report);
}
