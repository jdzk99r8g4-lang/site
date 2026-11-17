import { describe, expect, it } from 'vitest';
import {
  arrondi2,
  delaiMoyenSoumissionMin,
  delaiSoumissionMin,
  fraisClip,
  gainBrutEstime,
  gainNetEstime,
  joursDepuis,
  minutesDepuisMinuit,
  moisDe,
  paiementNetEur,
  paiementNetUsd,
  partObjectif,
  resteARecevoirUsd,
  tauxApplique,
  tauxApprobation,
  verificationPerimee,
  vuesMinimum,
} from '../shared/calculs';
import { REGLAGES_PAR_DEFAUT, type CampagneCalcul, type Reglages } from '../shared/types';

/** Reglages du fichier Excel : frais 10 %, taux 0,86 € pour 1 $, objectif 1 000 €. */
const reglages: Reglages = { ...REGLAGES_PAR_DEFAUT };

/** Campagne TOKYO-GIRL du fichier Excel. */
const tokyoGirl: CampagneCalcul = {
  type: 'CPM',
  cpm: 0.7,
  paiementMin: 2,
  plafondParClip: 35,
};

/** Campagne TJR-REACH du fichier Excel. */
const tjrReach: CampagneCalcul = {
  type: 'CPM',
  cpm: 0.75,
  paiementMin: 3.75,
  plafondParClip: 750,
};

/** Campagne KAI-POOL du fichier Excel : budget partage, pas d'estimation. */
const kaiPool: CampagneCalcul = {
  type: 'Pool',
  cpm: null,
  paiementMin: null,
  plafondParClip: null,
};

describe('delai de soumission', () => {
  it('calcule le delai dans la meme heure', () => {
    expect(delaiSoumissionMin('03:10', '03:24')).toBe(14);
  });

  it('calcule le delai a cheval sur une heure', () => {
    expect(delaiSoumissionMin('22:45', '23:20')).toBe(35);
  });

  it('gere le passage de minuit', () => {
    expect(delaiSoumissionMin('23:50', '00:10')).toBe(20);
    expect(delaiSoumissionMin('23:59', '00:00')).toBe(1);
  });

  it('accepte les heures avec secondes du fichier Excel', () => {
    expect(delaiSoumissionMin('03:10:00', '03:24:00')).toBe(14);
  });

  it('renvoie 0 quand les deux heures sont identiques', () => {
    expect(delaiSoumissionMin('10:00', '10:00')).toBe(0);
  });

  it("renvoie null quand une heure manque ou est illisible", () => {
    expect(delaiSoumissionMin('03:10', null)).toBeNull();
    expect(delaiSoumissionMin(null, '03:24')).toBeNull();
    expect(delaiSoumissionMin('03:10', 'bientot')).toBeNull();
    expect(minutesDepuisMinuit('25:00')).toBeNull();
    expect(minutesDepuisMinuit('12:75')).toBeNull();
  });

});

describe('delai moyen', () => {
  it('ignore les delais inconnus', () => {
    expect(delaiMoyenSoumissionMin([14, null, 16])).toBe(15);
  });

  it('renvoie null quand aucun delai n est connu', () => {
    expect(delaiMoyenSoumissionMin([null, null])).toBeNull();
    expect(delaiMoyenSoumissionMin([])).toBeNull();
  });
});

