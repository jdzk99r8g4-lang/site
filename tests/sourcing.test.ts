import { describe, it, expect } from 'vitest';
import {
  costOf,
  landedCostOf,
  grossMarginOf,
  maxLeadTimeDays,
  assertSourcingComplete,
  sourcing,
} from '@/lib/sourcing';
import { isAppliance } from '@/lib/catalog.types';
import { products } from '@/lib/catalog';
import { splitVatInclusive } from '@/lib/money';

describe('approvisionnement', () => {
  it('a un coût calculable pour chaque produit du catalogue', () => {
    // Sans cela, une commande sur ce produit échouerait au traitement.
    expect(() => assertSourcingComplete()).not.toThrow();
  });

  it('refuse un produit inconnu plutôt que de rendre zéro', () => {
    // Un coût à zéro ferait apparaître une marge de 100 % : l'erreur doit être
    // bruyante, pas silencieuse.
    expect(() => costOf('produit-inexistant')).toThrow();
    expect(() => landedCostOf('produit-inexistant')).toThrow();
  });

  it('ne vend aucun produit à perte', () => {
    for (const product of products) {
      const { net } = splitVatInclusive(product.price);
      expect(net, `${product.id} vendu à perte`).toBeGreaterThan(landedCostOf(product.id));
    }
  });

  it('garde une marge brute minimale, différente selon la famille', () => {
    /*
     * Un appareil de 2 000 € ne supporte pas la même exigence de marge qu'un
     * accessoire de 90 € : en valeur absolue, 25 % sur un poêle rapportent
     * bien plus que 50 % sur un aspirateur à cendres. Faire baisser ces
     * planchers impose de refaire le calcul d'acquisition
     * (cf. `docs/ECONOMICS.md`), pas seulement d'éditer ce test.
     */
    /*
     * Le granulé fait exception : c'est un produit de négoce, dont la marge
     * est structurellement faible chez tous les revendeurs. Il se vend pour
     * faire revenir le client chaque automne, pas pour la marge. Lui imposer
     * le plancher des accessoires obligerait à le surfacturer, ce qui ferait
     * perdre exactement le trafic qu'il doit ramener.
     */
    const exceptions: Record<string, number> = { 'granules-palette': 8 };

    for (const product of products) {
      const floor = exceptions[product.id] ?? (isAppliance(product.category) ? 22 : 38);
      const { net } = splitVatInclusive(product.price);
      const margin = ((net - landedCostOf(product.id)) / net) * 100;
      expect(
        margin,
        `${product.id} : marge de ${margin.toFixed(1)} % (plancher ${floor} %)`,
      ).toBeGreaterThan(floor);
    }
  });

  it('compte le transport amont dans le coût de revient', () => {
    // Sur un appareil de 200 kg, le port fournisseur dépasse 40 € : l'ignorer
    // fait croire à une marge qui n'existe pas.
    for (const product of products) {
      expect(landedCostOf(product.id), product.id).toBeGreaterThan(costOf(product.id));
    }
  });

  it('calcule la marge sur le prix HORS TAXE, pas sur le prix affiché', () => {
    // Comparer un prix TTC à un coût HT surestime la marge de 20 %. C'est
    // l'erreur de calcul la plus coûteuse de ce type de boutique.
    for (const product of products) {
      const { net } = splitVatInclusive(product.price);
      expect(grossMarginOf(product.id)).toBe(net - landedCostOf(product.id));
      expect(grossMarginOf(product.id)).toBeLessThan(product.price - landedCostOf(product.id));
    }
  });

  it('retient le délai de préparation le plus long de la commande', () => {
    // Une commande part en une seule expédition : c'est la ligne la plus
    // lente qui fixe la date annoncée au client.
    const refs = ['bio-etna-table', 'bio-revello'];
    const longest = Math.max(...refs.map((id) => sourcing[id]?.leadTimeDays ?? 0));
    expect(maxLeadTimeDays(refs)).toBe(longest);
  });

  it('retombe sur un délai prudent pour une liste vide', () => {
    expect(maxLeadTimeDays([])).toBeGreaterThan(0);
  });

  it('a une référence grossiste unique par produit', () => {
    // Deux produits partageant une référence se commanderaient à l'identique.
    const skus = Object.values(sourcing).map((line) => line.supplierSku);
    expect(new Set(skus).size).toBe(skus.length);
  });

  it('ne référence aucun produit absent du catalogue', () => {
    const ids = new Set(products.map((p) => p.id));
    for (const id of Object.keys(sourcing)) {
      expect(ids.has(id), `sourcing contient « ${id} », absent du catalogue`).toBe(true);
    }
  });
});
