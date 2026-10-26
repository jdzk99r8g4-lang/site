/**
 * Dictionnaire français — RÉFÉRENCE.
 *
 * Ce fichier définit le contrat : `Dictionary = typeof fr`. Les trois autres
 * langues sont typées avec ce contrat, donc une clé oubliée en néerlandais
 * devient une erreur de compilation et non un texte manquant en production.
 * Pour ajouter un texte : l'ajouter ici d'abord, puis suivre les erreurs.
 */

const fr = {
  meta: {
    homeTitle: 'Poêles à granulés hydro et à air ventilé — livrés depuis l’UE',
    homeDescription:
      'Poêles à granulés hydro et à air ventilé, dimensionnés avant l’achat. Livraison sur rendez-vous en France et en Europe, paiement sécurisé.',
    shopTitle: 'Le chauffage',
    shopDescription:
      'Poêles à air ventilé et poêles hydro de 6 à 24 kW. Puissance, rendement et surface chauffée sur chaque fiche.',
  },

  nav: {
    home: 'Accueil',
    shop: 'Chauffage',
    sizing: 'Quelle puissance ?',
    guides: 'Guides',
    about: 'À propos',
    contact: 'Contact',
    faq: 'Questions fréquentes',
    cart: 'Panier',
    openMenu: 'Ouvrir le menu',
    closeMenu: 'Fermer le menu',
    skipToContent: 'Aller au contenu',
    changeLanguage: 'Changer de langue',
  },

  common: {
    addToCart: 'Ajouter au panier',
    added: '{count} dans votre panier',
    addedCapped: 'Nous n’en avons ajouté que {added} : le maximum est de {max} par article.',
    atMaxQuantity: 'Maximum atteint : {max} par article.',
    increaseQuantity: 'Augmenter la quantité',
    decreaseQuantity: 'Diminuer la quantité',
    viewCart: 'Voir le panier',
    continueShopping: 'Continuer mes achats',
    from: 'À partir de',
    vatIncluded: 'TTC',
    vatIncludedLong: 'TVA incluse, hors livraison',
    shippingExtra: 'Livraison en supplément',
    learnMore: 'En savoir plus',
    viewProduct: 'Voir la fiche',
    quantity: 'Quantité',
    remove: 'Retirer',
    subtotal: 'Sous-total',
    shipping: 'Livraison',
    total: 'Total',
    of: 'sur',
    save: 'Économisez',
    loading: 'Chargement…',
    required: 'Champ obligatoire',
    email: 'Adresse e-mail',
    send: 'Envoyer',
    close: 'Fermer',
    back: 'Retour',
    upTo: 'Jusqu’à',
    seeAll: 'Tout voir',
    specifications: 'Caractéristiques',
    description: 'Description',
    delivery: 'Livraison',
    inStock: 'En stock',
    dispatchedIn: 'Expédié en',
    businessDays: 'jours ouvrés',
    page: 'Page',
    products: 'produits',
    product: 'produit',
    results: 'résultats',
    soon: 'Bientôt',
    sectionEmpty:
      'Cette section se remplit. Les premiers modèles y seront publiés dès réception des fiches du fournisseur.',
    noResults: 'Aucun produit ne correspond à ces critères.',
    resetFilters: 'Réinitialiser',
    illustrationNotice:
      'Illustration — la photographie du modèle sera publiée dès réception des visuels du fournisseur.',
    demoBanner:
      'Catalogue en cours de constitution : les fiches dont les caractéristiques n’ont pas encore été vérifiées le signalent en tête de page. À compléter avec les données du fournisseur avant toute vente.',
  },

  categories: {
    pellet: 'Poêles à granulés',
    pelletShort: 'Granulés',
    pelletTagline: 'Automatiques et programmables, autonomes pendant plusieurs jours.',
    bioethanol: 'Cheminées bioéthanol',
    bioethanolShort: 'Bioéthanol',
    bioethanolTagline: 'Une vraie flamme sans conduit ni fumée. Un objet de décoration, pas un moyen de chauffer la maison.',
    electricfire: 'Cheminées électriques',
    electricfireShort: 'Électriques',
    electricfireTagline: 'L’effet d’un foyer avec une simple prise de courant, et un chauffage d’appoint de 1 à 2 kW.',
  },

  distributions: {
    all: 'Tous',
    air: 'Air ventilé',
    airTagline: 'Chauffe la pièce où il est posé, et les pièces voisines s’il est canalisé.',
    hydro: 'Hydro',
    hydroTagline: 'Alimente radiateurs et plancher chauffant, comme une chaudière.',
    airChooseIf: 'Choisissez l’air ventilé si',
    airReasons: [
      'vous voulez chauffer une pièce de vie, éventuellement deux chambres par gaine',
      'vous n’avez pas de circuit de chauffage central, ou vous le gardez tel quel',
      'vous voulez une installation simple : un conduit de fumées, une prise électrique',
    ],
    hydroChooseIf: 'Choisissez l’hydro si',
    hydroReasons: [
      'vous avez des radiateurs ou un plancher chauffant déjà en place',
      'vous voulez remplacer ou seconder une chaudière fioul ou gaz',
      'vous acceptez un raccordement hydraulique par un professionnel',
    ],
  },

  home: {
    heroEyebrow: 'Granulés, bois, chaudières, pompes à chaleur',
    heroTitle: 'Le bon appareil, c’est d’abord la bonne puissance.',
    heroLead:
      'Un appareil surdimensionné tourne au ralenti, s’encrasse et vous laisse ouvrir les fenêtres. Sous-dimensionné, il tourne à fond et ne tient pas la maison. Nous commençons donc par le calcul, puis par l’appareil.',
    heroCtaPrimary: 'Calculer ma puissance',
    heroCtaSecondary: 'Voir tout le chauffage',
    heroStatOne: 'de 6 à 24 kW',
    heroStatOneLabel: 'dix rayons de chauffage',
    heroStatTwo: 'jusqu’à 92 %',
    heroStatTwoLabel: 'de rendement annoncé',
    heroStatThree: '4 à 8 jours',
    heroStatThreeLabel: 'livraison sur rendez-vous',

    familiesTitle: 'Huit familles d’appareils',
    familiesLead:
      'Chacune répond à une installation et à un budget différents. Commencez par ce que vous voulez poser.',

    featuredTitle: 'Les modèles les plus demandés',
    featuredLead: 'Quatre appareils qui couvrent la majorité des configurations.',

    sizingTitle: 'Combien de kilowatts pour chez vous ?',
    sizingLead:
      'Surface, hauteur de plafond, isolation, zone climatique : quatre données suffisent à cadrer la puissance. Le calcul prend moins d’une minute et évite l’erreur la plus coûteuse de cet achat.',
    sizingCta: 'Ouvrir le calculateur',

    whyTitle: 'Ce que nous faisons différemment',
    whyItems: [
      {
        title: 'Le dimensionnement avant la vente',
        text: 'Le calculateur est en accès libre et son résultat peut très bien vous orienter vers un modèle moins cher. C’est le but : un appareil mal dimensionné finit en retour, et un retour sur 200 kg coûte plus cher que la marge.',
      },
      {
        title: 'Les conditions de livraison écrites noir sur blanc',
        text: 'Camion à hayon, dépose au pied du camion, prise de rendez-vous par téléphone. Vous savez avant de payer qu’il faudra deux personnes pour rentrer l’appareil, ou vous prenez l’option mise en place.',
      },
      {
        title: 'Aucune promesse d’économies chiffrée',
        text: 'Vos économies dépendent de votre consommation actuelle, du prix de votre énergie et du prix du granulé, qui varie d’une saison à l’autre. Nous donnons la méthode de calcul, pas un pourcentage inventé.',
      },
      {
        title: 'La pose reste au professionnel',
        text: 'Nous vendons l’appareil et le conduit, pas l’installation. Le raccordement conditionne votre assurance et, en France, l’éligibilité aux aides : il doit être fait par un installateur qualifié.',
      },
    ],

    processTitle: 'Comment se passe une commande',
    processSteps: [
      { title: 'Vous calculez la puissance', text: 'Le calculateur donne une fourchette en kW et les modèles qui entrent dedans.' },
      { title: 'Vous commandez en ligne', text: 'Vous réglez par virement bancaire, avec les coordonnées et la référence fournies à la commande. Aucune donnée de carte ne vous est demandée.' },
      { title: 'Le transporteur vous appelle', text: 'Sous 2 à 4 jours ouvrés, pour convenir d’un créneau de livraison.' },
      { title: 'Vous faites poser l’appareil', text: 'Par un installateur qualifié. Nous fournissons la fiche technique et le schéma de raccordement.' },
    ],

    guidesTitle: 'À lire avant de choisir',
    guidesLead: 'Trois textes qui répondent aux questions qui reviennent le plus souvent.',

    supportTitle: 'Un doute sur le modèle ou le conduit ?',
    supportLead:
      'Écrivez-nous le plan de la pièce, la surface, la hauteur sous plafond et l’année de construction. Nous répondons par écrit, sous un jour ouvré.',
    supportCta: 'Poser une question',
  },

  shop: {
    title: 'Tout le chauffage',
    lead: 'Douze références, de 6 à 24 kW. Les caractéristiques annoncées sont celles des fiches techniques fournisseur.',
    filterCategory: 'Famille',
    filterAll: 'Toutes',
    filterPower: 'Puissance',
    filterArea: 'Surface à chauffer',
    sortBy: 'Trier par',
    sortPowerAsc: 'Puissance croissante',
    sortPowerDesc: 'Puissance décroissante',
    sortPriceAsc: 'Prix croissant',
    sortPriceDesc: 'Prix décroissant',
    anyPower: 'Toutes puissances',
    anyArea: 'Toutes surfaces',
  },

  product: {
    backToShop: 'Retour aux poêles',
    chooseVariant: 'Finition',
    keyPoints: 'L’essentiel',
    techSheet: 'Fiche technique',
    deliveryTitle: 'Livraison et réception',
    deliveryFreight:
      'Appareil expédié sur palette. Le transporteur appelle pour convenir d’un créneau. La dépose se fait au pied du camion : prévoyez deux personnes, ou choisissez l’option mise en place au moment du paiement.',
    deliveryParcel: 'Expédié en colis suivi, remis en main propre ou en point relais.',
    installTitle: 'Installation',
    installText:
      'La pose et le raccordement au conduit de fumées doivent être réalisés par un professionnel qualifié. Nous fournissons la fiche technique, le schéma de raccordement et la déclaration de performance.',
    unverifiedNotice:
      'Caractéristiques de démonstration : les valeurs de cette fiche sont fictives et doivent être remplacées par la documentation du fabricant.',
    crossSellTitle: 'Souvent commandé avec',
    powerRange: 'Puissance modulable',
    heatedArea: 'Surface chauffée',
    waterPower: 'dont à l’eau',
    efficiency: 'Rendement',
    energyClass: 'Classe',
    sizingHint: 'Vérifier que cette puissance convient',
    compareTitle: 'Comparer avec les modèles proches',
    ductedOutlets: 'Sorties canalisables',
    dhwYes: 'Eau chaude sanitaire incluse',
  },

  sizing: {
    title: 'Calculateur de puissance',
    lead:
      'Quatre questions pour obtenir une fourchette de puissance exploitable. C’est une estimation de pré-dimensionnement, pas une étude thermique.',
    areaLabel: 'Surface à chauffer',
    areaUnit: 'm²',
    heightLabel: 'Hauteur sous plafond',
    heightUnit: 'm',
    insulationLabel: 'Isolation',
    insulationPoor: 'Faible — avant 1975, simple vitrage, combles non isolés',
    insulationAverage: 'Moyenne — isolation partielle, double vitrage',
    insulationGood: 'Bonne — après 2005 ou rénovation complète',
    insulationExcellent: 'Très bonne — RT 2012, BBC, passif',
    climateLabel: 'Zone climatique',
    climateMild: 'Douce — littoral atlantique, pourtour méditerranéen',
    climateTemperate: 'Tempérée — plaine, grande majorité des cas',
    climateCold: 'Froide — montagne, est continental',
    resultTitle: 'Puissance à viser',
    resultRange: 'Fourchette conseillée',
    resultExplain:
      'Choisissez un appareil dont la puissance NOMINALE maximale se situe dans cette fourchette. Un poêle dont le maximum dépasse largement le besoin passera son temps au ralenti, ce qui encrasse la vitre et le brasier.',
    resultModels: 'Modèles qui entrent dans cette fourchette',
    resultNone: 'Aucun modèle du catalogue ne couvre ce besoin. Écrivez-nous : au-delà de 24 kW, il faut une chaudière à granulés plutôt qu’un poêle.',
    methodTitle: 'La méthode employée',
    methodText:
      'Le volume à chauffer est multiplié par un coefficient de déperdition qui dépend de l’isolation, puis corrigé par la zone climatique. Les coefficients retenus (de 0,025 à 0,055 kW par m³) correspondent aux ordres de grandeur couramment utilisés pour un pré-dimensionnement.',
    disclaimerTitle: 'Ce que ce calcul ne remplace pas',
    disclaimerText:
      'Une étude thermique tient compte des ponts thermiques, de l’orientation, du renouvellement d’air, de la surface vitrée et de la température de confort visée. Si vous remplacez un générateur principal, ou pour tout poêle hydro, faites vérifier le résultat par votre installateur avant de commander : c’est lui qui engage sa responsabilité sur le dimensionnement.',
    volumeComputed: 'Volume estimé',
    recompute: 'Recalculer',
  },

  cart: {
    title: 'Votre panier',
    empty: 'Votre panier est vide.',
    emptyCta: 'Découvrir les poêles',
    lineTotal: 'Total ligne',
    countryLabel: 'Pays de livraison',
    rateLabel: 'Mode de livraison',
    freeShippingProgress: 'Plus que {amount} pour la livraison offerte',
    freeShippingReached: 'Livraison offerte sur cette commande',
    checkout: 'Commander',
    checkoutPending: 'Enregistrement…',
    vatLine: 'dont TVA',
    estimatedDelivery: 'Livraison estimée',
    canceled: 'Paiement interrompu. Votre panier a été conservé.',
    error: 'Le paiement n’a pas pu être ouvert. Réessayez dans un instant.',
    securedBy: 'Paiement par virement. Aucune donnée bancaire ne vous est demandée sur ce site.',
    freightNotice:
      'Votre panier contient un appareil expédié sur palette : la livraison se fait sur rendez-vous, au pied du camion.',
  },

  checkout: {
    title: 'Votre commande',
    lead: 'Vérifiez votre panier, laissez-nous vos coordonnées, puis réglez par virement.',

    detailsTitle: 'Vos coordonnées',
    detailsLead:
      'Elles servent à la livraison et à vous tenir informé. Un appareil part sur palette : le transporteur appelle avant de se déplacer.',
    firstName: 'Prénom',
    lastName: 'Nom',
    email: 'Adresse e-mail',
    phone: 'Téléphone',
    phoneHint: 'Indispensable : le transporteur appelle pour convenir d’un créneau.',
    addressTitle: 'Adresse de livraison',
    line1: 'Adresse',
    line2: 'Complément (bâtiment, étage, code)',
    postalCode: 'Code postal',
    city: 'Ville',
    shippingTitle: 'Mode de livraison',

    transferTitle: 'À propos du virement',
    transferLead:
      'Si le virement part d’un compte à un autre nom que le vôtre, indiquez-le : sans cela, nous ne pouvons pas rattacher votre paiement à votre commande.',
    transferHolder: 'Titulaire du compte émetteur',
    transferHolderHint: 'À remplir seulement si ce n’est pas vous.',

    summaryTitle: 'Récapitulatif',
    submit: 'Enregistrer ma commande',
    submitPending: 'Enregistrement…',
    submitNote:
      'Aucun prélèvement : c’est vous qui effectuez le virement, depuis votre banque. Votre commande part en préparation dès sa réception.',
    error: 'La commande n’a pas pu être enregistrée. Réessayez dans un instant.',

    bankRefLater: 'Votre référence de commande s’affichera à l’étape suivante : c’est elle qu’il faudra indiquer en libellé du virement.',
    bankMissing:
      'Les coordonnées bancaires ne sont pas encore configurées sur ce site : la commande est momentanément indisponible.',

    declareCta: 'J’ai effectué le virement',
    declarePending: 'Enregistrement…',
    declareDone: 'Merci. Nous vérifions la réception sur notre compte et vous écrivons dès que c’est fait — en général sous un jour ouvré.',
    declareHint: 'À cliquer une fois le virement envoyé depuis votre banque. Cela nous dit quand regarder le compte.',
    declareError: 'Votre déclaration n’a pas pu être enregistrée. Réessayez dans un instant.',
    declaredOn: 'Virement déclaré le',
    placedEyebrow: 'Commande enregistrée',
    placedTitle: 'Il ne reste qu’à effectuer le virement',
    placedLead:
      'Votre commande est en attente de paiement. Elle part en préparation dès que le virement est constaté sur notre compte, en général sous un jour ouvré.',
    placedEmail: 'Un récapitulatif avec ces coordonnées vient de partir à {email}.',
    printCta: 'Imprimer ou enregistrer',

    reference: 'Référence de commande',
    nextStepsTitle: 'Ce qui se passe maintenant',
    nextSteps: [
      'Vous effectuez le virement depuis votre banque, en indiquant votre référence.',
      'Nous confirmons la réception et transmettons votre commande au fournisseur.',
      'Vous recevez le numéro de suivi dès la prise en charge par le transporteur.',
      'Le jour J, vérifiez l’état de la palette avant de signer : toute réserve doit être écrite sur le bon de livraison.',
    ],
    damageTitle: 'Important à la réception',
    damageText:
      'Un appareil de 200 kg peut souffrir du transport. Déballez devant le chauffeur si possible, et en cas de choc notez une réserve précise et manuscrite sur le bon de livraison. Sans réserve écrite, un recours contre le transporteur devient très difficile.',
    trackCta: 'Suivre ma commande',
  },

  tracking: {
    title: 'Suivre ma commande',
    lead: 'Saisissez votre référence de commande et l’adresse e-mail utilisée au paiement.',
    refLabel: 'Référence de commande',
    refPlaceholder: 'PEL-XXXXXX',
    submit: 'Afficher ma commande',
    notFound: 'Aucune commande ne correspond à ces informations.',
    statusLabel: 'Statut',
    placedOn: 'Commandée le',
    itemsLabel: 'Articles',
    carrierLabel: 'Transporteur',
    trackingNumber: 'Numéro de suivi',
    statuses: {
      awaiting_transfer: 'En attente de votre virement',
      confirmed: 'Virement reçu — commande en préparation',
      shipped: 'En route',
      delivered: 'Livrée',
      cancelled: 'Annulée',
    },
  },

  guides: {
    title: 'Guides',
    lead: 'Ce qu’il faut comprendre avant de choisir un poêle à granulés, écrit sans raccourci commercial.',
    readingTime: 'min de lecture',
    updated: 'Mis à jour le',
    relatedProducts: 'Modèles concernés',
    backToGuides: 'Tous les guides',
  },

  about: {
    title: 'À propos',
    lead: 'Une boutique de chauffage au bois, au granulé et à l’électricité.',
    body: [
      'Pellora couvre huit familles d’appareils — poêles à granulés et à bois, cuisinières, chaudières, inserts, pompes à chaleur, conduits et accessoires — auxquelles s’ajoutent deux rayons de foyers décoratifs, bioéthanol et électriques, que nous présentons comme tels : ils ne chauffent pas une maison. Chaque fiche est saisie d’après la documentation du fabricant, et porte une mention visible tant que ce n’est pas le cas. Un catalogue de trois cents appareils oblige à recopier les fiches sans les lire ; nous préférons savoir ce que nous vendons, et pouvoir dire quand un modèle ne convient pas.',
      'Nous travaillons en dropshipping : les appareils partent des entrepôts européens de nos fournisseurs, sans passer par un stock intermédiaire. L’avantage pour vous est le prix, puisqu’il n’y a pas de show-room à financer. L’inconvénient est que nous ne pouvons pas vous faire voir l’appareil avant l’achat — nous compensons par des fiches techniques complètes et par un droit de rétractation de 14 jours qui s’applique pleinement.',
      'Ce que nous ne faisons pas : l’installation, l’entretien annuel et le dépannage. Ce sont des métiers réglementés qui demandent une présence locale. Nous fournissons l’appareil, sa documentation et son conduit ; votre installateur fait le reste, et c’est mieux ainsi pour votre assurance comme pour votre garantie.',
    ],
    valuesTitle: 'Nos trois règles',
    values: [
      { title: 'Pas de chiffre que nous ne pouvons pas sourcer', text: 'Les caractéristiques affichées viennent des fiches techniques fournisseur. Quand nous donnons un ordre de grandeur, nous le disons.' },
      { title: 'Pas de fausse urgence', text: 'Aucun compte à rebours, aucun « plus que 2 en stock » généré au hasard. Les stocks réels viennent du fournisseur.' },
      { title: 'Pas de vente contre l’intérêt du client', text: 'Si le calculateur indique 8 kW, nous ne vous vendons pas 15 kW. Un appareil surdimensionné revient en retour.' },
    ],
  },

  contact: {
    title: 'Contact',
    lead: 'Pour une question de dimensionnement, précisez la surface, la hauteur sous plafond, l’année de construction et le type de chauffage existant : la réponse sera utile dès le premier échange.',
    emailLabel: 'E-mail',
    phoneLabel: 'Téléphone',
    hoursLabel: 'Horaires',
    hoursValue: 'Du lundi au vendredi, 9 h – 18 h (CET)',
    responseLabel: 'Délai de réponse',
    responseValue: 'Un jour ouvré',
    formTitle: 'Écrire un message',
    nameLabel: 'Nom',
    messageLabel: 'Message',
    messagePlaceholder: 'Surface, hauteur sous plafond, année de construction, chauffage actuel…',
    submit: 'Envoyer le message',
    sent: 'Message envoyé. Nous répondons sous un jour ouvré.',
    failed: 'L’envoi a échoué. Écrivez-nous directement par e-mail.',
    mailtoHint: 'Le formulaire ouvre votre logiciel de messagerie avec le message pré-rempli.',
  },

  faq: {
    title: 'Questions fréquentes',
    lead: 'Les questions qui reviennent, avec des réponses qui n’éludent pas les points gênants.',
    items: [
      {
        q: 'Quelle différence concrète entre un poêle hydro et un poêle à air ventilé ?',
        a: 'Un poêle à air chauffe l’air de la pièce où il se trouve, et peut en envoyer une partie dans deux pièces voisines s’il est canalisé. Un poêle hydro chauffe de l’eau, qu’il envoie dans vos radiateurs ou votre plancher chauffant : il remplace ou seconde une chaudière. Le premier demande un conduit de fumées et une prise électrique ; le second demande en plus un raccordement hydraulique fait par un professionnel.',
      },
      {
        q: 'Pouvez-vous installer le poêle ?',
        a: 'Non. Nous vendons l’appareil, sa documentation et son conduit. L’installation est un métier réglementé qui exige une présence locale, et le raccordement conditionne votre assurance habitation. Faites appel à un installateur qualifié près de chez vous — en France, une qualification RGE est par ailleurs exigée pour la plupart des aides publiques.',
      },
      {
        q: 'Combien vais-je économiser par rapport à mon chauffage actuel ?',
        a: 'Nous ne donnons pas de chiffre, parce qu’un chiffre honnête n’existe pas sans connaître votre consommation réelle, le prix que vous payez votre énergie actuelle et le prix du granulé dans votre région. Ces trois variables bougent, la dernière beaucoup. La méthode est dans nos guides : relevez votre consommation annuelle en kWh, divisez par le rendement de votre appareil actuel, convertissez en kilos de granulés, et multipliez par le prix du sac près de chez vous.',
      },
      {
        q: 'Quel est le délai de livraison ?',
        a: 'Comptez 2 à 5 jours ouvrés d’expédition selon le modèle, puis 4 à 8 jours ouvrés de transport en France, un peu plus loin en Europe. Le délai exact figure sur chaque fiche produit. Le transporteur vous appelle pour convenir d’un créneau — une palette ne se dépose pas sans que quelqu’un soit là.',
      },
      {
        q: 'Que se passe-t-il si l’appareil arrive abîmé ?',
        a: 'Vous notez une réserve écrite et précise sur le bon de livraison, devant le chauffeur, puis vous nous écrivez avec des photos dans les 48 heures. Nous prenons en charge le litige transporteur. Sans réserve écrite au moment de la livraison, le recours devient très difficile : c’est la raison pour laquelle nous insistons autant sur ce point.',
      },
      {
        q: 'Puis-je retourner un poêle qui ne me convient pas ?',
        a: 'Oui, dans les 14 jours suivant la réception, au titre du droit de rétractation (directive 2011/83/UE). L’appareil doit être non installé et remballé dans son emballage d’origine. Les frais de retour sont à votre charge et, sur un appareil palettisé, ils sont élevés — c’est pourquoi nous préférons vérifier le dimensionnement avant la commande plutôt qu’après.',
      },
      {
        q: 'Le poêle fonctionne-t-il pendant une coupure de courant ?',
        a: 'Non. La vis d’alimentation, l’allumeur et l’extracteur de fumées sont électriques : sans courant, l’appareil s’arrête et la sécurité se met en défaut. Si les coupures sont fréquentes chez vous, prévoyez un onduleur dimensionné pour l’extracteur, ou gardez un appoint indépendant du réseau.',
      },
      {
        q: 'Quelle quantité de granulés faut-il prévoir par saison ?',
        a: 'L’ordre de grandeur courant est de 1 à 2 tonnes par saison pour une maison de 100 à 150 m², mais l’écart entre les deux bornes est énorme et dépend de votre isolation, de votre température de consigne et de la rigueur de l’hiver. Partez sur une tonne pour commencer, et ajustez à la deuxième saison avec vos propres relevés.',
      },
    ],
  },

  shippingPage: {
    title: 'Livraison',
    lead: 'Les conditions réelles, y compris celles qui demandent une organisation de votre part.',
    zonesTitle: 'Zones et tarifs',
    zoneHeader: 'Zone',
    countriesHeader: 'Pays',
    freightHeader: 'Palette (appareils)',
    parcelHeader: 'Colis (accessoires)',
    freeHeader: 'Franco de port',
    delayHeader: 'Délai de transport',
    freightTitle: 'Comment se passe une livraison sur palette',
    freightSteps: [
      'Le fournisseur expédie l’appareil sur palette filmée depuis son entrepôt européen.',
      'Le transporteur vous appelle au numéro indiqué à la commande pour convenir d’un créneau de livraison.',
      'Le camion se présente avec un hayon. La dépose se fait au pied du camion, sur une surface accessible et stable.',
      'Vous vérifiez l’état de la palette, puis vous signez — avec réserves écrites s’il y a le moindre choc.',
      'Vous rentrez l’appareil : prévoyez deux personnes et un diable, ou choisissez l’option mise en place.',
    ],
    accessTitle: 'Vérifiez l’accès avant de commander',
    accessText:
      'Un camion de messagerie palettisée fait 10 à 12 m de long. Si votre rue est étroite, en forte pente, en zone piétonne ou soumise à une restriction de tonnage, signalez-le dans la commande : le transporteur organisera une livraison en véhicule plus petit, ce qui ajoute généralement deux à trois jours.',
    indoorTitle: 'Option mise en place',
    indoorText:
      'Pour 119 €, l’équipe de livraison dépose l’appareil dans la pièce de votre choix au rez-de-chaussée, à condition que le passage soit praticable. Cela ne comprend ni le déballage, ni le raccordement, ni l’évacuation de l’ancien appareil.',
  },

  returns: {
    title: 'Retours et rétractation',
    lead: 'Vos droits, et les contraintes propres à un appareil de 200 kg.',
    rightTitle: 'Droit de rétractation : 14 jours',
    rightText:
      'Vous disposez de quatorze jours à compter de la réception pour renoncer à votre achat, sans avoir à vous justifier (directive 2011/83/UE, transposée en France aux articles L.221-18 et suivants du code de la consommation). Informez-nous par écrit dans ce délai, puis renvoyez l’appareil dans les quatorze jours suivants.',
    conditionsTitle: 'Conditions à respecter',
    conditions: [
      'L’appareil ne doit pas avoir été installé ni raccordé, ni avoir fonctionné.',
      'Il doit être remballé dans son emballage d’origine, sur sa palette, avec tous ses accessoires et sa documentation.',
      'Les frais de retour sont à votre charge. Sur un appareil palettisé, comptez 90 à 180 € selon la zone : nous vous donnons le devis exact avant l’enlèvement.',
      'Le remboursement intervient sous quatorze jours après réception et contrôle de l’appareil, sur le moyen de paiement d’origine.',
    ],
    damagedTitle: 'Appareil endommagé au transport',
    damagedText:
      'Notez une réserve écrite, précise et manuscrite sur le bon de livraison, devant le chauffeur — « colis abîmé » ne suffit pas, décrivez le dommage. Envoyez-nous ensuite des photos de l’emballage et de l’appareil dans les 48 heures. Nous prenons en charge le litige et vous réexpédions un appareil sans frais.',
    warrantyTitle: 'Garantie légale',
    warrantyText:
      'Tous les appareils bénéficient de la garantie légale de conformité de deux ans (directive UE 2019/771), à laquelle s’ajoute en France la garantie des vices cachés. Un défaut apparu dans ce délai est présumé exister au moment de la livraison : la charge de la preuve ne vous incombe pas.',
    exclusionsTitle: 'Ce que la garantie ne couvre pas',
    exclusions: [
      'Les pièces d’usure : joints de porte, vitre, brasier, bougie d’allumage.',
      'Les dommages liés à un combustible non conforme — granulés non certifiés, humides, ou d’un diamètre autre que 6 mm.',
      'Les défauts consécutifs à une installation non conforme ou à l’absence d’entretien annuel.',
    ],
  },

  legalPage: {
    title: 'Mentions légales',
    editorTitle: 'Éditeur du site',
    entity: 'Dénomination sociale',
    form: 'Forme juridique',
    capital: 'Capital social',
    registration: 'Immatriculation',
    vat: 'Numéro de TVA intracommunautaire',
    address: 'Siège social',
    director: 'Responsable de la publication',
    contactTitle: 'Contact',
    hostTitle: 'Hébergeur',
    mediationTitle: 'Médiation de la consommation',
    mediationText:
      'Conformément à l’article L.612-1 du code de la consommation, vous pouvez recourir gratuitement au médiateur de la consommation dont les coordonnées figurent ci-dessous, en cas de litige non résolu par notre service client.',
    ipTitle: 'Propriété intellectuelle',
    ipText:
      'Les textes de ce site sont la propriété de l’éditeur. Les marques, dénominations commerciales et visuels des fabricants restent la propriété de leurs titulaires respectifs et sont utilisés dans le cadre de la revente de leurs produits.',
    toComplete: 'À compléter avant la mise en ligne commerciale.',
  },

  terms: {
    title: 'Conditions générales de vente',
    lead: 'Version applicable aux commandes passées sur ce site.',
    toComplete:
      'Ce document est un modèle de travail. Faites-le relire par un juriste avant la première vente : les mentions obligatoires varient selon le pays de destination, et une clause abusive est réputée non écrite.',
    sections: [
      {
        heading: '1. Objet et champ d’application',
        body: 'Les présentes conditions régissent la vente d’appareils de chauffage au granulé de bois et de leurs accessoires par l’éditeur du site, à des consommateurs résidant dans l’un des pays de livraison listés dans la rubrique Livraison. Toute commande implique leur acceptation sans réserve.',
      },
      {
        heading: '2. Produits',
        body: 'Les caractéristiques essentielles des produits figurent sur chaque fiche. Elles reprennent les données communiquées par le fabricant. Les visuels illustratifs n’ont pas de valeur contractuelle lorsqu’ils sont signalés comme tels. Les produits sont conformes aux exigences des règlements UE 2015/1185 et 2015/1186 et à la norme EN 14785.',
      },
      {
        heading: '3. Prix',
        body: 'Les prix sont indiqués en euros, toutes taxes comprises, hors frais de livraison. Les frais de livraison sont affichés avant la validation de la commande et dépendent de la zone de destination et de la nature de l’envoi. Le vendeur se réserve le droit de modifier ses prix à tout moment, le prix applicable étant celui en vigueur au moment de la commande.',
      },
      {
        heading: '4. Commande et paiement',
        body: 'La commande est ferme à compter de la réception du virement sur le compte du vendeur. Le paiement s’effectue exclusivement par virement bancaire, aux coordonnées communiquées au client lors de la commande et rappelées par courrier électronique. Aucune donnée de carte bancaire n’est collectée par le vendeur. À défaut de réception du virement dans un délai de dix jours ouvrés, la commande est annulée de plein droit et le client en est informé. Le vendeur peut refuser une commande en cas de litige antérieur, de suspicion de fraude ou d’adresse de livraison hors zone desservie.',
      },
      {
        heading: '5. Livraison',
        body: 'Les appareils sont livrés sur palette, par transporteur, après prise de rendez-vous téléphonique. La dépose s’effectue au pied du camion, sauf option de mise en place souscrite. Les délais annoncés sont des délais estimatifs en jours ouvrés, décomptés à partir de la confirmation du paiement. Le transfert des risques intervient à la remise effective du bien.',
      },
      {
        heading: '6. Réserves à la réception',
        body: 'L’acheteur doit vérifier l’état de l’emballage et du produit en présence du transporteur et consigner toute avarie par une réserve écrite, précise et manuscrite sur le bon de livraison. Il informe le vendeur dans les 48 heures, photographies à l’appui. À défaut de réserve, le recours contre le transporteur devient pratiquement impossible.',
      },
      {
        heading: '7. Droit de rétractation',
        body: 'Le consommateur dispose de quatorze jours à compter de la réception pour exercer son droit de rétractation, sans motif. Le produit doit être retourné non installé, non utilisé, dans son emballage d’origine. Les frais de retour sont à la charge de l’acheteur. Le remboursement intervient dans les quatorze jours suivant la récupération du bien.',
      },
      {
        heading: '8. Garanties',
        body: 'Tous les produits bénéficient de la garantie légale de conformité de deux ans et, en France, de la garantie des vices cachés. La garantie commerciale éventuellement accordée par le fabricant s’y ajoute sans s’y substituer. Les pièces d’usure et les dommages résultant d’une installation non conforme, d’un combustible non certifié ou d’un défaut d’entretien sont exclus.',
      },
      {
        heading: '9. Installation',
        body: 'La vente ne comprend ni l’installation, ni le raccordement, ni la mise en service. Ces opérations relèvent d’un professionnel qualifié et doivent respecter la réglementation applicable au lieu d’installation. Le vendeur ne peut être tenu responsable des conséquences d’une installation non conforme.',
      },
      {
        heading: '10. Données personnelles',
        body: 'Les données collectées sont traitées conformément au règlement UE 2016/679. Le détail des traitements, des durées de conservation et des droits de la personne concernée figure dans la politique de confidentialité.',
      },
      {
        heading: '11. Droit applicable et litiges',
        body: 'Le contrat est soumis au droit français, sans que cela prive le consommateur de la protection que lui accordent les dispositions impératives du droit de son pays de résidence. En cas de litige, une solution amiable sera recherchée avant toute action judiciaire ; le consommateur peut saisir gratuitement le médiateur de la consommation.',
      },
    ],
  },

  privacy: {
    title: 'Politique de confidentialité',
    lead: 'Quelles données, pourquoi, combien de temps, et comment les faire supprimer.',
    controllerTitle: 'Responsable du traitement',
    dataTitle: 'Données collectées et finalités',
    dataRows: [
      { data: 'Nom, adresse, téléphone', purpose: 'Exécution de la commande et livraison', basis: 'Exécution du contrat', retention: '10 ans (obligation comptable)' },
      { data: 'Adresse e-mail', purpose: 'Confirmation de commande, suivi, service client', basis: 'Exécution du contrat', retention: '3 ans après le dernier contact' },
      { data: 'Détail de la commande', purpose: 'Facturation, garantie, service après-vente', basis: 'Obligation légale', retention: '10 ans' },
      { data: 'Adresse IP, journaux techniques', purpose: 'Sécurité du site, prévention de la fraude', basis: 'Intérêt légitime', retention: '12 mois' },
    ],
    dataHeaders: { data: 'Donnée', purpose: 'Finalité', basis: 'Base légale', retention: 'Conservation' },
    paymentTitle: 'Paiement',
    paymentText:
      'Le paiement s’effectue par virement bancaire, de votre banque vers celle du vendeur. Aucune donnée de carte bancaire n’est saisie sur ce site, et aucun prestataire de paiement n’intervient : les informations de votre virement sont traitées par votre banque et par celle du vendeur, selon leurs propres politiques. Le vendeur conserve le nom du titulaire du compte émetteur lorsque vous le renseignez, aux seules fins de rapprocher votre paiement de votre commande.',
    cookiesTitle: 'Cookies',
    cookiesText:
      'Ce site n’utilise aucun cookie publicitaire ni de mesure d’audience. Seul le stockage local du navigateur est utilisé, pour conserver votre panier d’une visite à l’autre : cette donnée reste sur votre appareil et ne nous est pas transmise. Aucun consentement n’est donc requis à ce titre.',
    rightsTitle: 'Vos droits',
    rightsText:
      'Vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité. Écrivez à l’adresse de contact ci-dessous : nous répondons dans un délai d’un mois. Vous pouvez également saisir l’autorité de protection des données de votre pays de résidence — en France, la CNIL.',
    transferTitle: 'Transferts hors UE',
    transferText:
      'Les données sont hébergées dans l’Union européenne. Certains sous-traitants techniques peuvent opérer depuis les États-Unis, sous couvert des clauses contractuelles types de la Commission européenne.',
  },

  footer: {
    tagline: 'Poêles à granulés hydro et à air ventilé, dimensionnés avant l’achat.',
    shopTitle: 'Boutique',
    helpTitle: 'Aide',
    legalTitle: 'Informations légales',
    languageTitle: 'Langue',
    rights: 'Tous droits réservés.',
    vatNote: 'Prix affichés TTC, TVA française de 20 % incluse. Livraison en supplément.',
    paymentNote: 'Paiement par virement bancaire',
  },

  notFound: {
    title: 'Page introuvable',
    lead: 'Cette adresse ne correspond à aucune page. Elle a peut-être changé de nom, ou le produit a été retiré du catalogue.',
    cta: 'Retour à l’accueil',
    shopCta: 'Voir les poêles',
  },

  errors: {
    genericTitle: 'Quelque chose s’est mal passé',
    genericLead: 'L’erreur a été enregistrée. Réessayez, ou écrivez-nous si elle persiste.',
    retry: 'Réessayer',
  },
  emails: {
    transferSubject: 'Commande {ref} — coordonnées pour le virement',
    transferTitle: 'Votre commande est enregistrée',
    transferLead:
      'Elle part en préparation dès que votre virement est constaté sur notre compte. Vous recevrez un second message à ce moment-là.',
    transferHow: 'Virement à effectuer',
    transferRefNotice:
      'Indiquez impérativement {ref} en libellé du virement : c’est ce qui nous permet de rattacher votre paiement à votre commande. Sans cette référence, le rapprochement se fait à la main et prend plusieurs jours.',
    transferFooter:
      'Un virement SEPA met en général un jour ouvré à arriver. Passé trois jours ouvrés sans nouvelle de notre part, écrivez-nous : il s’est probablement passé quelque chose.',
    bankAmount: 'Montant',
    bankReference: 'Référence',
    bankHolder: 'Bénéficiaire',
    bankIban: 'IBAN',
    bankBic: 'BIC',
    bankName: 'Banque',
    confirmSubject: 'Commande {ref} confirmée',
    confirmTitle: 'Commande confirmée',
    confirmLead:
      'Merci. Votre paiement est enregistré et votre commande part en préparation.',
    reference: 'Référence',
    trackCta: 'Suivre ma commande',
    confirmFooter:
      'Le transporteur vous appellera pour convenir d’un créneau de livraison. À la réception, vérifiez l’état de la palette avant de signer : toute avarie doit être notée par écrit sur le bon de livraison.',
    shippedSubject: 'Commande {ref} expédiée',
    shippedTitle: 'Votre commande est partie',
    shippedLead: 'Commande {ref} expédiée par {carrier}.',
    trackingNumber: 'Numéro de suivi',
    trackParcelCta: 'Suivre la livraison',
    shippedFooter:
      'Le suivi peut mettre quelques heures à s’activer chez le transporteur. Sans mouvement après 48 h, répondez à ce message.',
    subtotal: 'Sous-total',
    total: 'Total',
    vatLine: 'dont TVA',
    free: 'Offerte',
    defaultCarrier: 'Le transporteur',
    footerNote: 'Vous recevez ce message parce que vous avez passé commande sur {domain}.',
  },

  api: {
    notConfigured: 'Le paiement n’est pas encore configuré sur cette boutique.',
    unreadableBody: 'Requête illisible.',
    invalidCart: 'Panier invalide.',
    unknownCountry: 'Nous ne livrons pas encore en « {country} ».',
    noCheckoutUrl: 'Le prestataire de paiement n’a pas renvoyé d’adresse de paiement.',
    checkoutFailed: 'Impossible d’ouvrir le paiement. Réessayez dans un instant.',
    lookupMissingFields: 'Indiquez la référence de commande et l’adresse e-mail utilisée.',
    declareNotPending: 'Cette commande n’est plus en attente de virement.',
    lookupNotFound: 'Aucune commande ne correspond à ces informations.',
  },

};

export type Dictionary = typeof fr;

export default fr;
