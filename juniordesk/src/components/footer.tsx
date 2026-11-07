import Link from 'next/link';
import { brand } from '@/lib/brand';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-bg-header">
      <div className="mx-auto max-w-[1140px] px-5 py-10 text-sm text-muted sm:px-7">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="flex items-center gap-2 font-extrabold text-ink">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent)]"
              />
              {brand.name}
            </p>
            <p className="mt-2">
              Le job board spécialisé pour les étudiants et jeunes diplômés qui visent la
              finance.
            </p>
            <p className="mt-3 text-muted-2">Gratuit. Aucun abonnement, aucune option payante.</p>
          </div>

          <nav aria-label="Navigation du site">
            <p className="font-bold text-ink">{brand.name}</p>
            <ul className="mt-2 space-y-1.5">
              <li>
                <Link href="/offres" className="no-underline hover:text-ink">
                  Offres
                </Link>
              </li>
              <li>
                <Link href="/metiers" className="no-underline hover:text-ink">
                  Métiers
                </Link>
              </li>
              <li>
                <Link href="/villes" className="no-underline hover:text-ink">
                  Villes
                </Link>
              </li>
              <li>
                <Link href="/alertes" className="no-underline hover:text-ink">
                  Alertes
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Informations légales">
            <p className="font-bold text-ink">Informations</p>
            <ul className="mt-2 space-y-1.5">
              <li>
                <Link href="/sources" className="no-underline hover:text-ink">
                  D’où viennent les offres
                </Link>
              </li>
              <li>
                <Link href="/mentions-legales" className="no-underline hover:text-ink">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link href="/confidentialite" className="no-underline hover:text-ink">
                  Confidentialité
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/*
         * Dit une fois, en clair, plutôt que par un bandeau de consentement :
         * il n'y a rien à consentir puisque rien n'est déposé.
         */}
        <p className="mt-8 border-t border-line pt-6 text-xs text-muted-2">
          Ce site ne dépose aucun cookie et n’utilise aucun traceur : il ne compte que des
          totaux anonymes de pages vues et de clics vers les employeurs. C’est pourquoi vous
          ne voyez aucune bannière à accepter.
        </p>
        <p className="mt-2 text-xs text-muted-2">
          © {new Date().getFullYear()} {brand.name}. Stages · Alternances · Jobs juniors.
        </p>
      </div>
    </footer>
  );
}
