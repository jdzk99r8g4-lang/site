import Link from 'next/link';

/**
 * Bandeau affiché quand le site tourne sur le jeu de démonstration.
 *
 * Il doit être impossible de confondre une offre fabriquée avec une vraie, y
 * compris si une capture d'écran circule hors contexte. D'où ce bandeau, et le
 * préfixe « [EXEMPLE] » dans chaque intitulé.
 */
export function DemoBanner() {
  return (
    <div className="border-b border-warn/40 bg-warn-bg">
      <p className="mx-auto max-w-[1140px] px-5 py-3 text-sm text-muted sm:px-7">
        <strong className="font-semibold text-warn">Données de démonstration.</strong> Aucune
        clé API n’est configurée : les offres affichées sont fabriquées et ne correspondent à
        aucun poste réel. Renseignez{' '}
        <code className="font-mono text-xs text-ink">LBA_API_KEY</code> pour collecter les
        vraies offres —{' '}
        <Link href="/sources" className="text-accent underline">
          comment faire
        </Link>
        .
      </p>
    </div>
  );
}
