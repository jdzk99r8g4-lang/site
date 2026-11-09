---
name: verify
description: Construire, lancer et piloter JuniorDesk pour observer un changement à l'exécution. À utiliser pour vérifier une modification du site (listes, filtres, pagination, pages SEO, comptes, alertes) autrement qu'en relançant les tests.
---

# Vérifier JuniorDesk à l'exécution

Le projet est un paquet npm autonome dans `juniordesk/`, à l'intérieur d'un
dépôt qui en contient d'autres. Toutes les commandes se lancent **depuis le
dossier qui contient `package.json`** — dans le dépôt, `juniordesk/`, jamais la
racine. (Dans une copie de test, ce dossier peut déjà être la racine : fie-toi
à l'emplacement de `package.json`, pas au nom du dossier.)

## Lancer

```bash
cd juniordesk
npm run build
OFFERS_PER_PAGE=6 NEXT_PUBLIC_ALLOW_INDEXING=true npm start -- -p 3000
```

Deux variables qui changent ce qu'on observe :

- **`OFFERS_PER_PAGE=6`** — le jeu de démonstration ne compte que vingt
  offres, et la valeur par défaut est 24 : sans cette variable, tout tient sur
  une page et le paginateur n'apparaît pas du tout.
- **`NEXT_PUBLIC_ALLOW_INDEXING=true`** — sinon le site entier est
  `noindex, nofollow` (garde-fou tant que les mentions légales sont
  incomplètes), et on ne peut rien observer des règles d'indexation propres à
  une page. Ne jamais confondre ce `noindex` global avec celui d'une page.

  Attention : passée au démarrage, cette variable n'agit que sur les balises
  `<meta robots>`. **`robots.txt` est prérendu au build** et continuera de
  répondre `Disallow: /`. Mesuré : balises `index, follow` et `robots.txt`
  `Disallow: /` servis en même temps. C'est sans importance pour observer les
  règles par page, mais si c'est `robots.txt` qu'on vérifie, il faut
  reconstruire avec la variable.

Aucune clé API n'est nécessaire : sans `LBA_API_KEY`, le site sert un jeu de
vingt offres d'exemple, suffisant pour tout piloter.

## Piloter

Les listes fonctionnent **sans JavaScript** — c'est une propriété à vérifier,
pas un détail. Playwright avec `javaScriptEnabled: false` est donc le pilote
le plus honnête pour les filtres et la pagination :

```js
const ctx = await b.newContext({ javaScriptEnabled: false });
```

Chromium est préinstallé : `require('playwright')` et `chromium.launch()`
fonctionnent sans option ni installation.

### Le cache peut te faire décrire une page qui n'est plus servie

Les listes sont en ISR (`export const revalidate = 3600`). Le rendu est gardé,
**et il survit à l'arrêt du serveur** : il est écrit dans `.next`, pas
seulement dans `.next/cache`, donc ni un redémarrage ni `rm -rf .next/cache` ne
le reprennent. Changer une variable d'environnement puis relancer ne suffit
donc pas à voir son effet.

Pour forcer un rendu neuf, ajouter un paramètre inutilisé et unique :
`/offres?zz=$RANDOM`. Les paramètres inconnus ne filtrent rien, mais chaque
adresse distincte est une entrée de cache distincte.

Constaté en mesurant le poids de la page : quatre valeurs différentes de
`OFFERS_PER_PAGE` renvoyaient toutes exactement 70 142 octets. Un chiffre
identique à l'octet près d'une mesure à l'autre n'est pas un résultat stable,
c'est une réponse en cache.

### Une mesure par serveur, et un port par serveur

En enchaînant plusieurs serveurs sur le même port, le contrôle de
disponibilité répond avant que le précédent soit mort : toutes les mesures
décrivent alors le premier, sans que rien ne le signale. Donner un port
distinct à chaque mesure coûte une ligne et supprime le problème.

### Pièges de lecture constatés

Plusieurs fausses alertes sont venues de motifs `grep` trop étroits, pas du
code. Extraire le texte rendu plutôt que deviner le balisage :

- le compteur est un `<p aria-live="polite">`, et il a **deux formulations** :
  « Offres 1 à 6 sur 20 » quand la liste dépasse une page, « 20 offres » quand
  tout tient dessus. Un motif qui n'attend que la première conclut à tort que
  le compteur a disparu ;
- le paginateur est `<nav aria-label="Pages">`, pas « Pagination » ;
- les cartes n'ont pas de classe `offer` : les compter par
  `href="/offres/<slug>"`.

### Noms des paramètres d'URL

Ils sont **en français**, et s'en tromper donne une page sans filtre qui
ressemble à une page filtrée :

| Filtre | Paramètre |
|---|---|
| Métier | `metier` |
| Type de contrat | `type` |
| Ville | `ville` |
| Région | `region` |
| Recherche libre | `q` |
| Tri | `tri` |
| Page | `page` |

## Ce qui vaut la peine d'être poussé

- une page hors bornes (`?page=999`) doit servir la dernière page **et**
  passer en `noindex` ;
- `?page=abc` est une absence de numéro, pas un dépassement : page 1, indexable ;
- une page filtrée ou réordonnée (`?metier=…`, `?tri=city`) ne doit porter
  **aucune** canonique et être `noindex, follow` : son contenu n'est pas celui
  de la page non filtrée de même numéro ;
- l'union des pages doit redonner le catalogue exactement une fois — comparer
  les slugs de toutes les pages, chercher doublons et manquants.
