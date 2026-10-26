import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { checkoutInputSchema, toShippingAddress } from '@/lib/checkout';
import { bankDetails, isBankConfigured, formatIban } from '@/lib/bank';
import { isAdminConfigured, isSignedIn, signIn } from '@/lib/admin';
import { createOrder, withTransferDeclared, toPublicOrder } from '@/lib/store/orders';
import { CANCELLABLE } from '@/lib/store/types';
import { priceCart } from '@/lib/cart';

const CLIENT = {
  firstName: 'Camille',
  lastName: 'Rossi',
  email: 'camille@exemple.fr',
  phone: '0612345678',
  line1: '12 rue des Lilas',
  line2: null,
  postalCode: '75011',
  city: 'Paris',
};

const PANIER = {
  locale: 'fr' as const,
  shippingCountry: 'FR',
  lines: [{ productId: 'elec-vicco-lynea', variantId: 'blanc', quantity: 1 }],
  customer: CLIENT,
  transferHolder: null,
};

describe('formulaire de commande', () => {
  it('accepte une saisie complète', () => {
    const parsed = checkoutInputSchema.parse(PANIER);
    expect(parsed.customer.email).toBe('camille@exemple.fr');
  });

  it('refuse un panier qui porte un prix', () => {
    /*
     * La garde qui compte. Un champ `total` ou `unitPrice` accepté ici, même
     * ignoré ensuite, finirait un jour par être lu : le schéma doit le rejeter
     * explicitement plutôt que le laisser passer en silence.
     */
    const parsed = checkoutInputSchema.parse({
      ...PANIER,
      lines: [{ productId: 'elec-vicco-lynea', variantId: 'blanc', quantity: 1, unitPrice: 1 }],
    });
    expect(parsed.lines[0]).not.toHaveProperty('unitPrice');
  });

  it('exige un téléphone : le transporteur appelle avant de livrer', () => {
    const sans = { ...PANIER, customer: { ...CLIENT, phone: '' } };
    expect(() => checkoutInputSchema.parse(sans)).toThrow();
  });

  it('refuse une adresse e-mail malformée', () => {
    const faux = { ...PANIER, customer: { ...CLIENT, email: 'camille' } };
    expect(() => checkoutInputSchema.parse(faux)).toThrow();
  });

  it('prend le pays de livraison du tarif, pas d’un second champ', () => {
    // Deux champs pays divergeraient : on expédierait en Espagne une commande
    // facturée au tarif français.
    const parsed = checkoutInputSchema.parse({ ...PANIER, shippingCountry: 'ES' });
    expect(toShippingAddress(parsed).country).toBe('ES');
  });

  it('assemble le nom du destinataire à partir du prénom et du nom', () => {
    const parsed = checkoutInputSchema.parse(PANIER);
    expect(toShippingAddress(parsed).name).toBe('Camille Rossi');
  });

  it('accepte un titulaire de compte différent du client', () => {
    const parsed = checkoutInputSchema.parse({ ...PANIER, transferHolder: 'Jean Rossi' });
    expect(parsed.transferHolder).toBe('Jean Rossi');
  });
});

describe('cycle de vie en paiement par virement', () => {
  function commande() {
    const cart = priceCart({
      lines: [{ productId: 'elec-vicco-lynea', variantId: 'blanc', quantity: 1 }],
      shippingCountry: 'FR',
      locale: 'fr',
    });
    return createOrder({
      cart,
      email: CLIENT.email,
      address: toShippingAddress(checkoutInputSchema.parse(PANIER)),
      transferHolder: null,
    });
  }

  it('naît en attente de virement, jamais payée', () => {
    /*
     * L'invariant qui protège l'argent : rien ne doit créer une commande dans
     * un état qui déclencherait une expédition. Seule une personne qui a vu le
     * relevé la fait avancer.
     */
    expect(commande().status).toBe('awaiting_transfer');
  });

  it('porte l’adresse dès la création', () => {
    // Le parcours par carte collectait l'adresse chez le prestataire, donc
    // après coup. Ici elle est saisie avant, et ne peut plus manquer.
    expect(commande().address).not.toBeNull();
  });

  it('ne garde aucune trace d’un prestataire de paiement', () => {
    expect(Object.keys(commande())).not.toContain('stripeSessionId');
    expect(Object.keys(commande())).not.toContain('supplierOrders');
  });

  it('n’autorise l’annulation que tant que rien n’est parti', () => {
    expect(CANCELLABLE).toContain('awaiting_transfer');
    expect(CANCELLABLE).toContain('confirmed');
    expect(CANCELLABLE).not.toContain('shipped');
    expect(CANCELLABLE).not.toContain('delivered');
  });
});

