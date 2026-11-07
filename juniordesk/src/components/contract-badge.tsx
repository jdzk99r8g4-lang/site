import type { ContractGroup } from '@/lib/offer';
import { CONTRACT_GROUP_LABELS } from '@/lib/offer';

/**
 * Badge de famille de contrat.
 *
 * Une couleur par famille, reprise du brouillon : vert pour le stage, bleu
 * pour l'alternance, ambre pour le poste junior. Ce n'est pas décoratif — un
 * candidat qui balaie une liste doit distinguer les types sans lire.
 *
 * La couleur ne porte jamais l'information seule : le libellé est toujours
 * écrit à côté, pour que la distinction tienne aussi sans perception des
 * couleurs.
 */
const STYLES: Record<ContractGroup, string> = {
  stage: 'bg-accent-bg text-accent',
  alternance: 'bg-blue-bg text-blue',
  junior: 'bg-amber-bg text-amber',
};

export function ContractBadge({ group }: { group: ContractGroup }) {
  return (
    <span className={`inline-block rounded-[14px] px-2.5 py-1 text-xs font-semibold ${STYLES[group]}`}>
      {CONTRACT_GROUP_LABELS[group]}
    </span>
  );
}

export function contractBadgeClass(group: ContractGroup): string {
  return STYLES[group];
}
