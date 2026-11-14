/**
 * Gabarits des e-mails d’alerte.
 *
 * Trois exigences non négociables, qui sont juridiques autant que
 * rédactionnelles :
 *
 * 1. le premier message est une DEMANDE de confirmation, pas une alerte. Sans
 *    double opt-in, n’importe qui pourrait inscrire l’adresse d’un tiers ;
 * 2. chaque e-mail porte un lien de désinscription en un clic, visible, pas
 *    caché en corps 6 au milieu d’un pied de page ;
 * 3. chaque e-mail rappelle pourquoi il est reçu et ce qui est suivi. Les
 *    clics depuis ces e-mails sont comptés — l’inscrit a consenti, mais le
 *    consentement suppose qu’il sache à quoi.
 */

import type { Offer } from '../offer';
import { CONTRACT_GROUP_LABELS, contractGroups } from '../offer';
import { brand } from '../brand';
import { familyBySlug } from '../taxonomy';

export interface ConfirmMailInput {
  confirmUrl: string;
  criteria: string;
}

export function confirmationMail(input: ConfirmMailInput): { subject: string; text: string; html: string } {
  const subject = `Confirmez votre alerte ${brand.name}`;

  const text = [
    `Vous avez demandé à recevoir les nouvelles offres d’alternance en finance`,
    `correspondant à : ${input.criteria}.`,
    '',
    'Confirmez en ouvrant ce lien :',
    input.confirmUrl,
    '',
    'Si vous n’êtes pas à l’origine de cette demande, ignorez ce message :',
    'sans confirmation, aucune alerte ne sera envoyée et votre adresse sera',
    'effacée.',
    '',
    'Ce que nous conservons : votre adresse e-mail et vos critères, rien d’autre.',
    'Ce que nous mesurons : les clics sur les offres depuis nos e-mails d’alerte,',
    'pour savoir lesquelles vous sont utiles. Détail et vos droits :',
    `${brand.url}/confidentialite`,
    '',
    brand.name,
  ].join('\n');

  const html = layout(
    `<h1>Confirmez votre alerte</h1>
     <p>Vous avez demandé à recevoir les nouvelles offres d’alternance en finance
        correspondant à : <strong>${escapeHtml(input.criteria)}</strong>.</p>
     <p><a class="btn" href="${escapeAttr(input.confirmUrl)}">Confirmer mon alerte</a></p>
     <p class="muted">Si vous n’êtes pas à l’origine de cette demande, ignorez ce message :
        sans confirmation, aucune alerte ne sera envoyée et votre adresse sera effacée.</p>
     <hr />
     <p class="muted">Nous conservons votre adresse e-mail et vos critères, rien d’autre.
        Nous comptons les clics sur les offres depuis nos e-mails d’alerte, pour savoir
        lesquelles vous sont utiles.
        <a href="${escapeAttr(`${brand.url}/confidentialite`)}">Détail et vos droits</a>.</p>`,
  );

  return { subject, text, html };
}

export interface DigestMailInput {
  offers: readonly Offer[];
  /** Liens déjà construits (comptage des clics compris), dans l’ordre de `offers`. */
  links: readonly string[];
  unsubscribeUrl: string;
  criteria: string;
}

export function digestMail(input: DigestMailInput): { subject: string; text: string; html: string } {
  const count = input.offers.length;
  const subject =
    count === 1
      ? `1 nouvelle offre d’alternance en finance`
      : `${count} nouvelles offres d’alternance en finance`;

  const lines = input.offers.map((offer, index) => {
    const place = offer.place.city ?? 'Lieu non précisé';
    const employer = offer.employer.brand ?? offer.employer.name ?? 'Employeur non précisé';
    const contracts = contractGroups(offer).map((g) => CONTRACT_GROUP_LABELS[g]).join(', ');
    return [
      `• ${offer.title}`,
      `  ${employer} — ${place} — ${contracts}`,
      `  ${input.links[index] ?? ''}`,
    ].join('\n');
  });

  const text = [
    `${subject}, pour vos critères : ${input.criteria}.`,
    '',
    ...lines,
    '',
    '—',
    'Vous recevez cet e-mail parce que vous avez confirmé une alerte sur',
    `${brand.domain}. Les clics sur les offres ci-dessus sont comptés.`,
    '',
    'Se désinscrire en un clic :',
    input.unsubscribeUrl,
  ].join('\n');

  const items = input.offers
    .map((offer, index) => {
      const place = offer.place.city ?? 'Lieu non précisé';
      const employer = offer.employer.brand ?? offer.employer.name ?? 'Employeur non précisé';
      const contracts = contractGroups(offer).map((g) => CONTRACT_GROUP_LABELS[g]).join(', ');
      const families = offer.families
        .map((slug) => familyBySlug(slug)?.label)
        .filter((label): label is string => Boolean(label))
        .join(' · ');
      return `<li>
        <a href="${escapeAttr(input.links[index] ?? '#')}"><strong>${escapeHtml(offer.title)}</strong></a><br />
        <span class="muted">${escapeHtml(employer)} — ${escapeHtml(place)} — ${escapeHtml(contracts)}${
          families ? ` — ${escapeHtml(families)}` : ''
        }</span>
      </li>`;
    })
    .join('\n');

  const html = layout(
    `<h1>${escapeHtml(subject)}</h1>
     <p class="muted">Vos critères : ${escapeHtml(input.criteria)}</p>
     <ul>${items}</ul>
     <hr />
     <p class="muted">Vous recevez cet e-mail parce que vous avez confirmé une alerte sur
        ${escapeHtml(brand.domain)}. Les clics sur les offres ci-dessus sont comptés, afin de
        savoir lesquelles sont utiles.</p>
     <p><a href="${escapeAttr(input.unsubscribeUrl)}">Se désinscrire en un clic</a></p>`,
  );

  return { subject, text, html };
}

