import { describe, it, expect, beforeEach, vi } from 'vitest';

const jar = new Map<string, string>();
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name) } : undefined),
    set: (name: string, value: string) => jar.set(name, value),
    delete: (name: string) => jar.delete(name),
  }),
}));

const { resetStore, getStore } = await import('@/lib/store');
const { allowSend, SEND_LIMITS } = await import('@/lib/send-limit');
const { register, accountId, requestPasswordReset } = await import('@/lib/auth');
const { subscribe } = await import('@/lib/alerts');

beforeEach(() => {
  jar.clear();
  resetStore();
});

describe('limite par adresse', () => {
  it('laisse passer les premiers envois puis refuse', async () => {
    const email = 'cible@exemple.fr';
    for (let i = 1; i <= SEND_LIMITS.perAddress; i += 1) {
      expect(await allowSend('inscription', email), `envoi ${i}`).toMatchObject({ allowed: true });
    }
    expect(await allowSend('inscription', email)).toMatchObject({ allowed: false, reason: 'adresse' });
  });

  it('compte les graphies Gmail comme une seule boîte', async () => {
    // Sinon il suffirait d'ajouter un point pour contourner la limite et
    // continuer à inonder la même boîte.
    await allowSend('inscription', 'p.nom@gmail.com');
    await allowSend('inscription', 'pnom@gmail.com');
    await allowSend('inscription', 'p.n.o.m@gmail.com');
    expect(await allowSend('inscription', 'nom+x@gmail.com')).toMatchObject({ allowed: true });
    expect(await allowSend('inscription', 'pnom@gmail.com')).toMatchObject({ allowed: false });
  });

  it('les compteurs sont séparés par type d’envoi', async () => {
    const email = 'etudiant@exemple.fr';
    for (let i = 0; i < SEND_LIMITS.perAddress + 1; i += 1) await allowSend('inscription', email);
    // L'inscription est bloquée, mais une demande d'alerte reste possible.
    expect(await allowSend('inscription', email)).toMatchObject({ allowed: false });
    expect(await allowSend('alerte', email)).toMatchObject({ allowed: true });
  });

  it('une tentative refusée compte quand même', async () => {
    // Sans cela, dépasser la limite offrirait un essai gratuit à chaque fois.
    const email = 'cible@exemple.fr';
    for (let i = 0; i < 10; i += 1) await allowSend('inscription', email);
    expect(await allowSend('inscription', email)).toMatchObject({ allowed: false });
  });
});

describe('plafond global', () => {
  it('finit par bloquer même avec des adresses toutes différentes', async () => {
    /*
     * La limite par adresse n'y peut rien : arroser mille adresses une fois
     * chacune grille la réputation du domaine d'envoi, ce qui condamne
     * ensuite toutes les alertes du site.
     */
    let blocked = false;
    for (let i = 0; i < SEND_LIMITS.global + 5; i += 1) {
      const result = await allowSend('alerte', `adresse${i}@exemple.fr`);
      if (!result.allowed) {
        expect(result.reason).toBe('global');
        blocked = true;
        break;
      }
    }
    expect(blocked, 'le plafond global n’a jamais mordu').toBe(true);
  });
});

describe('le refus est indiscernable d’un succès', () => {
  it('l’inscription rend le même résultat une fois la limite atteinte', async () => {
    /*
     * Si la page disait « trop de demandes pour cette adresse », le
     * formulaire deviendrait un moyen de savoir qui est inscrit ou visé.
     */
    const email = 'etudiant@exemple.fr';
    const first = await register({ email, password: 'alternancefinance' });
    for (let i = 0; i < SEND_LIMITS.perAddress; i += 1) {
      await register({ email, password: 'alternancefinance' });
    }
    const blocked = await register({ email, password: 'alternancefinance' });
    expect(first.ok).toBe(true);
    expect(blocked.ok).toBe(true);
  });

  it('la création d’alerte aussi', async () => {
    const email = 'alerte@exemple.fr';
    const first = await subscribe({ email });
    for (let i = 0; i < SEND_LIMITS.perAddress; i += 1) await subscribe({ email });
    expect(first.ok).toBe(true);
    expect(await subscribe({ email })).toMatchObject({ ok: true });
  });

  it('la demande de réinitialisation aussi', async () => {
    const email = 'oubli@exemple.fr';
    const first = await requestPasswordReset(email);
    for (let i = 0; i < 6; i += 1) await requestPasswordReset(email);
    expect(first.ok).toBe(true);
    expect(await requestPasswordReset(email)).toMatchObject({ ok: true });
  });
});

describe('la limite ne casse pas le service', () => {
  it('le premier compte est bien créé malgré la limite', async () => {
    const email = 'premier@exemple.fr';
    await register({ email, password: 'alternancefinance' });
    expect(await getStore().getAccount(accountId(email))).not.toBeNull();
  });

  it('un magasin en panne laisse passer au lieu de bloquer', async () => {
    /*
     * Choix assumé : un compteur est une protection, pas une condition du
     * service. Bloquer rendrait l'inscription impossible dès la moindre
     * panne de Redis.
     */
    const store = getStore();
    const original = store.touchRateLimit.bind(store);
    store.touchRateLimit = async () => {
      throw new Error('magasin injoignable');
    };
    expect(await allowSend('inscription', 'panne@exemple.fr')).toMatchObject({ allowed: true });
    store.touchRateLimit = original;
  });
});
