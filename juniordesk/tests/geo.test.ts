import { describe, it, expect } from 'vitest';
import { cityIndex, departementFromPostal, parseAddress } from '@/lib/geo';
import { citySlugFromInput, parseDepartementLabel } from '@/lib/geo';

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

describe('graphies réelles d’adresses', () => {
  const ville = (adresse: string) => parseAddress(adresse).city;
  const slug = (adresse: string) => parseAddress(adresse).citySlug;

  it('reconnaît un arrondissement écrit en toutes lettres', () => {
    /*
     * « PARIS 8E ARRONDISSEMENT » est la graphie officielle. Elle n'était
     * pas reconnue : Paris éclatait en vingt « villes », Lyon en neuf,
     * Marseille en seize, et le filtre « Paris » ne trouvait aucune des
     * offres ainsi libellées.
     */
    expect(slug('75008 PARIS 8E ARRONDISSEMENT')).toBe('paris');
    expect(slug('13001 MARSEILLE 1ER ARRONDISSEMENT')).toBe('marseille');
    expect(slug('69003 LYON 3EME ARR.')).toBe('lyon');
    expect(slug('69003 LYON 03')).toBe('lyon');
  });

  it('trouve la ville quand elle précède le code postal', () => {
    expect(ville('Paris 75008')).toBe('Paris');
    expect(ville('Lyon (69003)')).toBe('Lyon');
    expect(ville('Neuilly-sur-Seine (92200), France')).toBe('Neuilly-sur-Seine');
  });

  it('ne prend pas une voie pour une ville', () => {
    // Mieux vaut aucune ville qu'une page « Alternance à 12 Rue de la Paix ».
    expect(ville('12 rue de la Paix 75002')).toBeNull();
    expect(ville('Tour First 92400')).toBeNull();
  });

  it('développe la graphie postale « ST »', () => {
    // Sinon la même commune existe deux fois, avec la moitié des offres chacune.
    expect(slug('42000 ST ETIENNE')).toBe('saint-etienne');
    expect(slug('42000 Saint-Étienne')).toBe('saint-etienne');
    expect(ville('94100 ST MAUR DES FOSSES')).toBe('Saint-Maur-des-Fosses');
    expect(ville('69110 STE FOY LES LYON')).toBe('Sainte-Foy-les-Lyon');
    expect(ville('93310 LE PRE ST GERVAIS')).toBe('Le Pre-Saint-Gervais');
  });

  it('range La Défense où elle est', () => {
    /*
     * La Défense n'est pas une commune : « Puteaux La Défense » est Puteaux,
     * et « Paris La Défense » est La Défense — surtout pas Paris, le code
     * postal étant en 92.
     */
    expect(slug('92800 PUTEAUX LA DEFENSE')).toBe('puteaux');
    expect(slug('92400 Courbevoie - La Défense')).toBe('courbevoie');
    expect(ville('Paris La Défense Cedex 92042')).toBe('La Défense');
    expect(parseAddress('Paris La Défense Cedex 92042').departement).toBe('92');
  });

  it('met la majuscule à l’article initial et à l’élision', () => {
    // Mesuré : « le Havre », « Villeneuve D'ascq », « L'isle Adam ».
    expect(ville('76600 LE HAVRE')).toBe('Le Havre');
    expect(ville('17000 La Rochelle')).toBe('La Rochelle');
    expect(ville('91940 LES ULIS')).toBe('Les Ulis');
    expect(ville("59650 VILLENEUVE D'ASCQ")).toBe('Villeneuve d’Ascq');
    expect(ville("95290 L'ISLE ADAM")).toBe('L’Isle Adam');
    expect(ville('13100 Aix-en-Provence')).toBe('Aix-en-Provence');
  });
});

describe('ville tapée par le visiteur', () => {
  it('comprend ce qu’il veut dire', () => {
    expect(citySlugFromInput('Paris')).toBe('paris');
    expect(citySlugFromInput('paris 8e')).toBe('paris');
    expect(citySlugFromInput('Paris 75008')).toBe('paris');
    expect(citySlugFromInput('St Etienne')).toBe('saint-etienne');
    expect(citySlugFromInput('Saint-Étienne')).toBe('saint-etienne');
    expect(citySlugFromInput('Paris La Défense')).toBe('la-defense');
  });

  it('donne le même slug que celui des offres', () => {
    /*
     * La saisie et la collecte avaient chacune leur calcul — six mots au plus
     * d'un côté, huit de l'autre. Une commune de sept mots ne pouvait donc
     * jamais être trouvée.
     */
    for (const nom of ['Saint-Étienne', 'Le Havre', 'Aix-en-Provence', 'Neuilly-sur-Seine']) {
      expect(citySlugFromInput(nom), nom).toBe(parseAddress(`00000 ${nom}`).citySlug);
    }
  });

  it('rend null pour ce qui ne peut pas être une ville', () => {
    expect(citySlugFromInput('')).toBeNull();
    expect(citySlugFromInput('!!!')).toBeNull();
    expect(citySlugFromInput('75008')).toBeNull();
  });
});

describe('libellé « département - commune »', () => {
  it('lit le département et la commune', () => {
    expect(parseDepartementLabel('75 - PARIS 08')).toMatchObject({ city: 'Paris', departement: '75' });
    expect(parseDepartementLabel('92 - NANTERRE')).toMatchObject({ city: 'Nanterre', departement: '92' });
  });

  it('ramène la Corse à « 20 », comme un code postal', () => {
    expect(parseDepartementLabel('2A - AJACCIO')).toMatchObject({ city: 'Ajaccio', departement: '20' });
  });

  it('accepte un libellé sans préfixe', () => {
    expect(parseDepartementLabel('Lyon')).toMatchObject({ city: 'Lyon', departement: null });
  });
});