/* --------------------------------------------------------------------------
 * Comptes
 * ------------------------------------------------------------------------ */

export function accountVerificationMail(input: { verifyUrl: string }): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = `Confirmez votre compte ${brand.name}`;

  const text = [
    `Bienvenue sur ${brand.name}.`,
    '',
    'Confirmez votre adresse en ouvrant ce lien :',
    input.verifyUrl,
    '',
    'Sans cette confirmation, le compte ne sera pas activé. Si vous n’êtes pas à',
    'l’origine de cette inscription, ignorez ce message.',
    '',
    'Ce que nous conservons : votre adresse e-mail, votre mot de passe sous forme',
    'chiffrée, et les offres que vous mettez de côté. Rien d’autre.',
    `${brand.url}/confidentialite`,
    '',
    brand.name,
  ].join('\n');

  const html = layout(
    `<h1>Confirmez votre compte</h1>
     <p>Bienvenue sur ${escapeHtml(brand.name)}. Une dernière étape avant d’y accéder.</p>
     <p><a class="btn" href="${escapeAttr(input.verifyUrl)}">Confirmer mon adresse</a></p>
     <p class="muted">Sans cette confirmation, le compte ne sera pas activé. Si vous n’êtes
        pas à l’origine de cette inscription, ignorez ce message.</p>
     <hr />
     <p class="muted">Nous conservons votre adresse e-mail, votre mot de passe sous forme
        chiffrée, et les offres que vous mettez de côté. Rien d’autre.
        <a href="${escapeAttr(`${brand.url}/confidentialite`)}">Vos droits</a>.</p>`,
  );

  return { subject, text, html };
}

/**
 * Message envoyé lorsqu'une inscription vise une adresse déjà inscrite.
 *
 * Il part vers la boîte du propriétaire légitime, et non vers l'écran de
 * celui qui a rempli le formulaire : c'est ce qui permet de répondre la même
 * chose dans les deux cas sans révéler qui possède un compte ici.
 */
export function accountExistsMail(input: { loginUrl: string }): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = `Vous avez déjà un compte ${brand.name}`;

  const text = [
    `Quelqu’un vient de tenter de créer un compte ${brand.name} avec votre adresse.`,
    '',
    'Vous en avez déjà un. Connectez-vous ici :',
    input.loginUrl,
    '',
    'Si ce n’était pas vous, il n’y a rien à faire : aucun compte n’a été créé et',
    'aucune information n’a été modifiée.',
    '',
    brand.name,
  ].join('\n');

  const html = layout(
    `<h1>Vous avez déjà un compte</h1>
     <p>Quelqu’un vient de tenter de créer un compte ${escapeHtml(brand.name)} avec votre
        adresse. Vous en avez déjà un.</p>
     <p><a class="btn" href="${escapeAttr(input.loginUrl)}">Me connecter</a></p>
     <p class="muted">Si ce n’était pas vous, il n’y a rien à faire : aucun compte n’a été
        créé et aucune information n’a été modifiée.</p>`,
  );

  return { subject, text, html };
}

export function passwordResetMail(input: { resetUrl: string }): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = `Réinitialiser votre mot de passe ${brand.name}`;

  const text = [
    'Vous avez demandé à réinitialiser votre mot de passe.',
    '',
    'Ouvrez ce lien pour en choisir un nouveau :',
    input.resetUrl,
    '',
    'Ce lien expire dans une heure et ne fonctionne qu’une seule fois.',
    '',
    'Si vous n’êtes pas à l’origine de cette demande, ignorez ce message :',
    'votre mot de passe actuel reste valable et rien n’a été modifié.',
    '',
    brand.name,
  ].join('\n');

  const html = layout(
    `<h1>Réinitialiser votre mot de passe</h1>
     <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
     <p><a class="btn" href="${escapeAttr(input.resetUrl)}">Choisir un nouveau mot de passe</a></p>
     <p class="muted">Ce lien expire dans une heure et ne fonctionne qu’une seule fois.</p>
     <hr />
     <p class="muted">Si vous n’êtes pas à l’origine de cette demande, ignorez ce message :
        votre mot de passe actuel reste valable et rien n’a été modifié.</p>`,
  );

  return { subject, text, html };
}

