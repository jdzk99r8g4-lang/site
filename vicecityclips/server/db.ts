import Database from 'better-sqlite3';
import { FICHIER_DB, creerDossiers } from './chemins';
import { REGLAGES_PAR_DEFAUT, type Reglages } from '../shared/types';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS reglages (
  cle    TEXT PRIMARY KEY,
  valeur TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS campagnes (
  id                    TEXT PRIMARY KEY,
  nom                   TEXT NOT NULL DEFAULT '',
  organisateur          TEXT,
  plateforme_campagne   TEXT,
  lien                  TEXT,
  type                  TEXT NOT NULL DEFAULT 'CPM',
  cpm                   REAL,
  paiement_min          REAL,
  plafond_par_clip      REAL,
  budget_total          REAL,
  plateformes_eligibles TEXT,
  audience_exigee       TEXT,
  langue                TEXT,
  hashtag_obligatoire   TEXT,
  delai_soumission_min  INTEGER,
  date_limite           TEXT,
  statut                TEXT,
  verifie_le            TEXT,
  regles_cles           TEXT,
  cree_le               TEXT NOT NULL DEFAULT (datetime('now')),
  maj_le                TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS comptes (
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  identifiant            TEXT NOT NULL UNIQUE,
  nom_affiche            TEXT,
  plateforme             TEXT,
  niche                  TEXT,
  langue                 TEXT,
  configuration_pays     TEXT,
  date_creation          TEXT,
  relie_content_rewards  INTEGER NOT NULL DEFAULT 0,
  audience_principale    TEXT,
  notes                  TEXT,
  cree_le                TEXT NOT NULL DEFAULT (datetime('now')),
  maj_le                 TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS abonnes_historique (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  compte_id INTEGER NOT NULL REFERENCES comptes(id) ON DELETE CASCADE,
  date      TEXT NOT NULL,
  abonnes   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_abonnes_compte ON abonnes_historique(compte_id, date);

CREATE TABLE IF NOT EXISTS clips (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  date_publication  TEXT,
  heure_publication TEXT,
  heure_soumission  TEXT,
  compte_id         INTEGER REFERENCES comptes(id) ON DELETE SET NULL,
  plateforme        TEXT,
  campagne_id       TEXT REFERENCES campagnes(id) ON DELETE SET NULL,
  createur          TEXT,
  lien_publication  TEXT,
  lien_source       TEXT,
  vues_j3           INTEGER,
  vues_finales      INTEGER,
  statut            TEXT NOT NULL DEFAULT 'En attente',
  motif_refus       TEXT,
  notes             TEXT,
  cree_le           TEXT NOT NULL DEFAULT (datetime('now')),
  maj_le            TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_clips_date ON clips(date_publication);
CREATE INDEX IF NOT EXISTS idx_clips_campagne ON clips(campagne_id);
CREATE INDEX IF NOT EXISTS idx_clips_compte ON clips(compte_id);

CREATE TABLE IF NOT EXISTS pieces_jointes (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  type_parent   TEXT NOT NULL,
  parent_id     INTEGER NOT NULL,
  nom_fichier   TEXT NOT NULL,
  nom_original  TEXT NOT NULL,
  type_mime     TEXT,
  taille        INTEGER,
  ajoute_le     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_pieces_parent ON pieces_jointes(type_parent, parent_id);

CREATE TABLE IF NOT EXISTS paiements (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  date_reception   TEXT,
  source           TEXT,
  campagne_id      TEXT REFERENCES campagnes(id) ON DELETE SET NULL,
  montant_brut     REAL NOT NULL DEFAULT 0,
  frais_retrait    REAL NOT NULL DEFAULT 0,
  taux_eur_par_usd REAL,
  moyen            TEXT,
  reference        TEXT,
  declare_impots   INTEGER NOT NULL DEFAULT 0,
  notes            TEXT,
  cree_le          TEXT NOT NULL DEFAULT (datetime('now')),
  maj_le           TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_paiements_date ON paiements(date_reception);

CREATE TABLE IF NOT EXISTS taches (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  numero   INTEGER,
  phase    TEXT,
  tache    TEXT NOT NULL,
  detail   TEXT,
  echeance TEXT,
  statut   TEXT NOT NULL DEFAULT 'À faire',
  notes    TEXT,
  ordre    INTEGER NOT NULL DEFAULT 0
);
`;

export type BaseDonnees = Database.Database;

let base: BaseDonnees | null = null;

/**
 * Cree ou ouvre une base au chemin donne et y applique le schema.
 * Utilise par l'application (fichier du projet) et par les tests (« :memory: »).
 */
export function creerBase(chemin: string): BaseDonnees {
  const db = new Database(chemin);
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  appliquerReglagesParDefaut(db);
  return db;
}

/** Ouvre la base du projet (en la creant au besoin) et met le schema a jour. */
export function ouvrirBase(): BaseDonnees {
  if (base) return base;
  creerDossiers();
  const db = creerBase(FICHIER_DB);
  db.pragma('journal_mode = WAL');
  base = db;
  return db;
}

/** Referme la base (utilise par la restauration de sauvegarde). */
export function fermerBase(): void {
  if (base) {
    base.close();
    base = null;
  }
}

const CLES_REGLAGES = {
  fraisCpm: 'frais_cpm',
  tauxEurParUsd: 'taux_eur_par_usd',
  objectifMensuelEur: 'objectif_mensuel_eur',
} as const;

function appliquerReglagesParDefaut(db: BaseDonnees): void {
  const inserer = db.prepare('INSERT OR IGNORE INTO reglages (cle, valeur) VALUES (?, ?)');
  inserer.run(CLES_REGLAGES.fraisCpm, String(REGLAGES_PAR_DEFAUT.fraisCpm));
  inserer.run(CLES_REGLAGES.tauxEurParUsd, String(REGLAGES_PAR_DEFAUT.tauxEurParUsd));
  inserer.run(CLES_REGLAGES.objectifMensuelEur, String(REGLAGES_PAR_DEFAUT.objectifMensuelEur));
}

export function lireReglages(db: BaseDonnees): Reglages {
  const lignes = db.prepare('SELECT cle, valeur FROM reglages').all() as Array<{
    cle: string;
    valeur: string;
  }>;
  const brut = new Map(lignes.map((l) => [l.cle, l.valeur]));

  const nombre = (cle: string, defaut: number): number => {
    const v = Number(brut.get(cle));
    return Number.isFinite(v) ? v : defaut;
  };

  return {
    fraisCpm: nombre(CLES_REGLAGES.fraisCpm, REGLAGES_PAR_DEFAUT.fraisCpm),
    tauxEurParUsd: nombre(CLES_REGLAGES.tauxEurParUsd, REGLAGES_PAR_DEFAUT.tauxEurParUsd),
    objectifMensuelEur: nombre(CLES_REGLAGES.objectifMensuelEur, REGLAGES_PAR_DEFAUT.objectifMensuelEur),
  };
}

export function ecrireReglages(db: BaseDonnees, reglages: Partial<Reglages>): Reglages {
  const ecrire = db.prepare(
    'INSERT INTO reglages (cle, valeur) VALUES (?, ?) ON CONFLICT(cle) DO UPDATE SET valeur = excluded.valeur',
  );
  const tout = db.transaction((r: Partial<Reglages>) => {
    if (r.fraisCpm !== undefined) ecrire.run(CLES_REGLAGES.fraisCpm, String(r.fraisCpm));
    if (r.tauxEurParUsd !== undefined) ecrire.run(CLES_REGLAGES.tauxEurParUsd, String(r.tauxEurParUsd));
    if (r.objectifMensuelEur !== undefined)
      ecrire.run(CLES_REGLAGES.objectifMensuelEur, String(r.objectifMensuelEur));
  });
  tout(reglages);
  return lireReglages(db);
}

/** Vrai si aucune donnee metier n'a encore ete saisie (premier lancement). */
export function baseEstVide(db: BaseDonnees): boolean {
  const compter = (table: string): number =>
    (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;
  return (
    compter('campagnes') === 0 &&
    compter('comptes') === 0 &&
    compter('clips') === 0 &&
    compter('paiements') === 0 &&
    compter('taches') === 0
  );
}
