import { describe, it, expect } from 'vitest';
import { dictionaries } from '@/lib/i18n/dictionaries';
import {
  isLocale,
  locales,
  negotiateLocale,
  intlLocales,
  htmlLangs,
  ogLocales,
  localeNames,
  defaultLocale,
} from '@/lib/i18n/config';
import {
  canonicalPaths,
  href,
  localizedPaths,
  productHref,
  routeNames,
  toCanonicalPath,
  toLocalizedPath,
} from '@/lib/i18n/routes';
import { allEquivalents, equivalentPath, splitLocalePath } from '@/lib/i18n/equivalent';
import { products } from '@/lib/catalog';
import { guides } from '@/lib/guides';

/** Chemins de toutes les feuilles d'un objet, pour comparer deux dictionnaires. */
function leafPaths(value: unknown, prefix = ''): string[] {
  if (Array.isArray(value)) {
    // Les tableaux du dictionnaire sont des listes de contenu : on compare
    // leur longueur, pas chaque entrée (le nombre d'arguments d'une liste doit
    // rester identique d'une langue à l'autre, pas le texte).
    return [`${prefix}[]:${value.length}`, ...value.flatMap((item, i) => leafPaths(item, `${prefix}[${i}]`))];
  }
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value).flatMap(([key, child]) =>
      leafPaths(child, prefix ? `${prefix}.${key}` : key),
    );
  }
  return [prefix];
}

describe('complétude des dictionnaires', () => {
  const reference = leafPaths(dictionaries[defaultLocale]).sort();

  it('a un dictionnaire par langue déclarée', () => {
    expect(Object.keys(dictionaries).sort()).toEqual([...locales].sort());
  });

  for (const locale of locales) {
    it(`a exactement les mêmes clés en ${locale} qu’en ${defaultLocale}`, () => {
      // Le typage garantit déjà les clés d'objet ; ce test ajoute la longueur
      // des listes, qu'aucun type ne contraint — une langue avec trois
      // promesses au lieu de quatre afficherait une grille trouée.
      expect(leafPaths(dictionaries[locale]).sort()).toEqual(reference);
    });

    it(`n’a aucun texte vide en ${locale}`, () => {
      const empty: string[] = [];
      const walk = (value: unknown, path: string): void => {
        if (typeof value === 'string') {
          if (value.trim().length === 0) empty.push(path);
          return;
        }
        if (Array.isArray(value)) {
          value.forEach((item, i) => walk(item, `${path}[${i}]`));
          return;
        }
        if (typeof value === 'object' && value !== null) {
          for (const [key, child] of Object.entries(value)) walk(child, `${path}.${key}`);
        }
      };
      walk(dictionaries[locale], locale);
      expect(empty, empty.join(', ')).toEqual([]);
    });
  }

  it('déclare les métadonnées de chaque langue', () => {
    for (const locale of locales) {
      expect(intlLocales[locale]).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
      expect(htmlLangs[locale]).toBe(locale);
      expect(ogLocales[locale]).toMatch(/^[a-z]{2}_[A-Z]{2}$/);
      expect(localeNames[locale].length).toBeGreaterThan(2);
    }
  });

  it('n’utilise pas en-US pour l’anglais : la boutique facture en euros', () => {
    expect(intlLocales.en).not.toBe('en-US');
  });
});

describe('négociation de langue', () => {
  it('reconnaît les langues du site', () => {
    expect(isLocale('fr')).toBe(true);
    expect(isLocale('de')).toBe(false);
  });

  it('retient la langue préférée, région ignorée', () => {
    expect(negotiateLocale('nl-BE,nl;q=0.9,en;q=0.8')).toBe('nl');
    expect(negotiateLocale('es-419,es;q=0.9')).toBe('es');
  });

  it('respecte l’ordre de qualité plutôt que l’ordre d’écriture', () => {
    expect(negotiateLocale('de;q=0.9,es;q=0.95')).toBe('es');
  });

  it('ignore une langue non servie et les qualités nulles', () => {
    expect(negotiateLocale('de-DE,de;q=0.9')).toBe(defaultLocale);
    expect(negotiateLocale('en;q=0')).toBe(defaultLocale);
  });

  it('retombe sur la langue par défaut sans en-tête', () => {
    expect(negotiateLocale(null)).toBe(defaultLocale);
    expect(negotiateLocale('')).toBe(defaultLocale);
  });
});

