/**
 * POST /api/alertes — inscription à une alerte.
 *
 * Un POST de formulaire classique, suivi d'une redirection. Choisi exprès
 * plutôt qu'un appel en JavaScript : le formulaire fonctionne sans JS, et le
 * résultat a une URL que l'on peut recharger sans réenvoyer l'inscription.
 */

import { NextResponse } from 'next/server';
import { subscribe } from '@/lib/alerts';
import type { ContractGroup } from '@/lib/offer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const form = await request.formData();

  const email = String(form.get('email') ?? '');
  const groups = form.getAll('type').map(String) as ContractGroup[];
  const families = form.getAll('metier').map(String);
  const cities = form.getAll('ville').map(String);

  const result = await subscribe({ email, groups, families, cities });

  const url = new URL('/alertes', request.url);

  if (!result.ok) {
    url.searchParams.set('etat', result.error.includes('adresse') ? 'adresse' : 'envoi');
    return NextResponse.redirect(url, 303);
  }

  url.searchParams.set(
    'etat',
    result.alreadyConfirmed ? 'deja' : result.simulated ? 'simule' : 'envoye',
  );

  // 303 : le navigateur refait un GET sur la page de résultat. Sans cela, un
  // rechargement renverrait le formulaire.
  return NextResponse.redirect(url, 303);
}
