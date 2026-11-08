import { describe, it, expect } from 'vitest';
import { PER_PAGE, pageHref, pageWindow, paginate, parsePageParam } from '@/lib/pagination';
import { hasActiveFilters, parseSearchParams } from '@/lib/query-params';

const items = Array.from({ length: 137 }, (_, i) => i + 1);

describe('découpage', () => {
  it('rend la bonne tranche et les bons rangs', () => {
    const first = paginate(items, 1, 24);
    expect(first.items).toHaveLength(24);
    expect(first.items[0]).toBe(1);
    expect(first).toMatchObject({ page: 1, pageCount: 6, total: 137, from: 1, to: 24 });

    const second = paginate(items, 2, 24);
    expect(second.items[0]).toBe(25);
    expect(second).toMatchObject({ from: 25, to: 48 });
  });

  it('la dernière page n’est pas pleine, et ses rangs sont exacts', () => {
    const last = paginate(items, 6, 24);
    expect(last.items).toHaveLength(137 - 5 * 24);
    expect(last).toMatchObject({ from: 121, to: 137, pageCount: 6 });
  });

  it('ramène dans les bornes au lieu de rendre une page vide', () => {
    /*
     * Renvoyer une erreur pour « page=999 » n'aide personne. On sert la
     * dernière page, mais on marque le cas pour que la page ne soit pas
     * indexée : sinon un moteur référencerait autant d'adresses que de
     * numéros inventés.
     */
    expect(paginate(items, 999, 24)).toMatchObject({ page: 6, clamped: true });
    expect(paginate(items, 0, 24)).toMatchObject({ page: 1, clamped: true });
    expect(paginate(items, -5, 24)).toMatchObject({ page: 1, clamped: true });
    expect(paginate(items, Number.NaN, 24)).toMatchObject({ page: 1 });
    expect(paginate(items, 3, 24).clamped).toBe(false);
  });

  it('une liste vide reste une page, pas zéro', () => {
    expect(paginate([], 1, 24)).toMatchObject({ pageCount: 1, total: 0, from: 0, to: 0 });
  });

  it('ne perd aucun élément : la somme des pages fait le tout', () => {
    const seen: number[] = [];
    const { pageCount } = paginate(items, 1, 24);
    for (let p = 1; p <= pageCount; p += 1) seen.push(...paginate(items, p, 24).items);
    expect(seen).toEqual(items);
  });

  it('la taille par défaut remplit des lignes entières de la grille', () => {
    // Quatre colonnes au plus : un multiple de 4 évite une dernière ligne
    // orpheline sur les pages pleines. Ne vaut que pour la valeur par défaut,
    // `OFFERS_PER_PAGE` pouvant la remplacer.
    if (process.env.OFFERS_PER_PAGE) return;
    expect(PER_PAGE).toBe(24);
    expect(PER_PAGE % 4).toBe(0);
  });
});

describe('fenêtre de numéros', () => {
  it('garde toujours la première et la dernière', () => {
    const w = pageWindow(10, 20);
    expect(w[0]).toBe(1);
    expect(w[w.length - 1]).toBe(20);
    expect(w).toContain(10);
  });

  it('marque les trous', () => {
    expect(pageWindow(10, 20)).toContain(null);
    // Peu de pages : aucun trou, tout tient.
    expect(pageWindow(2, 4)).toEqual([1, 2, 3, 4]);
  });

  it('une seule page ne produit pas de navigation', () => {
    expect(pageWindow(1, 1)).toEqual([1]);
  });

  it('ne répète jamais un numéro', () => {
    for (const [page, count] of [[1, 20], [2, 20], [19, 20], [20, 20], [3, 5]] as const) {
      const numbers = pageWindow(page, count).filter((n): n is number => n !== null);
      expect(new Set(numbers).size, `${page}/${count}`).toBe(numbers.length);
    }
  });
});

describe('adresses de page', () => {
  it('conserve les filtres en changeant de page', () => {
    // Perdre sa recherche en passant à la page 2 est la façon la plus sûre
    // de faire abandonner quelqu'un.
    const href = pageHref('/offres', { metier: 'audit', ville: ['paris', 'lyon'], page: '3' }, 4);
    const url = new URL(href, 'https://x.test');
    expect(url.pathname).toBe('/offres');
    expect(url.searchParams.get('metier')).toBe('audit');
    expect(url.searchParams.getAll('ville')).toEqual(['paris', 'lyon']);
    expect(url.searchParams.get('page')).toBe('4');
  });

  it('n’écrit pas « page=1 » : une seule adresse pour un seul contenu', () => {
    expect(pageHref('/offres', {}, 1)).toBe('/offres');
    expect(pageHref('/offres', { metier: 'audit' }, 1)).toBe('/offres?metier=audit');
  });

  it('ignore les valeurs vides', () => {
    expect(pageHref('/offres', { q: '', metier: 'audit' }, 2)).toBe('/offres?metier=audit&page=2');
  });
});

