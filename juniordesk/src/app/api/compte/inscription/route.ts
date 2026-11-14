/**
 * POST /api/compte/inscription
 *
 * POST de formulaire suivi d'une redirection : le parcours fonctionne sans
 * JavaScript, et recharger la page de résultat ne renvoie pas le formulaire.
 */

import { NextResponse } from 'next/server';
import { register } from '@/lib/auth';
import { guarded } from '@/lib/form-route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = guarded('/inscription', async (request: Request) => {
  const form = await request.formData();
  const email = String(form.get('email') ?? '');
  const password = String(form.get('motdepasse') ?? '');

  const result = await register({ email, password });
  const url = new URL('/inscription', request.url);

  if (!result.ok) {
    url.searchParams.set(
      'etat',
      result.error.includes('adresse') ? 'adresse'
        : result.error.includes('mot de passe') ? 'motdepasse'
        : 'envoi',
    );
    return NextResponse.redirect(url, 303);
  }

  url.searchParams.set('etat', result.simulated ? 'simule' : 'envoye');
  return NextResponse.redirect(url, 303);
});
