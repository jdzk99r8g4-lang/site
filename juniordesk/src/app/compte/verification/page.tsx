import Link from 'next/link';
import type { Metadata } from 'next';
import { verifyAccount } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Confirmation de votre compte',
  robots: { index: false, follow: false },
};

export default async function VerifyAccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = typeof params['jeton'] === 'string' ? params['jeton'] : '';
  const result = token
    ? await verifyAccount(token)
    : { ok: false as const, error: 'Lien incomplet.' };

  return (
    <main className="mx-auto max-w-xl px-5 py-14 sm:px-6">
      {result.ok ? (
        <>
          <h1 className="text-2xl font-extrabold">Adresse confirmée</h1>
          <p className="mt-3 text-sm text-muted">
            Votre compte est actif. Vous pouvez maintenant mettre des offres de côté et suivre
            vos candidatures.
          </p>
          <p className="mt-6">
            <Link
              href="/connexion?verifie=1"
              className="inline-block rounded-lg bg-cta px-[18px] py-2.5 text-sm font-bold text-cta-ink no-underline hover:bg-cta-hover"
            >
              Se connecter
            </Link>
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-extrabold">Confirmation impossible</h1>
          <p className="mt-3 text-sm text-muted">{result.error}</p>
          <p className="mt-6">
            <Link href="/inscription" className="text-accent">
              Recréer un compte →
            </Link>
          </p>
        </>
      )}
    </main>
  );
}
