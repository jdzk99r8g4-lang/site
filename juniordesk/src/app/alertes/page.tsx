import Link from 'next/link';
import type { Metadata } from 'next';
import { brand } from '@/lib/brand';
import { getLiveOffers } from '@/lib/offers';
import { buildFacets } from '@/lib/filters';
import { activeContractGroups } from '@/lib/sources';
import { JOB_FAMILIES } from '@/lib/taxonomy';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Alertes e-mail',
  description:
    'Recevez par e-mail les nouvelles offres correspondant à vos critères. Sans compte, ' +
    'sans mot de passe, désinscription en un clic.',
};

const MESSAGES: Record<string, { tone: 'ok' | 'ko'; text: string }> = {
  envoye: {
    tone: 'ok',
    text:
      'C’est presque fait : ouvrez l’e-mail que nous venons d’envoyer et cliquez le lien de ' +
      'confirmation. Sans ce clic, aucune alerte ne partira — c’est ce qui empêche ' +
      'quelqu’un d’inscrire votre adresse à votre place.',
  },
  deja: {
    tone: 'ok',
    text: 'Vos critères ont été mis à jour. Votre alerte était déjà confirmée.',
  },
  simule: {
    tone: 'ok',
    text:
      'Inscription enregistrée, mais aucun e-mail n’a été envoyé : la clé Resend n’est pas ' +
      'configurée, donc les messages sont écrits dans la console du serveur.',
  },
  adresse: { tone: 'ko', text: 'Cette adresse e-mail ne semble pas valide.' },
  envoi: {
    tone: 'ko',
    text: 'L’e-mail de confirmation n’a pas pu être envoyé. Réessayez dans un moment.',
  },
};

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const state = typeof params['etat'] === 'string' ? params['etat'] : '';
  const message = MESSAGES[state];

  const preselectedFamily = typeof params['metier'] === 'string' ? params['metier'] : '';
  const preselectedCity = typeof params['ville'] === 'string' ? params['ville'] : '';

  const offers = await getLiveOffers();
  const facets = buildFacets(offers, activeContractGroups());

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold sm:text-3xl">Alertes e-mail</h1>
      <p className="mt-2 text-sm text-muted">
        Une seule adresse, vos critères, et vous recevez les nouvelles offres dès qu’elles sont
        collectées. Pas de compte, pas de mot de passe, désinscription en un clic.
      </p>

      {message ? (
        <p
          role="status"
          className={`mt-6 rounded-card border p-4 text-sm ${
            message.tone === 'ok'
              ? 'border-accent/40 bg-accent-bg text-ink'
              : 'border-warn/40 bg-warn-bg text-ink'
          }`}
        >
          {message.text}
        </p>
      ) : null}

      <form
        method="post"
        action="/api/alertes"
        className="mt-7 rounded-card border border-line bg-card p-5 shadow-card"
      >
        <label className="block">
          <span className="block text-[15px] font-bold">Votre adresse e-mail</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="prenom.nom@exemple.fr"
            className="mt-2 w-full rounded-xl px-[18px] py-[13px] text-sm"
          />
        </label>

        <fieldset className="mt-6">
          <legend className="text-[15px] font-bold">Type de contrat</legend>
          <p className="mt-1 text-[13px] text-muted">
            Laissez vide pour tout recevoir. Les types sans source branchée ne produiront rien
            tant qu’une source n’est pas ajoutée — mais votre choix est conservé.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {facets.groups.map((group) => (
              <label
                key={group.value}
                className="inline-flex cursor-pointer items-center gap-2 rounded-[20px] border border-line bg-bg px-3.5 py-2 text-[13px] transition-colors hover:border-line-hover"
              >
                <input type="checkbox" name="type" value={group.value} />
                <span>{group.label}</span>
                {!group.sourced ? <span className="text-[11px] text-warn">à venir</span> : null}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="text-[15px] font-bold">Métiers</legend>
          <p className="mt-1 text-[13px] text-muted">Laissez vide pour toute la finance.</p>
          <div className="mt-3 grid gap-x-5 gap-y-2 sm:grid-cols-2">
            {JOB_FAMILIES.map((family) => (
              <label key={family.slug} className="flex cursor-pointer items-center gap-2.5 text-[13.5px]">
                <input
                  type="checkbox"
                  name="metier"
                  value={family.slug}
                  defaultChecked={preselectedFamily === family.slug}
                />
                <span>{family.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {facets.cities.length > 0 ? (
          <fieldset className="mt-6">
            <legend className="text-[15px] font-bold">Villes</legend>
            <p className="mt-1 text-[13px] text-muted">Laissez vide pour toute la France.</p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              {facets.cities.slice(0, 24).map((city) => (
                <label key={city.value} className="flex cursor-pointer items-center gap-2.5 text-[13.5px]">
                  <input
                    type="checkbox"
                    name="ville"
                    value={city.value}
                    defaultChecked={preselectedCity === city.value}
                  />
                  <span>{city.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        <button
          type="submit"
          className="mt-7 rounded-lg bg-cta px-[18px] py-2.5 text-sm font-bold text-cta-ink transition-colors hover:bg-cta-hover active:scale-[0.97]"
        >
          Créer mon alerte
        </button>

        {/*
         * L'information sur le traitement est donnée AVANT l'envoi, à côté du
         * bouton, et non reléguée dans une page que personne n'ouvre.
         */}
        <p className="mt-4 text-[13px] text-muted">
          Nous conservons votre adresse et vos critères, rien d’autre. Nous comptons les clics
          sur les offres depuis nos e-mails d’alerte, afin de savoir lesquelles sont utiles.
          Aucune donnée n’est cédée ni revendue.{' '}
          <Link href="/confidentialite" className="text-accent">
            Détail et vos droits
          </Link>
          .
        </p>
      </form>

      <section className="mt-8 rounded-card border border-line bg-card p-5 text-sm text-muted">
        <h2 className="text-[15px] font-bold text-ink">Pourquoi une confirmation par e-mail</h2>
        <p className="mt-2">
          Sans elle, n’importe qui pourrait inscrire l’adresse d’un tiers et {brand.name} se
          mettrait à envoyer des messages à quelqu’un qui n’a rien demandé. Le lien de
          confirmation expire au bout de trente jours.
        </p>
      </section>
    </main>
  );
}
