// Verifie que l'application retrouve exactement les chiffres du fichier Excel
// « ViceCityClips - Tableau de pilotage.xlsx » (onglet Tableau de bord), en
// repartant des memes donnees : la campagne TOKYO-GIRL, le compte
// @ontherunclips, un clip de 12 400 vues publie a 03:10 et soumis a 03:24,
// et un paiement de 7,81 $ recu le 1er decembre.

import { beforeEach, describe, expect, it } from 'vitest';
import { creerBase, lireReglages, type BaseDonnees } from '../server/db';
import {
  calculerTableauDeBord,
  listerCampagnes,
  listerClips,
  listerComptes,
  listerPaiements,
} from '../server/enrichir';
import { arrondi2 } from '../shared/calculs';

let db: BaseDonnees;

function jeuDeDonneesExcel(base: BaseDonnees): void {
  base
    .prepare(
      `INSERT INTO campagnes (id, nom, organisateur, type, cpm, paiement_min, plafond_par_clip,
        budget_total, statut, verifie_le)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run('TOKYO-GIRL', 'GTA 6 Clipping Campaign - Tokyo Girl', 'Placements', 'CPM', 0.7, 2, 35, 2000, 'Active', '2026-11-17');

  base
    .prepare(
      `INSERT INTO campagnes (id, nom, organisateur, type, budget_total, statut, verifie_le)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run('KAI-POOL', '$10,000 Kai Cenat Campaign', 'Reach', 'Pool', 10000, 'Active', '2026-11-17');

  base
    .prepare(
      `INSERT INTO comptes (identifiant, nom_affiche, plateforme, niche, langue, relie_content_rewards)
       VALUES (?, ?, ?, ?, ?, 0)`,
    )
    .run('@ontherunclips', 'On The Run', 'TikTok', 'GTA 6', 'Anglais');

  base
    .prepare(
      `INSERT INTO clips (date_publication, heure_publication, heure_soumission, compte_id,
        plateforme, campagne_id, vues_j3, vues_finales, statut)
       VALUES ('2026-11-19', '03:10', '03:24', 1, 'TikTok', 'TOKYO-GIRL', 9800, 12400, 'En attente')`,
    )
    .run();

  base
    .prepare(
      `INSERT INTO paiements (date_reception, source, campagne_id, montant_brut, frais_retrait, moyen, reference)
       VALUES ('2026-12-01', 'Content Rewards → Whop → banque', 'TOKYO-GIRL', 7.81, 0, 'Virement', 'WHOP-XXXX')`,
    )
    .run();
}

beforeEach(() => {
  db = creerBase(':memory:');
  jeuDeDonneesExcel(db);
});

describe('indicateurs du tableau de bord', () => {
  it('reprend les reglages du fichier Excel', () => {
    expect(lireReglages(db)).toEqual({
      fraisCpm: 0.1,
      tauxEurParUsd: 0.86,
      objectifMensuelEur: 1000,
    });
  });

  it('retrouve les chiffres de l onglet Tableau de bord', () => {
    const t = calculerTableauDeBord(db, lireReglages(db));

    expect(t.clipsPublies).toBe(1);
    expect(t.clipsApprouvesOuPayes).toBe(0);
    expect(t.clipsEnAttente).toBe(1);
    expect(t.clipsRefuses).toBe(0);
    expect(t.tauxApprobation).toBeNull(); // la case est vide dans le fichier
    expect(t.vuesComptees).toBe(12_400);
    expect(t.delaiMoyenSoumissionMin).toBe(14);
    expect(t.clipsHorsDelai).toBe(0);
    expect(t.gainNetEstimeApprouveUsd).toBe(0);
    expect(t.gainNetPotentielEnAttenteUsd).toBeCloseTo(7.812, 6);
    expect(t.paiementsRecusNetUsd).toBeCloseTo(7.81, 6);
    expect(t.paiementsRecusNetEur).toBeCloseTo(6.7166, 6);
    expect(t.resteARecevoirUsd).toBe(0);
    expect(t.objectifMensuelEur).toBe(1000);
  });

  it('construit le suivi mensuel comme le fichier Excel', () => {
    const t = calculerTableauDeBord(db, lireReglages(db));
    const novembre = t.suiviMensuel.find((l) => l.mois === '2026-11');
    const decembre = t.suiviMensuel.find((l) => l.mois === '2026-12');

    expect(novembre).toBeDefined();
    expect(novembre!.clipsPublies).toBe(1);
    expect(novembre!.vuesComptees).toBe(12_400);
    expect(novembre!.gainNetEstimeApprouveUsd).toBe(0);
    expect(novembre!.recuNetEur).toBe(0);

    expect(decembre).toBeDefined();
    expect(decembre!.clipsPublies).toBe(0);
    expect(decembre!.recuNetEur).toBeCloseTo(6.7166, 6);
    expect(decembre!.partObjectif).toBeCloseTo(0.0067166, 9);
  });

  it('compte les clips non estimes a part', () => {
    db.prepare(
      `INSERT INTO clips (date_publication, compte_id, plateforme, campagne_id, vues_finales, statut)
       VALUES ('2026-11-20', 1, 'TikTok', 'KAI-POOL', 500000, 'Approuvé')`,
    ).run();

    const t = calculerTableauDeBord(db, lireReglages(db));
    expect(t.clipsNonEstimes).toBe(1);
    expect(t.vuesComptees).toBe(512_400);
    // Un clip Pool n'ajoute rien aux gains estimes, meme approuve.
    expect(t.gainNetEstimeApprouveUsd).toBe(0);
  });

  it('calcule le reste a recevoir quand des clips sont approuves', () => {
    db.prepare("UPDATE clips SET statut = 'Approuvé' WHERE id = 1").run();
    const t = calculerTableauDeBord(db, lireReglages(db));

    expect(t.gainNetEstimeApprouveUsd).toBeCloseTo(7.812, 6);
    expect(t.tauxApprobation).toBe(1);
    // 7,812 $ estimes - 7,81 $ deja recus
    expect(t.resteARecevoirUsd).toBeCloseTo(0.002, 6);
  });

  it('signale un clip soumis au-dela de 30 minutes', () => {
    db.prepare("UPDATE clips SET heure_soumission = '03:45' WHERE id = 1").run();
    const t = calculerTableauDeBord(db, lireReglages(db));

    expect(t.delaiMoyenSoumissionMin).toBe(35);
    expect(t.clipsHorsDelai).toBe(1);
  });
});

describe('clip enrichi', () => {
  it('calcule delai, gain brut, frais et gain net', () => {
    const clip = listerClips(db, lireReglages(db))[0];

    expect(clip.delaiSoumissionMin).toBe(14);
    expect(clip.horsDelai).toBe(false);
    expect(arrondi2(clip.gainBrutEstime as number)).toBe(8.68);
    expect(arrondi2(clip.frais as number)).toBe(0.87);
    expect(arrondi2(clip.gainNetEstime as number)).toBe(7.81);
    expect(clip.compteIdentifiant).toBe('@ontherunclips');
    expect(clip.campagneNom).toBe('GTA 6 Clipping Campaign - Tokyo Girl');
  });

  it("n'estime pas un clip de campagne Pool", () => {
    db.prepare(
      `INSERT INTO clips (date_publication, compte_id, campagne_id, vues_finales, statut)
       VALUES ('2026-11-20', 1, 'KAI-POOL', 500000, 'Approuvé')`,
    ).run();

    const clip = listerClips(db, lireReglages(db), { campagneId: 'KAI-POOL' })[0];
    expect(clip.gainBrutEstime).toBeNull();
    expect(clip.frais).toBeNull();
    expect(clip.gainNetEstime).toBeNull();
  });

  it('filtre les clips', () => {
    const reglages = lireReglages(db);
    expect(listerClips(db, reglages, { statut: 'En attente' })).toHaveLength(1);
    expect(listerClips(db, reglages, { statut: 'Refusé' })).toHaveLength(0);
    expect(listerClips(db, reglages, { compteId: 1 })).toHaveLength(1);
    expect(listerClips(db, reglages, { compteId: 99 })).toHaveLength(0);
    expect(listerClips(db, reglages, { mois: '2026-11' })).toHaveLength(1);
    expect(listerClips(db, reglages, { mois: '2026-12' })).toHaveLength(0);
    expect(listerClips(db, reglages, { plateforme: 'TikTok' })).toHaveLength(1);
    expect(listerClips(db, reglages, { campagneId: 'TOKYO-GIRL' })).toHaveLength(1);
  });
});

describe('fiche campagne', () => {
  it('calcule les vues minimum et les totaux de TOKYO-GIRL', () => {
    const campagne = listerCampagnes(db, lireReglages(db)).find((c) => c.id === 'TOKYO-GIRL')!;

    expect(campagne.vuesMinimum).toBeCloseTo(2857.142857142857, 6);
    expect(campagne.nbClips).toBe(1);
    expect(campagne.vuesComptees).toBe(12_400);
    expect(arrondi2(campagne.gainNetEstime as number)).toBe(7.81);
    expect(campagne.paiementsRecusNetUsd).toBeCloseTo(7.81, 6);
  });

  it("n'estime pas le gain d'une campagne Pool", () => {
    const campagne = listerCampagnes(db, lireReglages(db)).find((c) => c.id === 'KAI-POOL')!;
    expect(campagne.gainNetEstime).toBeNull();
    expect(campagne.vuesMinimum).toBeNull();
  });

  it('alerte quand les conditions n ont pas ete verifiees depuis plus de 7 jours', () => {
    db.prepare("UPDATE campagnes SET verifie_le = '2000-01-01' WHERE id = 'TOKYO-GIRL'").run();
    const campagne = listerCampagnes(db, lireReglages(db)).find((c) => c.id === 'TOKYO-GIRL')!;
    expect(campagne.verificationPerimee).toBe(true);
  });
});

describe('fiche compte', () => {
  it('additionne les clips, les vues et les gains du compte', () => {
    const compte = listerComptes(db, lireReglages(db))[0];

    expect(compte.identifiant).toBe('@ontherunclips');
    expect(compte.nbClips).toBe(1);
    expect(compte.vuesComptees).toBe(12_400);
    expect(arrondi2(compte.gainNetEstime as number)).toBe(7.81);
  });

  it('expose le dernier releve d abonnes', () => {
    db.prepare('INSERT INTO abonnes_historique (compte_id, date, abonnes) VALUES (1, ?, ?)').run('2026-11-20', 120);
    db.prepare('INSERT INTO abonnes_historique (compte_id, date, abonnes) VALUES (1, ?, ?)').run('2026-11-25', 340);

    const compte = listerComptes(db, lireReglages(db))[0];
    expect(compte.abonnes).toBe(340);
    expect(compte.abonnesMajLe).toBe('2026-11-25');
  });
});

describe('paiement enrichi', () => {
  it('calcule le net en dollars et en euros au taux par defaut', () => {
    const paiement = listerPaiements(db, lireReglages(db))[0];

    expect(paiement.montantNetUsd).toBeCloseTo(7.81, 6);
    expect(paiement.tauxParDefautUtilise).toBe(true);
    expect(paiement.tauxApplique).toBe(0.86);
    expect(paiement.montantNetEur).toBeCloseTo(6.7166, 6);
  });

  it('utilise le taux de la ligne quand il est renseigne', () => {
    db.prepare('UPDATE paiements SET taux_eur_par_usd = 0.9, frais_retrait = 1 WHERE id = 1').run();
    const paiement = listerPaiements(db, lireReglages(db))[0];

    expect(paiement.montantNetUsd).toBeCloseTo(6.81, 6);
    expect(paiement.tauxParDefautUtilise).toBe(false);
    expect(paiement.montantNetEur).toBeCloseTo(6.129, 6);
  });
});
