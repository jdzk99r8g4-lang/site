/**
 * Pagination des listes d'offres.
 *
 * ---------------------------------------------------------------------------
 * Pourquoi c'était nécessaire
 * ---------------------------------------------------------------------------
 * La liste rendait toutes les offres d'un coup. Mesuré sur le jeu de
 * démonstration, en servant la même page avec 2, 6, 12 puis 20 offres :
 *
 *     2 offres →  70 273 o      12 offres → 104 939 o
 *     6 offres →  84 407 o      20 offres → 131 421 o
 *
 * La relation est linéaire : environ 3,3 Ko par offre, sur un coût fixe de
 * l'ordre de 62 Ko (en-tête, filtres, pied de page). Un catalogue réel de
 * 2 000 offres produirait donc une page d'environ 6,5 Mo — illisible en 4G, et
 * probablement un dépassement de délai côté serveur avant même d'arriver au
 * navigateur.
 *
 * Une première estimation divisait le poids total par le nombre d'offres et
 * concluait à 6,4 Ko par offre, donc 12 Mo : presque le double. Elle comptait
 * le coût fixe autant de fois qu'il y a d'offres. C'est la pente qui projette,
 * pas la moyenne.
 *
 * ---------------------------------------------------------------------------
 * Pagination par URL, et pas un bouton « voir plus »
 * ---------------------------------------------------------------------------
 * Trois raisons, dans cet ordre :
 *
 *  - elle fonctionne sans JavaScript, comme le reste des filtres du site ;
 *  - chaque page a une adresse, donc se partage et se met en favori ;
 *  - un moteur peut la parcourir. Un bouton « voir plus » laisse tout ce qui
 *    suit la première fournée invisible à l'exploration.
 *
 * Ce que la pagination NE règle pas : la lecture du magasin charge toujours
 * l'instantané complet avant de découper. C'est supportable — quelques
 * mégaoctets en mémoire sur le serveur — mais c'est le prochain goulot si le
 * catalogue grossit beaucoup.
 */

/**
 * Offres par page.
 *
 * La grille fait jusqu'à quatre colonnes à pleine largeur : 24 donne six
 * lignes pleines, sans dernière ligne orpheline.
 *
 * Réglable par `OFFERS_PER_PAGE`, pour deux raisons : on ne saura qu'avec de
 * vraies offres si 24 est le bon compromis entre poids de page et nombre de
 * clics, et une petite valeur permet de vérifier la pagination sur le jeu de
 * démonstration, qui ne compte que vingt offres.
 */
const configured = Number.parseInt(process.env.OFFERS_PER_PAGE ?? '', 10);
export const PER_PAGE = Number.isFinite(configured) && configured > 0 ? configured : 24;

/**
 * Numéro de page lu dans les paramètres d'URL.
 *
 * Un entier, même hors bornes, est renvoyé tel quel : c'est `paginate` qui
 * borne, parce que c'est le seul endroit à connaître le total, et c'est lui
 * qui signale le dépassement par `clamped` — d'où découle le refus
 * d'indexation. Ramener `page=0` ou `page=-3` à 1 ici ferait passer ces
 * adresses pour des pages légitimes.
 *
 * Ce qui n'est pas un nombre du tout (`page=abc`) vaut 1 sans être signalé :
 * ce n'est pas un numéro trop grand, c'est une absence de numéro.
 *
 * Recopier cette lecture dans chaque page serait l'occasion de la faire
 * diverger ; une seule définition l'évite.
 */
export function parsePageParam(value: string | string[] | undefined): number {
  const first = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(first ?? '', 10);
  return Number.isFinite(parsed) ? parsed : 1;
}

export interface Page<T> {
  /** Les éléments de la page demandée. */
  items: T[];
  /** Page effectivement rendue, toujours entre 1 et `pageCount`. */
  page: number;
  pageCount: number;
  total: number;
  /** Rang du premier élément affiché, à partir de 1. Zéro si la liste est vide. */
  from: number;
  /** Rang du dernier élément affiché. */
  to: number;
  /**
   * Vrai si la page demandée n'existait pas et a été ramenée dans les bornes.
   *
   * La page est alors servie quand même — renvoyer une erreur pour un numéro
   * trop grand n'aide personne — mais elle ne doit pas être indexée, sans
   * quoi un moteur référencerait autant d'adresses que de numéros inventés.
   */
  clamped: boolean;
}

/**
 * Découpe une liste. Fonction pure : aucune lecture de magasin, aucune date
 * implicite, donc testable directement.
 */
export function paginate<T>(items: readonly T[], requestedPage: number, perPage = PER_PAGE): Page<T> {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));

  const asked = Number.isFinite(requestedPage) ? Math.trunc(requestedPage) : 1;
  const page = Math.min(Math.max(asked, 1), pageCount);
  const clamped = page !== asked;

  const start = (page - 1) * perPage;
  const slice = items.slice(start, start + perPage);

  return {
    items: slice,
    page,
    pageCount,
    total,
    from: total === 0 ? 0 : start + 1,
    to: start + slice.length,
    clamped,
  };
}

/**
 * Suite de numéros à afficher, avec des trous marqués par `null`.
 *
 * Toujours la première et la dernière page, plus une fenêtre autour de la
 * page courante. Au-delà d'une dizaine de pages, afficher tous les numéros
 * occupe plus de place que les offres elles-mêmes.
 */
export function pageWindow(page: number, pageCount: number, span = 1): (number | null)[] {
  if (pageCount <= 1) return [1];

  const wanted = new Set<number>([1, pageCount]);
  for (let p = page - span; p <= page + span; p += 1) {
    if (p >= 1 && p <= pageCount) wanted.add(p);
  }

  const sorted = [...wanted].sort((a, b) => a - b);
  const result: (number | null)[] = [];
  let previous = 0;

  for (const value of sorted) {
    if (previous && value - previous > 1) result.push(null);
    result.push(value);
    previous = value;
  }

  return result;
}

/**
 * Construit l'adresse d'une page en conservant les filtres.
 *
 * Le paramètre `page` est retiré pour la page 1 : `/offres` et
 * `/offres?page=1` afficheraient la même chose, et deux adresses pour un même
 * contenu est exactement ce qu'on évite en référencement.
 */
export function pageHref(
  basePath: string,
  params: Record<string, string | string[] | undefined>,
  page: number,
): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (key === 'page' || value === undefined) continue;
    for (const one of Array.isArray(value) ? value : [value]) {
      if (one.length > 0) search.append(key, one);
    }
  }

  if (page > 1) search.set('page', String(page));

  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}
