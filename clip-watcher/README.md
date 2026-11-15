# clip-watcher

Un dossier qui enregistre un live Twitch, lit son chat sans compte, et découpe
un extrait partout où le chat s'emballe — pendant que vous dormez.

```bash
bin/doctor.sh            # ce qui manque et comment l'installer
bin/watch.sh <chaine>    # la boucle complète
```

`watch.sh` crée `sessions/<chaine>-<date>/` et y place `stream.ts`, `chat.log`,
et `clips/` avec un `index.tsv` (instant du pic, nombre de messages, ratio,
fichier).

## Les six pièces

| Fichier | Rôle |
|---|---|
| `bin/record.sh` | `streamlink … --retry-streams 30` : attend la mise en ligne, puis enregistre. Écrit aussi `stream.start`, l'instant réel du début. |
| `bin/chatlog.py` | IRC `irc.chat.twitch.tv:6667`, nick `justinfan<random>`, lecture seule, aucun token. Une ligne par message : `epoch⇥auteur⇥texte`. |
| `bin/spikes.py` | Compte les messages par tranche de 10 s, retient celles qui dépassent 3× la moyenne des 5 minutes précédentes. |
| `bin/clip.sh` | `ffmpeg -ss … -t 45 -c copy` : découpe sans réencoder, 30 s avant le pic. |
| `bin/caption.sh` | whisper.cpp → `.srt`, puis incrustation. Optionnel. |
| `bin/watch.sh` | Enchaîne tout et boucle toutes les 30 s. |

## Réglages (variables d'environnement)

`CLIP_LEAD=30` recul avant le pic · `CLIP_DUR=45` durée · `CLIP_QUALITY=best`
· `CLIP_INTERVAL=30` fréquence de relecture du log · `CLIP_COOLDOWN=60` écart
minimum entre deux pics · `CLIP_CAPTION=1` sous-titres · `WHISPER_MODEL`,
`WHISPER_BIN`.

Le seuil se règle directement : `python3 bin/spikes.py chat.log --factor 4
--width 15 --min-count 10`.

## Ce qui a été vérifié, et ce qui ne l'a pas été

Testé ici : `spikes.py` sur un log synthétique (pic de 30 messages contre une
moyenne de 2 → détecté à 15×), le parsing IRC, et `clip.sh` sur un `.ts`
généré par ffmpeg (45,0 s en copie de flux).

**Pas testé, faute de live et de binaires dans cet environnement** :
`record.sh` (streamlink absent), la connexion IRC réelle, et `caption.sh`
(whisper absent). À essayer sur une vraie chaîne avant de compter dessus.

Deux réserves honnêtes :

- `-ss` placé avant `-i` avec `-c copy` tombe sur l'image-clé précédente, donc
  le début réel peut devancer la consigne de quelques secondes. C'est voulu
  (c'est rapide, et on cherche du contexte avant le moment), mais ce n'est pas
  une coupe à l'image près. Pour ça il faut réencoder.
- Le nom du binaire whisper.cpp a changé selon les versions (`main`, puis
  `whisper-cli`). Vérifiez-le dans le README de whisper.cpp de votre version ;
  `WHISPER_BIN` permet de le forcer. Je ne garantis pas non plus que les
  options exactes de `streamlink` et de `whisper-cli` citées ici correspondent
  à la version que vous installerez — confirmez avec `--help`.

Rien de tout ça ne fonctionne hors live : Twitch ne sert le flux et le chat
qu'en direct.

## Une règle

Découpez, créditez, liez la chaîne du streamer. Son travail, son audience.
