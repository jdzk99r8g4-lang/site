# JuniorDesk — agrégateur d'offres finance pour les juniors

Stages, alternances et premiers postes en banque, assurance, gestion d'actifs,
audit, contrôle de gestion et fiscalité. Collecte automatisée, gratuite pour les
candidats, candidature directe chez l'employeur.

Next.js 16 · TypeScript strict · Tailwind 4 · Vitest

---

## À lire avant tout : ce que le site contient aujourd'hui

**De l'alternance, et rien d'autre.**

Le projet vise trois types de contrat. Un seul est alimenté :

| Type | Source | État |
|---|---|---|
| Alternance | La bonne alternance | **Actif** |
| Stage | France Travail | Adaptateur écrit, **source fermée** |
| Poste junior | France Travail | Adaptateur écrit, **source fermée** |

Le site **annonce** les trois — c'est ce qu'il est, et un étudiant qui cherche
un stage doit comprendre qu'il reviendra utilement. Mais il **dit** en page
d'accueil, dans son en-tête et en tête de la liste ce que le catalogue
contient réellement aujourd'hui. Les deux phrases vivent dans `brand.scope` :
`mission` d'un côté, `available` de l'autre, et un test interdit qu'elles se
confondent. Les titres des pages de référencement, eux, ne disent ni l'une ni
l'autre : ils sont calculés depuis les offres de la page, donc ils suivront le
catalogue tout seuls.

**Reconnaître un poste junior.** Un stage porte son niveau dans son type de
contrat, une alternance aussi. Un CDI n'en dit rien : « Directeur financier »
est un CDI. `seniority.ts` tranche sur l'expérience déclarée par la source,
puis sur l'intitulé — exclusions d'abord (senior, responsable, directeur,
associate, VP), marqueurs d'entrée ensuite (junior, jeune diplômé, graduate,
VIE, analyste). **Et si rien ne permet de trancher, l'offre est écartée** :
rater une offre coûte à l'étudiant une occasion qu'il n'a jamais vue, lui
montrer un poste de directeur étiqueté « junior » lui coûte sa confiance.

L'API « Offres d'emploi » de France Travail n'est plus accessible librement. Sa
fiche sur data.gouv.fr indique qu'elle « n'est actuellement plus exposée sur
www.francetravail.io le temps d'une analyse des modalités de distribution et de
réutilisation du service », à la suite d'« usages automatisés massifs par
certaines solutions d'intelligence artificielle ne respectant pas les conditions
et licences de réutilisation ». L'accès se demande désormais au cas par cas, via
le formulaire de contact de francetravail.io.

Conséquence assumée dans le code : les filtres **Stage** et **Poste junior**
sont affichés, à zéro, et marqués « aucune source branchée ». Les masquer
laisserait croire que le site en contient et que la recherche a échoué.
`src/lib/brand.ts` porte le périmètre annoncé, et `tests/scope.test.ts` vérifie
qu'il correspond à ce que les sources savent réellement produire.

Le jour où l'accès France Travail est accordé, deux variables d'environnement
suffisent à tout allumer : aucune page n'a besoin d'être modifiée.

---

## Démarrage

```bash
npm ci                 # voir la note sur npm plus bas
npm run dev            # http://localhost:3000
```

Sans aucune variable d'environnement, le site démarre et se parcourt
intégralement sur un **jeu d'offres fabriquées**, préfixées `[EXEMPLE]` et
annoncées par un bandeau. Rien n'est collecté, aucun e-mail ne part.

### Note sur npm

Utilisez `npm ci`, pas `npm install`. npm 10.9.x contient un bogue de résolution
des dépendances de pair (`Cannot read properties of null (reading 'edgesOut')`)
qui fait échouer `npm install` sur ce jeu de dépendances. Le fichier de
verrouillage a été produit avec npm 12 ; `npm ci` fonctionne avec les deux.
Pour régénérer le verrou : `npx npm@12 install`.

