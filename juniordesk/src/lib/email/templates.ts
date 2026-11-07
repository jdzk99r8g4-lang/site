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

function layout(body: string): string {
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(brand.name)}</title>
<style>
  body { margin:0; padding:24px; background:#f6f7f9; color:#15181d;
         font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
         font-size:16px; line-height:1.55; }
  .card { max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px;
          padding:28px; border:1px solid #e4e7ec; }
  h1 { font-size:20px; margin:0 0 12px; }
  ul { padding-left:18px; }
  li { margin-bottom:14px; }
  a { color:#16507d; }
  .btn { display:inline-block; background:#16507d; color:#ffffff !important; padding:11px 18px;
         border-radius:8px; text-decoration:none; font-weight:600; }
  .muted { color:#5a6372; font-size:14px; }
  hr { border:none; border-top:1px solid #e4e7ec; margin:22px 0; }
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
