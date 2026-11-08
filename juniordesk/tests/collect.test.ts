import { describe, it, expect, beforeEach } from 'vitest';
import { collect } from '@/lib/collect';
import { getStore, resetStore } from '@/lib/store';
import type { JobSource } from '@/lib/sources/types';
import type { Offer } from '@/lib/offer';

const NOW = new Date('2026-11-07T03:00:00.000Z');

function offer(id: string, overrides: Partial<Offer> = {}): Offer {
  return {
    id,
    slug: id,
    title: `Alternance analyste ${id}`,
    description: '',
    applyUrl: 'https://employeur.example/x',
    source: { id: 'lba', label: 'LBA', partnerLabel: 'p', partnerJobId: id },
    employer: { name: `Employeur ${id}`, brand: null, siret: null, website: null, size: null },
    place: { address: '', city: 'Paris', citySlug: 'paris', postalCode: '75002', departement: '75', lat: null, lon: null },
    contract: { kinds: ['apprentissage'], start: null, startIsFlexible: false, durationMonths: null, remote: null },
    families: ['banque-detail-credit'],
    romeCodes: ['C1202'],
    targetDiploma: null,
    publishedAt: '2026-11-01T00:00:00.000Z',
    expiresAt: null,
    collectedAt: NOW.toISOString(),
    ...overrides,
  };
}

function source(id: string, offers: Offer[]): JobSource {
  return {
    id,
    label: id,
    contractKinds: ['apprentissage'],
    async fetchAll() {
      return { ok: true, offers, warnings: [] };
    },
  };
}

function brokenSource(id: string, error = 'panne'): JobSource {
  return {
    id,
    label: id,
    contractKinds: ['apprentissage'],
    async fetchAll() {
      return { ok: false, error, retryable: true };
    },
  };
}

beforeEach(() => {
  resetStore();
});

describe('collecte', () => {
  it('enregistre les offres et signale les nouvelles', async () => {
    const report = await collect(NOW, [source('lba', [offer('a'), offer('b')])]);
    expect(report.kept).toBe(2);
    expect(report.newOfferIds.sort()).toEqual(['a', 'b']);

    const snapshot = await getStore().getSnapshot();
    expect(snapshot?.offers).toHaveLength(2);
  });

  it('écarte les offres expirées', async () => {
    const report = await collect(NOW, [
      source('lba', [offer('vive'), offer('morte', { expiresAt: '2026-10-01T00:00:00.000Z' })]),
    ]);
    expect(report.kept).toBe(1);
    expect(report.expired).toBe(1);
  });

  it('une source en panne n’empêche pas les autres', async () => {
    const report = await collect(NOW, [brokenSource('ft'), source('lba', [offer('a')])]);
    expect(report.kept).toBe(1);
    expect(report.sources.find((s) => s.id === 'ft')?.error).toBe('panne');
    expect(report.sources.find((s) => s.id === 'lba')?.count).toBe(1);
  });

  it('CONSERVE l’instantané précédent si toutes les sources échouent', async () => {
    // Le cas de panne qui compte vraiment : une API peut fermer du jour au
    // lendemain — France Travail en est la preuve. Un site qui affiche les
    // offres d'hier reste utile ; un site vide ne l'est pas.
    await collect(NOW, [source('lba', [offer('a'), offer('b')])]);

    const report = await collect(NOW, [brokenSource('lba')]);
    expect(report.keptPreviousSnapshot).toBe(true);
    expect(report.kept).toBe(2);

    const snapshot = await getStore().getSnapshot();
    expect(snapshot?.offers.map((o) => o.id).sort()).toEqual(['a', 'b']);
  });

  it('n’annonce pas deux fois la même offre', async () => {
    const store = getStore();
    const first = await collect(NOW, [source('lba', [offer('a')])]);
    expect(first.newOfferIds).toEqual(['a']);

    await store.markAnnounced(['a']);

    const second = await collect(NOW, [source('lba', [offer('a'), offer('b')])]);
    expect(second.newOfferIds).toEqual(['b']);
  });

  it('une offre retirée puis remise en ligne n’est pas réannoncée', async () => {
    const store = getStore();
    await collect(NOW, [source('lba', [offer('a')])]);
    await store.markAnnounced(['a']);

    // L'offre disparaît…
    await collect(NOW, [source('lba', [])]);
    // …puis revient.
    const report = await collect(NOW, [source('lba', [offer('a')])]);

    expect(report.newOfferIds).toEqual([]);
  });

  it('dédoublonne entre deux sources', async () => {
    // Le helper dérive l'intitulé et l'employeur de l'identifiant : ici on
    // les fixe à la main, puisque c'est précisément le même poste diffusé
    // deux fois sous deux identifiants différents.
    const meme = { title: 'Alternance analyste crédit', employer: offer('x').employer };
    const report = await collect(NOW, [
      source('lba', [offer('lba:p:1', meme)]),
      source('ft', [offer('ft:q:9', meme)]),
    ]);
    // Même intitulé, même employeur, même ville : c'est le même poste.
    expect(report.kept).toBe(1);
    expect(report.crossDuplicates).toBe(1);
  });

  it('remonte les avertissements des sources', async () => {
    const noisy: JobSource = {
      id: 'lba',
      label: 'LBA',
      contractKinds: ['apprentissage'],
      async fetchAll() {
        return { ok: true, offers: [offer('a')], warnings: ['3 offres ignorées'] };
      },
    };
    const report = await collect(NOW, [noisy]);
    expect(report.warnings.join(' ')).toContain('3 offres ignorées');
  });
});
