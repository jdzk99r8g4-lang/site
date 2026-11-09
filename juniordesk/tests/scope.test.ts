import { describe, it, expect } from 'vitest';
import { brand } from '@/lib/brand';
import { createLbaSource } from '@/lib/sources/lba';
import { createFranceTravailSource } from '@/lib/sources/france-travail';
import { CONTRACT_GROUPS, groupOf, groupsLabel, groupsPresent } from '@/lib/offer';

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

  it('la mission annonce les trois familles', () => {
    /*
     * Ce que le site EST ne dépend pas des sources branchées un jour donné.
     * Un étudiant qui cherche un stage doit comprendre que ce site est pour
     * lui, même si le catalogue ne lui offre rien aujourd'hui — sinon il ne
     * revient pas.
     */
    const mission = brand.scope.mission.toLowerCase();
    for (const famille of ['stage', 'alternance', 'poste']) {
      expect(mission, famille).toContain(famille);
    }
    const promesse = `${brand.pitch} ${brand.tagline}`.toLowerCase();
    expect(promesse).toContain('stage');
    expect(promesse).toContain('alternance');
  });

  it('la disponibilité dit ce qui est réellement dans le catalogue', () => {
    /*
     * Le contrepoids de la règle précédente, et le vrai garde-fou : annoncer
     * les trois familles sans dire ce qu'on a ferait venir des étudiants pour
     * rien. Cette phrase doit nommer ce qui est collecté ET dire que le reste
     * ne l'est pas encore.
     */
    const dispo = `${brand.scope.available.label} ${brand.scope.available.detail}`.toLowerCase();
    expect(dispo).toContain('alternance');
    expect(dispo).toContain('stage');
    expect(dispo).toMatch(/ne sont pas encore/);
  });

  it('la disponibilité annoncée correspond aux sources réellement actives', () => {
    /*
     * Le jour où une source de stages sera branchée, ce test échouera et
     * forcera la mise à jour de la phrase : sans lui, le site continuerait
     * d'annoncer qu'il n'a pas de stages alors qu'il en aurait.
     */
    const actives = [createLbaSource({ apiKey: 'test' })];
    const groupes = new Set(actives.flatMap((s) => s.contractKinds.map(groupOf)));
    const dispo = brand.scope.available.label.toLowerCase();

    expect(groupes.has('alternance')).toBe(true);
    expect(dispo).toContain('alternance');
    // Tant que rien ne produit de stage, la phrase doit rester au singulier.
    expect(groupes.has('stage'), 'une source de stages est branchée : mettre à jour brand.scope.available').toBe(false);
    expect(groupes.has('junior'), 'une source de postes juniors est branchée : mettre à jour brand.scope.available').toBe(false);
  });

  it('les trois familles de contrat sont connues', () => {
    expect([...CONTRACT_GROUPS]).toEqual(['stage', 'alternance', 'junior']);
  });
});

describe('les titres décrivent ce que la page contient', () => {
  it('une seule famille garde le singulier', () => {
    // « Alternance audit » se lit et se cherche ; « Alternances audit » non.
    expect(groupsLabel(['alternance'])).toBe('Alternance');
    expect(groupsLabel(['stage'])).toBe('Stage');
    expect(groupsLabel(['junior'])).toBe('Poste junior');
  });

  it('plusieurs familles s’énumèrent au pluriel', () => {
    expect(groupsLabel(['stage', 'alternance'])).toBe('Stages et alternances');
    expect(groupsLabel(['stage', 'alternance', 'junior'])).toBe(
      'Stages, alternances et postes juniors',
    );
  });

  it('garde l’ordre canonique quel que soit celui d’entrée', () => {
    expect(groupsLabel(['junior', 'stage'])).toBe('Stages et postes juniors');
  });

  it('une liste vide ne produit pas une phrase bancale', () => {
    expect(groupsLabel([])).toBe('Offres');
  });

  it('suit le catalogue au lieu d’être figé', () => {
    /*
     * Le point de l'exercice. Figer « Alternance » rendrait chaque titre faux
     * le jour où les stages arrivent, sans que rien ne le signale ; figer les
     * trois familles promettrait aujourd'hui des stages que la page n'a pas.
     */
    const offre = (...kinds: Parameters<typeof groupOf>[0][]) => ({ contract: { kinds } });
    expect(groupsLabel(groupsPresent([offre('apprentissage')]))).toBe('Alternance');
    expect(groupsLabel(groupsPresent([offre('apprentissage'), offre('stage')]))).toBe(
      'Stages et alternances',
    );
  });
});
