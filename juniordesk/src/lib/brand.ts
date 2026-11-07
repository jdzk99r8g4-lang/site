/**
 * Identité du site et — surtout — périmètre annoncé.
 *
 * `scope` n’est pas cosmétique. JuniorDesk vise à terme les stages, les
 * alternances et les postes juniors, mais une seule source est branchée
 * aujourd’hui et elle ne contient que de l’alternance. Tant que c’est le cas,
 * chaque titre, chaque description et chaque page SEO doivent dire
 * « alternance » et rien de plus : annoncer des stages qu’on n’a pas, c’est
 * faire venir des étudiants pour rien.
 *
 * Quand une source de stages sera branchée, il suffira de modifier ce bloc.
 * `tests/scope.test.ts` vérifie que le périmètre annoncé correspond bien aux
 * types de contrat que les sources actives savent produire.
 */

export const brand = {
  name: 'JuniorDesk',
  tagline: 'L’alternance en finance, rassemblée en un seul endroit.',
  pitch:
    'Toutes les offres d’alternance en banque, assurance, gestion d’actifs, ' +
    'audit et contrôle de gestion, collectées automatiquement chaque jour. ' +
    'Gratuit, sans compte, et sans candidature à passer par nous : on vous ' +
    'envoie directement chez l’employeur.',
  domain: 'juniordesk.fr',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  locale: 'fr-FR',
  country: 'FR',

  email: {
    contact: 'contact@example.org',
    /** Expéditeur vérifié chez Resend. Doit être un domaine dont vous avez les DNS. */
    from: process.env.EMAIL_FROM ?? 'JuniorDesk <alertes@example.org>',
  },

  /** Périmètre réellement couvert, affiché tel quel aux visiteurs. */
  scope: {
    label: 'Alternance uniquement',
    detail:
      'Apprentissage et professionnalisation. Les stages et les postes juniors ' +
      'ne sont pas encore couverts : la source publique qui les diffusait n’est ' +
      'plus ouverte, et nous ne publierons pas d’offres que nous ne pouvons pas ' +
      'collecter.',
  },

  /** Promesses affichées. Elles doivent rester littéralement vraies. */
  promises: [
    { title: 'Gratuit, sans compte', detail: 'Aucun abonnement, aucune option payante' },
    { title: 'Mis à jour chaque jour', detail: 'Collecte automatique, offres expirées retirées' },
    { title: 'Candidature chez l’employeur', detail: 'Nous ne nous interposons pas, nous redirigeons' },
    { title: 'Aucun traceur', detail: 'Pas de cookie, donc pas de bannière à cliquer' },
  ],
} as const;

export type Brand = typeof brand;
