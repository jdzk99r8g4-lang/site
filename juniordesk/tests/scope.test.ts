import { describe, it, expect } from 'vitest';
import { brand } from '@/lib/brand';
import { createLbaSource } from '@/lib/sources/lba';
import { createFranceTravailSource } from '@/lib/sources/france-travail';
import { CONTRACT_GROUPS, groupOf } from '@/lib/offer';

/**
 * Cohérence entre ce que le site ANNONCE et ce que les sources PRODUISENT.
 *
 * C'est le test le plus important du lot sur le plan éditorial : si une
 * source de stages est branchée un jour et que `brand.scope` n'est pas mis à
 * jour, le site continuera de dire qu'il n'a pas de stages alors qu'il en a.
 * Et, dans l'autre sens, il ne doit jamais promettre ce qu'il n'a pas.
 */
describe('périmètre annoncé', () => {
  it('La bonne alternance ne produit que de l’alternance', () => {
    // L'énumération `contract.type` de l'API n'admet que « Apprentissage » et
    // « Professionnalisation ». Si cela change un jour, ce test le signalera.
    const source = createLbaSource({ apiKey: 'test' });
    const groups = new Set(source.contractKinds.map(groupOf));
    expect([...groups]).toEqual(['alternance']);
  });

  it('l’adaptateur France Travail, lui, couvre stages et postes juniors', () => {
    const source = createFranceTravailSource({ clientId: 'x', clientSecret: 'y' });
    const groups = new Set(source.contractKinds.map(groupOf));
    expect(groups.has('stage')).toBe(true);
    expect(groups.has('junior')).toBe(true);
  });

  it('le périmètre annoncé dit « alternance » et ne promet ni stage ni poste junior', () => {
    const announced = `${brand.scope.label} ${brand.pitch} ${brand.tagline}`.toLowerCase();
    expect(announced).toContain('alternance');
    // Le détail a le droit — et le devoir — de parler des stages pour dire
    // qu'ils ne sont PAS couverts ; la promesse, non.
    expect(brand.scope.detail.toLowerCase()).toContain('stage');
    expect(brand.scope.detail.toLowerCase()).toMatch(/ne sont pas encore couverts/);
  });

  it('les trois familles de contrat sont connues', () => {
    expect([...CONTRACT_GROUPS]).toEqual(['stage', 'alternance', 'junior']);
  });
});
