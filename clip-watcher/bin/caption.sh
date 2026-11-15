#!/usr/bin/env bash
# Transcrit un extrait avec whisper.cpp puis incruste les sous-titres.
# usage: caption.sh <clip.mp4> [sortie.mp4]
set -euo pipefail
SRC="${1:?usage: caption.sh <clip.mp4> [sortie.mp4]}"
DST="${2:-${SRC%.mp4}-sub.mp4}"
MODEL="${WHISPER_MODEL:-ggml-medium.en.bin}"
BIN="${WHISPER_BIN:-whisper-cli}"

command -v "$BIN" >/dev/null || { echo "$BIN absent (voir doctor.sh)" >&2; exit 127; }
[ -r "$MODEL" ] || { echo "modele $MODEL introuvable" >&2; exit 1; }

# whisper.cpp veut du WAV 16 kHz mono.
WAV="${SRC%.mp4}.wav"
ffmpeg -nostdin -hide_banner -loglevel error -y -i "$SRC" -ar 16000 -ac 1 "$WAV"
"$BIN" -m "$MODEL" -f "$WAV" -osrt -of "${SRC%.mp4}"   # -> <clip>.srt

ffmpeg -nostdin -hide_banner -loglevel warning -y -i "$SRC" \
  -vf "subtitles=${SRC%.mp4}.srt:force_style='FontSize=20,Outline=2,Alignment=2'" \
  -c:a copy "$DST"
rm -f "$WAV"
echo "$DST"
