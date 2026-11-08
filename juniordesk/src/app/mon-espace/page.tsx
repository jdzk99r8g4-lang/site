import Link from 'next/link';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { currentAccount } from '@/lib/auth';
import { getLiveOffers } from '@/lib/offers';
import { toPublicOffer, type Offer } from '@/lib/offer';
import { getStore } from '@/lib/store';
import { describeCriteria } from '@/lib/alerts';
import { OfferCard } from '@/components/offer-card';
import { formatDate } from '@/components/offer-card';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mon espace',
  robots: { index: false, follow: false },
};

export default async function MySpacePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const account = await currentAccount();
  if (!account) redirect('/connexion');

  const params = await searchParams;
  const confirmationMissing = params['erreur'] === 'confirmation';
  const welcome = params['bienvenue'] === '1';
  const linked = params['rattache'] === '1';

  const live = await getLiveOffers();
  const byId = new Map(live.map((offer) => [offer.id, offer]));

  const saved = account.savedOfferIds
    .map((id) => byId.get(id))
    .filter((offer): offer is Offer => offer !== undefined);

  const applications = account.applications
    .map((entry) => ({ offer: byId.get(entry.offerId), markedAt: entry.markedAt }))
    .filter((entry): entry is { offer: Offer; markedAt: string } => entry.offer !== undefined);

  /*
   * Les offres disparues ne sont pas effacées de la liste du compte : elles
   * sont comptées et annoncées. Une offre retirée est une information utile
   * — elle dit que le poste n'est plus ouvert — et la faire disparaître
   * silencieusement laisserait croire à une perte de données.
   */
  const savedGone = account.savedOfferIds.length - saved.length;
  const applicationsGone = account.applications.length - applications.length;

  // L'alerte e-mail partage l'identifiant dérivé de l'adresse : pas de table
  // de correspondance à tenir.
  const subscription = await getStore().getSubscription(account.id);

  return (
    <main className="mx-auto max-w-[1140px] px-5 py-10 sm:px-6">
      {/* Pas de bouton de déconnexion ici : l'en-tête en porte déjà un. */}
      <h1 className="text-2xl font-extrabold sm:text-3xl">Mon espace</h1>
      <p className="mt-1.5 text-sm text-muted">{account.email}</p>

      {welcome ? (
        <p role="status" className="mt-6 rounded-card border border-accent/40 bg-accent-bg p-4 text-sm">
          Compte créé avec Google. Votre adresse est déjà confirmée — vous pouvez mettre des
          offres de côté tout de suite.
        </p>
      ) : null}

      {linked ? (
        <p role="status" className="mt-6 rounded-card border border-accent/40 bg-accent-bg p-4 text-sm">
          Votre compte Google a été rattaché au compte que vous aviez déjà à cette adresse.
          Vos offres enregistrées, vos candidatures et votre alerte sont intactes : vous
          pouvez désormais vous connecter d’une façon ou de l’autre.
        </p>
      ) : null}

      {confirmationMissing ? (
        <p role="alert" className="mt-6 rounded-card border border-warn/40 bg-warn-bg p-4 text-sm">
          La suppression n’a pas eu lieu : il faut cocher la case de confirmation.
        </p>
      ) : null}

      {/* Offres mises de côté */}
      <section className="mt-10">
        <h2 className="text-[15px] font-bold">
          Offres enregistrées{' '}
          <span className="font-normal text-muted">({saved.length})</span>
        </h2>

        {saved.length > 0 ? (
          <div className="mt-4 grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
            {saved.map((offer) => (
              <OfferCard key={offer.id} offer={toPublicOffer(offer)} />
            ))}
          </div>
        ) : (
          <p className="mt-3 rounded-card border border-line bg-card p-6 text-sm text-muted">
            Rien de mis de côté pour l’instant. Sur la page d’une offre, le bouton
            « Mettre de côté » l’ajoute ici.{' '}
            <Link href="/offres" className="text-accent">
              Parcourir les offres
            </Link>
          </p>
        )}

        {savedGone > 0 ? (
          <p className="mt-3 text-[13px] text-muted-2">
            {savedGone} offre{savedGone === 1 ? '' : 's'} que vous aviez enregistrée
            {savedGone === 1 ? '' : 's'} {savedGone === 1 ? 'a' : 'ont'} été retirée
            {savedGone === 1 ? '' : 's'} par l’employeur ou {savedGone === 1 ? 'a' : 'ont'}{' '}
            expiré.
          </p>
        ) : null}
      </section>

      {/* Candidatures */}
      <section className="mt-12">
        <h2 className="text-[15px] font-bold">
          Mes candidatures <span className="font-normal text-muted">({applications.length})</span>
        </h2>
        <p className="mt-1.5 text-[13px] text-muted">
          Ce que vous notez ici vient de vous seul. La candidature se fait sur le site de
          l’employeur : nous n’avons aucun moyen de savoir si vous avez postulé, et nous ne
          cherchons pas à le savoir.
        </p>

        {applications.length > 0 ? (
          <ul className="mt-4 grid gap-2">
            {applications.map(({ offer, markedAt }) => (
              <li
                key={offer.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-card p-4"
              >
                <div className="min-w-0">
                  <Link
                    href={`/offres/${offer.slug}`}
                    className="text-[15px] font-semibold no-underline hover:text-accent"
                  >
                    {offer.title}
                  </Link>
                  <p className="mt-0.5 text-[13px] text-muted">
                    {offer.employer.brand ?? offer.employer.name ?? 'Employeur non précisé'}
                    {offer.place.city ? ` · ${offer.place.city}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[13px] text-muted-2">
                    Noté le {formatDate(markedAt)}
                  </span>
                  <form method="post" action="/api/compte/offre">
                    <input type="hidden" name="offre" value={offer.id} />
                    <input type="hidden" name="action" value="candidature" />
                    <input type="hidden" name="retour" value="/mon-espace" />
                    <button
                      type="submit"
                      className="rounded-md border border-line px-3 py-1.5 text-[13px] text-muted transition-colors hover:border-line-hover hover:text-ink"
                    >
                      Retirer
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 rounded-card border border-line bg-card p-6 text-sm text-muted">
            Aucune candidature notée. Sur la page d’une offre, « J’ai postulé » la range ici.
          </p>
        )}

        {applicationsGone > 0 ? (
          <p className="mt-3 text-[13px] text-muted-2">
            {applicationsGone} offre{applicationsGone === 1 ? '' : 's'} que vous aviez notée
            {applicationsGone === 1 ? '' : 's'} n’{applicationsGone === 1 ? 'est' : 'sont'} plus
            en ligne.
          </p>
        ) : null}
      </section>

      {/* Alertes */}
      <section className="mt-12">
        <h2 className="text-[15px] font-bold">Mes alertes e-mail</h2>
        {subscription ? (
          <div className="mt-3 rounded-card border border-line bg-card p-5 text-sm">
            <p>
              {subscription.confirmed ? (
                <>Alerte active : <strong className="text-ink">{describeCriteria(subscription)}</strong></>
              ) : (
                <span className="text-warn">
                  Alerte en attente de confirmation. Ouvrez l’e-mail reçu et cliquez le lien.
                </span>
              )}
            </p>
            <p className="mt-3">
              <Link href="/alertes" className="text-accent">
                Modifier mes critères →
              </Link>
            </p>
          </div>
        ) : (
          <p className="mt-3 rounded-card border border-line bg-card p-6 text-sm text-muted">
            Aucune alerte. {' '}
            <Link href="/alertes" className="text-accent">
              En créer une
            </Link>{' '}
            pour recevoir les nouvelles offres correspondant à vos critères.
          </p>
        )}
      </section>

      {/* Suppression */}
      <section className="mt-14 rounded-card border border-warn/40 bg-warn-bg p-5">
        <h2 className="text-[15px] font-bold text-warn">Supprimer mon compte</h2>
        <p className="mt-2 text-sm text-muted">
          La suppression est immédiate et définitive : votre adresse, votre mot de passe, vos
          offres enregistrées, vos candidatures notées et votre alerte e-mail sont effacés.
          Nous ne gardons rien.
        </p>
        <form method="post" action="/api/compte/suppression" className="mt-4">
          <label className="flex items-center gap-2.5 text-sm">
            <input type="checkbox" id="confirmation" name="confirmation" value="oui" />
            <span>Je comprends que cette action est irréversible.</span>
          </label>
          <button
            type="submit"
            className="mt-4 rounded-lg border border-warn bg-transparent px-4 py-2 text-sm font-semibold text-warn transition-colors hover:bg-warn hover:text-bg"
          >
            Supprimer définitivement
          </button>
        </form>
      </section>
    </main>
  );
}