describe('table des routes', () => {
  it('déclare un chemin canonique et quatre chemins publics par route', () => {
    for (const route of routeNames) {
      expect(canonicalPaths[route], route).toBeDefined();
      for (const locale of locales) {
        expect(localizedPaths[route][locale], `${route}/${locale}`).toBeDefined();
      }
    }
  });

  it('n’a pas deux routes sur le même chemin public dans une langue', () => {
    for (const locale of locales) {
      const paths = routeNames.map((route) => localizedPaths[route][locale]);
      expect(new Set(paths).size, `collision de route en ${locale}`).toBe(paths.length);
    }
  });

  it('préfixe chaque URL de la langue', () => {
    for (const locale of locales) {
      expect(href('home', locale)).toBe(`/${locale}`);
      expect(href('shop', locale).startsWith(`/${locale}/`)).toBe(true);
    }
  });

  it('réécrit un chemin localisé vers sa route canonique', () => {
    expect(toCanonicalPath('es', 'calefaccion/estufas-de-pellets')).toBe('/es/shop/pellet');
    expect(toCanonicalPath('nl', 'verwarming/bio-ethanolhaarden')).toBe('/nl/shop/bioethanol');
    expect(toCanonicalPath('fr', 'chauffage/cheminee-electrique')).toBe('/fr/shop/electricfire');
  });

  it('fait gagner le préfixe le plus long : une catégorie n’avale pas ses enfants', () => {
    // Sans tri décroissant, « chauffage » capturerait « chauffage/chaudiere »
    // et l'ombrelle répondrait à la place de la famille.
    expect(toCanonicalPath('fr', 'chauffage')).toBe('/fr/shop');
    expect(toCanonicalPath('fr', 'chauffage/cheminee-bioethanol')).toBe('/fr/shop/bioethanol');
  });

  it('ne réécrit pas quand le chemin public est déjà le chemin canonique', () => {
    // L'anglais partage ses segments avec le canonique : réécrire relancerait
    // le proxy sur la même URL.
    expect(toCanonicalPath('en', 'guides')).toBeNull();
    expect(toCanonicalPath('fr', 'contact')).toBeNull();
  });

  it('réécrit le préfixe d’une fiche produit en gardant le slug', () => {
    expect(toCanonicalPath('es', 'calefaccion/p/kekai-oregon-chimenea-electrica-pared-127-cm')).toBe(
      '/es/shop/p/kekai-oregon-chimenea-electrica-pared-127-cm',
    );
  });

  it('laisse passer une URL inconnue', () => {
    expect(toCanonicalPath('fr', 'inconnu/quelque-chose')).toBeNull();
  });
});

