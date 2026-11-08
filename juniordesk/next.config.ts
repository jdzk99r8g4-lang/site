import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  /*
   * Racine du suivi de fichiers.
   *
   * JuniorDesk vit dans un sous-dossier d'un dépôt qui contient un autre
   * projet npm à sa racine. Sans ce réglage, Next voit deux fichiers de
   * verrouillage, choisit celui du parent et trace les fichiers depuis
   * là — ce qui, au déploiement, embarque le mauvais arbre de dépendances.
   * Le jour où ce dossier devient son propre dépôt, cette ligne pourra
   * partir.
   */
  outputFileTracingRoot: __dirname,
  // Ne pas annoncer la pile technique dans les en-têtes de réponse.
  poweredByHeader: false,

  experimental: {
    /*
     * Posé par la mise à jour de sécurité 16.4.0 → 16.4.5.
     *
     * Indique à `next upgrade` que cette application suit le canal
     * « security » : seules les mises à jour corrigeant une faille publiée
     * sont proposées, pas les montées de version de confort.
     */
    agentUpgrade: 'security',
  },

  images: {
    /*
     * Aucun domaine distant autorisé.
     *
     * Les offres viennent de tiers et peuvent porter des URL d'images
     * arbitraires. Tant qu'aucune image d'employeur n'est affichée, la liste
     * reste vide : l'ouvrir « au cas où » transformerait l'optimiseur d'images
     * en relais ouvert vers n'importe quel hôte.
     */
    remotePatterns: [],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
