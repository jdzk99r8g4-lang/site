// Choix des adresses reseau a proposer pour ouvrir l'application depuis
// l'iPhone.
//
// Un Mac expose souvent plusieurs interfaces : le Wi-Fi (en0), parfois un cable
// Ethernet, un VPN (utun), AirDrop (awdl0), un partage de connexion (bridge).
// Une seule mene a l'iPhone, et ce n'est pas toujours la premiere que le
// systeme renvoie : on ecarte celles qui ne peuvent pas convenir, on classe les
// autres, et on les propose toutes.

export interface AdresseReseau {
  /** Nom de l'interface, par exemple « en0 ». */
  nom: string;
  /** Adresse IPv4, par exemple « 192.168.1.24 ». */
  adresse: string;
}

/** Interface d'apres Node (os.networkInterfaces). */
export interface InterfaceReseau {
  family: string;
  address: string;
  internal: boolean;
}

/** Interfaces qui ne menent jamais a un autre appareil du reseau local. */
const A_ECARTER = /^(awdl|llw|utun|ipsec|ppp|gif|stf|lo|tun|tap|docker|veth|br-)/;

/** Ordre de preference : le Wi-Fi d'abord, puis l'Ethernet. */
const ORDRE = ['en0', 'en1', 'en2', 'eth0', 'eth1', 'wlan0'];

/**
 * Trie et filtre les interfaces reseau, la plus probable en tete.
 *
 * Les adresses d'auto-configuration (169.254.x.x, attribuees quand aucun
 * routeur ne repond) sont ecartees : elles ne servent a rien ici.
 */
export function choisirAdresses(
  interfaces: Record<string, InterfaceReseau[] | undefined>,
): AdresseReseau[] {
  const candidates: AdresseReseau[] = [];

  for (const [nom, liste] of Object.entries(interfaces)) {
    if (A_ECARTER.test(nom)) continue;
    for (const details of liste ?? []) {
      if (details.family !== 'IPv4' || details.internal) continue;
      if (details.address.startsWith('169.254.')) continue;
      candidates.push({ nom, adresse: details.address });
    }
  }

  return candidates.sort((a, b) => {
    const rangA = ORDRE.indexOf(a.nom);
    const rangB = ORDRE.indexOf(b.nom);
    if (rangA !== rangB) return (rangA === -1 ? 99 : rangA) - (rangB === -1 ? 99 : rangB);
    return a.nom.localeCompare(b.nom);
  });
}
