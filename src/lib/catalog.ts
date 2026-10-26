/**
 * Catalogue public — SOURCE DE VÉRITÉ unique du site.
 *
 * ┌───────────────────────────────────────────────────────────────────────┐
 * │ DONNÉES DE DÉMONSTRATION — À REMPLACER AVANT LA PREMIÈRE VENTE        │
 * │                                                                       │
 * │ Les modèles, puissances, rendements, classes énergétiques et prix     │
 * │ ci-dessous sont des valeurs PLAUSIBLES mais FICTIVES, écrites pour    │
 * │ que la boutique soit utilisable de bout en bout. Elles ne décrivent   │
 * │ aucun appareil existant.                                             │
 * │                                                                       │
 * │ Un poêle à granulés est un appareil réglementé : la puissance, le     │
 * │ rendement, les émissions et la classe énergétique doivent reprendre   │
 * │ à l'identique la fiche technique et l'étiquette du fabricant          │
 * │ (règlements UE 2015/1185 et 2015/1186, norme EN 14785). Annoncer une  │
 * │ valeur approximative engage votre responsabilité de vendeur, et rend  │
 * │ par ailleurs le client inéligible aux aides qui exigent une classe    │
 * │ ou un rendement donné.                                               │
 * │                                                                       │
 * │ Remplacez chaque bloc par les données du fournisseur, puis passez     │
 * │ NEXT_PUBLIC_DEMO_CATALOG à « false » pour retirer le bandeau.         │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * Ce module est importable côté client : il ne doit donc contenir AUCUNE
 * donnée sensible (prix d'achat, référence fournisseur, marge). Celles-ci
 * vivent dans `sourcing.ts`, qui ne doit jamais être importé par un composant
 * client. `tests/leakage.test.ts` vérifie cette frontière.
 */

import { euros } from './money';
import { L, U, type Locale, type Localized } from './i18n/config';
import type { Product, ProductCategory, SpecRow } from './catalog.types';

/** `true` tant que le catalogue n'a pas été remplacé par de vraies données. */
export const isDemoCatalog = process.env.NEXT_PUBLIC_DEMO_CATALOG !== 'false';

/**
 * Libellés de caractéristiques, mutualisés : un même intitulé doit s'écrire
 * exactement pareil d'une fiche à l'autre, sinon le tableau comparatif
 * devient illisible.
 */
const SPEC = {
  power: L('Puissance', 'Heat output', 'Vermogen', 'Potencia'),
  waterPower: L('Puissance à l’eau', 'Output to water', 'Vermogen naar water', 'Potencia al agua'),
  area: L('Surface chauffée', 'Heated area', 'Verwarmd oppervlak', 'Superficie calentada'),
  efficiency: L('Rendement', 'Efficiency', 'Rendement', 'Rendimiento'),
  energyClass: L('Classe énergétique', 'Energy class', 'Energieklasse', 'Clase energética'),
  hopper: L('Réservoir', 'Hopper', 'Reservoir', 'Depósito'),
  autonomy: L('Autonomie', 'Burn time', 'Autonomie', 'Autonomía'),
  flue: L('Sortie fumées', 'Flue outlet', 'Rookgasafvoer', 'Salida de humos'),
  outlets: L('Sorties canalisables', 'Ducted outlets', 'Kanaalaansluitingen', 'Salidas canalizables'),
  noise: L('Niveau sonore', 'Noise level', 'Geluidsniveau', 'Nivel sonoro'),
  dhw: L('Eau chaude sanitaire', 'Domestic hot water', 'Sanitair warm water', 'Agua caliente sanitaria'),
  dimensions: L('Dimensions (H × L × P)', 'Dimensions (H × W × D)', 'Afmetingen (H × B × D)', 'Dimensiones (Al × An × Pr)'),
  weight: L('Poids', 'Weight', 'Gewicht', 'Peso'),
  standard: L('Norme', 'Standard', 'Norm', 'Norma'),
  warranty: L('Garantie', 'Warranty', 'Garantie', 'Garantía'),
  fuel: L('Combustible', 'Fuel', 'Brandstof', 'Combustible'),
  contents: L('Contenu', 'Contents', 'Inhoud', 'Contenido'),
  material: L('Matière', 'Material', 'Materiaal', 'Material'),
  compatibility: L('Compatibilité', 'Compatibility', 'Compatibiliteit', 'Compatibilidad'),
  reference: L('Référence', 'Reference', 'Referentie', 'Referencia'),
  sealed: L('Appareil étanche', 'Sealed appliance', 'Luchtdicht toestel', 'Aparato estanco'),
  control: L('Pilotage', 'Control', 'Bediening', 'Control'),
  mounting: L('Pose', 'Mounting', 'Montage', 'Instalación'),
  burnerCapacity: L('Capacité du brûleur', 'Burner capacity', 'Brandercapaciteit', 'Capacidad del quemador'),
  ventilation: L('Ventilation', 'Ventilation', 'Ventilatie', 'Ventilación'),
  electricPower: L('Puissance électrique', 'Electrical input', 'Elektrisch vermogen', 'Potencia eléctrica'),
  heatSettings: L('Allures de chauffe', 'Heat settings', 'Verwarmingsstanden', 'Niveles de calor'),
  flameEffect: L('Effet de flamme', 'Flame effect', 'Vlameffect', 'Efecto de llama'),
  supply: L('Alimentation', 'Power supply', 'Voeding', 'Alimentación'),
  /**
   * Volontairement distinct de `area`.
   *
   * `area` est la « surface chauffée », issue d'un essai normalisé sur un
   * appareil de chauffage. Ici, le nombre vient de l'argumentaire du vendeur
   * et n'a pas ce statut : l'intituler pareil laisserait croire qu'un foyer
   * décoratif remplace un poêle.
   */
  areaClaimed: L(
    'Surface annoncée par le fabricant',
    'Area claimed by the manufacturer',
    'Door de fabrikant opgegeven oppervlak',
    'Superficie indicada por el fabricante',
  ),
} as const;

/** Garantie légale de conformité : 2 ans dans toute l'UE (directive 2019/771). */
const WARRANTY_2Y: SpecRow = {
  label: SPEC.warranty,
  value: L(
    '2 ans (garantie légale de conformité)',
    '2 years (statutory conformity guarantee)',
    '2 jaar (wettelijke conformiteitsgarantie)',
    '2 años (garantía legal de conformidad)',
  ),
};


/**
 * Avertissements communs aux foyers décoratifs.
 *
 * Mutualisés pour une raison qui n'est pas la concision : ces quatre lignes
 * sont les seules du catalogue dont la formulation a une portée de sécurité ou
 * de loyauté commerciale. Les recopier douze fois garantirait qu'une seule
 * finisse par diverger — et ce serait précisément celle-là qui compterait.
 */

/** Bioéthanol : flamme nue, combustible liquide. */
const ETHANOL_FUEL: SpecRow = {
  label: SPEC.fuel,
  value: L(
    'Bioéthanol liquide pour foyer décoratif',
    'Liquid bioethanol for decorative hearths',
    'Vloeibare bio-ethanol voor sierhaarden',
    'Bioetanol líquido para hogar decorativo',
  ),
};

/**
 * La contrainte qu'un acheteur doit lire AVANT d'acheter, pas dans la notice.
 *
 * Un brûleur à bioéthanol consomme l'oxygène de la pièce et y rejette du CO₂
 * et de la vapeur d'eau : il n'a pas de conduit, donc tout reste à
 * l'intérieur. C'est l'exact revers de son argument de vente.
 */
const VENTILATION_REQUIRED: SpecRow = {
  label: SPEC.ventilation,
  value: L(
    'Pièce ventilée obligatoire — la combustion rejette CO₂ et vapeur d’eau dans la pièce',
    'Ventilated room required — combustion releases CO₂ and water vapour into the room',
    'Geventileerde ruimte verplicht — verbranding geeft CO₂ en waterdamp af in de ruimte',
    'Habitación ventilada obligatoria — la combustión libera CO₂ y vapor de agua en la habitación',
  ),
};

/** Foyers électriques : une prise domestique ordinaire, rien de plus. */
const ELECTRIC_SUPPLY: SpecRow = {
  label: SPEC.supply,
  value: U('230 V ~ 50 Hz'),
};

/**
 * Dire que la flamme est fausse, en toutes lettres.
 *
 * Un foyer électrique se vend sur l'image d'une flamme. Laisser l'acheteur la
 * découvrir à la livraison serait une pratique commerciale trompeuse — et de
 * toute façon un retour.
 */
const FLAME_SIMULATED: SpecRow = {
  label: SPEC.flameEffect,
  value: L(
    'Simulation lumineuse — aucune combustion, aucune flamme réelle',
    'Lit simulation — no combustion, no real flame',
    'Lichtsimulatie — geen verbranding, geen echte vlam',
    'Simulación luminosa — sin combustión, sin llama real',
  ),
};


const PELLET_FUEL: SpecRow = {
  label: SPEC.fuel,
  value: L(
    'Granulés de bois 6 mm, certifiés DINplus ou ENplus A1',
    '6 mm wood pellets, DINplus or ENplus A1 certified',
    'Houtpellets 6 mm, DINplus of ENplus A1 gecertificeerd',
    'Pellets de madera 6 mm, certificados DINplus o ENplus A1',
  ),
};

/** Visuel de substitution : une illustration, jamais présentée comme une photo. */
function placeholderImage(kind: string, alt: Localized<string>) {
  return { src: `/img/placeholder/${kind}.svg`, alt, placeholder: true as const };
}

