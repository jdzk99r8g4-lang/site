import type { Facets, SortKey } from '@/lib/filters';
import { CONTRACT_GROUP_PLURALS } from '@/lib/offer';

/**
 * Barre de filtres, reprise de la barre d'outils du brouillon.
 *
 * Un simple formulaire en méthode GET, rendu côté serveur. Trois conséquences,
 * toutes voulues :
 *
 * - il fonctionne sans JavaScript ;
 * - chaque combinaison de filtres a une URL, donc se partage et se met en
 *   favori ;
 * - aucun état client à synchroniser, donc rien à déboguer de ce côté.
 *
 * Les pastilles stage / alternance / junior sont en tête, car c'est le premier
 * tri que fait un candidat. Elles sont TOUJOURS affichées, même à zéro :
 * masquer « Stage » laisserait croire que le site en contient et que la
 * recherche a échoué. Une famille qu'aucune source n'alimente est désactivée
 * et porte la raison.
 */
export function OfferFilters({
  facets,
  selected,
}: {
  facets: Facets;
  selected: {
    families: readonly string[];
    groups: readonly string[];
    cities: readonly string[];
    q: string;
    sort: SortKey;
    startsBefore: string;
  };
}) {
  const unsourced = facets.groups.filter((g) => !g.sourced);

  return (
    <form method="get" action="/offres" className="flex flex-col gap-3.5">
      <input
        type="search"
        name="q"
        defaultValue={selected.q}
        placeholder="Intitulé, employeur, ville…"
        aria-label="Rechercher une offre"
        className="w-full rounded-xl bg-card px-[18px] py-[13px] text-sm"
      />

      <fieldset>
        <legend className="sr-only">Type de contrat</legend>
        <div className="flex flex-wrap gap-2">
          {facets.groups.map((group) => {
            const checked = selected.groups.includes(group.value);
            return (
              <label
                key={group.value}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-[20px] border px-3.5 py-2 text-[13px] transition-all ${
                  checked
                    ? 'border-accent bg-accent-bg text-accent'
                    : 'border-line bg-card text-ink hover:border-line-hover hover:bg-card-hover'
                } ${group.sourced ? '' : 'opacity-60'}`}
                title={
                  group.sourced
                    ? undefined
                    : 'Aucune source ne fournit encore ce type de contrat'
                }
              >
                <input
                  type="checkbox"
                  name="type"
                  value={group.value}
                  defaultChecked={checked}
                  className="sr-only"
                />
                <span>{group.label}</span>
                <span className={checked ? 'text-accent' : 'text-muted'}>{group.count}</span>
              </label>
            );
          })}
        </div>

        {unsourced.length > 0 ? (
          <p className="mt-2 text-xs text-muted-2">
            {unsourced.map((g) => CONTRACT_GROUP_PLURALS[g.value]).join(' et ')} : aucune source
            n’en fournit encore. Le filtre reste affiché — il renverra des résultats dès qu’une
            source sera branchée.
          </p>
        ) : null}
      </fieldset>

      <div className="flex flex-wrap gap-3">
        {facets.families.length > 0 ? (
          <Dropdown
            label={
              selected.families.length > 0
                ? `Métier (${selected.families.length})`
                : 'Métier'
            }
          >
            {facets.families.map((facet) => (
              <label
                key={facet.value}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-[13.5px] hover:bg-card-hover"
              >
                <input
                  type="checkbox"
                  name="metier"
                  value={facet.value}
                  defaultChecked={selected.families.includes(facet.value)}
                />
                <span className="truncate">
                  {facet.label} <span className="text-muted">({facet.count})</span>
                </span>
              </label>
            ))}
          </Dropdown>
        ) : null}

        {facets.cities.length > 0 ? (
          <Dropdown
            label={selected.cities.length > 0 ? `Ville (${selected.cities.length})` : 'Ville'}
          >
            {facets.cities.map((facet) => (
              <label
                key={facet.value}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-[13.5px] hover:bg-card-hover"
              >
                <input
                  type="checkbox"
                  name="ville"
                  value={facet.value}
                  defaultChecked={selected.cities.includes(facet.value)}
                />
                <span className="truncate">
                  {facet.label} <span className="text-muted">({facet.count})</span>
                </span>
              </label>
            ))}
          </Dropdown>
        ) : null}

        <label className="inline-flex items-center gap-2 rounded-lg border border-line bg-card px-3.5 py-2 text-[13.5px] font-semibold">
          <span className="text-muted">Début avant</span>
          <input
            type="date"
            name="debut_avant"
            defaultValue={selected.startsBefore}
            className="rounded border-0 bg-transparent p-0 text-[13.5px] font-normal"
          />
        </label>

        <label className="inline-flex items-center gap-2 rounded-lg border border-line bg-card px-3.5 py-2 text-[13.5px] font-semibold">
          <span className="text-muted">Trier</span>
          <select
            name="tri"
            defaultValue={selected.sort}
            className="rounded border-0 bg-transparent p-0 text-[13.5px] font-normal"
          >
            <option value="recent">Plus récentes</option>
            <option value="start">Date de début</option>
            <option value="city">Ville</option>
          </select>
        </label>

        <button
          type="submit"
          className="rounded-lg bg-cta px-[18px] py-2.5 text-sm font-bold text-cta-ink transition-colors hover:bg-cta-hover active:scale-[0.97]"
        >
          Filtrer
        </button>

        <a
          href="/offres"
          className="inline-flex items-center text-[13px] text-muted no-underline hover:text-ink"
        >
          Tout effacer
        </a>
      </div>
    </form>
  );
}

/**
 * Menu déroulant en HTML natif (`details`/`summary`).
 *
 * Choisi exprès plutôt qu'un composant client : l'ouverture et la fermeture
 * sont gérées par le navigateur, au clavier comme à la souris, sans une ligne
 * de JavaScript et sans état à synchroniser.
 */
function Dropdown({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg border border-line bg-card px-3.5 py-2 text-[13.5px] font-semibold transition-colors hover:border-line-hover group-open:border-accent group-open:text-accent">
        {label}
        <span aria-hidden="true" className="text-[10px] text-muted group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="absolute top-[calc(100%+8px)] left-0 z-30 max-h-[280px] min-w-[240px] max-w-[min(320px,calc(100vw-48px))] overflow-y-auto rounded-[10px] border border-line bg-card p-2.5 shadow-card-hover">
        {children}
      </div>
    </details>
  );
}
