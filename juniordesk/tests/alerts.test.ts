import { describe, it, expect, beforeEach } from 'vitest';
import {
  confirm,
  describeCriteria,
  isPlausibleEmail,
  matchesSubscription,
  subscribe,
  unsubscribe,
} from '@/lib/alerts';
import { createToken, readToken, subscriptionId } from '@/lib/tokens';
import { getStore, resetStore } from '@/lib/store';
import type { AlertSubscription } from '@/lib/store/types';
import type { Offer } from '@/lib/offer';
import { NO_EXPERIENCE_SIGNAL } from '@/lib/seniority';

beforeEach(() => {
  resetStore();
});

function subscription(overrides: Partial<AlertSubscription> = {}): AlertSubscription {
  return {
    id: 'abc',
    email: 'etudiant@exemple.fr',
    families: [],
    cities: [],
    groups: [],
    confirmed: true,
    createdAt: '2026-11-01T00:00:00.000Z',
    confirmedAt: '2026-11-01T00:05:00.000Z',
    lastSentAt: null,
    ...overrides,
  };
}

function offer(overrides: Partial<Offer> = {}): Offer {
  return {
    id: 'o1',
    slug: 'o1',
    title: 'Alternance analyste crédit',
    description: '',
    applyUrl: 'https://employeur.example/x',
    source: { id: 'lba', label: 'LBA', partnerLabel: 'p', partnerJobId: '1' },
    employer: { name: 'Banque', brand: null, siret: null, website: null, size: null },
    place: { address: '', city: 'Paris', citySlug: 'paris', postalCode: '75002', departement: '75', lat: null, lon: null },
    contract: { kinds: ['apprentissage'], start: null, startIsFlexible: false, durationMonths: null, remote: null },
    families: ['banque-detail-credit'],
    romeCodes: ['C1202'],
    targetDiploma: null,
    experience: NO_EXPERIENCE_SIGNAL,
    publishedAt: null,
    expiresAt: null,
    collectedAt: '2026-11-07T00:00:00.000Z',
    ...overrides,
  };
}

describe('validation d’adresse', () => {
  it('accepte les adresses plausibles', () => {
    for (const email of ['a@b.fr', 'prenom.nom@edu.exemple.com', 'x+y@z.co.uk']) {
      expect(isPlausibleEmail(email), email).toBe(true);
    }
  });

  it('refuse le manifestement invalide', () => {
    for (const email of ['', 'sansarobase', 'a@b', 'a b@c.fr', 'a@@b.fr', 'a@.fr', 'a@b..fr']) {
      expect(isPlausibleEmail(email), JSON.stringify(email)).toBe(false);
    }
  });
});

