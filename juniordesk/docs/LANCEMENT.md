# Avant la première mise en ligne

Le code est prêt. Ce qui suit ne peut pas être écrit depuis un clavier.

## 1. Obtenir les vraies offres

- [ ] Compte sur <https://api.apprentissage.beta.gouv.fr/compte/profil>
- [ ] Clé de **production** (pas sandbox) créée
- [ ] `LBA_API_KEY` renseignée
- [ ] `npm run collect` exécuté : vérifier le nombre d'offres retenues, la
      répartition par métier, et surtout la ligne « liens non externes », qui
      doit être à 0

## 2. Demander l'accès France Travail

- [ ] Demande déposée via le formulaire de contact de francetravail.io, en
      décrivant l'usage (agrégateur gratuit d'offres junior en finance,
      redirection vers l'employeur, aucune candidature collectée)
- [ ] À l'obtention : lire le contrat de licence **avant** de brancher la
      source, en particulier l'obligation éventuelle d'afficher l'intégralité de
      l'offre et le logo (voir docs/SOURCES.md)
- [ ] Vérifier `FRANCE_TRAVAIL_TOKEN_URL`, `FRANCE_TRAVAIL_SCOPE` et
      `FRANCE_TRAVAIL_SEARCH_URL` contre la documentation fournie — les valeurs
      par défaut du code n'ont pas pu être vérifiées
- [ ] Mettre à jour `brand.scope` : le site doit alors annoncer les stages et
      les postes juniors. `tests/scope.test.ts` vous le rappellera.

## 3. Identité juridique

Sans elle, rien ne doit être publié.

- [ ] Dénomination, forme juridique, siège, SIREN, responsable de la publication
- [ ] Adresse e-mail de contact et adresse de signalement d'offre
- [ ] Coordonnées de l'hébergeur
- [ ] Tous les `[À COMPLÉTER]` de `/mentions-legales` et `/confidentialite`
      remplis
- [ ] Le `[À CONFIRMER]` sur la conservation des adresses IP relevé dans le
      contrat de sous-traitance de l'hébergeur

## 4. Nom de domaine

- [ ] Disponibilité du domaine vérifiée
- [ ] Recherche d'antériorité à l'INPI — « JuniorDesk » n'a été vérifié ni comme
      domaine ni comme marque
- [ ] `brand.domain` et `NEXT_PUBLIC_SITE_URL` mis à jour

## 5. Infrastructure

- [ ] Projet Vercel créé, dépôt importé
- [ ] Base Redis Upstash créée, `UPSTASH_REDIS_REST_URL` et `_TOKEN` renseignés
      — **sans cela, les inscriptions aux alertes disparaissent à chaque
      redémarrage**
- [ ] `CRON_SECRET` et `ALERTS_SECRET` générés (chaînes aléatoires longues)
- [ ] Domaine vérifié chez Resend, `RESEND_API_KEY` et `EMAIL_FROM` renseignés
      — sans quoi les alertes partent en spam
- [ ] Tâche planifiée vérifiée dans l'interface Vercel : `/api/cron/collect`,
      à 02h40 UTC

## 6. Vérifications finales

- [ ] `npm run verify` passe
- [ ] Parcours d'alerte déroulé de bout en bout sur l'environnement réel :
      inscription, e-mail reçu, confirmation, désinscription
- [ ] Un clic depuis la page d'une offre arrive bien chez l'employeur
- [ ] `/robots.txt` et `/sitemap.xml` répondent
- [ ] Le bandeau de démonstration a disparu
- [ ] Aucune offre ne porte encore le préfixe `[EXEMPLE]`

## 7. Ouvrir l'indexation — en dernier

- [ ] `NEXT_PUBLIC_ALLOW_INDEXING=true`
- [ ] Redéploiement, puis `/robots.txt` revérifié

---

## Ce que ce dépôt ne promet pas

Le code livre un produit. Il ne livre pas d'audience. Un agrégateur gratuit sans
trafic ne vaut rien, et aucune ligne de TypeScript n'y changera quoi que ce
soit : c'est un travail de distribution — écoles, associations étudiantes,
réseaux — qui commence après la mise en ligne.
