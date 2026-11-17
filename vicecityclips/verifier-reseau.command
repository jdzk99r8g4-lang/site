#!/bin/bash
# ViceCityClips — diagnostic reseau.
#
# Double-cliquez sur ce fichier PENDANT que l'application tourne.
# Il verifie pourquoi l'iPhone n'arrive pas a se connecter, et affiche un
# resultat que vous pouvez copier-coller pour demander de l'aide.

cd "$(dirname "$0")" || exit 1
PORT="${PORT_API:-4317}"

echo ""
echo "  ViceCityClips — diagnostic reseau"
echo "  ════════════════════════════════════════════════════════"
echo ""

# --- 1. L'application tourne-t-elle ? -------------------------------

echo "  1. L'application est-elle en train de tourner ?"
echo ""

ECOUTE=""
if command -v lsof > /dev/null 2>&1; then
  ECOUTE=$(lsof -nP -iTCP:"$PORT" -sTCP:LISTEN 2>/dev/null | tail -n +2)
fi

if [ -n "$ECOUTE" ]; then
  echo "     OUI — quelque chose ecoute sur le port $PORT :"
  echo "$ECOUTE" | sed 's/^/        /'
  if echo "$ECOUTE" | grep -q "\*:$PORT"; then
    echo ""
    echo "     Bon signe : l'application accepte les connexions du reseau."
  else
    echo ""
    echo "     ATTENTION : l'application semble n'ecouter que sur cette machine."
    echo "     L'iPhone ne pourra pas s'y connecter."
  fi
else
  echo "     NON — rien n'ecoute sur le port $PORT."
  echo ""
  echo "     Lancez d'abord lancer.command, laissez sa fenetre ouverte,"
  echo "     puis relancez ce diagnostic."
  echo ""
  read -r -p "  Appuyez sur Entree pour fermer."
  exit 1
fi

# --- 2. Adresses reseau de ce Mac -----------------------------------

echo ""
echo "  2. Adresses a essayer sur l'iPhone"
echo ""

TROUVEE=0
if command -v networksetup > /dev/null 2>&1; then
  # On parcourt les interfaces reelles (Wi-Fi, Ethernet), pas les virtuelles.
  PORT_MATERIEL=""
  while IFS= read -r ligne; do
    case "$ligne" in
      "Hardware Port: "*) PORT_MATERIEL="${ligne#Hardware Port: }" ;;
      "Device: "*)
        PERIPH="${ligne#Device: }"
        ADRESSE=$(ipconfig getifaddr "$PERIPH" 2>/dev/null)
        if [ -n "$ADRESSE" ]; then
          echo "     http://$ADRESSE:$PORT     ($PORT_MATERIEL)"
          TROUVEE=1
        fi
        ;;
    esac
  done < <(networksetup -listallhardwareports 2>/dev/null)
fi

if [ "$TROUVEE" = "0" ]; then
  BRUT=$(ifconfig 2>/dev/null | grep "inet " | grep -v "127.0.0.1")
  [ -z "$BRUT" ] && BRUT=$(ip -4 addr 2>/dev/null | grep "inet " | grep -v "127.0.0.1")

  if [ -n "$BRUT" ]; then
    echo "     Methode habituelle sans resultat. Liste brute des adresses :"
    echo "$BRUT" | sed 's/^/        /'
  else
    echo "     AUCUNE adresse reseau detectee sur ce Mac."
    echo ""
    echo "     Le Wi-Fi est-il bien active et connecte a votre box ?"
    echo "     Verifiez dans Reglages Systeme → Wi-Fi, puis relancez"
    echo "     lancer.command et ce diagnostic."
  fi
fi

if [ "$TROUVEE" = "1" ]; then
  echo ""
  echo "     Essayez-les dans Safari sur l'iPhone, en commencant par celle"
  echo "     marquee Wi-Fi. Tapez bien http:// devant."
fi

# --- 3. Le Mac se repond-il a lui-meme sur le reseau ? --------------

echo ""
echo "  3. Test de connexion"
echo ""

ADRESSE_WIFI=$(ipconfig getifaddr en0 2>/dev/null)
[ -z "$ADRESSE_WIFI" ] && ADRESSE_WIFI=$(ipconfig getifaddr en1 2>/dev/null)

if command -v curl > /dev/null 2>&1; then
  if curl -s -m 4 -o /dev/null "http://127.0.0.1:$PORT/api/etat"; then
    echo "     Depuis le Mac lui-meme ......... OK"
  else
    echo "     Depuis le Mac lui-meme ......... ECHEC (l'application repond mal)"
  fi

  if [ -n "$ADRESSE_WIFI" ]; then
    if curl -s -m 4 -o /dev/null "http://$ADRESSE_WIFI:$PORT/api/etat"; then
      echo "     Par l'adresse Wi-Fi ............ OK"
      echo ""
      echo "     L'application est bien joignable sur le reseau."
      echo "     Si l'iPhone n'y arrive toujours pas, voir le point 4."
    else
      echo "     Par l'adresse Wi-Fi ............ BLOQUE"
      echo ""
      echo "     C'est tres probablement le pare-feu de macOS. Voir le point 4."
    fi
  fi
fi

# --- 4. Pare-feu macOS ----------------------------------------------

echo ""
echo "  4. Pare-feu de macOS"
echo ""

PAREFEU="/usr/libexec/ApplicationFirewall/socketfilterfw"
if [ -x "$PAREFEU" ]; then
  ETAT=$("$PAREFEU" --getglobalstate 2>/dev/null)
  echo "     $ETAT"
  BLOQUE_TOUT=$("$PAREFEU" --getblockall 2>/dev/null)
  [ -n "$BLOQUE_TOUT" ] && echo "     $BLOQUE_TOUT"
  echo ""
  if echo "$ETAT" | grep -qi "enabled"; then
    echo "     Le pare-feu est ACTIF. C'est la cause la plus frequente."
    echo ""
    echo "     Pour autoriser l'application :"
    echo "       Reglages Systeme  →  Reseau  →  Pare-feu  →  Options…"
    echo "       Cherchez « node » dans la liste et mettez-le sur"
    echo "       « Autoriser les connexions entrantes »."
    echo ""
    echo "     Si node n'est pas dans la liste, ajoutez-le avec le bouton +,"
    echo "     ou desactivez le pare-feu le temps de verifier que c'est bien lui."
  else
    echo "     Le pare-feu n'est pas actif : ce n'est pas lui qui bloque."
  fi
else
  echo "     Etat du pare-feu non lisible sur ce systeme."
fi

# --- 5. Rappels -----------------------------------------------------

echo ""
echo "  5. A verifier aussi sur l'iPhone"
echo ""
echo "     • Le Wi-Fi est actif ET c'est le MEME reseau que le Mac."
echo "       Coupez les donnees mobiles pour en etre sur."
echo "     • Vous tapez bien http:// devant l'adresse, pas https://"
echo "     • Vous n'etes pas sur un Wi-Fi « invite » : ces reseaux isolent"
echo "       les appareils les uns des autres, rien ne passera."
echo ""
echo "  ════════════════════════════════════════════════════════"
echo "  Copiez tout ce texte si vous voulez de l'aide."
echo ""
read -r -p "  Appuyez sur Entree pour fermer."
