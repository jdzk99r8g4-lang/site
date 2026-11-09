import { describe, it, expect } from 'vitest';
import {
  MAX_JUNIOR_YEARS,
  SENIORITY_MARKERS,
  assessSeniority,
  parseExperienceYears,
} from '@/lib/seniority';

describe('lecture de l’expérience annoncée', () => {
  it('lit les années et les mois', () => {
    expect(parseExperienceYears('2 ans')).toBe(2);
    expect(parseExperienceYears('5 ans d’expérience exigée')).toBe(5);
    expect(parseExperienceYears('1 an')).toBe(1);
    expect(parseExperienceYears('24 mois')).toBe(2);
    expect(parseExperienceYears('6 mois')).toBe(0.5);
  });

  it('retient la borne basse d’un intervalle', () => {
    // « 3 à 5 ans » exige trois ans. C'est trois qui décide, pas cinq.
    expect(parseExperienceYears('3 à 5 ans')).toBe(3);
  });

  it('comprend « débutant accepté » comme zéro année', () => {
    expect(parseExperienceYears('Débutant accepté')).toBe(0);
    expect(parseExperienceYears('debutant accepte')).toBe(0);
  });

  it('distingue « on ne sait pas » de « zéro »', () => {
    /*
     * null n'est pas 0. Une source muette ne déclare pas un poste ouvert aux
     * débutants : elle ne déclare rien, et c'est ce qui fait écarter l'offre
     * plus loin.
     */
    expect(parseExperienceYears(null)).toBeNull();
    expect(parseExperienceYears('')).toBeNull();
    expect(parseExperienceYears('Expérience souhaitée')).toBeNull();
  });
});

describe('un intitulé de poste senior l’emporte sur tout', () => {
  it('écarte les postes d’encadrement', () => {
    for (const titre of [
      'Directeur financier',
      'Responsable du contrôle de gestion',
      'Analyste senior M&A',
      'Chef de mission audit',
      'Head of Risk',
      'Associate — Fusions-acquisitions',
      'VP Marchés financiers',
      'Comptable confirmé',
    ]) {
      const v = assessSeniority({ title: titre });
      expect(v.junior, titre).toBe(false);
      expect(v.via, titre).toBe('exclusion');
    }
  });

  it('écarte un poste senior même si la source accepte les débutants', () => {
    /*
     * Une source peut cocher « débutant accepté » sur une offre de direction.
     * L'employeur dit alors qui peut postuler ; l'intitulé dit quel est le
     * poste. C'est le poste qui compte pour un site de premiers emplois.
     */
    const v = assessSeniority({
      title: 'Directeur administratif et financier',
      experience: { label: 'Débutant accepté', minYears: 0, acceptsBeginner: true },
    });
    expect(v.junior).toBe(false);
    expect(v.via).toBe('exclusion');
  });

  it('écarte sur une expérience annoncée dans l’intitulé', () => {
    const v = assessSeniority({ title: 'Analyste crédit — 5 ans d’expérience' });
    expect(v.junior).toBe(false);
    expect(v.via).toBe('exclusion');
  });

  it('ne prend pas la durée d’un contrat pour de l’expérience', () => {
    /*
     * « CDD 24 mois » dit la durée du CONTRAT, pas celle de la CARRIÈRE. Sans
     * la condition sur le mot « expérience », ce poste était écarté comme
     * s'il exigeait deux ans de métier.
     */
    const v = assessSeniority({ title: 'CDD 24 mois — Comptable' });
    expect(v.via).not.toBe('exclusion');
  });
});

describe('l’expérience déclarée par la source', () => {
  it('retient un poste ouvert aux débutants', () => {
    const v = assessSeniority({
      title: 'Chargé de clientèle professionnels',
      experience: { label: 'Débutant accepté', minYears: null, acceptsBeginner: true },
    });
    expect(v.junior).toBe(true);
    expect(v.via).toBe('experience');
  });

  it(`retient jusqu'à ${MAX_JUNIOR_YEARS} an d’expérience et pas au-delà`, () => {
    const avec = (minYears: number) =>
      assessSeniority({
        title: 'Chargé de clientèle professionnels',
        experience: { label: null, minYears, acceptsBeginner: null },
      });
    expect(avec(0).junior).toBe(true);
    expect(avec(MAX_JUNIOR_YEARS).junior).toBe(true);
    expect(avec(MAX_JUNIOR_YEARS + 1).junior).toBe(false);
    expect(avec(5).junior).toBe(false);
  });

  it('passe avant les marqueurs d’intitulé', () => {
    /*
     * « Analyste » est un grade d'entrée, mais si la source dit trois ans,
     * c'est la source qui a raison : elle décrit cette offre-là.
     */
    const v = assessSeniority({
      title: 'Analyste financier',
      experience: { label: '3 ans', minYears: 3, acceptsBeginner: null },
    });
    expect(v.junior).toBe(false);
    expect(v.via).toBe('experience');
  });
});

describe('les marqueurs d’intitulé, faute de mieux', () => {
  it('reconnaît les postes d’entrée', () => {
    for (const titre of [
      'Analyste M&A junior',
      'Chargé d’études — jeune diplômé',
      'Graduate Programme Finance',
      'VIE — Contrôle de gestion',
      'Analyste private equity',
      'Assistant comptable',
    ]) {
      const v = assessSeniority({ title: titre });
      expect(v.junior, titre).toBe(true);
    }
  });

  it('ne confond pas « VIE » avec un mot qui le contient', () => {
    // Comparaison sur des mots entiers : « vie professionnelle » n'est pas un VIE.
    const v = assessSeniority({ title: 'Conseiller en épargne et vie professionnelle' });
    expect(v.via).not.toBe('intitule');
  });
});

describe('quand rien ne permet de trancher', () => {
  it('écarte, et le dit', () => {
    /*
     * La décision la plus lourde du fichier. Rater une offre coûte à
     * l'étudiant une occasion qu'il n'a jamais vue ; lui montrer un poste de
     * directeur étiqueté « junior » lui coûte sa confiance, et celle-là ne
     * revient pas.
     */
    const v = assessSeniority({ title: 'Gestionnaire back-office titres' });
    expect(v.junior).toBe(false);
    expect(v.via).toBe('silence');
    expect(v.evidence).toBeNull();
  });

  it('une expérience « souhaitée » sans chiffre ne suffit pas à retenir', () => {
    const v = assessSeniority({
      title: 'Gestionnaire back-office titres',
      experience: { label: 'Expérience souhaitée', minYears: null, acceptsBeginner: null },
    });
    expect(v.junior).toBe(false);
  });
});

describe('garde-fous', () => {
  it('aucune liste de marqueurs ne s’est vidée', () => {
    // Une liste vide ferait passer tout le monde, sans que rien n'échoue.
    expect(SENIORITY_MARKERS.senior.length).toBeGreaterThan(10);
    expect(SENIORITY_MARKERS.junior.length).toBeGreaterThan(8);
  });

  it('aucun marqueur junior n’est aussi un marqueur senior', () => {
    const senior = new Set(SENIORITY_MARKERS.senior);
    for (const m of SENIORITY_MARKERS.junior) {
      expect(senior.has(m), m).toBe(false);
    }
  });
});
