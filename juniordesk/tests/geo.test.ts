import { describe, it, expect } from 'vitest';
import { cityIndex, departementFromPostal, parseAddress } from '@/lib/geo';

/**
 * L'adresse arrive en une seule chaîne rédigée par l'employeur. Ces tests
 * fixent ce qu'on sait en extraire — et, tout aussi important, ce qu'on
 * refuse de deviner.
 */
describe('analyse d’adresse', () => {
  it('extrait ville et code postal d’une adresse bien formée', () => {
    const place = parseAddress('12 rue de la Paix 75002 Paris');
    expect(place.city).toBe('Paris');
    expect(place.postalCode).toBe('75002');
    expect(place.departement).toBe('75');
    expect(place.citySlug).toBe('paris');
  });

  it('gère les noms composés et la casse', () => {
    const place = parseAddress('3 avenue du Général Leclerc 92200 NEUILLY-SUR-SEINE');
    expect(place.city).toBe('Neuilly-sur-Seine');
    expect(place.citySlug).toBe('neuilly-sur-seine');
  });

  it('retire l’arrondissement accolé : « PARIS 02 » reste Paris', () => {
    expect(parseAddress('1 rue X 75002 PARIS 02').city).toBe('Paris');
  });

  it('retire le pays et la mention CEDEX', () => {
    expect(parseAddress('5 rue Y 69002 Lyon Cedex 02').city).toBe('Lyon');
    expect(parseAddress('5 rue Y 69002 Lyon, France').city).toBe('Lyon');
  });

  it('garde le code postal même quand la ville n’est pas isolable', () => {
    const place = parseAddress('75008');
    expect(place.postalCode).toBe('75008');
    expect(place.city).toBeNull();
  });

  it('ne devine rien quand il n’y a rien à deviner', () => {
    for (const input of [null, undefined, '', '   ', 'Télétravail']) {
      const place = parseAddress(input);
      expect(place.city).toBeNull();
      expect(place.postalCode).toBeNull();
    }
  });

  it('département : deux chiffres en métropole, trois en outre-mer', () => {
    expect(departementFromPostal('33000')).toBe('33');
    expect(departementFromPostal('97400')).toBe('974');
    expect(departementFromPostal('98800')).toBe('988');
    expect(departementFromPostal('abcde')).toBeNull();
  });

  it('la Corse est renvoyée sans trancher entre 2A et 2B', () => {
    // Départager demande la commune exacte ; un mauvais rattachement serait
    // pire qu'une absence de précision.
    expect(departementFromPostal('20000')).toBe('20');
  });

  it('l’index des villes compte et choisit la graphie la plus fréquente', () => {
    const index = cityIndex([
      { city: 'Paris', citySlug: 'paris' },
      { city: 'Paris', citySlug: 'paris' },
      { city: 'PARIS', citySlug: 'paris' },
      { city: 'Lyon', citySlug: 'lyon' },
      { city: null, citySlug: null },
    ]);
    expect(index[0]).toEqual({ slug: 'paris', label: 'Paris', count: 3 });
    expect(index[1]).toEqual({ slug: 'lyon', label: 'Lyon', count: 1 });
  });
});
