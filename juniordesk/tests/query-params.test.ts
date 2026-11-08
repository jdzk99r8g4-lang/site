import { describe, it, expect } from 'vitest';
import { parseSearchParams } from '@/lib/query-params';

/**
 * Les paramètres d'URL viennent du visiteur : tout ce qui n'est pas reconnu
 * doit être ignoré en silence, jamais répercuté dans une requête ni réaffiché.
 */
describe('lecture des paramètres d’URL', () => {
  it('lit les filtres', () => {
    const { query } = parseSearchParams({
      type: ['alternance', 'stage'],
      metier: 'banque-detail-credit',
      ville: 'paris',
      tri: 'start',
      debut_avant: '2027-01-01',
      q: 'credit',
    });
    expect(query.groups).toEqual(['alternance', 'stage']);
    expect(query.families).toEqual(['banque-detail-credit']);
    expect(query.cities).toEqual(['paris']);
    expect(query.sort).toBe('start');
    expect(query.startsBefore).toBe('2027-01-01');
    expect(query.q).toBe('credit');
  });

  it('accepte aussi la forme séparée par des virgules', () => {
    const { query } = parseSearchParams({ metier: 'banque-detail-credit,assurance-actuariat' });
    expect(query.families).toEqual(['banque-detail-credit', 'assurance-actuariat']);
  });

  it('ignore les valeurs inventées', () => {
    const { query } = parseSearchParams({
      type: 'invente',
      metier: 'nexiste-pas',
      tri: '../../etc/passwd',
      debut_avant: 'pas-une-date',
    });
    expect(query.groups).toEqual([]);
    expect(query.families).toEqual([]);
    expect(query.sort).toBe('recent');
    expect(query.startsBefore).toBeUndefined();
  });

  it('accepte une ville tapée à la main, accents et casse compris', () => {
    /*
     * Le champ « autre ville » reçoit du texte, pas un identifiant. On le
     * passe par le même `slugify` que celui qui a produit les slugs, pour que
     * « Saint-Étienne », « saint-etienne » et « SAINT ETIENNE » désignent la
     * même ville.
     */
    expect(parseSearchParams({ ville: 'Saint-Étienne' }).query.cities).toEqual(['saint-etienne']);
    expect(parseSearchParams({ ville: 'PUTEAUX' }).query.cities).toEqual(['puteaux']);
    expect(parseSearchParams({ ville: 'Neuilly sur Seine' }).query.cities).toEqual([
      'neuilly-sur-seine',
    ]);
  });

  it('écarte ce qui ne peut pas former un nom de ville', () => {
    /*
     * Ce qui reste après `slugify` garde la forme d'un slug, y compris pour
     * une saisie absurde : « <script> » devient « script ». Ce n'est pas un
     * danger — la valeur ne sert qu'à comparer avec les villes connues, et
     * React échappe de toute façon — mais le filtre ne renverra rien. La
     * page d'offres le dit explicitement plutôt que d'afficher une liste
     * vide qui ressemble à une panne.
     */
    const { query } = parseSearchParams({ ville: ['paris', 'a', '   ', '!!!'] });
    expect(query.cities).toEqual(['paris']);
  });

  it('ne retient que les régions connues', () => {
    const { query } = parseSearchParams({ region: ['ile-de-france', 'atlantide'] });
    expect(query.regions).toEqual(['ile-de-france']);
  });

  it('déduplique et borne la recherche libre', () => {
    const { query } = parseSearchParams({ metier: ['assurance-actuariat', 'assurance-actuariat'], q: 'x'.repeat(500) });
    expect(query.families).toEqual(['assurance-actuariat']);
    expect(query.q?.length).toBe(80);
  });

  it('sans paramètre, ne filtre rien', () => {
    const { query, selected } = parseSearchParams({});
    expect(query.families).toEqual([]);
    expect(query.groups).toEqual([]);
    expect(selected.sort).toBe('recent');
    expect(selected.q).toBe('');
  });
});
