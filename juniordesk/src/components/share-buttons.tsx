'use client';

import { useState } from 'react';

/**
 * Partage d'une offre.
 *
 * Deux chemins, aucun script tiers :
 *
 * - `navigator.share` quand le navigateur le propose (c'est le cas sur mobile,
 *   là où le partage se fait vraiment). Le système affiche alors toutes les
 *   applications installées, WhatsApp comprise ;
 * - sinon un lien `wa.me`, qui est l'adresse de partage documentée par
 *   WhatsApp, plus la copie du lien.
 *
 * Aucun kit de développement n'est chargé : un bouton de partage qui fait
 * venir du code de Meta sur la page déposerait des traceurs et obligerait à
 * afficher une bannière de consentement — pour un bouton.
 */
export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const message = `${title}\n${url}`;

  async function shareNative() {
    // `navigator.share` n'existe pas partout : on teste avant d'appeler.
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title, text: title, url });
        return true;
      } catch {
        // L'utilisateur a annulé, ou le partage a échoué : on retombe sur le reste.
      }
    }
    return false;
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={`https://wa.me/?text=${encodeURIComponent(message)}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={async (event) => {
          // Si le partage natif existe, il est meilleur : on l'utilise et on
          // laisse le lien WhatsApp comme repli pour les navigateurs de bureau.
          if (await shareNative()) event.preventDefault();
        }}
        className="rounded-md border border-line bg-paper px-3 py-2 text-sm font-medium no-underline hover:border-accent/50 hover:text-accent"
      >
        Partager
      </a>

      <button
        type="button"
        onClick={copyLink}
        className="rounded-md border border-line bg-paper px-3 py-2 text-sm font-medium hover:border-accent/50 hover:text-accent"
      >
        {copied ? 'Lien copié' : 'Copier le lien'}
      </button>
    </div>
  );
}
