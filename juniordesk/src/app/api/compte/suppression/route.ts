/**
 * POST /api/compte/suppression
 *
 * Supprime le compte, ses sessions et l'alerte e-mail qui partage son
 * identifiant. Rien n'est conservé « au cas où ».
 */

import { NextResponse } from 'next/server';
import { deleteOwnAccount } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const form = await request.formData();

  // Confirmation explicite : la case doit être cochée. Un bouton seul se
  // clique par erreur, et la suppression est irréversible.
  if (form.get('confirmation') !== 'oui') {
    return NextResponse.redirect(new URL('/mon-espace?erreur=confirmation', request.url), 303);
  }

  const deleted = await deleteOwnAccount();
  return NextResponse.redirect(
    new URL(deleted ? '/?compte=supprime' : '/connexion', request.url),
    303,
  );
}
