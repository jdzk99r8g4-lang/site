// Sauvegarde et restauration completes : la base de donnees et les pieces
// jointes dans une seule archive ZIP.

import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';
import Database from 'better-sqlite3';
import { DOSSIER_PIECES, DOSSIER_SAUVEGARDES, creerDossiers } from './chemins';
import { ouvrirBase } from './db';

const NOM_BASE_DANS_ARCHIVE = 'vicecityclips.db';
const DOSSIER_PIECES_DANS_ARCHIVE = 'pieces-jointes';
const NOM_MANIFESTE = 'sauvegarde.json';

/** Tables recopiees lors d'une restauration, des parents vers les enfants. */
const TABLES = [
  'reglages',
  'campagnes',
  'comptes',
  'abonnes_historique',
  'clips',
  'paiements',
  'pieces_jointes',
  'taches',
] as const;

export interface Manifeste {
  application: 'ViceCityClips';
  version: number;
  creeLe: string;
  nbPiecesJointes: number;
}

function horodatage(): string {
  const d = new Date();
  const p = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}h${p(d.getMinutes())}`;
}

/**
 * Fabrique l'archive de sauvegarde. La base est copiee avec l'API de sauvegarde
 * de SQLite : la copie est coherente meme si l'application tourne.
 */
export async function creerSauvegarde(): Promise<{ nom: string; contenu: Buffer }> {
  creerDossiers();
  const db = ouvrirBase();

  const copieTemporaire = path.join(DOSSIER_SAUVEGARDES, `.copie-${Date.now()}.db`);
  await db.backup(copieTemporaire);

  const zip = new AdmZip();
  try {
    zip.addFile(NOM_BASE_DANS_ARCHIVE, fs.readFileSync(copieTemporaire));
  } finally {
    fs.rmSync(copieTemporaire, { force: true });
  }

  let nbPiecesJointes = 0;
  if (fs.existsSync(DOSSIER_PIECES)) {
    for (const entree of fs.readdirSync(DOSSIER_PIECES, { withFileTypes: true })) {
      if (!entree.isFile() || entree.name.startsWith('.')) continue;
      zip.addFile(
        `${DOSSIER_PIECES_DANS_ARCHIVE}/${entree.name}`,
        fs.readFileSync(path.join(DOSSIER_PIECES, entree.name)),
      );
      nbPiecesJointes++;
    }
  }

  const manifeste: Manifeste = {
    application: 'ViceCityClips',
    version: 1,
    creeLe: new Date().toISOString(),
    nbPiecesJointes,
  };
  zip.addFile(NOM_MANIFESTE, Buffer.from(JSON.stringify(manifeste, null, 2), 'utf8'));

  return { nom: `vicecityclips-sauvegarde-${horodatage()}.zip`, contenu: zip.toBuffer() };
}

export interface ResultatRestauration {
  nbPiecesJointes: number;
  sauvegardeDeSecurite: string;
  creeLe: string | null;
  lignes: Record<string, number>;
}

/**
 * Remet en place une archive de sauvegarde.
 *
 * Le contenu de la sauvegarde est recopie table par table dans la base ouverte,
 * en une seule transaction : le serveur continue de tourner et l'application
 * n'a pas besoin d'etre redemarree. L'etat actuel est d'abord mis de cote dans
 * le dossier « sauvegardes » : si la restauration ne donne pas ce que vous
 * attendiez, rien n'est perdu.
 */
export async function restaurerSauvegarde(archive: Buffer): Promise<ResultatRestauration> {
  let zip: AdmZip;
  try {
    zip = new AdmZip(archive);
  } catch {
    throw new Error("Ce fichier n'est pas une archive ZIP lisible.");
  }

  const entrees = zip.getEntries().filter((e) => !e.isDirectory);
  const entreeBase = entrees.find((e) => path.posix.basename(e.entryName) === NOM_BASE_DANS_ARCHIVE);
  if (!entreeBase) {
    throw new Error(
      "Cette archive ne contient pas de fichier « vicecityclips.db » : ce n'est pas une sauvegarde ViceCityClips.",
    );
  }

  // Une archive vient de l'exterieur : on n'accepte que des noms de fichiers
  // simples, jamais un chemin qui sortirait du dossier des pieces jointes.
  const nomSansRisque = (nom: string): string | null => {
    const base = path.posix.basename(nom);
    if (!base || base === '.' || base === '..' || base.startsWith('.')) return null;
    if (base.includes('/') || base.includes('\\') || base.includes('\0')) return null;
    return base;
  };

  const piecesJointes = entrees
    .filter((e) => e.entryName.includes(`${DOSSIER_PIECES_DANS_ARCHIVE}/`))
    .map((e) => ({ entree: e, nom: nomSansRisque(e.entryName) }))
    .filter((p): p is { entree: AdmZip.IZipEntry; nom: string } => p.nom !== null);

  let creeLe: string | null = null;
  const entreeManifeste = entrees.find((e) => path.posix.basename(e.entryName) === NOM_MANIFESTE);
  if (entreeManifeste) {
    try {
      const m = JSON.parse(entreeManifeste.getData().toString('utf8')) as Partial<Manifeste>;
      creeLe = typeof m.creeLe === 'string' ? m.creeLe : null;
    } catch {
      creeLe = null;
    }
  }

  creerDossiers();

  // Filet de securite : on garde l'etat actuel avant de le remplacer.
  const secours = await creerSauvegarde();
  const cheminSecours = path.join(DOSSIER_SAUVEGARDES, `avant-restauration-${horodatage()}.zip`);
  fs.writeFileSync(cheminSecours, secours.contenu);

  const db = ouvrirBase();
  const cheminTemporaire = path.join(DOSSIER_SAUVEGARDES, `.restauration-${Date.now()}.db`);
  fs.writeFileSync(cheminTemporaire, entreeBase.getData());

  const lignes: Record<string, number> = {};

  try {
    verifierBaseSauvegarde(cheminTemporaire);

    // Les cles etrangeres sont suspendues pendant la recopie : l'ordre des
    // tables n'a alors plus d'importance. Ce reglage ne peut pas changer au
    // milieu d'une transaction, d'ou sa place ici.
    db.pragma('foreign_keys = OFF');
    db.prepare('ATTACH DATABASE ? AS sauvegarde').run(cheminTemporaire);

    const recopier = db.transaction(() => {
      for (const table of TABLES) {
        db.prepare(`DELETE FROM main.${table}`).run();
        db.prepare(`INSERT INTO main.${table} SELECT * FROM sauvegarde.${table}`).run();
        lignes[table] = (db.prepare(`SELECT COUNT(*) AS n FROM main.${table}`).get() as { n: number }).n;
      }
    });
    recopier();
  } finally {
    try {
      db.prepare('DETACH DATABASE sauvegarde').run();
    } catch {
      /* deja detachee */
    }
    db.pragma('foreign_keys = ON');
    fs.rmSync(cheminTemporaire, { force: true });
  }

  // Les pieces jointes ne sont remplacees qu'une fois la base restauree.
  fs.rmSync(DOSSIER_PIECES, { recursive: true, force: true });
  fs.mkdirSync(DOSSIER_PIECES, { recursive: true });
  for (const piece of piecesJointes) {
    fs.writeFileSync(path.join(DOSSIER_PIECES, piece.nom), piece.entree.getData());
  }

  return {
    nbPiecesJointes: piecesJointes.length,
    sauvegardeDeSecurite: path.basename(cheminSecours),
    creeLe,
    lignes,
  };
}

/** Verifie que le fichier restaure est bien une base ViceCityClips. */
function verifierBaseSauvegarde(chemin: string): void {
  const sauvegarde = new Database(chemin, { readonly: true });
  try {
    const tables = new Set(
      (
        sauvegarde.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as Array<{
          name: string;
        }>
      ).map((t) => t.name),
    );
    const manquantes = TABLES.filter((t) => !tables.has(t));
    if (manquantes.length > 0) {
      throw new Error(
        `La base de la sauvegarde est incomplete : table(s) manquante(s) ${manquantes.join(', ')}.`,
      );
    }
  } finally {
    sauvegarde.close();
  }
}
