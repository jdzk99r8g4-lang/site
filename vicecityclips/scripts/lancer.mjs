// Lance les deux morceaux de l'application et affiche les adresses a ouvrir.
//
//   - le serveur de donnees (Node + SQLite) sur le port 4317
//   - l'interface (Vite) sur le port 5173, visible sur le reseau local
//
// Utilise par « npm run dev » et par « lancer.command ».

import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT_API = 4317;
const PORT_WEB = 5173;

/* ------------------------------------------------------------------ */

function adresseReseauLocal() {
  const interfaces = os.networkInterfaces();
  // On prefere une interface Wi-Fi (en0 sur Mac), puis n'importe quelle
  // adresse IPv4 qui n'est pas celle de la machine elle-meme.
  const ordre = ['en0', 'en1', 'eth0', 'wlan0'];
  const candidates = [];

  for (const [nom, liste] of Object.entries(interfaces)) {
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
  console.error("  Les dependances de l'application ne sont pas installees.");
  console.error('');
  console.error('  Ouvrez le Terminal dans ce dossier et lancez :');
  console.error('');
  console.error('      npm install');
  console.error('');
  console.error('  Puis relancez l\'application.');
  console.error('');
  return false;
}

function banniere(ip) {
  const fichierExcel = fs
    .readdirSync(RACINE)
    .find((nom) => nom.toLowerCase().endsWith('.xlsx') && !nom.startsWith('~$'));
  const baseExiste = fs.existsSync(path.join(RACINE, 'vicecityclips.db'));

  const lignes = [
    '',
    '  ViceCityClips — tableau de pilotage',
    '  ' + '─'.repeat(52),
    '',
    '  Sur cet ordinateur :',
    `      http://localhost:${PORT_WEB}`,
    '',
  ];

  if (ip) {
    lignes.push(
      '  Depuis votre iPhone (meme Wi-Fi) :',
      `      http://${ip}:${PORT_WEB}`,
      '',
      '  Astuce : sur iPhone, bouton Partager puis « Sur l\'ecran d\'accueil »',
      "  pour l'ouvrir comme une application.",
      '',
    );
  } else {
    lignes.push(
      '  Adresse reseau local introuvable : verifiez que le Wi-Fi est actif',
      "  si vous voulez ouvrir l'application depuis l'iPhone.",
      '',
    );
  }

  if (!baseExiste) {
    lignes.push(
      fichierExcel
        ? `  Premier lancement : le contenu de « ${fichierExcel} » va etre importe.`
        : '  Premier lancement : aucun fichier .xlsx dans ce dossier, la base',
      fichierExcel ? '' : '  demarrera vide (vous pourrez tout saisir dans l\'application).',
      '',
    );
  }

  lignes.push('  Vos donnees restent dans ce dossier :', `      ${RACINE}`, '');
  lignes.push("  Pour arreter l'application : Ctrl + C, ou fermez cette fenetre.", '');

  console.log(lignes.filter((l) => l !== undefined).join('\n'));
}

/* ------------------------------------------------------------------ */

if (!verifierInstallation()) {
  process.exitCode = 1;
} else {
  const ip = adresseReseauLocal();
  const processus = [];

  const lancer = (nom, commande, args, env = {}) => {
    const enfant = spawn(commande, args, {
      cwd: RACINE,
      stdio: 'inherit',
      env: { ...process.env, ...env },
    });
    enfant.on('error', (erreur) => {
      console.error(`  Impossible de lancer ${nom} : ${erreur.message}`);
      arreter(1);
    });
    enfant.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`  ${nom} s'est arrete (code ${code}).`);
        arreter(code);
      }
    });
    processus.push(enfant);
    return enfant;
  };

  let arretEnCours = false;
  const arreter = (code = 0) => {
    if (arretEnCours) return;
    arretEnCours = true;
    for (const enfant of processus) {
      if (!enfant.killed) enfant.kill('SIGTERM');
    }
    process.exitCode = code;
  };

  process.on('SIGINT', () => {
    console.log('\n  Arret de ViceCityClips…\n');
    arreter(0);
  });
  process.on('SIGTERM', () => arreter(0));

  lancer('le serveur de donnees', binaire('tsx'), ['watch', '--clear-screen=false', 'server/index.ts'], {
    PORT_API: String(PORT_API),
  });

  lancer('l\'interface', binaire('vite'), ['--host', '--port', String(PORT_WEB)]);

  // La banniere s'affiche apres le demarrage de Vite, pour rester visible.
  setTimeout(() => banniere(ip), 1800);
}
