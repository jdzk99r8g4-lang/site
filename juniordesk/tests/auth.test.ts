import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * `next/headers` n'existe pas hors d'une requête Next. On le remplace par un
 * bocal à cookies en mémoire : les fonctions testées ici (hachage, jetons de
 * réinitialisation) ne s'en servent pas, mais le module l'importe.
 */
const jar = new Map<string, string>();
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name) } : undefined),
    set: (name: string, value: string) => jar.set(name, value),
    delete: (name: string) => jar.delete(name),
  }),
}));

const { getStore, resetStore } = await import('@/lib/store');
const {
  accountId,
  checkResetToken,
  hashPassword,
  login,
  MIN_PASSWORD_LENGTH,
  passwordProblem,
  register,
  requestPasswordReset,
  resetPassword,
  verifyAccount,
  verifyPassword,
} = await import('@/lib/auth');
const { createToken } = await import('@/lib/tokens');

beforeEach(() => {
  jar.clear();
  resetStore();
});

async function createVerifiedAccount(email = 'etudiant@exemple.fr', password = 'alternancefinance') {
  await register({ email, password });
  await verifyAccount(createToken(accountId(email), 'confirm'));
  return { email, password };
}

/** Récupère le lien de réinitialisation sans passer par la boîte mail. */
async function resetTokenFor(email: string): Promise<string> {
  const account = await getStore().getAccount(accountId(email));
  if (!account) throw new Error('compte absent');
  const { fingerprint } = await import('@/lib/tokens');
  return createToken(`${account.id}:${fingerprint(account.passwordHash)}`, 'reset', 3600);
}

describe('hachage des mots de passe', () => {
  it('accepte le bon mot de passe et refuse les autres', async () => {
    const stored = await hashPassword('alternancefinance');
    expect(await verifyPassword('alternancefinance', stored)).toBe(true);
    expect(await verifyPassword('alternancefinanc', stored)).toBe(false);
    expect(await verifyPassword('', stored)).toBe(false);
  });

  it('deux comptes au même mot de passe ont des empreintes différentes', async () => {
    // Sans sel aléatoire par compte, une seule table précalculée casserait
    // tous les comptes partageant un mot de passe.
    expect(await hashPassword('alternancefinance')).not.toBe(await hashPassword('alternancefinance'));
  });

  it('ne plante pas sur une empreinte malformée', async () => {
    for (const bad of ['', 'nimportequoi', 'scrypt$1$2$3', 'bcrypt$a$b$c$d$e']) {
      expect(await verifyPassword('x', bad), bad).toBe(false);
    }
  });

  it('refuse les mots de passe trop courts ou trop courants', () => {
    expect(passwordProblem('court')).toMatch(new RegExp(String(MIN_PASSWORD_LENGTH)));
    expect(passwordProblem('motdepasse')).toMatch(/trop courant/);
    expect(passwordProblem('password123')).toMatch(/trop courant/);
    expect(passwordProblem('x'.repeat(5000))).toMatch(/trop long/);
    expect(passwordProblem('alternancefinance')).toBeNull();
  });
});

