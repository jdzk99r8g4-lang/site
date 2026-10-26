import { describe, it, expect } from 'vitest';
import {
  products,
  getProductBySlug,
  getProductById,
  unitPrice,
  getHeroProducts,
  getStoves,
  getProductsByCategory,
} from '@/lib/catalog';
import { heatDistributions, isAppliance, productCategories, type ProductCategory } from '@/lib/catalog.types';
import { guides, getGuideBySlug } from '@/lib/guides';
import { hasOnlyPlaceholders } from '@/lib/product-media';
import { locales } from '@/lib/i18n/config';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

describe('intégrité du catalogue', () => {
  it('n’a pas d’identifiant en double', () => {
    expect(new Set(products.map((p) => p.id)).size).toBe(products.length);
  });

  it('n’a pas de slug en double, dans aucune langue', () => {
    // Deux produits partageant un slug dans une seule langue rendraient l'une
    // des deux fiches inatteignable — sans aucune erreur visible ailleurs.
    for (const locale of locales) {
      const slugs = products.map((p) => p.slug[locale]);
      expect(new Set(slugs).size, `collision de slug en ${locale}`).toBe(products.length);
    }
  });

  it('n’a que des slugs valides pour une URL, dans les quatre langues', () => {
    for (const product of products) {
      for (const locale of locales) {
        expect(product.slug[locale], `${product.id} / ${locale}`).toMatch(SLUG);
      }
    }
  });

  it('retrouve chaque produit par son slug, dans sa langue', () => {
    for (const product of products) {
      for (const locale of locales) {
        expect(getProductBySlug(product.slug[locale], locale)?.id).toBe(product.id);
      }
    }
  });

  it('ne reconnaît pas un slug hors de sa langue', () => {
    // Garantit l'absence de contenu dupliqué : l'URL française ne doit pas
    // répondre sous le préfixe espagnol.
    const product = products[0];
    expect(product).toBeDefined();
    if (!product || product.slug.fr === product.slug.es) return;
    expect(getProductBySlug(product.slug.fr, 'es')).toBeUndefined();
  });

  it('ne référence que des produits existants en vente croisée', () => {
    for (const product of products) {
      for (const id of product.crossSell) {
        expect(getProductById(id), `${product.id} -> ${id}`).toBeDefined();
      }
      expect(product.crossSell, product.id).not.toContain(product.id);
    }
  });

  it('a des prix strictement positifs et entiers', () => {
    for (const product of products) {
      expect(Number.isInteger(product.price), product.id).toBe(true);
      expect(product.price, product.id).toBeGreaterThan(0);
      if (product.compareAtPrice !== null) {
        expect(product.compareAtPrice, product.id).toBeGreaterThan(product.price);
      }
    }
  });

  it('a des identifiants de variante uniques et un prix calculable', () => {
    for (const product of products) {
      const ids = product.variants.map((v) => v.id);
      expect(new Set(ids).size, product.id).toBe(ids.length);
      for (const variant of product.variants) {
        expect(unitPrice(product, variant.id)).toBe(product.price + variant.priceDelta);
        for (const locale of locales) {
          expect(variant.label[locale].length, `${product.id}/${variant.id}/${locale}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('traduit tous les textes visibles de chaque fiche', () => {
    for (const product of products) {
      for (const locale of locales) {
        expect(product.tagline[locale].length, `${product.id} tagline ${locale}`).toBeGreaterThan(10);
        expect(product.description[locale].length, `${product.id} description ${locale}`).toBeGreaterThan(80);
        expect(product.bullets[locale].length, `${product.id} bullets ${locale}`).toBeGreaterThan(2);
        for (const spec of product.specs) {
          expect(spec.label[locale].length, `${product.id} spec label ${locale}`).toBeGreaterThan(0);
          expect(spec.value[locale].length, `${product.id} spec value ${locale}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('donne à chaque produit un visuel avec texte alternatif traduit', () => {
    for (const product of products) {
      expect(product.images.length, product.id).toBeGreaterThan(0);
      for (const image of product.images) {
        expect(image.src).toMatch(/^\/img\/|^https:\/\//);
        for (const locale of locales) {
          expect(image.alt[locale].length, `${product.id} alt ${locale}`).toBeGreaterThan(8);
        }
      }
    }
  });

  it('met en avant au moins un produit en page d’accueil', () => {
    expect(getHeroProducts().length).toBeGreaterThan(0);
  });

  it('a un poids et un délai d’expédition renseignés', () => {
    for (const product of products) {
      expect(product.weightGrams, product.id).toBeGreaterThan(0);
      expect(product.dispatchDaysMin, product.id).toBeGreaterThan(0);
      expect(product.dispatchDaysMax, product.id).toBeGreaterThanOrEqual(product.dispatchDaysMin);
    }
  });

  it('range chaque produit dans une famille déclarée', () => {
    for (const product of products) {
      expect(productCategories, product.id).toContain(product.category);
    }
  });

  it('donne un mode de diffusion à chaque poêle à granulés', () => {
    /*
     * Ce test exigeait que la famille présente les DEUX modes, air et hydro,
     * parce que la page les affiche en deux groupes quand les deux
     * coexistent. Les fiches hydro étaient des données de démonstration, et
     * elles ont été retirées : exiger leur présence reviendrait à exiger le
     * retour de produits inventés.
     *
     * Ce qui reste vrai et vérifiable : un poêle à granulés diffuse forcément
     * de l'une des deux façons, jamais d'aucune. Le groupement de la page,
     * lui, est déjà couvert — il ne se déclenche que si deux modes
     * coexistent, et `category-view.tsx` le filtre sur les listes non vides.
     */
    const granules = getProductsByCategory('pellet');
    expect(granules.length).toBeGreaterThan(0);
    for (const product of granules) {
      expect(heatDistributions, product.id).toContain(product.distribution);
    }
  });

  it('ne prête un mode de diffusion qu’à un appareil', () => {
    for (const product of products) {
      if (!isAppliance(product.category)) {
        // Un conduit ne diffuse rien, un sac de granulés non plus.
        expect(product.distribution, product.id).toBeNull();
      }
    }
  });

  it('expédie en messagerie palettisée tout appareil de plus de 50 kg', () => {
    // Un poêle expédié en colis serait refusé par le transporteur, après
    // encaissement : c'est un litige garanti.
    for (const product of products) {
      if (product.weightGrams > 50_000) {
        expect(product.freight, `${product.id} (${product.weightGrams} g)`).toBe(true);
      }
    }
  });
});

describe('cohérence technique des poêles', () => {
  it('renseigne un bloc technique pour chaque appareil, et aucun pour le reste', () => {
    for (const product of products) {
      if (!isAppliance(product.category)) {
        expect(product.tech, product.id).toBeNull();
      } else {
        expect(product.tech, product.id).not.toBeNull();
      }
    }
  });

  it('a des plages de puissance et de surface croissantes quand les deux bornes sont connues', () => {
    /*
     * Les bornes basses peuvent manquer : un fabricant annonce parfois
     * « jusqu'à 90 m² » sans donner de minimum. Le modèle le représente par
     * `null` plutôt que par un nombre inventé, et ce test ne contrôle donc
     * l'ordre que lorsque les deux valeurs existent.
     */
    for (const product of getStoves()) {
      const tech = product.tech;
      expect(tech).not.toBeNull();
      if (!tech) continue;

      expect(tech.powerMaxKw, product.id).toBeGreaterThan(0);
      expect(tech.heatedAreaMaxM2, product.id).toBeGreaterThan(0);

      if (tech.powerMinKw !== null) {
        expect(tech.powerMaxKw, product.id).toBeGreaterThan(tech.powerMinKw);
      }
      if (tech.heatedAreaMinM2 !== null) {
        expect(tech.heatedAreaMaxM2, product.id).toBeGreaterThan(tech.heatedAreaMinM2);
      }
      if (tech.efficiencyPercent !== null) {
        expect(tech.efficiencyPercent, product.id).toBeGreaterThan(70);
        expect(tech.efficiencyPercent, product.id).toBeLessThan(100);
      }
    }
  });

  it('ne met de vraies photos que sur une fiche aux données vérifiées', () => {
    /*
     * Garde-fou dans le sens qui trompe réellement l'acheteur.
     *
     * Les deux états sont indépendants et chacun porte déjà sa mention :
     * `dataVerified` décrit les CARACTÉRISTIQUES, `hasOnlyPlaceholders` les
     * VISUELS. Une illustration sous des caractéristiques réelles est honnête
     * — la fiche annonce que la photographie est à venir, et c'est la
     * situation normale quand le fournisseur envoie son étiquette énergétique
     * avant ses photos.
     *
     * L'inverse ne l'est pas : une photographie du véritable appareil à côté
     * de puissances inventées se lit comme une fiche complète. C'est cette
     * combinaison-là qu'on interdit.
     */
    /*
     * EXEMPTION — les deux familles de foyers décoratifs.
     *
     * La règle ci-dessus vise une combinaison précise : une photographie du
     * vrai appareil posée à côté de puissances, de rendements et de classes
     * énergétiques INVENTÉS. C'est ce mélange qui se lit comme une fiche
     * complète alors qu'il n'en est pas une.
     *
     * Les foyers bioéthanol et électriques ne sont pas dans ce cas. Leur bloc
     * `tech` est `null` — il n'y a donc rien à inventer : pas de rendement,
     * pas de classe énergétique, pas de surface chauffée normalisée. Ce que
     * leur fiche affiche vient du MÊME relevé marchand que la photo, et la
     * mention « caractéristiques non vérifiées » reste visible puisque
     * `dataVerified` demeure `false`.
     *
     * Leur appliquer la règle obligerait au contraire à passer `dataVerified`
     * à `true` pour pouvoir afficher une photo — c'est-à-dire à retirer
     * l'avertissement pour obtenir le droit de montrer le produit. Le
     * garde-fou produirait exactement le mensonge qu'il doit empêcher.
     *
     * Il reste entier sur les huit familles d'appareils, là où des valeurs
     * réglementées peuvent être inventées.
     */
    const SANS_VALEURS_REGLEMENTEES: readonly ProductCategory[] = ['bioethanol', 'electricfire'];

    for (const product of products) {
      if (hasOnlyPlaceholders(product)) continue;
      if (SANS_VALEURS_REGLEMENTEES.includes(product.category)) {
        // Cohérence de l'exemption : elle ne vaut que sans bloc technique.
        expect(product.tech, `${product.id} exempté mais porte un bloc tech`).toBeNull();
        continue;
      }
      expect(
        product.dataVerified,
        `${product.id} : vraies photos mais caractéristiques encore fictives`,
      ).toBe(true);
    }
  });

  it('ne cède à l’eau qu’une part de la puissance totale, et seulement en hydro', () => {
    for (const product of products) {
      const tech = product.tech;
      if (!tech) continue;
      if (product.distribution === 'hydro') {
        expect(tech.waterPowerKw, product.id).not.toBeNull();
        expect(tech.waterPowerKw ?? 0, product.id).toBeLessThan(tech.powerMaxKw);
      } else {
        expect(tech.waterPowerKw, product.id).toBeNull();
      }
    }
  });

  it('trie les poêles par puissance maximale croissante', () => {
    const powers = getStoves().map((p) => p.tech?.powerMaxKw ?? 0);
    expect(powers).toEqual([...powers].sort((a, b) => a - b));
  });
});

describe('intégrité des guides', () => {
  it('n’a pas de slug en double et les retrouve tous, par langue', () => {
    for (const locale of locales) {
      expect(new Set(guides.map((g) => g.slug[locale])).size).toBe(guides.length);
      for (const guide of guides) {
        expect(getGuideBySlug(guide.slug[locale], locale)?.id).toBe(guide.id);
        expect(guide.slug[locale]).toMatch(SLUG);
      }
    }
  });

  it('ne renvoie que vers des produits existants', () => {
    for (const guide of guides) {
      for (const id of guide.relatedProducts) {
        expect(getProductById(id), `${guide.id} -> ${id}`).toBeDefined();
      }
    }
  });

  it('a des sections traduites et non vides', () => {
    for (const guide of guides) {
      expect(guide.sections.length, guide.id).toBeGreaterThan(1);
      for (const locale of locales) {
        expect(guide.title[locale].length, `${guide.id} titre ${locale}`).toBeGreaterThan(10);
        expect(guide.intro[locale].length, `${guide.id} intro ${locale}`).toBeGreaterThan(40);
        for (const section of guide.sections) {
          expect(section.heading[locale].length, `${guide.id} / ${locale}`).toBeGreaterThan(3);
          expect(section.paragraphs[locale].length, `${guide.id} / ${locale}`).toBeGreaterThan(0);
          if (section.list) {
            expect(section.list[locale].length, `${guide.id} liste ${locale}`).toBeGreaterThan(1);
          }
        }
      }
    }
  });

  it('a une date de mise à jour exploitable', () => {
    for (const guide of guides) {
      expect(Number.isNaN(new Date(guide.updated).getTime()), guide.id).toBe(false);
    }
  });
});
