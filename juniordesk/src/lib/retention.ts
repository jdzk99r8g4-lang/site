/**
 * Durée de conservation des comptes.
 *
 * ---------------------------------------------------------------------------
 * Le trou que ce fichier bouche
 * ---------------------------------------------------------------------------
 * La politique de confidentialité disait « conservation jusqu'à la
 * suppression du compte ». Autrement dit : indéfiniment, sauf si la personne
 * y pense. Le compte de quelqu'un qui a cherché une alternance en 2026 et qui
 * travaille depuis trois ans resterait là, avec son adresse, pour toujours.
 *
 * Le RGPD demande que les données ne soient pas conservées au-delà de ce que
 * la finalité exige. Pour un site d'offres destiné à des étudiants, la
 * finalité s'éteint quand la personne cesse de chercher. Deux ans sans aucune
 * connexion en est une mesure raisonnable, et surtout : c'est une mesure, là
 * où « jusqu'à la suppression » n'en était pas une.
 *
 * ---------------------------------------------------------------------------
 * Pourquoi un avertissement avant
 * ---------------------------------------------------------------------------
 * Un compte porte des offres mises de côté et des candidatures notées. Les
 * effacer sans prévenir, c'est faire disparaître le travail de quelqu'un pour
 * appliquer une règle qu'il n'a jamais lue. Un message un mois avant coûte un
 * e-mail et rend la suppression loyale : qui veut garder son compte se
 * connecte, et sa date d'activité repart.
 *
 * ---------------------------------------------------------------------------
 * Les comptes jamais confirmés
 * ---------------------------------------------------------------------------
 * Ils partent plus vite, et sans avertissement — il n'y aurait personne pour
 * le lire. Le lien de confirmation expire au bout de trente jours : passé ce
 * délai le compte ne peut plus rien devenir, il ne reste qu'une adresse
 * e-mail conservée pour rien. Et comme n'importe qui peut saisir l'adresse de
 * n'importe qui sur le formulaire d'inscription, la garder serait conserver
 * la donnée d'un tiers qui n'a jamais rien demandé.
 *
 * SERVEUR UNIQUEMENT.
 */

import { getStore } from './store';
import type { Account } from './store/types';
import { sendMail } from './email/send';
import { accountPurgeWarningMail } from './email/templates';

const JOUR = 24 * 60 * 60 * 1000;

/** Un compte jamais confirmé ne survit pas à l'expiration de son lien. */
export const UNCONFIRMED_DAYS = 30;

/** Deux ans sans connexion : la finalité est éteinte. */
export const INACTIVE_DAYS = 730;

/** L'avertissement part un mois avant la suppression. */
export const WARNING_DAYS = 700;

export interface PurgeReport {
  examined: number;
  unconfirmedDeleted: number;
  inactiveDeleted: number;
  warned: number;
  warningsFailed: number;
}

/**
 * Dernier signe de vie d'un compte.
 *
 * `lastLoginAt` d'abord, mais un compte tout juste créé n'en a pas : sans le
 * repli sur la création, il serait considéré comme inactif depuis toujours et
 * supprimé au premier ménage.
 */
export function lastActivity(account: Account): string {
  return account.lastLoginAt ?? account.verifiedAt ?? account.createdAt;
}

function daysSince(iso: string, now: number): number {
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return 0;
  return (now - then) / JOUR;
}

/** Ce qu'il faut faire d'un compte, sans rien faire encore. */
export function decide(
  account: Account,
  now: number,
): 'garder' | 'supprimer-non-confirme' | 'supprimer-inactif' | 'avertir' {
  if (!account.verified) {
    return daysSince(account.createdAt, now) > UNCONFIRMED_DAYS
      ? 'supprimer-non-confirme'
      : 'garder';
  }

  const inactif = daysSince(lastActivity(account), now);
  if (inactif > INACTIVE_DAYS) return 'supprimer-inactif';

  if (inactif > WARNING_DAYS) {
    /*
     * Un seul avertissement par période d'inactivité : il est réputé envoyé
     * s'il l'a été depuis le dernier signe de vie. Sans cette condition, le
     * ménage quotidien enverrait le même message tous les jours pendant un
     * mois — ce qui ferait classer le domaine comme indésirable, et
     * transformerait une attention en harcèlement.
     */
    const dejaAverti =
      account.purgeWarnedAt != null && account.purgeWarnedAt > lastActivity(account);
    return dejaAverti ? 'garder' : 'avertir';
  }

  return 'garder';
}

/**
 * Applique la politique de conservation.
 *
 * Le ménage est séquentiel et sans plafond : il ne touche qu'une poignée de
 * comptes par jour en régime normal. Si le nombre de comptes rendait ce
 * passage trop long, c'est la même correction que pour les alertes qu'il
 * faudrait — un lot borné et une reprise.
 */
export async function purgeStaleAccounts(now = Date.now()): Promise<PurgeReport> {
  const store = getStore();
  const accounts = await store.listAccounts();

  const report: PurgeReport = {
    examined: accounts.length,
    unconfirmedDeleted: 0,
    inactiveDeleted: 0,
    warned: 0,
    warningsFailed: 0,
  };

  for (const account of accounts) {
    switch (decide(account, now)) {
      case 'supprimer-non-confirme':
        await store.deleteAccount(account.id);
        report.unconfirmedDeleted += 1;
        break;

      case 'supprimer-inactif':
        /*
         * L'alerte porte le même identifiant que le compte : la supprimer
         * aussi, sinon la personne continuerait de recevoir des e-mails pour
         * un compte qui n'existe plus — le contraire de ce que ce ménage est
         * censé faire.
         */
        await store.deleteSubscription(account.id);
        await store.deleteAccount(account.id);
        report.inactiveDeleted += 1;
        break;

      case 'avertir': {
        const mail = accountPurgeWarningMail({
          email: account.email,
          deleteAfterDays: INACTIVE_DAYS - WARNING_DAYS,
        });
        const sent = await sendMail({ to: account.email, ...mail });
        if (sent.ok) {
          account.purgeWarnedAt = new Date(now).toISOString();
          await store.saveAccount(account);
          report.warned += 1;
        } else {
          /*
           * L'avertissement n'est pas marqué : il sera retenté demain. Un
           * compte ne doit pas être supprimé au motif d'un avertissement
           * qu'on n'a pas réussi à envoyer.
           */
          report.warningsFailed += 1;
        }
        break;
      }

      case 'garder':
        break;
    }
  }

  return report;
}
