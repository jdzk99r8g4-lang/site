'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Liens de navigation, avec soulignement de la page courante.
 *
 * Séparé de l'en-tête parce que seule cette partie a besoin de tourner dans
 * le navigateur : connaître le chemin courant. L'en-tête lui-même reste un
 * composant serveur, ce qui lui permet de savoir si quelqu'un est connecté
 * sans exposer la session au navigateur.
 */
const LINKS = [
  { href: '/', label: 'Accueil' },
  { href: '/offres', label: 'Offres' },
  { href: '/metiers', label: 'Métiers' },
  { href: '/alertes', label: 'Alertes' },
  { href: '/a-propos', label: 'À propos' },
] as const;

export function HeaderNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-x-6 gap-y-1" aria-label="Navigation principale">
      {LINKS.map((link) => {
        const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
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
  );
}
