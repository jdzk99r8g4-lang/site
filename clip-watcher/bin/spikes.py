#!/usr/bin/env python3
"""Trouve les pics d'activite dans un chat.log produit par chatlog.py.

Regle : on compte les messages par tranche de N secondes, et on retient une
tranche quand son compte depasse FACTEUR x la moyenne des tranches de la
fenetre precedente (5 minutes par defaut).

Sortie TSV : epoch_debut_tranche  compte  moyenne_fenetre  ratio
"""
import argparse
import sys


def load(path):
    times = []
    fh = sys.stdin if path == "-" else open(path, encoding="utf-8")
    with fh:
        for line in fh:
            part = line.split("\t", 1)[0]
            try:
                times.append(float(part))
            except ValueError:
                continue
    times.sort()
    return times


def buckets(times, width):
    """-> (index_de_tranche -> compte, premier_index, dernier_index)"""
    if not times:
        return {}, 0, -1
    counts = {}
    for t in times:
        idx = int(t // width)
        counts[idx] = counts.get(idx, 0) + 1
    return counts, int(times[0] // width), int(times[-1] // width)


def spikes(times, width=10, window=300, factor=3.0, min_count=5,
           cooldown=0):
    counts, first, last = buckets(times, width)
    back = max(1, int(window // width))
    out = []
    last_hit = None
    for idx in range(first, last + 1):
        c = counts.get(idx, 0)
        if c < min_count:
            continue
        prev = [counts.get(j, 0) for j in range(idx - back, idx)]
        if len(prev) < back:
            continue
        avg = sum(prev) / len(prev)
        if avg <= 0:
            continue
        ratio = c / avg
        if ratio < factor:
            continue
        start = idx * width
        if last_hit is not None and start - last_hit < cooldown:
            continue
        last_hit = start
        out.append((start, c, avg, ratio))
    return out


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("log", nargs="?", default="chat.log")
    ap.add_argument("--width", type=int, default=10, help="tranche, secondes")
    ap.add_argument("--window", type=int, default=300,
                    help="fenetre de reference, secondes")
    ap.add_argument("--factor", type=float, default=3.0)
    ap.add_argument("--min-count", type=int, default=5,
                    help="ignore les tranches sous ce nombre de messages")
    ap.add_argument("--cooldown", type=int, default=60,
                    help="secondes minimum entre deux pics retenus")
    a = ap.parse_args()
    for start, c, avg, ratio in spikes(load(a.log), a.width, a.window,
                                       a.factor, a.min_count, a.cooldown):
        print("%.0f\t%d\t%.2f\t%.2fx" % (start, c, avg, ratio))
