// Import du fichier « ViceCityClips - Tableau de pilotage.xlsx ».
//
// Les colonnes sont reconnues par leur intitule, pas par leur position : si vous
// reorganisez le classeur, l'import continue de fonctionner. Les lignes marquees
// EXEMPLE ne sont jamais importees.

import ExcelJS from 'exceljs';
import AdmZip from 'adm-zip';
import type { BaseDonnees } from './db';
import { ecrireReglages } from './db';

/* ------------------------------------------------------------------ */
/* Lecture du classeur                                                 */
/* ------------------------------------------------------------------ */

/**
 * exceljs ne sait pas lire un classeur dont les commentaires de cellules sont
 * ranges dans « xl/comments/ » : il s'arrete sur une erreur. Les commentaires du
 * fichier de suivi sont des aides de saisie posees sur les en-tetes, pas des
 * donnees : on en fabrique donc une copie en memoire sans ces parties, et on lit
 * cette copie. Le fichier d'origine n'est jamais modifie.
 */
function classeurSansCommentaires(chemin: string): Buffer {
  const source = new AdmZip(chemin);
  const sortie = new AdmZip();

  const aIgnorer = (nom: string): boolean =>
    /^xl\/(comments|threadedComments)\//i.test(nom) ||
    /^xl\/drawings\/[^/]*comments[^/]*\.vml$/i.test(nom);

  const retirerRelations = (xml: string): string =>
    xml.replace(/<Relationship\b[^>]*?\/>/gi, (balise) =>
      /relationships\/(comments|vmlDrawing)"/i.test(balise) ? '' : balise,
    );

  const retirerTypes = (xml: string): string =>
    xml.replace(/<Override\b[^>]*?\/>/gi, (balise) =>
      /PartName="\/?xl\/(comments|threadedComments)\//i.test(balise) ? '' : balise,
    );

  const transformer = (nom: string, donnees: Buffer): Buffer => {
    if (/^xl\/worksheets\/_rels\/.+\.rels$/i.test(nom)) {
      return Buffer.from(retirerRelations(donnees.toString('utf8')), 'utf8');
    }
    if (/^xl\/worksheets\/sheet\d+\.xml$/i.test(nom)) {
      return Buffer.from(donnees.toString('utf8').replace(/<legacyDrawing\b[^>]*\/>/gi, ''), 'utf8');
    }
    if (nom === '[Content_Types].xml') {
      return Buffer.from(retirerTypes(donnees.toString('utf8')), 'utf8');
    }
    return donnees;
  };

  // [Content_Types].xml en premier, comme dans un classeur produit par Excel.
  const entrees = source.getEntries().filter((e) => !e.isDirectory && !aIgnorer(e.entryName));
  const typeContenu = entrees.find((e) => e.entryName === '[Content_Types].xml');
  if (typeContenu) {
    sortie.addFile('[Content_Types].xml', transformer(typeContenu.entryName, typeContenu.getData()));
  }
  for (const entree of entrees) {
    if (entree.entryName === '[Content_Types].xml') continue;
    sortie.addFile(entree.entryName, transformer(entree.entryName, entree.getData()));
  }

  return sortie.toBuffer();
}

/** Ouvre le classeur en tolerant les commentaires de cellules. */
async function lireClasseur(chemin: string): Promise<ExcelJS.Workbook> {
  const classeur = new ExcelJS.Workbook();
  try {
    await classeur.xlsx.readFile(chemin);
    return classeur;
  } catch {
    const propre = new ExcelJS.Workbook();
    await propre.xlsx.load(classeurSansCommentaires(chemin) as unknown as ExcelJS.Buffer);
    return propre;
  }
}

export interface ResultatImport {
  fichier: string;
  reglages: { fraisCpm: number | null; tauxEurParUsd: number | null; objectifMensuelEur: number | null };
  campagnes: number;
  comptes: number;
  relevesAbonnes: number;
  clips: number;
  paiements: number;
  taches: number;
  lignesExempleIgnorees: number;
  avertissements: string[];
}