export const products: readonly Product[] = [
  // ───────────────────────── PRODUIT RÉEL — ETNA Luxe ─────────────────────────
  //
  // Seule fiche du catalogue dont les caractéristiques viennent de la
  // documentation du fabricant, d'où `dataVerified: true`.
  //
  // RESTE À CONFIRMER auprès de la fiche technique ETNA, et signalé par un
  // `null` plutôt que par une valeur inventée : puissance minimale de
  // modulation, rendement exact, capacité du réservoir, diamètre de sortie des
  // fumées, dimensions, poids, niveau sonore.
  //
  // PRIX ET COÛT D'ACHAT PROVISOIRES : à remplacer avant toute vente.
  {
    id: 'anna-12',
    slug: {
      fr: 'etna-anna-12-poele-granules-etanche-canalisable',
      en: 'etna-anna-12-sealed-ducted-pellet-stove',
      nl: 'etna-anna-12-luchtdichte-kanaliseerbare-pelletkachel',
      es: 'etna-anna-12-estufa-pellets-estanca-canalizable',
    },
    name: 'ETNA Luxe Anna 12EC',
    category: 'pellet',
    distribution: 'air',
    price: euros(2490),
    compareAtPrice: null,
    tagline: L(
      'Étanche : l’air de combustion vient de l’extérieur, pas de votre salon.',
      'Sealed: combustion air comes from outside, not from your living room.',
      'Luchtdicht: de verbrandingslucht komt van buiten, niet uit uw woonkamer.',
      'Estanca: el aire de combustión viene del exterior, no de su salón.',
    ),
    description: L(
      "Un poêle étanche prend son air de combustion directement dehors, par un conduit concentrique, au lieu de le puiser dans la pièce. Deux conséquences : plus de courant d’air froid aspiré vers l’appareil, et une installation possible dans une maison RT 2012 ou BBC, où un poêle non étanche met le logement en dépression. L’Anna y ajoute une sortie canalisable pour envoyer une partie de l’air chaud vers une deuxième pièce, une vitre teintée sur toute la hauteur de la façade, et une autonomie annoncée jusqu’à vingt heures. La télécommande est fournie ; le module Wi-Fi est en option.",
      "A sealed stove draws its combustion air straight from outside through a concentric flue, instead of taking it from the room. Two consequences: no more cold draught pulled toward the appliance, and installation becomes possible in a low-energy or airtight house, where a non-sealed stove puts the building under negative pressure. The Anna adds a ducted outlet to send part of the warm air to a second room, a tinted glass panel running the full height of the front, and a stated burn time of up to twenty hours. The remote control is supplied; the Wi-Fi module is an option.",
      "Een luchtdichte kachel haalt zijn verbrandingslucht rechtstreeks van buiten via een concentrische afvoer, in plaats van uit de kamer. Twee gevolgen: geen koude trek meer naar het toestel, en plaatsing wordt mogelijk in een lage-energiewoning, waar een niet-luchtdichte kachel onderdruk veroorzaakt. De Anna voegt daar een kanaaluitgang aan toe om een deel van de warme lucht naar een tweede kamer te sturen, getint glas over de volle hoogte van het front, en een opgegeven autonomie tot twintig uur. De afstandsbediening wordt meegeleverd; de wifimodule is optioneel.",
      "Una estufa estanca toma su aire de combustión directamente del exterior, por un conducto concéntrico, en lugar de cogerlo de la estancia. Dos consecuencias: se acaba la corriente de aire frío hacia el aparato, y la instalación resulta posible en una vivienda de baja demanda energética, donde una estufa no estanca pone el edificio en depresión. La Anna añade una salida canalizable para enviar parte del aire caliente a una segunda habitación, un cristal tintado en toda la altura del frontal, y una autonomía declarada de hasta veinte horas. El mando a distancia se incluye; el módulo Wi-Fi es opcional.",
    ),
    bullets: {
      fr: [
        'Étanche — installable en zone 1, 2 ou 3, sortie des fumées en façade ou en toiture',
        'Sortie canalisable pour chauffer une deuxième pièce',
        'Surface de chauffe annoncée jusqu’à 90 m²',
        'Autonomie annoncée jusqu’à 20 h en fonctionnement continu',
        'Vitre teintée intégrale et système double porte, vitre extérieure trempée',
        'Télécommande incluse, module Wi-Fi en option',
      ],
      en: [
        'Sealed — installable in zones 1, 2 or 3, flue through the wall or the roof',
        'Ducted outlet to heat a second room',
        'Stated heated area up to 90 m²',
        'Stated burn time up to 20 h of continuous operation',
        'Full-height tinted glass and twin-door system, tempered outer pane',
        'Remote control included, Wi-Fi module optional',
      ],
      nl: [
        'Luchtdicht — plaatsbaar in zone 1, 2 of 3, afvoer door gevel of dak',
        'Kanaaluitgang om een tweede kamer te verwarmen',
        'Opgegeven verwarmd oppervlak tot 90 m²',
        'Opgegeven autonomie tot 20 u continu bedrijf',
        'Getint glas over de volle hoogte en dubbeldeursysteem, gehard buitenglas',
        'Afstandsbediening meegeleverd, wifimodule optioneel',
      ],
      es: [
        'Estanca — instalable en zona 1, 2 o 3, salida de humos por fachada o tejado',
        'Salida canalizable para calentar una segunda habitación',
        'Superficie calentada declarada hasta 90 m²',
        'Autonomía declarada hasta 20 h de funcionamiento continuo',
        'Cristal tintado en toda la altura y sistema de doble puerta, vidrio exterior templado',
        'Mando a distancia incluido, módulo Wi-Fi opcional',
      ],
    },
    specs: [
      { label: SPEC.reference, value: U('ANNA 12EC') },
      {
        label: SPEC.power,
        value: L(
          '10 kW (puissance de l’étiquette énergétique)',
          '10 kW (figure on the energy label)',
          '10 kW (waarde op het energielabel)',
          '10 kW (valor de la etiqueta energética)',
        ),
      },
      { label: SPEC.area, value: L('Jusqu’à 90 m²', 'Up to 90 m²', 'Tot 90 m²', 'Hasta 90 m²') },
      { label: SPEC.efficiency, value: U('> 92 %') },
      { label: SPEC.energyClass, value: U('A+') },
      { label: SPEC.autonomy, value: L('Jusqu’à 20 h', 'Up to 20 h', 'Tot 20 u', 'Hasta 20 h') },
      { label: SPEC.outlets, value: L('1 sortie canalisable', '1 ducted outlet', '1 kanaaluitgang', '1 salida canalizable') },
      {
        label: SPEC.sealed,
        value: L(
          'Oui — zones d’installation 1, 2 ou 3',
          'Yes — installation zones 1, 2 or 3',
          'Ja — plaatsingszones 1, 2 of 3',
          'Sí — zonas de instalación 1, 2 o 3',
        ),
      },
      {
        label: SPEC.control,
        value: L(
          'Télécommande incluse, Wi-Fi en option',
          'Remote control included, Wi-Fi optional',
          'Afstandsbediening meegeleverd, wifi optioneel',
          'Mando incluido, Wi-Fi opcional',
        ),
      },
      PELLET_FUEL,
      { label: SPEC.standard, value: U('EN 14785 · règlement UE 2015/1186') },
      WARRANTY_2Y,
    ],
    tech: {
      // Valeur de l'étiquette énergétique, qui est le document opposable.
      // La désignation commerciale annonce 12 kW : l'écart est signalé au
      // client sur la fiche et reste à trancher avec le fabricant.
      powerMaxKw: 10,
      powerMinKw: null,
      heatedAreaMinM2: null,
      heatedAreaMaxM2: 90,
      hopperKg: null,
      efficiencyPercent: null,
      energyClass: 'A+',
      flueDiameterMm: null,
      noiseDbA: null,
      waterPowerKw: null,
      domesticHotWater: false,
      ductedOutlets: 1,
      dimensionsMm: null,
      weightKg: null,
    },
    images: [
      placeholderImage(
        'stove-air-ducted',
        L(
          'Poêle à granulés étanche ETNA Luxe Anna 12EC, corps cylindrique et vitre teintée',
          'ETNA Luxe Anna 12EC sealed pellet stove, cylindrical body and tinted glass',
          'ETNA Luxe Anna 12EC luchtdichte pelletkachel, cilindrische behuizing en getint glas',
          'Estufa de pellets estanca ETNA Luxe Anna 12EC, cuerpo cilíndrico y cristal tintado',
        ),
      ),
    ],
    variants: [],
    crossSell: ['vertigo-up', 'vulcano-silenzio-up'],
    hero: true,
    dataVerified: true,
    // Poids provisoire, le temps d'avoir la fiche technique. Il ne sert qu'à
    // l'information : le tarif de transport dépend du drapeau `freight`.
    weightGrams: 140_000,
    freight: true,
    badge: L('Poêle étanche', 'Sealed stove', 'Luchtdichte kachel', 'Estufa estanca'),
    dispatchDaysMin: 3,
    dispatchDaysMax: 6,
  },
  // ETNA Vertigo Up — données issues de la documentation ETNA transmise par
  // l'exploitant et de l'étiquette énergétique, d'où `dataVerified: true`.
  //
  // ÉCART DE PUISSANCE, VOLONTAIREMENT NON ARBITRÉ : la désignation
  // commerciale annonce 9,2 kW, l'étiquette énergétique déclare 8,3 kW. C'est
  // l'étiquette qui fait foi ici — c'est le document opposable, et sous-estimer
  // la puissance est la seule erreur des deux qui ne se retourne pas contre
  // l'acheteur. Le nom du produit ne porte donc aucun chiffre, pour ne pas se
  // contredire lui-même, et la fiche affiche les deux valeurs.
  //
  // RESTE À CONFIRMER, signalé par `null` plutôt que par une valeur inventée :
  // puissance minimale de modulation, rendement exact, capacité du réservoir,
  // diamètre de la sortie concentrique, dimensions, poids, niveau sonore — le
  // produit est annoncé « ultra silencieux » sans chiffre, ce qui ne se met pas
  // dans un champ en dB.
  //
  // PRIX ET COÛT D'ACHAT PROVISOIRES : à remplacer avant toute vente.
  {
    id: 'vertigo-up',
    slug: {
      fr: 'etna-vertigo-up-poele-granules-etanche-sortie-dessus',
      en: 'etna-vertigo-up-sealed-pellet-stove-top-outlet',
      nl: 'etna-vertigo-up-luchtdichte-pelletkachel-bovenafvoer',
      es: 'etna-vertigo-up-estufa-pellets-estanca-salida-superior',
    },
    name: 'ETNA Vertigo Up',
    category: 'pellet',
    distribution: 'air',
    price: euros(2790),
    compareAtPrice: null,
    tagline: L(
      'La sortie des fumées passe par le dessus : le poêle se colle au mur.',
      'The flue leaves through the top: the stove sits right against the wall.',
      'De rookgasafvoer gaat via de bovenkant: de kachel staat vlak tegen de muur.',
      'La salida de humos pasa por arriba: la estufa se pega a la pared.',
    ),
    description: L(
      "Sur la plupart des poêles, la sortie des fumées part à l'arrière, et il faut laisser passer le coude : quinze à vingt centimètres perdus contre le mur, sur toute la largeur de l'appareil. Le Vertigo Up sort par le dessus, en conduit concentrique — l'air de combustion descend par l'enveloppe extérieure pendant que les fumées montent par l'intérieur. L'appareil se place donc nettement plus près de la cloison, ce qui change la donne dans une pièce étroite ou devant un mur déjà meublé. Étanche, il prend son air dehors et s'installe en logement BBC. La vitre Magic Glass reste noire tant que le feu n'est pas allumé, et le corps rond en verre et métal se regarde de tous les côtés, ce qui compte quand le poêle n'est pas contre un mur plein.",
      'On most stoves the flue leaves at the back, and the elbow needs room: fifteen to twenty centimetres lost against the wall, across the full width of the appliance. The Vertigo Up exits through the top, through a concentric flue — combustion air comes down the outer sleeve while the flue gases rise inside it. The stove therefore sits markedly closer to the wall, which changes things in a narrow room or in front of a wall that already holds furniture. Being sealed, it takes its air from outside and can go into an airtight house. The Magic Glass pane stays black until the fire is lit, and the round body in glass and metal reads well from every side, which matters when the stove is not against a solid wall.',
      'Bij de meeste kachels zit de rookgasafvoer aan de achterkant, en de bocht vraagt ruimte: vijftien tot twintig centimeter verloren tegen de muur, over de volle breedte van het toestel. De Vertigo Up gaat er via de bovenkant uit, met een concentrische afvoer — de verbrandingslucht komt via de buitenmantel naar beneden terwijl de rookgassen er binnenin omhoog gaan. De kachel staat daardoor merkbaar dichter bij de wand, wat scheelt in een smalle kamer of voor een muur die al vol staat. Luchtdicht haalt hij zijn lucht van buiten en kan hij in een lage-energiewoning. Het Magic Glass blijft zwart zolang het vuur niet brandt, en de ronde behuizing in glas en metaal oogt van alle kanten goed, wat telt als de kachel niet tegen een dichte muur staat.',
      'En la mayoría de las estufas la salida de humos va por detrás, y el codo necesita sitio: quince a veinte centímetros perdidos contra la pared, en todo el ancho del aparato. La Vertigo Up sale por arriba, con conducto concéntrico: el aire de combustión baja por la envolvente exterior mientras los humos suben por dentro. La estufa queda así bastante más cerca del tabique, lo que cambia las cosas en una estancia estrecha o ante una pared ya amueblada. Al ser estanca, toma el aire del exterior y puede instalarse en vivienda de baja demanda energética. El cristal Magic Glass permanece negro mientras el fuego no está encendido, y el cuerpo redondo en vidrio y metal se mira bien desde todos los lados, lo que importa cuando la estufa no está contra un muro ciego.',
    ),
    bullets: {
      fr: [
        'Sortie concentrique par le dessus — installation plus près du mur',
        'Étanche — zones d’installation 1, 2 ou 3',
        'Magic Glass : la vitre reste opaque hors combustion',
        'Surface de chauffe annoncée : environ 90 m²',
        'Autonomie annoncée jusqu’à 20 h en fonctionnement continu',
        'Télécommande incluse, module Wi-Fi en option',
        'Appareil annoncé recyclable à 85 %',
      ],
      en: [
        'Concentric flue through the top — fits closer to the wall',
        'Sealed — installation zones 1, 2 or 3',
        'Magic Glass: the pane stays opaque when the fire is out',
        'Stated heated area: about 90 m²',
        'Stated burn time up to 20 h of continuous operation',
        'Remote control included, Wi-Fi module optional',
        'Appliance stated to be 85 % recyclable',
      ],
      nl: [
        'Concentrische afvoer via de bovenkant — staat dichter bij de muur',
        'Luchtdicht — plaatsingszones 1, 2 of 3',
        'Magic Glass: het glas blijft ondoorzichtig als het vuur uit is',
        'Opgegeven verwarmd oppervlak: ongeveer 90 m²',
        'Opgegeven autonomie tot 20 u continu bedrijf',
        'Afstandsbediening meegeleverd, wifimodule optioneel',
        'Toestel opgegeven als 85 % recyclebaar',
      ],
      es: [
        'Salida concéntrica por arriba — se instala más cerca de la pared',
        'Estanca — zonas de instalación 1, 2 o 3',
        'Magic Glass: el cristal permanece opaco con el fuego apagado',
        'Superficie de calefacción declarada: unos 90 m²',
        'Autonomía declarada de hasta 20 h en continuo',
        'Mando a distancia incluido, módulo Wi-Fi opcional',
        'Aparato declarado reciclable al 85 %',
      ],
    },
    specs: [
      {
        label: SPEC.power,
        value: L(
          '8,3 kW (étiquette énergétique) — 9,2 kW en désignation commerciale',
          '8.3 kW (energy label) — 9.2 kW as marketed',
          '8,3 kW (energielabel) — 9,2 kW in de handelsbenaming',
          '8,3 kW (etiqueta energética) — 9,2 kW en la denominación comercial',
        ),
      },
      { label: SPEC.area, value: L('Environ 90 m²', 'About 90 m²', 'Ongeveer 90 m²', 'Unos 90 m²') },
      { label: SPEC.efficiency, value: U('> 90 %') },
      { label: SPEC.energyClass, value: U('A+') },
      { label: SPEC.autonomy, value: L('Jusqu’à 20 h', 'Up to 20 h', 'Tot 20 u', 'Hasta 20 h') },
      {
        label: SPEC.flue,
        value: L(
          'Concentrique, par le dessus',
          'Concentric, through the top',
          'Concentrisch, via de bovenkant',
          'Concéntrica, por arriba',
        ),
      },
      {
        label: SPEC.sealed,
        value: L(
          'Oui — zones d’installation 1, 2 ou 3',
          'Yes — installation zones 1, 2 or 3',
          'Ja — plaatsingszones 1, 2 of 3',
          'Sí — zonas de instalación 1, 2 o 3',
        ),
      },
      {
        label: SPEC.noise,
        value: L(
          'Annoncé « ultra silencieux » — aucun niveau en dB communiqué',
          'Stated “ultra quiet” — no dB figure supplied',
          'Opgegeven als “ultrastil” — geen dB-waarde opgegeven',
          'Declarada «ultrasilenciosa» — sin valor en dB facilitado',
        ),
      },
      {
        label: SPEC.control,
        value: L(
          'Télécommande incluse, Wi-Fi en option',
          'Remote control included, Wi-Fi optional',
          'Afstandsbediening meegeleverd, wifi optioneel',
          'Mando incluido, Wi-Fi opcional',
        ),
      },
      PELLET_FUEL,
      { label: SPEC.standard, value: U('EN 14785 · règlement UE 2015/1186') },
      WARRANTY_2Y,
    ],
    tech: {
      // Valeur de l'étiquette énergétique : voir la note en tête de fiche.
      powerMaxKw: 8.3,
      powerMinKw: null,
      heatedAreaMinM2: null,
      heatedAreaMaxM2: 90,
      hopperKg: null,
      efficiencyPercent: null,
      energyClass: 'A+',
      flueDiameterMm: null,
      noiseDbA: null,
      waterPowerKw: null,
      domesticHotWater: false,
      ductedOutlets: null,
      dimensionsMm: null,
      weightKg: null,
    },
    images: [
      placeholderImage(
        'stove-air',
        L(
          'Poêle à granulés étanche ETNA Vertigo Up, corps rond en verre et métal, sortie des fumées par le dessus',
          'ETNA Vertigo Up sealed pellet stove, round body in glass and metal, flue through the top',
          'ETNA Vertigo Up luchtdichte pelletkachel, ronde behuizing in glas en metaal, afvoer via de bovenkant',
          'Estufa de pellets estanca ETNA Vertigo Up, cuerpo redondo en vidrio y metal, salida de humos por arriba',
        ),
      ),
    ],
    variants: [],
    crossSell: ['anna-12', 'vulcano-silenzio-up'],
    hero: true,
    dataVerified: true,
    // Poids provisoire, le temps d'avoir la fiche technique. Il ne sert qu'à
    // l'information : le tarif de transport dépend du drapeau `freight`.
    weightGrams: 135_000,
    freight: true,
    badge: L('Sortie par le dessus', 'Top flue outlet', 'Afvoer bovenaan', 'Salida por arriba'),
    dispatchDaysMin: 3,
    dispatchDaysMax: 6,
  },
  // ETNA Vulcano Silenzio Up — même plateforme technique que le Vertigo Up
  // (étanche, sortie concentrique supérieure, mêmes puissances), dans un corps
  // rectangulaire au lieu du corps rond.
  //
  // PUISSANCE : l'étiquette énergétique, reçue cette fois en taille réelle et
  // parfaitement lisible, porte « ETNA · VULCANO · A+ · 8,3 kW · 2015/1186 ».
  // La désignation commerciale annonce 9,2 kW. Même arbitrage que pour les
  // deux fiches précédentes : l'étiquette alimente `powerMaxKw`, et la fiche
  // affiche les deux valeurs.
  //
  // PAS ENCORE DE PHOTOGRAPHIE : les trois visuels produit sont arrivés en
  // 125 px et `media:scan` les a écartés. L'étiquette est mise de côté sous
  // `_etiquette-energie.webp` — seule à être exploitable, elle deviendrait la
  // vignette du produit dans toutes les grilles. La fiche porte donc
  // l'illustration de substitution et la mention qui va avec.
  //
  // RESTE À CONFIRMER, signalé par `null` : puissance minimale, rendement,
  // réservoir, diamètre de sortie, dimensions, poids, niveau sonore.
  //
  // PRIX ET COÛT D'ACHAT PROVISOIRES.
  {
    id: 'vulcano-silenzio-up',
    slug: {
      fr: 'etna-vulcano-silenzio-up-poele-granules-etanche-sortie-dessus',
      en: 'etna-vulcano-silenzio-up-sealed-pellet-stove-top-outlet',
      nl: 'etna-vulcano-silenzio-up-luchtdichte-pelletkachel-bovenafvoer',
      es: 'etna-vulcano-silenzio-up-estufa-pellets-estanca-salida-superior',
    },
    name: 'ETNA Vulcano Silenzio Up',
    category: 'pellet',
    distribution: 'air',
    price: euros(2690),
    compareAtPrice: null,
    tagline: L(
      'La sortie par le dessus du Vertigo, dans un corps droit qui se range contre un mur.',
      'The Vertigo’s top flue outlet, in a straight body that tucks against a wall.',
      'De bovenafvoer van de Vertigo, in een rechte behuizing die tegen een muur past.',
      'La salida superior del Vertigo, en un cuerpo recto que se arrima a la pared.',
    ),
    description: L(
      "Le Vulcano Silenzio Up partage la plateforme du Vertigo Up : même étanchéité, même sortie concentrique par le dessus — l'air de combustion descend par l'enveloppe extérieure du conduit pendant que les fumées montent par l'intérieur — et donc le même gain de place, l'appareil n'ayant plus à réserver l'espace d'un coude arrière. La différence est la forme : un corps rectangulaire à façade plane, qui s'aligne sur un mur ou s'encastre entre deux meubles là où le corps rond du Vertigo demande à être vu de tous les côtés. Le constructeur le classe parmi ses modèles les plus silencieux, sans publier de niveau sonore mesuré.",
      'The Vulcano Silenzio Up shares the Vertigo Up’s platform: the same sealed construction, the same concentric flue through the top — combustion air comes down the outer sleeve while the flue gases rise inside it — and therefore the same saving in space, since no room is needed for a rear elbow. The difference is the shape: a rectangular body with a flat front, which lines up against a wall or slots between two units, where the Vertigo’s round body asks to be seen from every side. The manufacturer ranks it among its quietest models, without publishing a measured noise level.',
      'De Vulcano Silenzio Up deelt het platform van de Vertigo Up: dezelfde luchtdichte bouw, dezelfde concentrische afvoer via de bovenkant — de verbrandingslucht komt via de buitenmantel naar beneden terwijl de rookgassen er binnenin omhoog gaan — en dus dezelfde ruimtewinst, want er hoeft geen plaats te zijn voor een bocht achteraan. Het verschil is de vorm: een rechthoekige behuizing met vlak front, die tegen een muur aansluit of tussen twee kasten past, waar de ronde Vertigo van alle kanten gezien wil worden. De fabrikant rekent hem tot zijn stilste modellen, zonder een gemeten geluidsniveau te publiceren.',
      'La Vulcano Silenzio Up comparte la plataforma de la Vertigo Up: la misma estanqueidad, la misma salida concéntrica por arriba —el aire de combustión baja por la envolvente exterior mientras los humos suben por dentro— y por tanto el mismo ahorro de espacio, ya que no hay que reservar sitio para un codo trasero. La diferencia es la forma: un cuerpo rectangular de frontal plano, que se alinea contra una pared o encaja entre dos muebles, donde el cuerpo redondo de la Vertigo pide verse por todos los lados. El fabricante la sitúa entre sus modelos más silenciosos, sin publicar un nivel sonoro medido.',
    ),
    bullets: {
      fr: [
        'Sortie concentrique par le dessus — installation plus près du mur',
        'Étanche — zones d’installation 1, 2 ou 3',
        'Corps rectangulaire à façade plane, pensé pour s’aligner sur un mur',
        'Classé « ultra-silencieux » par le constructeur',
        'Classe énergétique A+ — étiquette vérifiée',
        'Télécommande incluse, module Wi-Fi en option',
      ],
      en: [
        'Concentric flue through the top — fits closer to the wall',
        'Sealed — installation zones 1, 2 or 3',
        'Rectangular body with a flat front, meant to line up against a wall',
        'Ranked “ultra-quiet” by the manufacturer',
        'Energy class A+ — label verified',
        'Remote control included, Wi-Fi module optional',
      ],
      nl: [
        'Concentrische afvoer via de bovenkant — staat dichter bij de muur',
        'Luchtdicht — plaatsingszones 1, 2 of 3',
        'Rechthoekige behuizing met vlak front, om tegen een muur aan te sluiten',
        'Door de fabrikant als “ultrastil” aangeduid',
        'Energieklasse A+ — label geverifieerd',
        'Afstandsbediening meegeleverd, wifimodule optioneel',
      ],
      es: [
        'Salida concéntrica por arriba — se instala más cerca de la pared',
        'Estanca — zonas de instalación 1, 2 o 3',
        'Cuerpo rectangular de frontal plano, pensado para alinearse con la pared',
        'Clasificada «ultrasilenciosa» por el fabricante',
        'Clase energética A+ — etiqueta verificada',
        'Mando a distancia incluido, módulo Wi-Fi opcional',
      ],
    },
    specs: [
      {
        label: SPEC.power,
        value: L(
          '8,3 kW (étiquette énergétique) — 9,2 kW en désignation commerciale',
          '8.3 kW (energy label) — 9.2 kW as marketed',
          '8,3 kW (energielabel) — 9,2 kW in de handelsbenaming',
          '8,3 kW (etiqueta energética) — 9,2 kW en la denominación comercial',
        ),
      },
      { label: SPEC.energyClass, value: U('A+') },
      {
        label: SPEC.flue,
        value: L(
          'Concentrique, par le dessus',
          'Concentric, through the top',
          'Concentrisch, via de bovenkant',
          'Concéntrica, por arriba',
        ),
      },
      {
        label: SPEC.sealed,
        value: L(
          'Oui — zones d’installation 1, 2 ou 3',
          'Yes — installation zones 1, 2 or 3',
          'Ja — plaatsingszones 1, 2 of 3',
          'Sí — zonas de instalación 1, 2 o 3',
        ),
      },
      {
        label: SPEC.noise,
        value: L(
          'Annoncé « ultra-silencieux » — aucun niveau en dB communiqué',
          'Stated “ultra-quiet” — no dB figure supplied',
          'Opgegeven als “ultrastil” — geen dB-waarde opgegeven',
          'Declarada «ultrasilenciosa» — sin valor en dB facilitado',
        ),
      },
      {
        label: SPEC.control,
        value: L(
          'Télécommande incluse, Wi-Fi en option',
          'Remote control included, Wi-Fi optional',
          'Afstandsbediening meegeleverd, wifi optioneel',
          'Mando incluido, Wi-Fi opcional',
        ),
      },
      PELLET_FUEL,
      { label: SPEC.standard, value: U('EN 14785 · règlement UE 2015/1186') },
      WARRANTY_2Y,
    ],
    tech: {
      // Étiquette énergétique ETNA « VULCANO », lue en taille réelle.
      powerMaxKw: 8.3,
      powerMinKw: null,
      heatedAreaMinM2: null,
      // Non communiquée pour ce modèle. Reprise de la plateforme commune au
      // Vertigo Up, dont la documentation annonce environ 90 m² à puissance
      // identique — à confirmer sur la fiche technique du Vulcano.
      heatedAreaMaxM2: 90,
      hopperKg: null,
      efficiencyPercent: null,
      energyClass: 'A+',
      flueDiameterMm: null,
      noiseDbA: null,
      waterPowerKw: null,
      domesticHotWater: false,
      ductedOutlets: null,
      dimensionsMm: null,
      weightKg: null,
    },
    images: [
      placeholderImage(
        'stove-air',
        L(
          'Poêle à granulés étanche ETNA Vulcano Silenzio Up, corps rectangulaire, sortie des fumées par le dessus',
          'ETNA Vulcano Silenzio Up sealed pellet stove, rectangular body, flue through the top',
          'ETNA Vulcano Silenzio Up luchtdichte pelletkachel, rechthoekige behuizing, afvoer via de bovenkant',
          'Estufa de pellets estanca ETNA Vulcano Silenzio Up, cuerpo rectangular, salida de humos por arriba',
        ),
      ),
    ],
    variants: [],
    crossSell: ['anna-12', 'vertigo-up'],
    hero: false,
    dataVerified: true,
    weightGrams: 130_000,
    freight: true,
    badge: L('Sortie par le dessus', 'Top flue outlet', 'Afvoer bovenaan', 'Salida por arriba'),
    dispatchDaysMin: 3,
    dispatchDaysMax: 6,
  },



  // ══════════════════════════ FOYERS DÉCORATIFS ══════════════════════════
  //
  // PROVENANCE DES DONNÉES, ET CE QU'ELLE VAUT.
  //
  // Les douze fiches qui suivent — six bioéthanol, six électriques — sont
  // bâties sur un relevé de la place de marché ManoMano Espagne d'octobre
  // 2026, conservé dans `data/releves/`. Chaque fiche porte en commentaire
  // l'URL de l'annonce dont elle reprend le modèle et le prix observé.
  //
  // Ce que ce relevé contient réellement : nom commercial, marque,
  // dimensions, capacité du brûleur, autonomie, puissance électrique — quand
  // le vendeur les annonce. Rien d'autre. Une annonce de place de marché
  // n'est PAS une fiche technique de fabricant : elle ne porte ni déclaration
  // de conformité, ni rendement, ni poids pesé. D'où `dataVerified: false`
  // sur les douze, et des poids explicitement marqués ESTIMÉS.
  //
  // CE QUI RESTE À FAIRE AVANT LA PREMIÈRE VENTE, dans cet ordre :
  //   1. choisir un fournisseur et obtenir son tarif — les coûts d'achat de
  //      `sourcing.ts` sont calculés depuis le prix de vente, pas négociés ;
  //   2. récupérer la déclaration de conformité et la notice de chaque modèle ;
  //   3. peser un exemplaire emballé : le poids commande le prix du port, et
  //      une erreur de 10 kg se paie à chaque expédition ;
  //   4. obtenir les visuels — media pack du fournisseur ou photos propres.
  //      Les images de ManoMano appartiennent à ses vendeurs.
  //
  // PRIX DE VENTE : arrondi au 0,90 € immédiatement supérieur au prix observé
  // sur la place de marché. C'est un alignement sur le marché, pas un calcul
  // de marge ; la marge se vérifie avec `npm run economics` une fois les vrais
  // coûts d'achat saisis.
  //
  // POURQUOI CES DEUX FAMILLES NE SONT PAS DES « APPAREILS » dans le modèle :
  // voir le commentaire de `applianceCategories` dans `catalog.types.ts`.
  // Conséquence directe et voulue : `tech: null`, `distribution: null`, et
  // aucune de ces fiches n'apparaît dans le calculateur de puissance.

  // Relevé : https://www.manomano.es/p/biochimenea-de-sobremesa-kekai-etna-355x18x205cm-quemador-de-acero-inoxidable-proteccion-de-vidrio-templado-y-extintor-manual-76349104
  // Prix observé 36,96 €.
  {
    id: 'bio-etna-table',
    slug: {
      fr: 'kekai-etna-cheminee-bioethanol-de-table',
      en: 'kekai-etna-tabletop-bioethanol-fireplace',
      nl: 'kekai-etna-bio-ethanolhaard-voor-tafel',
      es: 'kekai-etna-chimenea-de-bioetanol-de-sobremesa',
    },
    name: 'KEKAI Etna',
    category: 'bioethanol',
    distribution: null,
    price: euros(39.9),
    compareAtPrice: null,
    tagline: L(
      'Une flamme sur la table, sans installation ni conduit.',
      'A flame on the table, with no installation and no flue.',
      'Een vlam op tafel, zonder installatie en zonder rookkanaal.',
      'Una llama sobre la mesa, sin instalación ni conducto.',
    ),
    description: L(
      'Le plus petit format du rayon : un brûleur en acier inoxydable posé dans un socle de 35,5 cm, protégé par une vitre en verre trempé. On le remplit de bioéthanol, on l’allume, et c’est tout — ni raccordement, ni conduit, ni prise. C’est un objet de décoration pour une table ou un rebord de cheminée, et pas un chauffage : ne comptez pas sur lui pour réchauffer une pièce.',
      'The smallest format in the range: a stainless steel burner set in a 35.5 cm base, shielded by tempered glass. Fill it with bioethanol, light it, done — no connection, no flue, no socket. It is a decorative object for a table or a mantelpiece, not a heater: do not expect it to warm a room.',
      'Het kleinste formaat van het assortiment: een roestvrijstalen brander in een voet van 35,5 cm, beschermd door gehard glas. Vullen met bio-ethanol, aansteken, klaar — geen aansluiting, geen rookkanaal, geen stopcontact. Het is een decoratief object voor een tafel of schoorsteenmantel, geen verwarming: verwacht niet dat het een kamer opwarmt.',
      'El formato más pequeño de la gama: un quemador de acero inoxidable montado en una base de 35,5 cm, protegido por vidrio templado. Se llena de bioetanol, se enciende y listo — sin conexión, sin conducto, sin enchufe. Es un objeto decorativo para una mesa o una repisa, no una calefacción: no espere que caliente una habitación.',
    ),
    bullets: {
      fr: [
        'Brûleur en acier inoxydable, protection en verre trempé',
        'Aucun conduit, aucun raccordement, aucune prise électrique',
        'Format de table : 35,5 × 18 × 20,5 cm',
        'Objet décoratif — ne remplace pas un appareil de chauffage',
        'À utiliser dans une pièce ventilée, jamais remplir un brûleur chaud',
      ],
      en: [
        'Stainless steel burner, tempered glass shield',
        'No flue, no connection, no mains socket',
        'Tabletop size: 35.5 × 18 × 20.5 cm',
        'Decorative object — not a replacement for a heating appliance',
        'Use in a ventilated room, never refill a hot burner',
      ],
      nl: [
        'Roestvrijstalen brander, scherm van gehard glas',
        'Geen rookkanaal, geen aansluiting, geen stopcontact',
        'Tafelformaat: 35,5 × 18 × 20,5 cm',
        'Decoratief object — vervangt geen verwarmingstoestel',
        'Gebruik in een geventileerde ruimte, vul nooit een warme brander bij',
      ],
      es: [
        'Quemador de acero inoxidable, protección de vidrio templado',
        'Sin conducto, sin conexión, sin enchufe',
        'Formato de sobremesa: 35,5 × 18 × 20,5 cm',
        'Objeto decorativo — no sustituye a un aparato de calefacción',
        'Úselo en una habitación ventilada, nunca rellene un quemador caliente',
      ],
    },
    specs: [
      ETHANOL_FUEL,
      { label: SPEC.mounting, value: L(
        'Posable',
        'Tabletop',
        'Op tafel',
        'De sobremesa',
      ) },
      { label: SPEC.material, value: L(
        'Acier inoxydable, verre trempé',
        'Stainless steel, tempered glass',
        'Roestvrij staal, gehard glas',
        'Acero inoxidable, vidrio templado',
      ) },
      { label: SPEC.dimensions, value: U('20,5 × 35,5 × 18 cm') },
      VENTILATION_REQUIRED,
      WARRANTY_2Y,
    ],
    tech: null,
    images: [
      placeholderImage(
        'bioethanol-table',
        L(
          'Foyer bioéthanol de table avec brûleur inox et vitre de protection',
          'Tabletop bioethanol burner with stainless burner and glass shield',
          'Bio-ethanolhaard voor tafel met rvs-brander en glazen scherm',
          'Chimenea de bioetanol de sobremesa con quemador inox y vidrio',
        ),
      ),
    ],
    variants: [],
    crossSell: ['bio-homcom-floor', 'bio-mauna-loa'],
    hero: false,
    dataVerified: false,
    // Poids ESTIMÉ (2.8 kg emballé) — à peser avant la première expédition.
    weightGrams: 2_800,
    freight: false,
    badge: null,
    dispatchDaysMin: 2,
    dispatchDaysMax: 5,
  },
  // Relevé : https://www.manomano.es/p/homcom-chimenea-de-bioetanol-de-pie-con-tanque-de-09-l-apagallamas-de-acero-inoxidable-tiempo-de-combustion-33h-para-15-20-m-38x22x54-cm-negro-88179379
  // Prix observé 39,99 €.
  // Le vendeur annonce « 15-20 m² ». C’est un argumentaire, pas un essai : d’où le libellé
  // « surface annoncée par le fabricant » et non « surface chauffée ».
  {
    id: 'bio-homcom-floor',
    slug: {
      fr: 'homcom-cheminee-bioethanol-sur-pied-0-9-l',
      en: 'homcom-freestanding-bioethanol-fireplace-0-9-l',
      nl: 'homcom-vrijstaande-bio-ethanolhaard-0-9-l',
      es: 'homcom-chimenea-de-bioetanol-de-pie-0-9-l',
    },
    name: 'HOMCOM 820-333V70',
    category: 'bioethanol',
    distribution: null,
    price: euros(44.9),
    compareAtPrice: null,
    tagline: L(
      'Un foyer debout, 3 h 20 de flamme par remplissage.',
      'A standing hearth, 3 h 20 of flame per fill.',
      'Een staande haard, 3 u 20 vlam per vulling.',
      'Un hogar de pie, 3 h 20 de llama por llenado.',
    ),
    description: L(
      'Un foyer sur pied de 54 cm de haut, en acier, avec un réservoir de 0,9 litre qui tient environ 3 h 20 par remplissage et un couvercle étouffoir en acier inoxydable pour éteindre la flamme sans attendre qu’elle meure seule. Le fabricant parle de 15 à 20 m² : prenez-le comme une indication d’ambiance, pas comme une puissance de chauffage — un brûleur à bioéthanol de ce format apporte une chaleur d’appoint, rien de plus.',
      'A 54 cm tall freestanding steel hearth with a 0.9 litre tank good for roughly 3 h 20 per fill, and a stainless steel snuffer lid to put the flame out rather than wait for it to die. The maker quotes 15 to 20 m²: read that as ambience, not as heating output — a bioethanol burner this size gives background warmth and nothing more.',
      'Een vrijstaande stalen haard van 54 cm hoog met een tank van 0,9 liter die ongeveer 3 u 20 per vulling meegaat, en een roestvrijstalen dooflid om de vlam te doven in plaats van af te wachten. De fabrikant noemt 15 tot 20 m²: lees dat als sfeer, niet als verwarmingsvermogen — een bio-ethanolbrander van dit formaat geeft achtergrondwarmte en niets meer.',
      'Un hogar de pie de 54 cm de alto, en acero, con un depósito de 0,9 litros que dura unas 3 h 20 por llenado y una tapa apagallamas de acero inoxidable para apagar la llama sin esperar. El fabricante habla de 15 a 20 m²: tómelo como una indicación de ambiente, no como una potencia de calefacción — un quemador de bioetanol de este tamaño aporta un calor de apoyo, nada más.',
    ),
    bullets: {
      fr: [
        'Réservoir de 0,9 L — environ 3 h 20 de combustion',
        'Couvercle étouffoir en acier inoxydable fourni',
        'Dimensions 54 × 38 × 22 cm, finition noire',
        'Surface annoncée par le fabricant : 15 à 20 m²',
        'Chaleur d’appoint seulement — ne remplace pas un poêle',
      ],
      en: [
        '0.9 L tank — about 3 h 20 of burn time',
        'Stainless steel snuffer lid included',
        'Dimensions 54 × 38 × 22 cm, black finish',
        'Area claimed by the manufacturer: 15 to 20 m²',
        'Background warmth only — no substitute for a stove',
      ],
      nl: [
        'Tank van 0,9 L — ongeveer 3 u 20 brandtijd',
        'Roestvrijstalen dooflid meegeleverd',
        'Afmetingen 54 × 38 × 22 cm, zwarte afwerking',
        'Door de fabrikant opgegeven oppervlak: 15 tot 20 m²',
        'Alleen achtergrondwarmte — geen vervanging voor een kachel',
      ],
      es: [
        'Depósito de 0,9 L — unas 3 h 20 de combustión',
        'Tapa apagallamas de acero inoxidable incluida',
        'Dimensiones 54 × 38 × 22 cm, acabado negro',
        'Superficie indicada por el fabricante: 15 a 20 m²',
        'Solo calor de apoyo — no sustituye a una estufa',
      ],
    },
    specs: [
      ETHANOL_FUEL,
      { label: SPEC.mounting, value: L(
        'Sur pied',
        'Freestanding',
        'Vrijstaand',
        'De pie',
      ) },
      { label: SPEC.burnerCapacity, value: U('0,9 L') },
      { label: SPEC.autonomy, value: L(
        'Environ 3 h 20',
        'About 3 h 20',
        'Ongeveer 3 u 20',
        'Unas 3 h 20',
      ) },
      { label: SPEC.areaClaimed, value: U('15 – 20 m²') },
      { label: SPEC.dimensions, value: U('54 × 38 × 22 cm') },
      { label: SPEC.material, value: L(
        'Acier, étouffoir inox',
        'Steel, stainless snuffer',
        'Staal, rvs dooflid',
        'Acero, apagallamas inox',
      ) },
      VENTILATION_REQUIRED,
      WARRANTY_2Y,
    ],
    tech: null,
    images: [
      placeholderImage(
        'bioethanol-floor',
        L(
          'Foyer bioéthanol sur pied noir avec réservoir et étouffoir',
          'Black freestanding bioethanol hearth with tank and snuffer',
          'Zwarte vrijstaande bio-ethanolhaard met tank en dooflid',
          'Hogar de bioetanol de pie negro con depósito y apagallamas',
        ),
      ),
    ],
    variants: [],
    crossSell: ['bio-etna-table', 'bio-mauna-loa'],
    hero: false,
    dataVerified: false,
    // Poids ESTIMÉ (6.5 kg emballé) — à peser avant la première expédition.
    weightGrams: 6_500,
    freight: false,
    badge: null,
    dispatchDaysMin: 2,
    dispatchDaysMax: 5,
  },
  // Relevé : https://www.manomano.es/p/biochimenea-de-suelo-kekai-mauna-loa-40x40x145-cm-con-quemador-de-acero-inoxidable-y-extintor-manual-color-blanco-76349090
  // Prix observé 67,80 €.
  {
    id: 'bio-mauna-loa',
    slug: {
      fr: 'kekai-mauna-loa-colonne-bioethanol-145-cm',
      en: 'kekai-mauna-loa-bioethanol-column-145-cm',
      nl: 'kekai-mauna-loa-bio-ethanolzuil-145-cm',
      es: 'kekai-mauna-loa-columna-de-bioetanol-145-cm',
    },
    name: 'KEKAI Mauna Loa',
    category: 'bioethanol',
    distribution: null,
    price: euros(69.9),
    compareAtPrice: null,
    tagline: L(
      'Une colonne de 1,45 m qui tient debout seule dans un angle.',
      'A 1.45 m column that stands on its own in a corner.',
      'Een zuil van 1,45 m die zelfstandig in een hoek staat.',
      'Una columna de 1,45 m que se sostiene sola en un rincón.',
    ),
    description: L(
      'Une colonne blanche de 1,45 m de haut sur une base carrée de 40 cm, avec brûleur en acier inoxydable et étouffoir manuel. Son intérêt est sa hauteur : la flamme arrive au niveau du regard et non au niveau du sol, ce qui change tout dans une pièce où l’on est debout ou assis sur un canapé. Comme tous les foyers de ce rayon, il ne demande ni conduit ni prise, et reste un objet décoratif.',
      'A white column 1.45 m tall on a 40 cm square base, with a stainless steel burner and a manual snuffer. Its point is the height: the flame sits at eye level rather than at floor level, which changes everything in a room where you stand or sit on a sofa. Like every hearth in this section it needs neither flue nor socket, and remains a decorative object.',
      'Een witte zuil van 1,45 m hoog op een vierkante voet van 40 cm, met roestvrijstalen brander en handmatig dooflid. Het punt is de hoogte: de vlam zit op ooghoogte in plaats van op vloerniveau, wat alles verandert in een kamer waar je staat of op een bank zit. Zoals elke haard in dit assortiment vraagt hij geen rookkanaal en geen stopcontact, en blijft hij een decoratief object.',
      'Una columna blanca de 1,45 m de alto sobre una base cuadrada de 40 cm, con quemador de acero inoxidable y apagallamas manual. Su interés es la altura: la llama queda a la altura de la vista y no del suelo, lo que cambia todo en una habitación donde se está de pie o sentado en un sofá. Como todos los hogares de esta sección, no necesita conducto ni enchufe, y sigue siendo un objeto decorativo.',
    ),
    bullets: {
      fr: [
        'Colonne de 145 cm, base de 40 × 40 cm',
        'Brûleur en acier inoxydable, étouffoir manuel fourni',
        'Finition blanche',
        'Ni conduit, ni prise électrique, ni raccordement',
        'Objet décoratif — ne remplace pas un appareil de chauffage',
      ],
      en: [
        '145 cm column, 40 × 40 cm base',
        'Stainless steel burner, manual snuffer included',
        'White finish',
        'No flue, no socket, no connection',
        'Decorative object — not a replacement for a heating appliance',
      ],
      nl: [
        'Zuil van 145 cm, voet van 40 × 40 cm',
        'Roestvrijstalen brander, handmatig dooflid meegeleverd',
        'Witte afwerking',
        'Geen rookkanaal, geen stopcontact, geen aansluiting',
        'Decoratief object — vervangt geen verwarmingstoestel',
      ],
      es: [
        'Columna de 145 cm, base de 40 × 40 cm',
        'Quemador de acero inoxidable, apagallamas manual incluido',
        'Acabado blanco',
        'Sin conducto, sin enchufe, sin conexión',
        'Objeto decorativo — no sustituye a un aparato de calefacción',
      ],
    },
    specs: [
      ETHANOL_FUEL,
      { label: SPEC.mounting, value: L(
        'Sur pied',
        'Freestanding',
        'Vrijstaand',
        'De pie',
      ) },
      { label: SPEC.dimensions, value: U('145 × 40 × 40 cm') },
      { label: SPEC.material, value: L(
        'Acier laqué blanc, brûleur inox',
        'White lacquered steel, stainless burner',
        'Wit gelakt staal, rvs-brander',
        'Acero lacado blanco, quemador inox',
      ) },
      VENTILATION_REQUIRED,
      WARRANTY_2Y,
    ],
    tech: null,
    images: [
      placeholderImage(
        'bioethanol-floor',
        L(
          'Colonne bioéthanol blanche de 145 cm avec brûleur inox',
          'White 145 cm bioethanol column with stainless burner',
          'Witte bio-ethanolzuil van 145 cm met rvs-brander',
          'Columna de bioetanol blanca de 145 cm con quemador inox',
        ),
      ),
    ],
    variants: [],
    crossSell: ['bio-homcom-floor', 'bio-siena-wall'],
    hero: false,
    dataVerified: false,
    // Poids ESTIMÉ (11.0 kg emballé) — à peser avant la première expédition.
    weightGrams: 11_000,
    freight: false,
    badge: null,
    dispatchDaysMin: 2,
    dispatchDaysMax: 6,
  },
  // Relevé : https://www.manomano.es/p/qlima-chimenea-de-etanol-cuadrada-42x23x42-cm-ffb-4242-6193566
  // Prix observé 187,35 €.
  // QLIMA est une marque européenne établie (groupe PVG) : c’est la seule du rayon dont
  // on peut raisonnablement attendre une notice et une déclaration de conformité en quatre langues.
  {
    id: 'bio-qlima-ffb4242',
    slug: {
      fr: 'qlima-ffb-4242-cheminee-bioethanol-carree',
      en: 'qlima-ffb-4242-square-bioethanol-fireplace',
      nl: 'qlima-ffb-4242-vierkante-bio-ethanolhaard',
      es: 'qlima-ffb-4242-chimenea-de-etanol-cuadrada',
    },
    name: 'QLIMA FFB 4242',
    category: 'bioethanol',
    distribution: null,
    price: euros(189.9),
    compareAtPrice: null,
    tagline: L(
      'Le format carré d’une marque qui fournit une vraie notice.',
      'The square format, from a brand that ships a real manual.',
      'Het vierkante formaat, van een merk dat een echte handleiding levert.',
      'El formato cuadrado de una marca que entrega un manual de verdad.',
    ),
    description: L(
      'Un foyer carré de 42 cm de côté, à poser, de la marque néerlandaise QLIMA. On le retient moins pour sa fiche que pour ce qui l’accompagne : un fabricant identifié, une référence de modèle stable (FFB 4242) et une notice, ce qui est loin d’être la règle sur ce rayon où beaucoup d’articles sont vendus sans marque. Pour un produit à flamme nue et combustible liquide, c’est l’argument le plus sérieux.',
      'A square 42 cm free-standing hearth from the Dutch brand QLIMA. The reason to pick it is less the spec sheet than what comes with it: a named manufacturer, a stable model reference (FFB 4242) and a manual — far from the norm in a category where many items are sold unbranded. For a product with an open flame and liquid fuel, that is the most serious argument there is.',
      'Een vierkante haard van 42 cm, los te plaatsen, van het Nederlandse merk QLIMA. De reden om hem te kiezen is minder het gegevensblad dan wat erbij hoort: een bekende fabrikant, een vast modelnummer (FFB 4242) en een handleiding — lang niet de regel in een categorie waar veel artikelen zonder merk worden verkocht. Voor een product met open vlam en vloeibare brandstof is dat het serieuste argument.',
      'Un hogar cuadrado de 42 cm de lado, para colocar, de la marca neerlandesa QLIMA. Se elige menos por su ficha que por lo que lo acompaña: un fabricante identificado, una referencia de modelo estable (FFB 4242) y un manual, lo que está lejos de ser la norma en una sección donde muchos artículos se venden sin marca. Para un producto de llama abierta y combustible líquido, es el argumento más serio.',
    ),
    bullets: {
      fr: [
        'Marque identifiée, référence de modèle stable : FFB 4242',
        'Format carré 42 × 23 × 42 cm, à poser',
        'Fabricant européen — notice et pièces disponibles',
        'Ni conduit, ni prise électrique',
        'Objet décoratif — ne remplace pas un appareil de chauffage',
      ],
      en: [
        'Named brand, stable model reference: FFB 4242',
        'Square 42 × 23 × 42 cm, free-standing',
        'European manufacturer — manual and parts available',
        'No flue, no mains socket',
        'Decorative object — not a replacement for a heating appliance',
      ],
      nl: [
        'Bekend merk, vast modelnummer: FFB 4242',
        'Vierkant 42 × 23 × 42 cm, los te plaatsen',
        'Europese fabrikant — handleiding en onderdelen beschikbaar',
        'Geen rookkanaal, geen stopcontact',
        'Decoratief object — vervangt geen verwarmingstoestel',
      ],
      es: [
        'Marca identificada, referencia de modelo estable: FFB 4242',
        'Formato cuadrado 42 × 23 × 42 cm, para colocar',
        'Fabricante europeo — manual y piezas disponibles',
        'Sin conducto, sin enchufe',
        'Objeto decorativo — no sustituye a un aparato de calefacción',
      ],
    },
    specs: [
      ETHANOL_FUEL,
      { label: SPEC.reference, value: U('FFB 4242') },
      { label: SPEC.mounting, value: L(
        'Posable',
        'Free-standing',
        'Los te plaatsen',
        'Para colocar',
      ) },
      { label: SPEC.dimensions, value: U('42 × 42 × 23 cm') },
      VENTILATION_REQUIRED,
      WARRANTY_2Y,
    ],
    tech: null,
    images: [
      placeholderImage(
        'bioethanol-table',
        L(
          'Foyer bioéthanol carré QLIMA posé au sol',
          'Square QLIMA bioethanol hearth standing on the floor',
          'Vierkante QLIMA bio-ethanolhaard op de vloer',
          'Hogar de bioetanol cuadrado QLIMA colocado en el suelo',
        ),
      ),
    ],
    variants: [],
    crossSell: ['bio-siena-wall', 'bio-revello'],
    hero: false,
    dataVerified: false,
    // Poids ESTIMÉ (9.0 kg emballé) — à peser avant la première expédition.
    weightGrams: 9_000,
    freight: false,
    badge: null,
    dispatchDaysMin: 3,
    dispatchDaysMax: 7,
  },
  // Relevé : https://www.manomano.es/p/siena-chimenea-de-bioetanol-pared-90x12xh40-cm-85700571
  // Prix observé 245,99 €.
  {
    id: 'bio-siena-wall',
    slug: {
      fr: 'frankystar-siena-cheminee-bioethanol-murale-90-cm',
      en: 'frankystar-siena-wall-bioethanol-fireplace-90-cm',
      nl: 'frankystar-siena-bio-ethanolhaard-wand-90-cm',
      es: 'frankystar-siena-chimenea-de-bioetanol-pared-90-cm',
    },
    name: 'FRANKYSTAR Siena',
    category: 'bioethanol',
    distribution: null,
    price: euros(249.9),
    compareAtPrice: null,
    tagline: L(
      'Un bandeau de flamme de 90 cm fixé au mur, 12 cm d’épaisseur.',
      'A 90 cm band of flame on the wall, 12 cm deep.',
      'Een vlammenband van 90 cm aan de wand, 12 cm diep.',
      'Una banda de llama de 90 cm fijada a la pared, 12 cm de grosor.',
    ),
    description: L(
      'Le format qui fait l’intérêt du bioéthanol : 90 cm de large pour seulement 12 cm d’épaisseur, fixé au mur comme un tableau. Aucun conduit à percer, aucune arrivée de gaz, aucune prise — c’est la seule technologie qui permet une vraie flamme dans un appartement où rien n’était prévu. En échange, la contrepartie est entière : la flamme consomme l’oxygène de la pièce et rejette du CO₂ et de la vapeur d’eau, donc la pièce doit être ventilée.',
      'This is the format that makes bioethanol worth it: 90 cm wide and only 12 cm deep, wall-mounted like a picture. No flue to cut, no gas supply, no socket — it is the only technology that puts a real flame in a flat where nothing was provided for. The trade-off is real: the flame consumes the room’s oxygen and releases CO₂ and water vapour, so the room has to be ventilated.',
      'Dit is het formaat dat bio-ethanol de moeite waard maakt: 90 cm breed en maar 12 cm diep, aan de wand als een schilderij. Geen rookkanaal te maken, geen gasleiding, geen stopcontact — het is de enige techniek die een echte vlam in een appartement brengt waar niets voorzien was. De keerzijde is reëel: de vlam verbruikt de zuurstof in de kamer en geeft CO₂ en waterdamp af, dus de kamer moet geventileerd zijn.',
      'Este es el formato que hace interesante el bioetanol: 90 cm de ancho por solo 12 cm de grosor, fijado a la pared como un cuadro. Sin conducto que perforar, sin acometida de gas, sin enchufe — es la única tecnología que permite una llama real en un piso donde nada estaba previsto. A cambio, la contrapartida es entera: la llama consume el oxígeno de la habitación y libera CO₂ y vapor de agua, por lo que la habitación debe estar ventilada.',
    ),
    bullets: {
      fr: [
        '90 cm de large, 12 cm d’épaisseur seulement — fixation murale',
        'Aucun percement de conduit, aucune arrivée de gaz',
        'Hauteur 40 cm',
        'La pièce doit rester ventilée pendant le fonctionnement',
        'Objet décoratif — ne remplace pas un appareil de chauffage',
      ],
      en: [
        '90 cm wide, only 12 cm deep — wall-mounted',
        'No flue to cut, no gas supply',
        'Height 40 cm',
        'The room must stay ventilated while it burns',
        'Decorative object — not a replacement for a heating appliance',
      ],
      nl: [
        '90 cm breed, slechts 12 cm diep — wandmontage',
        'Geen rookkanaal te maken, geen gasleiding',
        'Hoogte 40 cm',
        'De kamer moet geventileerd blijven tijdens gebruik',
        'Decoratief object — vervangt geen verwarmingstoestel',
      ],
      es: [
        '90 cm de ancho, solo 12 cm de grosor — fijación a la pared',
        'Sin perforar conducto, sin acometida de gas',
        'Altura 40 cm',
        'La habitación debe permanecer ventilada durante el uso',
        'Objeto decorativo — no sustituye a un aparato de calefacción',
      ],
    },
    specs: [
      ETHANOL_FUEL,
      { label: SPEC.mounting, value: L(
        'Murale',
        'Wall-mounted',
        'Wandmontage',
        'A la pared',
      ) },
      { label: SPEC.dimensions, value: U('40 × 90 × 12 cm') },
      VENTILATION_REQUIRED,
      WARRANTY_2Y,
    ],
    tech: null,
    images: [
      placeholderImage(
        'bioethanol-wall',
        L(
          'Foyer bioéthanol murale de 90 cm, bandeau de flamme',
          '90 cm wall-mounted bioethanol hearth with a band of flame',
          'Bio-ethanolhaard van 90 cm aan de wand met vlammenband',
          'Hogar de bioetanol de pared de 90 cm con banda de llama',
        ),
      ),
    ],
    variants: [],
    crossSell: ['bio-revello', 'bio-qlima-ffb4242'],
    hero: false,
    dataVerified: false,
    // Poids ESTIMÉ (14.0 kg emballé) — à peser avant la première expédition.
    weightGrams: 14_000,
    freight: false,
    badge: null,
    dispatchDaysMin: 3,
    dispatchDaysMax: 8,
  },
  // Relevé : https://www.manomano.es/p/chimenea-de-bioetanol-revello-capacidad-125-l-superficie-calefactable-30-potencia-kw-3-120x15x40h-cm-negro-148-91705849
  // Prix observé 669,99 €.
  // Le vendeur annonce 3 kW et 30 m². Ces deux nombres sont repris TELS QUELS, en
  // texte libre, et non dans un bloc technique : ils ne viennent pas d’un essai
  // normalisé et ne se comparent pas à la puissance d’un poêle.
  {
    id: 'bio-revello',
    slug: {
      fr: 'dmora-revello-cheminee-bioethanol-120-cm',
      en: 'dmora-revello-bioethanol-fireplace-120-cm',
      nl: 'dmora-revello-bio-ethanolhaard-120-cm',
      es: 'dmora-revello-chimenea-de-bioetanol-120-cm',
    },
    name: 'DMORA Revello',
    category: 'bioethanol',
    distribution: null,
    price: euros(679.9),
    compareAtPrice: null,
    tagline: L(
      '1,20 m de large et un brûleur de 1,25 litre : le haut du rayon.',
      '1.20 m wide with a 1.25 litre burner: the top of the range.',
      '1,20 m breed met een brander van 1,25 liter: de top van het assortiment.',
      '1,20 m de ancho y un quemador de 1,25 litros: lo más alto de la gama.',
    ),
    description: L(
      'Le modèle le plus large du rayon : 120 cm de façade, 40 cm de haut, 15 cm d’épaisseur, et un brûleur de 1,25 litre — presque le double des petits formats, donc une autonomie plus longue entre deux remplissages. Le fabricant annonce 3 kW et 30 m² ; nous reprenons ces chiffres tels qu’il les donne, sans les traduire en surface chauffée, parce qu’un brûleur à bioéthanol n’est pas mesuré comme un poêle. Fabrication italienne.',
      'The widest model in the range: a 120 cm front, 40 cm tall, 15 cm deep, and a 1.25 litre burner — nearly twice the small formats, so a longer run between refills. The maker quotes 3 kW and 30 m²; we pass those figures on as given, without turning them into a heated area, because a bioethanol burner is not measured like a stove. Made in Italy.',
      'Het breedste model van het assortiment: een front van 120 cm, 40 cm hoog, 15 cm diep, en een brander van 1,25 liter — bijna het dubbele van de kleine formaten, dus langer branden tussen twee vullingen. De fabrikant noemt 3 kW en 30 m²; wij geven die cijfers door zoals hij ze opgeeft, zonder ze als verwarmd oppervlak te presenteren, want een bio-ethanolbrander wordt niet gemeten als een kachel. Italiaans fabricaat.',
      'El modelo más ancho de la sección: 120 cm de frente, 40 cm de alto, 15 cm de grosor y un quemador de 1,25 litros — casi el doble de los formatos pequeños, por tanto más autonomía entre dos llenados. El fabricante indica 3 kW y 30 m²; reproducimos esas cifras tal como las da, sin traducirlas a superficie calentada, porque un quemador de bioetanol no se mide como una estufa. Fabricación italiana.',
    ),
    bullets: {
      fr: [
        'Façade de 120 cm — le plus large du rayon',
        'Brûleur de 1,25 L : moins de remplissages',
        'Dimensions 40 × 120 × 15 cm',
        'Annoncé par le fabricant : 3 kW, 30 m²',
        'Fabrication italienne',
      ],
      en: [
        '120 cm front — the widest in the range',
        '1.25 L burner: fewer refills',
        'Dimensions 40 × 120 × 15 cm',
        'Quoted by the manufacturer: 3 kW, 30 m²',
        'Made in Italy',
      ],
      nl: [
        'Front van 120 cm — het breedste van het assortiment',
        'Brander van 1,25 L: minder bijvullen',
        'Afmetingen 40 × 120 × 15 cm',
        'Opgegeven door de fabrikant: 3 kW, 30 m²',
        'Italiaans fabricaat',
      ],
      es: [
        'Frente de 120 cm — el más ancho de la sección',
        'Quemador de 1,25 L: menos llenados',
        'Dimensiones 40 × 120 × 15 cm',
        'Indicado por el fabricante: 3 kW, 30 m²',
        'Fabricación italiana',
      ],
    },
    specs: [
      ETHANOL_FUEL,
      { label: SPEC.mounting, value: L(
        'Murale ou encastrée',
        'Wall-mounted or recessed',
        'Wand of inbouw',
        'A la pared o empotrada',
      ) },
      { label: SPEC.burnerCapacity, value: U('1,25 L') },
      { label: SPEC.areaClaimed, value: U('30 m²') },
      { label: SPEC.power, value: L(
        '3 kW annoncés par le fabricant',
        '3 kW quoted by the manufacturer',
        '3 kW opgegeven door de fabrikant',
        '3 kW indicados por el fabricante',
      ) },
      { label: SPEC.dimensions, value: U('40 × 120 × 15 cm') },
      VENTILATION_REQUIRED,
      WARRANTY_2Y,
    ],
    tech: null,
    images: [
      placeholderImage(
        'bioethanol-wall-wide',
        L(
          'Foyer bioéthanol de 120 cm à deux brûleurs, finition noire',
          '120 cm bioethanol hearth with two burners, black finish',
          'Bio-ethanolhaard van 120 cm met twee branders, zwarte afwerking',
          'Hogar de bioetanol de 120 cm con dos quemadores, acabado negro',
        ),
      ),
    ],
    variants: [],
    crossSell: ['bio-siena-wall', 'elec-oregon'],
    hero: false,
    dataVerified: false,
    // Poids ESTIMÉ (26.0 kg emballé) — à peser avant la première expédition.
    weightGrams: 26_000,
    freight: false,
    badge: null,
    dispatchDaysMin: 4,
    dispatchDaysMax: 10,
  },
  // Relevé : https://www.manomano.es/p/chimenea-elctrica-1600-w-kekai-minesota-84x26x53-cm-con-simulacin-de-fuego-para-paredmesa-negra-42574205
  // Prix observé 127,68 €.
  {
    id: 'elec-minesota',
    slug: {
      fr: 'kekai-minesota-cheminee-electrique-1600-w',
      en: 'kekai-minesota-electric-fireplace-1600-w',
      nl: 'kekai-minesota-elektrische-haard-1600-w',
      es: 'kekai-minesota-chimenea-electrica-1600-w',
    },
    name: 'KEKAI Minesota',
    category: 'electricfire',
    distribution: null,
    price: euros(129.9),
    compareAtPrice: null,
    tagline: L(
      'Au mur ou sur un meuble, 1 600 W sur une prise ordinaire.',
      'On the wall or on a sideboard, 1,600 W from an ordinary socket.',
      'Aan de wand of op een kast, 1.600 W uit een gewoon stopcontact.',
      'En la pared o sobre un mueble, 1.600 W en un enchufe normal.',
    ),
    description: L(
      'Le point d’entrée du rayon électrique, et le plus souple à installer : 84 cm de large, 26 cm de profondeur, à fixer au mur ou simplement à poser sur un meuble. Il se branche sur une prise 230 V et délivre 1 600 W, soit un vrai appoint pour une pièce de vie — c’est la différence avec le bioéthanol, qui ne chauffe presque pas. En contrepartie, la flamme est une simulation lumineuse, pas une combustion.',
      'The entry point of the electric section, and the easiest to install: 84 cm wide, 26 cm deep, to fix to the wall or simply stand on a sideboard. It plugs into a 230 V socket and delivers 1,600 W, which is genuine supplementary heat for a living room — the difference from bioethanol, which barely heats at all. In exchange, the flame is a lit simulation, not combustion.',
      'Het instappunt van het elektrische assortiment, en het makkelijkst te plaatsen: 84 cm breed, 26 cm diep, aan de wand te bevestigen of gewoon op een kast te zetten. Hij gaat in een 230 V-stopcontact en levert 1.600 W, echte bijverwarming voor een woonkamer — het verschil met bio-ethanol, dat nauwelijks verwarmt. Daartegenover staat dat de vlam een lichtsimulatie is, geen verbranding.',
      'El punto de entrada de la sección eléctrica, y el más flexible de instalar: 84 cm de ancho, 26 cm de profundidad, para fijar a la pared o simplemente colocar sobre un mueble. Se enchufa a 230 V y entrega 1.600 W, un apoyo real para una sala de estar — la diferencia con el bioetanol, que apenas calienta. En cambio, la llama es una simulación luminosa, no una combustión.',
    ),
    bullets: {
      fr: [
        '1 600 W sur une prise 230 V ordinaire',
        'Pose murale ou sur un meuble, au choix',
        'Dimensions 53 × 84 × 26 cm, finition noire',
        'Flamme simulée par éclairage — aucune combustion',
        'Ni conduit, ni combustible, ni entretien',
      ],
      en: [
        '1,600 W from an ordinary 230 V socket',
        'Wall-mounted or free-standing on furniture, your choice',
        'Dimensions 53 × 84 × 26 cm, black finish',
        'Flame simulated by lighting — no combustion',
        'No flue, no fuel, no maintenance',
      ],
      nl: [
        '1.600 W uit een gewoon 230 V-stopcontact',
        'Wandmontage of op een meubel, naar keuze',
        'Afmetingen 53 × 84 × 26 cm, zwarte afwerking',
        'Vlam gesimuleerd met licht — geen verbranding',
        'Geen rookkanaal, geen brandstof, geen onderhoud',
      ],
      es: [
        '1.600 W en un enchufe de 230 V normal',
        'Instalación a la pared o sobre un mueble, a elegir',
        'Dimensiones 53 × 84 × 26 cm, acabado negro',
        'Llama simulada por iluminación — sin combustión',
        'Sin conducto, sin combustible, sin mantenimiento',
      ],
    },
    specs: [
      { label: SPEC.electricPower, value: U('1 600 W') },
      ELECTRIC_SUPPLY,
      { label: SPEC.mounting, value: L(
        'Murale ou posable',
        'Wall-mounted or free-standing',
        'Wand of vrijstaand',
        'A la pared o de sobremesa',
      ) },
      { label: SPEC.dimensions, value: U('53 × 84 × 26 cm') },
      FLAME_SIMULATED,
      WARRANTY_2Y,
    ],
    tech: null,
    images: [
      placeholderImage(
        'electric-wall',
        L(
          'Foyer électrique mural noir de 84 cm, flamme simulée',
          'Black 84 cm wall-mounted electric hearth with simulated flame',
          'Zwarte elektrische wandhaard van 84 cm met gesimuleerde vlam',
          'Hogar eléctrico de pared negro de 84 cm con llama simulada',
        ),
      ),
    ],
    variants: [],
    crossSell: ['elec-homcom-wall', 'elec-oregon'],
    hero: false,
    dataVerified: false,
    // Poids ESTIMÉ (10.0 kg emballé) — à peser avant la première expédition.
    weightGrams: 10_000,
    freight: false,
    badge: null,
    dispatchDaysMin: 2,
    dispatchDaysMax: 5,
  },
  // Relevé : https://www.manomano.es/p/homcom-chimenea-electrica-tipo-estufa-de-pared-1000w-2000w-885x135x56cm-negro-2937096
  // Prix observé 161,99 €.
  {
    id: 'elec-homcom-wall',
    slug: {
      fr: 'homcom-cheminee-electrique-murale-1000-2000-w',
      en: 'homcom-wall-electric-fireplace-1000-2000-w',
      nl: 'homcom-elektrische-wandhaard-1000-2000-w',
      es: 'homcom-chimenea-electrica-pared-1000-2000-w',
    },
    name: 'HOMCOM 820-234V90',
    category: 'electricfire',
    distribution: null,
    price: euros(169.9),
    compareAtPrice: null,
    tagline: L(
      'Deux allures, 1 000 ou 2 000 W, et 13,5 cm d’épaisseur.',
      'Two settings, 1,000 or 2,000 W, and 13.5 cm deep.',
      'Twee standen, 1.000 of 2.000 W, en 13,5 cm diep.',
      'Dos niveles, 1.000 o 2.000 W, y 13,5 cm de grosor.',
    ),
    description: L(
      'Un panneau mural de 88,5 cm pour 13,5 cm d’épaisseur, avec deux allures de chauffe : 1 000 W en demi-puissance, 2 000 W en pleine puissance. C’est le réglage qui compte à l’usage — 2 000 W pour monter la température d’une pièce froide, 1 000 W pour la tenir ensuite sans surchauffer. L’effet de flamme fonctionne indépendamment du chauffage, donc on peut garder l’ambiance en été sans chauffer.',
      'An 88.5 cm wall panel just 13.5 cm deep, with two heat settings: 1,000 W at half power, 2,000 W at full. That setting is what matters in daily use — 2,000 W to bring a cold room up, 1,000 W to hold it afterwards without overheating. The flame effect runs independently of the heater, so you can keep the ambience in summer without the heat.',
      'Een wandpaneel van 88,5 cm en slechts 13,5 cm diep, met twee verwarmingsstanden: 1.000 W op halve kracht, 2.000 W op volle kracht. Die instelling is wat in de praktijk telt — 2.000 W om een koude kamer op te warmen, 1.000 W om hem daarna op peil te houden zonder te overdrijven. Het vlameffect werkt los van de verwarming, dus je houdt de sfeer in de zomer zonder warmte.',
      'Un panel de pared de 88,5 cm con solo 13,5 cm de grosor y dos niveles de calor: 1.000 W a media potencia, 2.000 W a plena potencia. Ese ajuste es lo que cuenta en el uso diario — 2.000 W para subir la temperatura de una habitación fría, 1.000 W para mantenerla después sin sobrecalentar. El efecto de llama funciona de forma independiente de la calefacción, así que se puede conservar el ambiente en verano sin calentar.',
    ),
    bullets: {
      fr: [
        'Deux allures : 1 000 W et 2 000 W',
        'Effet de flamme utilisable sans chauffage',
        'Panneau mural de 88,5 cm, 13,5 cm d’épaisseur',
        'Hauteur 56 cm, finition noire',
        'Ni conduit, ni combustible, ni entretien',
      ],
      en: [
        'Two settings: 1,000 W and 2,000 W',
        'Flame effect usable with the heater off',
        '88.5 cm wall panel, 13.5 cm deep',
        'Height 56 cm, black finish',
        'No flue, no fuel, no maintenance',
      ],
      nl: [
        'Twee standen: 1.000 W en 2.000 W',
        'Vlameffect ook te gebruiken zonder verwarming',
        'Wandpaneel van 88,5 cm, 13,5 cm diep',
        'Hoogte 56 cm, zwarte afwerking',
        'Geen rookkanaal, geen brandstof, geen onderhoud',
      ],
      es: [
        'Dos niveles: 1.000 W y 2.000 W',
        'Efecto de llama utilizable sin calefacción',
        'Panel de pared de 88,5 cm, 13,5 cm de grosor',
        'Altura 56 cm, acabado negro',
        'Sin conducto, sin combustible, sin mantenimiento',
      ],
    },
    specs: [
      { label: SPEC.electricPower, value: U('1 000 / 2 000 W') },
      ELECTRIC_SUPPLY,
      { label: SPEC.heatSettings, value: L(
        'Deux allures',
        'Two settings',
        'Twee standen',
        'Dos niveles',
      ) },
      { label: SPEC.mounting, value: L(
        'Murale',
        'Wall-mounted',
        'Wandmontage',
        'A la pared',
      ) },
      { label: SPEC.dimensions, value: U('56 × 88,5 × 13,5 cm') },
      FLAME_SIMULATED,
      WARRANTY_2Y,
    ],
    tech: null,
    images: [
      placeholderImage(
        'electric-wall-wide',
        L(
          'Panneau de cheminée électrique murale noir de 88,5 cm',
          'Black 88.5 cm wall-mounted electric fireplace panel',
          'Zwart elektrisch wandhaardpaneel van 88,5 cm',
          'Panel de chimenea eléctrica de pared negro de 88,5 cm',
        ),
      ),
    ],
    variants: [],
    crossSell: ['elec-minesota', 'elec-pzcc-121'],
    hero: false,
    dataVerified: false,
    // Poids ESTIMÉ (12.0 kg emballé) — à peser avant la première expédition.
    weightGrams: 12_000,
    freight: false,
    badge: null,
    dispatchDaysMin: 2,
    dispatchDaysMax: 5,
  },
  // Relevé : https://www.manomano.es/p/chimenea-electrica-pared-1800w-600x158x520mm-9408180
  // Prix observé 179,95 €.
  {
    id: 'elec-mercatools',
    slug: {
      fr: 'mercatools-mt-1800-cheminee-electrique-murale',
      en: 'mercatools-mt-1800-wall-electric-fireplace',
      nl: 'mercatools-mt-1800-elektrische-wandhaard',
      es: 'mercatools-mt-1800-chimenea-electrica-pared',
    },
    name: 'MERCATOOLS MT 1800',
    category: 'electricfire',
    distribution: null,
    price: euros(184.9),
    compareAtPrice: null,
    tagline: L(
      'Le format compact : 60 cm de large, 1 800 W.',
      'The compact format: 60 cm wide, 1,800 W.',
      'Het compacte formaat: 60 cm breed, 1.800 W.',
      'El formato compacto: 60 cm de ancho, 1.800 W.',
    ),
    description: L(
      'Le plus étroit des foyers électriques du rayon : 60 cm de large seulement, pour 1 800 W. C’est le modèle à retenir quand le mur disponible est court — une chambre, un couloir, un bureau — là où un panneau de 1,20 m ne tiendrait pas. La puissance, elle, ne descend pas avec la largeur : 1 800 W suffisent à chauffer une petite pièce en appoint.',
      'The narrowest electric hearth in the range: just 60 cm wide for 1,800 W. This is the one to pick when the available wall is short — a bedroom, a hallway, a study — where a 1.20 m panel would not fit. The output does not shrink with the width: 1,800 W is enough to warm a small room as supplementary heat.',
      'De smalste elektrische haard van het assortiment: slechts 60 cm breed voor 1.800 W. Dit is de keuze wanneer de beschikbare wand kort is — een slaapkamer, een gang, een werkkamer — waar een paneel van 1,20 m niet past. Het vermogen krimpt niet mee met de breedte: 1.800 W is genoeg om een kleine kamer bij te verwarmen.',
      'El más estrecho de los hogares eléctricos de la sección: solo 60 cm de ancho para 1.800 W. Es el modelo a elegir cuando la pared disponible es corta — un dormitorio, un pasillo, un despacho — donde un panel de 1,20 m no cabría. La potencia no baja con el ancho: 1.800 W bastan para calentar una habitación pequeña como apoyo.',
    ),
    bullets: {
      fr: [
        '60 cm de large seulement — pour les murs courts',
        '1 800 W sur une prise 230 V',
        'Dimensions 52 × 60 × 15,8 cm',
        'Pose murale',
        'Ni conduit, ni combustible, ni entretien',
      ],
      en: [
        'Only 60 cm wide — for short walls',
        '1,800 W from a 230 V socket',
        'Dimensions 52 × 60 × 15.8 cm',
        'Wall-mounted',
        'No flue, no fuel, no maintenance',
      ],
      nl: [
        'Slechts 60 cm breed — voor korte wanden',
        '1.800 W uit een 230 V-stopcontact',
        'Afmetingen 52 × 60 × 15,8 cm',
        'Wandmontage',
        'Geen rookkanaal, geen brandstof, geen onderhoud',
      ],
      es: [
        'Solo 60 cm de ancho — para paredes cortas',
        '1.800 W en un enchufe de 230 V',
        'Dimensiones 52 × 60 × 15,8 cm',
        'Instalación a la pared',
        'Sin conducto, sin combustible, sin mantenimiento',
      ],
    },
    specs: [
      { label: SPEC.electricPower, value: U('1 800 W') },
      ELECTRIC_SUPPLY,
      { label: SPEC.mounting, value: L(
        'Murale',
        'Wall-mounted',
        'Wandmontage',
        'A la pared',
      ) },
      { label: SPEC.dimensions, value: U('52 × 60 × 15,8 cm') },
      FLAME_SIMULATED,
      WARRANTY_2Y,
    ],
    tech: null,
    images: [
      placeholderImage(
        'electric-wall',
        L(
          'Cheminée électrique murale compacte de 60 cm',
          'Compact 60 cm wall-mounted electric fireplace',
          'Compacte elektrische wandhaard van 60 cm',
          'Chimenea eléctrica de pared compacta de 60 cm',
        ),
      ),
    ],
    variants: [],
    crossSell: ['elec-minesota', 'elec-orbegozo-cm8000'],
    hero: false,
    dataVerified: false,
    // Poids ESTIMÉ (11.0 kg emballé) — à peser avant la première expédition.
    weightGrams: 11_000,
    freight: false,
    badge: null,
    dispatchDaysMin: 3,
    dispatchDaysMax: 6,
  },
  // Relevé : https://www.manomano.es/p/orbegozo-cm-8000-negro-estufa-electrica-1800w-efecto-fuego-41188108
  // Prix observé 199,90 €.
  // ORBEGOZO est un fabricant espagnol de petit électroménager : réseau de service
  // après-vente et pièces détachées existants, ce qui n’est pas le cas de la plupart
  // des références de ce rayon.
  {
    id: 'elec-orbegozo-cm8000',
    slug: {
      fr: 'orbegozo-cm-8000-poele-electrique-effet-feu',
      en: 'orbegozo-cm-8000-electric-stove-fire-effect',
      nl: 'orbegozo-cm-8000-elektrische-kachel-vuureffect',
      es: 'orbegozo-cm-8000-estufa-electrica-efecto-fuego',
    },
    name: 'ORBEGOZO CM 8000',
    category: 'electricfire',
    distribution: null,
    price: euros(199.9),
    compareAtPrice: null,
    tagline: L(
      'Une marque espagnole avec un vrai service après-vente.',
      'A Spanish brand with a real after-sales network.',
      'Een Spaans merk met een echt servicenetwerk.',
      'Una marca española con un servicio posventa real.',
    ),
    description: L(
      'Un poêle électrique à effet de feu de 1 800 W, posable, de la marque espagnole ORBEGOZO. Ce qui le distingue n’est pas sa fiche — proche de celle des modèles sans marque — mais le fabricant : ORBEGOZO fait du petit électroménager depuis des décennies et dispose d’un réseau de pièces détachées. Sur un appareil chauffant qu’on garde dix ans, c’est ce qui fait la différence entre une réparation et une poubelle.',
      'A 1,800 W free-standing electric fire-effect stove from the Spanish brand ORBEGOZO. What sets it apart is not the spec sheet — close to that of unbranded models — but the manufacturer: ORBEGOZO has made small domestic appliances for decades and has a spare-parts network. On a heater you keep for ten years, that is the difference between a repair and a bin.',
      'Een vrijstaande elektrische kachel met vuureffect van 1.800 W van het Spaanse merk ORBEGOZO. Wat hem onderscheidt is niet het gegevensblad — vergelijkbaar met dat van merkloze modellen — maar de fabrikant: ORBEGOZO maakt al decennia klein huishoudelijk apparatuur en heeft een onderdelennetwerk. Bij een verwarmingstoestel dat je tien jaar houdt, is dat het verschil tussen reparatie en de vuilnisbak.',
      'Una estufa eléctrica de efecto fuego de 1.800 W, para colocar, de la marca española ORBEGOZO. Lo que la distingue no es su ficha — parecida a la de los modelos sin marca — sino el fabricante: ORBEGOZO fabrica pequeño electrodoméstico desde décadas y dispone de una red de recambios. En un aparato de calor que se conserva diez años, eso marca la diferencia entre una reparación y la basura.',
    ),
    bullets: {
      fr: [
        '1 800 W, effet de feu',
        'Fabricant espagnol — pièces détachées disponibles',
        'Référence de modèle stable : CM 8000',
        'Posable, finition noire',
        'Ni conduit, ni combustible, ni entretien',
      ],
      en: [
        '1,800 W, fire effect',
        'Spanish manufacturer — spare parts available',
        'Stable model reference: CM 8000',
        'Free-standing, black finish',
        'No flue, no fuel, no maintenance',
      ],
      nl: [
        '1.800 W, vuureffect',
        'Spaanse fabrikant — onderdelen beschikbaar',
        'Vast modelnummer: CM 8000',
        'Vrijstaand, zwarte afwerking',
        'Geen rookkanaal, geen brandstof, geen onderhoud',
      ],
      es: [
        '1.800 W, efecto fuego',
        'Fabricante español — recambios disponibles',
        'Referencia de modelo estable: CM 8000',
        'Para colocar, acabado negro',
        'Sin conducto, sin combustible, sin mantenimiento',
      ],
    },
    specs: [
      { label: SPEC.electricPower, value: U('1 800 W') },
      ELECTRIC_SUPPLY,
      { label: SPEC.reference, value: U('CM 8000') },
      { label: SPEC.mounting, value: L(
        'Posable',
        'Free-standing',
        'Vrijstaand',
        'Para colocar',
      ) },
      FLAME_SIMULATED,
      WARRANTY_2Y,
    ],
    tech: null,
    images: [
      placeholderImage(
        'electric-floor',
        L(
          'Poêle électrique noir à effet de feu posé au sol',
          'Black free-standing electric stove with fire effect',
          'Zwarte vrijstaande elektrische kachel met vuureffect',
          'Estufa eléctrica negra de efecto fuego colocada en el suelo',
        ),
      ),
    ],
    variants: [],
    crossSell: ['elec-mercatools', 'elec-pzcc-121'],
    hero: false,
    dataVerified: false,
    // Poids ESTIMÉ (9.0 kg emballé) — à peser avant la première expédition.
    weightGrams: 9_000,
    freight: false,
    badge: null,
    dispatchDaysMin: 2,
    dispatchDaysMax: 6,
  },
  // Relevé : https://www.manomano.es/p/chimenea-electrica-de-1000w2000w-chimenea-decorativa-de-imitacion-de-chimenea-efecto-llama-con-5-niveles-de-brillo-ajustables-121x25x77cm-blanca-207910261
  // Prix observé 332,89 €.
  {
    id: 'elec-pzcc-121',
    slug: {
      fr: 'pzcc-121-cheminee-electrique-encastrable-blanche',
      en: 'pzcc-121-built-in-electric-fireplace-white',
      nl: 'pzcc-121-inbouw-elektrische-haard-wit',
      es: 'pzcc-121-chimenea-electrica-empotrable-blanca',
    },
    name: 'PZCC 121 Blanca',
    category: 'electricfire',
    distribution: null,
    price: euros(339.9),
    compareAtPrice: null,
    tagline: L(
      'Cinq niveaux de flamme, deux allures, et un vrai volume de foyer.',
      'Five flame levels, two heat settings, and a real hearth volume.',
      'Vijf vlamniveaus, twee standen en een echt haardvolume.',
      'Cinco niveles de llama, dos niveles de calor y un volumen de hogar real.',
    ),
    description: L(
      'Un foyer blanc de 121 cm de large et 77 cm de haut, assez profond — 25 cm — pour donner l’illusion d’un vrai âtre, et non d’un écran posé contre un mur. C’est le seul du rayon à offrir ce volume. Deux allures de chauffe, 1 000 et 2 000 W, et cinq niveaux de luminosité pour la flamme, réglables indépendamment du chauffage.',
      'A white hearth 121 cm wide and 77 cm tall, deep enough at 25 cm to read as a real firebox rather than a screen propped against a wall. It is the only one in the range with that volume. Two heat settings, 1,000 and 2,000 W, and five flame brightness levels, adjustable independently of the heat.',
      'Een witte haard van 121 cm breed en 77 cm hoog, met 25 cm diep genoeg om als een echte vuurkorf te lezen en niet als een scherm tegen een wand. Hij is de enige in het assortiment met dat volume. Twee verwarmingsstanden, 1.000 en 2.000 W, en vijf helderheidsniveaus voor de vlam, los van de verwarming te regelen.',
      'Un hogar blanco de 121 cm de ancho y 77 cm de alto, bastante profundo — 25 cm — para dar la ilusión de un hogar real, y no de una pantalla apoyada en la pared. Es el único de la sección con ese volumen. Dos niveles de calor, 1.000 y 2.000 W, y cinco niveles de brillo para la llama, ajustables de forma independiente de la calefacción.',
    ),
    bullets: {
      fr: [
        'Le plus profond du rayon : 25 cm, un vrai volume de foyer',
        'Deux allures : 1 000 W et 2 000 W',
        'Cinq niveaux de luminosité de flamme',
        'Dimensions 77 × 121 × 25 cm',
        'Ni conduit, ni combustible, ni entretien',
      ],
      en: [
        'The deepest in the range: 25 cm, a real hearth volume',
        'Two settings: 1,000 W and 2,000 W',
        'Five flame brightness levels',
        'Dimensions 77 × 121 × 25 cm',
        'No flue, no fuel, no maintenance',
      ],
      nl: [
        'De diepste van het assortiment: 25 cm, een echt haardvolume',
        'Twee standen: 1.000 W en 2.000 W',
        'Vijf helderheidsniveaus voor de vlam',
        'Afmetingen 77 × 121 × 25 cm',
        'Geen rookkanaal, geen brandstof, geen onderhoud',
      ],
      es: [
        'El más profundo de la sección: 25 cm, un volumen de hogar real',
        'Dos niveles: 1.000 W y 2.000 W',
        'Cinco niveles de brillo de llama',
        'Dimensiones 77 × 121 × 25 cm',
        'Sin conducto, sin combustible, sin mantenimiento',
      ],
    },
    specs: [
      { label: SPEC.electricPower, value: U('1 000 / 2 000 W') },
      ELECTRIC_SUPPLY,
      { label: SPEC.control, value: L(
        'Cinq niveaux de luminosité de flamme',
        'Five flame brightness levels',
        'Vijf helderheidsniveaus voor de vlam',
        'Cinco niveles de brillo de llama',
      ) },
      { label: SPEC.mounting, value: L(
        'Encastrable ou posable',
        'Built-in or free-standing',
        'Inbouw of vrijstaand',
        'Empotrable o para colocar',
      ) },
      { label: SPEC.dimensions, value: U('77 × 121 × 25 cm') },
      FLAME_SIMULATED,
      WARRANTY_2Y,
    ],
    tech: null,
    images: [
      placeholderImage(
        'electric-floor',
        L(
          'Foyer électrique encastrable blanc de 121 cm de large',
          'White 121 cm wide built-in electric hearth',
          'Witte inbouw elektrische haard van 121 cm breed',
          'Hogar eléctrico empotrable blanco de 121 cm de ancho',
        ),
      ),
    ],
    variants: [],
    crossSell: ['elec-oregon', 'elec-homcom-wall'],
    hero: false,
    dataVerified: false,
    // Poids ESTIMÉ (24.0 kg emballé) — à peser avant la première expédition.
    weightGrams: 24_000,
    freight: false,
    badge: null,
    dispatchDaysMin: 4,
    dispatchDaysMax: 9,
  },
  // Relevé : https://www.manomano.es/p/chimenea-elctrica-2000-w-kekai-oregon-127x16x48-cm-con-simulacin-de-fuego-para-pared-negra-42574204
  // Prix observé 406,85 €.
  {
    id: 'elec-oregon',
    slug: {
      fr: 'kekai-oregon-cheminee-electrique-murale-127-cm',
      en: 'kekai-oregon-wall-electric-fireplace-127-cm',
      nl: 'kekai-oregon-elektrische-wandhaard-127-cm',
      es: 'kekai-oregon-chimenea-electrica-pared-127-cm',
    },
    name: 'KEKAI Oregon',
    category: 'electricfire',
    distribution: null,
    price: euros(409.9),
    compareAtPrice: null,
    tagline: L(
      '1,27 m de large pour 16 cm d’épaisseur, et 2 000 W.',
      '1.27 m wide, 16 cm deep, and 2,000 W.',
      '1,27 m breed, 16 cm diep, en 2.000 W.',
      '1,27 m de ancho por 16 cm de grosor, y 2.000 W.',
    ),
    description: L(
      'Le grand format du rayon, et le plus difficile à obtenir autrement : 1,27 m de bandeau lumineux pour seulement 16 cm d’épaisseur, en 2 000 W. Cette largeur-là change la pièce — un foyer de 60 cm se regarde, un foyer de 1,27 m structure un mur. Et comme il ne demande qu’une prise, il s’installe dans un salon où aucun conduit n’existe, ce qu’aucun poêle ne permet.',
      'The large format of the range, and the hardest to get any other way: a 1.27 m band of light just 16 cm deep, at 2,000 W. That width changes the room — a 60 cm hearth is something you look at, a 1.27 m hearth organises a wall. And since it needs nothing but a socket, it goes into a living room with no flue at all, which no stove can do.',
      'Het grote formaat van het assortiment, en het moeilijkst op een andere manier te krijgen: een lichtband van 1,27 m en slechts 16 cm diep, bij 2.000 W. Die breedte verandert de kamer — een haard van 60 cm bekijk je, een haard van 1,27 m organiseert een wand. En omdat hij alleen een stopcontact nodig heeft, past hij in een woonkamer zonder rookkanaal, wat geen enkele kachel kan.',
      'El gran formato de la sección, y el más difícil de conseguir de otro modo: 1,27 m de banda luminosa con solo 16 cm de grosor, a 2.000 W. Ese ancho cambia la habitación — un hogar de 60 cm se mira, un hogar de 1,27 m estructura una pared. Y como solo necesita un enchufe, se instala en un salón sin ningún conducto, algo que ninguna estufa permite.',
    ),
    bullets: {
      fr: [
        '1,27 m de large — le plus grand format du rayon',
        '16 cm d’épaisseur seulement, pose murale',
        '2 000 W sur une prise 230 V',
        'Dimensions 48 × 127 × 16 cm, finition noire',
        'Ni conduit, ni combustible, ni entretien',
      ],
      en: [
        '1.27 m wide — the largest format in the range',
        'Only 16 cm deep, wall-mounted',
        '2,000 W from a 230 V socket',
        'Dimensions 48 × 127 × 16 cm, black finish',
        'No flue, no fuel, no maintenance',
      ],
      nl: [
        '1,27 m breed — het grootste formaat van het assortiment',
        'Slechts 16 cm diep, wandmontage',
        '2.000 W uit een 230 V-stopcontact',
        'Afmetingen 48 × 127 × 16 cm, zwarte afwerking',
        'Geen rookkanaal, geen brandstof, geen onderhoud',
      ],
      es: [
        '1,27 m de ancho — el formato más grande de la sección',
        'Solo 16 cm de grosor, instalación a la pared',
        '2.000 W en un enchufe de 230 V',
        'Dimensiones 48 × 127 × 16 cm, acabado negro',
        'Sin conducto, sin combustible, sin mantenimiento',
      ],
    },
    specs: [
      { label: SPEC.electricPower, value: U('2 000 W') },
      ELECTRIC_SUPPLY,
      { label: SPEC.mounting, value: L(
        'Murale',
        'Wall-mounted',
        'Wandmontage',
        'A la pared',
      ) },
      { label: SPEC.dimensions, value: U('48 × 127 × 16 cm') },
      FLAME_SIMULATED,
      WARRANTY_2Y,
    ],
    tech: null,
    images: [
      placeholderImage(
        'electric-wall-wide',
        L(
          'Cheminée électrique murale noire de 127 cm de large',
          'Black 127 cm wide wall-mounted electric fireplace',
          'Zwarte elektrische wandhaard van 127 cm breed',
          'Chimenea eléctrica de pared negra de 127 cm de ancho',
        ),
      ),
    ],
    variants: [],
    crossSell: ['elec-pzcc-121', 'bio-revello'],
    hero: false,
    dataVerified: false,
    // Poids ESTIMÉ (18.0 kg emballé) — à peser avant la première expédition.
    weightGrams: 18_000,
    freight: false,
    badge: null,
    dispatchDaysMin: 3,
    dispatchDaysMax: 8,
  },
  // Relevé, deux annonces pour le même modèle :
  //   blanc https://www.manomano.es/p/chimenea-electrica-lynea-blanco-100-cm-con-efecto-de-llama-realista-y-calefactor-de-1800-w-vicco-86939488
  //   noir  https://www.manomano.es/p/chimenea-electrica-lynea-negro-100-cm-con-efecto-de-llama-realista-y-calefactor-de-1800-w-vicco-86939569
  // Prix observés 292,99 € et 339,90 €.
  //
  // SEULE FICHE A VARIANTES DU CATALOGUE, et elle ne doit rien a une
  // supposition : la place de marché vend les deux finitions sous deux
  // annonces distinctes, à deux prix distincts. L'écart de 50 € est donc
  // relevé, pas estimé — ce qui est la seule façon honnête de remplir un
  // `priceDelta`.
  {
    id: 'elec-vicco-lynea',
    slug: {
      fr: 'vicco-lynea-cheminee-electrique-100-cm',
      en: 'vicco-lynea-electric-fireplace-100-cm',
      nl: 'vicco-lynea-elektrische-haard-100-cm',
      es: 'vicco-lynea-chimenea-electrica-100-cm',
    },
    name: 'VICCO Lynea',
    category: 'electricfire',
    distribution: null,
    price: euros(299.9),
    compareAtPrice: null,
    tagline: L(
      'Un mètre de large, deux finitions, 1 800 W.',
      'One metre wide, two finishes, 1,800 W.',
      'Een meter breed, twee afwerkingen, 1.800 W.',
      'Un metro de ancho, dos acabados, 1.800 W.',
    ),
    description: L(
      'Le seul modèle du rayon proposé en deux finitions : blanc ou noir, au choix, sur un bandeau de 100 cm. Le blanc s’efface sur un mur clair et laisse la flamme seule visible ; le noir assume le cadre et structure la pièce. Pour le reste, les deux sont identiques — 1 800 W sur une prise ordinaire, effet de flamme réglable indépendamment du chauffage.',
      'The only model in the range offered in two finishes: white or black, your choice, on a 100 cm panel. The white disappears against a light wall and leaves only the flame visible; the black owns the frame and organises the room. Otherwise the two are identical — 1,800 W from an ordinary socket, flame effect adjustable independently of the heat.',
      'Het enige model in het assortiment in twee afwerkingen: wit of zwart, naar keuze, op een paneel van 100 cm. Het witte verdwijnt tegen een lichte wand en laat alleen de vlam zien; het zwarte omarmt het kader en organiseert de kamer. Voor het overige zijn ze identiek — 1.800 W uit een gewoon stopcontact, vlameffect los van de verwarming te regelen.',
      'El único modelo de la sección disponible en dos acabados: blanco o negro, a elegir, sobre una banda de 100 cm. El blanco se borra sobre una pared clara y deja solo la llama visible; el negro asume el marco y estructura la habitación. Por lo demás, los dos son idénticos — 1.800 W en un enchufe normal, efecto de llama ajustable de forma independiente de la calefacción.',
    ),
    bullets: {
      fr: [
        'Deux finitions : blanc ou noir',
        '1 800 W sur une prise 230 V',
        'Bandeau de 100 cm de large',
        'Effet de flamme utilisable sans chauffage',
        'Ni conduit, ni combustible, ni entretien',
      ],
      en: [
        'Two finishes: white or black',
        '1,800 W from a 230 V socket',
        '100 cm wide panel',
        'Flame effect usable with the heater off',
        'No flue, no fuel, no maintenance',
      ],
      nl: [
        'Twee afwerkingen: wit of zwart',
        '1.800 W uit een 230 V-stopcontact',
        'Paneel van 100 cm breed',
        'Vlameffect ook te gebruiken zonder verwarming',
        'Geen rookkanaal, geen brandstof, geen onderhoud',
      ],
      es: [
        'Dos acabados: blanco o negro',
        '1.800 W en un enchufe de 230 V',
        'Banda de 100 cm de ancho',
        'Efecto de llama utilizable sin calefacción',
        'Sin conducto, sin combustible, sin mantenimiento',
      ],
    },
    specs: [
      { label: SPEC.electricPower, value: U('1 800 W') },
      ELECTRIC_SUPPLY,
      { label: SPEC.mounting, value: L('Murale', 'Wall-mounted', 'Wandmontage', 'A la pared') },
      { label: SPEC.dimensions, value: L('Largeur 100 cm', 'Width 100 cm', 'Breedte 100 cm', 'Ancho 100 cm') },
      FLAME_SIMULATED,
      WARRANTY_2Y,
    ],
    tech: null,
    images: [
      placeholderImage(
        'electric-wall',
        L(
          'Cheminée électrique murale VICCO Lynea de 100 cm',
          '100 cm VICCO Lynea wall-mounted electric fireplace',
          'VICCO Lynea elektrische wandhaard van 100 cm',
          'Chimenea eléctrica de pared VICCO Lynea de 100 cm',
        ),
      ),
    ],
    variants: [
      {
        id: 'blanc',
        label: L('Blanc', 'White', 'Wit', 'Blanco'),
        priceDelta: euros(0),
      },
      {
        id: 'noir',
        label: L('Noir', 'Black', 'Zwart', 'Negro'),
        // Écart relevé entre les deux annonces, pas une majoration inventée.
        priceDelta: euros(50),
      },
    ],
    crossSell: ['elec-oregon', 'elec-pzcc-121'],
    hero: false,
    dataVerified: false,
    // Poids ESTIMÉ (15,0 kg emballé) — à peser avant la première expédition.
    weightGrams: 15_000,
    freight: false,
    badge: null,
    dispatchDaysMin: 3,
    dispatchDaysMax: 7,
  },
];

