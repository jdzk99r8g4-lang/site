#!/usr/bin/env bash
# Enregistre la chaine des la mise en ligne. Ecrit aussi l'instant de depart
# reel, dont clip.sh a besoin pour convertir une heure en position dans le .ts.
set -euo pipefail
CHANNEL="${1:?usage: record.sh <chaine> [sortie.ts]}"
OUT="${2:-stream.ts}"
QUALITY="${CLIP_QUALITY:-best}"

command -v streamlink >/dev/null || { echo "streamlink absent" >&2; exit 127; }

# --retry-streams attend que la chaine passe en live au lieu d'echouer.
streamlink "twitch.tv/${CHANNEL}" "$QUALITY" \
  -o "$OUT" \
  --retry-streams 30 \
  --retry-max 0 \
  --twitch-disable-ads \
  --stream-segment-attempts 10 \
  --force &
SL=$!

# Le fichier n'existe qu'une fois le live commence : c'est la notre t=0.
while [ ! -s "$OUT" ]; do
  kill -0 "$SL" 2>/dev/null || { wait "$SL"; exit $?; }
  sleep 1
done
date +%s > "${OUT%.ts}.start"
echo "[record] enregistrement demarre -> $OUT (t0 dans ${OUT%.ts}.start)" >&2
wait "$SL"
