import type { ContractGroup } from '@/lib/offer';
import { CONTRACT_GROUP_LABELS } from '@/lib/offer';

/**
 * Badge de famille de contrat.
 *
 * Une couleur par famille, reprise du brouillon : vert pour le stage, bleu
 * pour l’alternance, orange pour le poste junior. Ce n’est pas décoratif — un
 * candidat qui balaie une liste doit distinguer les types sans lire.
 *
 * La couleur ne porte jamais l'information seule : le libellé est toujours
 * écrit à côté, pour que la distinction tienne aussi sans perception des
 * couleurs.
 */
const STYLES: Record<ContractGroup, string> = {
  /*
   * Le stage a son propre vert, et non la couleur d'accent : l'accent du site
   * est l'orange, qui est aussi la couleur du poste junior. Avec l'accent, les
   * deux badges auraient été identiques, et distinguer les contrats au coup
   * d'œil est précisément ce à quoi servent ces couleurs.
   */
  stage: 'bg-green-bg text-green',
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
