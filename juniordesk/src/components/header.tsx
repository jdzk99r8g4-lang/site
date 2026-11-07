'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { brand } from '@/lib/brand';

/**
 * En-tête collant, reprise du brouillon : point vert lumineux devant le nom,
 * navigation sobre, soulignement vert sur la page courante, et un seul appel à
 * l'action en orange.
 *
 * Les entrées « Se connecter », « S'abonner », « Mes candidatures » et
 * « Profil » du brouillon ne figurent pas ici : les comptes et l'espace
 * recruteur sont la V2, et le site est gratuit sans abonnement. Mettre un
 * bouton qui ne mène à rien coûte plus de confiance qu'il n'en rapporte.
 */
const LINKS = [
  { href: '/', label: 'Accueil' },
  { href: '/offres', label: 'Offres' },
  { href: '/metiers', label: 'Métiers' },
  { href: '/alertes', label: 'Alertes' },
  { href: '/sources', label: 'À propos' },
] as const;

export function Header() {
  const pathname = usePathname();

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

        <nav className="flex flex-wrap items-center gap-x-6 gap-y-1">
          {LINKS.map((link) => {
            const active =
              link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`relative pb-1 text-sm font-medium no-underline transition-colors ${
                  active
                    ? 'text-ink after:absolute after:inset-x-0 after:-bottom-[14px] after:h-0.5 after:bg-accent'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/alertes"
          className="ml-auto rounded-lg bg-cta px-4 py-2.5 text-sm font-bold text-cta-ink no-underline transition-colors hover:bg-cta-hover active:scale-[0.97]"
        >
          Créer une alerte
        </Link>
      </div>
    </header>
  );
}
