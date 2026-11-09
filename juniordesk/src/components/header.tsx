import Link from 'next/link';
import { brand } from '@/lib/brand';
import { currentAccount } from '@/lib/auth';
import { HeaderNav } from './header-nav';

/**
 * En-tête du site.
 *
 * Composant SERVEUR : il lit la session pour savoir s'il faut afficher
 * « Se connecter » ou « Mon espace ». C'est volontaire — la session ne doit
 * jamais être lisible depuis le navigateur, et le cookie est `httpOnly`.
 * Seule la navigation, qui a besoin du chemin courant, tourne côté client.
 */
export async function Header() {
  const account = await currentAccount();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg-header">
      <div className="mx-auto flex max-w-[1140px] flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3.5 sm:px-7">
        <Link href="/" className="flex items-center gap-2 font-extrabold tracking-[0.2px] no-underline">
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent)]"
          />
          {brand.name}
        </Link>

        <span className="rounded-full bg-accent-bg px-2.5 py-0.5 text-xs font-semibold text-accent">
          {brand.scope.available.label}
        </span>

        <HeaderNav />

        <div className="ml-auto flex flex-wrap items-center gap-3">
          {account ? (
            <>
              <Link
                href="/mon-espace"
                className="text-sm font-semibold text-ink no-underline hover:text-accent"
              >
                Mon espace
              </Link>
              <form method="post" action="/api/compte/deconnexion">
                <button
                  type="submit"
                  className="rounded-lg border border-line bg-card px-3.5 py-2 text-sm font-semibold transition-colors hover:border-line-hover"
                >
                  Se déconnecter
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/connexion"
                className="text-sm font-medium text-muted no-underline hover:text-ink"
              >
                Se connecter
              </Link>
              <Link
                href="/inscription"
                className="rounded-lg bg-cta px-4 py-2.5 text-sm font-bold text-cta-ink no-underline transition-colors hover:bg-cta-hover active:scale-[0.97]"
              >
                S’inscrire
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
