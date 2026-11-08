# Conformité — ce qui est tranché, et ce qui ne l'est pas

Ce document dit ce que le code fait réellement. Il ne remplace pas un conseil
juridique, et plusieurs points ne peuvent être réglés qu'avec des informations
que seul l'éditeur possède.

---

## Mesure d'audience : aucun traceur

### Ce que dit la CNIL

La page « Cookies : solutions pour les outils de mesure d'audience »,
**mise à jour le 4 juillet 2025**, fixe les conditions de l'exemption de
consentement prévue à l'article 82 de la loi Informatique et Libertés. Les
traceurs doivent :

- servir une finalité strictement limitée à la mesure d'audience du site, pour
  le compte exclusif de l'éditeur ;
- produire uniquement des données statistiques anonymes.

Et ils ne doivent pas :

- conduire à un recoupement avec d'autres traitements, ni à la transmission de
  données non anonymes à des tiers ;
- permettre le suivi de la navigation d'une personne à travers plusieurs sites.

Deux points que la page a changés et qu'on lit encore souvent de travers :

1. **la CNIL ne publie plus de liste de solutions exemptées.** Elle met à
   disposition un outil d'**auto-évaluation** destiné aux fournisseurs. C'est au
   responsable de traitement de démontrer sa conformité ;
2. **le terme « certifié CNIL » est interdit**, de même que l'usage de son logo
   ou d'un logo dérivé. Rien, ici ou ailleurs, ne doit présenter une solution
   comme « certifiée » ou « validée par la CNIL ».

### Ce que fait JuniorDesk

Côté mesure, rien n'est déposé : pas de cookie de mesure, pas de
`localStorage`, pas d'identifiant de visiteur, pas de script tiers. La mesure
ne lit ni n'écrit rien sur le terminal, donc **l'article 82 ne la concerne
pas**.

Un seul cookie existe sur ce site, `jd_session`, et seulement pour les
personnes connectées à un compte. Il contient un identifiant de session
aléatoire et rien d'autre. Il relève d'une exemption **différente** : celle du
strictement nécessaire à un service expressément demandé. Il n'est jamais lu
par le code de mesure, et aucun compteur ne le consulte.

Conséquence rédactionnelle, et elle compte : le site ne doit plus dire « aucun
cookie ». Il dit « aucun traceur, et un seul cookie, celui qui vous garde
connecté ». La nuance n'est pas cosmétique — une promesse fausse sur ce sujet
décrédibilise tout le reste de la page.

Les compteurs sont des totaux tenus côté serveur :

| Seau | Clé comptée |
|---|---|
| `clics:AAAA-MM` | identifiant d'offre |
| `clics-metier:AAAA-MM` | famille de métier |
| `clics-ville:AAAA-MM` | ville |
| `clics-alertes:AAAA-MM` | identifiant d'inscription (voir plus bas) |

Aucune adresse IP n'y entre. Chaque seau est mensuel et porte une expiration de
**25 mois** — la durée maximale recommandée par la CNIL — posée à chaque
incrément. La promesse est donc appliquée par le code, pas seulement écrite dans
une page.

### Suivi des clics depuis les e-mails d'alerte

Les inscrits ont donné un consentement explicite par double confirmation. Leurs
clics depuis les e-mails d'alerte sont donc rattachés à leur inscription, pour
mesurer l'utilité réelle des alertes.

Ce qui est conservé : **un total mensuel de clics par inscription**. Pas
d'historique, pas de chronologie, pas de liste des offres cliquées. Le
rattachement n'a lieu que si le lien porte `src=alerte` et un jeton HMAC valide
— un visiteur ordinaire n'est jamais rattaché à quoi que ce soit.

C'est annoncé à trois endroits : dans le formulaire d'inscription, dans chaque
e-mail, et dans la politique de confidentialité.

---

## Journaux de l'hébergeur — **point non résolu**

Tout hébergeur journalise les requêtes, et ces journaux contiennent des adresses
IP, qui sont des données personnelles.

Pour Vercel, la documentation publique indique des fenêtres de rétention des
journaux d'exécution (1 heure en offre Hobby, 1 jour en Pro, 30 jours avec
Observability Plus), les charges utiles de log drains contiennent un champ
`proxy.clientIp`, et la documentation Monitoring précise que les adresses IP
continuent d'être collectées à des fins de sécurité même lorsque leur affichage
est masqué.

**Aucune durée de conservation propre aux adresses IP n'est publiée.** La
politique de confidentialité porte donc un champ `[À CONFIRMER]` à cet endroit.
Avant publication :

1. relevez la durée réelle dans le contrat de sous-traitance (DPA) de
   l'hébergeur retenu ;
2. reportez-la dans `src/app/confidentialite/page.tsx` ;
3. ne confondez pas la durée d'**affichage** des journaux dans l'interface avec
   un engagement de **suppression**.

---

## Alertes e-mail

- **Base légale** : consentement, par double opt-in. L'inscription n'est active
  qu'après le clic sur le lien envoyé. Sans ce mécanisme, n'importe qui pourrait
  inscrire l'adresse d'un tiers.
