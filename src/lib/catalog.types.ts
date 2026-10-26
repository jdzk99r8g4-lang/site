import type { Cents } from './money';
import type { Localized } from './i18n/config';

/**
 * Familles de produits — une par section de la boutique.
 *
 * Le découpage est celui de l'APPAREIL, pas celui de son mode de diffusion :
 * c'est ainsi que cherche l'acheteur, qui sait ce qu'il veut installer
 * (« un insert », « une chaudière ») avant de savoir comment il le raccordera.
 * La distinction air / hydro, elle, se joue À L'INTÉRIEUR d'une famille, et
 * vit dans `distribution` plus bas.
 */
export type ProductCategory = 'pellet' | 'bioethanol' | 'electricfire';

/**
 * Ordre d'affichage : des appareils les plus demandés vers le périphérique.
 *
 * `bioethanol` et `electricfire` ferment la liste des foyers, juste avant le
 * conduit et les accessoires : ce sont des objets DÉCORATIFS, qu'on ne vend
 * pas comme un moyen de chauffer une maison. Les placer en tête les ferait
 * passer pour l'équivalent d'un poêle, ce qu'ils ne sont pas.
 */
export const productCategories = [
  'pellet',
  'bioethanol',
  'electricfire',
] as const;

/**
 * Mode de diffusion de la chaleur, pour les appareils où le choix se pose.
 *
 *  - `air`   : chauffe la pièce où il est posé, et les pièces voisines s'il
 *              est canalisé ;
 *  - `hydro` : raccordé au circuit de chauffage central (radiateurs, plancher
 *              chauffant), parfois à l'eau chaude sanitaire ;
 *  - `null`  : la question ne se pose pas (conduit, accessoire).
 *
 * Champ explicite et non déduit de `tech.waterPowerKw` : une fiche hydro dont
 * on n'a pas encore la puissance hydraulique serait classée « air » à tort.
 */
export type HeatDistribution = 'air' | 'hydro';

/**
 * Familles qui désignent un APPAREIL de chauffage — par opposition au conduit
 * et aux accessoires, qui n'ont ni puissance ni mode de diffusion.
 *
 * `bioethanol` et `electricfire` n'y figurent PAS, et c'est délibéré.
 *
 * Un foyer décoratif n'a ni rendement, ni classe énergétique, ni surface
 * chauffée établie par un essai normalisé : les règlements UE 2015/1185 et
 * 2015/1186, qui encadrent les appareils à combustible solide, ne s'y
 * appliquent pas. Les ranger parmi les appareils obligerait à remplir un bloc
 * `tech` — donc à INVENTER un rendement et une classe pour tenir le modèle,
 * et à les faire apparaître dans le calculateur de puissance comme s'ils
 * pouvaient chauffer un logement. Leurs caractéristiques réelles (puissance
 * électrique, capacité du brûleur, autonomie, dimensions) vivent donc dans
 * `specs`, en texte libre, exactement telles que le fabricant les annonce.
 */
export const applianceCategories = ['pellet'] as const satisfies readonly ProductCategory[];

export function isAppliance(category: ProductCategory): boolean {
  return (applianceCategories as readonly ProductCategory[]).includes(category);
}

export const heatDistributions = ['air', 'hydro'] as const;

export interface ProductVariant {
  id: string;
  label: Localized<string>;
  /** Surcoût TTC par rapport au prix de base. Peut être 0. */
  priceDelta: Cents;
}

export interface ProductImage {
  /** Chemin local (`/img/...`) ou URL absolue d'un domaine déclaré dans next.config.ts. */
  src: string;
  alt: Localized<string>;
  /**
   * `true` pour un rendu de substitution (illustration vectorielle) et non une
   * photographie du produit réel. Sert à afficher la mention correspondante :
   * présenter un dessin comme une photo de produit serait une pratique
   * commerciale trompeuse.
   */
  placeholder: boolean;
  /**
   * Résolution réelle du fichier, mesurée par `npm run media:scan`.
   *
   * Sert à ne JAMAIS agrandir une image au-delà de sa résolution. Les visuels
   * n'arrivent pas tous en 3 000 px : une vignette de 470 px étirée à 1 000 px
   * est molle, alors que la même affichée à 470 px dans son cadre est nette.
   * L'affichage s'adapte donc au fichier, et non l'inverse.
   *
   * `undefined` quand la question ne se pose pas : une illustration
   * vectorielle n'a pas de résolution, et un visuel déclaré à la main dans le
   * catalogue n'a pas été mesuré.
   */
  intrinsic?: { readonly width: number; readonly height: number };
}

