/**
 * Génère les deux moitiés du catalogue de visuels distants.
 *
 * Usage : npm run media:remote
 *
 * POURQUOI DEUX FICHIERS, ET NON UN.
 *
 * Les visuels relevés vivent sur le CDN d'une place de marché. On veut les
 * afficher, mais on ne veut pas que leur adresse apparaisse dans la page :
 * notre site doit être la seule source visible, et un visiteur ne doit pas
 * pouvoir cliquer vers ailleurs depuis une de nos fiches.
 *
 * La séparation est donc la même que pour les prix d'achat :
 *
 *   media-remote.generated.ts    COMBIEN de visuels par produit. Anodin, donc
 *                                importable par un composant client.
 *   media-remote-sources.ts      VERS QUOI ils pointent. Serveur uniquement,
 *                                protégé par la garde d'exécution et par
 *                                `tests/leakage.test.ts`.
 *
 * Le navigateur ne reçoit que `/api/media/<id-produit>/<n>`. C'est la route
 * d'API qui fait la correspondance, côté serveur, et renvoie les octets.
 * L'adresse d'origine n'est jamais sérialisée dans le HTML.
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { products } from '../src/lib/catalog';

const RELEVES = join(process.cwd(), 'data', 'releves');
const SORTIE_COMPTES = join(process.cwd(), 'src', 'lib', 'media-remote.generated.ts');
const SORTIE_SOURCES = join(process.cwd(), 'src', 'lib', 'media-remote-sources.ts');

/** Hôtes autorisés. Une URL hors de cette liste n'est pas référencée. */
const HOTES = new Set(['cdn.manomano.com']);

interface Reference {
  retenu_catalogue?: string;
  imageSource?: string;
  images?: string[];
}

function references(): Reference[] {
  if (!existsSync(RELEVES)) return [];
  const out: Reference[] = [];
  for (const fichier of readdirSync(RELEVES).filter((f) => f.endsWith('.json'))) {
    const data: unknown = JSON.parse(readFileSync(join(RELEVES, fichier), 'utf8'));
    if (typeof data !== 'object' || data === null) continue;
    for (const [cle, valeur] of Object.entries(data)) {
      if (cle.startsWith('_') || !Array.isArray(valeur)) continue;
      out.push(...(valeur as Reference[]));
    }
  }
  return out;
}

const connus = new Set(products.map((p) => p.id));
const parProduit: Record<string, string[]> = {};
const ignorees: string[] = [];

for (const ref of references()) {
  const id = ref.retenu_catalogue;
  if (!id || !connus.has(id)) continue;

  // `imageSource` est le visuel de la page de liste ; `images` celui des
  // fiches, plus nombreux et en meilleure résolution. On prend les deux, les
  // fiches d'abord.
  const brutes = [...(ref.images ?? []), ...(ref.imageSource ? [ref.imageSource] : [])];
  for (const brute of brutes) {
    let hote: string;
    try {
      hote = new URL(brute).hostname;
    } catch {
      ignorees.push(brute);
      continue;
    }
    if (!HOTES.has(hote)) {
      ignorees.push(brute);
      continue;
    }
    const liste = (parProduit[id] ??= []);
    if (!liste.includes(brute)) liste.push(brute);
  }
}

const ids = Object.keys(parProduit).sort();

const EN_TETE = `/**
 * FICHIER GÉNÉRÉ — ne pas éditer à la main.
 *
 * Produit par \`npm run media:remote\` à partir de \`data/releves/*.json\`.
 */
`;

writeFileSync(
  SORTIE_COMPTES,
  `${EN_TETE}
/**
 * Nombre de visuels distants par produit.
 *
 * Ce fichier ne porte AUCUNE adresse : il est donc importable par un
 * composant client sans rien divulguer. Les adresses sont dans
 * \`media-remote-sources.ts\`, qui ne s'importe que côté serveur.
 */
export const remoteMediaCount: Record<string, number> = ${
    ids.length === 0
      ? '{}'
      : `{\n${ids.map((id) => `  '${id}': ${parProduit[id]!.length},`).join('\n')}\n}`
  };
`,
  'utf8',
);

writeFileSync(
  SORTIE_SOURCES,
  `${EN_TETE}
/**
 * Adresses d'origine des visuels distants — SERVEUR UNIQUEMENT.
 *
 * Elles ne doivent jamais arriver dans le bundle navigateur : notre site est
 * la seule source visible d'une fiche produit, et une adresse sérialisée dans
 * le HTML serait un lien cliquable vers ailleurs.
 *
 * Deux protections se cumulent, comme pour \`sourcing.ts\` :
 *   1. la garde d'exécution ci-dessous ;
 *   2. \`tests/leakage.test.ts\`, qui refuse cet import depuis un composant
 *      client.
 */

if (typeof window !== 'undefined') {
  throw new Error(
    'media-remote-sources.ts a été importé côté client : les adresses du CDN ' +
      'fuiraient dans le HTML. Passez par /api/media/<id>/<n>.',
  );
}

export const remoteMediaSources: Record<string, readonly string[]> = ${
    ids.length === 0
      ? '{}'
      : `{\n${ids
          .map(
            (id) =>
              `  '${id}': [\n${parProduit[id]!.map((u) => `    '${u}',`).join('\n')}\n  ],`,
          )
          .join('\n')}\n}`
  };

/** Adresse d'un visuel, ou \`null\` si la position n'existe pas. */
export function remoteMediaUrl(productId: string, position: number): string | null {
  const liste = remoteMediaSources[productId];
  if (!liste || position < 1 || position > liste.length) return null;
  return liste[position - 1] ?? null;
}
`,
  'utf8',
);

const total = ids.reduce((n, id) => n + parProduit[id]!.length, 0);
console.log(`[media distants] ${total} visuel(s) pour ${ids.length} produit(s) sur ${connus.size}.`);
for (const id of ids) console.log(`[media distants]   ${id} : ${parProduit[id]!.length}`);
if (ignorees.length > 0) {
  console.warn(
    `[media distants] ${ignorees.length} adresse(s) ignorée(s) : hôte non autorisé. ` +
      `Hôtes acceptés : ${[...HOTES].join(', ')}`,
  );
}
const sans = [...connus].filter((id) => !parProduit[id]);
if (sans.length > 0) console.log(`[media distants] sans visuel distant : ${sans.join(', ')}`);
