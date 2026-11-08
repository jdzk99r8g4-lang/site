import Link from 'next/link';
import type { Metadata } from 'next';
import { checkResetToken, MIN_PASSWORD_LENGTH } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Nouveau mot de passe',
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = typeof params['jeton'] === 'string' ? params['jeton'] : '';
  const failed = params['echec'];

  /*
   * Le lien est vérifié AVANT d'afficher le formulaire. Faire saisir deux fois
   * un mot de passe pour annoncer ensuite que le lien avait expiré serait une
   * perte de temps gratuite.
   */
  const check = token
    ? await checkResetToken(token)
    : { ok: false as const, error: 'Lien incomplet.' };

  if (!check.ok) {
    return (
      <main className="mx-auto max-w-xl px-5 py-14 sm:px-6">
        <h1 className="text-2xl font-extrabold">Lien inutilisable</h1>
        <p className="mt-3 text-sm text-muted">{check.error}</p>
        <p className="mt-6">
          <Link
            href="/mot-de-passe-oublie"
            className="inline-block rounded-lg bg-cta px-[18px] py-2.5 text-sm font-bold text-cta-ink no-underline hover:bg-cta-hover"
          >
            Demander un nouveau lien
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-5 py-10 sm:px-6">
      <h1 className="text-2xl font-extrabold sm:text-3xl">Choisir un nouveau mot de passe</h1>

      {failed === 'motdepasse' ? (
        <p role="alert" className="mt-6 rounded-card border border-warn/40 bg-warn-bg p-4 text-sm">
          Le mot de passe doit faire au moins {MIN_PASSWORD_LENGTH} caractères et ne pas être
          trop courant.
        </p>
      ) : null}

      {failed === 'different' ? (
        <p role="alert" className="mt-6 rounded-card border border-warn/40 bg-warn-bg p-4 text-sm">
          Les deux mots de passe saisis ne sont pas identiques.
        </p>
      ) : null}

      <form
        method="post"
        action="/api/compte/reinitialisation"
        className="mt-7 rounded-card border border-line bg-card p-5 shadow-card"
      >
        <input type="hidden" name="jeton" value={token} />

        <label className="block">
          <span className="block text-[15px] font-bold">Nouveau mot de passe</span>
          <input
            type="password"
            id="nouveau"
            name="motdepasse"
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            className="mt-2 w-full rounded-xl px-[18px] py-[13px] text-sm"
          />
          <span className="mt-1.5 block text-[13px] text-muted">
            {MIN_PASSWORD_LENGTH} caractères minimum.
          </span>
        </label>

        <label className="mt-5 block">
          <span className="block text-[15px] font-bold">Confirmer</span>
          <input
            type="password"
            id="confirmation-mdp"
            name="confirmation"
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            className="mt-2 w-full rounded-xl px-[18px] py-[13px] text-sm"
          />
        </label>

        <button
          type="submit"
          className="mt-7 rounded-lg bg-cta px-[18px] py-2.5 text-sm font-bold text-cta-ink transition-colors hover:bg-cta-hover active:scale-[0.97]"
        >
          Changer mon mot de passe
        </button>

        <p className="mt-4 text-[13px] text-muted">
          Toutes vos sessions ouvertes seront fermées, y compris sur vos autres appareils.
          Si quelqu’un d’autre avait accès à votre compte, c’est ce qui l’en éjecte.
        </p>
      </form>
    </main>
  );
}
