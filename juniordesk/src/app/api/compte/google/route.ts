/**
 * GET /api/compte/google — départ de la connexion Google.
 *
 * Tire un `state` et un `nonce` au hasard, les dépose dans deux cookies de
 * courte durée, et envoie le visiteur chez Google.
 *
 * Le `state` protège du détournement de session d'autorisation : sans lui, un
 * tiers peut faire aboutir SON code d'autorisation dans VOTRE navigateur, ce
 * qui vous connecte à son compte à lui — et tout ce que vous enregistrez
 * ensuite atterrit chez lui.
 */

import { NextResponse } from 'next/server';
import {
  NONCE_COOKIE,
  OAUTH_COOKIE_TTL_SECONDS,
  STATE_COOKIE,
  buildAuthorizationUrl,
  googleConfig,
  randomToken,
} from '@/lib/google';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const config = googleConfig();
  if (!config) {
    const url = new URL('/connexion', request.url);
    url.searchParams.set('erreur', 'googleabsent');
    return NextResponse.redirect(url, 303);
  }

  const state = randomToken();
  const nonce = randomToken();

  const response = NextResponse.redirect(
    buildAuthorizationUrl({ config, state, nonce }),
    303,
  );

  /*
   * `sameSite: 'lax'` et non 'strict' : le retour depuis Google est une
   * navigation venue d'un autre site, et un cookie 'strict' ne serait pas
   * renvoyé — la connexion échouerait systématiquement.
   */
  for (const [name, value] of [[STATE_COOKIE, state], [NONCE_COOKIE, nonce]] as const) {
    response.cookies.set(name, value, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: OAUTH_COOKIE_TTL_SECONDS,
    });
  }

  return response;
}
