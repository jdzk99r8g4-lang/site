import { describe, it, expect } from 'vitest';
import { offerSlug, shortCode, slugCode, slugify } from '@/lib/slug';

describe('formes URL', () => {
  it('retire accents, apostrophes et ponctuation', () => {
    expect(slugify('Alternance — Chargé de clientèle bancaire')).toBe(
      'alternance-charge-de-clientele-bancaire',
    );
    expect(slugify("Gestion d’actifs & M&A")).toBe('gestion-d-actifs-m-a');
  });

  it('borne le nombre de mots', () => {
    expect(slugify('un deux trois quatre cinq six', 3)).toBe('un-deux-trois');
  });

  it('le code court est stable et de longueur fixe', () => {
    expect(shortCode('lba:p:1')).toBe(shortCode('lba:p:1'));
    expect(shortCode('lba:p:1')).toHaveLength(8);
    expect(shortCode('lba:p:1')).not.toBe(shortCode('lba:p:2'));
  });

  it('le slug d’offre se termine par le code et reste résoluble', () => {
    const slug = offerSlug({ id: 'lba:p:1', title: 'Alternance analyste crédit', city: 'Paris' });
    expect(slug).toMatch(/^alternance-analyste-credit-paris-[a-z0-9]{8}$/);
    expect(slugCode(slug)).toBe(shortCode('lba:p:1'));
  });

  it('un changement d’intitulé ne casse pas le lien indexé', () => {
    // Seul le suffixe sert à résoudre : l'ancien lien continue de fonctionner.
    const avant = offerSlug({ id: 'lba:p:1', title: 'Alternance analyste', city: 'Paris' });
    const apres = offerSlug({ id: 'lba:p:1', title: 'Alternance analyste crédit H/F', city: 'Paris' });
    expect(slugCode(avant)).toBe(slugCode(apres));
  });

  it('un intitulé vide produit tout de même un slug utilisable', () => {
    const slug = offerSlug({ id: 'lba:p:1', title: '!!!', city: null });
    expect(slug).toMatch(/^[a-z0-9]{8}$/);
  });
});