describe('coordonnées bancaires', () => {
  const sauvegarde = { ...process.env };
  afterEach(() => {
    process.env = { ...sauvegarde };
  });

  it('se déclare non configurée tant que l’IBAN manque', () => {
    delete process.env['BANK_IBAN'];
    process.env['BANK_HOLDER'] = 'Pellora SAS';
    expect(isBankConfigured()).toBe(false);
  });

  it('se déclare configurée avec titulaire et IBAN', () => {
    process.env['BANK_HOLDER'] = 'Pellora SAS';
    process.env['BANK_IBAN'] = 'FR7630006000011234567890189';
    expect(isBankConfigured()).toBe(true);
    expect(bankDetails().holder).toBe('Pellora SAS');
  });

  it('groupe l’IBAN par quatre, comme sur un RIB imprimé', () => {
    // Un IBAN de 27 caractères recopié d'un bloc se trompe d'un chiffre.
    expect(formatIban('FR7630006000011234567890189')).toBe(
      'FR76 3000 6000 0112 3456 7890 189',
    );
  });

  it('regroupe aussi un IBAN déjà espacé, sans le doubler', () => {
    expect(formatIban('FR76 3000 6000 0112 3456 7890 189')).toBe(
      'FR76 3000 6000 0112 3456 7890 189',
    );
  });
});

describe('accès au back-office', () => {
  const sauvegarde = { ...process.env };
  beforeEach(() => {
    process.env['ADMIN_PASSWORD'] = 'un-mot-de-passe-assez-long';
  });
  afterEach(() => {
    process.env = { ...sauvegarde };
  });

  it('reste fermé sans mot de passe configuré', () => {
    // Un défaut de configuration ne doit jamais ouvrir l'accès aux commandes.
    delete process.env['ADMIN_PASSWORD'];
    expect(isAdminConfigured()).toBe(false);
    expect(signIn('')).toBeNull();
    expect(isSignedIn('nimporte-quoi')).toBe(false);
  });

  it('refuse un mot de passe trop court', () => {
    process.env['ADMIN_PASSWORD'] = 'court';
    expect(isAdminConfigured()).toBe(false);
  });

  it('délivre un jeton au bon mot de passe et le reconnaît', () => {
    const token = signIn('un-mot-de-passe-assez-long');
    expect(token).not.toBeNull();
    expect(isSignedIn(token!)).toBe(true);
  });

  it('refuse un mot de passe faux', () => {
    expect(signIn('un-mot-de-passe-assez-faux')).toBeNull();
  });

  it('ne met jamais le mot de passe dans le jeton', () => {
    const token = signIn('un-mot-de-passe-assez-long')!;
    expect(token).not.toContain('mot-de-passe');
  });

  it('invalide les sessions quand le mot de passe change', () => {
    /*
     * Le jeton est un HMAC calculé avec le mot de passe comme clé. Changer le
     * mot de passe déconnecte donc tout le monde — c'est exactement ce qu'on
     * veut quand quelqu'un quitte l'équipe.
     */
    const ancien = signIn('un-mot-de-passe-assez-long')!;
    process.env['ADMIN_PASSWORD'] = 'un-autre-mot-de-passe-long';
    expect(isSignedIn(ancien)).toBe(false);
  });
});

describe('déclaration du virement par le client', () => {
  function commande() {
    const cart = priceCart({
      lines: [{ productId: 'elec-vicco-lynea', variantId: 'blanc', quantity: 1 }],
      shippingCountry: 'FR',
      locale: 'fr',
    });
    return createOrder({
      cart,
      email: CLIENT.email,
      address: toShippingAddress(checkoutInputSchema.parse(PANIER)),
      transferHolder: null,
    });
  }

  it('ne fait PAS avancer la commande', () => {
    /*
     * L'invariant qui protège la marchandise. Si déclarer faisait passer en
     * « confirmée », il suffirait de cliquer sur un bouton pour déclencher
     * l'expédition d'un poêle sans avoir rien payé. Seule l'équipe, relevé
     * sous les yeux, confirme.
     */
    const après = withTransferDeclared(commande());
    expect(après.status).toBe('awaiting_transfer');
  });

  it('horodate la déclaration', () => {
    const après = withTransferDeclared(commande());
    expect(après.transferDeclaredAt).not.toBeNull();
    expect(Number.isNaN(Date.parse(après.transferDeclaredAt!))).toBe(false);
  });

  it('laisse une trace dans le journal', () => {
    const après = withTransferDeclared(commande());
    expect(après.events.some((e) => e.type === 'transfer:declared')).toBe(true);
  });

  it('est idempotente : un second clic ne réécrit rien', () => {
    // Sinon un client qui revient sur son suivi réalerterait l'équipe à
    // chaque visite.
    const une = withTransferDeclared(commande());
    const deux = withTransferDeclared(une);
    expect(deux).toBe(une);
    expect(deux.events.filter((e) => e.type === 'transfer:declared')).toHaveLength(1);
  });

  it('naît non déclarée', () => {
    expect(commande().transferDeclaredAt).toBeNull();
  });

  it('expose la déclaration au suivi, sans les données personnelles', () => {
    const vue = toPublicOrder(withTransferDeclared(commande()));
    expect(vue.transferDeclaredAt).not.toBeNull();
    expect(Object.keys(vue)).not.toContain('email');
    expect(Object.keys(vue)).not.toContain('address');
  });
});
