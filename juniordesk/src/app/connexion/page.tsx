import Link from 'next/link';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { currentAccount } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Se connecter',
  description: 'Accédez à vos offres enregistrées, vos candidatures et vos alertes.',
  robots: { index: false, follow: true },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (await currentAccount()) redirect('/mon-espace');

  const params = await searchParams;
  /*
   * Le message d'erreur est transmis tel quel par la route, qui le choisit
   * parmi un ensemble fermé. On le ré-affiche via un index plutôt que de
   * recopier du texte depuis l'URL : une page qui réaffiche ce qu'on lui
   * passe est une invitation à y glisser n'importe quoi.
   */
  const code = typeof params['erreur'] === 'string' ? params['erreur'] : '';
  const ERRORS: Record<string, string> = {
    identifiants: 'Adresse e-mail ou mot de passe incorrect.',
    nonverifie:
      'Votre adresse n’a pas encore été confirmée. Ouvrez l’e-mail reçu à l’inscription et ' +
      'cliquez le lien de confirmation.',
    tropdetentatives: 'Trop de tentatives. Réessayez dans un quart d’heure.',
  };
  const error = ERRORS[code];
  const verified = params['verifie'] === '1';

  return (
    <main className="mx-auto max-w-xl px-5 py-10 sm:px-6">
      <h1 className="text-2xl font-extrabold sm:text-3xl">Se connecter</h1>

      {verified ? (
        <p role="status" className="mt-6 rounded-card border border-accent/40 bg-accent-bg p-4 text-sm">
          Adresse confirmée. Vous pouvez maintenant vous connecter.
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="mt-6 rounded-card border border-warn/40 bg-warn-bg p-4 text-sm">
          {error}
        </p>
      ) : null}

      <form
        method="post"
        action="/api/compte/connexion"
        className="mt-7 rounded-card border border-line bg-card p-5 shadow-card"
      >
        <label className="block">
          <span className="block text-[15px] font-bold">Adresse e-mail</span>
          <input
            type="email"
            id="email-connexion"
            name="email"
            required
            autoComplete="email"
            className="mt-2 w-full rounded-xl px-[18px] py-[13px] text-sm"
          />
        </label>

        <label className="mt-5 block">
          <span className="block text-[15px] font-bold">Mot de passe</span>
          <input
            type="password"
            id="motdepasse-connexion"
            name="motdepasse"
            required
            autoComplete="current-password"
            className="mt-2 w-full rounded-xl px-[18px] py-[13px] text-sm"
          />
        </label>

        <button
          type="submit"
          className="mt-7 rounded-lg bg-cta px-[18px] py-2.5 text-sm font-bold text-cta-ink transition-colors hover:bg-cta-hover active:scale-[0.97]"
        >
          Se connecter
        </button>
      </form>

      <p className="mt-6 text-sm text-muted">
        Pas encore de compte ?{' '}
        <Link href="/inscription" className="text-accent">
          En créer un
        </Link>
      </p>

      {/*
       * Pas de « mot de passe oublié » tant que la fonction n'existe pas.
       * Un lien qui ne mène nulle part coûte plus de confiance qu'il n'en
       * rapporte ; la limite est dite franchement.
       */}
      <p className="mt-3 text-[13px] text-muted-2">
        La réinitialisation de mot de passe n’est pas encore en place. En attendant, écrivez-nous
        et nous supprimerons le compte pour que vous puissiez le recréer.
      </p>
    </main>
  );
}
