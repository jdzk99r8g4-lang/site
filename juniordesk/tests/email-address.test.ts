import { describe, it, expect } from 'vitest';
import { canonicalizeEmail, isPlausibleEmail, maskEmail } from '@/lib/email-address';

describe('forme canonique des adresses', () => {
  it('ignore les points chez Gmail — le défaut qui créait des doublons', () => {
    /*
     * `p.nom@gmail.com` et `pnom@gmail.com` sont la même boîte. Sans cette
     * règle, un étudiant pouvait s'inscrire deux fois sans le vouloir et se
     * retrouver avec ses alertes d'un côté et ses offres de l'autre.
     */
    const attendu = 'pnom@gmail.com';
    for (const saisie of ['p.nom@gmail.com', 'pnom@gmail.com', 'P.N.O.M@Gmail.com', 'p.nom@googlemail.com']) {
      expect(canonicalizeEmail(saisie), saisie).toBe(attendu);
    }
  });

  it('retire le suffixe + chez Gmail', () => {
    expect(canonicalizeEmail('nom+juniordesk@gmail.com')).toBe('nom@gmail.com');
    expect(canonicalizeEmail('n.o.m+alertes+2027@gmail.com')).toBe('nom@gmail.com');
  });

  it('ne touche à RIEN ailleurs', () => {
    /*
     * Le point le plus important du fichier. Chez beaucoup d'hébergeurs,
     * `a.b@domaine.fr` et `ab@domaine.fr` sont deux personnes différentes.
     * Normaliser partout fusionnerait leurs comptes — bien pire qu'un
     * doublon.
     */
    for (const adresse of [
      'p.nom@icloud.com',
      'p.nom@me.com',
      'p.nom@outlook.fr',
      'prenom.nom@edu.iscparis.com',
      'nom+projet@exemple.fr',
    ]) {
      expect(canonicalizeEmail(adresse), adresse).toBe(adresse.toLowerCase());
    }
  });

  it('met en minuscules et retire les espaces de bord', () => {
    expect(canonicalizeEmail('  Prenom.Nom@Exemple.FR  ')).toBe('prenom.nom@exemple.fr');
  });

  it('ne fabrique pas d’adresse vide', () => {
    // « ...@gmail.com » n'a plus rien dans sa partie locale une fois les
    // points retirés : on rend l'entrée telle quelle plutôt qu'un « @gmail.com ».
    expect(canonicalizeEmail('...@gmail.com')).toBe('...@gmail.com');
    expect(canonicalizeEmail('+tag@gmail.com')).toBe('+tag@gmail.com');
  });

  it('survit à une entrée qui n’est pas une adresse', () => {
    expect(canonicalizeEmail('pasuneadresse')).toBe('pasuneadresse');
    expect(canonicalizeEmail('')).toBe('');
    expect(canonicalizeEmail('@gmail.com')).toBe('@gmail.com');
  });
});

describe('validation d’adresse', () => {
  it('accepte les fournisseurs courants chez les étudiants', () => {
    for (const email of [
      'prenom.nom@gmail.com',
      'prenom@icloud.com',
      'prenom@me.com',
      'a1b2c3@privaterelay.appleid.com',
      'prenom.nom@edu.iscparis.com',
      'x+y@z.co.uk',
    ]) {
      expect(isPlausibleEmail(email), email).toBe(true);
    }
  });

  it('refuse le manifestement invalide', () => {
    for (const email of ['', 'sansarobase', 'a@b', 'a b@c.fr', 'a@@b.fr', 'a@.fr', 'a@b..fr']) {
      expect(isPlausibleEmail(email), JSON.stringify(email)).toBe(false);
    }
  });
});

describe('masquage pour les journaux', () => {
  it('laisse deux caractères et le domaine', () => {
    expect(maskEmail('etudiant@exemple.fr')).toBe('et******@exemple.fr');
    expect(maskEmail('ab@exemple.fr')).toBe('ab*@exemple.fr');
    expect(maskEmail('pasuneadresse')).toBe('***');
  });
});
