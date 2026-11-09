/**
 * Source de démonstration, utilisée quand aucune clé API n’est configurée.
 *
 * Le but est de pouvoir parcourir le site entier — filtres, pages métier,
 * pages ville, alertes — sans clé et sans réseau. Les offres sont donc
 * fabriquées, et l’intitulé le dit en toutes lettres : il doit être impossible
 * de confondre une offre d’exemple avec une vraie offre, y compris si une
 * capture d’écran circule hors contexte.
 *
 * `isExampleData()` permet aux pages d’afficher un bandeau d’avertissement.
 */

import type { Offer } from '../offer';
import type { FetchOutcome, JobSource } from './types';
import { matchFamilies } from '../taxonomy';
import { parseAddress } from '../geo';
import { offerSlug } from '../slug';
import { NO_EXPERIENCE_SIGNAL } from '../seniority';

const EXAMPLE_PREFIX = '[EXEMPLE]';

interface Seed {
  title: string;
  rome: string[];
  address: string;
  employer: string;
  months: number;
  kind: 'apprentissage' | 'professionnalisation';
  startInDays: number;
  expiresInDays: number;
}

/**
 * Jeu de graines couvrant volontairement plusieurs familles et plusieurs
 * villes : sans cela, les pages SEO et les filtres ne seraient pas testables
 * à l’œil.
 */
const SEEDS: readonly Seed[] = [
  { title: 'Alternance — Chargé de clientèle bancaire', rome: ['C1206'], address: '24 rue de la Banque 75002 Paris', employer: 'Banque Exemple', months: 24, kind: 'apprentissage', startInDays: 40, expiresInDays: 30 },
  { title: 'Alternance — Analyste crédit et risques', rome: ['C1202'], address: '3 place Bellecour 69002 Lyon', employer: 'Crédit Exemple', months: 12, kind: 'apprentissage', startInDays: 60, expiresInDays: 45 },
  { title: 'Alternance — Analyste M&A', rome: ['M1219'], address: '112 avenue des Champs-Élysées 75008 Paris', employer: 'Conseil Exemple', months: 12, kind: 'apprentissage', startInDays: 90, expiresInDays: 50 },
  { title: 'Alternance — Analyste private equity', rome: ['M1226'], address: '7 rue de la Paix 75002 Paris', employer: 'Fonds Exemple', months: 12, kind: 'apprentissage', startInDays: 75, expiresInDays: 42 },
  { title: 'Alternance — Banque d’investissement, équipe ECM', rome: [], address: '16 cours Valmy 92800 Puteaux', employer: 'BFI Exemple', months: 12, kind: 'apprentissage', startInDays: 85, expiresInDays: 38 },
  { title: 'Alternance — Transaction services, due diligence financière', rome: [], address: '1 cours Valmy 92800 Puteaux', employer: 'Cabinet TS Exemple', months: 24, kind: 'apprentissage', startInDays: 55, expiresInDays: 46 },
  { title: 'Alternance — Auditeur financier junior', rome: ['M1202'], address: '1 rue de la République 69001 Lyon', employer: 'Audit Exemple', months: 24, kind: 'apprentissage', startInDays: 70, expiresInDays: 60 },
  { title: 'Alternance — Assistant comptable en cabinet', rome: ['M1213'], address: '15 cours Pasteur 33000 Bordeaux', employer: 'Cabinet Exemple', months: 24, kind: 'apprentissage', startInDays: 25, expiresInDays: 20 },
  { title: 'Alternance — Contrôleur de gestion', rome: ['M1204'], address: '8 avenue Jean Médecin 06000 Nice', employer: 'Industrie Exemple', months: 12, kind: 'professionnalisation', startInDays: 15, expiresInDays: 25 },
  { title: 'Alternance — Gestion d’actifs, reporting ESG', rome: ['C1303'], address: '18 quai de la Rapée 75012 Paris', employer: 'Gestion Exemple', months: 24, kind: 'apprentissage', startInDays: 45, expiresInDays: 30 },
  { title: 'Alternance — Middle office marchés financiers', rome: ['C1302'], address: '5 place de la Bourse 75002 Paris', employer: 'Marchés Exemple', months: 24, kind: 'apprentissage', startInDays: 48, expiresInDays: 33 },
  { title: 'Alternance — Banque privée, ingénierie patrimoniale', rome: ['C1205'], address: '6 rue de Metz 31000 Toulouse', employer: 'Patrimoine Exemple', months: 12, kind: 'apprentissage', startInDays: 52, expiresInDays: 29 },
  { title: 'Alternance — Gestionnaire en assurances', rome: ['C1109'], address: '2 rue Nationale 59000 Lille', employer: 'Assureur Exemple', months: 24, kind: 'apprentissage', startInDays: 35, expiresInDays: 40 },
  { title: 'Alternance — Souscripteur en assurances', rome: ['C1110'], address: '7 rue du Taur 31000 Toulouse', employer: 'Mutuelle Exemple', months: 12, kind: 'apprentissage', startInDays: 50, expiresInDays: 35 },
  { title: 'Alternance — Chargé de conformité et KYC', rome: ['M1228'], address: '20 boulevard Haussmann 75009 Paris', employer: 'Conformité Exemple', months: 24, kind: 'apprentissage', startInDays: 28, expiresInDays: 36 },
  { title: 'Alternance — Trésorerie et financement', rome: ['M1207'], address: '5 rue de Strasbourg 44000 Nantes', employer: 'Groupe Exemple', months: 12, kind: 'apprentissage', startInDays: 30, expiresInDays: 28 },
  { title: 'Alternance — Analyste fintech, moyens de paiement', rome: [], address: '9 rue de la Monnaie 59000 Lille', employer: 'Fintech Exemple', months: 12, kind: 'professionnalisation', startInDays: 18, expiresInDays: 24 },
  { title: 'Alternance — Fiscaliste junior', rome: ['K1911'], address: '9 rue Saint-Guillaume 67000 Strasbourg', employer: 'Fiscalité Exemple', months: 24, kind: 'apprentissage', startInDays: 65, expiresInDays: 55 },
  { title: 'Alternance — Contrôle de gestion, direction financière', rome: ['M1205'], address: '4 place de la Comédie 34000 Montpellier', employer: 'Industrie Exemple', months: 24, kind: 'apprentissage', startInDays: 38, expiresInDays: 31 },
  { title: 'Alternance — Back-office assurance vie', rome: ['C1401'], address: '14 rue de Metz 35000 Rennes', employer: 'Épargne Exemple', months: 12, kind: 'professionnalisation', startInDays: 20, expiresInDays: 22 },
];