/**
 * Message envoyé lorsqu'une demande de réinitialisation vise une adresse sans
 * compte.
 *
 * Il permet de répondre exactement la même chose à l'écran dans les deux cas,
 * sans transformer le formulaire en annuaire — et il est réellement utile à
 * quelqu'un qui s'est trompé d'adresse en s'inscrivant.
 */
export function resetNoAccountMail(input: { signUpUrl: string }): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = `Aucun compte ${brand.name} à cette adresse`;

  const text = [
    `Quelqu’un a demandé à réinitialiser un mot de passe ${brand.name} pour cette adresse.`,
    '',
    'Aucun compte n’y est associé. Vous avez peut-être utilisé une autre adresse,',
    'ou vous n’avez pas encore de compte :',
    input.signUpUrl,
    '',
    'Si ce n’était pas vous, il n’y a rien à faire.',
    '',
    brand.name,
  ].join('\n');

  const html = layout(
    `<h1>Aucun compte à cette adresse</h1>
     <p>Quelqu’un a demandé à réinitialiser un mot de passe ${escapeHtml(brand.name)} pour
        cette adresse. Aucun compte n’y est associé.</p>
     <p>Vous avez peut-être utilisé une autre adresse, ou vous n’avez pas encore de compte.</p>
     <p><a class="btn" href="${escapeAttr(input.signUpUrl)}">Créer un compte</a></p>
     <p class="muted">Si ce n’était pas vous, il n’y a rien à faire.</p>`,
  );

  return { subject, text, html };
}

/**
 * Avertissement avant suppression d'un compte resté inactif.
 *
 * Un compte porte des offres mises de côté et des candidatures notées :
 * l'effacer sans prévenir ferait disparaître le travail de quelqu'un pour
 * appliquer une règle qu'il n'a jamais lue. Ce message dit ce qui va se
 * passer, quand, et comment l'empêcher — se connecter suffit.
 */
export function accountPurgeWarningMail(input: { email: string; deleteAfterDays: number }): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = `Votre compte ${brand.name} va être supprimé`;
  const loginUrl = `${brand.url}/connexion`;
  const jours = input.deleteAfterDays;

  const text = [
    `Votre compte ${brand.name} n’a pas servi depuis près de deux ans.`,
    '',
    `Sans connexion de votre part dans les ${jours} prochains jours, il sera supprimé,`,
    'avec vos offres mises de côté, vos candidatures notées et votre alerte.',
    'Nous ne gardons pas de données dont personne ne se sert.',
    '',
    'Pour le conserver, il suffit de vous connecter une fois :',
    loginUrl,
    '',
    'Si vous n’en avez plus besoin, vous n’avez rien à faire.',
    '',
    brand.name,
  ].join('\n');

  const html = layout(
    `<h1>Votre compte va être supprimé</h1>
     <p>Votre compte ${escapeHtml(brand.name)} n’a pas servi depuis près de deux ans.</p>
     <p>Sans connexion de votre part dans les <strong>${jours} prochains jours</strong>, il
        sera supprimé, avec vos offres mises de côté, vos candidatures notées et votre
        alerte. Nous ne gardons pas de données dont personne ne se sert.</p>
     <p><a class="btn" href="${escapeAttr(loginUrl)}">Conserver mon compte</a></p>
     <p class="muted">Si vous n’en avez plus besoin, vous n’avez rien à faire.</p>`,
  );

  return { subject, text, html };
}

function layout(body: string): string {
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(brand.name)}</title>
<style>
  /*
   * Mêmes couleurs que le site, sur fond clair : une messagerie affiche mieux
   * un message clair, et beaucoup forcent leur propre fond. Les polices sont
   * celles de repli — Arial et Georgia — parce qu'une messagerie ne charge pas
   * de police distante, et qu'on n'en demande aucune à un tiers.
   */
  body { margin:0; padding:24px; background:#faf9f5; color:#141413;
         font-family: Lora, Georgia, serif;
         font-size:16px; line-height:1.55; }
  .card { max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px;
          padding:28px; border:1px solid #e8e6dc; }
  h1 { font-family: Poppins, Arial, sans-serif; font-size:20px; margin:0 0 12px; }
  ul { padding-left:18px; }
  li { margin-bottom:14px; }
  a { color:#a8492c; }
  .btn { display:inline-block; background:#d97757; color:#141413 !important; padding:11px 18px;
         font-family: Poppins, Arial, sans-serif;
         border-radius:8px; text-decoration:none; font-weight:600; }
  .muted { color:#6b6962; font-size:14px; }
  hr { border:none; border-top:1px solid #e8e6dc; margin:22px 0; }
</style></head>
<body><div class="card">${body}</div></body></html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(text: string): string {
  return escapeHtml(text).replace(/'/g, '&#39;');
}
