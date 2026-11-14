import { describe, it, expect } from 'vitest';
import { clip, firstSentence } from '@/lib/text';
import { JOB_FAMILIES } from '@/lib/taxonomy';
import { brand } from '@/lib/brand';

describe('raccourcir un texte', () => {
  it('laisse intact ce qui tient déjà', () => {
    expect(clip('Court.', 160)).toBe('Court.');
  });

  it('ne coupe pas au milieu d’un mot', () => {
    const r = clip('Analyse financière des entreprises non cotées et suivi des participations', 40);
    expect(r.length).toBeLessThanOrEqual(40);
    expect(r.endsWith('…')).toBe(true);
    expect(r).not.toMatch(/\s…$/);
    // Le dernier mot conservé est entier.
    expect('Analyse financière des entreprises non cotées et suivi des participations').toContain(
      r.slice(0, -1),
    );
  });

  it('extrait la première phrase', () => {
    expect(firstSentence('Une phrase. Puis une autre.')).toBe('Une phrase.');
    expect(firstSentence('Sans point final')).toBe('Sans point final');
  });
});

describe('ce que le site affiche aux étudiants', () => {
  it('aucune description de métier ne parle du référentiel interne', () => {
    /*
     * « ROME ne distingue pas cette activité : le rattachement se fait sur
     * l'intitulé » était affiché sous trois métiers. C'est une note de
     * développeur : un étudiant ne sait pas ce qu'est ROME et n'a pas à le
     * savoir.
     */
    for (const family of JOB_FAMILIES) {
      expect(family.intro, family.slug).not.toMatch(/\bROME\b|code métier|rattachement/i);
    }
  });

  it('la description pour les moteurs tient dans ce qu’ils affichent', () => {
    expect(brand.metaDescription.length).toBeLessThanOrEqual(160);
    expect(`${brand.name} — ${brand.shortTagline}`.length).toBeLessThanOrEqual(65);
  });

  it('la promesse ne dit plus « sans compte » alors que les comptes existent', () => {
    const promesses = brand.promises.map((p) => p.title).join(' ');
    expect(`${promesses} ${brand.pitch}`).not.toMatch(/sans compte(?! obligatoire)/i);
  });
});
