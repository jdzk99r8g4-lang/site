/**
 * POST /api/compte/offre
 *
 * Met une offre de côté, ou la retire ; marque une candidature, ou l'annule.
 * Renvoie la personne d'où elle vient.
 */

import { NextResponse } from 'next/server';
import { currentAccount, toggleApplication, toggleSavedOffer } from '@/lib/auth';
import { guarded } from '@/lib/form-route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = guarded('/mon-espace', async (request: Request) => {
  const account = await currentAccount();
  if (!account) {
    return NextResponse.redirect(new URL('/connexion', request.url), 303);
  }

  const form = await request.formData();
  const offerId = String(form.get('offre') ?? '');
  const action = String(form.get('action') ?? '');
  const back = String(form.get('retour') ?? '/offres');

  if (offerId) {
    if (action === 'candidature') await toggleApplication(offerId);
    else await toggleSavedOffer(offerId);
  }

  /*
   * L'adresse de retour vient du formulaire, donc du navigateur : on
   * n'accepte qu'un chemin interne. Sans ce contrôle, la route devient une
   * redirection ouverte, utilisable pour faire passer un lien d'hameçonnage
   * pour un lien de notre domaine.
   */
  const safeBack = back.startsWith('/') && !back.startsWith('//') ? back : '/offres';
  return NextResponse.redirect(new URL(safeBack, request.url), 303);
});
