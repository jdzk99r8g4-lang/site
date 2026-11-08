import Link from 'next/link';
import { currentAccount } from '@/lib/auth';

/**
 * Boutons « Mettre de côté » et « J'ai postulé » sur la page d'une offre.
 *
 * Composant SERVEUR, et de simples formulaires en POST : tout fonctionne sans
 * JavaScript, et l'état affiché vient du compte, pas d'un stockage local du
 * navigateur — ce qui veut dire qu'il suit la personne d'un appareil à
 * l'autre.
 *
 * `J'ai postulé` est déclaratif et le dit : la candidature se fait chez
 * l'employeur, nous n'avons aucun moyen de savoir si elle a eu lieu, et nous
 * ne cherchons pas à le savoir.
 */
export async function OfferAccountActions({
  offerId,
  returnTo,
}: {
  offerId: string;
  returnTo: string;
}) {
  const account = await currentAccount();

  if (!account) {
    return (
      <p className="text-[13px] text-muted">
        <Link href="/connexion" className="text-accent">
          Connectez-vous
        </Link>{' '}
        pour mettre cette offre de côté et suivre vos candidatures.{' '}
        <Link href="/inscription" className="text-accent">
          Créer un compte
        </Link>{' '}
        prend dix secondes et c’est gratuit.
      </p>
    );
  }

  const saved = account.savedOfferIds.includes(offerId);
  const applied = account.applications.some((a) => a.offerId === offerId);

  return (
    <div className="flex flex-wrap gap-2">
      <form method="post" action="/api/compte/offre">
        <input type="hidden" name="offre" value={offerId} />
        <input type="hidden" name="retour" value={returnTo} />
        <button
          type="submit"
          aria-pressed={saved}
          className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
            saved
              ? 'border-accent bg-accent-bg text-accent'
              : 'border-line bg-card hover:border-line-hover'
          }`}
        >
          {saved ? 'Retirer de mes offres' : 'Mettre de côté'}
        </button>
      </form>

      <form method="post" action="/api/compte/offre">
        <input type="hidden" name="offre" value={offerId} />
        <input type="hidden" name="action" value="candidature" />
        <input type="hidden" name="retour" value={returnTo} />
        <button
          type="submit"
          aria-pressed={applied}
          className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
            applied
              ? 'border-accent bg-accent-bg text-accent'
              : 'border-line bg-card hover:border-line-hover'
          }`}
        >
          {applied ? 'Postulé — annuler' : 'J’ai postulé'}
        </button>
      </form>
    </div>
  );
}
