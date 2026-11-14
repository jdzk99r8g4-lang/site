import Link from 'next/link';
import type { Metadata } from 'next';
import { brand } from '@/lib/brand';
import { ServiceUnavailable } from '@/components/service-unavailable';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  description: 'Recevoir un lien pour choisir un nouveau mot de passe.',
  title: 'Mot de passe oublié',
  robots: { index: false, follow: true },
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const state = typeof params['etat'] === 'string' ? params['etat'] : '';

  return (
    <main className="mx-auto max-w-xl px-5 py-10 sm:px-6">
      <h1 className="text-2xl font-extrabold sm:text-3xl">Mot de passe oublié</h1>
      <ServiceUnavailable params={params} />
      <p className="mt-2 text-sm text-muted">
        Indiquez l’adresse de votre compte. Nous vous enverrons un lien pour choisir un
        nouveau mot de passe.
      </p>

      {state === 'envoye' ? (
        <p role="status" className="mt-6 rounded-card border border-accent/40 bg-accent-bg p-4 text-sm">
          Si un compte {brand.name} existe à cette adresse, un lien vient d’y être envoyé.
          Il expire dans une heure et ne fonctionne qu’une seule fois. Pensez à regarder dans
          les indésirables.
        </p>
      ) : null}

      {state === 'simule' ? (
        <p role="status" className="mt-6 rounded-card border border-accent/40 bg-accent-bg p-4 text-sm">
          Demande enregistrée, mais aucun e-mail n’est parti : la clé Resend n’est pas
          configurée sur cet environnement.
        </p>
      ) : null}

      {state === 'lienmort' ? (
        <p role="alert" className="mt-6 rounded-card border border-warn/40 bg-warn-bg p-4 text-sm">
          Ce lien avait expiré ou avait déjà servi. Les liens de réinitialisation ne durent
          qu’une heure et ne fonctionnent qu’une fois. Demandez-en un nouveau ci-dessous.
        </p>
      ) : null}

      {state === 'adresse' ? (
        <p role="alert" className="mt-6 rounded-card border border-warn/40 bg-warn-bg p-4 text-sm">
          Cette adresse e-mail ne semble pas valide.
        </p>
      ) : null}

      <form
        method="post"
        action="/api/compte/mot-de-passe-oublie"
        className="mt-7 rounded-card border border-line bg-card p-5 shadow-card"
      >
        <label className="block">
          <span className="block text-[15px] font-bold">Adresse e-mail</span>
          <input
            type="email"
            id="email-oubli"
            name="email"
            required
            autoComplete="email"
            className="mt-2 w-full rounded-xl px-[18px] py-[13px] text-sm"
          />
        </label>

        <button
          type="submit"
          className="mt-6 rounded-lg bg-cta px-[18px] py-2.5 text-sm font-bold text-cta-ink transition-colors hover:bg-cta-hover active:scale-[0.97]"
        >
          Recevoir le lien
        </button>
      </form>

      {/*
       * La réponse est identique que le compte existe ou non. On le dit, plutôt
       * que de laisser croire à un bug quand aucun e-mail n'arrive : c'est ce
       * qui empêche ce formulaire de servir à savoir qui est inscrit ici.
       */}
      <p className="mt-5 text-[13px] text-muted-2">
        Nous répondons la même chose que l’adresse corresponde à un compte ou non. C’est
        volontaire : sans cela, ce formulaire permettrait de savoir qui possède un compte ici.
      </p>

      <p className="mt-6 text-sm text-muted">
        <Link href="/connexion" className="text-accent">
          Retour à la connexion
        </Link>
      </p>
    </main>
  );
}
