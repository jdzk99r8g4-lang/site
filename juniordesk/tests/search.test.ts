import { describe, it, expect } from 'vitest';
import { applyQuery, searchTokens, sortOffers } from '@/lib/filters';
import { parseAddress } from '@/lib/geo';
import { NO_EXPERIENCE_SIGNAL } from '@/lib/seniority';
import type { Offer } from '@/lib/offer';

const NOW = new Date('2026-11-09T00:00:00.000Z');

function offre(
  id: string,
  title: string,
  employer: string,
  address: string,
  extra: Partial<Offer> = {},
): Offer {
  const p = parseAddress(address);
  return {
    id,
    slug: id,
    title,
    description: '',
    applyUrl: 'https://employeur.example/postuler',
    source: { id: 'lba', label: 'LBA', partnerLabel: 'p', partnerJobId: id },
    employer: { name: employer, brand: null, siret: null, website: null, size: null },
    place: {
      address, city: p.city, citySlug: p.citySlug, postalCode: p.postalCode,
      departement: p.departement, lat: null, lon: null,
    },
    contract: {
      kinds: ['apprentissage'], start: null, startIsFlexible: false,
      durationMonths: null, remote: null,
    },
    families: ['fusions-acquisitions'],
    romeCodes: [],
    targetDiploma: null,
    experience: NO_EXPERIENCE_SIGNAL,
    publishedAt: '2026-11-01T00:00:00.000Z',
    expiresAt: null,
    collectedAt: '2026-11-09T00:00:00.000Z',
    ...extra,
  };
}

const catalogue = [
  offre('ma', 'Analyste M&A', 'Conseil Exemple', '112 av des Champs-Élysées 75008 Paris'),
  offre('team', 'Team Analyst — Crédit', 'Banque Exemple', '3 place Bellecour 69002 Lyon', {
    families: ['banque-detail-credit'],
  }),
  offre('audit', 'Auditeur financier junior', 'Audit Exemple', '10 rue X 69003 Lyon', {
    families: ['audit'],
  }),
  offre('cdg', 'Contrôleur de gestion', 'Industrie Exemple', 'Tour First 92400 Courbevoie', {
    families: ['controle-de-gestion'],
  }),
];

const chercher = (q: string) => applyQuery(catalogue, { q }, NOW).map((o) => o.id).sort();

describe('recherche libre', () => {
  it('trouve des mots qui ne se suivent pas', () => {
    /*
     * La saisie était cherchée telle quelle, comme une sous-chaîne. L'intitulé
     * et la ville étant séparés par l'employeur, « analyste paris » ne
     * trouvait rien — toute recherche de plus d'un mot échouait dès que les
     * mots n'étaient pas côte à côte.
     */
    expect(chercher('analyste paris')).toEqual(['ma']);
    expect(chercher('audit lyon')).toEqual(['audit']);
  });

  it('ne dépend pas de l’ordre des mots', () => {
    expect(chercher('exemple conseil')).toEqual(['ma']);
    expect(chercher('lyon audit')).toEqual(['audit']);
  });

  it('accepte un début de mot', () => {
    expect(chercher('contr gest')).toEqual(['cdg']);
    expect(chercher('controle gestion')).toEqual(['cdg']);
  });

  it('exige tous les mots', () => {
    expect(chercher('analyste marseille')).toEqual([]);
  });

  it('ne trouve pas « M&A » au milieu de deux autres mots', () => {
    /*
     * L'esperluette devenait une espace, et « m a » se lit dans
     * « teaM Analyst ». Chercher le métier le plus demandé du site remontait
     * donc des offres qui n'ont rien à voir.
     */
    expect(chercher('M&A')).toEqual(['ma']);
    expect(chercher('M & A')).toEqual(['ma']);
  });

  it('ne trouve pas un morceau de mot', () => {
    // « it » se lisait dans « crédIT » et « audITeur ».
    expect(chercher('it')).toEqual([]);
  });

  it('ignore les accents et la casse', () => {
    expect(chercher('CREDIT')).toEqual(['team']);
    expect(chercher('contrôleur')).toEqual(['cdg']);
  });

  it('cherche aussi dans le métier où le site range l’offre', () => {
    /*
     * « Analyste M&A » ne contient pas le mot « fusions », mais le site le
     * range sous « Fusions-acquisitions » : le chercher doit le trouver.
     */
    expect(chercher('fusions')).toEqual(['ma']);
    expect(chercher('acquisitions')).toEqual(['ma']);
  });

  it('une saisie d’une seule lettre ne filtre rien', () => {
    // Elle commencerait la moitié du catalogue : autant ne pas faire semblant.
    expect(searchTokens('a')).toEqual([]);
    expect(chercher('a')).toHaveLength(catalogue.length);
  });
});

describe('tri par date de publication', () => {
  const a = offre('a', 'A', 'E', '75002 Paris', { publishedAt: '2026-11-05T00:00:00.000Z' });
  const b = offre('b', 'B', 'E', '75002 Paris', { publishedAt: 'pas-une-date' });
  const c = offre('c', 'C', 'E', '75002 Paris', { publishedAt: '2026-11-08T00:00:00.000Z' });
  const d = offre('d', 'D', 'E', '75002 Paris', { publishedAt: '2026-11-01T00:00:00.000Z' });
  const ordre = (offers: Offer[]) => sortOffers(offers, 'recent').map((o) => o.id);

  it('une date illisible ne dérègle pas l’ordre des autres', () => {
    /*
     * `Date.parse` renvoie NaN sur une date mal formée, et une comparaison
     * qui renvoie NaN n'est plus un ordre. Mesuré avant correction : « a b c
     * d », l'ordre des identifiants, au lieu de « c a d b ». Une seule date
     * mal formée dans le catalogue suffisait à fausser « les plus récentes
     * d'abord » pour toutes les offres, sans la moindre erreur.
     */
    expect(ordre([a, b, c, d])).toEqual(['c', 'a', 'd', 'b']);
  });

  it('donne le même résultat quel que soit l’ordre d’arrivée', () => {
    expect(ordre([d, c, b, a])).toEqual(['c', 'a', 'd', 'b']);
    expect(ordre([b, a, d, c])).toEqual(['c', 'a', 'd', 'b']);
  });

  it('une offre sans date passe après les autres', () => {
    const sansDate = offre('z', 'Z', 'E', '75002 Paris', { publishedAt: null });
    expect(ordre([sansDate, a, c])).toEqual(['c', 'a', 'z']);
  });
});
