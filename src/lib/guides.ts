/**
 * Contenu éditorial.
 *
 * Ce n'est pas de la décoration : sur un panier moyen de 2 000 €, le trafic
 * organique est le seul levier qui fasse baisser durablement le coût
 * d'acquisition. Une boutique qui ne vit que de publicité payante voit sa
 * marge entièrement captée par la plateforme publicitaire dès que les
 * enchères montent.
 *
 * Règle de rédaction appliquée ici : aucun chiffre d'économie, aucun
 * pourcentage de rendement attribué à un appareil précis, aucune source
 * inventée. Quand une valeur est un ordre de grandeur, le texte le dit.
 */

import { L, type Locale, type Localized } from './i18n/config';

export interface GuideSection {
  heading: Localized<string>;
  paragraphs: Localized<readonly string[]>;
  list?: Localized<readonly string[]>;
}

export interface Guide {
  id: string;
  slug: Localized<string>;
  title: Localized<string>;
  description: Localized<string>;
  readingMinutes: number;
  /** Date ISO — formatée à l'affichage selon la langue. */
  updated: string;
  intro: Localized<string>;
  sections: readonly GuideSection[];
  relatedProducts: readonly string[];
}

export const guides: readonly Guide[] = [
  {
    id: 'hydro-vs-air',
    slug: {
      fr: 'hydro-ou-air-ventile-comment-choisir',
      en: 'hydro-or-ducted-air-how-to-choose',
      nl: 'hydro-of-ventilatie-hoe-kiezen',
      es: 'hidro-o-aire-ventilado-como-elegir',
    },
    title: L(
      'Hydro ou air ventilé : comment choisir',
      'Hydro or ducted air: how to choose',
      'Hydro of ventilatie: hoe kiezen',
      'Hidro o aire ventilado: cómo elegir',
    ),
    description: L(
      'La première décision, celle qui détermine le budget, les travaux et le résultat. Elle ne dépend presque pas du prix de l’appareil.',
      'The first decision — the one that drives the budget, the work and the result. It barely depends on the price of the appliance.',
      'De eerste beslissing — die het budget, de werken en het resultaat bepaalt. Ze hangt nauwelijks van de prijs van het toestel af.',
      'La primera decisión, la que determina el presupuesto, las obras y el resultado. Apenas depende del precio del aparato.',
    ),
    readingMinutes: 7,
    updated: '2026-10-12',
    intro: L(
      'Les deux familles portent le même nom de « poêle à granulés » et brûlent le même combustible, mais elles ne résolvent pas le même problème. Se tromper de famille coûte beaucoup plus cher que se tromper de modèle.',
      'Both families are called "pellet stove" and burn the same fuel, but they do not solve the same problem. Choosing the wrong family costs far more than choosing the wrong model.',
      'Beide families heten "pelletkachel" en stoken dezelfde brandstof, maar ze lossen niet hetzelfde probleem op. De verkeerde familie kiezen kost veel meer dan het verkeerde model kiezen.',
      'Las dos familias se llaman igual, «estufa de pellets», y queman el mismo combustible, pero no resuelven el mismo problema. Equivocarse de familia cuesta mucho más que equivocarse de modelo.',
    ),
    sections: [
      {
        heading: L(
          'Ce que chaque famille fait réellement',
          'What each family actually does',
          'Wat elke familie werkelijk doet',
          'Lo que hace realmente cada familia',
        ),
        paragraphs: {
          fr: [
            'Un poêle à air ventilé réchauffe l’air de la pièce où il est installé et le souffle en façade. Canalisable, il envoie une partie de cet air chaud par une gaine isolée vers deux pièces voisines ou l’étage. Son installation demande un conduit de fumées étanche et une prise de courant — rien de plus.',
            'Un poêle hydro ne chauffe presque pas la pièce : il chauffe de l’eau, qu’un circulateur intégré envoie dans vos radiateurs ou votre plancher chauffant. Il occupe la place d’un générateur de chaleur, au même titre qu’une chaudière, et il se raccorde au circuit existant. L’installation exige donc en plus un raccordement hydraulique, une protection de sécurité et, le plus souvent, un ballon tampon.',
          ],
          en: [
            'A ducted-air stove warms the air of the room it stands in and blows it out at the front. In its ducted version, it sends part of that warm air through insulated ducting to two adjacent rooms or upstairs. Installation needs a sealed flue and a power socket — nothing more.',
            'A hydro stove barely heats the room: it heats water, which a built-in pump sends into your radiators or underfloor heating. It takes the place of a heat generator, exactly as a boiler does, and connects to the existing circuit. Installation therefore also requires a hydraulic connection, safety protection and, in most cases, a buffer tank.',
          ],
          nl: [
            'Een ventilatiekachel warmt de lucht van de ruimte waarin hij staat op en blaast die aan de voorzijde uit. In de kanaliseerbare versie stuurt hij een deel van die warme lucht via geïsoleerde kanalen naar twee aangrenzende kamers of de verdieping. De installatie vraagt een gasdichte rookgasafvoer en een stopcontact — niets meer.',
            'Een hydrokachel verwarmt de kamer nauwelijks: hij verwarmt water, dat een ingebouwde pomp naar uw radiatoren of vloerverwarming stuurt. Hij neemt de plaats in van een warmtegenerator, net als een ketel, en sluit aan op het bestaande circuit. De installatie vraagt dus bovendien een hydraulische aansluiting, een veiligheidsvoorziening en meestal een buffervat.',
          ],
          es: [
            'Una estufa de aire ventilado calienta el aire de la estancia donde está instalada y lo impulsa por el frontal. En versión canalizable, envía parte de ese aire caliente por un conducto aislado hacia dos habitaciones contiguas o la planta superior. Su instalación necesita un conducto de humos estanco y un enchufe, nada más.',
            'Una estufa hidro apenas calienta la estancia: calienta agua, que una bomba integrada envía a sus radiadores o a su suelo radiante. Ocupa el lugar de un generador de calor, igual que una caldera, y se conecta al circuito existente. La instalación exige por tanto además una conexión hidráulica, una protección de seguridad y, casi siempre, un depósito de inercia.',
          ],
        },
      },
      {
        heading: L(
          'La question qui tranche',
          'The question that settles it',
          'De vraag die beslist',
          'La pregunta que decide',
        ),
        paragraphs: {
          fr: [
            'Avez-vous déjà un circuit de chauffage central — radiateurs à eau ou plancher chauffant — que vous comptez garder ? Si oui, l’hydro mérite d’être étudié, parce qu’il utilise une distribution qui existe déjà et chauffe toute la maison. Si non, l’hydro n’a aucun intérêt : installer un circuit d’eau pour un poêle coûte plus cher que le poêle.',
          ],
          en: [
            'Do you already have a central heating circuit — water radiators or underfloor heating — that you intend to keep? If so, hydro deserves consideration, because it uses distribution that already exists and heats the whole house. If not, hydro makes no sense: installing a water circuit for a stove costs more than the stove.',
          ],
          nl: [
            'Hebt u al een centraal verwarmingscircuit — waterradiatoren of vloerverwarming — dat u wilt houden? Zo ja, dan is hydro het onderzoeken waard, want het gebruikt een distributie die al bestaat en verwarmt het hele huis. Zo nee, dan heeft hydro geen zin: een watercircuit aanleggen voor een kachel kost meer dan de kachel.',
          ],
          es: [
            '¿Ya tiene un circuito de calefacción central —radiadores de agua o suelo radiante— que piensa conservar? Si la respuesta es sí, merece la pena estudiar el hidro, porque aprovecha una distribución que ya existe y calienta toda la casa. Si es no, el hidro no tiene interés: instalar un circuito de agua para una estufa cuesta más que la estufa.',
          ],
        },
        list: {
          fr: [
            'Pas de circuit existant, une pièce de vie à chauffer → air ventilé',
            'Pas de circuit, mais des chambres à desservir → air ventilé canalisable',
            'Circuit existant, chaudière fioul ou gaz à seconder → hydro',
            'Circuit existant, chaudière à remplacer et eau chaude sanitaire → hydro avec ECS',
          ],
          en: [
            'No existing circuit, one living space to heat → ducted air',
            'No circuit, but bedrooms to serve → ducted-air with ducting',
            'Existing circuit, oil or gas boiler to supplement → hydro',
            'Existing circuit, boiler to replace and hot water needed → hydro with DHW',
          ],
          nl: [
            'Geen bestaand circuit, één woonruimte te verwarmen → ventilatie',
            'Geen circuit, maar slaapkamers te bedienen → kanaliseerbare ventilatiekachel',
            'Bestaand circuit, olie- of gasketel aan te vullen → hydro',
            'Bestaand circuit, ketel te vervangen en warm water nodig → hydro met SWW',
          ],
          es: [
            'Sin circuito existente, una sala de estar a calentar → aire ventilado',
            'Sin circuito, pero con dormitorios a servir → aire ventilado canalizable',
            'Circuito existente, caldera de gasóleo o gas a apoyar → hidro',
            'Circuito existente, caldera a sustituir y ACS necesaria → hidro con ACS',
          ],
        },
      },
      {
        heading: L(
          'Les coûts qu’on oublie de compter',
          'The costs people forget to count',
          'De kosten die men vergeet mee te rekenen',
          'Los costes que se olvida contar',
        ),
        paragraphs: {
          fr: [
            'Sur un poêle à air, le poste caché est le conduit : un tubage double paroi en inox sur quatre mètres représente plusieurs centaines d’euros, et la pose davantage. Sur un hydro, il faut y ajouter le raccordement hydraulique et souvent un ballon tampon — comptez une installation sensiblement plus lourde, à faire chiffrer avant de commander l’appareil, pas après.',
            'Dans les deux cas, demandez un devis d’installation AVANT d’acheter le poêle. C’est la seule façon de comparer honnêtement deux familles dont le prix d’appareil ne dit pas le prix du projet.',
          ],
          en: [
            'On an air stove, the hidden item is the flue: four metres of twin-wall stainless lining runs into several hundred euros, and fitting it costs more again. On a hydro stove, add the hydraulic connection and often a buffer tank — expect a substantially heavier installation, and get it quoted before you order the appliance, not after.',
            'In both cases, get an installation quote BEFORE buying the stove. It is the only way to compare two families honestly, when the price of the appliance says nothing about the price of the project.',
          ],
          nl: [
            'Bij een luchtkachel is de verborgen post de afvoer: vier meter dubbelwandige rvs voering kost al enkele honderden euro’s, en de plaatsing nog meer. Bij een hydrokachel komen daar de hydraulische aansluiting en vaak een buffervat bij — reken op een merkbaar zwaardere installatie, en laat die prijzen vóór u het toestel bestelt, niet erna.',
            'Vraag in beide gevallen een installatieprijs VÓÓR u de kachel koopt. Dat is de enige manier om twee families eerlijk te vergelijken, wanneer de prijs van het toestel niets zegt over de prijs van het project.',
          ],
          es: [
            'En una estufa de aire, la partida oculta es el conducto: cuatro metros de entubado inox de doble pared suponen varios cientos de euros, y la instalación más todavía. En una hidro, añada la conexión hidráulica y a menudo un depósito de inercia — cuente con una instalación sensiblemente más pesada, y hágala presupuestar antes de pedir el aparato, no después.',
            'En los dos casos, pida un presupuesto de instalación ANTES de comprar la estufa. Es la única forma de comparar honestamente dos familias cuyo precio de aparato no dice nada del precio del proyecto.',
          ],
        },
      },
    ],
    relatedProducts: ['anna-12', 'vertigo-up', 'vulcano-silenzio-up'],
  },
  {
    id: 'sizing',
    slug: {
      fr: 'bien-dimensionner-la-puissance',
      en: 'getting-the-output-right',
      nl: 'het-juiste-vermogen-bepalen',
      es: 'dimensionar-bien-la-potencia',
    },
    title: L(
      'Bien dimensionner la puissance de son poêle',
      'Getting the output of your stove right',
      'Het juiste vermogen van uw kachel bepalen',
      'Dimensionar bien la potencia de su estufa',
    ),
    description: L(
      'Pourquoi trop de kilowatts est un défaut, et pas une marge de sécurité.',
      'Why too many kilowatts is a fault, not a safety margin.',
      'Waarom te veel kilowatt een fout is en geen veiligheidsmarge.',
      'Por qué demasiados kilovatios son un defecto y no un margen de seguridad.',
    ),
    readingMinutes: 6,
    updated: '2026-10-12',
    intro: L(
      'L’erreur la plus répandue sur cet achat consiste à prendre « un peu plus gros, pour être sûr ». Sur un poêle à granulés, c’est exactement le mauvais réflexe, et il se paie tous les jours de la saison de chauffe.',
      'The most widespread mistake on this purchase is to go "a bit bigger, to be safe". On a pellet stove that is precisely the wrong instinct, and you pay for it every day of the heating season.',
      'De meest gemaakte fout bij deze aankoop is "iets groter nemen, voor de zekerheid". Bij een pelletkachel is dat precies de verkeerde reflex, en u betaalt ervoor elke dag van het stookseizoen.',
      'El error más extendido en esta compra es coger «un poco más grande, por seguridad». En una estufa de pellets es justo el reflejo equivocado, y se paga todos los días de la temporada de calefacción.',
    ),
    sections: [
      {
        heading: L(
          'Pourquoi le surdimensionnement est un défaut',
          'Why oversizing is a fault',
          'Waarom overdimensionering een fout is',
          'Por qué el sobredimensionado es un defecto',
        ),
        paragraphs: {
          fr: [
            'Un poêle à granulés module : il peut descendre à environ un tiers de sa puissance maximale, mais pas en dessous. Si votre besoin réel est de 5 kW et que l’appareil ne sait pas descendre sous 6 kW, il va chauffer trop, s’arrêter, refroidir, puis se rallumer — en boucle. Chaque allumage consomme de l’électricité, encrasse le brasier et fatigue la bougie.',
            'Les effets sont visibles en quelques semaines : vitre qui noircit vite, brasier à décrasser deux fois par semaine, rendement réel bien en dessous du rendement annoncé, et une maison qui oscille entre 19 et 24 °C au lieu de se tenir à 21.',
          ],
          en: [
            'A pellet stove modulates: it can come down to roughly a third of its maximum output, but no lower. If your real demand is 5 kW and the appliance cannot go below 6 kW, it will overheat the room, stop, cool down, then relight — in a loop. Every ignition draws electricity, fouls the burn pot and tires the igniter.',
            'The effects show within weeks: glass blackening quickly, a burn pot to scrape twice a week, real efficiency well below the stated figure, and a house swinging between 19 and 24 °C instead of holding 21.',
          ],
          nl: [
            'Een pelletkachel moduleert: hij kan tot ongeveer een derde van zijn maximale vermogen terugzakken, maar niet lager. Is uw werkelijke behoefte 5 kW en kan het toestel niet onder 6 kW, dan verwarmt het te veel, slaat af, koelt af en ontsteekt opnieuw — in een lus. Elke ontsteking verbruikt stroom, vervuilt de brandkorf en vermoeit het ontstekingselement.',
            'De gevolgen zijn binnen enkele weken zichtbaar: glas dat snel zwart wordt, een brandkorf die twee keer per week moet worden uitgekrabd, een werkelijk rendement dat ver onder het opgegeven cijfer blijft, en een huis dat tussen 19 en 24 °C schommelt in plaats van op 21 te blijven.',
          ],
          es: [
            'Una estufa de pellets modula: puede bajar a aproximadamente un tercio de su potencia máxima, pero no menos. Si su necesidad real es de 5 kW y el aparato no sabe bajar de 6 kW, calentará demasiado, se detendrá, se enfriará y volverá a encenderse, en bucle. Cada encendido consume electricidad, ensucia el cestillo y fatiga la resistencia.',
            'Los efectos se ven en unas semanas: cristal que se ennegrece rápido, cestillo que hay que rascar dos veces por semana, rendimiento real muy por debajo del declarado, y una casa que oscila entre 19 y 24 °C en lugar de mantenerse en 21.',
          ],
        },
      },
      {
        heading: L(
          'La méthode de pré-dimensionnement',
          'The pre-sizing method',
          'De methode voor voorberekening',
          'El método de predimensionado',
        ),
        paragraphs: {
          fr: [
            'On raisonne en volume, pas en surface : multipliez la surface par la hauteur sous plafond. Puis appliquez un coefficient de déperdition qui dépend de l’isolation — de l’ordre de 0,025 kW/m³ pour une construction récente très isolée, jusqu’à environ 0,055 kW/m³ pour une maison d’avant 1975 restée en simple vitrage. Corrigez enfin selon la zone climatique.',
            'Visez un appareil dont la puissance NOMINALE maximale tombe dans la fourchette obtenue, et non largement au-dessus. Notre calculateur applique exactement ce calcul et affiche directement les modèles qui y entrent.',
          ],
          en: [
            'Work in volume, not floor area: multiply the area by the ceiling height. Then apply a heat-loss coefficient that depends on insulation — in the order of 0.025 kW/m³ for a recent, well-insulated build, up to roughly 0.055 kW/m³ for a pre-1975 house still on single glazing. Finally, correct for the climate zone.',
            'Aim for an appliance whose maximum NOMINAL output falls inside the resulting range, not well above it. Our calculator applies exactly this calculation and shows the models that fit.',
          ],
          nl: [
            'Reken in volume, niet in oppervlakte: vermenigvuldig de oppervlakte met de plafondhoogte. Pas dan een warmteverliescoëfficiënt toe die van de isolatie afhangt — in de orde van 0,025 kW/m³ voor een recente, goed geïsoleerde bouw, tot ongeveer 0,055 kW/m³ voor een woning van vóór 1975 met nog enkel glas. Corrigeer tot slot voor de klimaatzone.',
            'Mik op een toestel waarvan het maximale NOMINALE vermogen binnen het verkregen bereik valt, en niet ruim erboven. Onze calculator past precies deze berekening toe en toont meteen de modellen die erin passen.',
          ],
          es: [
            'Se razona en volumen, no en superficie: multiplique la superficie por la altura de techo. Después aplique un coeficiente de pérdidas que depende del aislamiento — del orden de 0,025 kW/m³ para una construcción reciente bien aislada, hasta unos 0,055 kW/m³ para una casa anterior a 1975 con vidrio simple. Corrija por último según la zona climática.',
            'Busque un aparato cuya potencia NOMINAL máxima caiga dentro del rango obtenido, y no muy por encima. Nuestra calculadora aplica exactamente este cálculo y muestra directamente los modelos que entran en él.',
          ],
        },
      },
      {
        heading: L(
          'Les limites de ce calcul',
          'The limits of this calculation',
          'De grenzen van deze berekening',
          'Los límites de este cálculo',
        ),
        paragraphs: {
          fr: [
            'Ce calcul ne voit pas les ponts thermiques, l’orientation, la surface vitrée, le renouvellement d’air ni votre température de confort. Il donne un cadre, pas un verdict. Pour un poêle à air en appoint dans un salon, c’est suffisant. Pour remplacer un générateur principal, et pour tout poêle hydro, faites valider le résultat par l’installateur qui engagera sa responsabilité.',
          ],
          en: [
            'This calculation does not see thermal bridges, orientation, glazed area, air renewal or your comfort temperature. It gives you a frame, not a verdict. For an air stove supplementing a living room, that is enough. To replace a main heat source, and for any hydro stove, have the result validated by the installer whose professional liability will cover it.',
          ],
          nl: [
            'Deze berekening ziet geen koudebruggen, oriëntatie, glasoppervlak, luchtverversing of uw comforttemperatuur. Ze geeft een kader, geen vonnis. Voor een luchtkachel als bijverwarming in een woonkamer volstaat dat. Om een hoofdwarmtebron te vervangen, en bij elke hydrokachel, laat het resultaat valideren door de installateur die er verantwoordelijk voor zal zijn.',
          ],
          es: [
            'Este cálculo no ve los puentes térmicos, la orientación, la superficie acristalada, la renovación de aire ni su temperatura de confort. Da un marco, no un veredicto. Para una estufa de aire de apoyo en un salón, basta. Para sustituir un generador principal, y en cualquier estufa hidro, haga validar el resultado por el instalador que responderá de él.',
          ],
        },
      },
    ],
    relatedProducts: ['anna-12', 'vertigo-up', 'vulcano-silenzio-up'],
  },
  {
    id: 'savings',
    slug: {
      fr: 'calculer-ses-economies-sans-se-raconter-dhistoires',
      en: 'working-out-your-savings-honestly',
      nl: 'uw-besparing-eerlijk-berekenen',
      es: 'calcular-su-ahorro-sin-enganarse',
    },
    title: L(
      'Calculer ses économies sans se raconter d’histoires',
      'Working out your savings honestly',
      'Uw besparing eerlijk berekenen',
      'Calcular su ahorro sin engañarse',
    ),
    description: L(
      'La méthode en quatre étapes, avec vos chiffres et pas les nôtres.',
      'The four-step method, using your figures and not ours.',
      'De methode in vier stappen, met uw cijfers en niet de onze.',
      'El método en cuatro pasos, con sus cifras y no las nuestras.',
    ),
    readingMinutes: 5,
    updated: '2026-10-12',
    intro: L(
      'Vous trouverez partout des pourcentages d’économie. Aucun n’est vérifiable, parce que le résultat dépend de trois variables qui vous sont propres et dont une bouge beaucoup. Voici le calcul à faire vous-même.',
      'You will find savings percentages everywhere. None of them is verifiable, because the result depends on three variables that are specific to you — and one of them moves a great deal. Here is the calculation to do yourself.',
      'U vindt overal besparingspercentages. Geen enkel is controleerbaar, want het resultaat hangt af van drie variabelen die eigen zijn aan u — en één ervan beweegt sterk. Hier is de berekening die u zelf moet maken.',
      'Encontrará porcentajes de ahorro por todas partes. Ninguno es verificable, porque el resultado depende de tres variables que son suyas y una de ellas se mueve mucho. Aquí está el cálculo que debe hacer usted mismo.',
    ),
    sections: [
      {
        heading: L('Les quatre étapes', 'The four steps', 'De vier stappen', 'Los cuatro pasos'),
        paragraphs: {
          fr: [
            'Tout le calcul tient sur une feuille. Il demande une facture d’énergie annuelle et le prix du granulé près de chez vous — pas une estimation trouvée en ligne, le prix réellement pratiqué par votre revendeur.',
          ],
          en: [
            'The whole calculation fits on one sheet. It needs an annual energy bill and the price of pellets near you — not an estimate found online, the price your actual local supplier charges.',
          ],
          nl: [
            'De hele berekening past op één blad. Ze vraagt een jaarlijkse energiefactuur en de pelletprijs bij u in de buurt — geen online schatting, maar de prijs die uw eigen verkoper werkelijk vraagt.',
          ],
          es: [
            'Todo el cálculo cabe en una hoja. Requiere una factura anual de energía y el precio del pellet cerca de su casa — no una estimación encontrada en internet, sino el precio que practica realmente su distribuidor.',
          ],
        },
        list: {
          fr: [
            'Relevez votre consommation annuelle de chauffage en kWh (sur vos factures, chauffage seul si possible).',
            'Divisez-la par le rendement de votre appareil actuel pour obtenir le besoin réel de la maison : une vieille chaudière à 75 % transforme 10 000 kWh achetés en 7 500 kWh utiles.',
            'Convertissez ce besoin en granulés : un kilo de granulés de qualité libère environ 4,8 kWh, et un poêle à 90 % en restitue donc à peu près 4,3 kWh utiles.',
            'Multipliez par le prix réel du sac chez votre revendeur, puis comparez à votre facture actuelle — sans oublier d’ajouter l’électricité consommée par le poêle et l’entretien annuel obligatoire.',
          ],
          en: [
            'Take your annual heating consumption in kWh (from your bills, heating only if possible).',
            'Divide it by the efficiency of your current appliance to get the house’s real demand: an old boiler at 75 % turns 10,000 kWh bought into 7,500 kWh useful.',
            'Convert that demand into pellets: one kilo of quality pellets releases roughly 4.8 kWh, so a stove at 90 % returns about 4.3 kWh useful.',
            'Multiply by the real price of a bag at your supplier, then compare with your current bill — remembering to add the electricity the stove uses and the mandatory annual service.',
          ],
          nl: [
            'Neem uw jaarlijkse verwarmingsverbruik in kWh (van uw facturen, zo mogelijk enkel verwarming).',
            'Deel het door het rendement van uw huidige toestel om de werkelijke behoefte van de woning te krijgen: een oude ketel op 75 % maakt van 10 000 gekochte kWh 7 500 nuttige kWh.',
            'Zet die behoefte om in pellets: één kilo kwaliteitspellets geeft ongeveer 4,8 kWh, en een kachel op 90 % levert dus zo’n 4,3 nuttige kWh.',
            'Vermenigvuldig met de werkelijke zakprijs bij uw verkoper en vergelijk met uw huidige factuur — en vergeet niet de stroom die de kachel verbruikt en het verplichte jaarlijkse onderhoud erbij te tellen.',
          ],
          es: [
            'Tome su consumo anual de calefacción en kWh (de sus facturas, solo calefacción si es posible).',
            'Divídalo por el rendimiento de su aparato actual para obtener la necesidad real de la vivienda: una caldera antigua al 75 % convierte 10 000 kWh comprados en 7 500 kWh útiles.',
            'Convierta esa necesidad en pellets: un kilo de pellet de calidad libera unos 4,8 kWh, y una estufa al 90 % devuelve por tanto unos 4,3 kWh útiles.',
            'Multiplique por el precio real del saco en su distribuidor y compare con su factura actual — sin olvidar añadir la electricidad que consume la estufa y el mantenimiento anual obligatorio.',
          ],
        },
      },
      {
        heading: L(
          'Les postes que les comparatifs oublient',
          'The items comparisons leave out',
          'De posten die vergelijkingen weglaten',
          'Las partidas que olvidan las comparativas',
        ),
        paragraphs: {
          fr: [
            'Trois postes manquent presque toujours. Le premier est l’électricité : un poêle à granulés consomme en marche, et davantage à chaque allumage. Le deuxième est l’entretien annuel par un professionnel, obligatoire en France et exigé par la plupart des assureurs. Le troisième est l’amortissement : si l’appareil et sa pose représentent plusieurs milliers d’euros, divisez ce montant par la durée de vie que vous visez et ajoutez-le à votre coût annuel.',
            'Le prix du granulé, enfin, est la variable qui rend tout pourcentage fragile : il a connu des variations fortes d’une saison à l’autre. Refaites le calcul avec un prix bas et un prix haut, et regardez si la décision tient dans les deux cas.',
          ],
          en: [
            'Three items are almost always missing. The first is electricity: a pellet stove draws power while running, and more at each ignition. The second is the annual professional service, mandatory in France and required by most insurers. The third is depreciation: if the appliance and its installation come to several thousand euros, divide that by the service life you are aiming for and add it to your annual cost.',
            'Finally, the pellet price is the variable that makes any percentage fragile: it has moved sharply from one season to another. Redo the calculation with a low price and a high price, and see whether the decision holds in both cases.',
          ],
          nl: [
            'Drie posten ontbreken bijna altijd. De eerste is elektriciteit: een pelletkachel verbruikt stroom tijdens het bedrijf, en meer bij elke ontsteking. De tweede is het jaarlijkse onderhoud door een vakman, in Frankrijk verplicht en door de meeste verzekeraars geëist. De derde is de afschrijving: kosten het toestel en de plaatsing enkele duizenden euro’s, deel dat dan door de levensduur die u beoogt en tel het bij uw jaarkosten op.',
            'De pelletprijs is tot slot de variabele die elk percentage fragiel maakt: hij is van seizoen tot seizoen sterk geschommeld. Maak de berekening opnieuw met een lage en een hoge prijs, en kijk of de beslissing in beide gevallen overeind blijft.',
          ],
          es: [
            'Tres partidas faltan casi siempre. La primera es la electricidad: una estufa de pellets consume en marcha, y más en cada encendido. La segunda es el mantenimiento anual por un profesional, obligatorio en Francia y exigido por la mayoría de las aseguradoras. La tercera es la amortización: si el aparato y su instalación suponen varios miles de euros, divida esa cantidad por la vida útil que busca y súmela a su coste anual.',
            'El precio del pellet, por último, es la variable que vuelve frágil cualquier porcentaje: ha tenido variaciones fuertes de una temporada a otra. Repita el cálculo con un precio bajo y uno alto, y vea si la decisión se sostiene en ambos casos.',
          ],
        },
      },
    ],
    relatedProducts: ['anna-12', 'vulcano-silenzio-up'],
  },
];

const byId = new Map(guides.map((g) => [g.id, g]));

const bySlug: Record<Locale, Map<string, Guide>> = {
  fr: new Map(guides.map((g) => [g.slug.fr, g])),
  en: new Map(guides.map((g) => [g.slug.en, g])),
  nl: new Map(guides.map((g) => [g.slug.nl, g])),
  es: new Map(guides.map((g) => [g.slug.es, g])),
};

export function getGuideBySlug(slug: string, locale: Locale): Guide | undefined {
  return bySlug[locale].get(slug);
}

export function getGuideById(id: string): Guide | undefined {
  return byId.get(id);
}
