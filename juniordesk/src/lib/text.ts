/**
 * Petites mises en forme de texte, sans dépendance.
 */

/**
 * Raccourcit un texte à `max` caractères, sans couper un mot.
 *
 * Sert aux descriptions destinées aux moteurs de recherche : au-delà d'environ
 * 160 caractères ils tronquent eux-mêmes, n'importe où. Autant choisir
 * l'endroit.
 */
export function clip(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;

  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  const base = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${base.replace(/[\s,;:.–—-]+$/, '')}…`;
}

/** Première phrase d'un texte, point final compris. */
export function firstSentence(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  const match = /^.*?[.!?](?=\s|$)/.exec(clean);
  return match ? match[0] : clean;
}
