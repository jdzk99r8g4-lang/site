import { describe, it, expect } from 'vitest';
import { applyQuery, buildFacets, sortOffers } from '@/lib/filters';
import type { ContractKind, Offer } from '@/lib/offer';
import { NO_EXPERIENCE_SIGNAL } from '@/lib/seniority';

const NOW = new Date('2026-11-07T12:00:00.000Z');

function offer(id: string, overrides: Partial<Offer> = {}): Offer {
  return {
    id,
    slug: id,
    title: 'Alternance analyste',
    description: '',
    applyUrl: 'https://employeur.example/x',
    source: { id: 'lba', label: 'LBA', partnerLabel: 'p', partnerJobId: id },
    employer: { name: 'Banque Exemple', brand: null, siret: null, website: null, size: null },
    place: { address: '', city: 'Paris', citySlug: 'paris', postalCode: '75002', departement: '75', lat: null, lon: null },
    contract: { kinds: ['apprentissage'] as ContractKind[], start: '2027-01-01', startIsFlexible: false, durationMonths: 12, remote: null },
    families: ['banque-detail-credit'],
    romeCodes: ['C1202'],
    targetDiploma: null,
    experience: NO_EXPERIENCE_SIGNAL,
    publishedAt: '2026-11-01T00:00:00.000Z',
    expiresAt: null,
    collectedAt: NOW.toISOString(),
    ...overrides,
  };
}

describe('filtrage', () => {
  it('écarte une offre expirée quels que soient les filtres', () => {
    // Une offre peut expirer entre deux collectes : la vérification doit avoir
    // lieu à la lecture, pas seulement à la collecte.
    const offers = [offer('vive'), offer('morte', { expiresAt: '2026-10-01T00:00:00.000Z' })];
    expect(applyQuery(offers, {}, NOW).map((o) => o.id)).toEqual(['vive']);
  });

  it('filtre par famille de contrat', () => {
    const offers = [
      offer('alt'),
      offer('stg', { contract: { ...offer('x').contract, kinds: ['stage'] } }),
      offer('jun', { contract: { ...offer('x').contract, kinds: ['cdi'] } }),
    ];
    expect(applyQuery(offers, { groups: ['stage'] }, NOW).map((o) => o.id)).toEqual(['stg']);
    expect(applyQuery(offers, { groups: ['junior'] }, NOW).map((o) => o.id)).toEqual(['jun']);
    expect(applyQuery(offers, { groups: ['alternance'] }, NOW).map((o) => o.id)).toEqual(['alt']);
  });

  it('regroupe apprentissage et professionnalisation sous « alternance »', () => {
    const offers = [
      offer('appr'),
      offer('pro', { contract: { ...offer('x').contract, kinds: ['professionnalisation'] } }),
    ];
    expect(applyQuery(offers, { groups: ['alternance'] }, NOW)).toHaveLength(2);
  });

  it('filtre par métier et par ville', () => {
    const offers = [
      offer('paris'),
      offer('lyon', {
        families: ['audit'],
        place: { address: '', city: 'Lyon', citySlug: 'lyon', postalCode: '69002', departement: '69', lat: null, lon: null },
      }),
    ];
    expect(applyQuery(offers, { cities: ['lyon'] }, NOW).map((o) => o.id)).toEqual(['lyon']);
    expect(applyQuery(offers, { families: ['audit'] }, NOW).map((o) => o.id)).toEqual(['lyon']);
  });

  it('garde les offres sans date de début quand on filtre sur la date', () => {
    // Écarter une offre parce que l'employeur n'a pas précisé la date
    // reviendrait à punir le candidat pour une imprécision qui n'est pas la
    // sienne.
    const offers = [
      offer('datee', { contract: { ...offer('x').contract, start: '2027-06-01' } }),
      offer('sans', { contract: { ...offer('x').contract, start: null } }),
    ];
    const result = applyQuery(offers, { startsBefore: '2027-01-01' }, NOW);
    expect(result.map((o) => o.id)).toEqual(['sans']);
  });

  it('la recherche libre ignore accents et casse', () => {
    const offers = [offer('a', { title: 'Alternance Analyste Crédit' })];
    expect(applyQuery(offers, { q: 'credit' }, NOW)).toHaveLength(1);
    expect(applyQuery(offers, { q: 'CRÉDIT' }, NOW)).toHaveLength(1);
    expect(applyQuery(offers, { q: 'plomberie' }, NOW)).toHaveLength(0);
  });

  it('le tri est stable : deux appels donnent le même ordre', () => {
    const offers = [offer('b'), offer('a'), offer('c')];
    expect(sortOffers(offers, 'recent').map((o) => o.id)).toEqual(
      sortOffers([...offers].reverse(), 'recent').map((o) => o.id),
    );
  });

  it('le tri par date de début place les offres sans date à la fin', () => {
    const offers = [
      offer('sans', { contract: { ...offer('x').contract, start: null } }),
      offer('tot', { contract: { ...offer('x').contract, start: '2026-12-01' } }),
    ];
    expect(sortOffers(offers, 'start').map((o) => o.id)).toEqual(['tot', 'sans']);
  });
});

describe('facettes', () => {
  it('les trois familles de contrat sont toujours présentes, même à zéro', () => {
    // Masquer « Stage » laisserait croire que le site en contient et que la
    // recherche a échoué.
    const facets = buildFacets([offer('a')], ['alternance'], NOW);
    expect(facets.groups.map((g) => g.value)).toEqual(['stage', 'alternance', 'junior']);
    expect(facets.groups.find((g) => g.value === 'stage')).toMatchObject({ count: 0, sourced: false });
    expect(facets.groups.find((g) => g.value === 'alternance')).toMatchObject({ count: 1, sourced: true });
  });

  it('les facettes de métier à zéro ne sont pas affichées', () => {
    const facets = buildFacets([offer('a')], ['alternance'], NOW);
    expect(facets.families.map((f) => f.value)).toEqual(['banque-detail-credit']);
  });

  it('les offres expirées ne comptent pas dans les facettes', () => {
    const facets = buildFacets(
      [offer('morte', { expiresAt: '2026-01-01T00:00:00.000Z' })],
      ['alternance'],
      NOW,
    );
    expect(facets.families).toEqual([]);
    expect(facets.groups.every((g) => g.count === 0)).toBe(true);
  });
});