describe('gain estime d un clip', () => {
  it('cas du fichier Excel : 12 400 vues a 0,70 $ donne 8,68 $ brut et 7,81 $ net', () => {
    const brut = gainBrutEstime(tokyoGirl, 12_400, 'En attente');
    expect(brut).not.toBeNull();
    expect(arrondi2(brut as number)).toBe(8.68);

    const frais = fraisClip(brut, reglages);
    expect(arrondi2(frais as number)).toBe(0.87); // 0,868 $ arrondi a l'affichage

    const net = gainNetEstime(brut, reglages);
    expect(net).toBeCloseTo(7.812, 6);
    expect(arrondi2(net as number)).toBe(7.81);
  });

  it('donne 0 quand le gain est sous le paiement minimum', () => {
    // 1 000 vues a 0,70 $ = 0,70 $, en dessous du minimum de 2 $.
    expect(gainBrutEstime(tokyoGirl, 1_000, 'En attente')).toBe(0);
    expect(gainNetEstime(gainBrutEstime(tokyoGirl, 1_000, 'En attente'), reglages)).toBe(0);
  });

  it('paie le montant exact quand le gain egale le paiement minimum', () => {
    // 2 857,14... vues donnent tout juste 2 $ : le minimum est atteint, pas franchi.
    const brut = gainBrutEstime(tokyoGirl, (2 / 0.7) * 1000, 'En attente');
    expect(brut).toBeCloseTo(2, 9);
  });

  it('limite le gain au plafond par clip', () => {
    // 100 000 vues a 0,70 $ = 70 $, plafonne a 35 $.
    expect(gainBrutEstime(tokyoGirl, 100_000, 'En attente')).toBe(35);
    expect(arrondi2(gainNetEstime(gainBrutEstime(tokyoGirl, 100_000, 'En attente'), reglages) as number)).toBe(31.5);
  });

  it('ne plafonne pas un gain inferieur au plafond', () => {
    expect(gainBrutEstime(tokyoGirl, 40_000, 'En attente')).toBeCloseTo(28, 9);
  });

  it('donne 0 pour un clip refuse, quel que soit le nombre de vues', () => {
    expect(gainBrutEstime(tokyoGirl, 500_000, 'Refusé')).toBe(0);
    expect(gainNetEstime(gainBrutEstime(tokyoGirl, 500_000, 'Refusé'), reglages)).toBe(0);
  });

  it('estime aussi les clips approuves et payes', () => {
    expect(arrondi2(gainBrutEstime(tokyoGirl, 12_400, 'Approuvé') as number)).toBe(8.68);
    expect(arrondi2(gainBrutEstime(tokyoGirl, 12_400, 'Payé') as number)).toBe(8.68);
  });

  it("n'estime pas une campagne Pool", () => {
    expect(gainBrutEstime(kaiPool, 500_000, 'Approuvé')).toBeNull();
    expect(fraisClip(null, reglages)).toBeNull();
    expect(gainNetEstime(null, reglages)).toBeNull();
  });

  it("n'estime pas les campagnes Par post et Forfait", () => {
    expect(gainBrutEstime({ ...kaiPool, type: 'Par post' }, 100_000, 'Approuvé')).toBeNull();
    expect(gainBrutEstime({ ...kaiPool, type: 'Forfait' }, 100_000, 'Approuvé')).toBeNull();
  });

  it("n'estime rien quand le clip n'est rattache a aucune campagne", () => {
    expect(gainBrutEstime(null, 12_400, 'En attente')).toBeNull();
  });

  it('traite les vues absentes comme 0', () => {
    expect(gainBrutEstime(tokyoGirl, null, 'En attente')).toBe(0);
  });

  it('traite un plafond absent comme « pas de plafond »', () => {
    const sansPlafond: CampagneCalcul = { ...tokyoGirl, plafondParClip: null };
    expect(gainBrutEstime(sansPlafond, 100_000, 'En attente')).toBeCloseTo(70, 9);
  });

  it('applique le CPM de la campagne TJR', () => {
    // 20 000 vues a 0,75 $ = 15 $, au-dessus du minimum de 3,75 $.
    expect(gainBrutEstime(tjrReach, 20_000, 'En attente')).toBeCloseTo(15, 9);
  });
});

describe('vues minimum d une campagne', () => {
  it('reprend la valeur du fichier Excel pour TOKYO-GIRL', () => {
    expect(vuesMinimum(2, 0.7)).toBeCloseTo(2857.142857142857, 6);
  });

  it('reprend la valeur du fichier Excel pour TJR-REACH', () => {
    expect(vuesMinimum(3.75, 0.75)).toBe(5000);
  });

  it('renvoie null sans CPM', () => {
    expect(vuesMinimum(2, null)).toBeNull();
    expect(vuesMinimum(2, 0)).toBeNull();
    expect(vuesMinimum(null, 0.7)).toBeNull();
  });
});