export function createExampleSource(): JobSource {
  return {
    id: 'exemple',
    label: 'Jeu de démonstration',
    contractKinds: ['apprentissage', 'professionnalisation'],
    async fetchAll(): Promise<FetchOutcome> {
      return {
        ok: true,
        offers: buildExampleOffers(),
        warnings: [
          'Aucune clé API configurée : le site affiche un jeu d’offres fabriquées. ' +
            'Renseignez LBA_API_KEY pour collecter les vraies offres.',
        ],
      };
    },
  };
}

export function buildExampleOffers(now: Date = new Date()): Offer[] {
  const collectedAt = now.toISOString();

  return SEEDS.map((seed, index) => {
    const title = `${EXAMPLE_PREFIX} ${seed.title}`;
    const id = `exemple::${index + 1}`;
    const place = parseAddress(seed.address);
    const { families } = matchFamilies({ title: seed.title, romeCodes: seed.rome });

    return {
      id,
      slug: offerSlug({ id, title: seed.title, city: place.city }),
      title,
      description:
        'Offre fabriquée pour la démonstration. Elle ne correspond à aucun poste réel ' +
        'et ne doit pas être diffusée. ' +
        'Missions : participation aux travaux courants de l’équipe, production de ' +
        'reportings, suivi des dossiers clients, en appui d’un tuteur.',
      // Volontairement un lien vers une page explicative et non un faux
      // employeur : envoyer quelqu’un vers une candidature inexistante serait
      // la seule vraie faute possible dans un jeu de démonstration.
      applyUrl: 'https://example.org/offre-de-demonstration',
      source: {
        id: 'exemple',
        label: 'Jeu de démonstration',
        partnerLabel: 'exemple',
        partnerJobId: String(index + 1),
      },
      employer: {
        name: `${seed.employer} (fictif)`,
        brand: null,
        siret: null,
        website: null,
        size: null,
      },
      place: {
        address: seed.address,
        city: place.city,
        citySlug: place.citySlug,
        postalCode: place.postalCode,
        departement: place.departement,
        lat: null,
        lon: null,
      },
      contract: {
        kinds: [seed.kind],
        start: isoDate(addDays(now, seed.startInDays)),
        startIsFlexible: false,
        durationMonths: seed.months,
        remote: index % 3 === 0 ? 'hybrid' : 'onsite',
      },
      families,
      romeCodes: seed.rome,
      targetDiploma: index % 2 === 0 ? 'Licence, BUT (bac + 3)' : 'Master (bac + 5)',
      experience: NO_EXPERIENCE_SIGNAL,
      publishedAt: addDays(now, -(index + 1)).toISOString(),
      expiresAt: addDays(now, seed.expiresInDays).toISOString(),
      collectedAt,
    } satisfies Offer;
  });
}

/** Vrai si ces offres sont le jeu de démonstration. Les pages s’en servent pour avertir. */
export function isExampleData(offers: readonly { source: { id: string } }[]): boolean {
  return offers.length > 0 && offers.every((o) => o.source.id === 'exemple');
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
