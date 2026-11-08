import { describe, it, expect } from 'vitest';
import { normalizeAll, normalizeOne } from '@/lib/sources/lba';

/**
 * Normalisation des offres de La bonne alternance.
 *
 * Les formes testées ici reprennent le schéma `JobOfferRead` de la
 * documentation OpenAPI de l'API (chemins `identifier.*`, `workplace.*`,
 * `apply.url`, `contract.*`, `offer.*`).
 */
const COLLECTED_AT = '2026-11-07T00:00:00.000Z';

function raw(overrides: Record<string, unknown> = {}) {
  return {
    identifier: { partner_job_id: 'ABC123', partner_label: 'offres_emploi_lba', id: null },
    workplace: {
      name: 'Banque Exemple',
      brand: null,
      legal_name: 'BANQUE EXEMPLE SA',
      siret: '12345678900011',
      website: 'https://banque.example',
      size: '500-999',
      location: { address: '12 rue de la Paix 75002 Paris', geopoint: { coordinates: [2.33, 48.86] } },
    },
    apply: { url: 'https://banque.example/offres/abc123' },
    contract: {
      start: '2027-09-01T00:00:00.000Z',
      duration: 24,
      type: ['Apprentissage'],
      remote: 'hybrid',
      start_type: 'precise_date',
      start_is_flexible: false,
    },
    offer: {
      title: 'Alternance — Chargé de clientèle bancaire',
      description: 'Vous accompagnez une clientèle de particuliers.',
      rome_codes: ['C1206'],
      status: 'Active',
      target_diploma: { label: 'Licence, BUT (bac + 3)' },
      publication: { creation: '2026-11-01T08:00:00.000Z', expiration: '2027-01-31T23:59:59.000Z' },
    },
    ...overrides,
  };
}

describe('normalisation La bonne alternance', () => {
  it('transforme une offre complète', () => {
    const offer = normalizeOne(raw(), COLLECTED_AT);
    expect(offer).not.toBeNull();
    expect(offer?.id).toBe('lba:offres_emploi_lba:ABC123');
    expect(offer?.title).toBe('Alternance — Chargé de clientèle bancaire');
    expect(offer?.applyUrl).toBe('https://banque.example/offres/abc123');
    expect(offer?.families).toEqual(['banque-detail-credit']);
    expect(offer?.place.city).toBe('Paris');
    expect(offer?.place.departement).toBe('75');
    expect(offer?.contract.kinds).toEqual(['apprentissage']);
    expect(offer?.contract.durationMonths).toBe(24);
    expect(offer?.contract.remote).toBe('hybrid');
    // La date de début est une date, pas un instant : l'heure n'a pas de sens.
    expect(offer?.contract.start).toBe('2027-09-01');
    expect(offer?.targetDiploma).toBe('Licence, BUT (bac + 3)');
  });

  it('lit les coordonnées dans l’ordre GeoJSON : longitude puis latitude', () => {
    const offer = normalizeOne(raw(), COLLECTED_AT);
    expect(offer?.place.lon).toBe(2.33);
    expect(offer?.place.lat).toBe(48.86);
  });

  it('écarte une offre pourvue ou annulée', () => {
    for (const status of ['Filled', 'Cancelled']) {
      const offer = normalizeOne(raw({ offer: { ...raw().offer, status } }), COLLECTED_AT);
      expect(offer, status).toBeNull();
    }
  });

  it('écarte une offre sans intitulé, sans lien ou sans identifiant', () => {
    expect(normalizeOne(raw({ offer: { ...raw().offer, title: null } }), COLLECTED_AT)).toBeNull();
    expect(normalizeOne(raw({ apply: { url: null } }), COLLECTED_AT)).toBeNull();
    expect(
      normalizeOne(raw({ identifier: { partner_job_id: null, id: null, partner_label: 'x' } }), COLLECTED_AT),
    ).toBeNull();
  });

  it('écarte un lien de candidature qui n’est pas une adresse http', () => {
    // Un lien « javascript: » ou malformé envoyé tel quel dans un href serait
    // au mieux cassé, au pire dangereux.
    for (const url of ['javascript:alert(1)', 'pas-une-url', 'ftp://x.example/y']) {
      expect(normalizeOne(raw({ apply: { url } }), COLLECTED_AT), url).toBeNull();
    }
  });

  it('écarte une offre hors du périmètre finance', () => {
    const offer = normalizeOne(
      raw({ offer: { ...raw().offer, title: 'Alternance boulanger', rome_codes: ['D1102'] } }),
      COLLECTED_AT,
    );
    expect(offer).toBeNull();
  });

  it('retombe sur l’apprentissage quand le type de contrat est absent', () => {
    const offer = normalizeOne(raw({ contract: { ...raw().contract, type: null } }), COLLECTED_AT);
    expect(offer?.contract.kinds).toEqual(['apprentissage']);
  });

  it('marque le début souple quand la source dit « dès que possible »', () => {
    const offer = normalizeOne(
      raw({ contract: { ...raw().contract, start_type: 'des_que_possible' } }),
      COLLECTED_AT,
    );
    expect(offer?.contract.startIsFlexible).toBe(true);
  });

  it('survit à une offre amputée de presque tous ses champs', () => {
    // Une API tierce qui renomme ou vide un champ doit faire perdre une offre,
    // jamais faire tomber la collecte entière.
    const offer = normalizeOne(
      {
        identifier: { partner_job_id: 'X', partner_label: 'p' },
        apply: { url: 'https://x.example/y' },
        offer: { title: 'Alternance analyste financier', rome_codes: ['M1201'] },
      },
      COLLECTED_AT,
    );
    expect(offer?.families).toEqual(['direction-financiere']);
    expect(offer?.place.city).toBeNull();
    expect(offer?.employer.name).toBeNull();
  });

  it('le slug est stable d’une collecte à l’autre', () => {
    // Sans cela, chaque collecte changerait toutes les URL : les liens
    // partagés casseraient et le référencement repartirait de zéro chaque
    // jour.
    const a = normalizeOne(raw(), '2026-11-07T00:00:00.000Z');
    const b = normalizeOne(raw(), '2026-12-25T00:00:00.000Z');
    expect(a?.slug).toBe(b?.slug);
    expect(a?.slug).toMatch(/[a-z0-9]{8}$/);
  });

  it('accepte un tableau nu comme une enveloppe', () => {
    expect(normalizeAll([raw()]).offers).toHaveLength(1);
    expect(normalizeAll({ data: [raw()] }).offers).toHaveLength(1);
    expect(normalizeAll({ jobs: [raw()] }).offers).toHaveLength(1);
    expect(normalizeAll(null).offers).toHaveLength(0);
    expect(normalizeAll({ inattendu: true }).offers).toHaveLength(0);
  });

  it('compte les offres ignorées', () => {
    const result = normalizeAll([raw(), { offer: { title: null } }]);
    expect(result.offers).toHaveLength(1);
    expect(result.skipped).toBe(1);
  });
});
