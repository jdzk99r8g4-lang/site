# Les sources d'offres

## La bonne alternance — active

Service public opéré par la Mission Apprentissage.

- Documentation : <https://api.apprentissage.beta.gouv.fr/fr/explorer>
- Base : `https://api.apprentissage.beta.gouv.fr/api`
- En-tête : `Authorization: Bearer <clé>`
- Clé : <https://api.apprentissage.beta.gouv.fr/compte/profil>

**La lecture d'offres ne demande aucune habilitation.** Seules l'écriture
d'offres (`jobs:write`), l'envoi de candidatures (`applications:write`) et les
liens de rendez-vous (`appointments:write`) en exigent une. Une clé de
production suffit donc, immédiatement.

Attention au type de clé : une clé **sandbox** route toutes les requêtes, y
compris les lectures, vers l'environnement de recette de La bonne alternance.
Les offres renvoyées ne sont alors pas les vraies.

### Routes utilisées

| Route | Usage | Quota |
|---|---|---|
| `GET /job/v1/export` | Catalogue complet, rafraîchi 1×/jour à 3h00 Paris | 2 appels/min |
| `GET /job/v1/search` | Non utilisé — voir ci-dessous | 60 appels/min |
| `GET /job/v1/offer/{id}` | Détail d'une offre | 120 appels/min |

**Pourquoi pas `search`.** Sa propre documentation précise que les résultats
sont « limités à 150 pour chacune des trois sources, soit 450 résultats
maximum » et qu'« il n'est actuellement pas possible de récupérer toutes les
offres correspondant aux critères de recherche ». Un catalogue construit dessus
serait tronqué sans qu'on sache ce qui manque.

### Quotas

Chaque réponse porte `x-ratelimit-limit`, `x-ratelimit-remaining` et
`x-ratelimit-reset`. Un 429 porte `retry-after`, que l'adaptateur respecte
plutôt que d'inventer un délai. Un 401 n'est jamais réessayé : réessayer avec
une clé invalide ne change rien et brûle le quota.

### Ce que la source contient — et ne contient pas

Le champ `contract.type` du schéma `JobOfferRead` n'admet que deux valeurs :
`Apprentissage` et `Professionnalisation`. **Cette source ne produira jamais de
stage ni de CDI**, quoi qu'on espère. C'est ce que déclare `contractKinds` dans
l'adaptateur, et ce que vérifie `tests/scope.test.ts`.

Les offres proviennent de trois origines, que l'API identifie par
`identifier.partner_label` : la collecte propre de La bonne alternance, France
Travail, et les partenaires qui publient via l'API. Une même offre peut donc
arriver deux fois sous deux identifiants différents — d'où le dédoublonnage par
empreinte.

### Dédoublonnage : ce qu'il attrape, ce qu'il laisse passer

L'empreinte inter-sources est « intitulé nettoyé + employeur nettoyé + ville +
famille de contrat ». Mesuré sur des variantes réalistes d'un même poste :

| Variante | Reconnue |
|---|---|
| Casse, accents, espaces superflus | oui |
| `Analyste M&A (H/F)`, `H/F`, `(F/H)`, `(H/F/X)` | oui |
| `Alternance - Analyste M&A` (contrat en préfixe) | oui |
| `Analyste M&A - Paris` (ville répétée) | oui |
| `Conseil Exemple SAS` (forme juridique) | oui |
| Même SIRET des deux côtés | oui |
| `Analyste Mergers & Acquisitions` vs `Analyste M&A` | **non** |

Le dernier cas est hors de portée : une empreinte compare des chaînes, elle ne
comprend pas le français. Le traiter demanderait un dictionnaire de synonymes
du métier, qui se tromperait dans l'autre sens. Un doublon affiché coûte moins
cher au candidat qu'une offre fusionnée à tort, donc disparue.

La **famille de contrat** entre dans l'empreinte pour une raison précise :
une fois le préfixe retiré, `Stage - Analyste M&A` et `Alternance - Analyste
M&A` chez le même employeur deviendraient indiscernables alors que ce sont
deux offres différentes.

Une version antérieure comparait les intitulés bruts : elle tenait tant qu'une
seule source alimentait le site, et cédait au premier jour où deux sites
décrivent le même poste — c'est-à-dire exactement le cas qu'elle visait.

### Licence et rediffusion

