import Link from 'next/link';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { brand } from '@/lib/brand';
import { currentAccount, MIN_PASSWORD_LENGTH } from '@/lib/auth';
import { GoogleButton } from '@/components/google-button';
import { ServiceUnavailable } from '@/components/service-unavailable';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Créer un compte',
  description:
    'Créez un compte gratuit pour mettre des offres de côté, suivre vos candidatures et ' +
    'retrouver vos alertes au même endroit.',
};

const MESSAGES: Record<string, { tone: 'ok' | 'ko'; text: string }> = {
  envoye: {
    tone: 'ok',
    text:
      'Presque fini : ouvrez l’e-mail que nous venons d’envoyer et cliquez le lien de ' +
      'confirmation. Sans ce clic, le compte reste inactif — c’est ce qui empêche ' +
      'quelqu’un d’inscrire votre adresse à votre place.',
  },
  simule: {
    tone: 'ok',
    text:
      'Compte enregistré, mais aucun e-mail n’est parti : la clé Resend n’est pas ' +
      'configurée, les messages sont écrits dans la console du serveur.',
  },
  adresse: { tone: 'ko', text: 'Cette adresse e-mail ne semble pas valide.' },
  motdepasse: {
    tone: 'ko',
    text: `Le mot de passe doit faire au moins ${MIN_PASSWORD_LENGTH} caractères et ne pas être trop courant.`,
  },
  envoi: { tone: 'ko', text: 'L’e-mail n’a pas pu être envoyé. Réessayez dans un moment.' },
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Déjà connecté : la page d'inscription n'a plus de sens.
  if (await currentAccount()) redirect('/mon-espace');

  const params = await searchParams;
  const state = typeof params['etat'] === 'string' ? params['etat'] : '';
  const message = MESSAGES[state];

  return (
    <main className="mx-auto max-w-xl px-5 py-10 sm:px-6">
      <h1 className="text-2xl font-extrabold sm:text-3xl">Créer un compte</h1>
      <ServiceUnavailable params={params} />
      <p className="mt-2 text-sm text-muted">
        Gratuit, et sans contrepartie : {brand.name} ne vend rien aux étudiants et ne revend
        aucune donnée. Un compte sert à mettre des offres de côté, à noter celles où vous avez
        postulé, et à retrouver vos alertes.
      </p>

      {message ? (
        <p
          role="status"
          className={`mt-6 rounded-card border p-4 text-sm ${
            message.tone === 'ok'
              ? 'border-accent/40 bg-accent-bg text-ink'
              : 'border-warn/40 bg-warn-bg text-ink'
          }`}
        >
          {message.text}
        </p>
      ) : null}

      <GoogleButton label="S’inscrire avec Google" />

      <form
        method="post"
        action="/api/compte/inscription"
        className="mt-5 rounded-card border border-line bg-card p-5 shadow-card"
      >
        <label className="block">
          <span className="block text-[15px] font-bold">Adresse e-mail</span>
          <input
            type="email"
            id="email"
            name="email"
            required
            autoComplete="email"
            placeholder="prenom.nom@exemple.fr"
            className="mt-2 w-full rounded-xl px-[18px] py-[13px] text-sm"
          />
        </label>

        <label className="mt-5 block">
          <span className="block text-[15px] font-bold">Mot de passe</span>
          <input
            type="password"
            id="motdepasse"
            name="motdepasse"
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            className="mt-2 w-full rounded-xl px-[18px] py-[13px] text-sm"
          />
          <span className="mt-1.5 block text-[13px] text-muted">
            {MIN_PASSWORD_LENGTH} caractères minimum. Pas d’obligation de majuscule ni de
            caractère spécial : la longueur protège davantage que les règles de composition.
          </span>
        </label>

        <button
          type="submit"
          className="mt-7 rounded-lg bg-cta px-[18px] py-2.5 text-sm font-bold text-cta-ink transition-colors hover:bg-cta-hover active:scale-[0.97]"
        >
          Créer mon compte
        </button>

        <p className="mt-4 text-[13px] text-muted">
          Nous conservons votre adresse, votre mot de passe sous forme chiffrée et les offres
          que vous mettez de côté. Rien d’autre : ni nom, ni école, ni CV.{' '}
          <Link href="/confidentialite" className="text-accent">
            Détail et vos droits
          </Link>
          .
        </p>
      </form>

      <p className="mt-6 text-sm text-muted">
        Vous avez déjà un compte ?{' '}
        <Link href="/connexion" className="text-accent">
          Se connecter
        </Link>
      </p>
    </main>
  );
}
