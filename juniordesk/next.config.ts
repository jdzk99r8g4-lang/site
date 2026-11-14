import type { NextConfig } from 'next';

/**
 * Politique de sécurité du contenu.
 *
 * Elle ne laisse charger que ce qui vient du site lui-même : aucun script,
 * aucune image, aucune requête vers un tiers. Si une faille permettait un jour
 * d'injecter du contenu dans une page, il ne pourrait ni charger un script
 * extérieur ni envoyer des données ailleurs.
 *
 * `'unsafe-inline'` reste nécessaire pour les scripts : Next écrit dans la
 * page de petits scripts d'amorçage, et les autoriser un par un demanderait
 * un jeton par requête, donc de renoncer à la mise en cache des pages. C'est
 * la limite de cette politique, et elle est assumée — elle bloque le
 * chargement de code tiers, pas l'exécution d'un script déjà injecté.
 *
 * En production seulement : le serveur de développement a besoin d'`eval`
 * pour le rechargement à chaud.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  // Les formulaires ne postent que vers le site ; la connexion Google passe
  // par une redirection que le site émet lui-même, d'où son domaine ici.
  "form-action 'self' https://accounts.google.com",
].join('; ');

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
          /*
           * Impose HTTPS aux navigateurs qui ont déjà vu le site. Sans effet
           * en local : un navigateur ignore cet en-tête reçu en HTTP.
           */
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
          ...(process.env.NODE_ENV === 'production'
            ? [{ key: 'Content-Security-Policy', value: CONTENT_SECURITY_POLICY }]
            : []),
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
