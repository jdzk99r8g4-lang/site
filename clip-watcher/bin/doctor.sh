#!/usr/bin/env bash
# Dit ce qui manque, et comment l'installer, sans rien installer.
ok=0
check() {
  if command -v "$1" >/dev/null; then
    printf '  OK      %-12s %s\n' "$1" "$(command -v "$1")"
  else
    printf '  MANQUE  %-12s %s\n' "$1" "$2"; ok=1
  fi
}
echo "clip-watcher — dependances"
check streamlink  "pipx install streamlink  (ou pip install streamlink)"
check ffmpeg      "apt install ffmpeg / brew install ffmpeg"
check ffprobe     "fourni avec ffmpeg"
check python3     "deja la sur la plupart des systemes"
check whisper-cli "whisper.cpp : make, puis build/bin/whisper-cli — verifiez le nom du binaire dans le README du projet, il a change au fil des versions (WHISPER_BIN pour le forcer)"
echo
if [ -r "${WHISPER_MODEL:-ggml-medium.en.bin}" ]; then
  echo "  OK      modele       ${WHISPER_MODEL:-ggml-medium.en.bin}"
else
  echo "  MANQUE  modele       ${WHISPER_MODEL:-ggml-medium.en.bin} (script download-ggml-model de whisper.cpp)"
fi
echo
[ $ok -eq 0 ] && echo "Tout est la." || echo "Les sous-titres sont optionnels : sans whisper, watch.sh coupe quand meme."
exit 0
