# ViceCityClips — mode d'emploi

Votre tableau de pilotage de clipping. Le programme tourne **sur votre Mac**, mais
l'application est faite pour être **utilisée depuis votre iPhone**.

Aucun compte à créer, aucun abonnement, aucune clé. Vos données ne quittent jamais votre
ordinateur.

---

## 1. La première fois

### a) Mettre le dossier au bon endroit

Placez le dossier `vicecityclips` où vous voulez — par exemple dans **Documents**.
Évitez le Bureau si vous avez l'habitude de faire le ménage dessus : c'est ici que vivront
vos données.

### b) Y déposer votre fichier Excel

Copiez **`ViceCityClips - Tableau de pilotage.xlsx`** directement dans le dossier
`vicecityclips` (à côté du fichier `lancer.command`).

Au tout premier démarrage, l'application lira ce fichier et reprendra :

- les **réglages** (frais 10 %, taux 0,86 € pour 1 $, objectif 1 000 €) ;
- les **3 campagnes** (TOKYO-GIRL, TJR-REACH, KAI-POOL) ;
- les **2 comptes** (@ontherunclips, @encavaleclips) ;
- les **26 tâches** de la checklist.

> **Les lignes marquées EXEMPLE ne sont pas importées**, comme le demande votre onglet
> « Mode d'emploi ». Vos compteurs démarrent donc à zéro, et non à 12 400 vues : c'est voulu.

Si vous n'avez pas le fichier sous la main, ce n'est pas bloquant : l'application démarre
vide et vous saisissez tout à la main.

### c) Vérifier que Node.js est installé

Node.js est le seul outil nécessaire. Pour savoir s'il est déjà là, ouvrez l'application
**Terminal** (Spotlight : `⌘ + espace`, tapez « Terminal ») et tapez :

```
node -v
```

- Si une version s'affiche (`v20.…` ou plus récent), tout va bien.
- Si vous voyez `command not found`, le fichier `lancer.command` vous proposera de
  l'installer à l'étape suivante. **Il demandera votre accord avant quoi que ce soit.**

### d) Premier lancement

**Double-cliquez sur `lancer.command`.**

Une fenêtre Terminal s'ouvre et vous guide :

