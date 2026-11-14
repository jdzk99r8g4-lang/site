/**
 * POST /api/compte/mot-de-passe-oublie
 *
 * Toujours la même réponse, que le compte existe ou non.
 */

import { NextResponse } from 'next/server';
import { requestPasswordReset } from '@/lib/auth';
import { guarded } from '@/lib/form-route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = guarded('/mot-de-passe-oublie', async (request: Request) => {
  const form = await request.formData();
  const email = String(form.get('email') ?? '');

  const result = await requestPasswordReset(email);
  const url = new URL('/mot-de-passe-oublie', request.url);

  if (!result.ok) {
    url.searchParams.set('etat', 'adresse');
  } else {
    url.searchParams.set('etat', result.simulated ? 'simule' : 'envoye');
  }

  return NextResponse.redirect(url, 303);
});
