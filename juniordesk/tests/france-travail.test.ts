import { describe, it, expect } from 'vitest';
import { normalizeFtOffer, readFtExperience } from '@/lib/sources/france-travail';

const COLLECTE = '2026-11-09T00:00:00.000Z';

/**
 * Offre France Travail minimale mais complète.
 *
 * `C1206` est un code ROME bancaire retenu par la taxonomie finance : sans
 * lui, l'offre serait écartée pour une raison qui n'a rien à voir avec ce que
 * ces tests mesurent, et ils passeraient au vert sans rien prouver.
 */
function offre(extra: Record<string, unknown> = {}) {
  return {
    id: 'FT-0001',
    intitule: 'Chargé de clientèle professionnels',
    description: 'Poste en agence bancaire.',
    romeCode: 'C1206',
    typeContrat: 'CDI',
    origineOffre: { urlOrigine: 'https://exemple.fr/offre/1' },
    lieuTravail: { libelle: 'Paris', codePostal: '75002' },
    ...extra,
  };
}

describe('lecture de l’expérience France Travail', () => {
  it('traduit le code « D » en débutant accepté', () => {
    expect(readFtExperience({ experienceExige: 'D' }).acceptsBeginner).toBe(true);
  });

  it('traduit le code « E » en débutant refusé', () => {
    expect(readFtExperience({ experienceExige: 'E' }).acceptsBeginner).toBe(false);
  });

  it('ne conclut rien d’un code inconnu ou absent', () => {
    /*
     * Les codes viennent de ce qui était documenté avant la fermeture de
     * l'API et n'ont pas pu être vérifiés contre une réponse réelle. Un code
     * inattendu doit donc laisser la question ouverte, pas trancher de
     * travers : c'est la règle d'écart par défaut qui décidera.
     */
    expect(readFtExperience({ experienceExige: 'Z' }).acceptsBeginner).toBeNull();
    expect(readFtExperience({}).acceptsBeginner).toBeNull();
  });

  it('garde le libellé, qui est plus précis que le code', () => {
    expect(readFtExperience({ experienceExige: 'E', experienceLibelle: '2 ans' }).label).toBe('2 ans');
  });
});

describe('le niveau d’un CDI ne se déduit pas de son contrat', () => {
  it('écarte un poste de direction', () => {
    const o = normalizeFtOffer(offre({ intitule: 'Directeur d’agence bancaire' }), COLLECTE);
    expect(o).toBeNull();
  });

  it('écarte un poste qui exige de l’expérience', () => {
    const o = normalizeFtOffer(
      offre({ experienceExige: 'E', experienceLibelle: '5 ans' }),
      COLLECTE,
    );
    expect(o).toBeNull();
  });

  it('écarte quand rien ne permet de trancher', () => {
    /*
     * Le cœur de la décision : un CDI dont l'intitulé ne dit rien et dont la
     * source ne déclare pas l'expérience ne rentre pas. On préfère rater une
     * offre que montrer un poste de directeur à un étudiant.
     */
    const o = normalizeFtOffer(offre(), COLLECTE);
    expect(o).toBeNull();
  });

  it('retient un CDI ouvert aux débutants', () => {
    const o = normalizeFtOffer(offre({ experienceExige: 'D' }), COLLECTE);
    expect(o).not.toBeNull();
    expect(o?.experience.acceptsBeginner).toBe(true);
    expect(o?.contract.kinds).toContain('cdi');
  });

  it('retient un CDI dont l’intitulé dit junior', () => {
    const o = normalizeFtOffer(offre({ intitule: 'Analyste crédit junior' }), COLLECTE);
    expect(o).not.toBeNull();
  });
});

describe('les contrats qui portent leur niveau ne passent pas l’épreuve', () => {
  it('un stage reste un stage, même sans rien dire de l’expérience', () => {
    /*
     * Un stage est par construction un poste d'étudiant. Le soumettre à la
     * règle junior le ferait écarter pour « silence », ce qui serait absurde.
     */
    const o = normalizeFtOffer(
      offre({ typeContrat: 'STG', intitule: 'Stage — Analyste financier' }),
      COLLECTE,
    );
    expect(o).not.toBeNull();
    expect(o?.contract.kinds).toContain('stage');
  });

  it('une alternance non plus', () => {
    const o = normalizeFtOffer(
      offre({ alternance: true, natureContrat: 'Contrat d’apprentissage', intitule: 'Alternance — Chargé de clientèle' }),
      COLLECTE,
    );
    expect(o).not.toBeNull();
    expect(o?.contract.kinds).toContain('apprentissage');
  });

  it('un stage dont l’intitulé contient « senior » reste retenu', () => {
    // L'épreuve n'est pas appliquée : le type de contrat a déjà tranché.
    const o = normalizeFtOffer(
      offre({ typeContrat: 'STG', intitule: 'Stage auprès du conseiller senior' }),
      COLLECTE,
    );
    expect(o).not.toBeNull();
  });
});
