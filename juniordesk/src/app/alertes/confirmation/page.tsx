import Link from 'next/link';
import type { Metadata } from 'next';
import { confirm } from '@/lib/alerts';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Confirmation de votre alerte',
  robots: { index: false, follow: false },
};

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = typeof params['jeton'] === 'string' ? params['jeton'] : '';
  const result = token ? await confirm(token) : { ok: false as const, error: 'Lien incomplet.' };

  return (
    <main className="mx-auto max-w-xl px-5 py-14 sm:px-6">
      {result.ok ? (
        <>
          <h1 className="text-2xl font-extrabold">Alerte confirmée</h1>
          <p className="mt-3 text-sm text-muted">
            Vous recevrez les nouvelles offres correspondant à : <strong className="text-ink">{result.criteria}</strong>.
          </p>
          <p className="mt-3 text-sm text-muted">
            La collecte tourne une fois par jour : vous ne recevrez un e-mail que les jours où
            une offre correspond réellement à vos critères. Jamais pour ne rien dire.
          </p>
          <p className="mt-6">
            <Link
              href="/offres"
              className="inline-block rounded-lg bg-cta px-[18px] py-2.5 text-sm font-bold text-cta-ink no-underline hover:bg-cta-hover"
            >
              Voir les offres en ligne
            </Link>
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-extrabold">Confirmation impossible</h1>
          <p className="mt-3 text-sm text-muted">{result.error}</p>
          <p className="mt-6">
            <Link href="/alertes" className="text-accent">
              Recréer une alerte →
            </Link>
          </p>
        </>
      )}
    </main>
  );
}