### Commandes

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm test` | 208 tests unitaires |
| `npm run typecheck` | TypeScript en mode strict |
| `npm run collect` | Collecte manuelle, avec rapport détaillé — n'envoie aucun e-mail |
| `npm run verify` | Les trois premiers, à lancer avant tout déploiement |

---

## Faire arriver les e-mails

Sans `RESEND_API_KEY`, aucun e-mail ne part : les messages sont écrits dans la
console en développement, et refusés bruyamment en production. Pour que les
alertes et les liens de compte arrivent réellement :

1. Créer un compte sur Resend et une clé API.
2. **Vérifier un domaine qu'on possède.** Resend n'envoie pas depuis un domaine
   partagé ou public : il faut ajouter et vérifier au moins un domaine. Sa
   documentation recommande un sous-domaine (`alertes.juniordesk.fr`) plutôt que
   le domaine racine, pour isoler la réputation d'envoi.
3. Poser les enregistrements DNS que Resend affiche : un MX et un TXT SPF
   (`v=spf1 include:amazonses.com ~all`) sur le nom `send`, plus le TXT DKIM.
4. `RESEND_API_KEY` et `EMAIL_FROM` (une adresse **de ce domaine vérifié**).
5. `NEXT_PUBLIC_SITE_URL` sur l'URL publique réelle : c'est elle qui construit
   les liens contenus dans les e-mails.

Sans domaine vérifié, les messages partent en indésirables ou sont refusés.

## Obtenir les vraies offres

1. Créez un compte sur <https://api.apprentissage.beta.gouv.fr/compte/profil>
2. Créez une clé de **production** (pas « sandbox » : la sandbox renvoie les
   données de recette). La lecture d'offres ne demande **aucune habilitation**.
3. `LBA_API_KEY=…` dans `.env.local`
4. `npm run collect` pour voir ce que la source renvoie réellement.

---

## Architecture

```
src/
├── lib/
│   ├── offer.ts        Modèle NORMALISÉ, indépendant de toute source
│   ├── taxonomy.ts     Périmètre finance — codes ROME 4.0 v62 vérifiés
│   ├── sources/        Adaptateurs interchangeables (LBA, France Travail, démo)
│   ├── normalize…      dedupe.ts · geo.ts · slug.ts · filters.ts
│   ├── regions.ts      Départements et régions, depuis l'API Géo de l'État
│   ├── collect.ts      Orchestrateur de la collecte quotidienne
│   ├── offers.ts       Lecture par les pages — SERVEUR UNIQUEMENT
│   ├── store/          Persistance (Redis Upstash ou mémoire)
│   ├── alerts.ts       Alertes e-mail, double opt-in
│   ├── auth.ts         Comptes, mots de passe, sessions — SERVEUR UNIQUEMENT
│   ├── google.ts       Connexion Google (OIDC) — SERVEUR UNIQUEMENT
│   ├── email-address.ts Validation et forme canonique des adresses
│   ├── tokens.ts       Signature HMAC des liens — SERVEUR UNIQUEMENT
│   └── stats.ts        Compteurs agrégés, sans aucun traceur
└── app/
    ├── api/            cron de collecte · inscription aux alertes
    ├── go/[id]/        Redirection comptée vers l'employeur
    └── …               Pages publiques
