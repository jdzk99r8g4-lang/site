#!/usr/bin/env bash
# Coupe un extrait autour d'un instant du chat (epoch), sans reencoder.
# usage: clip.sh <epoch_du_pic> [stream.ts] [sortie.mp4]
set -euo pipefail
AT="${1:?usage: clip.sh <epoch> [stream.ts] [clip.mp4]}"
SRC="${2:-stream.ts}"
DST="${3:-}"
LEAD="${CLIP_LEAD:-30}"      # le chat reagit apres coup : on recule
DUR="${CLIP_DUR:-45}"
START_FILE="${SRC%.ts}.start"

[ -r "$SRC" ] || { echo "$SRC illisible" >&2; exit 1; }
[ -r "$START_FILE" ] || { echo "$START_FILE manquant (t0 du flux)" >&2; exit 1; }

T0=$(cat "$START_FILE")
OFFSET=$(awk -v a="$AT" -v z="$T0" -v l="$LEAD" 'BEGIN{o=a-z-l; if(o<0)o=0; printf "%.3f", o}')
[ -n "$DST" ] || DST="clips/clip_$(date -u -d "@$AT" +%Y%m%d-%H%M%S 2>/dev/null || echo "$AT").mp4"
mkdir -p "$(dirname "$DST")"

# -ss avant -i : recherche rapide, mais elle tombe sur l'image-cle precedente,
# donc le debut reel peut devancer la consigne de quelques secondes.
ffmpeg -nostdin -hide_banner -loglevel warning -y \
  -ss "$OFFSET" -t "$DUR" -i "$SRC" -c copy "$DST"
echo "$DST"
