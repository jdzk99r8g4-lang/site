/**
 * Collecte manuelle — `npm run collect`.
 *
 * Sert à deux choses :
 *
 *   1. vérifier une clé API fraîchement obtenue sans attendre le cron du
 *      lendemain ;
 *   2. voir ce que la source renvoie réellement : combien d'offres entrent
 *      dans le périmètre, combien sont écartées, et pourquoi.
 *
 * N'envoie AUCUN e-mail : c'est une inspection, pas la tâche planifiée.
 * Les alertes ne partent que depuis /api/cron/collect.
 */

import { collect } from '../src/lib/collect';
import { hasRealSource } from '../src/lib/sources';
import type { ContractGroup } from '../src/lib/offer';
import { CONTRACT_GROUP_PLURALS, contractGroups } from '../src/lib/offer';
import { getStore } from '../src/lib/store';
import { familyBySlug } from '../src/lib/taxonomy';
import { cityIndex } from '../src/lib/geo';

async function main() {
  if (!hasRealSource()) {
    console.log(
      'Aucune cle API configuree : la collecte va produire le jeu de demonstration.\n' +
        'Pour collecter les vraies offres, creez une cle de PRODUCTION sur\n' +
        '  https://api.apprentissage.beta.gouv.fr/compte/profil\n' +
        'puis renseignez LBA_API_KEY dans .env.local.\n',
    );
  }

  const started = Date.now();
  const report = await collect();
  const seconds = ((Date.now() - started) / 1000).toFixed(1);

  console.log(`\nCollecte terminee en ${seconds} s\n`);

  console.log('Sources');
  for (const source of report.sources) {
    console.log(
      source.error
        ? `  ${source.label} : ECHEC — ${source.error}`
        : `  ${source.label} : ${source.count} offre(s)`,
    );
  }

  console.log('\nResultat');
  console.log(`  retenues           ${report.kept}`);
  console.log(`  expirees ecartees  ${report.expired}`);
  console.log(`  doublons exacts    ${report.exactDuplicates}`);
  console.log(`  doublons croises   ${report.crossDuplicates}`);
  console.log(`  nouvelles          ${report.newOfferIds.length}`);
  if (report.keptPreviousSnapshot) {
    console.log('  (instantane precedent conserve : toutes les sources ont echoue)');
  }

  const snapshot = await getStore().getSnapshot();
  const offers = snapshot?.offers ?? [];

  if (offers.length > 0) {
    const byGroup = new Map<ContractGroup, number>();
    for (const offer of offers) {
      for (const group of contractGroups(offer)) {
        byGroup.set(group, (byGroup.get(group) ?? 0) + 1);
      }
    }
    console.log('\nPar type de contrat');
    for (const [group, count] of byGroup) {
      console.log(`  ${CONTRACT_GROUP_PLURALS[group].padEnd(18)} ${count}`);
    }

    const byFamily = new Map<string, number>();
    for (const offer of offers) {
      for (const family of offer.families) {
        byFamily.set(family, (byFamily.get(family) ?? 0) + 1);
      }
    }
    console.log('\nPar metier');
    for (const [slug, count] of [...byFamily].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${(familyBySlug(slug)?.label ?? slug).padEnd(36)} ${count}`);
    }

    const cities = cityIndex(offers.map((o) => o.place));
    console.log(`\nVilles (${cities.length} distinctes, 10 premieres)`);
    for (const city of cities.slice(0, 10)) {
      console.log(`  ${city.label.padEnd(26)} ${city.count}`);
    }

    // Controles de coherence : ce sont ces trois nombres qui disent si la
    // collecte est saine, pas le total.
    const sansVille = offers.filter((o) => !o.place.city).length;
    const sansDate = offers.filter((o) => !o.contract.start && !o.contract.startIsFlexible).length;
    const liensInternes = offers.filter((o) => {
      try {
        return new URL(o.applyUrl).hostname.includes('juniordesk');
      } catch {
        return true;
      }
    }).length;

    console.log('\nControles');
    console.log(`  sans ville identifiee     ${sansVille} / ${offers.length}`);
    console.log(`  sans date de debut        ${sansDate} / ${offers.length}`);
    console.log(`  liens non externes        ${liensInternes}  (doit etre 0)`);
  }

  if (report.warnings.length > 0) {
    console.log('\nAvertissements');
    for (const warning of report.warnings) console.log(`  - ${warning}`);
  }

  console.log('');
}

main().catch((error: unknown) => {
  console.error('Collecte impossible :', error);
  process.exitCode = 1;
});
