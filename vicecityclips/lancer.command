#!/bin/bash
# ViceCityClips — double-cliquez sur ce fichier pour lancer l'application.
#
# Si macOS refuse de l'ouvrir ("autorisation refusee"), ouvrez le Terminal
# dans ce dossier et lancez une seule fois :  chmod +x lancer.command

cd "$(dirname "$0")" || exit 1

echo ""
echo "  ViceCityClips"
echo "  ────────────────────────────────────────────────────"
echo ""

# --- 1. Node.js est-il installe ? -----------------------------------

# Les emplacements habituels de Homebrew ne sont pas toujours dans le PATH
# d'une fenetre ouverte par double-clic.
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

if ! command -v node > /dev/null 2>&1; then
  echo "  Node.js n'est pas installe sur cet ordinateur."
  echo "  C'est le seul outil necessaire pour faire tourner l'application."
  echo ""

  if command -v brew > /dev/null 2>&1; then
    echo "  Homebrew est deja installe. Je peux installer Node.js avec :"
    echo ""
    echo "      brew install node"
    echo ""
    printf "  Lancer cette installation maintenant ? [o/N] "
    read -r reponse
    case "$reponse" in
      o | O | oui | OUI)
        echo ""
        brew install node || {
          echo ""
          echo "  L'installation a echoue. Relancez ce fichier une fois Node.js installe."
          echo ""
          read -r -p "  Appuyez sur Entree pour fermer."
          exit 1
        }
        ;;
      *)
        echo ""
        echo "  Installation annulee. Rien n'a ete modifie."
        echo "  Relancez ce fichier quand Node.js sera installe."
        echo ""
        read -r -p "  Appuyez sur Entree pour fermer."
        exit 1
        ;;
    esac
  else
    echo "  Deux facons de l'installer :"
    echo ""
    echo "   1. Avec Homebrew (gestionnaire de paquets pour Mac) :"
    echo "      installez d'abord Homebrew en suivant les instructions"
    echo "      de la page officielle  https://brew.sh"
    echo "      puis relancez ce fichier : il proposera d'installer Node.js."
    echo ""
    echo "   2. Sans Homebrew : telechargez l'installeur macOS (version LTS)"
    echo "      sur  https://nodejs.org  et suivez les etapes."
    echo ""
    read -r -p "  Appuyez sur Entree pour fermer."
    exit 1
  fi
fi

echo "  Node.js detecte : $(node -v)"

# --- 2. Les dependances sont-elles installees ? ---------------------

if [ ! -d node_modules ] || [ ! -x node_modules/.bin/vite ]; then
  echo ""
  echo "  Les composants de l'application ne sont pas encore installes."
  echo "  Ils seront telecharges dans le sous-dossier node_modules de ce"
  echo "  dossier, et nulle part ailleurs sur votre Mac."
  echo ""
  printf "  Lancer l'installation maintenant ? [o/N] "
  read -r reponse
  case "$reponse" in
    o | O | oui | OUI)
      echo ""
      npm install || {
        echo ""
        echo "  L'installation a echoue."
        echo "  Si le message parle de 'better-sqlite3' ou de compilation,"
        echo "  installez les outils de developpement Apple puis reessayez :"
        echo ""
        echo "      xcode-select --install"
        echo ""
        read -r -p "  Appuyez sur Entree pour fermer."
        exit 1
      }
      ;;
    *)
      echo ""
      echo "  Installation annulee. Rien n'a ete modifie."
      echo ""
      read -r -p "  Appuyez sur Entree pour fermer."
      exit 1
      ;;
  esac
fi

# --- 3. Lancement ---------------------------------------------------

echo ""
echo "  Demarrage… (laissez cette fenetre ouverte)"

npm run dev

echo ""
echo "  ViceCityClips est arrete."
read -r -p "  Appuyez sur Entree pour fermer cette fenetre."
