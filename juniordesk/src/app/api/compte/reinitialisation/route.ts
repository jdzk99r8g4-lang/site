/**
 * POST /api/compte/reinitialisation
 *
 * Change le mot de passe à partir d'un lien valide, puis renvoie vers la
 * connexion. On ne connecte PAS automatiquement : si le lien a été intercepté,
 * ouvrir une session dans la foulée donnerait l'accès sans que rien ne soit
 * demandé de plus.
 */

import { NextResponse } from 'next/server';
import { resetPassword } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const form = await request.formData();
  const token = String(form.get('jeton') ?? '');
  const password = String(form.get('motdepasse') ?? '');
  const confirmation = String(form.get('confirmation') ?? '');

  const back = new URL('/mot-de-passe/reinitialisation', request.url);
  back.searchParams.set('jeton', token);

  if (password !== confirmation) {
    back.searchParams.set('echec', 'different');
    return NextResponse.redirect(back, 303);
  }

  const result = await resetPassword(token, password);

  if (!result.ok) {
    // Un mot de passe refusé renvoie au formulaire, le lien étant encore bon ;
    // un lien mort renvoie en demander un nouveau.
    if (result.reason === 'motdepasse') {
      back.searchParams.set('echec', 'motdepasse');
      return NextResponse.redirect(back, 303);
    }
    const expired = new URL('/mot-de-passe-oublie', request.url);
    expired.searchParams.set('etat', 'lienmort');
    return NextResponse.redirect(expired, 303);
  }

  return NextResponse.redirect(new URL('/connexion?motdepasse=change', request.url), 303);
}
