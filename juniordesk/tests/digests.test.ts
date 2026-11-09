import { describe, it, expect, beforeEach } from 'vitest';
import { sendDigests } from '@/lib/alerts';
import { getStore } from '@/lib/store';
import { NO_EXPERIENCE_SIGNAL } from '@/lib/seniority';
import type { Offer } from '@/lib/offer';
import type { AlertSubscription } from '@/lib/store/types';

/**
 * Envoi par lots, et reprise d'un passage interrompu.
 *
 * Les envois sont séquentiels — un appel réseau par abonné — dans une
 * fonction serverless au temps borné. Sans plafond, elle est tuée au milieu
 * de la boucle quelque part entre quatre et cinq cents abonnés, sans qu'aucune
 * erreur ne l'annonce. Ces tests tiennent les deux propriétés qui rendent
 * l'interruption inoffensive : un passage sert un nombre borné d'abonnés, et
 * le suivant reprend la file au lieu de la recommencer.
 *
 * Aucune clé Resend n'est configurée ici : `sendMail` simule et renvoie un
 * succès, ce qui est exactement ce qu'il faut pour éprouver l'ordonnancement.
 */

const SNAPSHOT = '2026-11-09T02:40:00.000Z';
const AVANT = '2026-11-08T02:40:00.000Z';
const APRES = '2026-11-09T03:05:00.000Z';

function offre(id: string): Offer {
  return {
    id,
    slug: id,
    title: 'Alternance analyste crédit',
    description: '',
    applyUrl: 'https://employeur.example/postuler',
    source: { id: 'lba', label: 'LBA', partnerLabel: 'p', partnerJobId: id },
    employer: { name: 'Banque', brand: null, siret: null, website: null, size: null },
    place: {
      address: '', city: 'Paris', citySlug: 'paris', postalCode: '75002',
      departement: '75', lat: null, lon: null,
    },
    contract: {
      kinds: ['apprentissage'], start: null, startIsFlexible: false,
      durationMonths: null, remote: null,
    },
    families: ['banque-detail-credit'],
    romeCodes: ['C1202'],
    targetDiploma: null,
    experience: NO_EXPERIENCE_SIGNAL,
    publishedAt: '2026-11-08T00:00:00.000Z',
    expiresAt: null,
    collectedAt: SNAPSHOT,
  };
}

async function abonne(id: string, lastSentAt: string | null): Promise<void> {
  const subscription: AlertSubscription = {
    id,
    email: `${id}@exemple.fr`,
    confirmed: true,
    families: [],
    groups: [],
    cities: [],
    createdAt: '2026-10-01T00:00:00.000Z',
    confirmedAt: '2026-10-01T00:05:00.000Z',
    lastSentAt,
  };
  await getStore().saveSubscription(subscription);
}

async function abonnes(n: number, lastSentAt: string | null): Promise<void> {
  for (let i = 0; i < n; i += 1) await abonne(`a${String(i).padStart(3, '0')}`, lastSentAt);
}

/** Dates d'envoi relues depuis le magasin, dans l'ordre des identifiants. */
async function datesEnvoi(): Promise<(string | null)[]> {
  const liste = await getStore().listConfirmedSubscriptions();
  return liste.sort((a, b) => a.id.localeCompare(b.id)).map((s) => s.lastSentAt);
}

describe('envoi par lots', () => {
  /*
   * Le magasin mémoire est partagé par tout le fichier. Une première version
   * appelait un `reset()` qui n'existe pas — l'appel optionnel ne faisait
   * rien, et l'isolation entre les tests n'était qu'un hasard d'écriture des
   * mêmes identifiants. On vide donc explicitement, avec l'API publique.
   */
  beforeEach(async () => {
    const store = getStore();
    for (const s of await store.listConfirmedSubscriptions()) {
      await store.deleteSubscription(s.id);
    }
  });

  it('ne sert qu’un nombre borné d’abonnés par passage', async () => {
    await abonnes(10, AVANT);
    const rapport = await sendDigests([offre('o1')], { since: SNAPSHOT, limit: 4 });

    expect(rapport.mailsSent).toBe(4);
    expect(rapport.remaining).toBe(6);
    expect(rapport.subscriptions).toBe(10);
  });

  it('le passage suivant reprend la file au lieu de la recommencer', async () => {
    /*
     * La propriété qui rend une interruption inoffensive. Sans elle, le
     * passage suivant resservait les premiers de la file, qui recevaient
     * deux fois le même message.
     */
    await abonnes(10, AVANT);

    const premier = await sendDigests([offre('o1')], { since: SNAPSHOT, limit: 4 });
    expect(premier.remaining).toBe(6);

    const deuxieme = await sendDigests([offre('o1')], { since: SNAPSHOT, limit: 4 });
    expect(deuxieme.mailsSent).toBe(4);
    expect(deuxieme.remaining).toBe(2);

    const troisieme = await sendDigests([offre('o1')], { since: SNAPSHOT, limit: 4 });
    expect(troisieme.mailsSent).toBe(2);
    expect(troisieme.remaining).toBe(0);

    // Les dix ont été servis une fois chacun, aucun deux fois.
    const dates = await datesEnvoi();
    expect(dates).toHaveLength(10);
    expect(dates.every((d) => d !== null && d > SNAPSHOT)).toBe(true);
  });

  it('saute un abonné déjà servi pour cet instantané', async () => {
    await abonne('deja', APRES);
    await abonne('pas-encore', AVANT);

    const rapport = await sendDigests([offre('o1')], { since: SNAPSHOT, limit: 10 });
    expect(rapport.mailsSent).toBe(1);
    expect(rapport.remaining).toBe(0);
  });

  it('avance la date d’un abonné que rien ne concerne', async () => {
    /*
     * Un abonné dont aucune offre ne correspond ne reçoit rien, mais il a été
     * EXAMINÉ. Sans avancer sa date, il resterait éternellement « en
     * attente » et chaque passage le réexaminerait en boucle sans jamais
     * atteindre ceux qui le suivent dans la file.
     */
    await abonne('hors-criteres', AVANT);
    await getStore().saveSubscription({
      ...(await getStore().getSubscription('hors-criteres'))!,
      cities: ['marseille'],
    });

    const rapport = await sendDigests([offre('o1')], { since: SNAPSHOT, limit: 10 });
    expect(rapport.mailsSent).toBe(0);
    expect(rapport.remaining).toBe(0);

    const dates = await datesEnvoi();
    expect(dates).toHaveLength(1);
    expect(dates[0] !== null && dates[0] !== undefined && dates[0] > SNAPSHOT).toBe(true);
  });

  it('ne réclame rien quand il n’y a aucune offre nouvelle', async () => {
    await abonnes(5, AVANT);
    const rapport = await sendDigests([], { since: SNAPSHOT, limit: 2 });
    expect(rapport.mailsSent).toBe(0);
    expect(rapport.remaining).toBe(0);
  });
});
