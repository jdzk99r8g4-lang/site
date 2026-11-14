/**
 * POST /api/compte/connexion
 *
 * En cas d'échec, seul un code d'erreur circule dans l'URL, jamais l'adresse
 * saisie : une URL finit dans un historique, dans les journaux d'un proxy et
 * dans l'en-tête Referer envoyé aux sites tiers.
 */

import { NextResponse } from 'next/server';
import { login } from '@/lib/auth';
import { guarded } from '@/lib/form-route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = guarded('/connexion', async (request: Request) => {
  const form = await request.formData();
  const email = String(form.get('email') ?? '');
  const password = String(form.get('motdepasse') ?? '');

  const result = await login({ email, password });

  if (result.ok) {
    return NextResponse.redirect(new URL('/mon-espace', request.url), 303);
  }

  const url = new URL('/connexion', request.url);
  url.searchParams.set(
    'erreur',
    result.error.includes('Trop de tentatives') ? 'tropdetentatives'
      : result.error.includes('confirmée') ? 'nonverifie'
      : 'identifiants',
  );
  return NextResponse.redirect(url, 303);
});
