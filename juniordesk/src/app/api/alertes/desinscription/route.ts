/**
 * Désinscription en un clic, telle que les messageries l'attendent.
 *
 * ---------------------------------------------------------------------------
 * Pourquoi une route séparée de la page
 * ---------------------------------------------------------------------------
 * La page `/alertes/desinscription` répond à un humain qui clique dans le
 * corps du message. Gmail, Outlook et les autres, eux, affichent leur propre
 * bouton « Se désabonner » à partir des en-têtes `List-Unsubscribe` et
 * `List-Unsubscribe-Post`, et ce bouton envoie un **POST** sans ouvrir de
 * page. Une page Next ne répond qu'en GET : sans cette route, l'en-tête
 * serait annoncé et ne fonctionnerait pas, ce qui est pire que de ne rien
 * annoncer.
 *
 * ---------------------------------------------------------------------------
 * Pourquoi cet en-tête compte plus qu'il n'en a l'air
 * ---------------------------------------------------------------------------
 * Sans bouton de désabonnement intégré, la personne qui ne veut plus de nos
 * messages utilise le seul bouton qu'elle voit : « signaler comme spam ».
 * Quelques plaintes suffisent à faire classer le domaine, et ce classement
 * frappe alors TOUTES les alertes du site, y compris celles que des gens
 * attendent. Le bouton de désabonnement n'est pas une politesse : c'est ce
 * qui protège la délivrabilité de tout le reste.
 *
 * La réponse est volontairement muette (204) : c'est une machine qui appelle,
 * et le corps ne sera lu par personne.
 */

import { NextResponse } from 'next/server';
import { unsubscribe } from '@/lib/alerts';

export const dynamic = 'force-dynamic';

function readToken(request: Request): string {
  const url = new URL(request.url);
  return url.searchParams.get('jeton') ?? '';
}

export async function POST(request: Request): Promise<NextResponse> {
  const token = readToken(request);
  if (!token) return new NextResponse(null, { status: 400 });

  const result = await unsubscribe(token);

  /*
   * Un jeton déjà utilisé renvoie quand même 204. Le but de l'appelant est
   * « que cette adresse ne reçoive plus rien » : si c'est déjà le cas, c'est
   * un succès. Répondre en erreur ferait réessayer la messagerie, et pourrait
   * lui faire croire que le mécanisme est cassé.
   */
  if (!result.ok) {
    console.warn(`[alertes] désinscription un-clic sans effet : ${result.error}`);
  }

  return new NextResponse(null, { status: 204 });
}

/**
 * Certaines messageries vérifient l'adresse en GET avant d'afficher le bouton.
 * On les renvoie vers la page lisible par un humain plutôt que de désinscrire
 * sur une simple visite : un analyseur de liens ne doit pas pouvoir couper les
 * alertes de quelqu'un en passant.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const token = readToken(request);
  const destination = new URL('/alertes/desinscription', request.url);
  if (token) destination.searchParams.set('jeton', token);
  return NextResponse.redirect(destination, 302);
}
