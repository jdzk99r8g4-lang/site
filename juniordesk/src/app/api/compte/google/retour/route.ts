/**
 * GET /api/compte/google/retour — retour depuis Google.
 *
 * Vérifie que la réponse correspond bien à une demande partie d'ici, échange
 * le code contre l'identité, puis connecte, rattache ou crée le compte.
 *
 * Les cookies d'aller-retour sont effacés dans tous les cas, succès compris :
 * ils n'ont plus d'usage, et un `state` qui traîne est un `state` rejouable.
 */

import { NextResponse } from 'next/server';
import { signInWithGoogle } from '@/lib/auth';
import {
  NONCE_COOKIE,
  STATE_COOKIE,
  exchangeCode,
  googleConfig,
  safeEquals,
} from '@/lib/google';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function failure(request: Request, code: string): NextResponse {
  const url = new URL('/connexion', request.url);
  url.searchParams.set('erreur', code);
  const response = NextResponse.redirect(url, 303);
  response.cookies.delete(STATE_COOKIE);
  response.cookies.delete(NONCE_COOKIE);
  return response;
}

export async function GET(request: Request) {
  const config = googleConfig();
  if (!config) return failure(request, 'googleabsent');

  const url = new URL(request.url);

  // L'utilisateur a refusé sur l'écran Google, ou Google a refusé la demande.
  if (url.searchParams.get('error')) return failure(request, 'googleannule');

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) return failure(request, 'googleincomplet');

  // `request.cookies` n'existe pas sur le type Request standard : on lit
  // l'en-tête, ce qui évite une dépendance à l'objet de requête de Next.
  const jar = parseCookies(request.headers.get('cookie'));
  const expectedState = jar[STATE_COOKIE];
  const expectedNonce = jar[NONCE_COOKIE];

  if (!expectedState || !expectedNonce) return failure(request, 'googleexpire');
  if (!safeEquals(state, expectedState)) return failure(request, 'googleetat');

  const exchanged = await exchangeCode({ config, code, expectedNonce });
  if (!exchanged.ok) return failure(request, 'googleechange');

  const signedIn = await signInWithGoogle(exchanged.identity);
  if (!signedIn.ok) {
    return failure(request, exchanged.identity.emailVerified ? 'google' : 'googlenonverifie');
  }

  const destination = new URL('/mon-espace', request.url);
  if (signedIn.created) destination.searchParams.set('bienvenue', '1');
  else if (signedIn.linked) destination.searchParams.set('rattache', '1');

  const response = NextResponse.redirect(destination, 303);
  response.cookies.delete(STATE_COOKIE);
  response.cookies.delete(NONCE_COOKIE);
  return response;
}

function parseCookies(header: string | null): Record<string, string> {
  if (!header) return {};
  const result: Record<string, string> = {};
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    const name = part.slice(0, index).trim();
    if (name) result[name] = decodeURIComponent(part.slice(index + 1).trim());
  }
  return result;
}
