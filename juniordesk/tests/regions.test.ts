import { describe, it, expect } from 'vitest';
import { REGIONS, departementCount, regionBySlug, regionOf } from '@/lib/regions';
import { parseAddress } from '@/lib/geo';
import { applyQuery, buildFacets } from '@/lib/filters';
import type { Offer } from '@/lib/offer';
import { NO_EXPERIENCE_SIGNAL } from '@/lib/seniority';

const NOW = new Date('2026-11-08T12:00:00.000Z');

function offerAt(id: string, address: string): Offer {
  const place = parseAddress(address);
  return {
    id,
    slug: id,
    title: 'Alternance analyste crédit',
    description: '',
    applyUrl: 'https://employeur.example/x',
    source: { id: 'lba', label: 'LBA', partnerLabel: 'p', partnerJobId: id },
    employer: { name: `Employeur ${id}`, brand: null, siret: null, website: null, size: null },
    place: { ...place, address, lat: null, lon: null },
    contract: { kinds: ['apprentissage'], start: null, startIsFlexible: false, durationMonths: null, remote: null },
    families: ['banque-detail-credit'],
    romeCodes: ['C1202'],
    targetDiploma: null,
    experience: NO_EXPERIENCE_SIGNAL,
    publishedAt: '2026-11-01T00:00:00.000Z',
    expiresAt: null,
    collectedAt: NOW.toISOString(),
  };
}

describe('découpage administratif', () => {
  it('porte les dix-huit régions et les cent un départements', () => {
    expect(REGIONS).toHaveLength(18);
    expect(departementCount()).toBe(101);
  });

  it('aucun département n’est rattaché à une région inconnue', () => {
    const codes = new Set(REGIONS.map((r) => r.code));
    // On passe par tous les départements métropolitains et d'outre-mer.
    const departements = [
      ...Array.from({ length: 95 }, (_, i) => String(i + 1).padStart(2, '0')),
      '2A', '2B', '971', '972', '973', '974', '976',
    ].filter((d) => d !== '20');

    const orphans = departements.filter((d) => {
      const region = regionOf(d);
      return region !== null && !codes.has(region.code);
    });
    expect(orphans).toEqual([]);
  });

  it('les slugs sont uniques et en forme URL', () => {
    const slugs = REGIONS.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9-]+$/);
  });

  it('résout la Corse malgré l’ambiguïté 2A / 2B', () => {
    // `departementFromPostal` renvoie « 20 » faute de pouvoir départager, mais
    // les deux départements sont dans la même région : on peut conclure.
    expect(regionOf('20')?.name).toBe('Corse');
    expect(regionOf('2A')?.name).toBe('Corse');
    expect(regionOf('2B')?.name).toBe('Corse');
  });

  it('renvoie null plutôt que d’inventer, hors départements', () => {
    // Nouvelle-Calédonie, Polynésie : collectivités, pas départements.
    for (const code of ['988', '987', '975', 'zz', '', null, undefined]) {
      expect(regionOf(code), String(code)).toBeNull();
    }
  });

  it('retrouve une région par son slug', () => {
    expect(regionBySlug('ile-de-france')?.name).toBe('Île-de-France');
    expect(regionBySlug('nexiste-pas')).toBeUndefined();
  });
});

describe('le cas La Défense', () => {
  /*
   * La raison d'être du filtre par région. La Défense est administrativement
   * à Puteaux et à Courbevoie (92), pas à Paris (75). Un étudiant qui filtre
   * « Paris » rate ces offres, qui sont parmi les plus nombreuses du secteur.
   */
  const offers = [
    offerAt('paris', '6 avenue de Provence 75009 Paris'),
    offerAt('puteaux', '16 cours Valmy 92800 Puteaux'),
    offerAt('courbevoie', '1 place de la Défense 92400 Courbevoie'),
    offerAt('lyon', '3 place Bellecour 69002 Lyon'),
  ];

  it('Paris et La Défense sont des villes différentes', () => {
    expect(applyQuery(offers, { cities: ['paris'] }, NOW).map((o) => o.id)).toEqual(['paris']);
  });

  it('mais la même région, et le filtre par région les réunit', () => {
    const idf = applyQuery(offers, { regions: ['ile-de-france'] }, NOW).map((o) => o.id);
    expect(idf.sort()).toEqual(['courbevoie', 'paris', 'puteaux']);
  });

  it('une autre région ne les ramène pas', () => {
    expect(
      applyQuery(offers, { regions: ['auvergne-rhone-alpes'] }, NOW).map((o) => o.id),
    ).toEqual(['lyon']);
  });

  it('région et ville se cumulent', () => {
    expect(
      applyQuery(offers, { regions: ['ile-de-france'], cities: ['puteaux'] }, NOW).map((o) => o.id),
    ).toEqual(['puteaux']);
  });
});

describe('facettes de région', () => {
  const offers = [
    offerAt('a', '6 avenue de Provence 75009 Paris'),
    offerAt('b', '16 cours Valmy 92800 Puteaux'),
    offerAt('c', '3 place Bellecour 69002 Lyon'),
  ];

  it('classe par volume, pas par alphabet', () => {
    // L'Île-de-France concentre l'essentiel des postes en finance : elle doit
    // arriver en tête même si son nom finit l'alphabet.
    const { regions } = buildFacets(offers, ['alternance'], NOW);
    expect(regions[0]).toMatchObject({ label: 'Île-de-France', count: 2 });
    expect(regions[1]).toMatchObject({ label: 'Auvergne-Rhône-Alpes', count: 1 });
  });

  it('n’affiche pas les régions sans offre', () => {
    const { regions } = buildFacets(offers, ['alternance'], NOW);
    expect(regions).toHaveLength(2);
    expect(regions.some((r) => r.label === 'Mayotte')).toBe(false);
  });

  it('une offre sans lieu exploitable ne casse rien', () => {
    const { regions } = buildFacets([offerAt('x', 'Télétravail')], ['alternance'], NOW);
    expect(regions).toEqual([]);
  });
});
