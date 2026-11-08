/**
 * POST /api/compte/deconnexion
 *
 * En POST et non en GET, exprès : un lien de déconnexion en GET se déclenche
 * tout seul dès qu'un préchargeur de navigateur ou un scanner de liens le
 * visite, et déconnecte la personne sans qu'elle ait rien demandé.
 */

import { NextResponse } from 'next/server';
import { logout } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  await logout();
  return NextResponse.redirect(new URL('/', request.url), 303);
}
