#!/usr/bin/env bash
# La boucle complete : enregistre, logue le chat, coupe a chaque pic.
# usage: watch.sh <chaine> [dossier_de_travail]
set -euo pipefail
CHANNEL="${1:?usage: watch.sh <chaine> [dossier]}"
WORK="${2:-sessions/${CHANNEL}-$(date -u +%Y%m%d-%H%M%S)}"
HERE="$(cd "$(dirname "$0")" && pwd)"
INTERVAL="${CLIP_INTERVAL:-30}"      # on relit le log toutes les N secondes
CAPTION="${CLIP_CAPTION:-0}"         # 1 pour incruster les sous-titres

mkdir -p "$WORK/clips"
cd "$WORK"
echo "[watch] dossier : $PWD" >&2

"$HERE/record.sh" "$CHANNEL" stream.ts & REC=$!
python3 "$HERE/chatlog.py" "$CHANNEL" -o chat.log & CHAT=$!
trap 'kill $REC $CHAT 2>/dev/null || true' EXIT INT TERM

# On attend le live : record.sh ecrit stream.start a cet instant.
while [ ! -r stream.start ]; do
  kill -0 $REC 2>/dev/null || { echo "[watch] enregistrement arrete" >&2; exit 1; }
  sleep 2
done

touch clipped.txt
while kill -0 $REC 2>/dev/null; do
  sleep "$INTERVAL"
  [ -s chat.log ] || continue
  while IFS=$'\t' read -r at count avg ratio; do
    [ -n "${at:-}" ] || continue
    grep -qx "$at" clipped.txt && continue
    # Le pic doit etre deja enregistre, marge d'une tranche.
    now=$(date +%s); [ $((now - at)) -ge 20 ] || continue
    echo "$at" >> clipped.txt
    echo "[watch] pic a $(date -u -d "@$at" +%H:%M:%S) — $count msg, ${ratio} la moyenne" >&2
    out=$("$HERE/clip.sh" "$at" stream.ts) || continue
    echo "$at	$count	$ratio	$out" >> clips/index.tsv
    if [ "$CAPTION" = "1" ]; then
      "$HERE/caption.sh" "$out" || echo "[watch] sous-titres echoues pour $out" >&2
    fi
  done < <(python3 "$HERE/spikes.py" chat.log --cooldown "${CLIP_COOLDOWN:-60}")
done
echo "[watch] fini. Extraits dans $PWD/clips" >&2
