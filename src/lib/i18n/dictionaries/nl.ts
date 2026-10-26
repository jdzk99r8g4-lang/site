/** Dictionnaire néerlandais. Typé par le contrat français : une clé manquante ne compile pas. */

import type { Dictionary } from './fr';

const nl: Dictionary = {
  meta: {
    homeTitle: 'Hydro- en ventilatiekachels op pellets — verzonden vanuit de EU',
    homeDescription:
      'Hydro- en ventilatiekachels op pellets, vóór aankoop berekend. Levering op afspraak in Frankrijk en Europa, veilig betalen.',
    shopTitle: 'Verwarming',
    shopDescription:
      'Ventilatie- en hydro-pelletkachels van 6 tot 24 kW. Vermogen, rendement en verwarmd oppervlak op elke pagina.',
  },

  nav: {
    home: 'Home',
    shop: 'Verwarming',
    sizing: 'Welk vermogen?',
    guides: 'Gidsen',
    about: 'Over ons',
    contact: 'Contact',
    faq: 'Veelgestelde vragen',
    cart: 'Winkelwagen',
    openMenu: 'Menu openen',
    closeMenu: 'Menu sluiten',
    skipToContent: 'Naar de inhoud',
    changeLanguage: 'Taal wijzigen',
  },

  common: {
    addToCart: 'In winkelwagen',
    added: '{count} in uw winkelwagen',
    addedCapped: 'Slechts {added} toegevoegd: het maximum is {max} per artikel.',
    atMaxQuantity: 'Maximum bereikt: {max} per artikel.',
    increaseQuantity: 'Aantal verhogen',
    decreaseQuantity: 'Aantal verlagen',
    viewCart: 'Winkelwagen bekijken',
    continueShopping: 'Verder winkelen',
    from: 'Vanaf',
    vatIncluded: 'incl. btw',
    vatIncludedLong: 'Btw inbegrepen, levering niet',
    shippingExtra: 'Levering apart gerekend',
    learnMore: 'Meer informatie',
    viewProduct: 'Details bekijken',
    quantity: 'Aantal',
    remove: 'Verwijderen',
    subtotal: 'Subtotaal',
    shipping: 'Levering',
    total: 'Totaal',
    of: 'van',
    save: 'Bespaar',
    loading: 'Laden…',
    required: 'Verplicht veld',
    email: 'E-mailadres',
    send: 'Verzenden',
    close: 'Sluiten',
    back: 'Terug',
    upTo: 'Tot',
    seeAll: 'Alles bekijken',
    specifications: 'Specificaties',
    description: 'Beschrijving',
    delivery: 'Levering',
    inStock: 'Op voorraad',
    dispatchedIn: 'Verzonden binnen',
    businessDays: 'werkdagen',
    page: 'Pagina',
    products: 'producten',
    product: 'product',
    results: 'resultaten',
    soon: 'Binnenkort',
    sectionEmpty:
      'Deze sectie wordt gevuld. De eerste modellen verschijnen zodra de leveranciersbladen binnen zijn.',
    noResults: 'Geen product past bij deze criteria.',
    resetFilters: 'Wissen',
    illustrationNotice:
      'Illustratie — de foto van dit model wordt gepubliceerd zodra de beelden van de leverancier binnen zijn.',
    demoBanner:
      'Catalogus in opbouw: pagina’s waarvan de gegevens nog niet zijn geverifieerd, melden dit bovenaan. Vul ze aan met leveranciersgegevens vóór u verkoopt.',
  },

  categories: {
    pellet: 'Pelletkachels',
    pelletShort: 'Pellets',
    pelletTagline: 'Automatisch en programmeerbaar, dagenlang zelfstandig.',
    bioethanol: 'Bio-ethanolhaarden',
    bioethanolShort: 'Bio-ethanol',
    bioethanolTagline: 'Een echte vlam zonder rookkanaal en zonder rook. Een decoratief object, geen manier om een huis te verwarmen.',
    electricfire: 'Elektrische haarden',
    electricfireShort: 'Elektrisch',
    electricfireTagline: 'De aanblik van een haard uit een stopcontact, plus 1 tot 2 kW bijverwarming.',
  },

  distributions: {
    all: 'Alle',
    air: 'Ventilatie',
    airTagline: 'Verwarmt de kamer waarin hij staat, en aangrenzende kamers als hij gekanaliseerd is.',
    hydro: 'Hydro',
    hydroTagline: 'Voedt radiatoren en vloerverwarming, net als een ketel.',
    airChooseIf: 'Kies ventilatie als',
    airReasons: [
      'u een woonruimte wilt verwarmen, eventueel twee slaapkamers via kanalen',
      'u geen centraal verwarmingscircuit hebt, of het ongewijzigd laat',
      'u een eenvoudige installatie wilt: één rookgasafvoer, één stopcontact',
    ],
    hydroChooseIf: 'Kies hydro als',
    hydroReasons: [
      'u al radiatoren of vloerverwarming hebt liggen',
      'u een olie- of gasketel wilt vervangen of aanvullen',
      'u een hydraulische aansluiting door een vakman aanvaardt',
    ],
  },

  home: {
    heroEyebrow: 'Pellets, hout, ketels, warmtepompen',
    heroTitle: 'Het juiste toestel begint bij het juiste vermogen.',
    heroLead:
      'Een te zwaar toestel draait stationair, vervuilt en laat u de ramen openzetten. Een te licht toestel draait voluit en houdt het huis niet warm. We beginnen dus bij de berekening, en pas daarna bij het toestel.',
    heroCtaPrimary: 'Mijn vermogen berekenen',
    heroCtaSecondary: 'Alle verwarming bekijken',
    heroStatOne: '6 tot 24 kW',
    heroStatOneLabel: 'tien verwarmingsafdelingen',
    heroStatTwo: 'tot 92 %',
    heroStatTwoLabel: 'opgegeven rendement',
    heroStatThree: '4 tot 8 dagen',
    heroStatThreeLabel: 'levering op afspraak',

    familiesTitle: 'Acht families toestellen',
    familiesLead:
      'Elk past bij een andere installatie en een ander budget. Begin bij wat u wilt plaatsen.',

    featuredTitle: 'De meest gevraagde modellen',
    featuredLead: 'Vier toestellen die de meeste situaties dekken.',

    sizingTitle: 'Hoeveel kilowatt voor uw woning?',
    sizingLead:
      'Oppervlakte, plafondhoogte, isolatie, klimaatzone: vier gegevens zijn genoeg om het vermogen af te bakenen. De berekening duurt minder dan een minuut en voorkomt de duurste fout van deze aankoop.',
    sizingCta: 'Calculator openen',

    whyTitle: 'Wat wij anders doen',
    whyItems: [
      {
        title: 'Berekening vóór de verkoop',
        text: 'De calculator is vrij toegankelijk en het resultaat kan u net zo goed naar een goedkoper model leiden. Dat is de bedoeling: een verkeerd gedimensioneerd toestel komt terug, en een retour van 200 kg kost meer dan de marge.',
      },
      {
        title: 'Leveringsvoorwaarden zwart op wit',
        text: 'Vrachtwagen met laadlift, levering naast de wagen, tijdvak telefonisch afgesproken. U weet vóór u betaalt dat er twee personen nodig zijn om het toestel binnen te krijgen — of u neemt de optie plaatsing binnen.',
      },
      {
        title: 'Geen beloftes met cijfers over besparingen',
        text: 'Uw besparing hangt af van uw huidige verbruik, van wat u nu voor energie betaalt en van de pelletprijs, die per seizoen schommelt. Wij geven de rekenmethode, geen verzonnen percentage.',
      },
      {
        title: 'De plaatsing blijft bij de vakman',
        text: 'Wij verkopen het toestel en de afvoer, niet de installatie. De aansluiting bepaalt of uw verzekering uitkeert en, in Frankrijk, of u recht hebt op premies: ze moet door een erkend installateur gebeuren.',
      },
    ],

    processTitle: 'Hoe een bestelling verloopt',
    processSteps: [
      { title: 'U berekent het vermogen', text: 'De calculator geeft een bereik in kW en de modellen die erin passen.' },
      { title: 'U bestelt online', text: 'U betaalt per overschrijving, met de gegevens en de mededeling die u bij uw bestelling krijgt. Er worden nooit kaartgegevens gevraagd.' },
      { title: 'De vervoerder belt u', text: 'Binnen 2 tot 4 werkdagen, om een leveringstijdvak af te spreken.' },
      { title: 'U laat het toestel plaatsen', text: 'Door een erkend installateur. Wij leveren de technische fiche en het aansluitschema.' },
    ],

    guidesTitle: 'Lezen vóór u kiest',
    guidesLead: 'Drie teksten die de meest terugkerende vragen beantwoorden.',

    supportTitle: 'Twijfel over het model of de afvoer?',
    supportLead:
      'Stuur ons de indeling van de ruimte, de oppervlakte, de plafondhoogte en het bouwjaar. Wij antwoorden schriftelijk, binnen één werkdag.',
    supportCta: 'Een vraag stellen',
  },

  shop: {
    title: 'Alle verwarming',
    lead: 'Twaalf modellen, van 6 tot 24 kW. De opgegeven kenmerken komen uit de technische fiches van de leverancier.',
    filterCategory: 'Familie',
    filterAll: 'Alle',
    filterPower: 'Vermogen',
    filterArea: 'Te verwarmen oppervlak',
    sortBy: 'Sorteren op',
    sortPowerAsc: 'Vermogen, laag naar hoog',
    sortPowerDesc: 'Vermogen, hoog naar laag',
    sortPriceAsc: 'Prijs, laag naar hoog',
    sortPriceDesc: 'Prijs, hoog naar laag',
    anyPower: 'Alle vermogens',
    anyArea: 'Alle oppervlakken',
  },

  product: {
    backToShop: 'Terug naar de kachels',
    chooseVariant: 'Afwerking',
    keyPoints: 'Het wezenlijke',
    techSheet: 'Technische gegevens',
    deliveryTitle: 'Levering en ontvangst',
    deliveryFreight:
      'Verzonden op pallet. De vervoerder belt om een tijdvak af te spreken. Levering gebeurt naast de wagen: zorg voor twee personen, of kies bij het afrekenen de optie plaatsing binnen.',
    deliveryParcel: 'Verzonden als gevolgd pakket, persoonlijk overhandigd of naar een afhaalpunt.',
    installTitle: 'Installatie',
    installText:
      'De plaatsing en de aansluiting op de rookgasafvoer moeten door een erkend vakman gebeuren. Wij leveren de technische fiche, het aansluitschema en de prestatieverklaring.',
    unverifiedNotice:
      'Demonstratiegegevens: de waarden op deze pagina zijn fictief en moeten worden vervangen door de documentatie van de fabrikant.',
    crossSellTitle: 'Vaak samen besteld',
    powerRange: 'Modulerend vermogen',
    heatedArea: 'Verwarmd oppervlak',
    waterPower: 'waarvan naar water',
    efficiency: 'Rendement',
    energyClass: 'Klasse',
    sizingHint: 'Controleer of dit vermogen past',
    compareTitle: 'Vergelijken met nabije modellen',
    ductedOutlets: 'Kanaalaansluitingen',
    dhwYes: 'Sanitair warm water inbegrepen',
  },

  sizing: {
    title: 'Vermogenscalculator',
    lead:
      'Vier vragen voor een bruikbaar vermogensbereik. Dit is een voorberekening, geen warmteverliesberekening.',
    areaLabel: 'Te verwarmen oppervlak',
    areaUnit: 'm²',
    heightLabel: 'Plafondhoogte',
    heightUnit: 'm',
    insulationLabel: 'Isolatie',
    insulationPoor: 'Zwak — vóór 1975, enkel glas, zolder niet geïsoleerd',
    insulationAverage: 'Gemiddeld — gedeeltelijke isolatie, dubbel glas',
    insulationGood: 'Goed — na 2005 of volledig gerenoveerd',
    insulationExcellent: 'Zeer goed — lage-energie- of passiefstandaard',
    climateLabel: 'Klimaatzone',
    climateMild: 'Mild — Atlantische kust, Middellandse Zeegebied',
    climateTemperate: 'Gematigd — laagland, de grote meerderheid van de gevallen',
    climateCold: 'Koud — bergstreek, continentaal oosten',
    resultTitle: 'Te beogen vermogen',
    resultRange: 'Aanbevolen bereik',
    resultExplain:
      'Kies een toestel waarvan het maximale NOMINALE vermogen binnen dit bereik valt. Een kachel waarvan het maximum de behoefte ruim overtreft, staat voortdurend op minimum, wat het glas en de brandkorf vervuilt.',
    resultModels: 'Modellen die binnen dit bereik vallen',
    resultNone: 'Geen enkel model in het aanbod dekt deze behoefte. Schrijf ons: boven 24 kW hebt u een pelletketel nodig in plaats van een kachel.',
    methodTitle: 'De gebruikte methode',
    methodText:
      'Het te verwarmen volume wordt vermenigvuldigd met een warmteverliescoëfficiënt die van de isolatie afhangt, en daarna gecorrigeerd voor de klimaatzone. De gebruikte coëfficiënten (0,025 tot 0,055 kW per m³) stemmen overeen met de grootteordes die gangbaar zijn voor een voorberekening.',
    disclaimerTitle: 'Wat deze berekening niet vervangt',
    disclaimerText:
      'Een warmteverliesberekening houdt rekening met koudebruggen, oriëntatie, luchtverversing, glasoppervlak en de gewenste comforttemperatuur. Vervangt u een hoofdwarmtebron, en bij elke hydrokachel, laat het resultaat dan door uw installateur nakijken vóór u bestelt: hij draagt de verantwoordelijkheid voor de dimensionering.',
    volumeComputed: 'Geschat volume',
    recompute: 'Opnieuw berekenen',
  },

  cart: {
    title: 'Uw winkelwagen',
    empty: 'Uw winkelwagen is leeg.',
    emptyCta: 'Kachels bekijken',
    lineTotal: 'Regeltotaal',
    countryLabel: 'Land van levering',
    rateLabel: 'Leveringswijze',
    freeShippingProgress: 'Nog {amount} voor gratis levering',
    freeShippingReached: 'Gratis levering voor deze bestelling',
    checkout: 'Bestellen',
    checkoutPending: 'Vastleggen…',
    vatLine: 'waarvan btw',
    estimatedDelivery: 'Geschatte levering',
    canceled: 'Betaling onderbroken. Uw winkelwagen is bewaard.',
    error: 'De betaling kon niet worden geopend. Probeer het straks opnieuw.',
    securedBy: 'Betaling per overschrijving. Op deze site worden geen kaartgegevens gevraagd.',
    freightNotice:
      'Uw winkelwagen bevat een toestel dat op pallet wordt verzonden: levering gebeurt op afspraak, naast de wagen.',
  },

  checkout: {
    title: 'Uw bestelling',
    lead: 'Controleer uw winkelwagen, laat uw gegevens achter en betaal per overschrijving.',

    detailsTitle: 'Uw gegevens',
    detailsLead:
      'Ze dienen voor de levering en om u op de hoogte te houden. Een toestel gaat op pallet: de vervoerder belt voordat hij komt.',
    firstName: 'Voornaam',
    lastName: 'Achternaam',
    email: 'E-mailadres',
    phone: 'Telefoon',
    phoneHint: 'Noodzakelijk: de vervoerder belt om een tijdslot af te spreken.',
    addressTitle: 'Leveringsadres',
    line1: 'Adres',
    line2: 'Extra regel (gebouw, verdieping, deurcode)',
    postalCode: 'Postcode',
    city: 'Plaats',
    shippingTitle: 'Leveringswijze',

    transferTitle: 'Over de overschrijving',
    transferLead:
      'Komt de overschrijving van een rekening op een andere naam, geef dat hier aan: zonder die vermelding kunnen wij uw betaling niet aan uw bestelling koppelen.',
    transferHolder: 'Rekeninghouder die overschrijft',
    transferHolderHint: 'Alleen invullen als u dat niet zelf bent.',

    summaryTitle: 'Overzicht',
    submit: 'Mijn bestelling plaatsen',
    submitPending: 'Vastleggen…',
    submitNote:
      'Er wordt niets afgeschreven: u voert de overschrijving zelf uit vanaf uw bank. Uw bestelling gaat in voorbereiding zodra ze binnen is.',
    error: 'De bestelling kon niet worden vastgelegd. Probeer het zo meteen opnieuw.',

    bankRefLater: 'Uw bestelnummer verschijnt in de volgende stap: dat is wat u als mededeling bij de overschrijving zet.',
    bankMissing:
      'De bankgegevens zijn op deze site nog niet ingesteld: bestellen is tijdelijk niet mogelijk.',

    declareCta: 'Ik heb de overschrijving gedaan',
    declarePending: 'Vastleggen…',
    declareDone: 'Dank u. We controleren onze rekening en schrijven u zodra het bedrag zichtbaar is — doorgaans binnen één werkdag.',
    declareHint: 'Klik zodra u de overschrijving bij uw bank hebt verstuurd. Zo weten wij wanneer we de rekening moeten bekijken.',
    declareError: 'Uw melding kon niet worden vastgelegd. Probeer het zo meteen opnieuw.',
    declaredOn: 'Overschrijving gemeld op',
    placedEyebrow: 'Bestelling vastgelegd',
    placedTitle: 'Alleen de overschrijving nog',
    placedLead:
      'Uw bestelling wacht op betaling. Ze gaat in voorbereiding zodra de overschrijving op onze rekening staat, doorgaans binnen één werkdag.',
    placedEmail: 'Een overzicht met deze gegevens is zojuist verstuurd naar {email}.',
    printCta: 'Afdrukken of bewaren',

    reference: 'Bestelnummer',
    nextStepsTitle: 'Wat er nu gebeurt',
    nextSteps: [
      'U voert de overschrijving uit vanaf uw bank, met vermelding van uw bestelnummer.',
      'Wij bevestigen de ontvangst en geven uw bestelling door aan de leverancier.',
      'U krijgt het trackingnummer zodra de vervoerder het pakket ophaalt.',
      'Controleer op de dag zelf de pallet voordat u tekent: schade moet op de vrachtbrief worden genoteerd.',
    ],
    damageTitle: 'Belangrijk bij ontvangst',
    damageText:
      'Een toestel van 200 kg kan tijdens het transport beschadigd raken. Pak het indien mogelijk uit in het bijzijn van de chauffeur, en noteer bij schade een nauwkeurige, handgeschreven opmerking op de vrachtbrief. Zonder schriftelijke opmerking wordt een claim tegen de vervoerder erg moeilijk.',
    trackCta: 'Mijn bestelling volgen',
  },

  tracking: {
    title: 'Mijn bestelling volgen',
    lead: 'Voer uw bestelreferentie in en het e-mailadres dat bij de betaling is gebruikt.',
    refLabel: 'Bestelreferentie',
    refPlaceholder: 'PEL-XXXXXX',
    submit: 'Mijn bestelling tonen',
    notFound: 'Geen bestelling past bij deze gegevens.',
    statusLabel: 'Status',
    placedOn: 'Besteld op',
    itemsLabel: 'Artikelen',
    carrierLabel: 'Vervoerder',
    trackingNumber: 'Volgnummer',
    statuses: {
      awaiting_transfer: 'Wacht op uw overschrijving',
      confirmed: 'Overschrijving ontvangen — bestelling wordt voorbereid',
      shipped: 'Onderweg',
      delivered: 'Geleverd',
      cancelled: 'Geannuleerd',
    },
  },

  guides: {
    title: 'Gidsen',
    lead: 'Wat u moet begrijpen vóór u een pelletkachel kiest, geschreven zonder commerciële kortsluiting.',
    readingTime: 'min leestijd',
    updated: 'Bijgewerkt op',
    relatedProducts: 'Betrokken modellen',
    backToGuides: 'Alle gidsen',
  },

  about: {
    title: 'Over ons',
    lead: 'Een winkel voor verwarming op hout, pellets en stroom.',
    body: [
      'Pellora dekt acht families toestellen — pellet- en houtkachels, fornuizen, ketels, inbouwhaarden, warmtepompen, rookkanalen en accessoires — plus twee afdelingen sierhaarden, bio-ethanol en elektrisch, die wij ook zo presenteren: ze verwarmen geen huis. Elke pagina is opgesteld aan de hand van de documentatie van de fabrikant, en draagt een zichtbare vermelding zolang dat niet zo is. Een catalogus van driehonderd toestellen dwingt u leveranciersbladen over te nemen zonder ze te lezen; wij weten liever wat we verkopen, en kunnen zeggen wanneer een model niet past.',
      'Wij werken met dropshipping: de toestellen vertrekken uit de Europese opslagplaatsen van onze leveranciers, zonder tussenvoorraad. Het voordeel voor u is de prijs, want er is geen showroom te financieren. Het nadeel is dat wij u het toestel niet vóór de aankoop kunnen laten zien — wij compenseren dat met volledige technische fiches en een herroepingsrecht van 14 dagen dat volledig geldt.',
      'Wat wij niet doen: de installatie, het jaarlijkse onderhoud en herstellingen. Dat zijn gereglementeerde beroepen die plaatselijke aanwezigheid vragen. Wij leveren het toestel, zijn documentatie en zijn afvoer; uw installateur doet de rest, en dat is beter voor uw verzekering én uw garantie.',
    ],
    valuesTitle: 'Onze drie regels',
    values: [
      { title: 'Geen cijfer dat wij niet kunnen onderbouwen', text: 'De vermelde kenmerken komen uit de technische fiches van de leverancier. Geven wij een grootteorde, dan zeggen wij dat.' },
      { title: 'Geen valse urgentie', text: 'Geen aftelklokken, geen willekeurig gegenereerde "nog 2 op voorraad". Echte voorraadcijfers komen van de leverancier.' },
      { title: 'Niet verkopen tegen het belang van de klant', text: 'Zegt de calculator 8 kW, dan verkopen wij u geen 15 kW. Een te groot toestel komt terug.' },
    ],
  },

  contact: {
    title: 'Contact',
    lead: 'Voor een vraag over dimensionering: geef de oppervlakte, de plafondhoogte, het bouwjaar en de bestaande verwarming. Dan is het eerste antwoord al bruikbaar.',
    emailLabel: 'E-mail',
    phoneLabel: 'Telefoon',
    hoursLabel: 'Openingstijden',
    hoursValue: 'Maandag tot vrijdag, 9 – 18 uur (CET)',
    responseLabel: 'Antwoordtijd',
    responseValue: 'Eén werkdag',
    formTitle: 'Een bericht schrijven',
    nameLabel: 'Naam',
    messageLabel: 'Bericht',
    messagePlaceholder: 'Oppervlakte, plafondhoogte, bouwjaar, huidige verwarming…',
    submit: 'Bericht verzenden',
    sent: 'Bericht verzonden. Wij antwoorden binnen één werkdag.',
    failed: 'Verzenden mislukt. Mail ons rechtstreeks.',
    mailtoHint: 'Het formulier opent uw e-mailprogramma met het bericht al ingevuld.',
  },

  faq: {
    title: 'Veelgestelde vragen',
    lead: 'De terugkerende vragen, met antwoorden die de lastige punten niet ontwijken.',
    items: [
      {
        q: 'Wat is het praktische verschil tussen een hydrokachel en een ventilatiekachel?',
        a: 'Een luchtkachel verwarmt de lucht van de ruimte waarin hij staat, en kan er een deel van naar twee aangrenzende kamers sturen als hij gekanaliseerd is. Een hydrokachel verwarmt water, dat hij naar uw radiatoren of vloerverwarming stuurt: hij vervangt of vult een ketel aan. De eerste vraagt een rookgasafvoer en een stopcontact; de tweede vraagt daarnaast een hydraulische aansluiting door een vakman.',
      },
      {
        q: 'Kunnen jullie de kachel plaatsen?',
        a: 'Nee. Wij verkopen het toestel, zijn documentatie en zijn afvoer. Installatie is een gereglementeerd beroep dat plaatselijke aanwezigheid vraagt, en de aansluiting bepaalt of uw woonverzekering uitkeert. Doe een beroep op een erkend installateur in uw buurt — in Frankrijk is een RGE-kwalificatie bovendien vereist voor de meeste overheidspremies.',
      },
      {
        q: 'Hoeveel ga ik besparen tegenover mijn huidige verwarming?',
        a: 'Wij geven geen cijfer, omdat een eerlijk cijfer niet bestaat zonder uw werkelijke verbruik, wat u nu voor energie betaalt en de pelletprijs in uw streek te kennen. Die drie bewegen, de laatste sterk. De methode staat in onze gidsen: neem uw jaarverbruik in kWh, deel door het rendement van uw huidige toestel, zet om in kilo pellets, en vermenigvuldig met de zakprijs bij u in de buurt.',
      },
      {
        q: 'Wat is de leveringstermijn?',
        a: 'Reken op 2 tot 5 werkdagen verzending afhankelijk van het model, daarna 4 tot 8 werkdagen transport in Frankrijk, iets langer elders in Europa. Het exacte cijfer staat op elke productpagina. De vervoerder belt u om een tijdvak af te spreken — een pallet kan niet worden achtergelaten zonder dat er iemand is.',
      },
      {
        q: 'Wat als het toestel beschadigd aankomt?',
        a: 'U noteert een nauwkeurig voorbehoud op de leveringsbon, in aanwezigheid van de chauffeur, en mailt ons binnen 48 uur met foto’s. Wij nemen de claim bij de vervoerder over. Zonder schriftelijk voorbehoud bij de levering wordt de claim zeer moeilijk: daarom dringen wij hier zo op aan.',
      },
      {
        q: 'Kan ik een kachel terugsturen die mij niet past?',
        a: 'Ja, binnen 14 dagen na ontvangst, op grond van het herroepingsrecht (richtlijn 2011/83/EU). Het toestel mag niet geplaatst zijn en moet in zijn oorspronkelijke verpakking zitten. De retourkosten zijn voor u en zijn bij een palletzending hoog — daarom controleren wij de dimensionering liever vóór de bestelling dan erna.',
      },
      {
        q: 'Werkt de kachel tijdens een stroomonderbreking?',
        a: 'Nee. De vijzel, de ontsteker en de rookgasventilator werken op elektriciteit: zonder stroom stopt het toestel en slaat de beveiliging aan. Zijn onderbrekingen bij u frequent, voorzie dan een UPS die op de rookgasventilator is gedimensioneerd, of houd een warmtebron aan die niet van het net afhangt.',
      },
      {
        q: 'Hoeveel pellets moet ik per seizoen voorzien?',
        a: 'De gangbare grootteorde is 1 tot 2 ton per seizoen voor een woning van 100 tot 150 m², maar het verschil tussen die twee cijfers is enorm en hangt af van uw isolatie, uw ingestelde temperatuur en de strengheid van de winter. Begin met één ton en stel in het tweede seizoen bij met uw eigen metingen.',
      },
    ],
  },

  shippingPage: {
    title: 'Levering',
    lead: 'De werkelijke voorwaarden, ook die welke enige organisatie van uw kant vragen.',
    zonesTitle: 'Zones en tarieven',
    zoneHeader: 'Zone',
    countriesHeader: 'Landen',
    freightHeader: 'Pallet (toestellen)',
    parcelHeader: 'Pakket (accessoires)',
    freeHeader: 'Gratis levering vanaf',
    delayHeader: 'Transporttijd',
    freightTitle: 'Hoe een palletlevering verloopt',
    freightSteps: [
      'De leverancier verzendt het toestel op een gewikkelde pallet uit zijn Europese opslagplaats.',
      'De vervoerder belt het nummer dat u bij de bestelling opgaf, om een tijdvak af te spreken.',
      'De vrachtwagen komt met een laadlift. Levering gebeurt naast de wagen, op een toegankelijke en stabiele ondergrond.',
      'U controleert de staat van de pallet en ondertekent — met schriftelijk voorbehoud bij de minste stoot.',
      'U brengt het toestel binnen: zorg voor twee personen en een steekwagen, of kies de optie plaatsing binnen.',
    ],
    accessTitle: 'Controleer de toegang vóór u bestelt',
    accessText:
      'Een vrachtwagen voor palletvervoer is 10 tot 12 m lang. Is uw straat smal, steil, een voetgangerszone of met tonnagebeperking, meld dat dan bij de bestelling: de vervoerder regelt een levering met een kleiner voertuig, wat gewoonlijk twee tot drie dagen bijkomt.',
    indoorTitle: 'Optie plaatsing binnen',
    indoorText:
      'Voor € 119 zet het leveringsteam het toestel in de kamer van uw keuze op de begane grond, op voorwaarde dat de doorgang begaanbaar is. Uitpakken, aansluiten en het meenemen van uw oude toestel zijn niet inbegrepen.',
  },

  returns: {
    title: 'Retourneren en herroeping',
    lead: 'Uw rechten, en de beperkingen die eigen zijn aan een toestel van 200 kg.',
    rightTitle: 'Herroepingsrecht: 14 dagen',
    rightText:
      'U hebt veertien dagen vanaf de ontvangst om van uw aankoop af te zien, zonder opgave van reden (richtlijn 2011/83/EU). Meld het ons schriftelijk binnen die termijn en stuur het toestel binnen de volgende veertien dagen terug.',
    conditionsTitle: 'Te respecteren voorwaarden',
    conditions: [
      'Het toestel mag niet geplaatst, aangesloten of gestookt zijn.',
      'Het moet terug in de oorspronkelijke verpakking zitten, op zijn pallet, met alle accessoires en documentatie.',
      'De retourkosten zijn voor u. Bij een palletzending reken op € 90 tot € 180 afhankelijk van de zone: wij geven u de exacte prijs vóór de ophaling.',
      'De terugbetaling volgt binnen veertien dagen na ontvangst en controle van het toestel, via het oorspronkelijke betaalmiddel.',
    ],
    damagedTitle: 'Toestel beschadigd tijdens het transport',
    damagedText:
      'Noteer een nauwkeurig, handgeschreven voorbehoud op de leveringsbon, in aanwezigheid van de chauffeur — "doos beschadigd" is niet genoeg, beschrijf de schade. Stuur ons daarna binnen 48 uur foto’s van de verpakking en het toestel. Wij behandelen de claim en sturen u kosteloos een vervangend toestel.',
    warrantyTitle: 'Wettelijke garantie',
    warrantyText:
      'Alle toestellen genieten de wettelijke conformiteitsgarantie van twee jaar (EU-richtlijn 2019/771), waar het Franse recht de garantie tegen verborgen gebreken aan toevoegt. Een gebrek dat in die termijn opduikt, wordt geacht bij de levering te hebben bestaan: de bewijslast ligt niet bij u.',
    exclusionsTitle: 'Wat de garantie niet dekt',
    exclusions: [
      'Slijtdelen: deurdichtingen, glas, brandkorf, ontstekingselement.',
      'Schade door niet-conforme brandstof — niet-gecertificeerde of vochtige pellets, of een andere diameter dan 6 mm.',
      'Gebreken na een niet-conforme installatie of een overgeslagen jaarlijks onderhoud.',
    ],
  },

  legalPage: {
    title: 'Juridische informatie',
    editorTitle: 'Uitgever van de site',
    entity: 'Maatschappelijke benaming',
    form: 'Rechtsvorm',
    capital: 'Maatschappelijk kapitaal',
    registration: 'Inschrijving',
    vat: 'Btw-nummer',
    address: 'Maatschappelijke zetel',
    director: 'Verantwoordelijke uitgever',
    contactTitle: 'Contact',
    hostTitle: 'Hostingprovider',
    mediationTitle: 'Consumentenbemiddeling',
    mediationText:
      'Overeenkomstig artikel L.612-1 van het Franse consumentenwetboek kunt u kosteloos een beroep doen op de hieronder vermelde consumentenombudsman, bij een geschil dat onze klantendienst niet heeft opgelost.',
    ipTitle: 'Intellectuele eigendom',
    ipText:
      'De teksten op deze site zijn eigendom van de uitgever. Merken, handelsnamen en beelden van fabrikanten blijven eigendom van hun respectieve houders en worden gebruikt in het kader van de doorverkoop van hun producten.',
    toComplete: 'Aan te vullen vóór de commerciële ingebruikname.',
  },

  terms: {
    title: 'Algemene verkoopvoorwaarden',
    lead: 'Versie van toepassing op bestellingen via deze site.',
    toComplete:
      'Dit document is een werkmodel. Laat het door een jurist nakijken vóór uw eerste verkoop: de verplichte vermeldingen verschillen per land van levering, en een onrechtmatig beding wordt geacht niet te zijn geschreven.',
    sections: [
      {
        heading: '1. Voorwerp en toepassingsgebied',
        body: 'Deze voorwaarden regelen de verkoop van verwarmingstoestellen op houtpellets en hun accessoires door de uitgever van de site, aan consumenten die wonen in een van de leveringslanden vermeld op de pagina Levering. Elke bestelling houdt de onvoorwaardelijke aanvaarding ervan in.',
      },
      {
        heading: '2. Producten',
        body: 'De wezenlijke kenmerken van de producten staan op elke productpagina. Ze nemen de door de fabrikant verstrekte gegevens over. Illustratieve beelden hebben geen contractuele waarde waar ze als zodanig zijn aangeduid. De producten voldoen aan de eisen van de EU-verordeningen 2015/1185 en 2015/1186 en aan de norm EN 14785.',
      },
      {
        heading: '3. Prijzen',
        body: 'De prijzen zijn vermeld in euro, alle belastingen inbegrepen, exclusief leveringskosten. De leveringskosten worden vóór de bevestiging van de bestelling weergegeven en hangen af van de bestemmingszone en de aard van de zending. De verkoper mag zijn prijzen op elk moment wijzigen; de toepasselijke prijs is die welke geldt op het moment van de bestelling.',
      },
      {
        heading: '4. Bestelling en betaling',
        body: 'De bestelling is vast zodra de overschrijving op de rekening van de verkoper staat. De betaling gebeurt uitsluitend per overschrijving, op de gegevens die de klant bij de bestelling krijgt en per e-mail worden herhaald. Er worden door de verkoper geen kaartgegevens verzameld. Is de overschrijving na tien werkdagen niet ontvangen, dan wordt de bestelling van rechtswege geannuleerd en wordt de klant daarvan op de hoogte gebracht. De verkoper mag een bestelling weigeren bij een eerder geschil, een vermoeden van fraude, of een leveringsadres buiten de bediende zone.',
      },
      {
        heading: '5. Levering',
        body: 'De toestellen worden op pallet geleverd, door een vervoerder, na telefonische afspraak. De levering gebeurt naast de wagen, tenzij de optie plaatsing binnen is genomen. De vermelde termijnen zijn schattingen in werkdagen, gerekend vanaf de bevestiging van de betaling. Het risico gaat over bij de werkelijke overhandiging van het goed.',
      },
      {
        heading: '6. Voorbehoud bij ontvangst',
        body: 'De koper moet de staat van de verpakking en het product in aanwezigheid van de vervoerder nakijken en elke schade vastleggen met een nauwkeurig, handgeschreven voorbehoud op de leveringsbon. De koper licht de verkoper binnen 48 uur in, met foto’s. Zonder voorbehoud wordt een claim tegen de vervoerder praktisch onmogelijk.',
      },
      {
        heading: '7. Herroepingsrecht',
        body: 'De consument beschikt over veertien dagen vanaf de ontvangst om het herroepingsrecht uit te oefenen, zonder opgave van reden. Het product moet ongeplaatst en ongebruikt worden teruggestuurd, in de oorspronkelijke verpakking. De retourkosten zijn ten laste van de koper. De terugbetaling volgt binnen veertien dagen na het terugkrijgen van het goed.',
      },
      {
        heading: '8. Garanties',
        body: 'Alle producten genieten de wettelijke conformiteitsgarantie van twee jaar en, naar Frans recht, de garantie tegen verborgen gebreken. Een eventuele commerciële garantie van de fabrikant komt daarbij en vervangt die niet. Slijtdelen en schade door een niet-conforme installatie, niet-gecertificeerde brandstof of gebrek aan onderhoud zijn uitgesloten.',
      },
      {
        heading: '9. Installatie',
        body: 'De verkoop omvat noch de installatie, noch de aansluiting, noch de ingebruikname. Dat zijn zaken voor een erkend vakman en zij moeten voldoen aan de regelgeving die geldt op de plaats van installatie. De verkoper kan niet aansprakelijk worden gesteld voor de gevolgen van een niet-conforme installatie.',
      },
      {
        heading: '10. Persoonsgegevens',
        body: 'De verzamelde gegevens worden verwerkt overeenkomstig EU-verordening 2016/679. Details over de verwerkingen, de bewaartermijnen en de rechten van de betrokkene staan in het privacybeleid.',
      },
      {
        heading: '11. Toepasselijk recht en geschillen',
        body: 'De overeenkomst is onderworpen aan het Franse recht, zonder de consument de bescherming te ontnemen die de dwingende bepalingen van het recht van zijn woonland hem toekennen. Bij een geschil wordt eerst een minnelijke oplossing gezocht; de consument kan kosteloos een beroep doen op de consumentenombudsman.',
      },
    ],
  },

  privacy: {
    title: 'Privacybeleid',
    lead: 'Welke gegevens, waarom, hoe lang, en hoe u ze laat verwijderen.',
    controllerTitle: 'Verwerkingsverantwoordelijke',
    dataTitle: 'Verzamelde gegevens en doeleinden',
    dataRows: [
      { data: 'Naam, adres, telefoon', purpose: 'Uitvoering van de bestelling en levering', basis: 'Uitvoering van de overeenkomst', retention: '10 jaar (boekhoudplicht)' },
      { data: 'E-mailadres', purpose: 'Orderbevestiging, opvolging, klantendienst', basis: 'Uitvoering van de overeenkomst', retention: '3 jaar na het laatste contact' },
      { data: 'Details van de bestelling', purpose: 'Facturatie, garantie, naverkoopdienst', basis: 'Wettelijke verplichting', retention: '10 jaar' },
      { data: 'IP-adres, technische logs', purpose: 'Beveiliging van de site, fraudepreventie', basis: 'Gerechtvaardigd belang', retention: '12 maanden' },
    ],
    dataHeaders: { data: 'Gegeven', purpose: 'Doeleinde', basis: 'Rechtsgrond', retention: 'Bewaartermijn' },
    paymentTitle: 'Betaling',
    paymentText:
      'De betaling gebeurt per overschrijving, van uw bank naar die van de verkoper. Op deze site worden geen kaartgegevens ingevoerd en er komt geen betaaldienstverlener aan te pas: de gegevens van uw overschrijving worden verwerkt door uw bank en die van de verkoper, volgens hun eigen beleid. De verkoper bewaart de naam van de rekeninghouder die overschrijft, als u die opgeeft, uitsluitend om uw betaling aan uw bestelling te koppelen.',
    cookiesTitle: 'Cookies',
    cookiesText:
      'Deze site gebruikt geen advertentie- of analysecookies. Alleen de lokale opslag van de browser wordt gebruikt, om uw winkelwagen tussen bezoeken te bewaren: die gegevens blijven op uw toestel en worden niet naar ons verzonden. Daarvoor is dus geen toestemming nodig.',
    rightsTitle: 'Uw rechten',
    rightsText:
      'U hebt recht op inzage, rectificatie, verwijdering, beperking, bezwaar en overdraagbaarheid. Schrijf naar het contactadres hieronder: wij antwoorden binnen één maand. U kunt ook klacht neerleggen bij de gegevensbeschermingsautoriteit van uw woonland.',
    transferTitle: 'Doorgifte buiten de EU',
    transferText:
      'De gegevens worden in de Europese Unie gehost. Sommige technische subverwerkers kunnen vanuit de Verenigde Staten werken, onder de standaardcontractbepalingen van de Europese Commissie.',
  },

  footer: {
    tagline: 'Hydro- en ventilatiekachels op pellets, vóór aankoop berekend.',
    shopTitle: 'Winkel',
    helpTitle: 'Hulp',
    legalTitle: 'Juridisch',
    languageTitle: 'Taal',
    rights: 'Alle rechten voorbehouden.',
    vatNote: 'Vermelde prijzen zijn inclusief Franse btw van 20 %. Levering apart gerekend.',
    paymentNote: 'Betaling per overschrijving',
  },

  notFound: {
    title: 'Pagina niet gevonden',
    lead: 'Dit adres hoort bij geen enkele pagina. Mogelijk is het hernoemd, of is het product uit het aanbod gehaald.',
    cta: 'Terug naar de startpagina',
    shopCta: 'Kachels bekijken',
  },

  errors: {
    genericTitle: 'Er is iets misgegaan',
    genericLead: 'De fout is gelogd. Probeer het opnieuw, of schrijf ons als het blijft duren.',
    retry: 'Opnieuw proberen',
  },
  emails: {
    transferSubject: 'Bestelling {ref} — gegevens voor de overschrijving',
    transferTitle: 'Uw bestelling is geregistreerd',
    transferLead:
      'Ze gaat in voorbereiding zodra uw overschrijving op onze rekening staat. U krijgt op dat moment een tweede bericht.',
    transferHow: 'Uit te voeren overschrijving',
    transferRefNotice:
      'Vermeld beslist {ref} als mededeling bij de overschrijving: daarmee koppelen wij uw betaling aan uw bestelling. Zonder die vermelding gebeurt de koppeling handmatig en duurt ze enkele dagen.',
    transferFooter:
      'Een SEPA-overschrijving komt doorgaans binnen één werkdag aan. Hoort u na drie werkdagen niets van ons, schrijf ons dan: er is waarschijnlijk iets misgegaan.',
    bankAmount: 'Bedrag',
    bankReference: 'Mededeling',
    bankHolder: 'Begunstigde',
    bankIban: 'IBAN',
    bankBic: 'BIC',
    bankName: 'Bank',
    confirmSubject: 'Bestelling {ref} bevestigd',
    confirmTitle: 'Bestelling bevestigd',
    confirmLead: 'Bedankt. Uw betaling is geregistreerd en uw bestelling wordt voorbereid.',
    reference: 'Referentie',
    trackCta: 'Mijn bestelling volgen',
    confirmFooter:
      'De vervoerder belt u om een leveringstijdvak af te spreken. Controleer bij ontvangst de staat van de pallet vóór u ondertekent: elke schade moet schriftelijk op de leveringsbon worden vermeld.',
    shippedSubject: 'Bestelling {ref} verzonden',
    shippedTitle: 'Uw bestelling is onderweg',
    shippedLead: 'Bestelling {ref} verzonden door {carrier}.',
    trackingNumber: 'Volgnummer',
    trackParcelCta: 'De levering volgen',
    shippedFooter:
      'Het volgen kan bij de vervoerder enkele uren op zich laten wachten. Beweegt er na 48 u niets, antwoord dan op dit bericht.',
    subtotal: 'Subtotaal',
    total: 'Totaal',
    vatLine: 'waarvan btw',
    free: 'Gratis',
    defaultCarrier: 'De vervoerder',
    footerNote: 'U ontvangt dit bericht omdat u een bestelling hebt geplaatst op {domain}.',
  },

  api: {
    notConfigured: 'Betalen is op deze winkel nog niet geconfigureerd.',
    unreadableBody: 'Onleesbaar verzoek.',
    invalidCart: 'Ongeldige winkelwagen.',
    unknownCountry: 'Wij leveren nog niet in "{country}".',
    noCheckoutUrl: 'De betaaldienst heeft geen betaaladres teruggegeven.',
    checkoutFailed: 'De betaling kon niet worden geopend. Probeer het straks opnieuw.',
    lookupMissingFields: 'Geef de bestelreferentie en het gebruikte e-mailadres op.',
    declareNotPending: 'Deze bestelling wacht niet langer op een overschrijving.',
    lookupNotFound: 'Geen bestelling past bij deze gegevens.',
  },

};

export default nl;
