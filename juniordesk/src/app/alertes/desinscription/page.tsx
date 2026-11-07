import Link from 'next/link';
import type { Metadata } from 'next';
import { unsubscribe } from '@/lib/alerts';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Désinscription',
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = typeof params['jeton'] === 'string' ? params['jeton'] : '';
  const result = token ? await unsubscribe(token) : { ok: false, error: 'Lien incomplet.' };

  return (
    <main className="mx-auto max-w-xl px-5 py-14 sm:px-6">
      {result.ok ? (
        <>
          <h1 className="text-2xl font-extrabold">Désinscription effectuée</h1>
          <p className="mt-3 text-sm text-muted">
            Votre adresse et vos critères ont été supprimés. Nous ne gardons rien « au cas
            où » : il n’y a plus aucune trace de cette alerte.
          </p>
          <p className="mt-6">
            <Link href="/offres" className="text-accent">
              Continuer à consulter les offres →
            </Link>
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-extrabold">Désinscription impossible</h1>
          <p className="mt-3 text-sm text-muted">{result.error}</p>
          <p className="mt-3 text-sm text-muted">
            Vous pouvez aussi répondre à n’importe lequel de nos e-mails pour demander la
            suppression : nous la ferons à la main.
          </p>
        </>
      )}
    </main>
  );
}