describe('paiements', () => {
  it('calcule le net en dollars', () => {
    expect(paiementNetUsd(7.81, 0)).toBeCloseTo(7.81, 9);
    expect(paiementNetUsd(100, 2.5)).toBeCloseTo(97.5, 9);
  });

  it('convertit en euros au taux par defaut quand la ligne n a pas de taux', () => {
    const net = paiementNetUsd(7.81, 0);
    expect(tauxApplique(null, reglages)).toBe(0.86);
    expect(paiementNetEur(net, null, reglages)).toBeCloseTo(6.7166, 6);
    expect(arrondi2(paiementNetEur(net, null, reglages))).toBe(6.72);
  });

  it('utilise le taux de la ligne quand il est renseigne', () => {
    expect(paiementNetEur(100, 0.9, reglages)).toBeCloseTo(90, 9);
    expect(tauxApplique(0.9, reglages)).toBe(0.9);
  });

  it('respecte un taux saisi a zero', () => {
    expect(tauxApplique(0, reglages)).toBe(0);
    expect(paiementNetEur(100, 0, reglages)).toBe(0);
  });

  it('retombe sur le taux par defaut pour une chaine vide', () => {
    expect(tauxApplique('' as unknown as number, reglages)).toBe(0.86);
  });
});

describe('taux d approbation', () => {
  it('compte les approuves et les payes au numerateur', () => {
    expect(tauxApprobation(3, 1)).toBe(0.75);
    expect(tauxApprobation(4, 0)).toBe(1);
    expect(tauxApprobation(0, 2)).toBe(0);
  });

  it('renvoie null quand aucun clip n est encore tranche', () => {
    // Cas du fichier Excel au depart : 0 approuve, 0 refuse.
    expect(tauxApprobation(0, 0)).toBeNull();
  });
});

describe('reste a recevoir', () => {
  it('soustrait les paiements recus du gain net estime approuve', () => {
    expect(resteARecevoirUsd(100, 30)).toBeCloseTo(70, 9);
  });

  it('ne descend jamais sous zero', () => {
    // Cas du fichier Excel : 0 $ estime approuve, 7,81 $ deja recus.
    expect(resteARecevoirUsd(0, 7.81)).toBe(0);
    expect(resteARecevoirUsd(10, 40)).toBe(0);
  });
});

describe('fraicheur de la verification d une campagne', () => {
  const aujourdhui = new Date(2026, 10, 24); // 24 novembre 2026

  it("n'alerte pas pour une verification de moins de 7 jours", () => {
    expect(joursDepuis('2026-11-20', aujourdhui)).toBe(4);
    expect(verificationPerimee('2026-11-20', aujourdhui)).toBe(false);
  });

  it("n'alerte pas pile a 7 jours", () => {
    expect(joursDepuis('2026-11-17', aujourdhui)).toBe(7);
    expect(verificationPerimee('2026-11-17', aujourdhui)).toBe(false);
  });

  it('alerte au-dela de 7 jours', () => {
    expect(verificationPerimee('2026-11-16', aujourdhui)).toBe(true);
  });

  it('alerte quand la campagne n a jamais ete verifiee', () => {
    expect(verificationPerimee(null, aujourdhui)).toBe(true);
    expect(verificationPerimee('', aujourdhui)).toBe(true);
  });
});

describe('objectif mensuel et mois', () => {
  it('calcule la part de l objectif', () => {
    expect(partObjectif(500, 1000)).toBe(0.5);
    expect(partObjectif(0, 1000)).toBe(0);
  });

  it('borne la jauge a 100 %', () => {
    expect(partObjectif(1500, 1000)).toBe(1);
  });

  it('evite la division par zero quand l objectif est nul', () => {
    expect(partObjectif(500, 0)).toBe(0);
  });

  it('extrait le mois d une date', () => {
    expect(moisDe('2026-11-19')).toBe('2026-11');
    expect(moisDe(null)).toBeNull();
    expect(moisDe('pas une date')).toBeNull();
  });
});

describe('arrondi d affichage', () => {
  it('arrondit a deux decimales', () => {
    expect(arrondi2(7.812)).toBe(7.81);
    expect(arrondi2(8.68)).toBe(8.68);
    expect(arrondi2(0.868)).toBe(0.87);
    expect(arrondi2(6.7166)).toBe(6.72);
  });
});