describe('réinitialisation du mot de passe', () => {
  it('répond pareil que le compte existe ou non', async () => {
    // Sinon le formulaire devient un moyen de savoir qui est inscrit.
    const inconnu = await requestPasswordReset('personne@exemple.fr');
    await createVerifiedAccount();
    const connu = await requestPasswordReset('etudiant@exemple.fr');
    expect(inconnu.ok).toBe(true);
    expect(connu.ok).toBe(true);
  });

  it('refuse une adresse manifestement invalide', async () => {
    expect(await requestPasswordReset('pasuneadresse')).toMatchObject({ ok: false });
  });

  it('change le mot de passe et permet de se reconnecter', async () => {
    const { email } = await createVerifiedAccount();
    const token = await resetTokenFor(email);

    expect(await resetPassword(token, 'nouveaumotdepasse')).toEqual({ ok: true });
    expect(await login({ email, password: 'alternancefinance' })).toMatchObject({ ok: false });
    expect(await login({ email, password: 'nouveaumotdepasse' })).toEqual({ ok: true });
  });

  it('le lien ne sert QU’UNE fois', async () => {
    // L'empreinte du mot de passe est inscrite dans le jeton : dès que le mot
    // de passe change, le lien cesse de correspondre. Sans cela, un lien
    // retrouvé dans une boîte mail rouvrirait le compte indéfiniment.
    const { email } = await createVerifiedAccount();
    const token = await resetTokenFor(email);

    expect(await resetPassword(token, 'nouveaumotdepasse')).toEqual({ ok: true });

    const second = await resetPassword(token, 'encoreunautremdp');
    expect(second).toMatchObject({ ok: false, reason: 'lien' });
    expect(second).toMatchObject({ error: expect.stringContaining('déjà servi') });
  });

  it('distingue « lien mort » de « mot de passe refusé »', async () => {
    /*
     * Les deux appellent des suites différentes : demander un nouveau lien,
     * ou simplement ressaisir. Une première version distinguait les cas en
     * cherchant « mot de passe » dans le message — or le message du lien
     * déjà utilisé contient ces mots, et les gens étaient renvoyés au mauvais
     * endroit.
     */
    const { email } = await createVerifiedAccount();
    const token = await resetTokenFor(email);

    expect(await resetPassword(token, 'court')).toMatchObject({ reason: 'motdepasse' });
    await resetPassword(token, 'nouveaumotdepasse');
    expect(await resetPassword(token, 'autrechoseencore')).toMatchObject({ reason: 'lien' });
  });

  it('révoque toutes les sessions ouvertes', async () => {
    // C'est le point du changement de mot de passe : éjecter qui que ce soit
    // d'autre qui serait connecté.
    const { email, password } = await createVerifiedAccount();
    const store = getStore();
    const id = accountId(email);
    const session = await store.createSession(id, 3600);
    expect(await store.readSession(session)).toBe(id);

    await resetPassword(await resetTokenFor(email), 'nouveaumotdepasse');
    expect(await store.readSession(session)).toBeNull();
    expect(password).toBe('alternancefinance');
  });

  it('refuse un jeton expiré', async () => {
    const { email } = await createVerifiedAccount();
    const store = getStore();
    const account = await store.getAccount(accountId(email));
    const { fingerprint } = await import('@/lib/tokens');
    const expired = createToken(`${account!.id}:${fingerprint(account!.passwordHash)}`, 'reset', -1);

    expect(await checkResetToken(expired)).toMatchObject({ ok: false });
  });

  it('refuse un jeton signé pour un autre usage', async () => {
    const { email } = await createVerifiedAccount();
    expect(await checkResetToken(createToken(accountId(email), 'confirm'))).toMatchObject({
      ok: false,
    });
  });

  it('refuse un nouveau mot de passe trop faible sans invalider le lien', async () => {
    const { email } = await createVerifiedAccount();
    const token = await resetTokenFor(email);

    expect(await resetPassword(token, 'court')).toMatchObject({ ok: false });
    // Le lien doit rester utilisable : l'échec vient du mot de passe, pas du lien.
    expect(await checkResetToken(token)).toEqual({ ok: true });
    expect(await resetPassword(token, 'nouveaumotdepasse')).toEqual({ ok: true });
  });

  it('vérifie le compte au passage', async () => {
    // Avoir cliqué un lien reçu à cette adresse prouve qu'on y a accès : c'est
    // exactement ce que la confirmation d'inscription demandait.
    const email = 'jamais-confirme@exemple.fr';
    await register({ email, password: 'alternancefinance' });
    expect((await getStore().getAccount(accountId(email)))?.verified).toBe(false);

    await resetPassword(await resetTokenFor(email), 'nouveaumotdepasse');
    expect((await getStore().getAccount(accountId(email)))?.verified).toBe(true);
    expect(await login({ email, password: 'nouveaumotdepasse' })).toEqual({ ok: true });
  });
});

describe('inscription', () => {
  it('ne révèle pas qu’une adresse est déjà inscrite', async () => {
    const first = await register({ email: 'etudiant@exemple.fr', password: 'alternancefinance' });
    const second = await register({ email: 'etudiant@exemple.fr', password: 'autrechosee' });
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
  });

  it('ne remplace pas le mot de passe d’un compte existant', async () => {
    // Sinon n'importe qui pourrait écraser le mot de passe d'autrui en
    // « s'inscrivant » avec son adresse.
    const { email } = await createVerifiedAccount();
    await register({ email, password: 'motdepasseintrus' });

    expect(await login({ email, password: 'motdepasseintrus' })).toMatchObject({ ok: false });
    expect(await login({ email, password: 'alternancefinance' })).toEqual({ ok: true });
  });
});