/* ------------------------------------------------------------------ */
/* Lecture des cellules                                                */
/* ------------------------------------------------------------------ */

type ValeurCellule = ExcelJS.CellValue;

/** Ramene n'importe quelle valeur de cellule a du texte simple. */
function texteBrut(valeur: ValeurCellule): string | null {
  if (valeur === null || valeur === undefined) return null;
  if (typeof valeur === 'string') return valeur.trim() || null;
  if (typeof valeur === 'number') return String(valeur);
  if (typeof valeur === 'boolean') return valeur ? 'Oui' : 'Non';
  if (valeur instanceof Date) return valeur.toISOString();
  if (typeof valeur === 'object') {
    const o = valeur as unknown as Record<string, unknown>;
    if ('richText' in o && Array.isArray(o.richText)) {
      const t = (o.richText as Array<{ text?: string }>).map((p) => p.text ?? '').join('');
      return t.trim() || null;
    }
    if ('text' in o && typeof o.text === 'string') return o.text.trim() || null;
    if ('result' in o) return texteBrut(o.result as ValeurCellule);
    if ('hyperlink' in o && typeof o.hyperlink === 'string') return o.hyperlink.trim() || null;
  }
  return null;
}

function nombreCellule(valeur: ValeurCellule): number | null {
  if (valeur === null || valeur === undefined || valeur === '') return null;
  if (typeof valeur === 'number') return Number.isFinite(valeur) ? valeur : null;
  if (typeof valeur === 'object' && valeur !== null && 'result' in (valeur as object)) {
    return nombreCellule((valeur as { result: ValeurCellule }).result);
  }
  const t = texteBrut(valeur);
  if (t === null) return null;
  // Accepte « 1 234,56 », « 1,234.56 », « 10 % »
  const nettoye = t
    .replace(/\s| /g, '')
    .replace(/%$/, '')
    .replace(/\.(?=\d{3}\b)/g, '')
    .replace(',', '.');
  const n = Number(nettoye);
  return Number.isFinite(n) ? n : null;
}

/** Date au format « AAAA-MM-JJ ». Les dates Excel sont lues en UTC. */
function dateCellule(valeur: ValeurCellule): string | null {
  if (valeur === null || valeur === undefined || valeur === '') return null;
  if (valeur instanceof Date) {
    const a = valeur.getUTCFullYear();
    const m = String(valeur.getUTCMonth() + 1).padStart(2, '0');
    const j = String(valeur.getUTCDate()).padStart(2, '0');
    return `${a}-${m}-${j}`;
  }
  if (typeof valeur === 'object' && 'result' in (valeur as object)) {
    return dateCellule((valeur as { result: ValeurCellule }).result);
  }
  const t = texteBrut(valeur);
  if (!t) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(t);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const fr = /^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/.exec(t);
  if (fr) return `${fr[3]}-${fr[2].padStart(2, '0')}-${fr[1].padStart(2, '0')}`;
  return null;
}

