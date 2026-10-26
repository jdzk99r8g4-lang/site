/** Dictionnaire anglais. Typé par le contrat français : une clé manquante ne compile pas. */

import type { Dictionary } from './fr';

const en: Dictionary = {
  meta: {
    homeTitle: 'Hydro and ducted-air pellet stoves — shipped from the EU',
    homeDescription:
      'Hydro and ducted-air pellet stoves, sized before you buy. Delivery by appointment across France and Europe, secure payment.',
    shopTitle: 'Heating',
    shopDescription:
      'Ducted-air and hydro pellet stoves from 6 to 24 kW. Output, efficiency and heated area on every page.',
  },

  nav: {
    home: 'Home',
    shop: 'Heating',
    sizing: 'What output?',
    guides: 'Guides',
    about: 'About',
    contact: 'Contact',
    faq: 'FAQ',
    cart: 'Cart',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    skipToContent: 'Skip to content',
    changeLanguage: 'Change language',
  },

  common: {
    addToCart: 'Add to cart',
    added: '{count} in your basket',
    addedCapped: 'Only {added} added: the maximum is {max} per item.',
    atMaxQuantity: 'Maximum reached: {max} per item.',
    increaseQuantity: 'Increase quantity',
    decreaseQuantity: 'Decrease quantity',
    viewCart: 'View cart',
    continueShopping: 'Continue shopping',
    from: 'From',
    vatIncluded: 'incl. VAT',
    vatIncludedLong: 'VAT included, delivery excluded',
    shippingExtra: 'Delivery charged separately',
    learnMore: 'Learn more',
    viewProduct: 'View details',
    quantity: 'Quantity',
    remove: 'Remove',
    subtotal: 'Subtotal',
    shipping: 'Delivery',
    total: 'Total',
    of: 'of',
    save: 'Save',
    loading: 'Loading…',
    required: 'Required field',
    email: 'Email address',
    send: 'Send',
    close: 'Close',
    back: 'Back',
    upTo: 'Up to',
    seeAll: 'See all',
    specifications: 'Specifications',
    description: 'Description',
    delivery: 'Delivery',
    inStock: 'In stock',
    dispatchedIn: 'Dispatched in',
    businessDays: 'business days',
    page: 'Page',
    products: 'products',
    product: 'product',
    results: 'results',
    soon: 'Coming soon',
    sectionEmpty:
      'This section is being filled. The first models go up as soon as the supplier sheets arrive.',
    noResults: 'No product matches these criteria.',
    resetFilters: 'Reset',
    illustrationNotice:
      'Illustration — the photograph of this model will be published as soon as the supplier’s images arrive.',
    demoBanner:
      'Catalogue still being built: pages whose specifications have not yet been verified say so at the top. Complete them with supplier data before selling.',
  },

  categories: {
    pellet: 'Pellet stoves',
    pelletShort: 'Pellet',
    pelletTagline: 'Automatic and programmable, running unattended for days.',
    bioethanol: 'Bioethanol fireplaces',
    bioethanolShort: 'Bioethanol',
    bioethanolTagline: 'A real flame with no flue and no smoke. A decorative object, not a way to heat a house.',
    electricfire: 'Electric fireplaces',
    electricfireShort: 'Electric',
    electricfireTagline: 'The look of a hearth from a wall socket, plus 1 to 2 kW of supplementary heat.',
  },

  distributions: {
    all: 'All',
    air: 'Ducted air',
    airTagline: 'Heats the room it stands in, and neighbouring rooms when ducted.',
    hydro: 'Hydro',
    hydroTagline: 'Feeds radiators and underfloor heating, like a boiler.',
    airChooseIf: 'Choose ducted air if',
    airReasons: [
      'you want to heat a living space, possibly two bedrooms through ducting',
      'you have no central heating circuit, or you are keeping it as it is',
      'you want a simple installation: one flue, one power socket',
    ],
    hydroChooseIf: 'Choose hydro if',
    hydroReasons: [
      'you already have radiators or underfloor heating in place',
      'you want to replace or supplement an oil or gas boiler',
      'you accept a hydraulic connection made by a professional',
    ],
  },

  home: {
    heroEyebrow: 'Pellet, wood, boilers, heat pumps',
    heroTitle: 'The right appliance starts with the right output.',
    heroLead:
      'An oversized appliance idles, clogs up and leaves you opening the windows. An undersized one runs flat out and never holds the house. So we start with the calculation, then the appliance.',
    heroCtaPrimary: 'Calculate my output',
    heroCtaSecondary: 'See all heating',
    heroStatOne: '6 to 24 kW',
    heroStatOneLabel: 'ten heating sections',
    heroStatTwo: 'up to 92 %',
    heroStatTwoLabel: 'stated efficiency',
    heroStatThree: '4 to 8 days',
    heroStatThreeLabel: 'delivery by appointment',

    familiesTitle: 'Eight families of appliance',
    familiesLead:
      'Each suits a different installation and budget. Start from what you want to fit.',

    featuredTitle: 'The models most often asked for',
    featuredLead: 'Four appliances that cover the majority of situations.',

    sizingTitle: 'How many kilowatts for your home?',
    sizingLead:
      'Floor area, ceiling height, insulation, climate zone: four figures are enough to frame the output. The calculation takes under a minute and avoids the most expensive mistake in this purchase.',
    sizingCta: 'Open the calculator',

    whyTitle: 'What we do differently',
    whyItems: [
      {
        title: 'Sizing before the sale',
        text: 'The calculator is freely available and its result may well point you to a cheaper model. That is the intention: a badly sized appliance comes back as a return, and a return on 200 kg costs more than the margin.',
      },
      {
        title: 'Delivery conditions in writing',
        text: 'Tail-lift truck, kerbside drop-off, slot agreed by phone. You know before you pay that it will take two people to move the appliance inside — or you take the indoor positioning option.',
      },
      {
        title: 'No quantified savings promises',
        text: 'Your savings depend on your current consumption, on what you pay for energy today and on the price of pellets, which moves from season to season. We give you the method, not an invented percentage.',
      },
      {
        title: 'Installation stays with the professional',
        text: 'We sell the appliance and the flue, not the installation. The connection determines whether your insurance responds and, in France, whether you qualify for public grants: it must be done by a qualified installer.',
      },
    ],

    processTitle: 'How an order works',
    processSteps: [
      { title: 'You calculate the output', text: 'The calculator returns a range in kW and the models that fall inside it.' },
      { title: 'You order online', text: 'You pay by bank transfer, using the details and reference given with your order. No card details are ever requested.' },
      { title: 'The carrier calls you', text: 'Within 2 to 4 business days, to agree a delivery slot.' },
      { title: 'You have it installed', text: 'By a qualified installer. We supply the data sheet and the connection diagram.' },
    ],

    guidesTitle: 'Worth reading before you choose',
    guidesLead: 'Three pieces answering the questions that come up most often.',

    supportTitle: 'Unsure about the model or the flue?',
    supportLead:
      'Send us the room layout, the floor area, the ceiling height and the year the building was built. We answer in writing, within one business day.',
    supportCta: 'Ask a question',
  },

  shop: {
    title: 'All heating',
    lead: 'Twelve models, from 6 to 24 kW. Stated characteristics are those of the supplier data sheets.',
    filterCategory: 'Family',
    filterAll: 'All',
    filterPower: 'Output',
    filterArea: 'Area to heat',
    sortBy: 'Sort by',
    sortPowerAsc: 'Output, low to high',
    sortPowerDesc: 'Output, high to low',
    sortPriceAsc: 'Price, low to high',
    sortPriceDesc: 'Price, high to low',
    anyPower: 'Any output',
    anyArea: 'Any area',
  },

  product: {
    backToShop: 'Back to the stoves',
    chooseVariant: 'Finish',
    keyPoints: 'The essentials',
    techSheet: 'Technical data',
    deliveryTitle: 'Delivery and receipt',
    deliveryFreight:
      'Shipped on a pallet. The carrier calls to agree a slot. Drop-off is at the kerbside: plan for two people, or choose the indoor positioning option at checkout.',
    deliveryParcel: 'Sent as a tracked parcel, handed over or left at a pickup point.',
    installTitle: 'Installation',
    installText:
      'Installation and the flue connection must be carried out by a qualified professional. We supply the data sheet, the connection diagram and the declaration of performance.',
    unverifiedNotice:
      'Demonstration specifications: the values on this page are fictional and must be replaced with the manufacturer’s documentation.',
    crossSellTitle: 'Often ordered together',
    powerRange: 'Modulating output',
    heatedArea: 'Heated area',
    waterPower: 'of which to water',
    efficiency: 'Efficiency',
    energyClass: 'Class',
    sizingHint: 'Check that this output suits you',
    compareTitle: 'Compare with nearby models',
    ductedOutlets: 'Ducted outlets',
    dhwYes: 'Domestic hot water included',
  },

  sizing: {
    title: 'Output calculator',
    lead:
      'Four questions to get a usable output range. This is a pre-sizing estimate, not a thermal survey.',
    areaLabel: 'Area to heat',
    areaUnit: 'm²',
    heightLabel: 'Ceiling height',
    heightUnit: 'm',
    insulationLabel: 'Insulation',
    insulationPoor: 'Poor — pre-1975, single glazing, uninsulated loft',
    insulationAverage: 'Average — partial insulation, double glazing',
    insulationGood: 'Good — post-2005 or fully renovated',
    insulationExcellent: 'Very good — low-energy or passive standard',
    climateLabel: 'Climate zone',
    climateMild: 'Mild — Atlantic coast, Mediterranean belt',
    climateTemperate: 'Temperate — lowland, the great majority of cases',
    climateCold: 'Cold — mountain, continental east',
    resultTitle: 'Output to aim for',
    resultRange: 'Recommended range',
    resultExplain:
      'Choose an appliance whose maximum NOMINAL output falls inside this range. A stove whose maximum far exceeds the need will spend its life at minimum, which fouls the glass and the burn pot.',
    resultModels: 'Models that fall inside this range',
    resultNone: 'No model in the catalogue covers this demand. Write to us: above 24 kW you need a pellet boiler rather than a stove.',
    methodTitle: 'The method used',
    methodText:
      'The volume to be heated is multiplied by a heat-loss coefficient that depends on insulation, then corrected for the climate zone. The coefficients used (0.025 to 0.055 kW per m³) match the orders of magnitude commonly applied for pre-sizing.',
    disclaimerTitle: 'What this calculation does not replace',
    disclaimerText:
      'A thermal survey accounts for thermal bridges, orientation, air renewal, glazed area and the target comfort temperature. If you are replacing a main heat source, and for any hydro stove, have the result checked by your installer before ordering: it is their professional liability that covers the sizing.',
    volumeComputed: 'Estimated volume',
    recompute: 'Recalculate',
  },

  cart: {
    title: 'Your cart',
    empty: 'Your cart is empty.',
    emptyCta: 'Browse the stoves',
    lineTotal: 'Line total',
    countryLabel: 'Delivery country',
    rateLabel: 'Delivery method',
    freeShippingProgress: '{amount} more for free delivery',
    freeShippingReached: 'Free delivery on this order',
    checkout: 'Place order',
    checkoutPending: 'Recording…',
    vatLine: 'of which VAT',
    estimatedDelivery: 'Estimated delivery',
    canceled: 'Payment interrupted. Your cart has been kept.',
    error: 'Payment could not be opened. Please try again in a moment.',
    securedBy: 'Payment by bank transfer. No card details are requested on this site.',
    freightNotice:
      'Your cart contains an appliance shipped on a pallet: delivery is by appointment, at the kerbside.',
  },

  checkout: {
    title: 'Your order',
    lead: 'Check your basket, leave us your details, then pay by bank transfer.',

    detailsTitle: 'Your details',
    detailsLead:
      'They are used for delivery and to keep you informed. An appliance ships on a pallet: the carrier calls before coming out.',
    firstName: 'First name',
    lastName: 'Last name',
    email: 'E-mail address',
    phone: 'Phone',
    phoneHint: 'Required: the carrier calls to agree a delivery slot.',
    addressTitle: 'Delivery address',
    line1: 'Address',
    line2: 'Extra line (building, floor, door code)',
    postalCode: 'Postcode',
    city: 'Town',
    shippingTitle: 'Delivery method',

    transferTitle: 'About the transfer',
    transferLead:
      'If the transfer comes from an account in another name, tell us here: without it we cannot match your payment to your order.',
    transferHolder: 'Sending account holder',
    transferHolderHint: 'Only fill this in if it is not you.',

    summaryTitle: 'Summary',
    submit: 'Place my order',
    submitPending: 'Recording…',
    submitNote:
      'Nothing is debited: you make the transfer yourself, from your bank. Your order goes into preparation as soon as it arrives.',
    error: 'The order could not be recorded. Try again in a moment.',

    bankRefLater: 'Your order reference appears at the next step: that is what goes in the transfer reference.',
    bankMissing:
      'Bank details are not configured on this site yet: ordering is temporarily unavailable.',

    declareCta: 'I have made the transfer',
    declarePending: 'Recording…',
    declareDone: 'Thank you. We are checking our account and will write as soon as it shows — usually within one working day.',
    declareHint: 'Click once you have sent the transfer from your bank. It tells us when to look at the account.',
    declareError: 'Your confirmation could not be recorded. Try again in a moment.',
    declaredOn: 'Transfer declared on',
    placedEyebrow: 'Order recorded',
    placedTitle: 'All that is left is the transfer',
    placedLead:
      'Your order is awaiting payment. It goes into preparation as soon as the transfer reaches our account, usually within one working day.',
    placedEmail: 'A summary with these details has just been sent to {email}.',
    printCta: 'Print or save',

    reference: 'Order reference',
    nextStepsTitle: 'What happens now',
    nextSteps: [
      'You make the transfer from your bank, quoting your reference.',
      'We confirm receipt and pass your order to the supplier.',
      'You get the tracking number as soon as the carrier collects it.',
      'On the day, check the pallet before signing: any damage must be written on the delivery note.',
    ],
    damageTitle: 'Important on delivery',
    damageText:
      'A 200 kg appliance can suffer in transit. Unpack in front of the driver if you can, and if anything is knocked, write a precise, handwritten note of damage on the delivery note. Without a written note, a claim against the carrier becomes very hard.',
    trackCta: 'Track my order',
  },

  tracking: {
    title: 'Track my order',
    lead: 'Enter your order reference and the email address used at payment.',
    refLabel: 'Order reference',
    refPlaceholder: 'PEL-XXXXXX',
    submit: 'Show my order',
    notFound: 'No order matches these details.',
    statusLabel: 'Status',
    placedOn: 'Ordered on',
    itemsLabel: 'Items',
    carrierLabel: 'Carrier',
    trackingNumber: 'Tracking number',
    statuses: {
      awaiting_transfer: 'Awaiting your transfer',
      confirmed: 'Transfer received — order being prepared',
      shipped: 'On its way',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    },
  },

  guides: {
    title: 'Guides',
    lead: 'What is worth understanding before choosing a pellet stove, written without the sales shortcuts.',
    readingTime: 'min read',
    updated: 'Updated',
    relatedProducts: 'Models concerned',
    backToGuides: 'All guides',
  },

  about: {
    title: 'About',
    lead: 'A shop for wood, pellet and electric heating.',
    body: [
      'Pellora covers eight families of appliance — pellet and wood stoves, cookstoves, boilers, inserts, heat pumps, flues and accessories — plus two sections of decorative hearths, bioethanol and electric, which we present as exactly that: they do not heat a house. Every page is written from the manufacturer’s documentation, and carries a visible notice as long as it is not. A catalogue of three hundred appliances forces you to copy supplier sheets without reading them; we would rather know what we sell, and be able to say when a model is wrong for you.',
      'We work on a dropshipping model: appliances leave our suppliers’ European warehouses without passing through an intermediate stock. The advantage for you is the price, since there is no showroom to pay for. The drawback is that we cannot let you see the appliance before buying — we make up for it with complete data sheets and a 14-day right of withdrawal that applies in full.',
      'What we do not do: installation, annual servicing and repairs. Those are regulated trades that need a local presence. We supply the appliance, its documentation and its flue; your installer does the rest, and that is better for your insurance as well as your warranty.',
    ],
    valuesTitle: 'Our three rules',
    values: [
      { title: 'No figure we cannot source', text: 'The characteristics shown come from supplier data sheets. When we give an order of magnitude, we say so.' },
      { title: 'No false urgency', text: 'No countdown timers, no randomly generated "only 2 left". Real stock figures come from the supplier.' },
      { title: 'No selling against the customer’s interest', text: 'If the calculator says 8 kW, we do not sell you 15 kW. An oversized appliance comes back as a return.' },
    ],
  },

  contact: {
    title: 'Contact',
    lead: 'For a sizing question, give us the floor area, the ceiling height, the year of construction and your existing heating: the first reply will then be a useful one.',
    emailLabel: 'Email',
    phoneLabel: 'Phone',
    hoursLabel: 'Hours',
    hoursValue: 'Monday to Friday, 9 am – 6 pm (CET)',
    responseLabel: 'Response time',
    responseValue: 'One business day',
    formTitle: 'Write a message',
    nameLabel: 'Name',
    messageLabel: 'Message',
    messagePlaceholder: 'Floor area, ceiling height, year of construction, current heating…',
    submit: 'Send the message',
    sent: 'Message sent. We reply within one business day.',
    failed: 'Sending failed. Please email us directly.',
    mailtoHint: 'The form opens your email client with the message pre-filled.',
  },

  faq: {
    title: 'Frequently asked questions',
    lead: 'The recurring questions, with answers that do not dodge the awkward parts.',
    items: [
      {
        q: 'What is the practical difference between a hydro stove and a ducted-air stove?',
        a: 'An air stove heats the air of the room it stands in, and can send part of it to two adjoining rooms if it is ducted. A hydro stove heats water, which it sends into your radiators or underfloor heating: it replaces or supplements a boiler. The first needs a flue and a power socket; the second also needs a hydraulic connection made by a professional.',
      },
      {
        q: 'Can you install the stove?',
        a: 'No. We sell the appliance, its documentation and its flue. Installation is a regulated trade that requires a local presence, and the connection determines whether your home insurance responds. Use a qualified installer near you — in France, an RGE qualification is also required for most public grants.',
      },
      {
        q: 'How much will I save compared with my current heating?',
        a: 'We do not give a figure, because an honest figure does not exist without knowing your real consumption, what you currently pay for energy, and the price of pellets in your area. All three move, the last one a great deal. The method is in our guides: take your annual consumption in kWh, divide by the efficiency of your current appliance, convert into kilos of pellets, and multiply by the price of a bag near you.',
      },
      {
        q: 'What is the delivery time?',
        a: 'Reckon on 2 to 5 business days to dispatch depending on the model, then 4 to 8 business days in transit within France, a little longer elsewhere in Europe. The exact figure is on each product page. The carrier calls you to agree a slot — a pallet cannot be left without someone there.',
      },
      {
        q: 'What if the appliance arrives damaged?',
        a: 'You write a precise reservation on the delivery note, in front of the driver, then email us with photographs within 48 hours. We take the carrier claim from there. Without a written reservation at the time of delivery, the claim becomes very difficult: that is why we insist on this point.',
      },
      {
        q: 'Can I return a stove that does not suit me?',
        a: 'Yes, within 14 days of receipt, under the right of withdrawal (Directive 2011/83/EU). The appliance must be uninstalled and repacked in its original packaging. Return costs are yours and, on a palletised appliance, they are high — which is why we would rather check the sizing before the order than after.',
      },
      {
        q: 'Does the stove work during a power cut?',
        a: 'No. The auger, the igniter and the flue-gas extractor are all electric: without power the appliance stops and the safety circuit trips. If cuts are frequent where you live, plan for a UPS sized for the extractor, or keep a back-up heat source that is independent of the grid.',
      },
      {
        q: 'How many pellets should I budget for a season?',
        a: 'The common order of magnitude is 1 to 2 tonnes a season for a 100 to 150 m² house, but the gap between those two figures is enormous and depends on your insulation, your target temperature and how hard the winter is. Start with one tonne and adjust in your second season using your own readings.',
      },
    ],
  },

  shippingPage: {
    title: 'Delivery',
    lead: 'The real conditions, including the ones that need some organising on your side.',
    zonesTitle: 'Zones and rates',
    zoneHeader: 'Zone',
    countriesHeader: 'Countries',
    freightHeader: 'Pallet (appliances)',
    parcelHeader: 'Parcel (accessories)',
    freeHeader: 'Free delivery from',
    delayHeader: 'Transit time',
    freightTitle: 'How a pallet delivery works',
    freightSteps: [
      'The supplier ships the appliance on a wrapped pallet from its European warehouse.',
      'The carrier calls the number given at checkout to agree a delivery slot.',
      'The truck arrives with a tail lift. Drop-off is at the kerbside, on accessible and stable ground.',
      'You check the state of the pallet, then sign — with written reservations if there is the slightest impact.',
      'You move the appliance inside: plan for two people and a sack truck, or choose the indoor positioning option.',
    ],
    accessTitle: 'Check access before ordering',
    accessText:
      'A palletised freight truck is 10 to 12 m long. If your street is narrow, steeply sloping, pedestrianised or weight-restricted, tell us in the order: the carrier will arrange delivery in a smaller vehicle, which usually adds two to three days.',
    indoorTitle: 'Indoor positioning option',
    indoorText:
      'For €119, the delivery team places the appliance in the ground-floor room of your choice, provided the route is passable. It does not include unpacking, connection, or removal of your old appliance.',
  },

  returns: {
    title: 'Returns and withdrawal',
    lead: 'Your rights, and the constraints specific to a 200 kg appliance.',
    rightTitle: 'Right of withdrawal: 14 days',
    rightText:
      'You have fourteen days from receipt to withdraw from your purchase, without having to give a reason (Directive 2011/83/EU). Tell us in writing within that period, then return the appliance within the following fourteen days.',
    conditionsTitle: 'Conditions to meet',
    conditions: [
      'The appliance must not have been installed, connected or run.',
      'It must be repacked in its original packaging, on its pallet, with all accessories and documentation.',
      'Return costs are yours. On a palletised appliance, reckon on €90 to €180 depending on the zone: we give you the exact quote before collection.',
      'The refund is made within fourteen days of receiving and inspecting the appliance, to the original payment method.',
    ],
    damagedTitle: 'Appliance damaged in transit',
    damagedText:
      'Write a precise, handwritten reservation on the delivery note, in front of the driver — "box damaged" is not enough, describe the damage. Then send us photographs of the packaging and the appliance within 48 hours. We handle the claim and send you a replacement at no cost.',
    warrantyTitle: 'Statutory guarantee',
    warrantyText:
      'Every appliance carries the two-year statutory guarantee of conformity (EU Directive 2019/771), to which French law adds the guarantee against hidden defects. A defect appearing within that period is presumed to have existed at delivery: the burden of proof is not on you.',
    exclusionsTitle: 'What the guarantee does not cover',
    exclusions: [
      'Wear parts: door seals, glass, burn pot, igniter.',
      'Damage caused by non-compliant fuel — uncertified or damp pellets, or any diameter other than 6 mm.',
      'Faults following a non-compliant installation or a missed annual service.',
    ],
  },

  legalPage: {
    title: 'Legal notice',
    editorTitle: 'Site publisher',
    entity: 'Registered name',
    form: 'Legal form',
    capital: 'Share capital',
    registration: 'Registration',
    vat: 'EU VAT number',
    address: 'Registered office',
    director: 'Publication manager',
    contactTitle: 'Contact',
    hostTitle: 'Hosting provider',
    mediationTitle: 'Consumer mediation',
    mediationText:
      'Under article L.612-1 of the French Consumer Code, you may refer the matter free of charge to the consumer ombudsman named below, in the event of a dispute not resolved by our customer service.',
    ipTitle: 'Intellectual property',
    ipText:
      'The texts on this site are the property of the publisher. Manufacturers’ trade marks, trade names and images remain the property of their respective holders and are used in the context of reselling their products.',
    toComplete: 'To be completed before going live commercially.',
  },

  terms: {
    title: 'Terms and conditions of sale',
    lead: 'Version applicable to orders placed on this site.',
    toComplete:
      'This document is a working template. Have it reviewed by a lawyer before your first sale: mandatory disclosures vary by destination country, and an unfair term is deemed not to have been written.',
    sections: [
      {
        heading: '1. Purpose and scope',
        body: 'These terms govern the sale of wood-pellet heating appliances and their accessories by the site publisher, to consumers resident in one of the delivery countries listed on the Delivery page. Placing an order implies unreserved acceptance of them.',
      },
      {
        heading: '2. Products',
        body: 'The essential characteristics of the products appear on each product page. They reproduce the data provided by the manufacturer. Illustrative images have no contractual value where they are marked as such. Products comply with the requirements of EU Regulations 2015/1185 and 2015/1186 and with standard EN 14785.',
      },
      {
        heading: '3. Prices',
        body: 'Prices are stated in euros, all taxes included, excluding delivery costs. Delivery costs are shown before the order is confirmed and depend on the destination zone and the nature of the shipment. The seller may change prices at any time, the applicable price being the one in force when the order is placed.',
      },
      {
        heading: '4. Order and payment',
        body: 'The order becomes firm once the transfer reaches the seller’s account. Payment is made solely by bank transfer, to the details supplied to the customer at the time of ordering and repeated by e-mail. No card data is collected by the seller. If the transfer has not arrived within ten working days, the order is cancelled automatically and the customer is informed. The seller may decline an order in the event of a previous dispute, suspected fraud, or a delivery address outside the served zone.',
      },
      {
        heading: '5. Delivery',
        body: 'Appliances are delivered on a pallet, by carrier, after a telephone appointment. Drop-off is at the kerbside unless the indoor positioning option has been taken. Stated lead times are estimates in business days, counted from confirmation of payment. Risk passes on actual handover of the goods.',
      },
      {
        heading: '6. Reservations on receipt',
        body: 'The buyer must check the condition of the packaging and the product in the carrier’s presence and record any damage by a precise, handwritten reservation on the delivery note. The buyer informs the seller within 48 hours, with photographs. Without a reservation, a claim against the carrier becomes practically impossible.',
      },
      {
        heading: '7. Right of withdrawal',
        body: 'The consumer has fourteen days from receipt to exercise the right of withdrawal, without giving a reason. The product must be returned uninstalled and unused, in its original packaging. Return costs are borne by the buyer. The refund is made within fourteen days of recovering the goods.',
      },
      {
        heading: '8. Guarantees',
        body: 'All products carry the two-year statutory guarantee of conformity and, under French law, the guarantee against hidden defects. Any commercial warranty granted by the manufacturer is additional and does not replace them. Wear parts and damage resulting from a non-compliant installation, uncertified fuel or a lack of servicing are excluded.',
      },
      {
        heading: '9. Installation',
        body: 'The sale includes neither installation, nor connection, nor commissioning. These are matters for a qualified professional and must comply with the regulations applicable at the place of installation. The seller cannot be held liable for the consequences of a non-compliant installation.',
      },
      {
        heading: '10. Personal data',
        body: 'Data collected is processed in accordance with EU Regulation 2016/679. Details of the processing, retention periods and data-subject rights appear in the privacy policy.',
      },
      {
        heading: '11. Governing law and disputes',
        body: 'The contract is governed by French law, without depriving the consumer of the protection afforded by the mandatory provisions of the law of their country of residence. In the event of a dispute, an amicable solution will be sought before any legal action; the consumer may refer the matter free of charge to the consumer ombudsman.',
      },
    ],
  },

  privacy: {
    title: 'Privacy policy',
    lead: 'What data, why, for how long, and how to have it deleted.',
    controllerTitle: 'Data controller',
    dataTitle: 'Data collected and purposes',
    dataRows: [
      { data: 'Name, address, phone', purpose: 'Fulfilling the order and delivery', basis: 'Performance of the contract', retention: '10 years (accounting obligation)' },
      { data: 'Email address', purpose: 'Order confirmation, tracking, customer service', basis: 'Performance of the contract', retention: '3 years after last contact' },
      { data: 'Order details', purpose: 'Invoicing, warranty, after-sales service', basis: 'Legal obligation', retention: '10 years' },
      { data: 'IP address, technical logs', purpose: 'Site security, fraud prevention', basis: 'Legitimate interest', retention: '12 months' },
    ],
    dataHeaders: { data: 'Data', purpose: 'Purpose', basis: 'Legal basis', retention: 'Retention' },
    paymentTitle: 'Payment',
    paymentText:
      'Payment is made by bank transfer, from your bank to the seller’s. No card details are entered on this site, and no payment processor is involved: the details of your transfer are handled by your bank and the seller’s, under their own policies. The seller keeps the name of the sending account holder, where you supply it, for the sole purpose of matching your payment to your order.',
    cookiesTitle: 'Cookies',
    cookiesText:
      'This site uses no advertising or analytics cookies. Only the browser’s local storage is used, to keep your cart between visits: that data stays on your device and is not sent to us. No consent is therefore required on that basis.',
    rightsTitle: 'Your rights',
    rightsText:
      'You have rights of access, rectification, erasure, restriction, objection and portability. Write to the contact address below: we reply within one month. You may also complain to the data protection authority of your country of residence.',
    transferTitle: 'Transfers outside the EU',
    transferText:
      'Data is hosted in the European Union. Some technical sub-processors may operate from the United States, under the European Commission’s standard contractual clauses.',
  },

  footer: {
    tagline: 'Hydro and ducted-air pellet stoves, sized before you buy.',
    shopTitle: 'Shop',
    helpTitle: 'Help',
    legalTitle: 'Legal',
    languageTitle: 'Language',
    rights: 'All rights reserved.',
    vatNote: 'Prices shown include French VAT at 20 %. Delivery charged separately.',
    paymentNote: 'Payment by bank transfer',
  },

  notFound: {
    title: 'Page not found',
    lead: 'This address matches no page. It may have been renamed, or the product withdrawn from the catalogue.',
    cta: 'Back to the home page',
    shopCta: 'Browse the stoves',
  },

  errors: {
    genericTitle: 'Something went wrong',
    genericLead: 'The error has been logged. Try again, or write to us if it persists.',
    retry: 'Try again',
  },
  emails: {
    transferSubject: 'Order {ref} — bank transfer details',
    transferTitle: 'Your order is recorded',
    transferLead:
      'It goes into preparation as soon as your transfer reaches our account. You will get a second message at that point.',
    transferHow: 'Transfer to make',
    transferRefNotice:
      'Please put {ref} in the transfer reference: that is what lets us match your payment to your order. Without it, matching is done by hand and takes several days.',
    transferFooter:
      'A SEPA transfer usually arrives within one working day. If you have heard nothing from us after three working days, write to us: something has probably gone wrong.',
    bankAmount: 'Amount',
    bankReference: 'Reference',
    bankHolder: 'Beneficiary',
    bankIban: 'IBAN',
    bankBic: 'BIC',
    bankName: 'Bank',
    confirmSubject: 'Order {ref} confirmed',
    confirmTitle: 'Order confirmed',
    confirmLead: 'Thank you. Your payment is recorded and your order is being prepared.',
    reference: 'Reference',
    trackCta: 'Track my order',
    confirmFooter:
      'The carrier will call you to agree a delivery slot. On receipt, check the state of the pallet before signing: any damage must be recorded in writing on the delivery note.',
    shippedSubject: 'Order {ref} shipped',
    shippedTitle: 'Your order is on its way',
    shippedLead: 'Order {ref} shipped by {carrier}.',
    trackingNumber: 'Tracking number',
    trackParcelCta: 'Track the delivery',
    shippedFooter:
      'Tracking can take a few hours to go live at the carrier. If nothing moves after 48 h, reply to this message.',
    subtotal: 'Subtotal',
    total: 'Total',
    vatLine: 'of which VAT',
    free: 'Free',
    defaultCarrier: 'The carrier',
    footerNote: 'You are receiving this message because you placed an order on {domain}.',
  },

  api: {
    notConfigured: 'Payment is not configured on this shop yet.',
    unreadableBody: 'Unreadable request.',
    invalidCart: 'Invalid cart.',
    unknownCountry: 'We do not deliver to "{country}" yet.',
    noCheckoutUrl: 'The payment provider returned no checkout address.',
    checkoutFailed: 'Payment could not be opened. Please try again in a moment.',
    lookupMissingFields: 'Enter the order reference and the email address used.',
    declareNotPending: 'This order is no longer awaiting a transfer.',
    lookupNotFound: 'No order matches these details.',
  },

};

export default en;
