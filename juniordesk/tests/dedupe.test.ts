import { describe, it, expect } from 'vitest';
import { dedupe, fingerprint } from '@/lib/dedupe';
import type { Offer } from '@/lib/offer';

function offer(overrides: Partial<Offer> & { id: string }): Offer {
  return {
    slug: 'x',
    title: 'Alternance analyste crédit',
    description: '',
    applyUrl: 'https://employeur.example/postuler',
    source: { id: 'lba', label: 'LBA', partnerLabel: 'p', partnerJobId: '1' },
    employer: { name: 'Banque', brand: null, siret: '12345678900011', website: null, size: null },
    place: { address: '', city: 'Paris', citySlug: 'paris', postalCode: '75002', departement: '75', lat: null, lon: null },
    contract: { kinds: ['apprentissage'], start: null, startIsFlexible: false, durationMonths: null, remote: null },
    families: ['banque-credit'],
    romeCodes: ['C1202'],
    targetDiploma: null,
    publishedAt: '2026-11-01T00:00:00.000Z',
    expiresAt: null,
    collectedAt: '2026-11-07T00:00:00.000Z',
    ...overrides,
  };
}

describe('dédoublonnage', () => {
  it('retire les doublons d’identifiant', () => {
    // « b » porte un autre intitulé, sinon il serait fusionné avec « a » par
    // l'empreinte inter-sources — ce qui est le comportement voulu, mais ce
    // n'est pas ce qu'on teste ici.
    const report = dedupe([
      offer({ id: 'a' }),
      offer({ id: 'a' }),
      offer({ id: 'b', title: 'Alternance gestionnaire back-office' }),
    ]);
    expect(report.offers).toHaveLength(2);
    expect(report.exactDuplicates).toBe(1);
    expect(report.crossDuplicates).toBe(0);
  });

  it('retire le même poste diffusé par deux partenaires différents', () => {
    // Cas réel : La bonne alternance republie des offres de France Travail et
    // de ses propres partenaires. Aucun identifiant n'est commun.
    const report = dedupe([
      offer({ id: 'lba:partenaireA:1' }),
      offer({ id: 'lba:partenaireB:9' }),
    ]);
    expect(report.offers).toHaveLength(1);
    expect(report.crossDuplicates).toBe(1);
  });

  it('ne confond pas deux postes identiques dans deux villes', () => {
    const report = dedupe([
      offer({ id: 'a' }),
      offer({
        id: 'b',
        place: { address: '', city: 'Lyon', citySlug: 'lyon', postalCode: '69002', departement: '69', lat: null, lon: null },
      }),
    ]);
    expect(report.offers).toHaveLength(2);
  });

  it('préfère la source la plus riche en cas de doublon', () => {
    // La bonne alternance fournit la date d'expiration et le niveau de
    // diplôme ; France Travail non. À contenu égal, on garde la première.
    const report = dedupe([
      offer({ id: 'ft', source: { id: 'france-travail', label: 'FT', partnerLabel: 'ft', partnerJobId: '1' } }),
      offer({ id: 'lba', source: { id: 'lba', label: 'LBA', partnerLabel: 'p', partnerJobId: '2' } }),
    ]);
    expect(report.offers).toHaveLength(1);
    expect(report.offers[0]?.source.id).toBe('lba');
  });

  it('à source égale, garde la publication la plus récente', () => {
    const report = dedupe([
      offer({ id: 'vieille', publishedAt: '2026-01-01T00:00:00.000Z' }),
      offer({ id: 'recente', publishedAt: '2026-11-01T00:00:00.000Z' }),
    ]);
    expect(report.offers[0]?.id).toBe('recente');
  });

  it('est déterministe : deux exécutions donnent le même gagnant', () => {
    const input = [offer({ id: 'b' }), offer({ id: 'a' })];
    const first = dedupe(input).offers[0]?.id;
    const second = dedupe([...input].reverse()).offers[0]?.id;
    expect(first).toBe(second);
  });

  it('l’empreinte ignore la casse et les accents de l’intitulé', () => {
    expect(fingerprint(offer({ id: 'a', title: 'Alternance Analyste Crédit' }))).toBe(
      fingerprint(offer({ id: 'b', title: 'ALTERNANCE ANALYSTE CREDIT' })),
    );
  });

  it('une liste vide ne casse rien', () => {
    expect(dedupe([])).toEqual({ offers: [], exactDuplicates: 0, crossDuplicates: 0 });
  });
});