```

### Sept décisions structurantes

**1. Aucune page ne connaît aucune source.** Chaque adaptateur produit du
`Offer` normalisé ; la source la plus importante du projet a fermé du jour au
lendemain, et c'est exactement le risque contre lequel cette abstraction
protège. Ajouter une source de stages ne touchera pas une seule page.

**2. Le catalogue se construit sur `/job/v1/export`, pas sur `/job/v1/search`.**
La documentation de `search` dit elle-même que ses résultats sont plafonnés à
150 par source — 450 au total — et qu'« il n'est pas possible de récupérer
toutes les offres correspondant aux critères ». Un catalogue bâti dessus serait
arbitrairement tronqué. `export` liste tout et se rafraîchit à 3h00 heure de
Paris ; d'où le cron à 02h40 UTC, qui tombe après le rafraîchissement été comme
hiver.

**3. Une collecte vide n'écrase jamais un instantané plein.** Si toutes les
sources échouent, les offres de la veille sont conservées. Un site qui affiche
des offres d'hier reste utile ; un site vide ne l'est pas. Vérifié par
`tests/collect.test.ts`.

**4. La géographie se filtre par région autant que par ville.** La Défense
n'est pas à Paris : elle est à Puteaux, à Courbevoie et à Nanterre. Un étudiant
qui filtre « Paris » rate donc une grande partie des postes du secteur. Le
filtre par région règle ce cas, et un second : la liste des villes vient des
offres du jour, pas d'un référentiel, et peut compter plusieurs centaines
d'entrées. Les douze villes les plus fournies sont affichées en pastilles, le
reste passe par un champ de saisie avec autocomplétion native. Le découpage
départements / régions vient de l'API Géo de l'État, pas de la mémoire.

**5. Le périmètre finance vient du référentiel officiel, et ne s'y limite pas.**
93 codes ROME relevés dans le Répertoire Opérationnel des Métiers et des Emplois
(version 4.0 v62, publiée le 19/10/2026, Licence Ouverte), pas écrits de
mémoire. Mais ROME n'a aucun code pour « private equity », « transaction
services », « banque d'investissement » ou « fintech » : ces verticales sont
rattachées par mots-clés sur l'intitulé, **en plus** du code ROME et non à sa
place. Sans cela, une alternance M&A codée « clientèle bancaire » par
l'employeur n'apparaîtrait jamais sous M&A. Dix-huit familles au total, et une
liste d'exclusions explicite qui tient l'immobilier et la qualité industrielle
à l'écart — sans elle, « assurance qualité » et « audit énergétique »
rempliraient le site de postes d'usine.

**6. Les listes sont paginées par l'URL, pas par un bouton « voir plus ».**
Mesuré sur le jeu de démonstration en servant la même page avec 2, 6, 12 puis
20 offres : la relation est linéaire, environ 3,3 Ko par offre sur un coût fixe
de 62 Ko, donc une page d'environ 6,5 Mo à deux mille offres. Vingt-quatre offres par page (`OFFERS_PER_PAGE`), et chaque page a sa
propre adresse : elle se partage, se met en favori, fonctionne sans
JavaScript comme le reste des filtres, et se parcourt. Un bouton « voir plus »
laisse tout ce qui suit la première fournée hors de portée d'un moteur.

Deux détails de référencement qui paraissent mineurs et ne le sont pas. Chaque
page porte sa **propre** canonique, numéro compris : canoniser la page 2 vers
la page 1 dirait aux moteurs que les offres de la page 2 ne sont nulle part. Et
une combinaison de filtres (`/offres?metier=…`) est marquée `noindex, follow`
et ne porte **aucune** canonique : les adresses à référencer existent déjà sous
`/metiers/…`, `/villes/…` et `/regions/…`, et donner pour canonique à une page
filtrée la page non filtrée de même numéro serait faux — une canonique doit
désigner une adresse qui porte le même contenu.

**7. Trois tâches planifiées, et pas une seule.** La collecte dépend du volume
du catalogue, les alertes du nombre d'abonnés (un appel réseau chacun, l'un
après l'autre), le ménage de rien du tout. Enchaînées dans une seule fonction
au temps borné, les secondes faisaient tuer la première vers quatre ou cinq
cents abonnés, sans qu'aucune erreur ne l'annonce. Chaque tâche a donc son
passage : `/api/cron/collect` écrit l'instantané, `/api/cron/alertes` sert un
lot borné d'abonnés et reprend la file au passage suivant, `/api/cron/menage`
applique la durée de conservation.

**La durée de conservation est appliquée, pas seulement annoncée.** Un compte
jamais confirmé est supprimé au bout de trente jours — son lien a expiré, il ne
peut plus rien devenir, et n'importe qui peut saisir l'adresse de n'importe qui
sur le formulaire. Un compte confirmé est supprimé après deux ans sans
connexion, avec un e-mail d'avertissement un mois avant : il porte des offres
mises de côté et des candidatures notées, et les effacer sans prévenir ferait
disparaître le travail de quelqu'un pour appliquer une règle qu'il n'a jamais
lue. Le bouton « Télécharger mes données » de l'espace personnel répond au
droit d'accès sans attendre qu'une boîte e-mail soit relevée.

### Ce que la recherche et les filtres font exactement

Mesuré sur des cas réalistes, puis fixé par des tests (`tests/search.test.ts`,
`tests/geo.test.ts`, `tests/regions.test.ts`, `tests/taxonomy.test.ts`).

**Recherche.** La saisie est découpée en mots, et chaque mot doit *commencer*
un mot de l'offre, dans n'importe quel ordre. « analyste paris » trouve un
analyste à Paris, « contr gest » trouve « Contrôleur de gestion », « M&A » ne
se lit plus dans « tea**M A**nalyst ». Le texte cherché comprend l'intitulé,
l'employeur, la ville et le libellé du métier où le site range l'offre.

**Lieu.** Une ville cochée *précise* sa région ou *s'y ajoute* : « Île-de-
France » puis « Puteaux » donne Puteaux, « Île-de-France » puis « Lyon » donne
les deux. Les autres critères se cumulent avec le lieu.

**Villes.** Une seule normalisation pour les adresses des offres et pour ce
que tape le visiteur : les arrondissements sont rattachés à leur ville
(« PARIS 8E ARRONDISSEMENT »), la graphie postale est développée
(« ST ETIENNE »), La Défense est rangée où elle est, et la ville est cherchée
avant le code postal quand elle n'est pas après.

**Tri.** Une date de publication illisible vaut « pas de date » et passe en
dernier. Elle ne peut plus dérégler l'ordre des autres offres.

**Limite connue : les communes homonymes.** Saint-Denis en Seine-Saint-Denis et
Saint-Denis de La Réunion partagent le même identifiant de ville, donc le même
filtre et la même page. La région les départage ; l'identifiant, non.

---

## Configuration

Tout est dans `.env.example`, commenté ligne par ligne.

| Variable | Rôle | Obligatoire |
|---|---|---|
| `LBA_API_KEY` | Collecte des offres d'alternance | pour avoir de vraies offres |
| `FRANCE_TRAVAIL_CLIENT_ID` / `_SECRET` | Active stages et postes juniors | quand l'accès sera accordé |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Persistance des offres **et des comptes** | **en production** |
| `CRON_SECRET` | Protège la collecte planifiée | **en production** |
| `ALERTS_SECRET` | Signe les liens d'alerte et de compte | **en production** |
| `GOOGLE_CLIENT_ID` / `_SECRET` | Bouton « Continuer avec Google » | facultatif |
| `EMAIL_HOURLY_CAP` | Plafond horaire d'e-mails déclenchés par un visiteur (200) | facultatif |
| `ALERTS_PER_RUN` | Abonnés servis par passage du cron d'alertes (150) | facultatif |
| `OFFERS_PER_PAGE` | Offres par page de liste (24) | facultatif |
| `RESEND_API_KEY` / `EMAIL_FROM` | Envoi des alertes | pour notifier |
| `NEXT_PUBLIC_ALLOW_INDEXING` | `true` le jour du lancement seulement | — |

Sans Redis en production, les offres, **les comptes** et les inscriptions aux
alertes sont perdus au redémarrage et ne sont pas partagés entre processus. Le
code le signale bruyamment dans les journaux.

`ALERTS_SECRET` ne doit jamais changer une fois le site en ligne : il signe les
liens en circulation et sert à dériver les identifiants de compte à partir des
adresses. Le modifier déconnecterait les comptes de leurs alertes.

---

## Comptes étudiants

Un compte sert à trois choses, et pas une de plus : mettre des offres de côté,
noter celles où l'on a postulé, et retrouver son alerte e-mail. Pas de profil,
pas de CV, pas de nom — seulement une adresse et un mot de passe.

Ce qui est en place :

- mot de passe haché avec **scrypt**, sel aléatoire par compte, comparaison en
  temps constant ;
- adresse confirmée par lien signé, sans quoi on pourrait créer un compte avec
  l'adresse de quelqu'un d'autre ;
- session dans un cookie `httpOnly`, `SameSite=Lax`, `Secure` en production,
  révocable côté serveur ;
- le formulaire de connexion ne révèle jamais si une adresse est inscrite, et un
  hachage est calculé même quand le compte n'existe pas, pour que le temps de
  réponse ne le trahisse pas non plus ;
- dix tentatives de connexion par quart d'heure et par compte ;
- **trois e-mails par heure et par adresse**, plus un plafond horaire global,
  sur les trois formulaires qui font partir un message vers une adresse
  choisie par l'appelant — sans quoi ils servent à inonder la boîte d'un
  tiers et à griller la réputation du domaine d'envoi ;
- **réinitialisation de mot de passe** par lien d'une heure, à usage unique,
  qui révoque toutes les sessions ouvertes ;
- **connexion avec Google** en option, qui se rattache au compte existant
  portant la même adresse au lieu d'en créer un second ;
- suppression du compte immédiate et complète, depuis l'espace personnel.

Le lien de réinitialisation ne sert qu'une fois sans qu'on ait à stocker quoi
que ce soit : il porte l'empreinte du mot de passe courant, qui change au
moment du changement. Et il est construit depuis `NEXT_PUBLIC_SITE_URL`, jamais
depuis l'en-tête `Host` de la requête — un lien de réinitialisation bâti sur un
en-tête que l'appelant contrôle se détourne vers le domaine de son choix.

**Les comptes rendent Redis obligatoire.** Sans lui, le magasin est en mémoire,
donc ni partagé entre processus ni conservé au redémarrage : une personne peut
créer un compte et ne pas réussir à s'y connecter.

## Connexion avec Google

Facultative : sans `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET`, le bouton ne
s'affiche pas et le site fonctionne entièrement par e-mail et mot de passe.

Flux OpenID Connect par code d'autorisation, écrit à la main — aucune
dépendance ajoutée. Portée demandée : `openid email`, rien d'autre. Pas de
`profile`, donc ni nom ni photo : on n'en a pas l'usage et on ne les
stockerait pas.

Trois points qui méritent d'être connus :

- **Le rattachement est conditionné.** Quelqu'un qui s'est inscrit avec un mot
  de passe puis revient par Google avec la même adresse retrouve son compte,
  ses offres et ses alertes — mais seulement si Google affirme que l'adresse
  est vérifiée. Sans cette condition, créer un compte Google portant l'adresse
  d'un tiers suffirait à s'emparer de son compte.
- **La signature du jeton d'identité n'est pas vérifiée, et c'est voulu.** Le
  jeton n'arrive pas par le navigateur : ce serveur le récupère directement
  auprès de Google sur une liaison TLS vérifiée, cas pour lequel OpenID
  Connect Core (§3.1.3.7) rend le contrôle de signature facultatif. Émetteur,
  destinataire, expiration et `nonce` sont vérifiés, eux.
- **L'adresse de retour vient de `NEXT_PUBLIC_SITE_URL`**, jamais de l'en-tête
  `Host`, et doit être déclarée à l'identique dans la console Google Cloud.

Un compte créé par Google n'a pas de mot de passe. Il peut s'en donner un par
« mot de passe oublié », qui fonctionne aussi dans ce sens.

## Vie privée : un seul cookie, aucun traceur

Aucun traceur publicitaire, aucun outil de mesure tiers, aucun script externe.
La mesure se limite à des compteurs agrégés côté serveur, sans adresse IP ni
identifiant de visiteur : elle ne lit ni n'écrit rien sur le terminal, donc
l'article 82 de la loi Informatique et Libertés ne la concerne pas.

Un seul cookie existe, `jd_session`, et uniquement pour les personnes
connectées. Il est strictement nécessaire au service demandé, donc exempté de
consentement à ce titre. Il n'y a toujours pas de bannière à afficher — mais le
site ne prétend plus « aucun cookie », ce qui serait désormais faux.

La mesure se limite à des compteurs agrégés côté serveur, rangés par mois et
supprimés automatiquement au bout de 25 mois — la durée maximale recommandée par
la CNIL, appliquée par le code et pas seulement promise dans un texte.

Détail et limites : [docs/CONFORMITE.md](docs/CONFORMITE.md).

---

## Ce qui reste à faire avant la première mise en ligne

Voir [docs/LANCEMENT.md](docs/LANCEMENT.md). En résumé, cinq choses qui ne
peuvent pas être écrites depuis un clavier : la clé API, la demande d'accès
France Travail, une identité juridique réelle pour les mentions légales, un nom
de domaine vérifié, et les comptes d'hébergement.

## Documentation

- [docs/SOURCES.md](docs/SOURCES.md) — les sources, leurs limites, leurs licences
- [docs/CONFORMITE.md](docs/CONFORMITE.md) — RGPD, CNIL, ce qui est tranché et ce qui ne l'est pas
- [docs/LANCEMENT.md](docs/LANCEMENT.md) — la liste avant publication
