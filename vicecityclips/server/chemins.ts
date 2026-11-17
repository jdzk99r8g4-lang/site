import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));

/** Dossier du projet (celui qui contient package.json). */
export const RACINE = path.resolve(ici, '..');

/** La base de donnees : un seul fichier, dans le dossier du projet. */
export const FICHIER_DB = path.join(RACINE, 'vicecityclips.db');

/** Les captures d'ecran et justificatifs joints aux clips et aux paiements. */
export const DOSSIER_PIECES = path.join(RACINE, 'pieces-jointes');

/** Les fichiers produits par les exports (.xlsx, .csv). */
export const DOSSIER_EXPORTS = path.join(RACINE, 'exports');

/** Les archives de sauvegarde complete. */
export const DOSSIER_SAUVEGARDES = path.join(RACINE, 'sauvegardes');

/** Nom attendu du fichier Excel de depart. */
export const NOM_FICHIER_EXCEL = 'ViceCityClips - Tableau de pilotage.xlsx';

export function creerDossiers(): void {
  for (const dossier of [DOSSIER_PIECES, DOSSIER_EXPORTS, DOSSIER_SAUVEGARDES]) {
    fs.mkdirSync(dossier, { recursive: true });
  }
}

/**
 * Cherche le fichier Excel de depart dans le dossier du projet : d'abord le nom
 * exact, sinon le premier classeur .xlsx trouve. Renvoie null s'il n'y en a pas.
 */
export function trouverFichierExcel(): string | null {
  const exact = path.join(RACINE, NOM_FICHIER_EXCEL);
  if (fs.existsSync(exact)) return exact;

  const candidats = fs
    .readdirSync(RACINE, { withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((nom) => nom.toLowerCase().endsWith('.xlsx') && !nom.startsWith('~$'))
    .sort();

  return candidats.length > 0 ? path.join(RACINE, candidats[0]) : null;
}
