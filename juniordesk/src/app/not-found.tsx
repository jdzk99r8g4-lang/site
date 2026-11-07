import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-5 py-16 sm:px-6">
      <h1 className="text-2xl font-extrabold">Cette page n’existe pas</h1>
      <p className="mt-3 text-sm text-muted">
        Si vous suiviez un lien vers une offre, elle a probablement été retirée ou a expiré :
        les offres disparaissent de ce site dès qu’elles ne sont plus actives chez
        l’employeur.
      </p>
      <p className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/offres"
          className="inline-block rounded-lg bg-cta px-[18px] py-2.5 text-sm font-bold text-cta-ink no-underline hover:bg-cta-hover"
        >
          Voir les offres en ligne
        </Link>
        <Link
          href="/alertes"
          className="inline-block rounded-lg border border-line bg-card px-[18px] py-2.5 text-sm font-bold no-underline hover:border-line-hover"
        >
          Créer une alerte
        </Link>
      </p>
    </main>
  );
}