La documentation de l'API autorise explicitement à exposer ces offres « for free
and under a white-label format ». C'est la base juridique sur laquelle
JuniorDesk peut exister, et la raison pour laquelle le site doit rester gratuit
pour les candidats. Les contenus du site La bonne alternance sont par ailleurs
sous licence etalab-2.0.

---

## France Travail — écrite, inactive

L'API « Offres d'emploi » diffusait les stages et les postes juniors, soit les
deux tiers du périmètre visé.

Sur data.gouv.fr, la fiche du service indique :

> L'API Offre d'emploi de France Travail n'est actuellement plus exposée sur
> www.francetravail.io le temps d'une analyse des modalités de distribution et
> de réutilisation du service. Cette démarche fait suite à la constatation
> d'usages automatisés massifs par certaines solutions d'intelligence
> artificielle ne respectant pas les conditions et licences de réutilisation
> associées à l'API.

Conditions d'accès : « Restreint ». La demande passe par le formulaire de
contact de francetravail.io. La fiche mentionne une limite de 10 appels par
seconde et un taux de disponibilité de 99,8 %, mais ne renseigne pas de licence.

### Avertissement sur l'adaptateur

Le portail n'exposant plus l'API, **l'adresse du serveur de jetons, les
« scopes » et le chemin de recherche n'ont pas pu être vérifiés** sur une source
officielle. Les valeurs par défaut du code proviennent de documentations tierces
et de bibliothèques communautaires : elles sont plausibles, elles ne sont pas
confirmées.

Elles sont donc toutes surchargeables par variables d'environnement
(`FRANCE_TRAVAIL_TOKEN_URL`, `FRANCE_TRAVAIL_SCOPE`,
`FRANCE_TRAVAIL_SEARCH_URL`). Le jour où l'accès est accordé, France Travail
fournit sa documentation : corrigez les variables si elles diffèrent, sans
toucher au code.

### Deux obligations de licence à vérifier à ce moment-là

Elles contraignent l'**affichage**, pas seulement le code :

1. une obligation d'afficher l'intégralité du contenu de l'offre, logo compris,
   rapportée par des copies tierces de la licence — non vérifiée sur une source
   officielle ;
2. le droit d'exploiter les logos des partenaires si la réutilisation dépasse le
   simple rapprochement offre / demande.

Ne branchez pas cette source sans avoir lu le contrat qui vous sera remis.

---

## Le périmètre finance

Défini sur le **Répertoire Opérationnel des Métiers et des Emplois (ROME)** de
France Travail, version 4.0 v62, publiée le 19/10/2026, diffusée en open data
sous Licence Ouverte :
<https://www.data.gouv.fr/datasets/repertoire-operationnel-des-metiers-et-des-emplois-rome>

93 codes, relevés dans le fichier `unix_referentiel_code_rome_v462.json` du
référentiel officiel et répartis en neuf familles. Aucun code n'a été écrit de
mémoire.

### Pourquoi ROME ne suffit pas

ROME décrit des métiers, pas des secteurs, et il est plus grossier que le
vocabulaire de la finance : il n'existe pas de code « M&A » distinct de
« gestion d'actifs », et une alternance en salle des marchés peut très bien être
codée `M1203 Comptable` par un employeur pressé.

D'où deux portes d'entrée et une porte de sortie :

1. le code ROME appartient à une famille → retenue ;
2. sinon, l'intitulé porte un terme franchement financier → retenue ;
3. dans les deux cas, un terme d'exclusion disqualifie → écartée.

La règle 3 n'est pas un détail : « assurance qualité » contient « assurance »,
« audit énergétique » contient « audit ». Sans liste d'exclusions, un site
d'offres finance se remplit de postes d'usine.

### Exclusions explicites

Immobilier (C15xx), organismes de sécurité sociale (C1122, C1123, C1124,
C1126), et les codes de la famille M12 qui n'ont rien de financier malgré leur
voisinage : M1209 (conseil en gestion, trop générique), M1212 (gestionnaire de
lits), M1216, M1217, M1218, M1227.

`tests/taxonomy.test.ts` échoue si l'un de ces codes réapparaît dans une
famille, si un code est rattaché à deux familles, ou si un code n'a pas la forme
officielle.

### Limite connue

Le rattachement par mot-clé est imparfait par construction. Une offre finance
rangée dans la famille voisine est préférable à une offre finance absente, et
c'est l'arbitrage qui a été fait. Attendez-vous à devoir itérer sur
`INCLUDE_KEYWORDS` et `EXCLUDE_KEYWORDS` une fois que vous verrez des données
réelles.
