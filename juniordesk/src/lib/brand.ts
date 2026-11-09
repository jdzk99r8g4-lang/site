/**
 * Identité du site et — surtout — périmètre annoncé.
 *
 * `scope` n’est pas cosmétique, et il sépare deux choses qu’on confond
 * facilement.
 *
 * `mission` dit ce que le site EST : un agrégateur de débuts de carrière en
 * finance — stages, alternances, premiers postes. Cela ne dépend pas des
 * sources branchées un jour donné, et c’est ce que portent le nom du site,
 * sa promesse et sa page d’accueil.
 *
 * `available` dit ce qui est RÉELLEMENT collecté aujourd’hui. Une seule
 * source est branchée et elle ne produit que de l’alternance, la source
 * publique qui diffusait stages et premiers postes n’étant plus ouverte.
 * Cette phrase-là s’affiche partout où un visiteur pourrait croire que le
 * catalogue couvre les trois.
 *
 * Confondre les deux mène à l’une ou l’autre faute : annoncer « alternance
 * uniquement » rend le site incompréhensible pour qui cherche un stage et
 * reviendra plus tard, et annoncer les trois sans dire ce qu’on a fait venir
 * des étudiants pour rien. Les titres des pages SEO, eux, ne disent ni l’un
 * ni l’autre : ils décrivent ce que la page contient vraiment, calculé à
 * partir des offres (`groupsLabel` dans `offer.ts`).
 *
 * `tests/scope.test.ts` vérifie que `available` correspond bien aux types de
 * contrat que les sources actives savent produire.
 */

export const brand = {
  name: 'JuniorDesk',
  tagline: 'Stages, alternances et premiers postes en finance, rassemblés en un seul endroit.',
  pitch:
    'Les offres de stage, d’alternance et de premier poste en banque, ' +
    'assurance, gestion d’actifs, audit et contrôle de gestion, collectées ' +
    'automatiquement chaque jour. Gratuit, sans compte, et sans candidature à ' +
    'passer par nous : on vous envoie directement chez l’employeur.',
  domain: 'juniordesk.fr',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  locale: 'fr-FR',
  country: 'FR',

  email: {
    contact: 'contact@example.org',
    /** Expéditeur vérifié chez Resend. Doit être un domaine dont vous avez les DNS. */
    from: process.env.EMAIL_FROM ?? 'JuniorDesk <alertes@example.org>',
  },

  scope: {
    /** Ce que le site est. Ne dépend pas des sources branchées aujourd’hui. */
    mission: 'Stages, alternances et premiers postes en finance',

    /** Ce qui est réellement dans le catalogue aujourd’hui. */
    available: {
      label: 'Alternance seule pour l’instant',
      detail:
        'Les offres collectées aujourd’hui sont des alternances — apprentissage ' +
        'et professionnalisation. Les stages et les premiers postes ne sont pas ' +
        'encore dans le catalogue : la source publique qui les diffusait n’est ' +
        'plus ouverte, et nous ne publierons pas d’offres que nous ne pouvons ' +
        'pas collecter. Les filtres correspondants existent déjà et s’allumeront ' +
        'le jour où une source sera branchée.',
    },
  },

  /** Promesses affichées. Elles doivent rester littéralement vraies. */
  promises: [
    { title: 'Gratuit, sans compte', detail: 'Aucun abonnement, aucune option payante' },
    { title: 'Mis à jour chaque jour', detail: 'Collecte automatique, offres expirées retirées' },
    { title: 'Candidature chez l’employeur', detail: 'Nous ne nous interposons pas, nous redirigeons' },
    { title: 'Aucun traceur', detail: 'Aucune publicité, aucune bannière à cliquer' },
  ],
} as const;

export type Brand = typeof brand;
