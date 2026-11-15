#!/usr/bin/env python3
"""Logue le chat Twitch d'une chaine, en lecture seule, sans compte.

Connexion IRC anonyme : nick justinfan<random>, aucun token.
Chaque message PRIVMSG donne une ligne : <epoch_float>\t<auteur>\t<texte>
"""
import argparse
import random
import socket
import sys
import time

HOST = "irc.chat.twitch.tv"
PORT = 6667


def parse_privmsg(line):
    """-> (auteur, texte) ou None si ce n'est pas un message de chat."""
    if not line.startswith(":"):
        return None
    try:
        prefix, rest = line[1:].split(" ", 1)
    except ValueError:
        return None
    if not rest.startswith("PRIVMSG "):
        return None
    try:
        _, payload = rest.split(" :", 1)
    except ValueError:
        return None
    return prefix.split("!", 1)[0], payload


def run(channel, out, reconnect_delay=5.0):
    channel = channel.lstrip("#").lower()
    nick = "justinfan%d" % random.randint(10000, 99999)
    while True:
        try:
            sock = socket.create_connection((HOST, PORT), timeout=60)
            sock.sendall(("NICK %s\r\n" % nick).encode())
            sock.sendall(("JOIN #%s\r\n" % channel).encode())
            print("[chatlog] connecte a #%s en %s" % (channel, nick),
                  file=sys.stderr, flush=True)
            buf = b""
            while True:
                chunk = sock.recv(8192)
                if not chunk:
                    raise ConnectionError("flux IRC ferme")
                buf += chunk
                while b"\r\n" in buf:
                    raw, buf = buf.split(b"\r\n", 1)
                    line = raw.decode("utf-8", "replace")
                    if line.startswith("PING"):
                        sock.sendall(("PONG%s\r\n" % line[4:]).encode())
                        continue
                    msg = parse_privmsg(line)
                    if msg is None:
                        continue
                    author, text = msg
                    out.write("%.3f\t%s\t%s\n" % (time.time(), author,
                                                  text.replace("\t", " ")))
                    out.flush()
        except KeyboardInterrupt:
            return
        except Exception as exc:  # reseau : on retente
            print("[chatlog] %s — reconnexion dans %.0fs"
                  % (exc, reconnect_delay), file=sys.stderr, flush=True)
            try:
                sock.close()
            except Exception:
                pass
            time.sleep(reconnect_delay)


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("channel", help="nom de la chaine Twitch, sans #")
    ap.add_argument("-o", "--output", default="-",
                    help="fichier de log (defaut : stdout)")
    a = ap.parse_args()
    if a.output == "-":
        run(a.channel, sys.stdout)
    else:
        with open(a.output, "a", encoding="utf-8") as fh:
            run(a.channel, fh)
