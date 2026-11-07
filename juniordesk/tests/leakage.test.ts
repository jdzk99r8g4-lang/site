import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Garantie d’architecture : rien de sensible ne doit atteindre le navigateur.
 *
 * Un fichier marqué « use client » est compilé vers le navigateur. S’il
 * importe un module serveur, la clé de l’API source, le secret de signature
 * des alertes ou les adresses e-mail des inscrits deviennent lisibles dans le
 * code source de la page.
 *
 * Ce test remplace le paquet `server-only` : même garantie, sans dépendance.
 */

const FORBIDDEN_IN_CLIENT = [
  'lib/sources',
  'lib/store',
  'lib/offers',
  'lib/collect',
  'lib/alerts',
  'lib/tokens',
  'lib/email',
  'lib/stats',
];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return /\.tsx?$/.test(entry) ? [full] : [];
  });
}

const sourceFiles = walk('src');

describe('étanchéité client / serveur', () => {
  it('trouve bien des fichiers à analyser', () => {
    expect(sourceFiles.length).toBeGreaterThan(20);
  });

  it('aucun composant client n’importe de module serveur', () => {
    const offenders: string[] = [];

    for (const file of sourceFiles) {
      const content = readFileSync(file, 'utf8');
      const isClient = /^\s*(['"])use client\1/m.test(content);
      if (!isClient) continue;

      for (const forbidden of FORBIDDEN_IN_CLIENT) {
        const pattern = new RegExp(
          `(?:from|import)\\s*\\(?\\s*['"][^'"]*${forbidden.replace('/', '\\/')}`,
        );
        if (pattern.test(content)) offenders.push(`${file} importe ${forbidden}`);
      }
    }

    expect(offenders, offenders.join('\n')).toEqual([]);
  });

  it('aucun secret n’est lu depuis un composant client', () => {
    const secrets = ['LBA_API_KEY', 'ALERTS_SECRET', 'CRON_SECRET', 'RESEND_API_KEY', 'UPSTASH_'];
    const offenders: string[] = [];

    for (const file of sourceFiles) {
      const content = readFileSync(file, 'utf8');
      if (!/^\s*(['"])use client\1/m.test(content)) continue;
      for (const secret of secrets) {
        if (content.includes(secret)) offenders.push(`${file} mentionne ${secret}`);
      }
    }

    expect(offenders, offenders.join('\n')).toEqual([]);
  });

  it('seules les variables NEXT_PUBLIC_ sont lues côté client', () => {
    const offenders: string[] = [];

    for (const file of sourceFiles) {
      const content = readFileSync(file, 'utf8');
      if (!/^\s*(['"])use client\1/m.test(content)) continue;
      for (const match of content.matchAll(/process\.env\.([A-Z0-9_]+)/g)) {
        const name = match[1] ?? '';
        if (!name.startsWith('NEXT_PUBLIC_')) offenders.push(`${file} lit ${name}`);
      }
    }

    expect(offenders, offenders.join('\n')).toEqual([]);
  });

  it('le module de lecture des offres porte une garde d’exécution côté client', () => {
    const content = readFileSync('src/lib/offers.ts', 'utf8');
    expect(content).toMatch(/typeof window !== 'undefined'/);
    expect(content).toMatch(/throw new Error/);
  });

  it('la redirection comptée ne redirige jamais vers une adresse fournie dans l’URL', () => {
    // Une redirection ouverte servirait aussitôt à faire passer un lien
    // d'hameçonnage pour un lien de notre domaine.
    const content = readFileSync('src/app/go/[id]/route.ts', 'utf8');
    expect(content).toContain('NextResponse.redirect(offer.applyUrl');
    expect(content).not.toMatch(/redirect\(\s*(?:url\.)?searchParams\.get/);
  });
});