describe('lecture du paramètre page', () => {
  it('lit un numéro valide, et 1 quand il n’y a pas de numéro', () => {
    expect(parseSearchParams({ page: '3' }).page).toBe(3);
    expect(parseSearchParams({}).page).toBe(1);
    expect(parseSearchParams({ page: 'deux' }).page).toBe(1);
  });

  it('laisse passer un numéro hors bornes au lieu de le corriger', () => {
    /*
     * `page=0` et `page=-4` ne sont PAS ramenés à 1 ici : c'est `paginate`
     * qui borne, et c'est son indicateur `clamped` qui fait refuser
     * l'indexation. Les corriger en silence ferait de ces adresses des pages
     * légitimes, donc indexables, avec le contenu de la page 1.
     */
    expect(parseSearchParams({ page: '0' }).page).toBe(0);
    expect(parseSearchParams({ page: '-4' }).page).toBe(-4);
    expect(paginate([1, 2, 3], parseSearchParams({ page: '0' }).page, 2).clamped).toBe(true);
    expect(paginate([1, 2, 3], parseSearchParams({ page: '-4' }).page, 2).clamped).toBe(true);
  });

  it('un numéro absent ou illisible n’est pas un dépassement', () => {
    // Sinon /offres?page=abc deviendrait noindex alors que c'est la page 1.
    expect(paginate([1, 2, 3], parseSearchParams({ page: 'abc' }).page, 2).clamped).toBe(false);
    expect(paginate([1, 2, 3], parseSearchParams({}).page, 2).clamped).toBe(false);
  });

  it('les pages SEO et /offres lisent le paramètre de la même façon', () => {
    /*
     * Les quatre listes du site ont eu trois lectures différentes du même
     * paramètre. Ce test fixe l'unique lecture partagée : si l'une des deux
     * repart de son côté, il casse.
     */
    const raws: (string | string[] | undefined)[] = ['3', '0', '-4', 'deux', undefined, ['7', '9']];
    for (const raw of raws) {
      expect(parseSearchParams({ page: raw }).page).toBe(parsePageParam(raw));
    }
  });

  it('ne retient que la première valeur quand le paramètre est répété', () => {
    expect(parsePageParam(['2', '5'])).toBe(2);
  });

  it('la page n’est pas un filtre', () => {
    /*
     * Si elle entrait dans `query`, la page d'offres croirait qu'un filtre
     * est actif dès la page 2 et afficherait « N offres sur M » au lieu du
     * total simple.
     */
    const { query } = parseSearchParams({ page: '5' });
    expect(query.families).toEqual([]);
    expect(query.groups).toEqual([]);
    expect(query.cities).toEqual([]);
    expect(query.regions).toEqual([]);
    expect(query.q).toBeUndefined();
  });
});

describe('filtres actifs', () => {
  const none = parseSearchParams({}).selected;

  it('aucun filtre quand l’URL est nue', () => {
    expect(hasActiveFilters(none)).toBe(false);
  });

  it('ni la page ni le tri ne comptent comme un filtre', () => {
    // Trier ne retire aucune offre, et paginer non plus : le total affiché
    // doit rester « N offres » et la page rester indexable.
    expect(hasActiveFilters(parseSearchParams({ page: '4' }).selected)).toBe(false);
    expect(hasActiveFilters(parseSearchParams({ tri: 'city' }).selected)).toBe(false);
  });

  it('chaque critère compte, région comprise', () => {
    /*
     * `regions` avait été oublié d'une copie de ce calcul : filtrer par
     * région seule affichait « 8 offres » au lieu de « 8 offres sur 20 »,
     * c'est-à-dire en masquant qu'un filtre était actif.
     */
    const cases: Record<string, string> = {
      metier: 'audit',
      type: 'alternance',
      ville: 'paris',
      region: 'ile-de-france',
      q: 'analyste',
      debut_avant: '2027-01-01',
    };
    for (const [key, value] of Object.entries(cases)) {
      expect(hasActiveFilters(parseSearchParams({ [key]: value }).selected), key).toBe(true);
    }
  });
});