/** Heure au format « HH:MM ». Gere les heures Excel (Date ou fraction de jour). */
function heureCellule(valeur: ValeurCellule): string | null {
  if (valeur === null || valeur === undefined || valeur === '') return null;
  if (valeur instanceof Date) {
    const h = String(valeur.getUTCHours()).padStart(2, '0');
    const m = String(valeur.getUTCMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }
  if (typeof valeur === 'number') {
    // Excel stocke une heure comme une fraction de journee.
    const fraction = valeur - Math.floor(valeur);
    const total = Math.round(fraction * 24 * 60);
    const h = String(Math.floor(total / 60) % 24).padStart(2, '0');
    const m = String(total % 60).padStart(2, '0');
    return `${h}:${m}`;
  }
  if (typeof valeur === 'object' && 'result' in (valeur as object)) {
    return heureCellule((valeur as { result: ValeurCellule }).result);
  }
  const t = texteBrut(valeur);
  if (!t) return null;
  const m = /(\d{1,2}):(\d{2})/.exec(t);
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : null;
}

function ouiNonCellule(valeur: ValeurCellule): boolean {
  const t = (texteBrut(valeur) ?? '').toLowerCase();
  return t === 'oui' || t === 'yes' || t === 'true' || t === '1' || t === 'o';
}

/* ------------------------------------------------------------------ */
/* Reperage des colonnes par intitule                                  */
/* ------------------------------------------------------------------ */

function normaliser(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

type CarteColonnes = Map<string, number>;

/**
 * Construit la correspondance « intitule normalise -> numero de colonne »
 * a partir de la ligne d'en-tete.
 */
function lireEnTetes(feuille: ExcelJS.Worksheet, ligneEnTete: number): CarteColonnes {
  const carte: CarteColonnes = new Map();
  const ligne = feuille.getRow(ligneEnTete);
  ligne.eachCell({ includeEmpty: false }, (cellule, numero) => {
    const t = texteBrut(cellule.value);
    if (t) carte.set(normaliser(t), numero);
  });
  return carte;
}

/** Trouve la colonne dont l'intitule commence par l'un des libelles donnes. */
function colonne(carte: CarteColonnes, ...libelles: string[]): number | null {
  for (const libelle of libelles) {
    const cle = normaliser(libelle);
    const exact = carte.get(cle);
    if (exact !== undefined) return exact;
    for (const [enTete, numero] of carte) {
      if (enTete.startsWith(cle)) return numero;
    }
  }
  return null;
}

/** Cherche la ligne d'en-tete d'une feuille en reperant un intitule connu. */
function trouverLigneEnTete(feuille: ExcelJS.Worksheet, libelle: string, maxLignes = 12): number {
  const cible = normaliser(libelle);
  for (let i = 1; i <= Math.min(maxLignes, feuille.rowCount); i++) {
    const ligne = feuille.getRow(i);
    let trouve = false;
    ligne.eachCell({ includeEmpty: false }, (cellule) => {
      const t = texteBrut(cellule.value);
      if (t && normaliser(t).startsWith(cible)) trouve = true;
    });
    if (trouve) return i;
  }
  return 1;
}

/** Une ligne marquee EXEMPLE ne doit jamais etre importee. */
function estLigneExemple(ligne: ExcelJS.Row): boolean {
  let exemple = false;
  ligne.eachCell({ includeEmpty: false }, (cellule) => {
    const t = texteBrut(cellule.value);
    if (t && t.includes('EXEMPLE')) exemple = true;
  });
  return exemple;
}

function ligneVide(ligne: ExcelJS.Row): boolean {
  let vide = true;
  ligne.eachCell({ includeEmpty: false }, (cellule) => {
    if (texteBrut(cellule.value) !== null) vide = false;
  });
  return vide;
}

/**
 * Retrouve une feuille d'apres un ou plusieurs noms possibles, en tolerant les
 * accents, la casse et la ponctuation.
 */
function feuille(classeur: ExcelJS.Workbook, ...noms: string[]): ExcelJS.Worksheet | null {
  for (const nom of noms) {
    const cible = normaliser(nom);
    for (const f of classeur.worksheets) {
      if (normaliser(f.name) === cible) return f;
    }
    for (const f of classeur.worksheets) {
      if (normaliser(f.name).startsWith(cible)) return f;
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Import                                                             */
/* ------------------------------------------------------------------ */

export async function importerClasseur(
  db: BaseDonnees,
  chemin: string,
  options: { remplacer?: boolean } = {},
): Promise<ResultatImport> {
  const classeur = await lireClasseur(chemin);

  const resultat: ResultatImport = {
    fichier: chemin,
    reglages: { fraisCpm: null, tauxEurParUsd: null, objectifMensuelEur: null },
    campagnes: 0,
    comptes: 0,
    relevesAbonnes: 0,
    clips: 0,
    paiements: 0,
    taches: 0,
    lignesExempleIgnorees: 0,
    avertissements: [],
  };

  const tout = db.transaction(() => {
    if (options.remplacer) {
      db.exec(
        'DELETE FROM pieces_jointes; DELETE FROM clips; DELETE FROM paiements; DELETE FROM abonnes_historique; DELETE FROM comptes; DELETE FROM campagnes; DELETE FROM taches;',
      );
    }

    importerReglages(db, classeur, resultat);
    importerCampagnes(db, classeur, resultat);
    importerComptes(db, classeur, resultat);
    importerClips(db, classeur, resultat);
    importerPaiements(db, classeur, resultat);
    importerTaches(db, classeur, resultat);
  });

  tout();
  return resultat;
}

function importerReglages(db: BaseDonnees, classeur: ExcelJS.Workbook, resultat: ResultatImport): void {
  const f = feuille(classeur, 'Tableau de bord');
  if (!f) {
    resultat.avertissements.push("Onglet « Tableau de bord » absent : les reglages par defaut sont conserves.");
    return;
  }

  // Les trois parametres sont dans la colonne B, reperes par leur libelle en colonne A.
  const valeurApresLibelle = (...libelles: string[]): number | null => {
    for (let i = 1; i <= Math.min(40, f.rowCount); i++) {
      const libelle = texteBrut(f.getRow(i).getCell(1).value);
      if (!libelle) continue;
      const n = normaliser(libelle);
      if (libelles.some((l) => n.startsWith(normaliser(l)))) {
        return nombreCellule(f.getRow(i).getCell(2).value);
      }
    }
    return null;
  };

  const frais = valeurApresLibelle('Frais Content Rewards');
  const taux = valeurApresLibelle('Taux de change par defaut', 'Taux de change');
  const objectif = valeurApresLibelle('Objectif mensuel');

  resultat.reglages = { fraisCpm: frais, tauxEurParUsd: taux, objectifMensuelEur: objectif };

  const aEcrire: Record<string, number> = {};
  if (frais !== null) aEcrire.fraisCpm = frais > 1 ? frais / 100 : frais; // « 10 » comme « 0,1 »
  if (taux !== null) aEcrire.tauxEurParUsd = taux;
  if (objectif !== null) aEcrire.objectifMensuelEur = objectif;
  if (Object.keys(aEcrire).length > 0) ecrireReglages(db, aEcrire);
}

function importerCampagnes(db: BaseDonnees, classeur: ExcelJS.Workbook, resultat: ResultatImport): void {
  const f = feuille(classeur, 'Campagnes');
  if (!f) {
    resultat.avertissements.push("Onglet « Campagnes » absent.");
    return;
  }
  const ligneEnTete = trouverLigneEnTete(f, 'ID campagne');
  const c = lireEnTetes(f, ligneEnTete);

  const col = {
    id: colonne(c, 'ID campagne'),
    nom: colonne(c, 'Nom de la campagne', 'Nom'),
    organisateur: colonne(c, 'Organisateur'),
    plateformeCampagne: colonne(c, 'Plateforme de campagne'),
    lien: colonne(c, 'Lien de la campagne', 'Lien'),
    type: colonne(c, 'Type'),
    cpm: colonne(c, 'CPM'),
    paiementMin: colonne(c, 'Paiement min'),
    plafond: colonne(c, 'Plafond par clip'),
    budget: colonne(c, 'Budget total'),
    plateformesEligibles: colonne(c, 'Plateformes eligibles'),
    audience: colonne(c, 'Audience exigee'),
    langue: colonne(c, 'Langue'),
    hashtag: colonne(c, 'Hashtag / mention obligatoire', 'Hashtag'),
    delai: colonne(c, 'Delai de soumission'),
    dateLimite: colonne(c, 'Date limite'),
    statut: colonne(c, 'Statut'),
    verifieLe: colonne(c, 'Verifie le'),
    regles: colonne(c, 'Regles cles'),
  };

  if (col.id === null) {
    resultat.avertissements.push("Colonne « ID campagne » introuvable : aucune campagne importee.");
    return;
  }

  const inserer = db.prepare(`
    INSERT INTO campagnes (id, nom, organisateur, plateforme_campagne, lien, type, cpm, paiement_min,
      plafond_par_clip, budget_total, plateformes_eligibles, audience_exigee, langue,
      hashtag_obligatoire, delai_soumission_min, date_limite, statut, verifie_le, regles_cles)
    VALUES (@id, @nom, @organisateur, @plateformeCampagne, @lien, @type, @cpm, @paiementMin,
      @plafond, @budget, @plateformesEligibles, @audience, @langue,
      @hashtag, @delai, @dateLimite, @statut, @verifieLe, @regles)
    ON CONFLICT(id) DO NOTHING
  `);

  for (let i = ligneEnTete + 1; i <= f.rowCount; i++) {
    const ligne = f.getRow(i);
    if (ligneVide(ligne)) continue;
    if (estLigneExemple(ligne)) {
      resultat.lignesExempleIgnorees++;
      continue;
    }
    const cel = (numero: number | null): ValeurCellule => (numero === null ? null : ligne.getCell(numero).value);
    const id = texteBrut(cel(col.id));
    if (!id) continue;

    inserer.run({
      id,
      nom: texteBrut(cel(col.nom)) ?? id,
      organisateur: texteBrut(cel(col.organisateur)),
      plateformeCampagne: texteBrut(cel(col.plateformeCampagne)),
      lien: texteBrut(cel(col.lien)),
      type: texteBrut(cel(col.type)) ?? 'CPM',
      cpm: nombreCellule(cel(col.cpm)),
      paiementMin: nombreCellule(cel(col.paiementMin)),
      plafond: nombreCellule(cel(col.plafond)),
      budget: nombreCellule(cel(col.budget)),
      plateformesEligibles: texteBrut(cel(col.plateformesEligibles)),
      audience: texteBrut(cel(col.audience)),
      langue: texteBrut(cel(col.langue)),
      hashtag: texteBrut(cel(col.hashtag)),
      delai: nombreCellule(cel(col.delai)),
      dateLimite: dateCellule(cel(col.dateLimite)),
      statut: texteBrut(cel(col.statut)),
      verifieLe: dateCellule(cel(col.verifieLe)),
      regles: texteBrut(cel(col.regles)),
    });
    resultat.campagnes++;
  }
}

function importerComptes(db: BaseDonnees, classeur: ExcelJS.Workbook, resultat: ResultatImport): void {
  const f = feuille(classeur, 'Comptes');
  if (!f) {
    resultat.avertissements.push("Onglet « Comptes » absent.");
    return;
  }
  const ligneEnTete = trouverLigneEnTete(f, 'Identifiant');
  const c = lireEnTetes(f, ligneEnTete);

  const col = {
    identifiant: colonne(c, 'Identifiant'),
    nomAffiche: colonne(c, 'Nom affiche'),
    plateforme: colonne(c, 'Plateforme'),
    niche: colonne(c, 'Niche'),
    langue: colonne(c, 'Langue'),
    pays: colonne(c, 'Configuration pays'),
    dateCreation: colonne(c, 'Date de creation'),
    abonnes: colonne(c, 'Abonnes'),
    abonnesMaj: colonne(c, 'Abonnes mis a jour le'),
    relie: colonne(c, 'Relie a Content Rewards'),
    audience: colonne(c, 'Audience principale'),
    notes: colonne(c, 'Notes'),
  };

  if (col.identifiant === null) {
    resultat.avertissements.push("Colonne « Identifiant » introuvable : aucun compte importe.");
    return;
  }

  const inserer = db.prepare(`
    INSERT INTO comptes (identifiant, nom_affiche, plateforme, niche, langue, configuration_pays,
      date_creation, relie_content_rewards, audience_principale, notes)
    VALUES (@identifiant, @nomAffiche, @plateforme, @niche, @langue, @pays,
      @dateCreation, @relie, @audience, @notes)
    ON CONFLICT(identifiant) DO NOTHING
  `);
  const insererAbonnes = db.prepare(
    'INSERT INTO abonnes_historique (compte_id, date, abonnes) VALUES (?, ?, ?)',
  );

  for (let i = ligneEnTete + 1; i <= f.rowCount; i++) {
    const ligne = f.getRow(i);
    if (ligneVide(ligne)) continue;
    if (estLigneExemple(ligne)) {
      resultat.lignesExempleIgnorees++;
      continue;
    }
    const cel = (numero: number | null): ValeurCellule => (numero === null ? null : ligne.getCell(numero).value);
    const identifiant = texteBrut(cel(col.identifiant));
    if (!identifiant) continue;

    const info = inserer.run({
      identifiant,
      nomAffiche: texteBrut(cel(col.nomAffiche)),
      plateforme: texteBrut(cel(col.plateforme)),
      niche: texteBrut(cel(col.niche)),
      langue: texteBrut(cel(col.langue)),
      pays: texteBrut(cel(col.pays)),
      dateCreation: dateCellule(cel(col.dateCreation)),
      relie: ouiNonCellule(cel(col.relie)) ? 1 : 0,
      audience: texteBrut(cel(col.audience)),
      notes: texteBrut(cel(col.notes)),
    });
    if (info.changes === 0) continue;
    resultat.comptes++;

    // L'historique d'abonnes demarre avec le releve present dans le fichier.
    const abonnes = nombreCellule(cel(col.abonnes));
    if (abonnes !== null) {
      const date =
        dateCellule(cel(col.abonnesMaj)) ?? new Date().toISOString().slice(0, 10);
      insererAbonnes.run(Number(info.lastInsertRowid), date, Math.round(abonnes));
      resultat.relevesAbonnes++;
    }
  }
}

function importerClips(db: BaseDonnees, classeur: ExcelJS.Workbook, resultat: ResultatImport): void {
  const f = feuille(classeur, 'Clips');
  if (!f) {
    resultat.avertissements.push("Onglet « Clips » absent.");
    return;
  }
  const ligneEnTete = trouverLigneEnTete(f, 'Date de publication');
  const c = lireEnTetes(f, ligneEnTete);

  const col = {
    datePublication: colonne(c, 'Date de publication'),
    heurePublication: colonne(c, 'Heure de publication'),
    heureSoumission: colonne(c, 'Heure de soumission'),
    compte: colonne(c, 'Compte'),
    plateforme: colonne(c, 'Plateforme'),
    campagneId: colonne(c, 'ID campagne'),
    createur: colonne(c, 'Createur / streamer', 'Createur'),
    lienPublication: colonne(c, 'Lien de la publication'),
    lienSource: colonne(c, 'Lien de la source'),
    vuesJ3: colonne(c, 'Vues a J 3', 'Vues a J+3'),
    vuesFinales: colonne(c, 'Vues finales comptees', 'Vues finales'),
    statut: colonne(c, 'Statut'),
    motifRefus: colonne(c, 'Motif de refus'),
    capture: colonne(c, 'Capture des stats'),
    notes: colonne(c, 'Notes'),
  };

  const comptes = new Map(
    (db.prepare('SELECT id, identifiant FROM comptes').all() as Array<{ id: number; identifiant: string }>).map(
      (c2) => [c2.identifiant.toLowerCase(), c2.id],
    ),
  );
  const campagnes = new Set(
    (db.prepare('SELECT id FROM campagnes').all() as Array<{ id: string }>).map((c2) => c2.id),
  );

  const inserer = db.prepare(`
    INSERT INTO clips (date_publication, heure_publication, heure_soumission, compte_id, plateforme,
      campagne_id, createur, lien_publication, lien_source, vues_j3, vues_finales, statut,
      motif_refus, notes)
    VALUES (@datePublication, @heurePublication, @heureSoumission, @compteId, @plateforme,
      @campagneId, @createur, @lienPublication, @lienSource, @vuesJ3, @vuesFinales, @statut,
      @motifRefus, @notes)
  `);

  for (let i = ligneEnTete + 1; i <= f.rowCount; i++) {
    const ligne = f.getRow(i);
    if (ligneVide(ligne)) continue;
    if (estLigneExemple(ligne)) {
      resultat.lignesExempleIgnorees++;
      continue;
    }
    const cel = (numero: number | null): ValeurCellule => (numero === null ? null : ligne.getCell(numero).value);

    const identifiantCompte = texteBrut(cel(col.compte));
    const compteId = identifiantCompte ? comptes.get(identifiantCompte.toLowerCase()) ?? null : null;
    if (identifiantCompte && compteId === null) {
      resultat.avertissements.push(
        `Clip ligne ${i} : le compte « ${identifiantCompte} » n'existe pas dans l'onglet Comptes.`,
      );
    }

    const campagneId = texteBrut(cel(col.campagneId));
    if (campagneId && !campagnes.has(campagneId)) {
      resultat.avertissements.push(
        `Clip ligne ${i} : la campagne « ${campagneId} » n'existe pas dans l'onglet Campagnes.`,
      );
    }

    // La colonne « Capture des stats » du classeur ne contient qu'un nom de
    // fichier : on le conserve dans les notes, les images s'ajoutent ensuite
    // dans l'application.
    const capture = texteBrut(cel(col.capture));
    const notesExcel = texteBrut(cel(col.notes));
    const notes = [notesExcel, capture ? `Capture indiquee dans Excel : ${capture}` : null]
      .filter(Boolean)
      .join('\n') || null;

    inserer.run({
      datePublication: dateCellule(cel(col.datePublication)),
      heurePublication: heureCellule(cel(col.heurePublication)),
      heureSoumission: heureCellule(cel(col.heureSoumission)),
      compteId,
      plateforme: texteBrut(cel(col.plateforme)),
      campagneId: campagneId && campagnes.has(campagneId) ? campagneId : null,
      createur: texteBrut(cel(col.createur)),
      lienPublication: texteBrut(cel(col.lienPublication)),
      lienSource: texteBrut(cel(col.lienSource)),
      vuesJ3: nombreCellule(cel(col.vuesJ3)),
      vuesFinales: nombreCellule(cel(col.vuesFinales)),
      statut: texteBrut(cel(col.statut)) ?? 'En attente',
      motifRefus: texteBrut(cel(col.motifRefus)),
      notes,
    });
    resultat.clips++;
  }
}

function importerPaiements(db: BaseDonnees, classeur: ExcelJS.Workbook, resultat: ResultatImport): void {
  const f = feuille(classeur, 'Paiements');
  if (!f) {
    resultat.avertissements.push("Onglet « Paiements » absent.");
    return;
  }
  const ligneEnTete = trouverLigneEnTete(f, 'Date de reception');
  const c = lireEnTetes(f, ligneEnTete);

  const col = {
    date: colonne(c, 'Date de reception'),
    source: colonne(c, 'Source'),
    campagneId: colonne(c, 'ID campagne'),
    brut: colonne(c, 'Montant brut'),
    frais: colonne(c, 'Frais de retrait'),
    taux: colonne(c, 'Taux'),
    moyen: colonne(c, 'Moyen'),
    reference: colonne(c, 'Reference de la transaction', 'Reference'),
    justificatif: colonne(c, 'Justificatif'),
    declare: colonne(c, 'Declare aux impots'),
    notes: colonne(c, 'Notes'),
  };

  const campagnes = new Set(
    (db.prepare('SELECT id FROM campagnes').all() as Array<{ id: string }>).map((c2) => c2.id),
  );

  const inserer = db.prepare(`
    INSERT INTO paiements (date_reception, source, campagne_id, montant_brut, frais_retrait,
      taux_eur_par_usd, moyen, reference, declare_impots, notes)
    VALUES (@date, @source, @campagneId, @brut, @frais, @taux, @moyen, @reference, @declare, @notes)
  `);

  for (let i = ligneEnTete + 1; i <= f.rowCount; i++) {
    const ligne = f.getRow(i);
    if (ligneVide(ligne)) continue;
    if (estLigneExemple(ligne)) {
      resultat.lignesExempleIgnorees++;
      continue;
    }
    const cel = (numero: number | null): ValeurCellule => (numero === null ? null : ligne.getCell(numero).value);

    const campagneId = texteBrut(cel(col.campagneId));
    const justificatif = texteBrut(cel(col.justificatif));
    const notesExcel = texteBrut(cel(col.notes));
    const notes = [notesExcel, justificatif ? `Justificatif indique dans Excel : ${justificatif}` : null]
      .filter(Boolean)
      .join('\n') || null;

    inserer.run({
      date: dateCellule(cel(col.date)),
      source: texteBrut(cel(col.source)),
      campagneId: campagneId && campagnes.has(campagneId) ? campagneId : null,
      brut: nombreCellule(cel(col.brut)) ?? 0,
      frais: nombreCellule(cel(col.frais)) ?? 0,
      taux: nombreCellule(cel(col.taux)),
      moyen: texteBrut(cel(col.moyen)),
      reference: texteBrut(cel(col.reference)),
      declare: ouiNonCellule(cel(col.declare)) ? 1 : 0,
      notes,
    });
    resultat.paiements++;
  }
}

function importerTaches(db: BaseDonnees, classeur: ExcelJS.Workbook, resultat: ResultatImport): void {
  const f = feuille(classeur, 'Checklist de lancement', 'Checklist');
  if (!f) {
    resultat.avertissements.push("Onglet « Checklist de lancement » absent.");
    return;
  }
  const ligneEnTete = trouverLigneEnTete(f, 'Tache');
  const c = lireEnTetes(f, ligneEnTete);

  const col = {
    numero: colonne(c, '#', 'Numero'),
    phase: colonne(c, 'Phase'),
    tache: colonne(c, 'Tache'),
    detail: colonne(c, 'Comment / detail', 'Comment', 'Detail'),
    echeance: colonne(c, 'Echeance'),
    statut: colonne(c, 'Statut'),
    notes: colonne(c, 'Notes'),
  };

  if (col.tache === null) {
    resultat.avertissements.push("Colonne « Tache » introuvable : aucune tache importee.");
    return;
  }

  const inserer = db.prepare(`
    INSERT INTO taches (numero, phase, tache, detail, echeance, statut, notes, ordre)
    VALUES (@numero, @phase, @tache, @detail, @echeance, @statut, @notes, @ordre)
  `);

  let ordre = 0;
  for (let i = ligneEnTete + 1; i <= f.rowCount; i++) {
    const ligne = f.getRow(i);
    if (ligneVide(ligne)) continue;
    if (estLigneExemple(ligne)) {
      resultat.lignesExempleIgnorees++;
      continue;
    }
    const cel = (numero: number | null): ValeurCellule => (numero === null ? null : ligne.getCell(numero).value);
    const tache = texteBrut(cel(col.tache));
    if (!tache) continue;

    const statutBrut = texteBrut(cel(col.statut));
    inserer.run({
      numero: nombreCellule(cel(col.numero)),
      phase: texteBrut(cel(col.phase)),
      tache,
      detail: texteBrut(cel(col.detail)),
      echeance: dateCellule(cel(col.echeance)),
      statut: normaliserStatutTache(statutBrut),
      notes: texteBrut(cel(col.notes)),
      ordre: ordre++,
    });
    resultat.taches++;
  }
}

function normaliserStatutTache(valeur: string | null): string {
  const n = normaliser(valeur ?? '');
  if (n.startsWith('fait') || n.startsWith('termine')) return 'Fait';
  if (n.startsWith('en cours')) return 'En cours';
  return 'À faire';
}
