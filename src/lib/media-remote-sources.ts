/**
 * FICHIER GÉNÉRÉ — ne pas éditer à la main.
 *
 * Produit par `npm run media:remote` à partir de `data/releves/*.json`.
 */

/**
 * Adresses d'origine des visuels distants — SERVEUR UNIQUEMENT.
 *
 * Elles ne doivent jamais arriver dans le bundle navigateur : notre site est
 * la seule source visible d'une fiche produit, et une adresse sérialisée dans
 * le HTML serait un lien cliquable vers ailleurs.
 *
 * Deux protections se cumulent, comme pour `sourcing.ts` :
 *   1. la garde d'exécution ci-dessous ;
 *   2. `tests/leakage.test.ts`, qui refuse cet import depuis un composant
 *      client.
 */

if (typeof window !== 'undefined') {
  throw new Error(
    'media-remote-sources.ts a été importé côté client : les adresses du CDN ' +
      'fuiraient dans le HTML. Passez par /api/media/<id>/<n>.',
  );
}

export const remoteMediaSources: Record<string, readonly string[]> = {
  'bio-etna-table': [
    'https://cdn.manomano.com/pim-media/images/medium/7ade0bc7b44414972c3af3e07bb82d6a888c0742.jpg',
  ],
  'bio-homcom-floor': [
    'https://cdn.manomano.com/pim-media/images/medium/aa54340624653980c6f44d59f3a8880302f0294d.jpg',
  ],
  'bio-mauna-loa': [
    'https://cdn.manomano.com/pim-media/images/medium/29ffd3806652b9e9116e2a30774789b1fbacf91d.jpg',
  ],
  'bio-qlima-ffb4242': [
    'https://cdn.manomano.com/pim-media/images/medium/5911128da79997ee09797d3b21e38c389c23b439.jpg',
  ],
  'bio-revello': [
    'https://cdn.manomano.com/pim-media/images/medium/b90db47a45f69a6a6ca947dcff0243c366c7932a.jpg',
  ],
  'bio-siena-wall': [
    'https://cdn.manomano.com/pim-media/images/medium/f97b7c287fd6be06346f20de43133ee7d1a42679.jpg',
  ],
  'elec-homcom-wall': [
    'https://cdn.manomano.com/pim-media/images/medium/0d5f3860445a9f539b1f5e9665ef4c79472dddf2.jpg',
  ],
  'elec-mercatools': [
    'https://cdn.manomano.com/pim-media/images/medium/5692e58daa30da06ca1e9265fbc9b8a3f613f702.jpg',
  ],
  'elec-minesota': [
    'https://cdn.manomano.com/pim-media/images/medium/405cbde1a0f9b313e658f58731bc08b4318b250d.jpg',
  ],
  'elec-orbegozo-cm8000': [
    'https://cdn.manomano.com/pim-media/images/medium/98ddd65f90a670354b2a068828db8f4cf1b63524.jpg',
  ],
  'elec-oregon': [
    'https://cdn.manomano.com/pim-media/images/medium/daa3f508577ff8dd69b2ce451eb0ddf40fd276ad.jpg',
  ],
  'elec-pzcc-121': [
    'https://cdn.manomano.com/pim-media/images/medium/462a1ef3104d9bb8b3cca6fc08656afaff3c2a40.jpg',
  ],
  'elec-vicco-lynea': [
    'https://cdn.manomano.com/pim-media/images/medium/78135c5f955472de66c70fb8ec73dedba4391bd4.jpg',
    'https://cdn.manomano.com/pim-media/images/medium/a984c470900bcb8276ba90b1002abb4ea146f35b.jpg',
  ],
};

/** Adresse d'un visuel, ou `null` si la position n'existe pas. */
export function remoteMediaUrl(productId: string, position: number): string | null {
  const liste = remoteMediaSources[productId];
  if (!liste || position < 1 || position > liste.length) return null;
  return liste[position - 1] ?? null;
}
