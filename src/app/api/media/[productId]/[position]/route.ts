/**
 * Sert un visuel produit depuis NOTRE domaine.
 *
 *   GET /api/media/<id-produit>/<n>
 *
 * POURQUOI CETTE ROUTE EXISTE.
 *
 * Les visuels relevés sont hébergés sur le CDN d'une place de marché. On peut
 * les afficher en pointant directement dessus, mais alors leur adresse est
 * écrite dans le HTML de la fiche : visible dans le code source, cliquable,
 * et copiable. Une fiche produit renverrait donc vers ailleurs, et notre site
 * cesserait d'être la seule source visible de ce qu'il vend.
 *
 * Cette route coupe le lien. Le navigateur ne connaît qu'un chemin de chez
 * nous ; la correspondance vers l'adresse d'origine se fait ici, côté
 * serveur, via `media-remote-sources.ts` qui n'arrive jamais dans le bundle.
 *
 * Elle n'ajoute aucun droit sur ces visuels : elle change seulement ce que le
 * visiteur voit. Les publier reste conditionné à l'accord du titulaire.
 *
 * CE QU'ELLE REFUSE, ET POURQUOI.
 *
 * Un proxy d'images ouvert est un cadeau : n'importe qui s'en sert pour
 * télécharger n'importe quoi en se cachant derrière votre serveur. Celui-ci
 * ne prend donc AUCUNE adresse en paramètre. Il ne connaît que des couples
 * (identifiant produit, position), et la liste des adresses est figée au
 * build. Il est impossible de lui faire chercher autre chose.
 */

import { NextResponse } from 'next/server';
import { getProductById } from '@/lib/catalog';
import { remoteMediaUrl } from '@/lib/media-remote-sources';

/** Types d'image acceptés en retour. Tout le reste est rejeté. */
const TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']);

/** Au-delà, ce n'est plus une photo de produit. */
const TAILLE_MAX = 12 * 1024 * 1024;

/**
 * Un an de cache, et `immutable`.
 *
 * L'adresse `/api/media/<id>/<n>` désigne toujours le même visuel : si le
 * fournisseur change sa photo, c'est `npm run media:remote` qui met la liste
 * à jour, et le déploiement qui suit invalide le cache. Rien ne justifie de
 * revalider à chaque vue — ce serait une requête chez eux par visiteur.
 */
const CACHE = 'public, max-age=31536000, s-maxage=31536000, immutable';

export const runtime = 'nodejs';

interface Params {
  params: Promise<{ productId: string; position: string }>;
}

export async function GET(_requete: Request, { params }: Params): Promise<Response> {
  const { productId, position } = await params;

  // Le produit doit exister au catalogue : sans cela la route servirait de
  // passerelle pour des visuels qu'on ne vend plus.
  if (!getProductById(productId)) {
    return new NextResponse('inconnu', { status: 404 });
  }

  const rang = Number.parseInt(position, 10);
  if (!Number.isInteger(rang) || rang < 1) {
    return new NextResponse('position invalide', { status: 400 });
  }

  const source = remoteMediaUrl(productId, rang);
  if (!source) {
    return new NextResponse('inconnu', { status: 404 });
  }

  let amont: Response;
  try {
    amont = await fetch(source, {
      // Le CDN voit une requête de notre serveur, pas du visiteur : son
      // adresse IP et son navigateur ne sortent pas de chez nous.
      headers: { Accept: 'image/avif,image/webp,image/jpeg,image/png,*/*;q=0.8' },
      // Un visuel produit ne change pas : on laisse le cache de Next faire
      // son travail plutôt que de redemander à chaque requête.
      next: { revalidate: 86_400 },
    });
  } catch {
    return new NextResponse('amont injoignable', { status: 502 });
  }

  if (!amont.ok) {
    // On ne renvoie PAS le code du CDN tel quel : un 403 de leur part n'est
    // pas une erreur du visiteur, c'est une panne de notre côté.
    return new NextResponse('amont indisponible', { status: 502 });
  }

  const type = (amont.headers.get('Content-Type') ?? '').split(';')[0]?.trim().toLowerCase() ?? '';
  if (!TYPES.has(type)) {
    return new NextResponse('type inattendu', { status: 502 });
  }

  const longueur = Number.parseInt(amont.headers.get('Content-Length') ?? '', 10);
  if (Number.isInteger(longueur) && longueur > TAILLE_MAX) {
    return new NextResponse('trop volumineux', { status: 502 });
  }

  const octets = await amont.arrayBuffer();
  if (octets.byteLength > TAILLE_MAX) {
    return new NextResponse('trop volumineux', { status: 502 });
  }

  return new NextResponse(octets, {
    status: 200,
    headers: {
      'Content-Type': type,
      'Content-Length': String(octets.byteLength),
      'Cache-Control': CACHE,
      // Rien dans la réponse ne doit révéler l'amont.
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