export interface SpecRow {
  label: Localized<string>;
  value: Localized<string>;
}

/**
 * Caractéristiques techniques exploitées par le code (filtres, calculateur de
 * puissance, données structurées). Elles sont séparées du tableau `specs`
 * affiché, qui peut contenir n'importe quelle ligne libre.
 *
 * ATTENTION : ces valeurs ont une portée réglementaire. La puissance, le
 * rendement et la classe énergétique doivent reprendre À L'IDENTIQUE la fiche
 * technique et l'étiquette énergétique du fabricant (règlement UE 2015/1185
 * pour l'écoconception, 2015/1186 pour l'étiquetage). Les annoncer à
 * l'estime engage la responsabilité du vendeur.
 */
export interface StoveTech {
  /**
   * Puissance maximale, en kW. SEUL champ technique obligatoire : le filtre
   * de la boutique et le calculateur de puissance s'appuient dessus.
   */
  powerMaxKw: number;
  /** Puissance minimale de modulation, en kW. `null` tant qu'elle n'est pas connue. */
  powerMinKw: number | null;
  /**
   * Surface chauffée annoncée, en m². `heatedAreaMinM2` vaut `null` quand le
   * fabricant ne donne qu'un maximum (« jusqu'à 90 m² »).
   */
  heatedAreaMinM2: number | null;
  heatedAreaMaxM2: number;
  /** Capacité du réservoir à granulés, en kg. */
  hopperKg: number | null;
  /** Rendement à puissance nominale, en %. */
  efficiencyPercent: number | null;
  /** Classe de l'étiquette énergétique (règlement UE 2015/1186). */
  energyClass: string;
  /** Diamètre de sortie des fumées, en mm. */
  flueDiameterMm: number | null;
  /** Niveau sonore annoncé en fonctionnement, en dB(A). */
  noiseDbA: number | null;
  /** Puissance cédée à l'eau, en kW — poêles hydro uniquement. */
  waterPowerKw: number | null;
  /** Production d'eau chaude sanitaire — poêles hydro uniquement. */
  domesticHotWater: boolean;
  /** Nombre de sorties canalisables — poêles à air uniquement. */
  ductedOutlets: number | null;
  dimensionsMm: { height: number; width: number; depth: number } | null;
  weightKg: number | null;
}

export interface Product {
  id: string;
  /** Slug localisé : l'URL espagnole ne doit pas être un mot français. */
  slug: Localized<string>;
  /** Nom commercial — identique dans les quatre langues (c'est une référence). */
  name: string;
  category: ProductCategory;
  /**
   * Air ventilé ou hydro, quand la distinction existe pour cette famille.
   * `null` pour un conduit, un accessoire — et pour toute famille où le
   * fournisseur ne tranche pas.
   */
  distribution: HeatDistribution | null;
  /** Prix de vente TTC. */
  price: Cents;
  /** Prix barré TTC. `null` s'il n'existe pas de référence barrée honnête. */
  compareAtPrice: Cents | null;
  /** Une phrase : le bénéfice, pas la caractéristique. */
  tagline: Localized<string>;
  description: Localized<string>;
  bullets: Localized<readonly string[]>;
  specs: readonly SpecRow[];
  tech: StoveTech | null;
  images: readonly ProductImage[];
  variants: readonly ProductVariant[];
  /** Produits proposés en complément sur la fiche et au panier. */
  crossSell: readonly string[];
  /** Mis en avant en page d'accueil. */
  hero: boolean;
  /**
   * `true` quand les caractéristiques proviennent de la documentation réelle
   * du fabricant, `false` tant que ce sont des valeurs de démonstration.
   *
   * Sert à afficher l'avertissement au bon endroit : une fiche vérifiée ne
   * doit pas porter la mention qui dit le contraire, et une fiche qui ne l'est
   * pas doit la porter même si le reste du catalogue est passé en réel.
   */
  dataVerified: boolean;
  /** Poids expédié en grammes, emballage inclus — sert au calcul du port. */
  weightGrams: number;
  /** `true` si l'article part en messagerie palettisée et non en colis. */
  freight: boolean;
  badge: Localized<string> | null;
  /** Délai d'expédition annoncé par le fournisseur, en jours ouvrés. */
  dispatchDaysMin: number;
  dispatchDaysMax: number;
}

export interface CatalogEntryRef {
  productId: string;
  variantId: string | null;
}
