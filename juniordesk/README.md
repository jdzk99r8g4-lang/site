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
| `npm test` | 114 tests unitaires |
| `npm run typecheck` | TypeScript en mode strict |
| `npm run collect` | Collecte manuelle, avec rapport détaillé — n'envoie aucun e-mail |
| `npm run verify` | Les trois premiers, à lancer avant tout déploiement |

---

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
│   ├── collect.ts      Orchestrateur de la collecte quotidienne
│   ├── offers.ts       Lecture par les pages — SERVEUR UNIQUEMENT
│   ├── store/          Persistance (Redis Upstash ou mémoire)
│   ├── alerts.ts       Alertes e-mail, double opt-in
│   ├── auth.ts         Comptes, mots de passe, sessions — SERVEUR UNIQUEMENT
│   ├── tokens.ts       Signature HMAC des liens — SERVEUR UNIQUEMENT
│   └── stats.ts        Compteurs agrégés, sans aucun traceur
└── app/
    ├── api/            cron de collecte · inscription aux alertes
    ├── go/[id]/        Redirection comptée vers l'employeur
    └── …               Pages publiques
```

### Quatre décisions structurantes

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

**4. Le périmètre finance vient du référentiel officiel, et ne s'y limite pas.**
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
- suppression du compte immédiate et complète, depuis l'espace personnel.

Ce qui n'y est pas encore : la **réinitialisation de mot de passe**. La page de
connexion le dit plutôt que d'afficher un lien mort.

**Les comptes rendent Redis obligatoire.** Sans lui, le magasin est en mémoire,
donc ni partagé entre processus ni conservé au redémarrage : une personne peut
créer un compte et ne pas réussir à s'y connecter.

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