describe('équivalences entre langues', () => {
  it('découpe une URL en langue et reste', () => {
    expect(splitLocalePath('/nl/verwarming/cv-ketels')).toEqual({
      locale: 'nl',
      rest: 'verwarming/cv-ketels',
    });
    expect(splitLocalePath('/unknown/page')).toBeNull();
  });

  it('mène à la même page statique dans l’autre langue', () => {
    expect(equivalentPath('/fr/chauffage/poele-a-granules', 'es')).toBe(
      '/es/calefaccion/estufas-de-pellets',
    );
    expect(equivalentPath('/es/calculo-potencia', 'nl')).toBe('/nl/vermogen-berekenen');
  });

  it('mène à la même fiche produit dans l’autre langue', () => {
    const product = products[0];
    expect(product).toBeDefined();
    if (!product) return;
    expect(equivalentPath(productHref(product.slug.fr, 'fr'), 'es')).toBe(
      productHref(product.slug.es, 'es'),
    );
  });

  it('mène au même guide dans l’autre langue', () => {
    const guide = guides[0];
    expect(guide).toBeDefined();
    if (!guide) return;
    expect(equivalentPath(`/fr/guides/${guide.slug.fr}`, 'nl')).toBe(`/nl/gidsen/${guide.slug.nl}`);
  });

  it('reconnaît aussi une URL déjà réécrite par le proxy', () => {
    expect(equivalentPath('/fr/shop/pellet', 'es')).toBe('/es/calefaccion/estufas-de-pellets');
  });

  it('retombe sur l’accueil plutôt que sur un 404', () => {
    expect(equivalentPath('/fr/page-qui-nexiste-pas', 'en')).toBe('/en');
    expect(equivalentPath('/', 'en')).toBe('/en');
  });

  it('donne les quatre équivalences, toutes préfixées de leur langue', () => {
    const all = allEquivalents('/fr/chauffage/cheminee-bioethanol');
    for (const locale of locales) {
      expect(all[locale].startsWith(`/${locale}`), locale).toBe(true);
    }
    expect(all.fr).toBe('/fr/chauffage/cheminee-bioethanol');
  });
});

describe('redirection du chemin canonique vers le chemin public', () => {
  it('redirige un chemin canonique atteint directement', () => {
    // Sans cela, « /fr/shop/pellet » et « /fr/chauffage/poele-a-granules »
    // servent la même page : deux URL qui se concurrencent sur les mêmes mots.
    expect(toLocalizedPath('fr', 'shop/pellet')).toBe('/fr/chauffage/poele-a-granules');
    expect(toLocalizedPath('es', 'shop')).toBe('/es/calefaccion');
    expect(toLocalizedPath('nl', 'guides')).toBe('/nl/gidsen');
  });

  it('redirige aussi le préfixe d’une fiche produit, slug conservé', () => {
    expect(toLocalizedPath('fr', 'shop/p/kekai-etna-cheminee-bioethanol-de-table')).toBe(
      '/fr/chauffage/p/kekai-etna-cheminee-bioethanol-de-table',
    );
  });

  it('redirige aussi l’anglais, dont les segments publics ne sont pas les canoniques', () => {
    // « shop » est le nom du dossier, « heating » le segment public anglais :
    // les deux diffèrent, donc l'anglais a besoin de la redirection comme
    // les autres langues.
    expect(toLocalizedPath('en', 'shop/pellet')).toBe('/en/heating/pellet-stoves');
  });

  it('ne redirige pas quand le canonique est déjà le chemin public', () => {
    // Pour ces routes, le dossier et le segment public portent le même nom :
    // rediriger ferait boucler le proxy.
    expect(toLocalizedPath('en', 'guides')).toBeNull();
    expect(toLocalizedPath('fr', 'contact')).toBeNull();
    expect(toLocalizedPath('en', 'returns')).toBeNull();
  });

  it('laisse passer l’accueil et les chemins inconnus', () => {
    expect(toLocalizedPath('fr', '')).toBeNull();
    expect(toLocalizedPath('fr', 'inconnu')).toBeNull();
  });

  it('n’entre jamais en conflit avec la réécriture inverse', () => {
    /*
     * Invariant qui protège d'une boucle de redirection : pour une même
     * langue et un même chemin, les deux fonctions ne peuvent pas répondre
     * toutes les deux. L'une traduit public -> canonique, l'autre
     * canonique -> public ; si les deux s'appliquaient, le proxy
     * redirigerait puis réécrirait indéfiniment.
     */
    const samples = ['', 'shop', 'shop/hydro', 'poeles', 'poeles/hydro', 'guides', 'gidsen', 'estufas/hidro'];
    for (const locale of locales) {
      for (const path of samples) {
        const both = toCanonicalPath(locale, path) !== null && toLocalizedPath(locale, path) !== null;
        expect(both, `${locale} / « ${path} » : les deux sens répondent`).toBe(false);
      }
    }
  });
});
