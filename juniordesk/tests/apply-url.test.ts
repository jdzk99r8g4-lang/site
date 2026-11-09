import { describe, it, expect } from 'vitest';
import { isSafeApplyUrl } from '@/lib/apply-url';
import { normalizeFtOffer } from '@/lib/sources/france-travail';
import { normalizeOne } from '@/lib/sources/lba';

describe('adresse de candidature', () => {
  it('accepte une adresse web ordinaire', () => {
    expect(isSafeApplyUrl('https://carrieres.exemple.fr/offre/42')).toBe(true);
    expect(isSafeApplyUrl('http://exemple.fr/postuler')).toBe(true);
    expect(isSafeApplyUrl('  https://exemple.fr/postuler  ')).toBe(true);
  });

  it('refuse ce qui n’est pas du web', () => {
    /*
     * C'est une cible de REDIRECTION : ce qui n'est pas http(s) n'a rien à
     * faire dans un en-tête Location.
     */
    for (const mauvais of [
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'file:///etc/passwd',
      'ftp://exemple.fr/offre',
      'vbscript:msgbox(1)',
    ]) {
      expect(isSafeApplyUrl(mauvais), mauvais).toBe(false);
    }
  });

  it('refuse ce qui n’est pas une adresse', () => {
    for (const mauvais of ['', '   ', 'postuler ici', '//exemple.fr', null, undefined, 42, {}]) {
      expect(isSafeApplyUrl(mauvais), String(mauvais)).toBe(false);
    }
  });

  it('refuse une adresse qui renvoie vers nous', () => {
    // Rediriger vers soi-même fait une boucle, et permet de faire passer une
    // page du site pour une offre d'employeur.
    expect(isSafeApplyUrl('https://juniordesk.fr/offres', 'https://juniordesk.fr')).toBe(false);
    expect(isSafeApplyUrl('https://JUNIORDESK.FR/offres', 'https://juniordesk.fr')).toBe(false);
    expect(isSafeApplyUrl('https://ailleurs.fr/offres', 'https://juniordesk.fr')).toBe(true);
  });

  it('un siteUrl illisible ne fait pas refuser des offres valides', () => {
    // On perd ce contrôle-là, pas les autres : une configuration bancale ne
    // doit pas vider le catalogue.
    expect(isSafeApplyUrl('https://exemple.fr/postuler', 'pas une url')).toBe(true);
  });
});

describe('aucun adaptateur ne laisse passer une cible dangereuse', () => {
  /*
   * Le vrai objet de ce fichier. Le contrôle existait dans `lba.ts` et pas
   * dans `france-travail.ts` : deux adaptateurs qui font le même métier, un
   * seul qui se protège. Ce test tient les deux ensemble, et tiendra le
   * troisième le jour où il arrivera.
   */
  it('France Travail écarte l’offre', () => {
    const brut = {
      id: 'FT-1',
      intitule: 'Alternance — Chargé de clientèle bancaire',
      romeCode: 'C1206',
      typeContrat: 'CDD',
      alternance: true,
      natureContrat: 'Contrat d’apprentissage',
      lieuTravail: { libelle: 'Paris', codePostal: '75002' },
      origineOffre: { urlOrigine: 'javascript:alert(1)' },
    };
    expect(normalizeFtOffer(brut, '2026-11-09T00:00:00.000Z')).toBeNull();

    const sain = { ...brut, origineOffre: { urlOrigine: 'https://exemple.fr/postuler' } };
    expect(normalizeFtOffer(sain, '2026-11-09T00:00:00.000Z')).not.toBeNull();
  });

  it('La bonne alternance écarte l’offre', () => {
    const brut = {
      identifier: { partner_job_id: 'LBA-1', partner_label: 'partenaire' },
      apply: { url: 'javascript:alert(1)' },
      contract: { type: ['Apprentissage'] },
      offer: {
        title: 'Alternance — Chargé de clientèle bancaire',
        rome_codes: ['C1206'],
        status: 'Active',
      },
      workplace: { name: 'Banque', location: { address: '24 rue de la Banque 75002 Paris' } },
    };
    expect(normalizeOne(brut, '2026-11-09T00:00:00.000Z')).toBeNull();

    const sain = { ...brut, apply: { url: 'https://exemple.fr/postuler' } };
    expect(normalizeOne(sain, '2026-11-09T00:00:00.000Z')).not.toBeNull();
  });
});
