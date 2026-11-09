/**
 * GET /api/compte/export — tout ce que le site détient sur la personne.
 *
 * ---------------------------------------------------------------------------
 * Pourquoi cette route existe
 * ---------------------------------------------------------------------------
 * Le droit d'accès et le droit à la portabilité sont opposables : la personne
 * peut exiger de savoir ce qui est conservé sur elle, et de l'emporter dans
 * un format lisible par une machine. La politique de confidentialité les
 * annonçait tous les deux et renvoyait à une adresse e-mail — ce qui est
 * recevable mais lent, et suppose que quelqu'un lise cette boîte.
 *
 * Un bouton qui télécharge un fichier répond en une seconde, sans
 * intervention humaine, et vaut mieux qu'une promesse de répondre sous un
 * mois.
 *
 * ---------------------------------------------------------------------------
 * Ce qui n'y figure pas, et pourquoi
 * ---------------------------------------------------------------------------
 * L'empreinte du mot de passe. Ce n'est pas une donnée utile à la personne —
 * elle ne peut rien en faire, pas même retrouver son mot de passe — et c'est
 * un secret dont la diffusion ne présente que des risques. Le fichier le dit
 * plutôt que de faire silence.
 *
 * Les jetons de session non plus : ils sont éphémères, et en exporter un
 * reviendrait à écrire dans un fichier de quoi se faire passer pour la
 * personne.
 */

import { NextResponse } from 'next/server';
import { currentAccount } from '@/lib/auth';
import { getStore } from '@/lib/store';
import { brand } from '@/lib/brand';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const account = await currentAccount();
  if (!account) {
    return NextResponse.json({ error: 'non connecte' }, { status: 401 });
  }

  const subscription = await getStore().getSubscription(account.id);

  const data = {
    exporteLe: new Date().toISOString(),
    site: brand.url,
    compte: {
      email: account.email,
      creeLe: account.createdAt,
      confirmeLe: account.verifiedAt,
      derniereConnexion: account.lastLoginAt,
      connexionGoogleRattachee: account.googleId !== null,
      motDePasseDefini: account.passwordHash !== null,
      offresEnregistrees: account.savedOfferIds,
      candidaturesNotees: account.applications,
    },
    alerte: subscription
      ? {
          confirmee: subscription.confirmed,
          creeeLe: subscription.createdAt,
          confirmeeLe: subscription.confirmedAt,
          dernierEnvoi: subscription.lastSentAt,
          criteres: {
            metiers: subscription.families,
            villes: subscription.cities,
            typesDeContrat: subscription.groups,
          },
        }
      : null,
    nonInclus: {
      motDePasse:
        'L’empreinte du mot de passe n’est pas exportée : elle ne vous apprendrait rien et ' +
        'sa diffusion ne présente que des risques.',
      sessions:
        'Les jetons de session ne sont pas exportés : ils permettraient de se faire passer ' +
        'pour vous.',
      mesureDAudience:
        'Les compteurs de pages vues et de clics sont des totaux mensuels anonymes, sans ' +
        'identifiant de visiteur : rien n’y est rattaché à vous et il n’y a donc rien à ' +
        'en extraire.',
    },
  };

  const jour = new Date().toISOString().slice(0, 10);

  return new NextResponse(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="juniordesk-mes-donnees-${jour}.json"`,
      // Des données personnelles n'ont rien à faire dans un cache partagé.
      'cache-control': 'no-store, private',
    },
  });
}
