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
