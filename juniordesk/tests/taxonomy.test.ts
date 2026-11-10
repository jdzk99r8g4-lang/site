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

describe('intitulés réalistes, sans code ROME', () => {
  const familles = (title: string) => matchFamilies({ title, romeCodes: [] }).families;

  it('reconnaît l’esperluette quelle que soit son écriture', () => {
    /*
     * « Analyste M & A » et « Fusions & Acquisitions » étaient écartés : les
     * mots-clés disent « m&a » et « fusions acquisitions », et l'esperluette
     * entourée d'espaces ne correspondait à aucun des deux.
     */
    for (const t of ['Analyste M&A', 'Analyste M & A', 'Analyste Fusions & Acquisitions', 'Analyste Fusions-Acquisitions']) {
      expect(familles(t), t).toEqual(['fusions-acquisitions']);
    }
  });

  it('reconnaît un mot-clé au pluriel', () => {
    // Les mots-clés sont au singulier et comparés sur des mots entiers.
    expect(familles('Gestionnaire sinistres')).toEqual(['assurance-actuariat']);
    expect(familles('Analyste paiements')).toEqual(['fintech-paiements']);
    expect(familles('Analyste risques')).toEqual(['risques-conformite']);
  });

  it('range les métiers qui manquaient', () => {
    const attendus: Record<string, string> = {
      'Analyste Corporate Finance': 'fusions-acquisitions',
      Structureur: 'marches-financiers',
      'Analyste quantitatif': 'marches-financiers',
      'Analyste buy-side': 'gestion-actifs',
      'Chargé d’études actuarielles': 'assurance-actuariat',
      'Assistant fiscal': 'fiscalite',
      'Chargé de recouvrement': 'banque-detail-credit',
    };
    for (const [titre, famille] of Object.entries(attendus)) {
      expect(familles(titre), titre).toContain(famille);
    }
  });

  it('une exclusion ne déborde pas sur un mot qui la contient', () => {
    /*
     * Les exclusions étaient cherchées comme sous-chaînes : « syndic », le
     * syndic de copropriété, écartait « syndication », un métier de banque
     * d'investissement.
     */
    expect(familles('Analyste syndication')).toEqual(['banque-investissement']);
    expect(familles('Syndic de copropriété')).toEqual([]);
  });

  it('le crédit immobilier n’est pas de l’immobilier', () => {
    /*
     * « immobilier » était exclu tout court, alors que « crédit immobilier »
     * est un mot-clé de la banque de détail. L'exclusion passant en premier,
     * le mot-clé ne pouvait jamais s'appliquer : l'un des intitulés les plus
     * courants de la banque était écarté par une règle écrite pour les agents
     * immobiliers.
     */
    expect(familles('Conseiller en crédit immobilier')).toEqual(['banque-detail-credit']);
    expect(familles('Analyste investissement immobilier')).toEqual(['gestion-actifs']);
    expect(familles('Agent immobilier')).toEqual([]);
    expect(familles('Conseiller immobilier')).toEqual([]);
    expect(familles('Négociateur immobilier')).toEqual([]);
  });

  it('un audit qui n’est pas financier est écarté, où que soit le mot', () => {
    /*
     * La liste énumérait des paires exactes. « Auditeur énergétique » n'y
     * figurait pas et passait pour un auditeur financier.
     */
    for (const t of [
      'Auditeur énergétique',
      'Auditeur en efficacité énergétique',
      'Auditeur qualité',
      'Auditeur interne qualité',
      'Auditeur sécurité des systèmes',
    ]) {
      expect(familles(t), t).toEqual([]);
    }
  });

  it('un auditeur financier reste retenu, même dans un secteur technique', () => {
    expect(familles('Auditeur financier')).toEqual(['audit']);
    expect(familles('Auditeur financier — secteur énergie')).toEqual(['audit']);
    expect(familles('Assistant commissaire aux comptes')).toEqual(['audit']);
  });

  it('les métiers hors finance restent dehors', () => {
    for (const t of [
      'Analyste programmeur',
      'Conseiller clientèle télécom',
      'Gestionnaire de paie',
      'Assistant RH',
      'Contrôleur qualité',
      'Assistant de gestion',
      'Chargé d’études quantitatives marketing',
    ]) {
      expect(familles(t), t).toEqual([]);
    }
  });
});
