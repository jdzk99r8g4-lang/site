import Link from 'next/link';
import { pageHref, pageWindow } from '@/lib/pagination';

/**
 * Navigation entre les pages d'une liste.
 *
 * De simples liens : pas de JavaScript, chaque page a une adresse, et un
 * moteur peut la suivre. `rel="prev"` et `rel="next"` disent la relation de
 * suite, ce qui aide aussi les navigateurs et les lecteurs d'écran.
 *
 * Les filtres en cours sont conservés dans chaque lien : perdre sa recherche
 * en passant à la page 2 est la façon la plus sûre de faire abandonner
 * quelqu'un.
 */
export function Pager({
  basePath,
  params,
  page,
  pageCount,
}: {
  basePath: string;
  params: Record<string, string | string[] | undefined>;
  page: number;
  pageCount: number;
}) {
  if (pageCount <= 1) return null;

  const numbers = pageWindow(page, pageCount);

  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Pages">
      {page > 1 ? (
        <Link
          href={pageHref(basePath, params, page - 1)}
          rel="prev"
          className="rounded-lg border border-line bg-card px-3.5 py-2 text-[13px] font-semibold no-underline transition-colors hover:border-line-hover hover:bg-card-hover"
        >
          ← Précédent
        </Link>
      ) : (
        <span className="rounded-lg border border-line px-3.5 py-2 text-[13px] font-semibold text-muted-2">
          ← Précédent
        </span>
      )}

      {numbers.map((value, index) =>
        value === null ? (
          <span key={`trou-${index}`} aria-hidden="true" className="px-1 text-muted-2">
            …
          </span>
        ) : value === page ? (
          <span
            key={value}
            aria-current="page"
            className="rounded-lg border border-accent bg-accent-bg px-3.5 py-2 text-[13px] font-semibold text-accent"
          >
            {value}
          </span>
        ) : (
          <Link
            key={value}
            href={pageHref(basePath, params, value)}
            aria-label={`Page ${value}`}
            className="rounded-lg border border-line bg-card px-3.5 py-2 text-[13px] font-semibold no-underline transition-colors hover:border-line-hover hover:bg-card-hover"
          >
            {value}
          </Link>
        ),
      )}

      {page < pageCount ? (
        <Link
          href={pageHref(basePath, params, page + 1)}
          rel="next"
          className="rounded-lg border border-line bg-card px-3.5 py-2 text-[13px] font-semibold no-underline transition-colors hover:border-line-hover hover:bg-card-hover"
        >
          Suivant →
        </Link>
      ) : (
        <span className="rounded-lg border border-line px-3.5 py-2 text-[13px] font-semibold text-muted-2">
          Suivant →
        </span>
      )}
    </nav>
  );
}

/** Ligne « Offres 25 à 48 sur 137 », au-dessus de la grille. */
/*
 * Le compteur est un titre de niveau 2, pas un paragraphe.
 *
 * Les cartes d'offres portent des titres de niveau 3. Sans rien entre le titre
 * de la page et elles, la structure sautait de h1 à h3 sur toutes les listes :
 * un lecteur d'écran, qui navigue de titre en titre, ne trouvait aucune
 * section « résultats » et tombait directement sur la première offre.
 */
export function PageCount({
  from,
  to,
  total,
  filteredFrom,
}: {
  from: number;
  to: number;
  total: number;
  /** Total avant filtrage, pour dire « sur 137 » quand un filtre est actif. */
  filteredFrom?: number;
}) {
  if (total === 0) {
    return (
      <h2 className="mt-6 mb-3.5 text-[15px] font-bold" aria-live="polite">
        Aucune offre
      </h2>
    );
  }

  const range = from === to ? `Offre ${from}` : `Offres ${from} à ${to}`;

  return (
    <h2 className="mt-6 mb-3.5 text-[15px] font-bold" aria-live="polite">
      {total <= to && from === 1 ? (
        <>
          {total} offre{total === 1 ? '' : 's'}
        </>
      ) : (
        <>
          {range} sur {total}
        </>
      )}
      {filteredFrom !== undefined && filteredFrom !== total ? (
        <span className="font-normal text-muted"> (catalogue : {filteredFrom})</span>
      ) : null}
    </h2>
  );
}
