import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Garantie d’architecture : les données sensibles ne doivent jamais arriver
 * dans le bundle navigateur.
 *
 * Un fichier marque « use client » est compile vers le navigateur. S’il
 * importe `sourcing.ts`, les prix d’achat et les références fournisseur
 * deviennent lisibles par n’importe qui dans le code source de la page — un
 * concurrent connait alors votre marge et votre grossiste.
 *
 * Ce test remplace le paquet `server-only` : même garantie, sans dependance.
 */

const FORBIDDEN_IN_CLIENT = [
  'lib/sourcing',
  // Les coordonnées bancaires ne sont pas secrètes, mais les figer dans le
  // bundle interdirait de changer de compte sans reconstruire le site.
  'lib/bank',
  // Le mot de passe du back-office, lui, l'est.
  'lib/admin',
  'lib/store',
  'lib/email',
  // Les adresses du CDN fournisseur. Pas un secret, mais les sérialiser dans
  // le HTML rendrait chaque fiche produit cliquable vers un autre site : la
  // boutique cesserait d'être la seule source visible de ce qu'elle vend.
  'lib/media-remote-sources',
];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return /\.tsx?$/.test(entry) ? [full] : [];
  });
}

/** Retire commentaires de bloc et de ligne, pour n’analyser que du code. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

const sourceFiles = walk('src');

describe('etancheite client / serveur', () => {
  it('trouve bien des fichiers a analyser', () => {
    expect(sourceFiles.length).toBeGreaterThan(15);
  });

  it('aucun composant client n’importe de module serveur', () => {
    const offenders: string[] = [];

    for (const file of sourceFiles) {
      const content = readFileSync(file, 'utf8');
      const isClient = /^\s*(['"])use client\1/m.test(content);
      if (!isClient) continue;

      for (const forbidden of FORBIDDEN_IN_CLIENT) {
        // On cible les imports, pas les mentions en commentaire.
        const importPattern = new RegExp(
          `(?:from|import)\\s*\\(?\\s*['"][^'"]*${forbidden.replace('/', '\\/')}`,
        );
        if (importPattern.test(content)) {
          offenders.push(`${file} importe ${forbidden}`);
        }
      }
    }

    expect(offenders, offenders.join('\n')).toEqual([]);
  });

  it('sourcing.ts porte une garde d’exécution cote client', () => {
    const content = readFileSync('src/lib/sourcing.ts', 'utf8');
    expect(content).toMatch(/typeof window !== 'undefined'/);
    expect(content).toMatch(/throw new Error/);
  });

  it('le catalogue public ne contient aucun prix d’achat', () => {
    // On retire les commentaires : l’en-tete de `catalog.ts` explique
    // justement ce qui ne doit PAS s’y trouver, et ce n’est pas une fuite.
    const code = stripComments(readFileSync('src/lib/catalog.ts', 'utf8'));
    for (const field of ['costNet', 'supplierSku', 'supplier:', 'leadTimeDays']) {
      expect(code, `catalog.ts expose le champ « ${field} »`).not.toContain(field);
    }
  });

  it('les types de commande publics masquent les données personnelles', () => {
    const content = readFileSync('src/lib/store/orders.ts', 'utf8');
    const publicBlock = content.slice(content.indexOf('export function toPublicOrder'));
    // L’adresse complète et l’e-mail ne doivent pas sortir par la page de suivi.
    expect(publicBlock).not.toMatch(/line1|postalCode|\bemail\b/);
  });
});
