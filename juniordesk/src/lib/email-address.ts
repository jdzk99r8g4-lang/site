/**
 * Adresses e-mail : validation et forme canonique.
 *
 * Module unique, parce que la même logique servait en deux exemplaires — une
 * copie dans `auth.ts`, une autre dans `alerts.ts`. Deux copies d'une règle
 * finissent toujours par diverger.
 */

/**
 * Validation volontairement simple.
 *
 * Aucune expression régulière ne décide correctement si une adresse existe :
 * seule la confirmation par e-mail le fait, et c'est précisément ce que font
 * le double opt-in des alertes et la vérification d'adresse des comptes. On
 * écarte donc le manifestement invalide, et on laisse la confirmation
 * trancher le reste.
 */
export function isPlausibleEmail(email: string): boolean {
  const trimmed = email.trim();
  if (trimmed.length < 6 || trimmed.length > 254) return false;
  if (/\s/.test(trimmed)) return false;

  const parts = trimmed.split('@');
  if (parts.length !== 2) return false;

  const [local, domain] = parts as [string, string];
  if (local.length === 0 || domain.length < 3) return false;
  if (!domain.includes('.')) return false;
  if (domain.startsWith('.') || domain.endsWith('.') || domain.includes('..')) return false;

  return true;
}

/** Domaines dont le serveur ignore les points dans la partie locale. */
const DOT_INSENSITIVE_DOMAINS: ReadonlySet<string> = new Set(['gmail.com', 'googlemail.com']);

/**
 * Forme canonique d'une adresse, utilisée pour l'IDENTITÉ et elle seule.
 *
 * ---------------------------------------------------------------------------
 * Le problème qu'elle règle
 * ---------------------------------------------------------------------------
 * Gmail ignore les points de la partie locale : `p.nom@gmail.com` et
 * `pnom@gmail.com` arrivent dans la même boîte. Sans cette fonction,
 * JuniorDesk en faisait deux comptes distincts. Un étudiant pouvait donc
 * s'inscrire deux fois sans le vouloir, et se retrouver avec ses alertes d'un
 * côté et ses offres enregistrées de l'autre — puis, la fois suivante, se
 * voir répondre « adresse ou mot de passe incorrect » sur son propre compte.
 *
 * Même raisonnement pour le suffixe `+` : `nom+juniordesk@gmail.com` est la
 * boîte de `nom@gmail.com`.
 *
 * ---------------------------------------------------------------------------
 * Ce qu'elle NE fait pas, et pourquoi
 * ---------------------------------------------------------------------------
 * Elle ne s'applique qu'à Gmail. Ailleurs, le suffixe `+` et les points sont
 * parfaitement susceptibles de désigner des boîtes différentes : chez certains
 * hébergeurs, `a.b@domaine.fr` et `ab@domaine.fr` appartiennent à deux
 * personnes. Normaliser partout créerait le problème inverse — fusionner les
 * comptes de deux étudiants — ce qui est bien pire qu'un doublon.
 *
 * iCloud n'est pas concerné : `@icloud.com`, `@me.com` et `@mac.com` peuvent
 * pointer vers le même compte Apple, mais ce sont trois adresses distinctes,
 * et rien ne permet de l'affirmer de l'extérieur.
 *
 * L'adresse canonique sert à dériver l'identifiant de compte. L'adresse
 * STOCKÉE reste celle que la personne a tapée : c'est elle qu'elle reconnaît
 * dans son espace, et c'est à elle qu'on écrit.
 */
export function canonicalizeEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf('@');
  if (at <= 0) return trimmed;

  let local = trimmed.slice(0, at);
  let domain = trimmed.slice(at + 1);

  // googlemail.com est un alias historique de gmail.com.
  if (domain === 'googlemail.com') domain = 'gmail.com';

  if (DOT_INSENSITIVE_DOMAINS.has(domain)) {
    const plus = local.indexOf('+');
    if (plus !== -1) local = local.slice(0, plus);
    local = local.replaceAll('.', '');
    // Une partie locale vide après nettoyage n'est pas une adresse :
    // on rend la chaîne d'origine plutôt que de fabriquer « @gmail.com ».
    if (local.length === 0) return trimmed;
  }

  return `${local}@${domain}`;
}

/** Masque une adresse pour les journaux : `pr****@domaine.fr`. */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  return `${local.slice(0, 2)}${'*'.repeat(Math.max(1, local.length - 2))}@${domain}`;
}
