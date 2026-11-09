#!/usr/bin/env bash
# Applique le défaut que ce cas de test sert à détecter.
#
# À lancer depuis la racine du projet (juniordesk/), sur une COPIE jetable —
# jamais sur le dépôt de travail.
#
# Le défaut : la grille rend toutes les offres filtrées au lieu de la page
# courante. `paginate` reste correct et le compteur continue d'annoncer
# « Offres 1 à 6 sur 20 », mais la page affiche les vingt.
#
# Son intérêt comme épreuve : les 211 tests unitaires passent. Ils vérifient
# ce que `paginate` renvoie, pas ce que la page en fait. Une vérification qui
# s'arrête aux tests conclut donc que tout va bien, et se trompe. Seul le site
# en marche montre l'écart.
set -eu

CIBLE=${1:-.}
python3 -I - "$CIBLE" <<'PY'
import io, sys
p = sys.argv[1] + '/src/app/offres/page.tsx'
s = io.open(p, encoding='utf-8').read()
for old, new in (('{paged.items.length > 0 ? (', '{results.length > 0 ? ('),
                 ('{paged.items.map((offer) => (', '{results.map((offer) => (')):
    assert s.count(old) == 1, 'motif introuvable, le fichier a change : ' + old
    s = s.replace(old, new)
io.open(p, 'w', encoding='utf-8').write(s)
PY
echo "defaut applique dans $CIBLE/src/app/offres/page.tsx"
