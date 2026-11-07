/**
 * Fabrication des formes URL.
 *
 * Un slug d’offre est indexé par les moteurs : il ne doit donc jamais changer
 * pour une même offre. D’où la construction en deux parties — libellé lisible
 * + suffixe dérivé de l’identifiant stable de l’offre. Si l’employeur corrige
 * son intitulé, l’ancien lien continue de résoudre (voir `offerIdFromSlug`).
 */

/** Minuscules, sans accent, mots séparés par des tirets. */
export function slugify(text: string, maxWords = 12): string {
  const words = text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);

  return words.slice(0, maxWords).join('-');
}

/**
 * Suffixe court et stable, dérivé de l’identifiant de l’offre.
 *
 * Pas de hachage cryptographique ici : ce suffixe ne protège rien, il
 * désambiguïse. Une fonction pure et sans dépendance a l’avantage de tourner
 * à l’identique côté serveur, dans les tests et dans un script.
 */
export function shortCode(input: string): string {
  // FNV-1a 32 bits, deux passes avec des graines différentes pour obtenir
  // 8 caractères sans augmenter la probabilité de collision d’un simple 32 bits.
  const h1 = fnv1a(input, 0x811c9dc5);
  const h2 = fnv1a(input, 0x01000193);
  return (h1.toString(36) + h2.toString(36)).replace(/[^a-z0-9]/g, '').slice(0, 8).padEnd(8, '0');
}

function fnv1a(input: string, seed: number): number {
  let hash = seed >>> 0;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/**
 * Slug complet d’une offre : `<intitulé>-<ville>-<code>`.
 *
 * Le code final est la seule partie qui compte pour la résolution.
 */
export function offerSlug(input: { id: string; title: string; city: string | null }): string {
  const parts = [slugify(input.title, 10)];
  if (input.city) parts.push(slugify(input.city, 4));
  const base = parts.filter((p) => p.length > 0).join('-');
  const code = shortCode(input.id);
  return base.length > 0 ? `${base}-${code}` : code;
}

/**
 * Extrait le code court d’un slug d’offre.
 *
 * Permet de retrouver une offre même si son intitulé a changé depuis
 * l’indexation du lien : seul le suffixe est comparé.
 */
export function slugCode(slug: string): string | null {
  const match = /([a-z0-9]{8})$/.exec(slug);
  return match?.[1] ?? null;
}
