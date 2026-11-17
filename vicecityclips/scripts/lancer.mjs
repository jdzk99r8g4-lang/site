// Lance ViceCityClips : un seul processus, un seul port, une seule adresse.
//
//   1. compile l'interface dans le dossier « dist »
//   2. demarre le serveur, qui sert a la fois l'interface et les donnees
//   3. affiche l'adresse a ouvrir sur l'iPhone
//
// Utilise par « npm run dev » et par « lancer.command ».

import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT_API ?? 4317);

/* ------------------------------------------------------------------ */

/** Adresse de ce Mac sur le reseau local : celle a taper sur l'iPhone. */
function adresseReseauLocal() {
  const ordre = ['en0', 'en1', 'eth0', 'wlan0'];
  const candidates = [];

  for (const [nom, liste] of Object.entries(os.networkInterfaces())) {
    for (const details of liste ?? []) {
      if (details.family !== 'IPv4' || details.internal) continue;
      candidates.push({ nom, adresse: details.address });
    }
  }

  candidates.sort((a, b) => {
    const rangA = ordre.indexOf(a.nom);
    const rangB = ordre.indexOf(b.nom);
    return (rangA === -1 ? 99 : rangA) - (rangB === -1 ? 99 : rangB);
  });

  return candidates.length > 0 ? candidates[0].adresse : null;
}

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

/** Attend que le serveur reponde, pour n'afficher l'adresse qu'une fois prete. */
async function attendreServeur(tentatives = 60) {
  for (let i = 0; i < tentatives; i++) {
    try {
      const reponse = await fetch(`http://127.0.0.1:${PORT}/api/etat`);
      if (reponse.ok) return true;
    } catch {
      /* pas encore pret */
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

function banniere(ip) {
  const lignes = [
    '',
    '  ViceCityClips',
    '  ' + '─'.repeat(46),
    '',
  ];

  if (ip) {
    lignes.push(
      "  Sur votre iPhone (meme Wi-Fi), ouvrez Safari et tapez :",
      '',
      `      http://${ip}:${PORT}`,
      '',
      "  Puis bouton Partager  →  « Sur l'ecran d'accueil »",
      "  pour l'avoir comme une vraie application.",
      '',
      `  Sur ce Mac : http://localhost:${PORT}`,
      '',
    );
  } else {
    lignes.push(
      `  Sur ce Mac : http://localhost:${PORT}`,
      '',
      '  Adresse reseau introuvable : activez le Wi-Fi puis relancez',
      "  pour pouvoir ouvrir l'application depuis l'iPhone.",
      '',
    );
  }

  lignes.push(
    '  Vos donnees restent dans ce dossier :',
    `      ${RACINE}`,
    '',
    "  Pour arreter : Ctrl + C, ou fermez cette fenetre.",
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

  if (await attendreServeur()) {
    banniere(adresseReseauLocal());
  }
}