- **Données** : adresse e-mail, critères, dates de création, de confirmation et
  de dernier envoi. Rien d'autre.
- **Liens** : signés en HMAC-SHA256, comparés en temps constant, valables
  30 jours. L'identifiant d'inscription circule dans l'URL — **jamais
  l'adresse**, qui n'a rien à faire dans les journaux d'un proxy ou un
  historique de navigation.
- **Désinscription** : un clic, et l'inscription est **supprimée**, pas
  désactivée. Rien n'est gardé « au cas où ».
- **Journaux** : les adresses sont masquées (`pr****@domaine.fr`) avant d'être
  écrites.

---

## Comptes étudiants

### Ce qui est collecté

Adresse e-mail, empreinte du mot de passe, dates de création, de confirmation
et de dernière connexion, offres mises de côté, offres notées « postulé ». Rien
d'autre : ni nom, ni prénom, ni école, ni niveau d'études, ni CV. Le formulaire
d'inscription ne les demande pas, et aucun champ caché ne les devine.

**Base légale** : exécution du service demandé par la personne en créant le
compte.

### Mot de passe

Haché avec **scrypt** (N=16384, r=8, p=1, clé de 64 octets), sel aléatoire de
16 octets par compte, comparaison en temps constant. Le mot de passe en clair
n'est jamais écrit nulle part, journaux compris, et il est irrécupérable — y
compris par nous.

Longueur minimale de dix caractères, sans règle de composition. Les règles du
type « une majuscule, un chiffre, un caractère spécial » produisent surtout
« Motdepasse1! », que les outils d'attaque connaissent ; la longueur, elle,
protège réellement.

### Ce que le formulaire ne révèle pas

Un formulaire d'inscription ou de connexion mal fait devient un annuaire :
il suffit de tester des adresses pour savoir qui est inscrit. Trois mesures :

1. l'inscription répond la même chose que l'adresse soit déjà connue ou non ;
   dans le premier cas, c'est un e-mail différent qui part vers la boîte du
   propriétaire légitime ;
2. la connexion renvoie un message identique pour « adresse inconnue » et
   « mot de passe faux » ;
3. un hachage est calculé même en l'absence de compte, pour que le temps de
   réponse ne distingue pas les deux cas non plus.

### Session

Identifiant aléatoire de 32 octets, stocké côté serveur et donc révocable.
Cookie `httpOnly` (illisible par script), `SameSite=Lax`, `Secure` en
production, durée de trente jours. Supprimé à la déconnexion, et toutes les
sessions d'un compte sont révoquées à sa suppression.

### Limitation des tentatives

Dix tentatives de connexion par compte et par quart d'heure. Au-delà, le refus
est opposé même avec le bon mot de passe pendant la fenêtre.

### Suppression

Déclenchable par la personne elle-même depuis son espace, derrière une case à
cocher. Elle efface le compte, ses sessions, ses offres enregistrées, ses
candidatures notées et l'alerte e-mail associée. Rien n'est conservé.

### Ce qui manque

La **réinitialisation de mot de passe** n'est pas implémentée. La page de
connexion l'indique et propose d'écrire pour faire supprimer le compte. À
traiter avant d'ouvrir le site largement : sans elle, toute personne qui oublie
son mot de passe perd ses offres enregistrées.

---

## Rediffusion des offres

La documentation de l'API La bonne alternance autorise explicitement l'exposition
des offres « for free and under a white-label format ». Le modèle gratuit du
site n'est donc pas un choix commercial que l'on pourrait revoir à la légère :
c'est la condition de la licence.

Chaque offre affiche sa provenance et renvoie vers le site de l'employeur. Le
site ne reçoit aucune candidature.

---

## Données personnelles présentes dans les offres

Une offre peut contenir le nom d'un contact lorsque la source le transmet. Ces
données ne sont ni sollicitées, ni enrichies, ni exploitées autrement que pour
l'affichage. Une offre retirée de sa source disparaît à la collecte suivante.

Prévoyez une adresse de signalement et traitez sans discussion toute demande de
retrait émanant d'un employeur — elle est renseignée dans les mentions légales.

---

## Ce qui n'est pas tranché

1. **Identité juridique.** Les mentions légales et la politique de
   confidentialité portent des champs `[À COMPLÉTER]`. Elles ne sont pas
   publiables en l'état, et `NEXT_PUBLIC_ALLOW_INDEXING` doit rester à `false`
   tant qu'ils subsistent. L'arrivée des comptes rend ce point plus pressant :
   un service qui conserve des adresses e-mail et des mots de passe doit
   nommer son responsable de traitement.
2. **Durée de conservation des IP par l'hébergeur** (voir plus haut).
3. **Sous-traitants et transferts hors UE** : à renseigner une fois les
   prestataires choisis.
4. **Données structurées `JobPosting`.** Elles ne sont volontairement **pas**
   implémentées : les règles de Google pour les agrégateurs qui rediffusent des
   offres n'ont pas été vérifiées sur une documentation à jour, et un balisage
   mal employé expose à une pénalité plutôt qu'à un gain. À traiter comme un
   sujet à part entière, documentation en main.
