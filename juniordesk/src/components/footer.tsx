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
         * Formulation exacte, et elle a changé le jour où les comptes sont
         * arrivés : dire « aucun cookie » serait désormais faux. Un cookie de
         * session est strictement nécessaire au service demandé par la
         * personne qui se connecte, donc exempté de consentement au titre de
         * l'article 82 — il n'y a toujours pas de bannière à afficher, mais
         * il y a bien un cookie, et il faut le dire.
         */}
        <p className="mt-8 border-t border-line pt-6 text-xs text-muted-2">
          Aucun traceur publicitaire, aucun outil de mesure tiers : nous ne comptons que des
          totaux anonymes de pages vues et de clics vers les employeurs. Le seul cookie déposé
          est celui qui vous garde connecté, et uniquement si vous avez un compte. C’est
          pourquoi vous ne voyez aucune bannière à accepter.
        </p>
        <p className="mt-2 text-xs text-muted-2">
          © {new Date().getFullYear()} {brand.name}. Stages · Alternances · Jobs juniors.
        </p>
      </div>
    </footer>
  );
}
