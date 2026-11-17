// Le choix de l'adresse a taper sur l'iPhone. C'est le point qui decide si
// l'application est joignable ou non : un Mac expose souvent plusieurs
// interfaces, et une seule mene au telephone.

import { describe, expect, it } from 'vitest';
import { choisirAdresses, type InterfaceReseau } from '../shared/reseau';

const ipv4 = (address: string, internal = false): InterfaceReseau => ({
  family: 'IPv4',
  address,
  internal,
});

const ipv6 = (address: string): InterfaceReseau => ({ family: 'IPv6', address, internal: false });

describe('choix des adresses reseau', () => {
  it('retient le Wi-Fi d un Mac ordinaire', () => {
    const adresses = choisirAdresses({
      lo0: [ipv4('127.0.0.1', true), ipv6('::1')],
      en0: [ipv6('fe80::1'), ipv4('192.168.1.24')],
      awdl0: [ipv4('169.254.12.7')],
    });

    expect(adresses).toEqual([{ nom: 'en0', adresse: '192.168.1.24' }]);
  });

  it('ecarte AirDrop, meme avec une adresse exploitable', () => {
    const adresses = choisirAdresses({
      en0: [ipv4('192.168.1.24')],
      awdl0: [ipv4('10.0.0.5')],
      llw0: [ipv4('10.0.0.6')],
    });

    expect(adresses.map((a) => a.nom)).toEqual(['en0']);
  });

  it('ecarte les interfaces de VPN', () => {
    const adresses = choisirAdresses({
      en0: [ipv4('192.168.1.24')],
      utun0: [ipv4('10.8.0.2')],
      utun3: [ipv4('10.8.0.3')],
      ipsec0: [ipv4('10.9.0.1')],
    });

    expect(adresses).toEqual([{ nom: 'en0', adresse: '192.168.1.24' }]);
  });

  it('propose le Wi-Fi et l Ethernet, Wi-Fi en tete', () => {
    const adresses = choisirAdresses({
      en5: [ipv4('192.168.1.40')], // adaptateur Ethernet
      en0: [ipv4('192.168.1.24')], // Wi-Fi
    });

    expect(adresses).toEqual([
      { nom: 'en0', adresse: '192.168.1.24' },
      { nom: 'en5', adresse: '192.168.1.40' },
    ]);
  });

  it('propose aussi les interfaces inconnues, mais apres les habituelles', () => {
    const adresses = choisirAdresses({
      bridge100: [ipv4('192.168.2.1')], // partage de connexion
      en0: [ipv4('192.168.1.24')],
    });

    expect(adresses.map((a) => a.nom)).toEqual(['en0', 'bridge100']);
  });

  it('ecarte les adresses d auto-configuration, qui ne menent nulle part', () => {
    // 169.254.x.x : aucun routeur n'a repondu, l'iPhone ne verra rien.
    const adresses = choisirAdresses({ en0: [ipv4('169.254.3.8')] });
    expect(adresses).toEqual([]);
  });

  it('ignore l IPv6 et la boucle locale', () => {
    const adresses = choisirAdresses({
      lo0: [ipv4('127.0.0.1', true)],
      en0: [ipv6('2a01:cb00::1')],
    });

    expect(adresses).toEqual([]);
  });

  it('renvoie une liste vide quand le Wi-Fi est coupe', () => {
    expect(choisirAdresses({ lo0: [ipv4('127.0.0.1', true)] })).toEqual([]);
    expect(choisirAdresses({})).toEqual([]);
  });

  it('accepte une interface sans adresse', () => {
    expect(choisirAdresses({ en0: undefined, en1: [ipv4('192.168.1.24')] })).toEqual([
      { nom: 'en1', adresse: '192.168.1.24' },
    ]);
  });
});
