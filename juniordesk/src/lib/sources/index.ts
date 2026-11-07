/**
 * Registre des sources d’offres.
 *
 * Même principe que le registre de fournisseurs d’une boutique : la
 * configuration décide, le code ne décide pas. Sans aucune clé, on retombe sur
 * le jeu de démonstration — le site reste parcourable de bout en bout, et
 * personne ne déploie une collecte muette en croyant qu’elle fonctionne.
 */

import type { ContractGroup, ContractKind } from '../offer';
import { CONTRACT_GROUPS, groupOf } from '../offer';
import type { JobSource } from './types';
import { createLbaSource } from './lba';
import { createFranceTravailSource } from './france-travail';
import { createExampleSource } from './example';

export function activeSources(): JobSource[] {
  const sources: JobSource[] = [];

  const lbaKey = process.env.LBA_API_KEY?.trim();
  if (lbaKey) {
    sources.push(createLbaSource({ apiKey: lbaKey }));
  }

  // Inactive tant que France Travail n’a pas accordé l’accès restreint.
  const ftId = process.env.FRANCE_TRAVAIL_CLIENT_ID?.trim();
  const ftSecret = process.env.FRANCE_TRAVAIL_CLIENT_SECRET?.trim();
  if (ftId && ftSecret) {
    sources.push(createFranceTravailSource({ clientId: ftId, clientSecret: ftSecret }));
  }

  if (sources.length === 0) {
    if (process.env.NODE_ENV === 'production') {
      console.error(
        '[sources] AUCUNE SOURCE REELLE CONFIGUREE EN PRODUCTION. ' +
          'Le site affiche un jeu d’offres fabriquées. ' +
          'Renseignez LBA_API_KEY (cle de production creee sur ' +
          'https://api.apprentissage.beta.gouv.fr/compte/profil).',
      );
    }
    sources.push(createExampleSource());
  }

  return sources;
}

/** Vrai si au moins une source réelle est configurée. */
export function hasRealSource(): boolean {
  return activeSources().some((s) => s.id !== 'exemple');
}

/**
 * Types de contrat que les sources actives savent réellement produire.
 *
 * C’est le garde-fou du périmètre annoncé : si cette liste ne contient pas
 * « stage », le site n’a pas le droit de parler de stages. Vérifié par
 * `tests/scope.test.ts`.
 */
export function activeContractKinds(): ContractKind[] {
  const kinds = new Set<ContractKind>();
  for (const source of activeSources()) {
    for (const kind of source.contractKinds) kinds.add(kind);
  }
  return [...kinds];
}

export type { JobSource, FetchOutcome } from './types';

/**
 * Familles de contrat (stage / alternance / junior) qu'au moins une source
 * active sait réellement produire.
 *
 * C'est ce que l'interface doit refléter : les trois filtres sont affichés,
 * mais ceux qu'aucune source n'alimente sont marqués comme tels plutôt que de
 * renvoyer silencieusement zéro résultat. Aujourd'hui, seule « alternance »
 * est alimentée — France Travail, qui diffusait les stages et les postes
 * juniors, n'est plus ouverte.
 */
export function activeContractGroups(): ContractGroup[] {
  const groups = new Set<ContractGroup>(activeContractKinds().map(groupOf));
  return CONTRACT_GROUPS.filter((g) => groups.has(g));
}