describe('double opt-in', () => {
  it('une inscription n’est pas confirmée tant que le lien n’est pas cliqué', async () => {
    const result = await subscribe({ email: 'Etudiant@Exemple.FR', families: ['banque-detail-credit'] });
    expect(result.ok).toBe(true);

    const stored = await getStore().getSubscription(subscriptionId('etudiant@exemple.fr'));
    expect(stored?.confirmed).toBe(false);
    // L'adresse est normalisée en minuscules : sans cela, deux inscriptions
    // pour la même personne recevraient chacune les alertes.
    expect(stored?.email).toBe('etudiant@exemple.fr');
  });

  it('le clic de confirmation active l’alerte', async () => {
    await subscribe({ email: 'etudiant@exemple.fr' });
    const id = subscriptionId('etudiant@exemple.fr');

    const result = await confirm(createToken(id, 'confirm'));
    expect(result.ok).toBe(true);
    expect((await getStore().getSubscription(id))?.confirmed).toBe(true);
  });

  it('refuse un jeton signé pour un autre usage', async () => {
    // Sans ce contrôle, le lien de désinscription d'un e-mail confirmerait
    // une inscription, et inversement.
    await subscribe({ email: 'etudiant@exemple.fr' });
    const id = subscriptionId('etudiant@exemple.fr');
    const result = await confirm(createToken(id, 'unsubscribe'));
    expect(result.ok).toBe(false);
  });

  it('refuse un jeton falsifié', () => {
    const token = createToken('abc', 'confirm');
    const falsified = `${token.split('.')[0]}.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`;
    expect(readToken(falsified, 'confirm').ok).toBe(false);
  });

  it('refuse un jeton expiré', () => {
    expect(readToken(createToken('abc', 'confirm', -10), 'confirm')).toMatchObject({
      ok: false,
      reason: 'expire',
    });
  });

  it('se réinscrire met à jour les critères sans créer de doublon', async () => {
    await subscribe({ email: 'etudiant@exemple.fr', families: ['banque-detail-credit'] });
    const id = subscriptionId('etudiant@exemple.fr');
    await confirm(createToken(id, 'confirm'));

    const again = await subscribe({ email: 'etudiant@exemple.fr', families: ['audit'] });
    expect(again).toMatchObject({ ok: true, alreadyConfirmed: true });

    const stored = await getStore().getSubscription(id);
    expect(stored?.families).toEqual(['audit']);
    // Déjà confirmée : on ne redemande pas un consentement déjà donné.
    expect(stored?.confirmed).toBe(true);
  });

  it('la désinscription supprime réellement l’inscription', async () => {
    await subscribe({ email: 'etudiant@exemple.fr' });
    const id = subscriptionId('etudiant@exemple.fr');

    expect((await unsubscribe(createToken(id, 'unsubscribe'))).ok).toBe(true);
    // Rien n'est gardé « au cas où ».
    expect(await getStore().getSubscription(id)).toBeNull();
  });

  it('ignore les métiers et familles de contrat inventés', async () => {
    await subscribe({
      email: 'etudiant@exemple.fr',
      families: ['banque-detail-credit', 'metier-inexistant'],
      groups: ['alternance', 'invente' as never],
      cities: ['paris', '!!!', '75008'],
    });
    const stored = await getStore().getSubscription(subscriptionId('etudiant@exemple.fr'));
    expect(stored?.families).toEqual(['banque-detail-credit']);
    expect(stored?.groups).toEqual(['alternance']);
    // Ce qui ne peut pas être une ville est écarté.
    expect(stored?.cities).toEqual(['paris']);
  });

  it('comprend une ville tapée comme on l’écrit', async () => {
    /*
     * L'ancienne version passait en minuscules puis écartait ce qui n'avait
     * pas la forme d'un slug : « Saint-Étienne » disparaissait EN SILENCE et
     * l'alerte était créée sans aucune ville. La personne recevait alors les
     * offres de toute la France en croyant n'avoir demandé que les siennes.
     */
    await subscribe({
      email: 'stephanois@exemple.fr',
      cities: ['Saint-Étienne', 'ST ETIENNE', 'Paris 8e'],
    });
    const stored = await getStore().getSubscription(subscriptionId('stephanois@exemple.fr'));
    expect(stored?.cities).toEqual(['saint-etienne', 'paris']);
  });
});

describe('appariement offre / alerte', () => {
  it('une alerte sans critère reçoit tout', () => {
    expect(matchesSubscription(offer(), subscription())).toBe(true);
  });

  it('filtre par métier', () => {
    expect(matchesSubscription(offer(), subscription({ families: ['audit'] }))).toBe(false);
    expect(matchesSubscription(offer(), subscription({ families: ['banque-detail-credit'] }))).toBe(true);
  });

  it('filtre par ville', () => {
    expect(matchesSubscription(offer(), subscription({ cities: ['lyon'] }))).toBe(false);
    expect(matchesSubscription(offer(), subscription({ cities: ['paris'] }))).toBe(true);
  });

  it('filtre par famille de contrat', () => {
    expect(matchesSubscription(offer(), subscription({ groups: ['stage'] }))).toBe(false);
    expect(matchesSubscription(offer(), subscription({ groups: ['alternance'] }))).toBe(true);
  });

  it('les critères se cumulent', () => {
    const sub = subscription({ families: ['banque-detail-credit'], cities: ['lyon'] });
    expect(matchesSubscription(offer(), sub)).toBe(false);
  });
});

describe('résumé des critères', () => {
  it('dit « tous les métiers » et « toute la France » quand rien n’est choisi', () => {
    expect(describeCriteria({ families: [], cities: [], groups: [] })).toContain('tous les métiers');
    expect(describeCriteria({ families: [], cities: [], groups: [] })).toContain('toute la France');
  });

  it('reprend les libellés lisibles, pas les slugs', () => {
    const text = describeCriteria({ families: ['banque-detail-credit'], cities: ['paris'], groups: ['alternance'] });
    expect(text).toContain('Banque de détail et crédit');
    expect(text).toContain('Alternance');
    expect(text).not.toContain('banque-detail-credit');
  });
});
