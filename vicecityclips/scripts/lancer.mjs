// Lance ViceCityClips : un seul processus, un seul port, une seule adresse.
//
//   1. compile l'interface dans le dossier « dist »
//   2. demarre le serveur, qui sert a la fois l'interface et les donnees
//   3. affiche l'adresse a ouvrir sur l'iPhone
//
// Utilise par « npm run dev » et par « lancer.command ».

import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT_API ?? 4317);

/* ------------------------------------------------------------------ */

function binaire(nom) {
  const chemin = path.join(RACINE, 'node_modules', '.bin', nom);
  return fs.existsSync(chemin) ? chemin : null;
}

function verifierInstallation() {
  const manquants = ['tsx', 'vite'].filter((nom) => binaire(nom) === null);
  if (manquants.length === 0) return true;

  console.error('');
  console.error("  Les composants de l'application ne sont pas installes.");
  console.error('');
  console.error('  Ouvrez le Terminal dans ce dossier et lancez :');
  console.error('');
  console.error('      npm install');
  console.error('');
  console.error("  Puis relancez l'application.");
  console.error('');
  return false;
}

/** Compile l'interface. Resout a true si la compilation a reussi. */
function compilerInterface() {
  return new Promise((resoudre) => {
    process.stdout.write("  Preparation de l'interface… ");
    const debut = Date.now();
    const enfant = spawn(binaire('vite'), ['build', '--logLevel', 'error'], {
      cwd: RACINE,
      stdio: ['ignore', 'ignore', 'pipe'],
    });

    let erreurs = '';
    enfant.stderr.on('data', (donnees) => {
      erreurs += donnees.toString();
    });

    enfant.on('error', () => resoudre(false));
    enfant.on('exit', (code) => {
      if (code === 0) {
        console.log(`fait (${((Date.now() - debut) / 1000).toFixed(1)} s)`);
        resoudre(true);
      } else {
        console.log('echec');
        console.error('');
        console.error(erreurs.trim());
        console.error('');
        resoudre(false);
      }
    });
  });
}

/**
 * Attend que le serveur reponde, puis renvoie son etat (dont les adresses
 * reseau a proposer). Renvoie null si le serveur n'a jamais repondu.
 */
async function attendreServeur(tentatives = 60) {
  for (let i = 0; i < tentatives; i++) {
    try {
      const reponse = await fetch(`http://127.0.0.1:${PORT}/api/etat`);
      if (reponse.ok) return await reponse.json();
    } catch {
      /* pas encore pret */
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  return null;
}

function banniere(adresses) {
  const lignes = ['', '  ViceCityClips', '  ' + '─'.repeat(46), ''];

  if (adresses.length > 0) {
    lignes.push("  Sur votre iPhone (meme Wi-Fi), ouvrez Safari et tapez :", '');
    lignes.push(`      http://${adresses[0].adresse}:${PORT}`, '');

    if (adresses.length > 1) {
      lignes.push(
        "  Si cette adresse ne donne rien, votre Mac en a d'autres.",
        '  Essayez dans l\'ordre :',
        '',
        ...adresses.slice(1).map((a) => `      http://${a.adresse}:${PORT}      (${a.nom})`),
        '',
      );
    }

    lignes.push(
      "  Puis bouton Partager  →  « Sur l'ecran d'accueil »",
      "  pour l'avoir comme une vraie application.",
      '',
      `  Sur ce Mac : http://localhost:${PORT}`,
      '',
      "  Si l'iPhone n'affiche rien : macOS a pu demander d'autoriser",
      '  « node » a recevoir des connexions. En cas de refus, allez dans',
      '  Reglages Systeme → Reseau → Pare-feu → Options, ou double-cliquez',
      '  sur verifier-reseau.command dans ce dossier : il vous dira pourquoi.',
      '',
    );
  } else {
    lignes.push(
      `  Sur ce Mac : http://localhost:${PORT}`,
      '',
      '  Aucune adresse reseau trouvee : activez le Wi-Fi, puis relancez',
      "  pour pouvoir ouvrir l'application depuis l'iPhone.",
      '',
    );
  }

  lignes.push(
    '  Vos donnees restent dans ce dossier :',
    `      ${RACINE}`,
    '',
    '  Pour arreter : Ctrl + C, ou fermez cette fenetre.',
    '',
  );

  console.log(lignes.join('\n'));
}

/* ------------------------------------------------------------------ */

if (!verifierInstallation()) {
  process.exitCode = 1;
} else if (!(await compilerInterface())) {
  console.error("  L'interface n'a pas pu etre preparee : l'application ne demarre pas.");
  process.exitCode = 1;
} else {
  const serveur = spawn(binaire('tsx'), ['server/index.ts'], {
    cwd: RACINE,
    stdio: ['inherit', 'inherit', 'inherit'],
    env: { ...process.env, PORT_API: String(PORT) },
  });

  let arretEnCours = false;
  const arreter = (code = 0) => {
    if (arretEnCours) return;
    arretEnCours = true;
    if (!serveur.killed) serveur.kill('SIGTERM');
    process.exitCode = code;
  };

  serveur.on('error', (erreur) => {
    console.error(`  Impossible de demarrer le serveur : ${erreur.message}`);
    arreter(1);
  });
  serveur.on('exit', (code) => {
    if (code !== 0 && code !== null && !arretEnCours) arreter(code);
  });

  process.on('SIGINT', () => {
    console.log('\n  Arret de ViceCityClips…\n');
    arreter(0);
  });
  process.on('SIGTERM', () => arreter(0));

  const etat = await attendreServeur();
  if (etat) banniere(etat.adresses ?? []);
}
