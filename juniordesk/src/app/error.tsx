'use client';

/**
 * Page affichée quand le rendu d'une page échoue.
 *
 * Sans elle, une page qui lève une exception — le magasin d'offres
 * injoignable, par exemple — affiche l'écran d'erreur générique du serveur,
 * sans en-tête, sans lien, sans rien qui ressemble au site. Celle-ci garde
 * l'habillage et propose les deux gestes utiles : réessayer, ou repartir de
 * l'accueil.
 *
 * Le détail de l'erreur n'est pas affiché : il n'aiderait pas le visiteur et
 * pourrait en dire trop. Il est dans les journaux du serveur.
 */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto max-w-xl px-5 py-14 sm:px-6">
      <h1 className="text-2xl font-extrabold">Cette page n’a pas pu s’afficher</h1>
      <p className="mt-3 text-sm text-muted">
        Un incident de notre côté, pas une erreur de votre part. Il est généralement
        passager : réessayez dans un instant.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg transition-opacity hover:opacity-90"
        >
          Réessayer
        </button>
        <a
          href="/"
          className="rounded-lg border border-line px-4 py-2 text-sm font-semibold no-underline transition-colors hover:border-line-hover"
        >
          Retour à l’accueil
        </a>
      </div>
    </main>
  );
}
