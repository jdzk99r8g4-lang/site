/**
 * Repli des routes de formulaire quand quelque chose casse.
 *
 * ---------------------------------------------------------------------------
 * Ce que voyait le visiteur
 * ---------------------------------------------------------------------------
 * Une route de formulaire qui lève une exception — magasin injoignable,
 * secret de signature absent, n'importe quoi d'imprévu — renvoyait la page
 * d'erreur 500 du serveur : une page blanche avec « Internal Server Error »,
 * à l'adresse `/api/compte/connexion`, sans lien pour revenir. Constaté en
 * lançant le site sans `ALERTS_SECRET` : le garde-fou qui refuse de signer
 * sans secret faisait bien son travail, mais c'est le visiteur qui recevait
 * l'exception en pleine figure.
 *
 * Le garde-fou reste bruyant — l'erreur est journalisée telle quelle, c'est
 * à l'exploitant de la voir. Le visiteur, lui, est ramené au formulaire avec
 * un message qui dit la seule chose utile pour lui : ce n'est pas sa faute,
 * et réessayer plus tard a un sens.
 *
 * SERVEUR UNIQUEMENT.
 */

import { NextResponse } from 'next/server';

/** Valeur du paramètre `erreur` que les pages savent afficher. */
export const UNAVAILABLE = 'indisponible';

type Handler = (request: Request) => Promise<Response>;

/**
 * Enveloppe une route de formulaire.
 *
 * `fallbackPath` est la page vers laquelle revenir : celle du formulaire, là
 * où le message sera lu. La redirection est un 303, comme toutes celles des
 * formulaires du site, pour que le navigateur reparte en GET et qu'un
 * rechargement ne renvoie pas le formulaire.
 */
export function guarded(fallbackPath: string, handler: Handler): Handler {
  return async (request) => {
    try {
      return await handler(request);
    } catch (error) {
      const path = new URL(request.url).pathname;
      console.error(`[formulaire] ${path} a échoué, visiteur renvoyé vers ${fallbackPath} :`, error);

      const url = new URL(fallbackPath, request.url);
      url.searchParams.set('erreur', UNAVAILABLE);
      return NextResponse.redirect(url, 303);
    }
  };
}
