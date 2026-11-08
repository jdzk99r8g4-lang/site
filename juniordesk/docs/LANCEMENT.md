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
- [ ] `CRON_SECRET` et `ALERTS_SECRET` générés (chaînes aléatoires longues).
      `ALERTS_SECRET` ne devra plus jamais changer : il signe les liens en
      circulation et dérive les identifiants de compte à partir des adresses
- [ ] Domaine vérifié chez Resend. Resend n'envoie pas depuis un domaine
      partagé : il faut en posséder un et le vérifier. Sa documentation
      recommande un sous-domaine (`alertes.juniordesk.fr`) pour isoler la
      réputation d'envoi des e-mails transactionnels
- [ ] Enregistrements DNS posés : MX et TXT SPF sur le nom `send`, plus le TXT
      DKIM, tels que Resend les affiche
- [ ] `RESEND_API_KEY` et `EMAIL_FROM` renseignés, l'adresse d'expédition
      appartenant au domaine vérifié — sinon les messages sont refusés ou
      partent en indésirables
- [ ] Un e-mail de test réellement reçu dans une vraie boîte, pas seulement
      accepté par l'API
- [ ] Tâche planifiée vérifiée dans l'interface Vercel : `/api/cron/collect`,
      à 02h40 UTC

## 5 bis. Avant d'ouvrir les comptes largement

- [ ] Vérifier que Redis est bien branché : sans lui, les comptes ne survivent
      ni au redémarrage ni au passage d'un processus à l'autre
- [ ] Vérifier que `NEXT_PUBLIC_SITE_URL` porte l'URL publique réelle : c'est
      elle qui construit les liens des e-mails, y compris ceux de
      réinitialisation de mot de passe

## 5 ter. Si vous activez la connexion Google

- [ ] ID client OAuth créé dans la console Google Cloud, type « Application Web »
- [ ] URI de redirection autorisée déclarée à l'identique :
      `<NEXT_PUBLIC_SITE_URL>/api/compte/google/retour`
- [ ] `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` renseignés
- [ ] Vérification de marque demandée à Google. Sans elle, l'écran de
      consentement n'affiche que le nom de domaine, sans nom ni logo — ce qui
      inquiète un étudiant au moment précis où on lui demande de se connecter
- [ ] Politique de confidentialité et conditions en ligne : Google les exige
      pour la vérification, et les mentions légales doivent donc être
      terminées d'abord

## 6. Vérifications finales

- [ ] `npm run verify` passe
- [ ] Parcours d'alerte déroulé de bout en bout sur l'environnement réel :
      inscription, e-mail reçu, confirmation, désinscription
- [ ] Parcours de compte déroulé de bout en bout : création, e-mail de
      vérification reçu, confirmation, connexion, mise de côté d'une offre,
      déconnexion, reconnexion, suppression du compte
- [ ] Parcours de mot de passe oublié : lien reçu, nouveau mot de passe
      accepté, ancien refusé, lien inutilisable une seconde fois, et sessions
      des autres appareils bien fermées
- [ ] Si Google est activé : connexion depuis un compte Google neuf, puis
      depuis un compte dont l'adresse existe déjà avec un mot de passe —
      le second doit RATTACHER et non créer un doublon
- [ ] Vérifier que la connexion fonctionne de façon répétée : si elle échoue
      une fois sur deux, c'est que Redis n'est pas branché et que chaque
      processus a sa propre mémoire
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