1. Si Node.js manque, le script propose de l'installer avec Homebrew (`brew install node`)
   et attend votre réponse — tapez `o` puis Entrée pour accepter, autre chose pour refuser.
   Si Homebrew n'est pas installé non plus, le script vous renvoie vers
   [brew.sh](https://brew.sh) ou [nodejs.org](https://nodejs.org).
2. Il propose ensuite d'installer les composants de l'application. Tapez `o` puis Entrée.
   Cette étape prend une à deux minutes et ne s'exécute **qu'une seule fois**. Tout est
   téléchargé dans le sous-dossier `node_modules` et nulle part ailleurs sur votre Mac.
3. L'application se prépare (une seconde ou deux) puis démarre, et affiche **l'adresse à
   ouvrir sur votre iPhone**.

> **Si macOS refuse d'ouvrir le fichier** (« autorisation refusée », ou rien ne se passe) :
> ouvrez le Terminal dans ce dossier et tapez une fois `chmod +x lancer.command`.
> Pour ouvrir le Terminal dans le dossier : clic droit sur le dossier → *Services* →
> *Nouveau terminal au dossier*.
>
> Si macOS dit que le fichier « provient d'un développeur non identifié » : clic droit sur
> `lancer.command` → **Ouvrir** → *Ouvrir* dans la fenêtre qui s'affiche. Cette autorisation
> n'est demandée qu'une fois.

---

## 2. Tous les jours : lancer l'application

**Double-cliquez sur `lancer.command`.** C'est tout.

Vous pouvez aussi, depuis le Terminal ouvert dans le dossier :

```
npm run dev
```

L'application tourne sur **une seule adresse**, que la fenêtre Terminal affiche :

- sur votre iPhone : `http://192.168.1.24:4317` (les chiffres changent chez vous) ;
- sur ce Mac, si besoin : <http://localhost:4317>.

La fenêtre Terminal doit **rester ouverte** tant que vous utilisez l'application : c'est elle
qui fait tourner le programme. Vous pouvez la réduire, mais pas la fermer.

### Arrêter l'application

Dans la fenêtre Terminal : `Ctrl + C`. Ou fermez simplement la fenêtre.
Vos données sont enregistrées au fur et à mesure, il n'y a rien à « sauvegarder » avant de
quitter.

---

## 3. Ouvrir depuis votre iPhone

Votre iPhone doit être sur **le même réseau Wi-Fi** que le Mac, et le Mac doit avoir
l'application lancée.

Au démarrage, la fenêtre Terminal affiche une adresse de ce genre :

```
  Sur votre iPhone (meme Wi-Fi), ouvrez Safari et tapez :

      http://192.168.1.24:4317
```

Tapez cette adresse dans Safari sur l'iPhone. Les chiffres changent selon votre réseau :
reprenez ceux affichés chez vous.

> **L'erreur la plus fréquente : oublier le `:4317` à la fin.**
>
> `192.168.1.24` tout seul ne marchera pas : Safari répondra « Safari n'a pas pu ouvrir la
> page car le serveur ne répondait plus ». Il faut l'adresse entière,
> **`http://192.168.1.24:4317`**, deux-points et quatre chiffres compris. Après l'ajout à
> l'écran d'accueil, vous n'aurez plus jamais à la retaper.

**Faites-le une seule fois :** dans Safari, bouton **Partager** (le carré avec la flèche) →
**Sur l'écran d'accueil**. Une icône ViceCityClips apparaît sur votre écran d'accueil, et
l'application s'ouvre en plein écran, sans barre d'adresse — comme une vraie application.
Vous n'aurez plus jamais à retaper l'adresse.

> L'adresse peut changer si votre box redistribue les adresses du réseau. Si l'icône n'ouvre
> plus rien, relancez `lancer.command` sur le Mac, regardez la nouvelle adresse affichée et
> refaites l'ajout à l'écran d'accueil.

### Si l'iPhone n'arrive pas à se connecter

**Commencez par là : double-cliquez sur `verifier-reseau.command`** (dans le même dossier que
`lancer.command`), pendant que l'application tourne. Il teste tout seul ce qui bloque, affiche
toutes les adresses à essayer, et vous dit quoi faire. C'est beaucoup plus rapide que de
chercher à l'aveugle.

Les causes, par ordre de fréquence :

**0. Le port oublié dans l'adresse.** Vérifiez d'abord ça : la barre d'adresse de Safari doit
afficher `192.168.1.24:4317`, et non `192.168.1.24` tout court. Sans le `:4317`, vous obtenez
exactement le message « le serveur ne répondait plus ».

**1. Le pare-feu de macOS.** C'est la cause numéro un. Au premier démarrage, macOS affiche une
fenêtre « Voulez-vous que l'application "node" accepte les connexions entrantes ? ». Si vous
avez cliqué **Refuser**, ou si la fenêtre est passée inaperçue, l'iPhone ne verra jamais
l'application.

Pour corriger : *Réglages Système → Réseau → Pare-feu → Options…*, cherchez **node** dans la
liste et mettez-le sur « Autoriser les connexions entrantes ». S'il n'y figure pas, ajoutez-le
avec le bouton **+**. Pour vérifier rapidement que c'est bien lui le coupable, vous pouvez
désactiver le pare-feu une minute, tester, puis le réactiver.

**2. La mauvaise adresse.** Si votre Mac a un VPN, un câble Ethernet ou un partage de
connexion, il a plusieurs adresses et l'application ne peut pas deviner laquelle mène à votre
iPhone. Elle les affiche désormais toutes : essayez-les l'une après l'autre, en commençant par
celle marquée Wi-Fi.

**3. Les deux appareils ne sont pas sur le même réseau.** Vérifiez que l'iPhone est bien en
Wi-Fi et pas en 4G/5G — coupez les données mobiles pour en être sûr. Attention aussi aux box
qui diffusent deux réseaux distincts (2,4 GHz et 5 GHz) : ce sont parfois deux réseaux séparés.

**4. La fenêtre Terminal a été fermée** sur le Mac. L'application ne tourne plus.
- Sur certains réseaux publics ou Wi-Fi « invité », les appareils sont isolés les uns des
  autres : l'adresse ne fonctionnera pas. Utilisez votre Wi-Fi personnel, ou le partage de
  connexion de votre iPhone (connectez le Mac au partage de l'iPhone, puis relancez
  l'application pour obtenir la nouvelle adresse).

### Un point à savoir

Pour que votre iPhone puisse s'y connecter, l'application est visible par **tous les appareils
du même réseau Wi-Fi**, et elle ne demande pas de mot de passe. Chez vous, cela n'a pas
d'importance. Mais évitez de la lancer sur un Wi-Fi partagé que vous ne maîtrisez pas
(campus, coworking, hôtel) : n'importe qui sur ce réseau pourrait ouvrir l'adresse et voir vos
données. Fermez la fenêtre Terminal quand vous ne vous en servez pas.

L'application n'est jamais accessible depuis internet : elle ne sort pas de votre réseau
local.

---

## 4. Les huit écrans

| Écran | À quoi il sert |
|---|---|
| **Tableau de bord** | Tous les indicateurs, la jauge vers l'objectif du mois, le graphique mois par mois |
| **Clips** | La liste de vos publications, filtrable, et la fiche de chaque clip |
| **Minuteur** | Le compte à rebours de 30 minutes après publication |
| **Campagnes** | Les conditions de chaque campagne et ce qu'elle vous a rapporté |
| **Comptes** | Vos comptes TikTok / Instagram / YouTube et leurs abonnés dans le temps |
| **Paiements** | Chaque versement reçu, converti en euros |
| **Checklist** | Vos 26 tâches de lancement, par phase |
| **Réglages** | Frais, taux de change, objectif, exports et sauvegardes |

Les quatre premiers écrans sont dans la barre du bas ; les autres sont derrière le bouton
**Plus**.

L'application est conçue **uniquement pour le téléphone**. Ouverte sur le Mac, elle garde
exactement la même présentation, en colonne étroite au centre de l'écran : c'est normal, et
cela vous évite d'apprendre deux interfaces.

Le bouton en haut à droite bascule entre **clair**, **sombre** et **automatique**.

---

## 5. Le geste du jour J

C'est la séquence pour laquelle l'application a été faite :

1. Vous publiez votre clip sur TikTok.
2. Vous ouvrez l'écran **Minuteur** sur votre iPhone, bouton **« Publié maintenant »**.
3. Vous choisissez le compte et la campagne, vous collez le lien, **Enregistrer**.
4. Le compte à rebours démarre à 30:00. Il passe **en orange à 10 minutes**, **en rouge à
   5 minutes**.
5. Vous soumettez le lien dans Content Rewards.
6. De retour dans l'application : bouton **« Soumis »**. L'heure est enregistrée et le délai
   calculé.

Plus tard (à J+3), vous ouvrez le clip dans l'écran **Clips** pour saisir les vues, le statut
et joindre la capture des statistiques.

---

## 6. Sauvegarder vos données

**Écran Réglages → « Télécharger une sauvegarde complète ».**

Vous obtenez un seul fichier `.zip` qui contient la base de données **et** toutes vos pièces
jointes. Rangez-le ailleurs que sur votre Mac : iCloud, un disque externe, une clé USB.

Faites-le au moins une fois par semaine, et toujours avant de bricoler quoi que ce soit dans
le dossier.

## 7. Restaurer une sauvegarde

**Écran Réglages → « Restaurer une sauvegarde »** → choisissez votre fichier `.zip` →
**Restaurer** → confirmez.

Deux choses à savoir :

- La restauration **remplace tout** le contenu actuel par celui de l'archive.
- Avant de remplacer, l'application met automatiquement l'état actuel de côté dans le
  sous-dossier `sauvegardes/`. Si vous vous êtes trompé de fichier, rien n'est perdu :
  restaurez cette copie de secours (son nom commence par `avant-restauration-`).

## 8. Exporter vers Excel ou CSV

**Écran Réglages → « Exporter mes données ».**

- **Export Excel (.xlsx)** : un classeur de 8 onglets (indicateurs, suivi mensuel, clips,
  campagnes, comptes, historique d'abonnés, paiements, checklist), valeurs calculées
  comprises. C'est le format à envoyer à un comptable.
- **Export CSV (.zip)** : un fichier CSV par onglet. Ils sont préparés pour Excel en
  français — séparateur point-virgule et virgule décimale — donc un double-clic suffit.

Un export n'est **pas** une sauvegarde : il ne contient pas vos images. Pour tout conserver,
utilisez la sauvegarde complète.

---

## 9. Où sont mes données ?

Tout est dans le dossier de l'application :

| Fichier / dossier | Contenu |
|---|---|
| `vicecityclips.db` | La base : clips, campagnes, comptes, paiements, checklist |
| `pieces-jointes/` | Vos captures d'écran et justificatifs |
| `sauvegardes/` | Les copies de secours créées avant chaque restauration |
| `exports/` | Dossier de travail des exports |

Si vous déplacez le dossier, déplacez-le **en entier**. Si vous le copiez sur un autre Mac,
relancez `lancer.command` : il réinstallera ce qu'il faut.

---

## 10. Comment les gains sont calculés

Ce sont exactement les règles de votre fichier Excel.

**Délai de soumission** = heure de soumission − heure de publication. Le passage de minuit est
géré : publié à 23:50, soumis à 00:10, cela fait 20 minutes.

**Gain brut estimé d'un clip** — *uniquement pour les campagnes de type CPM* :

1. `v = vues finales ÷ 1 000 × CPM`
2. Si le clip est **refusé** → **0**
3. Si `v` est **sous le paiement minimum** → **0**
4. Sinon `v`, **limité au plafond** par clip s'il y en a un

**Frais** = gain brut × 10 % (modifiable dans Réglages) — **Gain net** = gain brut − frais.

> Exemple, votre campagne TOKYO-GIRL (CPM 0,70 $, minimum 2 $, plafond 35 $), un clip à
> 12 400 vues :
> `12 400 ÷ 1 000 × 0,70 = 8,68 $` brut, moins 10 % de frais = **7,81 $ net**.

Les campagnes **Pool**, **Par post** et **Forfait** ne sont **pas estimées** : l'application
affiche « non estimé ». Notez le montant réellement reçu dans l'écran Paiements.

**Autres calculs :**

- Vues minimum d'une campagne = `paiement minimum ÷ CPM × 1 000`
- Paiement : `net $ = brut − frais de retrait`, puis `net € = net $ × taux`
  (le taux de la ligne s'il est renseigné, sinon le taux par défaut des Réglages)
- Taux d'approbation = `(approuvés + payés) ÷ (approuvés + payés + refusés)`.
  Affiche « — » tant qu'aucun clip n'a été tranché.
- Reste à recevoir = `max(0, gain net estimé approuvé ou payé − paiements reçus nets $)`

**Une estimation reste une estimation.** Seul ce qui apparaît dans Content Rewards puis dans
Whop fait foi.

---

## 11. En cas de problème

**« Le port 4317 est déjà utilisé »**
L'application tourne déjà dans une autre fenêtre Terminal. Fermez-la, ou ouvrez simplement
l'adresse affichée par cette autre fenêtre.

**L'installation échoue en parlant de `better-sqlite3` ou de compilation**
Il manque les outils de développement d'Apple. Dans le Terminal :
```
xcode-select --install
```
Acceptez la fenêtre qui s'ouvre, attendez la fin, puis relancez `lancer.command`.

**La page affiche « Impossible de joindre le serveur de l'application »**
La fenêtre Terminal a été fermée. Relancez `lancer.command`.

**L'iPhone n'affiche rien alors que le Mac fonctionne**
Double-cliquez sur `verifier-reseau.command` pendant que l'application tourne : il identifie
la cause et affiche les adresses à essayer. Voir aussi la section 3.

**J'ai tout cassé en bidouillant**
Restaurez votre dernière sauvegarde (section 7). Si vous n'en avez pas et que vous voulez
repartir du fichier Excel : Réglages → « Réimporter depuis le fichier Excel ». Attention,
cela efface tout ce que vous avez saisi depuis.

**Je veux réinstaller de zéro**
Supprimez le sous-dossier `node_modules` et relancez `lancer.command`. Vos données
(`vicecityclips.db` et `pieces-jointes/`) ne sont pas touchées.

---

## 12. Ce qui a été vérifié, et ce qui reste à confirmer chez vous

Par honnêteté, voici la limite de ce qui a pu être testé avant de vous livrer l'application.

**Vérifié pour de bon**, sur machine Linux :

- les 58 tests automatiques des règles de calcul, dont vos cinq cas de référence ;
- l'import de votre vrai fichier Excel : 3 campagnes, 2 comptes, 26 tâches, les 2 lignes
  EXEMPLE écartées, et des indicateurs identiques à ceux de votre onglet Tableau de bord ;
- les huit écrans dans un vrai navigateur au format iPhone, en clair et en sombre, sans
  aucune erreur, et sans le moindre débordement sur les côtés ;
- un parcours complet : publier, compte à rebours, soumettre, saisir les vues, voir 7,81 $,
  filtrer, enregistrer un paiement converti en euros, cocher la checklist, changer l'objectif ;
- les seuils de couleur du minuteur, et le cycle complet sauvegarde → suppression →
  restauration ;
- l'accès par l'adresse réseau (celle que tapera votre iPhone) : page, données, icône et
  manifeste répondent tous correctement.

**À confirmer chez vous, au premier lancement** (impossible à tester ailleurs que sur votre
Mac et votre iPhone) :

- le double-clic sur `lancer.command` et la détection de Node.js par Homebrew ;
- l'installation de `better-sqlite3` sur macOS ;
- l'ouverture depuis l'iPhone sur votre Wi-Fi, et l'ajout à l'écran d'accueil.

Un détail d'affichage, aussi : les champs de date utilisent le sélecteur natif de l'appareil.
Sur un iPhone réglé en français, il affiche JJ/MM/AAAA. Le navigateur de test utilisé ici n'a
pas les données de langue française et affichait l'ordre américain : je n'ai donc pas pu le
vérifier moi-même. Dans tous les cas la date enregistrée est la bonne, le format interne étant
non ambigu.

Si l'un de ces points coince, la section 11 donne la marche à suivre.

---

## 13. Pour votre comptabilité

Votre onglet « Mode d'emploi » le rappelait, l'application le reprend : ces revenus sont en
principe à déclarer en France. Le régime qui s'applique à votre situation d'étudiant est à
vérifier auprès d'**impots.gouv.fr**, de l'**Urssaf** ou d'un comptable — l'application ne
tranche pas cette question, elle garde seulement les traces dont vous aurez besoin :

- le lien de chaque publication et l'identifiant de chaque campagne ;
- les captures de statistiques jointes aux clips ;
- la référence de transaction, le justificatif et le montant en euros au taux du jour de
  chaque paiement ;
- la case « Déclaré aux impôts » à cocher au fur et à mesure.
