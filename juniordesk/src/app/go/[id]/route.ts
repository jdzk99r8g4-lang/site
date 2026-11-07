/**
 * GET /go/[id] — redirection comptée vers l'employeur.
 *
 * ---------------------------------------------------------------------------
 * Pourquoi passer par ici plutôt que de mettre le lien en dur
 * ---------------------------------------------------------------------------
 * C'est la seule mesure d'utilité réelle du site : le nombre de pages vues ne
 * dit rien, le nombre de candidats effectivement envoyés chez un employeur dit
 * tout. Et c'est aussi ce qui permettra, plus tard, de démontrer une valeur à
 * un employeur qui voudrait sponsoriser une offre.
 *
 * ---------------------------------------------------------------------------
 * Ce que cette route ne fait PAS, et c'est important
 * ---------------------------------------------------------------------------
 * Elle ne redirige JAMAIS vers une adresse fournie dans l'URL. La cible est
 * lue dans l'offre stockée, à partir de son identifiant. Une route de
 * redirection qui accepte une adresse en paramètre est une redirection
 * ouverte : elle sert aussitôt à faire passer un lien d'hameçonnage pour un
 * lien de notre domaine.
 *
 * Elle n'écrit aucun cookie et n'enregistre aucune adresse IP. Les compteurs
 * sont des totaux.
 */

import { NextResponse } from 'next/server';
import { findOfferById } from '@/lib/offers';
import { recordOfferClick } from '@/lib/stats';
import { readToken } from '@/lib/tokens';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const offer = await findOfferById(decodeURIComponent(id));

  if (!offer) {
    // Offre expirée ou retirée entre-temps : on renvoie vers la liste plutôt
    // que d'afficher une erreur, le visiteur cherche un poste, pas un code.
    return NextResponse.redirect(new URL('/offres?retiree=1', request.url), 302);
  }

  const url = new URL(request.url);

  /*
   * Attribution du clic à un inscrit, UNIQUEMENT si le lien vient d'un e-mail
   * d'alerte et porte un jeton signé valide. Les inscrits ont consenti, et la
   * politique de confidentialité le dit explicitement. Pour tout autre
   * visiteur, aucune attribution : le clic n'est qu'un total de plus.
   */
  let subscriptionId: string | null = null;
  const token = url.searchParams.get('a');
  if (token && url.searchParams.get('src') === 'alerte') {
    const read = readToken(token, 'click');
    if (read.ok) subscriptionId = read.subject;
  }

  await recordOfferClick({
    offerId: offer.id,
    families: offer.families,
    citySlug: offer.place.citySlug,
    subscriptionId,
  });

  /*
   * 302 et non 301 : la cible d'une offre peut changer, et une redirection
   * permanente serait mise en cache par les navigateurs pour toujours.
   */
  const response = NextResponse.redirect(offer.applyUrl, 302);
  // Ne pas transmettre notre URL (qui contient le jeton) au site de l'employeur.
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}
