/**
 * Validation de l'adresse de candidature.
 *
 * ---------------------------------------------------------------------------
 * Pourquoi ce fichier existe
 * ---------------------------------------------------------------------------
 * `/go/[id]` redirige le visiteur vers `offer.applyUrl`. Cette adresse ne vient
 * pas de l'URL demandée — ce serait une redirection ouverte, et le code s'en
 * garde explicitement — mais elle vient de la SOURCE, c'est-à-dire d'un tiers
 * qui publie chez La bonne alternance ou chez France Travail.
 *
 * Le contrôle existait, et dans un seul adaptateur : `lba.ts` refusait ce qui
 * n'était pas `http(s)`, `france-travail.ts` acceptait n'importe quelle
 * chaîne. Deux adaptateurs qui font le même métier, un seul qui se protège :
 * c'est la forme habituelle de ce genre de trou, et elle ne se voit qu'en
 * lisant les deux côte à côte.
 *
 * Ce que ce contrôle peut, et ce qu'il ne peut pas : il écarte les schémas
 * d'URL qui ne sont pas du web (`javascript:`, `data:`, `file:`), et les
 * adresses qui renvoient vers nous. Il ne peut RIEN contre une adresse
 * `https://` parfaitement formée qui mène à un site de hameçonnage — aucune
 * expression régulière ne distingue un employeur d'un escroc. La protection
 * contre celui-là est ailleurs : la source est un service public, et le site
 * affiche de qui vient chaque offre.
 */

/**
 * L'adresse est-elle une cible de redirection acceptable ?
 *
 * `siteUrl` permet d'écarter les adresses qui pointent vers JuniorDesk :
 * rediriger vers soi-même ferait au mieux une boucle, au pire un chemin pour
 * faire passer une page du site pour une offre d'employeur.
 */
export function isSafeApplyUrl(value: unknown, siteUrl?: string): value is string {
  if (typeof value !== 'string') return false;

  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return false;
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
  if (!url.hostname) return false;

  if (siteUrl) {
    try {
      const self = new URL(siteUrl);
      if (self.hostname && url.hostname.toLowerCase() === self.hostname.toLowerCase()) {
        return false;
      }
    } catch {
      // Un `siteUrl` illisible ne doit pas faire refuser des offres valides :
      // on perd ce contrôle-là, pas les autres.
    }
  }

  return true;
}
