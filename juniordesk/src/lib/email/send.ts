/**
 * Envoi des e-mails.
 *
 * Sans `RESEND_API_KEY`, rien ne part : les messages sont écrits dans la
 * console. C’est volontaire — on doit pouvoir dérouler l’inscription aux
 * alertes de bout en bout en développement sans expédier quoi que ce soit à
 * une vraie adresse.
 *
 * SERVEUR UNIQUEMENT.
 */

import { Resend } from 'resend';
import { brand } from '../brand';
import { maskEmail } from '../email-address';

export interface Mail {
  to: string;
  subject: string;
  text: string;
  html: string;
  /**
   * Adresse de désinscription en un clic, pour les messages de diffusion.
   *
   * Quand elle est là, le message porte `List-Unsubscribe` et
   * `List-Unsubscribe-Post`, c'est-à-dire le bouton « Se désabonner » que
   * Gmail et Outlook affichent eux-mêmes. Sans lui, la personne qui ne veut
   * plus de nos messages utilise le seul bouton qu'elle voit — « signaler
   * comme spam » — et quelques plaintes suffisent à faire classer le domaine,
   * ce qui frappe ensuite TOUTES les alertes du site.
   *
   * Les messages transactionnels (confirmation d'inscription,
   * réinitialisation de mot de passe) n'en portent pas : on ne se désabonne
   * pas d'un message qu'on vient de demander, et l'annoncer embrouillerait
   * les filtres autant que les gens.
   */
  unsubscribeUrl?: string;
}

export type SendResult = { ok: true; simulated: boolean } | { ok: false; error: string };

let client: Resend | null = null;

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  client ??= new Resend(key);
  return client;
}

export async function sendMail(mail: Mail): Promise<SendResult> {
  const resend = getClient();

  if (!resend) {
    if (process.env.NODE_ENV === 'production') {
      console.error(
        '[e-mail] RESEND_API_KEY absent en production : l’e-mail destine a ' +
          `${maskEmail(mail.to)} n’a PAS ete envoye (« ${mail.subject} »).`,
      );
    } else {
      console.info(`[e-mail simule] -> ${maskEmail(mail.to)} : ${mail.subject}\n${mail.text}\n`);
    }
    return { ok: true, simulated: true };
  }

  try {
    const result = await resend.emails.send({
      from: brand.email.from,
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      ...(mail.unsubscribeUrl
        ? {
            headers: {
              /*
               * Les chevrons sont exigés par le format de l'en-tête ; sans
               * eux l'adresse est ignorée en silence.
               */
              'List-Unsubscribe': `<${mail.unsubscribeUrl}>`,
              /*
               * Dit à la messagerie qu'un POST sur cette adresse suffit, sans
               * page à ouvrir ni confirmation à demander. C'est la route
               * `/api/alertes/desinscription` qui le reçoit.
               */
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
          }
        : {}),
    });

    if (result.error) {
      return { ok: false, error: result.error.message };
    }

    return { ok: true, simulated: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: message };
  }
}

/**
 * Masque une adresse pour les journaux.
 *
 * Un journal d’application n’a pas besoin de l’adresse complète, et il est
 * souvent conservé plus longtemps et lu par plus de monde que la base.
 */
export { maskEmail as mask } from '../email-address';
