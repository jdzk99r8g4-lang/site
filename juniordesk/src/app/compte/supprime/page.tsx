import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compte supprimé',
  robots: { index: false, follow: false },
};

/**
 * Confirmation de la suppression d'un compte.
 *
 * La suppression renvoyait vers l'accueil avec `?compte=supprime`, que
 * l'accueil ne lisait pas : la personne venait de faire la seule action
 * irréversible du site et n'en recevait aucune confirmation. Elle ne pouvait
 * savoir si c'était fait qu'en essayant de se reconnecter.
 *
 * Une page à part plutôt qu'un message sur l'accueil : lire un paramètre
 * d'adresse obligerait l'accueil à être recalculé à chaque visite, pour un
 * message que presque personne ne verra jamais.
 */
export default function AccountDeletedPage() {
  return (
    <main className="mx-auto max-w-xl px-5 py-14 sm:px-6">
      <h1 className="text-2xl font-extrabold">Votre compte est supprimé</h1>
      <p className="mt-3 text-sm text-muted">
        Votre adresse, votre mot de passe, vos offres enregistrées, vos candidatures notées et
        votre alerte e-mail ont été effacés. Nous ne gardons rien.
      </p>
      <p className="mt-3 text-sm text-muted">
        Les offres restent consultables sans compte, comme avant.
      </p>
      <p className="mt-6">
        <Link href="/offres" className="text-accent">
          Voir les offres →
        </Link>
      </p>
    </main>
  );
}