// ──────────────────────────────────────── ACCÈS ────────────────────────────────────────

const byId = new Map(products.map((p) => [p.id, p]));

/**
 * Index slug → produit, par langue. Les slugs sont localisés : une même fiche
 * a quatre URL, et chacune ne doit répondre que dans sa langue pour éviter le
 * contenu dupliqué aux yeux des moteurs de recherche.
 */
const bySlug: Record<Locale, Map<string, Product>> = {
  fr: new Map(products.map((p) => [p.slug.fr, p])),
  en: new Map(products.map((p) => [p.slug.en, p])),
  nl: new Map(products.map((p) => [p.slug.nl, p])),
  es: new Map(products.map((p) => [p.slug.es, p])),
};

export function getProductBySlug(slug: string, locale: Locale): Product | undefined {
  return bySlug[locale].get(slug);
}

export function getProductById(id: string): Product | undefined {
  return byId.get(id);
}

export function getProductsByCategory(category: ProductCategory): readonly Product[] {
  return products.filter((p) => p.category === category);
}

export function getHeroProducts(): readonly Product[] {
  return products.filter((p) => p.hero);
}

/** Poêles uniquement, triés par puissance maximale croissante. */
export function getStoves(): readonly Product[] {
  return products
    .filter((p) => p.tech !== null)
    .slice()
    .sort((a, b) => (a.tech?.powerMaxKw ?? 0) - (b.tech?.powerMaxKw ?? 0));
}

export function getVariant(product: Product, variantId: string | null): Product['variants'][number] | null {
  if (variantId === null) return null;
  return product.variants.find((v) => v.id === variantId) ?? null;
}

/**
 * Prix unitaire effectif TTC pour un couple produit/variante.
 * C'est la SEULE fonction autorisée à déterminer un prix : le serveur la
 * rappelle à la validation du panier pour ne jamais faire confiance au client.
 */
export function unitPrice(product: Product, variantId: string | null): number {
  const variant = getVariant(product, variantId);
  return product.price + (variant?.priceDelta ?? 0);
}

/** Liste des produits référencés par `crossSell`, dans l'ordre et sans trous. */
export function getCrossSell(product: Product): readonly Product[] {
  return product.crossSell.flatMap((id) => {
    const found = byId.get(id);
    return found ? [found] : [];
  });
}

/** Toutes les URL d'une fiche produit, pour les balises `hreflang`. */
export function productSlugs(product: Product): Localized<string> {
  return product.slug;
}
