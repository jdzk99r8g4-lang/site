import { describe, it, expect, beforeEach, vi } from 'vitest';

const jar = new Map<string, string>();
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name) } : undefined),
    set: (name: string, value: string) => jar.set(name, value),
    delete: (name: string) => jar.delete(name),
  }),
}));

const { getStore, resetStore } = await import('@/lib/store');
const { accountId, login, register, signInWithGoogle, verifyAccount } = await import('@/lib/auth');
const { createToken } = await import('@/lib/tokens');
const { buildAuthorizationUrl, readIdToken, safeEquals } = await import('@/lib/google');

beforeEach(() => {
  jar.clear();
  resetStore();
});

const CLIENT_ID = '123456.apps.googleusercontent.com';

/**
 * Fabrique un jeton d'identité.
 *
 * La signature est factice, et c'est sans conséquence : le jeton est récupéré
 * par le serveur directement auprès de Google sur une liaison TLS vérifiée,
 * cas pour lequel OpenID Connect rend le contrôle de signature facultatif.
 * Ce que le code vérifie, ce sont les affirmations — c'est ce qu'on teste.
 */
function idToken(claims: Record<string, unknown>): string {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'RS256' })}.${b64(claims)}.signature-factice`;
}

function validClaims(overrides: Record<string, unknown> = {}) {
  return {
    iss: 'https://accounts.google.com',
    aud: CLIENT_ID,
    exp: Math.floor(Date.now() / 1000) + 600,
    sub: '1098765432100',
    nonce: 'le-nonce-attendu',
    email: 'etudiant@gmail.com',
    email_verified: true,
    ...overrides,
  };
}

describe('lecture du jeton d’identité Google', () => {
  it('accepte un jeton conforme', () => {
    const result = readIdToken(idToken(validClaims()), CLIENT_ID, 'le-nonce-attendu');
    expect(result).toMatchObject({
      ok: true,
      identity: { sub: '1098765432100', email: 'etudiant@gmail.com', emailVerified: true },
    });
  });

  it('refuse un jeton émis pour une AUTRE application', () => {
    /*
     * Le contrôle le plus important. Sans lui, n'importe quel développeur
     * disposant d'une application Google pourrait présenter ici un jeton
     * obtenu chez lui et se connecter au compte de son choix.
     */
    const result = readIdToken(
      idToken(validClaims({ aud: 'une-autre-application.apps.googleusercontent.com' })),
      CLIENT_ID,
      'le-nonce-attendu',
    );
    expect(result).toMatchObject({ ok: false });
    expect(result).toMatchObject({ error: expect.stringContaining('autre application') });
  });

  it('refuse un émetteur inattendu', () => {
    expect(
      readIdToken(idToken(validClaims({ iss: 'https://evil.example' })), CLIENT_ID, 'le-nonce-attendu'),
    ).toMatchObject({ ok: false });
  });

  it('accepte les deux graphies d’émetteur de Google', () => {
    expect(
      readIdToken(idToken(validClaims({ iss: 'accounts.google.com' })), CLIENT_ID, 'le-nonce-attendu'),
    ).toMatchObject({ ok: true });
  });

  it('refuse un jeton expiré', () => {
    expect(
      readIdToken(
        idToken(validClaims({ exp: Math.floor(Date.now() / 1000) - 10 })),
        CLIENT_ID,
        'le-nonce-attendu',
      ),
    ).toMatchObject({ ok: false, error: expect.stringContaining('expiré') });
  });

  it('refuse un nonce qui ne correspond pas à la demande', () => {
    // Empêche de rejouer ici un jeton obtenu ailleurs.
    expect(
      readIdToken(idToken(validClaims()), CLIENT_ID, 'un-autre-nonce'),
    ).toMatchObject({ ok: false });
    expect(
      readIdToken(idToken(validClaims({ nonce: undefined })), CLIENT_ID, 'le-nonce-attendu'),
    ).toMatchObject({ ok: false });
  });

  it('refuse un jeton sans adresse ou sans identifiant', () => {
    expect(readIdToken(idToken(validClaims({ email: undefined })), CLIENT_ID, 'le-nonce-attendu'))
      .toMatchObject({ ok: false });
    expect(readIdToken(idToken(validClaims({ sub: undefined })), CLIENT_ID, 'le-nonce-attendu'))
      .toMatchObject({ ok: false });
  });

  it('survit à un jeton malformé', () => {
    for (const bad of ['', 'pasunjeton', 'a.b', 'a.pas-du-base64url!.c']) {
      expect(readIdToken(bad, CLIENT_ID, 'le-nonce-attendu'), bad).toMatchObject({ ok: false });
    }
  });

  it('transmet email_verified à faux au lieu de le supposer vrai', () => {
    const result = readIdToken(
      idToken(validClaims({ email_verified: false })),
      CLIENT_ID,
      'le-nonce-attendu',
    );
    expect(result).toMatchObject({ ok: true, identity: { emailVerified: false } });
  });
});

describe('URL d’autorisation', () => {
  it('demande le strict nécessaire et porte state et nonce', () => {
    const url = new URL(
      buildAuthorizationUrl({
        config: { clientId: CLIENT_ID, clientSecret: 'secret', redirectUri: 'https://x.test/retour' },
        state: 'mon-etat',
        nonce: 'mon-nonce',
      }),
    );
    expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    // Ni `profile` ni aucun accès aux données : on ne veut que l'identité.
    expect(url.searchParams.get('scope')).toBe('openid email');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('state')).toBe('mon-etat');
    expect(url.searchParams.get('nonce')).toBe('mon-nonce');
    expect(url.searchParams.get('prompt')).toBe('select_account');
  });

  it('la comparaison de state est en temps constant et exacte', () => {
    expect(safeEquals('abc', 'abc')).toBe(true);
    expect(safeEquals('abc', 'abd')).toBe(false);
    expect(safeEquals('abc', 'abcd')).toBe(false);
    expect(safeEquals('', '')).toBe(true);
  });
});

describe('connexion avec Google', () => {
  it('crée un compte, déjà vérifié et sans mot de passe', async () => {
    const result = await signInWithGoogle({
      sub: '1098765432100',
      email: 'nouveau@gmail.com',
      emailVerified: true,
    });
    expect(result).toMatchObject({ ok: true, created: true, linked: false });

    const account = await getStore().getAccount(accountId('nouveau@gmail.com'));
    expect(account).toMatchObject({ verified: true, passwordHash: null, googleId: '1098765432100' });
  });

  it('RATTACHE au compte existant au lieu d’en créer un second', async () => {
    /*
     * Le piège classique de l'ajout d'une connexion sociale : sans
     * rattachement, la personne obtient un compte vide et ne comprend pas où
     * sont passées ses offres enregistrées.
     */
    await register({ email: 'etudiant@gmail.com', password: 'alternancefinance' });
    await verifyAccount(createToken(accountId('etudiant@gmail.com'), 'confirm'));
    const store = getStore();
    const before = await store.getAccount(accountId('etudiant@gmail.com'));
    before!.savedOfferIds = ['offre-1'];
    await store.saveAccount(before!);

    const result = await signInWithGoogle({
      sub: '1098765432100',
      email: 'etudiant@gmail.com',
      emailVerified: true,
    });
    expect(result).toMatchObject({ ok: true, created: false, linked: true });

    const after = await store.getAccount(accountId('etudiant@gmail.com'));
    expect(after?.savedOfferIds).toEqual(['offre-1']);
    expect(after?.googleId).toBe('1098765432100');
    // Le mot de passe existant continue de fonctionner.
    expect(await login({ email: 'etudiant@gmail.com', password: 'alternancefinance' })).toEqual({
      ok: true,
    });
  });

  it('rattache aussi quand la graphie Gmail diffère', async () => {
    await register({ email: 'p.nom@gmail.com', password: 'alternancefinance' });
    const result = await signInWithGoogle({
      sub: '42',
      email: 'pnom@gmail.com',
      emailVerified: true,
    });
    expect(result).toMatchObject({ created: false, linked: true });
  });

  it('REFUSE si Google ne confirme pas l’adresse', async () => {
    /*
     * Sans ce refus, il suffirait de créer un compte Google portant l'adresse
     * d'un tiers pour s'emparer de son compte JuniorDesk.
     */
    await register({ email: 'victime@exemple.fr', password: 'alternancefinance' });
    const result = await signInWithGoogle({
      sub: 'intrus',
      email: 'victime@exemple.fr',
      emailVerified: false,
    });
    expect(result).toMatchObject({ ok: false });

    const account = await getStore().getAccount(accountId('victime@exemple.fr'));
    expect(account?.googleId).toBeNull();
  });

  it('confirme un compte qui attendait encore sa vérification par e-mail', async () => {
    await register({ email: 'enattente@gmail.com', password: 'alternancefinance' });
    expect((await getStore().getAccount(accountId('enattente@gmail.com')))?.verified).toBe(false);

    await signInWithGoogle({ sub: '7', email: 'enattente@gmail.com', emailVerified: true });
    expect((await getStore().getAccount(accountId('enattente@gmail.com')))?.verified).toBe(true);
  });

  it('ouvre bien une session', async () => {
    await signInWithGoogle({ sub: '9', email: 'session@gmail.com', emailVerified: true });
    expect(jar.has('jd_session')).toBe(true);
  });

  it('refuse une adresse inexploitable', async () => {
    expect(await signInWithGoogle({ sub: '1', email: 'pasuneadresse', emailVerified: true }))
      .toMatchObject({ ok: false });
  });
});
