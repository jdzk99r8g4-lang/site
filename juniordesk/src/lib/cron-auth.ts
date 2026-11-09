/**
 * Autorisation des tâches planifiées.
 *
 * Sans `CRON_SECRET`, ces adresses seraient publiques et déclenchables à
 * volonté : on pourrait épuiser le quota de l'API source, faire repartir des
 * e-mails, ou lancer le ménage en boucle. La comparaison se fait en temps
 * constant, parce qu'une comparaison de chaînes ordinaire s'arrête au premier
 * caractère différent et laisse deviner le secret, octet par octet.
 *
 * Ce contrôle existait en trois copies, une par tâche. Trois copies d'un
 * contrôle de sécurité, c'est deux occasions d'en corriger une et d'oublier
 * les autres.
 *
 * SERVEUR UNIQUEMENT.
 */

import { timingSafeEqual } from 'node:crypto';

export function cronAuthorized(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  /*
   * Pas de secret configuré : on refuse. L'autre choix — tout laisser passer
   * en l'absence de secret — ferait d'un oubli de configuration une porte
   * ouverte, et c'est précisément le jour d'une mise en production qu'on
   * oublie une variable.
   */
  if (!expected) return false;

  const header = request.headers.get('authorization') ?? '';
  const provided = header.replace(/^Bearer\s+/i, '');

  const given = Buffer.from(provided);
  const wanted = Buffer.from(expected);
  // `timingSafeEqual` exige des longueurs égales ; la comparer d'abord ne
  // révèle que la longueur du secret, pas son contenu.
  if (given.length !== wanted.length) return false;
  return timingSafeEqual(given, wanted);
}
