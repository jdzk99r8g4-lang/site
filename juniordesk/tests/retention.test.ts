import { describe, it, expect, beforeEach } from 'vitest';
import {
  INACTIVE_DAYS,
  UNCONFIRMED_DAYS,
  WARNING_DAYS,
  decide,
  lastActivity,
  purgeStaleAccounts,
} from '@/lib/retention';
import { getStore } from '@/lib/store';
import type { Account } from '@/lib/store/types';

const JOUR = 24 * 60 * 60 * 1000;
const MAINTENANT = Date.parse('2026-11-09T00:00:00.000Z');

/** Date située `jours` jours avant la date de référence des tests. */
function ilYA(jours: number): string {
  return new Date(MAINTENANT - jours * JOUR).toISOString();
}

function compte(over: Partial<Account> & { id: string }): Account {
  return {
    email: `${over.id}@exemple.fr`,
    passwordHash: 'scrypt$x',
    googleId: null,
    verified: true,
    createdAt: ilYA(800),
    verifiedAt: ilYA(800),
    lastLoginAt: ilYA(10),
    purgeWarnedAt: null,
    savedOfferIds: [],
    applications: [],
    ...over,
  };
}

describe('dernier signe de vie', () => {
  it('retombe sur la création quand le compte n’a jamais servi', () => {
    /*
     * Sans ce repli, un compte tout juste créé n'aurait aucune date
     * d'activité et serait jugé inactif depuis toujours : supprimé au premier
     * ménage, le jour même de son inscription.
     */
    const neuf = compte({ id: 'neuf', lastLoginAt: null, verifiedAt: null, createdAt: ilYA(1) });
    expect(lastActivity(neuf)).toBe(neuf.createdAt);
  });

  it('préfère la dernière connexion', () => {
    const c = compte({ id: 'c', lastLoginAt: ilYA(5), verifiedAt: ilYA(400) });
    expect(lastActivity(c)).toBe(c.lastLoginAt);
  });
});

describe('comptes jamais confirmés', () => {
  it('sont gardés tant que le lien peut encore servir', () => {
    const c = compte({ id: 'c', verified: false, verifiedAt: null, createdAt: ilYA(10) });
    expect(decide(c, MAINTENANT)).toBe('garder');
  });

  it('sont supprimés une fois le lien expiré', () => {
    const c = compte({
      id: 'c',
      verified: false,
      verifiedAt: null,
      createdAt: ilYA(UNCONFIRMED_DAYS + 1),
    });
    expect(decide(c, MAINTENANT)).toBe('supprimer-non-confirme');
  });

  it('ne sont jamais avertis', () => {
    // Il n'y aurait personne pour lire l'avertissement : l'adresse n'a jamais
    // été confirmée, et peut très bien être celle d'un tiers.
    const c = compte({
      id: 'c',
      verified: false,
      verifiedAt: null,
      createdAt: ilYA(WARNING_DAYS + 1),
    });
    expect(decide(c, MAINTENANT)).toBe('supprimer-non-confirme');
  });
});

describe('comptes inactifs', () => {
  it('sont gardés tant que l’inactivité reste courte', () => {
    expect(decide(compte({ id: 'c', lastLoginAt: ilYA(30) }), MAINTENANT)).toBe('garder');
  });

  it('sont avertis un mois avant', () => {
    expect(decide(compte({ id: 'c', lastLoginAt: ilYA(WARNING_DAYS + 1) }), MAINTENANT)).toBe(
      'avertir',
    );
  });

  it('ne sont avertis qu’une fois par période d’inactivité', () => {
    /*
     * Sans cette condition, le ménage quotidien enverrait le même message
     * tous les jours pendant un mois : une attention deviendrait du
     * harcèlement, et le domaine serait classé indésirable.
     */
    const c = compte({
      id: 'c',
      lastLoginAt: ilYA(WARNING_DAYS + 5),
      purgeWarnedAt: ilYA(2),
    });
    expect(decide(c, MAINTENANT)).toBe('garder');
  });

  it('sont de nouveau avertis si la personne s’est reconnectée entre-temps', () => {
    // L'avertissement est antérieur au dernier signe de vie : il appartient à
    // une période d'inactivité révolue.
    const c = compte({
      id: 'c',
      purgeWarnedAt: ilYA(900),
      lastLoginAt: ilYA(WARNING_DAYS + 1),
    });
    expect(decide(c, MAINTENANT)).toBe('avertir');
  });

  it('sont supprimés au-delà de la durée annoncée', () => {
    expect(decide(compte({ id: 'c', lastLoginAt: ilYA(INACTIVE_DAYS + 1) }), MAINTENANT)).toBe(
      'supprimer-inactif',
    );
  });
});

describe('ménage appliqué au magasin', () => {
  beforeEach(async () => {
    const store = getStore();
    for (const a of await store.listAccounts()) await store.deleteAccount(a.id);
  });

  it('supprime, avertit et laisse tranquille, chacun selon son cas', async () => {
    const store = getStore();
    await store.saveAccount(compte({ id: 'actif', lastLoginAt: ilYA(3) }));
    await store.saveAccount(
      compte({ id: 'jamais-confirme', verified: false, verifiedAt: null, createdAt: ilYA(60) }),
    );
    await store.saveAccount(compte({ id: 'a-avertir', lastLoginAt: ilYA(WARNING_DAYS + 2) }));
    await store.saveAccount(compte({ id: 'perime', lastLoginAt: ilYA(INACTIVE_DAYS + 2) }));

    const rapport = await purgeStaleAccounts(MAINTENANT);

    expect(rapport.examined).toBe(4);
    expect(rapport.unconfirmedDeleted).toBe(1);
    expect(rapport.inactiveDeleted).toBe(1);
    expect(rapport.warned).toBe(1);

    const restants = (await store.listAccounts()).map((a) => a.id).sort();
    expect(restants).toEqual(['a-avertir', 'actif']);

    // L'avertissement est daté, donc il ne repartira pas demain.
    expect((await store.getAccount('a-avertir'))?.purgeWarnedAt).not.toBeNull();
  });

  it('un deuxième passage le même jour n’avertit personne une seconde fois', async () => {
    const store = getStore();
    await store.saveAccount(compte({ id: 'a-avertir', lastLoginAt: ilYA(WARNING_DAYS + 2) }));

    await purgeStaleAccounts(MAINTENANT);
    const second = await purgeStaleAccounts(MAINTENANT + JOUR);

    expect(second.warned).toBe(0);
    expect(second.inactiveDeleted).toBe(0);
  });
});
