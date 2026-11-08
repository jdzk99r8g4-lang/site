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

  it('refuse une ville qui n’a pas la forme d’un slug', () => {
    // Les villes viennent des offres du jour : on ne peut pas les valider
    // contre une liste fermée, seulement contre leur forme.
    const { query } = parseSearchParams({ ville: ['paris', '<script>', 'a'] });
    expect(query.cities).toEqual(['paris']);
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
