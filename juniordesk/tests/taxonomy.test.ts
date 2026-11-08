import { describe, it, expect } from 'vitest';
import {
  EXCLUDED_ROME,
  JOB_FAMILIES,
  allFamilySlugs,
  familyBySlug,
  hasFinanceKeyword,
  isExcludedByKeyword,
  matchFamilies,
} from '@/lib/taxonomy';

/**
 * Le périmètre finance est la décision la plus structurante du site : c'est
 * lui qui détermine ce qu'un étudiant voit. Ces tests le verrouillent.
 */
describe('périmètre finance', () => {
  it('tous les codes ROME ont la forme officielle (une lettre, quatre chiffres)', () => {
    for (const family of JOB_FAMILIES) {
      for (const code of family.romeCodes) {
        expect(code, `${family.slug} : ${code}`).toMatch(/^[A-Z]\d{4}$/);
      }
    }
  });

  it('aucun code n’est rattaché à deux familles', () => {
    const seen = new Map<string, string>();
    for (const family of JOB_FAMILIES) {
      for (const code of family.romeCodes) {
        const previous = seen.get(code);
        expect(previous, `${code} est dans ${previous} ET ${family.slug}`).toBeUndefined();
        seen.set(code, family.slug);
      }
    }
  });

  it('aucun code explicitement exclu ne s’est glissé dans une famille', () => {
    const excluded = new Set(EXCLUDED_ROME.map((e) => e.code));
    for (const family of JOB_FAMILIES) {
      for (const code of family.romeCodes) {
        expect(excluded.has(code), `${code} est exclu mais figure dans ${family.slug}`).toBe(false);
      }
    }
  });

  it('les slugs sont uniques et en forme URL', () => {
    const slugs = allFamilySlugs();
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9-]+$/);
  });

  it('retient une offre sur son code ROME', () => {
    // M1219 = Conseiller en fusion et acquisition.
    const result = matchFamilies({ title: 'Alternance analyste', romeCodes: ['M1219'] });
    expect(result.via).toBe('rome');
    expect(result.families).toEqual(['fusions-acquisitions']);
  });

  it('retient une offre M&A dont le code ROME est générique, grâce à l’intitulé', () => {
    // Un employeur code son alternance M&A en « M1203 Comptable » : sans
    // rattrapage par l'intitulé, l'offre serait rangée en comptabilité.
    const result = matchFamilies({
      title: 'Alternance — Analyste fusions acquisitions',
      romeCodes: [],
    });
    expect(result.via).toBe('keyword');
    expect(result.families).toEqual(['fusions-acquisitions']);
  });

  it('écarte une offre hors périmètre', () => {
    const result = matchFamilies({ title: 'Alternance boulanger', romeCodes: ['D1102'] });
    expect(result.families).toEqual([]);
  });

  it('écarte « assurance qualité », qui n’est pas de l’assurance', () => {
    expect(hasFinanceKeyword('Alternance assurance qualité en industrie')).toBe(true);
    expect(isExcludedByKeyword('Alternance assurance qualité en industrie')).toBe(true);
    expect(matchFamilies({ title: 'Alternance assurance qualité', romeCodes: [] }).families).toEqual(
      [],
    );
  });

  it('écarte « audit énergétique », qui n’est pas de l’audit financier', () => {
    expect(matchFamilies({ title: 'Alternance audit énergétique bâtiment', romeCodes: [] }).families)
      .toEqual([]);
  });

  it('un terme d’exclusion l’emporte même sur un code ROME du périmètre', () => {
    // Garde-fou : un employeur qui code mal son offre ne doit pas pouvoir
    // faire entrer un poste d'usine dans un site d'offres finance.
    const result = matchFamilies({
      title: 'Alternance responsable assurance qualité',
      romeCodes: ['C1101'],
    });
    expect(result.families).toEqual([]);
  });

  it('l’immobilier reste dehors', () => {
    expect(matchFamilies({ title: 'Alternance conseiller immobilier', romeCodes: ['C1504'] }).families)
      .toEqual([]);
  });

  it('les familles sont renvoyées dans l’ordre d’affichage, pas dans celui des codes', () => {
    const result = matchFamilies({
      title: 'Alternance polyvalente',
      // M1204 (contrôle de gestion) est déclaré après C1206 (banque).
      romeCodes: ['M1204', 'C1206'],
    });
    expect(result.families).toEqual(['banque-detail-credit', 'controle-de-gestion']);
  });

  it('chaque famille a un libellé et une introduction non vides', () => {
    for (const slug of allFamilySlugs()) {
      const family = familyBySlug(slug);
      expect(family?.label.length ?? 0).toBeGreaterThan(2);
      expect(family?.intro.length ?? 0).toBeGreaterThan(30);
    }
  });
});

describe('verticales que ROME ne distingue pas', () => {
  it('chaque famille sans code ROME a des mots-clés, sinon elle est inatteignable', () => {
    for (const family of JOB_FAMILIES) {
      if (family.romeCodes.length === 0) {
        expect(family.keywords.length, `${family.slug} n’a ni code ROME ni mot-clé`).toBeGreaterThan(2);
      }
    }
  });

  it.each([
    ['Alternance — Analyste private equity', 'private-equity'],
    ['Alternance Transaction Services — due diligence financière', 'transaction-services'],
    ['Alternance analyste banque d’investissement (ECM)', 'banque-investissement'],
    ['Alternance chargé de conformité KYC', 'risques-conformite'],
    ['Alternance analyste fintech paiement', 'fintech-paiements'],
    ['Alternance gestion d’actifs — reporting ESG', 'gestion-actifs'],
    ['Alternance banque privée — ingénierie patrimoniale', 'banque-privee-patrimoine'],
    ['Alternance trésorerie et financement de projet', 'tresorerie-financement'],
  ])('« %s » est rattachée à %s sans aucun code ROME', (title, expected) => {
    expect(matchFamilies({ title, romeCodes: [] }).families).toContain(expected);
  });

  it('les mots-clés S’AJOUTENT au code ROME au lieu de le remplacer', () => {
    /*
     * Le cas qui motive tout le mécanisme : un employeur code son alternance
     * M&A en C1201 « accueil et services clientèle bancaire ». Avant, les
     * mots-clés ne servaient que de repli, donc l’offre n’apparaissait jamais
     * sous « Fusions-acquisitions » — la famille que l’étudiant consulte.
     */
    const result = matchFamilies({
      title: 'Alternance analyste M&A',
      romeCodes: ['C1201'],
    });
    expect(result.via).toBe('both');
    expect(result.families).toContain('fusions-acquisitions');
    expect(result.families).toContain('banque-detail-credit');
  });

  it('une offre finance sans code ni verticale reste retenue', () => {
    const result = matchFamilies({ title: 'Alternance assistant financier', romeCodes: [] });
    expect(result.families).toEqual(['direction-financiere']);
    expect(result.via).toBe('keyword');
  });

  it('les secteurs annoncés sur la page À propos ont tous une famille', () => {
    // Si cette liste et la taxonomie divergent, la page promet des métiers
    // que le site ne sait pas classer.
    const promised = [
      'Banque d’investissement', 'M&A', 'Private Equity', 'Gestion d’actifs',
      'Audit', 'Transaction Services', 'Fintech', 'Assurance',
    ];
    const titles = promised.map((p) => `Alternance ${p}`);
    for (const title of titles) {
      expect(matchFamilies({ title, romeCodes: [] }).families.length, title).toBeGreaterThan(0);
    }
  });
});
