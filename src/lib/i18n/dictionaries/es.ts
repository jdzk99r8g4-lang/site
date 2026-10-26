/** Dictionnaire espagnol. Typé par le contrat français : une clé manquante ne compile pas. */

import type { Dictionary } from './fr';

const es: Dictionary = {
  meta: {
    homeTitle: 'Estufas de pellets hidro y de aire ventilado — enviadas desde la UE',
    homeDescription:
      'Estufas de pellets hidro y de aire ventilado, dimensionadas antes de comprar. Entrega con cita previa en Francia y Europa, pago seguro.',
    shopTitle: 'Calefacción',
    shopDescription:
      'Estufas de pellets de aire ventilado e hidro de 6 a 24 kW. Potencia, rendimiento y superficie calentada en cada ficha.',
  },

  nav: {
    home: 'Inicio',
    shop: 'Calefacción',
    sizing: '¿Qué potencia?',
    guides: 'Guías',
    about: 'Quiénes somos',
    contact: 'Contacto',
    faq: 'Preguntas frecuentes',
    cart: 'Carrito',
    openMenu: 'Abrir el menú',
    closeMenu: 'Cerrar el menú',
    skipToContent: 'Ir al contenido',
    changeLanguage: 'Cambiar de idioma',
  },

  common: {
    addToCart: 'Añadir al carrito',
    added: '{count} en su carrito',
    addedCapped: 'Solo hemos añadido {added}: el máximo es {max} por artículo.',
    atMaxQuantity: 'Máximo alcanzado: {max} por artículo.',
    increaseQuantity: 'Aumentar la cantidad',
    decreaseQuantity: 'Disminuir la cantidad',
    viewCart: 'Ver el carrito',
    continueShopping: 'Seguir comprando',
    from: 'Desde',
    vatIncluded: 'IVA incl.',
    vatIncludedLong: 'IVA incluido, envío aparte',
    shippingExtra: 'Envío aparte',
    learnMore: 'Más información',
    viewProduct: 'Ver la ficha',
    quantity: 'Cantidad',
    remove: 'Quitar',
    subtotal: 'Subtotal',
    shipping: 'Envío',
    total: 'Total',
    of: 'de',
    save: 'Ahorre',
    loading: 'Cargando…',
    required: 'Campo obligatorio',
    email: 'Correo electrónico',
    send: 'Enviar',
    close: 'Cerrar',
    back: 'Volver',
    upTo: 'Hasta',
    seeAll: 'Ver todo',
    specifications: 'Características',
    description: 'Descripción',
    delivery: 'Entrega',
    inStock: 'En stock',
    dispatchedIn: 'Se envía en',
    businessDays: 'días laborables',
    page: 'Página',
    products: 'productos',
    product: 'producto',
    results: 'resultados',
    soon: 'Próximamente',
    sectionEmpty:
      'Esta sección se está completando. Los primeros modelos se publicarán en cuanto lleguen las fichas del proveedor.',
    noResults: 'Ningún producto coincide con estos criterios.',
    resetFilters: 'Restablecer',
    illustrationNotice:
      'Ilustración — la fotografía del modelo se publicará en cuanto recibamos las imágenes del proveedor.',
    demoBanner:
      'Catálogo en construcción: las fichas cuyas características aún no se han verificado lo indican en la cabecera. Complételas con los datos del proveedor antes de vender.',
  },

  categories: {
    pellet: 'Estufas de pellets',
    pelletShort: 'Pellets',
    pelletTagline: 'Automáticas y programables, autónomas durante días.',
    bioethanol: 'Chimeneas de bioetanol',
    bioethanolShort: 'Bioetanol',
    bioethanolTagline: 'Una llama real sin conducto ni humo. Un objeto decorativo, no una forma de calentar la casa.',
    electricfire: 'Chimeneas eléctricas',
    electricfireShort: 'Eléctricas',
    electricfireTagline: 'El efecto de un hogar con un simple enchufe, y una calefacción de apoyo de 1 a 2 kW.',
  },

  distributions: {
    all: 'Todas',
    air: 'Aire ventilado',
    airTagline: 'Calienta la estancia donde está, y las contiguas si va canalizada.',
    hydro: 'Hidro',
    hydroTagline: 'Alimenta radiadores y suelo radiante, como una caldera.',
    airChooseIf: 'Elija aire ventilado si',
    airReasons: [
      'quiere calentar una sala de estar, y quizá dos dormitorios mediante conducto',
      'no tiene circuito de calefacción central, o lo deja tal cual',
      'quiere una instalación sencilla: un conducto de humos y un enchufe',
    ],
    hydroChooseIf: 'Elija hidro si',
    hydroReasons: [
      'ya tiene radiadores o suelo radiante instalados',
      'quiere sustituir o apoyar una caldera de gasóleo o gas',
      'acepta una conexión hidráulica hecha por un profesional',
    ],
  },

  home: {
    heroEyebrow: 'Pellets, leña, calderas, bombas de calor',
    heroTitle: 'El aparato adecuado empieza por la potencia adecuada.',
    heroLead:
      'Un aparato sobredimensionado funciona al ralentí, se ensucia y le obliga a abrir las ventanas. Uno infradimensionado va a tope y no mantiene la casa. Empezamos pues por el cálculo, y después por el aparato.',
    heroCtaPrimary: 'Calcular mi potencia',
    heroCtaSecondary: 'Ver toda la calefacción',
    heroStatOne: 'de 6 a 24 kW',
    heroStatOneLabel: 'diez secciones de calefacción',
    heroStatTwo: 'hasta 92 %',
    heroStatTwoLabel: 'de rendimiento declarado',
    heroStatThree: '4 a 8 días',
    heroStatThreeLabel: 'entrega con cita previa',

    familiesTitle: 'Ocho familias de aparatos',
    familiesLead:
      'Cada una responde a una instalación y a un presupuesto distintos. Empiece por lo que quiere instalar.',

    featuredTitle: 'Los modelos más solicitados',
    featuredLead: 'Cuatro aparatos que cubren la mayoría de las configuraciones.',

    sizingTitle: '¿Cuántos kilovatios para su casa?',
    sizingLead:
      'Superficie, altura de techo, aislamiento, zona climática: cuatro datos bastan para acotar la potencia. El cálculo lleva menos de un minuto y evita el error más caro de esta compra.',
    sizingCta: 'Abrir la calculadora',

    whyTitle: 'Lo que hacemos distinto',
    whyItems: [
      {
        title: 'El dimensionado antes de la venta',
        text: 'La calculadora es de acceso libre y su resultado puede perfectamente llevarle a un modelo más barato. Es la intención: un aparato mal dimensionado acaba en devolución, y una devolución de 200 kg cuesta más que el margen.',
      },
      {
        title: 'Las condiciones de entrega por escrito',
        text: 'Camión con plataforma, descarga a pie de camión, franja acordada por teléfono. Sabe antes de pagar que hará falta dos personas para meter el aparato — o contrata la opción de colocación.',
      },
      {
        title: 'Ninguna promesa de ahorro con cifras',
        text: 'Su ahorro depende de su consumo actual, del precio que paga por la energía y del precio del pellet, que varía de una temporada a otra. Damos el método de cálculo, no un porcentaje inventado.',
      },
      {
        title: 'La instalación es del profesional',
        text: 'Vendemos el aparato y el conducto, no la instalación. La conexión condiciona su seguro y, en Francia, el acceso a las ayudas: debe hacerla un instalador cualificado.',
      },
    ],

    processTitle: 'Cómo se desarrolla un pedido',
    processSteps: [
      { title: 'Usted calcula la potencia', text: 'La calculadora da un rango en kW y los modelos que entran en él.' },
      { title: 'Pide en línea', text: 'Paga mediante transferencia bancaria, con los datos y la referencia facilitados con su pedido. Nunca se le piden datos de tarjeta.' },
      { title: 'El transportista le llama', text: 'En 2 a 4 días laborables, para acordar una franja de entrega.' },
      { title: 'Hace instalar el aparato', text: 'Por un instalador cualificado. Facilitamos la ficha técnica y el esquema de conexión.' },
    ],

    guidesTitle: 'Para leer antes de elegir',
    guidesLead: 'Tres textos que responden a las preguntas más frecuentes.',

    supportTitle: '¿Dudas sobre el modelo o el conducto?',
    supportLead:
      'Escríbanos el plano de la estancia, la superficie, la altura de techo y el año de construcción. Respondemos por escrito, en un día laborable.',
    supportCta: 'Hacer una pregunta',
  },

  shop: {
    title: 'Toda la calefacción',
    lead: 'Doce referencias, de 6 a 24 kW. Las características indicadas son las de las fichas técnicas del proveedor.',
    filterCategory: 'Familia',
    filterAll: 'Todas',
    filterPower: 'Potencia',
    filterArea: 'Superficie a calentar',
    sortBy: 'Ordenar por',
    sortPowerAsc: 'Potencia, de menor a mayor',
    sortPowerDesc: 'Potencia, de mayor a menor',
    sortPriceAsc: 'Precio, de menor a mayor',
    sortPriceDesc: 'Precio, de mayor a menor',
    anyPower: 'Todas las potencias',
    anyArea: 'Todas las superficies',
  },

  product: {
    backToShop: 'Volver a las estufas',
    chooseVariant: 'Acabado',
    keyPoints: 'Lo esencial',
    techSheet: 'Ficha técnica',
    deliveryTitle: 'Entrega y recepción',
    deliveryFreight:
      'Aparato enviado en palet. El transportista llama para acordar una franja. La descarga es a pie de camión: prevea dos personas, o elija la opción de colocación al pagar.',
    deliveryParcel: 'Enviado como paquete con seguimiento, en mano o en punto de recogida.',
    installTitle: 'Instalación',
    installText:
      'La colocación y la conexión al conducto de humos deben realizarlas un profesional cualificado. Facilitamos la ficha técnica, el esquema de conexión y la declaración de prestaciones.',
    unverifiedNotice:
      'Características de demostración: los valores de esta ficha son ficticios y deben sustituirse por la documentación del fabricante.',
    crossSellTitle: 'Se pide a menudo con',
    powerRange: 'Potencia modulable',
    heatedArea: 'Superficie calentada',
    waterPower: 'de los cuales al agua',
    efficiency: 'Rendimiento',
    energyClass: 'Clase',
    sizingHint: 'Compruebe que esta potencia le conviene',
    compareTitle: 'Comparar con modelos próximos',
    ductedOutlets: 'Salidas canalizables',
    dhwYes: 'Agua caliente sanitaria incluida',
  },

  sizing: {
    title: 'Calculadora de potencia',
    lead:
      'Cuatro preguntas para obtener un rango de potencia utilizable. Es una estimación previa, no un estudio térmico.',
    areaLabel: 'Superficie a calentar',
    areaUnit: 'm²',
    heightLabel: 'Altura de techo',
    heightUnit: 'm',
    insulationLabel: 'Aislamiento',
    insulationPoor: 'Escaso — antes de 1975, vidrio simple, cubierta sin aislar',
    insulationAverage: 'Medio — aislamiento parcial, doble vidrio',
    insulationGood: 'Bueno — posterior a 2005 o reforma completa',
    insulationExcellent: 'Muy bueno — baja energía o pasivo',
    climateLabel: 'Zona climática',
    climateMild: 'Suave — litoral atlántico, franja mediterránea',
    climateTemperate: 'Templada — llanura, la gran mayoría de los casos',
    climateCold: 'Fría — montaña, interior continental',
    resultTitle: 'Potencia a buscar',
    resultRange: 'Rango recomendado',
    resultExplain:
      'Elija un aparato cuya potencia NOMINAL máxima quede dentro de este rango. Una estufa cuyo máximo supere ampliamente la necesidad pasará la vida al mínimo, lo que ensucia el cristal y el cestillo.',
    resultModels: 'Modelos que entran en este rango',
    resultNone: 'Ningún modelo del catálogo cubre esta necesidad. Escríbanos: por encima de 24 kW hace falta una caldera de pellets y no una estufa.',
    methodTitle: 'El método empleado',
    methodText:
      'El volumen a calentar se multiplica por un coeficiente de pérdidas que depende del aislamiento, y luego se corrige según la zona climática. Los coeficientes utilizados (de 0,025 a 0,055 kW por m³) corresponden a los órdenes de magnitud habituales en un predimensionado.',
    disclaimerTitle: 'Lo que este cálculo no sustituye',
    disclaimerText:
      'Un estudio térmico tiene en cuenta los puentes térmicos, la orientación, la renovación de aire, la superficie acristalada y la temperatura de confort buscada. Si sustituye un generador principal, y en cualquier estufa hidro, haga verificar el resultado por su instalador antes de pedir: es él quien responde del dimensionado.',
    volumeComputed: 'Volumen estimado',
    recompute: 'Recalcular',
  },

  cart: {
    title: 'Su carrito',
    empty: 'Su carrito está vacío.',
    emptyCta: 'Descubrir las estufas',
    lineTotal: 'Total línea',
    countryLabel: 'País de entrega',
    rateLabel: 'Modo de entrega',
    freeShippingProgress: 'Faltan {amount} para el envío gratuito',
    freeShippingReached: 'Envío gratuito en este pedido',
    checkout: 'Realizar el pedido',
    checkoutPending: 'Registrando…',
    vatLine: 'del cual IVA',
    estimatedDelivery: 'Entrega estimada',
    canceled: 'Pago interrumpido. Su carrito se ha conservado.',
    error: 'No se ha podido abrir el pago. Inténtelo de nuevo en un momento.',
    securedBy: 'Pago por transferencia. En este sitio no se le piden datos bancarios.',
    freightNotice:
      'Su carrito contiene un aparato que se envía en palet: la entrega es con cita previa, a pie de camión.',
  },

  checkout: {
    title: 'Su pedido',
    lead: 'Revise su carrito, déjenos sus datos y pague por transferencia.',

    detailsTitle: 'Sus datos',
    detailsLead:
      'Sirven para la entrega y para mantenerle informado. Un aparato se envía en palet: el transportista llama antes de desplazarse.',
    firstName: 'Nombre',
    lastName: 'Apellidos',
    email: 'Correo electrónico',
    phone: 'Teléfono',
    phoneHint: 'Imprescindible: el transportista llama para acordar una franja horaria.',
    addressTitle: 'Dirección de entrega',
    line1: 'Dirección',
    line2: 'Complemento (edificio, piso, código)',
    postalCode: 'Código postal',
    city: 'Población',
    shippingTitle: 'Modo de entrega',

    transferTitle: 'Sobre la transferencia',
    transferLead:
      'Si la transferencia sale de una cuenta a otro nombre, indíquelo aquí: sin ese dato no podemos vincular su pago con su pedido.',
    transferHolder: 'Titular de la cuenta emisora',
    transferHolderHint: 'Rellénelo solo si no es usted.',

    summaryTitle: 'Resumen',
    submit: 'Registrar mi pedido',
    submitPending: 'Registrando…',
    submitNote:
      'No se carga nada: la transferencia la hace usted desde su banco. Su pedido entra en preparación en cuanto llega.',
    error: 'El pedido no se ha podido registrar. Inténtelo de nuevo en un momento.',

    bankRefLater: 'Su referencia de pedido aparecerá en el paso siguiente: es la que debe indicar en el concepto de la transferencia.',
    bankMissing:
      'Los datos bancarios aún no están configurados en este sitio: no es posible pedir por el momento.',

    declareCta: 'He realizado la transferencia',
    declarePending: 'Registrando…',
    declareDone: 'Gracias. Comprobamos nuestra cuenta y le escribimos en cuanto aparezca, por lo general en un día hábil.',
    declareHint: 'Pulse una vez enviada la transferencia desde su banco. Así sabemos cuándo mirar la cuenta.',
    declareError: 'Su aviso no se ha podido registrar. Inténtelo de nuevo en un momento.',
    declaredOn: 'Transferencia declarada el',
    placedEyebrow: 'Pedido registrado',
    placedTitle: 'Solo queda hacer la transferencia',
    placedLead:
      'Su pedido está a la espera de pago. Entra en preparación en cuanto la transferencia llegue a nuestra cuenta, por lo general en un día hábil.',
    placedEmail: 'Acabamos de enviar un resumen con estos datos a {email}.',
    printCta: 'Imprimir o guardar',

    reference: 'Referencia de pedido',
    nextStepsTitle: 'Qué ocurre ahora',
    nextSteps: [
      'Usted hace la transferencia desde su banco, indicando su referencia.',
      'Confirmamos la recepción y trasladamos su pedido al proveedor.',
      'Recibe el número de seguimiento en cuanto el transportista lo recoge.',
      'El día de la entrega, revise el palet antes de firmar: cualquier reserva debe constar por escrito en el albarán.',
    ],
    damageTitle: 'Importante en la recepción',
    damageText:
      'Un aparato de 200 kg puede sufrir durante el transporte. Desembale delante del conductor si es posible y, en caso de golpe, anote una reserva precisa y manuscrita en el albarán. Sin reserva escrita, reclamar al transportista resulta muy difícil.',
    trackCta: 'Seguir mi pedido',
  },

  tracking: {
    title: 'Seguir mi pedido',
    lead: 'Introduzca la referencia del pedido y el correo utilizado en el pago.',
    refLabel: 'Referencia del pedido',
    refPlaceholder: 'PEL-XXXXXX',
    submit: 'Mostrar mi pedido',
    notFound: 'Ningún pedido coincide con estos datos.',
    statusLabel: 'Estado',
    placedOn: 'Pedido el',
    itemsLabel: 'Artículos',
    carrierLabel: 'Transportista',
    trackingNumber: 'Número de seguimiento',
    statuses: {
      awaiting_transfer: 'A la espera de su transferencia',
      confirmed: 'Transferencia recibida — pedido en preparación',
      shipped: 'En camino',
      delivered: 'Entregado',
      cancelled: 'Anulado',
    },
  },

  guides: {
    title: 'Guías',
    lead: 'Lo que conviene entender antes de elegir una estufa de pellets, escrito sin atajos comerciales.',
    readingTime: 'min de lectura',
    updated: 'Actualizado el',
    relatedProducts: 'Modelos afectados',
    backToGuides: 'Todas las guías',
  },

  about: {
    title: 'Quiénes somos',
    lead: 'Una tienda de calefacción de leña, pellets y electricidad.',
    body: [
      'Pellora cubre ocho familias de aparatos — estufas de pellets y de leña, cocinas, calderas, insertables, bombas de calor, conductos y accesorios — a las que se añaden dos secciones de hogares decorativos, bioetanol y eléctricos, que presentamos como tales: no calientan una casa. Cada ficha se redacta a partir de la documentación del fabricante, y lleva una mención visible mientras no sea así. Un catálogo de trescientos aparatos obliga a copiar las fichas del proveedor sin leerlas; preferimos saber lo que vendemos, y poder decir cuándo un modelo no conviene.',
      'Trabajamos en dropshipping: los aparatos salen de los almacenes europeos de nuestros proveedores, sin pasar por un stock intermedio. La ventaja para usted es el precio, ya que no hay sala de exposición que financiar. El inconveniente es que no podemos mostrarle el aparato antes de la compra — lo compensamos con fichas técnicas completas y un derecho de desistimiento de 14 días que se aplica plenamente.',
      'Lo que no hacemos: la instalación, el mantenimiento anual y las reparaciones. Son oficios regulados que exigen presencia local. Suministramos el aparato, su documentación y su conducto; su instalador hace el resto, y es mejor así tanto para su seguro como para su garantía.',
    ],
    valuesTitle: 'Nuestras tres reglas',
    values: [
      { title: 'Ninguna cifra que no podamos documentar', text: 'Las características mostradas provienen de las fichas técnicas del proveedor. Cuando damos un orden de magnitud, lo decimos.' },
      { title: 'Ninguna urgencia falsa', text: 'Sin cuentas atrás, sin «solo quedan 2» generados al azar. Las existencias reales vienen del proveedor.' },
      { title: 'Nunca vender contra el interés del cliente', text: 'Si la calculadora indica 8 kW, no le vendemos 15 kW. Un aparato sobredimensionado acaba devuelto.' },
    ],
  },

  contact: {
    title: 'Contacto',
    lead: 'Para una duda de dimensionado, indique la superficie, la altura de techo, el año de construcción y el tipo de calefacción existente: así la primera respuesta ya será útil.',
    emailLabel: 'Correo electrónico',
    phoneLabel: 'Teléfono',
    hoursLabel: 'Horario',
    hoursValue: 'De lunes a viernes, 9 – 18 h (CET)',
    responseLabel: 'Plazo de respuesta',
    responseValue: 'Un día laborable',
    formTitle: 'Escribir un mensaje',
    nameLabel: 'Nombre',
    messageLabel: 'Mensaje',
    messagePlaceholder: 'Superficie, altura de techo, año de construcción, calefacción actual…',
    submit: 'Enviar el mensaje',
    sent: 'Mensaje enviado. Respondemos en un día laborable.',
    failed: 'El envío ha fallado. Escríbanos directamente por correo.',
    mailtoHint: 'El formulario abre su programa de correo con el mensaje ya redactado.',
  },

  faq: {
    title: 'Preguntas frecuentes',
    lead: 'Las preguntas que se repiten, con respuestas que no esquivan los puntos incómodos.',
    items: [
      {
        q: '¿Qué diferencia concreta hay entre una estufa hidro y una de aire ventilado?',
        a: 'Una estufa de aire calienta el aire de la estancia donde está, y puede enviar parte de él a dos habitaciones contiguas si está canalizada. Una estufa hidro calienta agua, que envía a sus radiadores o a su suelo radiante: sustituye o apoya a una caldera. La primera necesita un conducto de humos y un enchufe; la segunda necesita además una conexión hidráulica hecha por un profesional.',
      },
      {
        q: '¿Pueden instalar la estufa?',
        a: 'No. Vendemos el aparato, su documentación y su conducto. La instalación es un oficio regulado que exige presencia local, y la conexión condiciona su seguro de hogar. Recurra a un instalador cualificado cerca de usted — en Francia, además, la cualificación RGE es necesaria para la mayoría de las ayudas públicas.',
      },
      {
        q: '¿Cuánto voy a ahorrar respecto a mi calefacción actual?',
        a: 'No damos una cifra, porque una cifra honesta no existe sin conocer su consumo real, el precio que paga hoy por la energía y el precio del pellet en su zona. Las tres varían, y la última mucho. El método está en nuestras guías: tome su consumo anual en kWh, divida por el rendimiento de su aparato actual, convierta a kilos de pellet y multiplique por el precio del saco cerca de su casa.',
      },
      {
        q: '¿Cuál es el plazo de entrega?',
        a: 'Cuente 2 a 5 días laborables de expedición según el modelo, y después 4 a 8 días laborables de transporte en Francia, algo más en el resto de Europa. El plazo exacto figura en cada ficha de producto. El transportista le llama para acordar una franja — un palet no se deja sin que haya alguien.',
      },
      {
        q: '¿Qué ocurre si el aparato llega dañado?',
        a: 'Anote una reserva escrita y precisa en el albarán, delante del conductor, y escríbanos con fotos en un plazo de 48 horas. Nos hacemos cargo de la reclamación al transportista. Sin reserva escrita en el momento de la entrega, reclamar resulta muy difícil: por eso insistimos tanto en este punto.',
      },
      {
        q: '¿Puedo devolver una estufa que no me conviene?',
        a: 'Sí, dentro de los 14 días siguientes a la recepción, en virtud del derecho de desistimiento (Directiva 2011/83/UE). El aparato debe estar sin instalar y reembalado en su embalaje original. Los gastos de devolución corren a su cargo y, en un aparato paletizado, son elevados — por eso preferimos comprobar el dimensionado antes del pedido que después.',
      },
      {
        q: '¿Funciona la estufa durante un corte de luz?',
        a: 'No. El tornillo de alimentación, el encendedor y el extractor de humos son eléctricos: sin corriente el aparato se detiene y la seguridad entra en fallo. Si los cortes son frecuentes en su zona, prevea un SAI dimensionado para el extractor, o mantenga un apoyo independiente de la red.',
      },
      {
        q: '¿Qué cantidad de pellet hay que prever por temporada?',
        a: 'El orden de magnitud habitual es de 1 a 2 toneladas por temporada para una casa de 100 a 150 m², pero la diferencia entre esos dos límites es enorme y depende de su aislamiento, de su temperatura de consigna y de la crudeza del invierno. Empiece con una tonelada y ajuste en la segunda temporada con sus propias mediciones.',
      },
    ],
  },

  shippingPage: {
    title: 'Envío',
    lead: 'Las condiciones reales, incluidas las que exigen organización por su parte.',
    zonesTitle: 'Zonas y tarifas',
    zoneHeader: 'Zona',
    countriesHeader: 'Países',
    freightHeader: 'Palet (aparatos)',
    parcelHeader: 'Paquete (accesorios)',
    freeHeader: 'Envío gratuito desde',
    delayHeader: 'Plazo de transporte',
    freightTitle: 'Cómo se desarrolla una entrega en palet',
    freightSteps: [
      'El proveedor envía el aparato en palet retractilado desde su almacén europeo.',
      'El transportista llama al número indicado en el pedido para acordar una franja de entrega.',
      'El camión llega con plataforma elevadora. La descarga es a pie de camión, sobre una superficie accesible y estable.',
      'Usted comprueba el estado del palet y firma — con reservas escritas si hay el menor golpe.',
      'Usted mete el aparato: prevea dos personas y una carretilla, o elija la opción de colocación.',
    ],
    accessTitle: 'Compruebe el acceso antes de pedir',
    accessText:
      'Un camión de transporte paletizado mide 10 a 12 m de largo. Si su calle es estrecha, con mucha pendiente, peatonal o con limitación de tonelaje, indíquelo en el pedido: el transportista organizará la entrega en un vehículo más pequeño, lo que suele añadir dos o tres días.',
    indoorTitle: 'Opción de colocación',
    indoorText:
      'Por 119 €, el equipo de entrega deja el aparato en la estancia que elija en la planta baja, siempre que el paso sea practicable. No incluye el desembalaje, ni la conexión, ni la retirada del aparato antiguo.',
  },

  returns: {
    title: 'Devoluciones y desistimiento',
    lead: 'Sus derechos, y las limitaciones propias de un aparato de 200 kg.',
    rightTitle: 'Derecho de desistimiento: 14 días',
    rightText:
      'Dispone de catorce días desde la recepción para renunciar a su compra, sin tener que justificarse (Directiva 2011/83/UE). Avísenos por escrito dentro de ese plazo y devuelva el aparato en los catorce días siguientes.',
    conditionsTitle: 'Condiciones a respetar',
    conditions: [
      'El aparato no debe haber sido instalado, conectado ni puesto en marcha.',
      'Debe volver en su embalaje original, sobre su palet, con todos sus accesorios y su documentación.',
      'Los gastos de devolución corren a su cargo. En un aparato paletizado, cuente 90 a 180 € según la zona: le damos el presupuesto exacto antes de la recogida.',
      'El reembolso se efectúa en catorce días tras la recepción y el control del aparato, por el medio de pago original.',
    ],
    damagedTitle: 'Aparato dañado en el transporte',
    damagedText:
      'Anote una reserva escrita, precisa y manuscrita en el albarán, delante del conductor — «caja dañada» no basta, describa el daño. Envíenos después fotos del embalaje y del aparato en un plazo de 48 horas. Nos hacemos cargo de la reclamación y le reexpedimos un aparato sin coste.',
    warrantyTitle: 'Garantía legal',
    warrantyText:
      'Todos los aparatos cuentan con la garantía legal de conformidad de dos años (Directiva UE 2019/771), a la que el derecho francés añade la garantía por vicios ocultos. Un defecto aparecido en ese plazo se presume existente en el momento de la entrega: la carga de la prueba no le corresponde a usted.',
    exclusionsTitle: 'Lo que la garantía no cubre',
    exclusions: [
      'Las piezas de desgaste: juntas de puerta, cristal, cestillo, resistencia de encendido.',
      'Los daños debidos a un combustible no conforme — pellets no certificados, húmedos, o de un diámetro distinto de 6 mm.',
      'Los defectos derivados de una instalación no conforme o de la falta de mantenimiento anual.',
    ],
  },

  legalPage: {
    title: 'Aviso legal',
    editorTitle: 'Editor del sitio',
    entity: 'Denominación social',
    form: 'Forma jurídica',
    capital: 'Capital social',
    registration: 'Inscripción',
    vat: 'Número de IVA intracomunitario',
    address: 'Domicilio social',
    director: 'Responsable de la publicación',
    contactTitle: 'Contacto',
    hostTitle: 'Proveedor de alojamiento',
    mediationTitle: 'Mediación de consumo',
    mediationText:
      'Conforme al artículo L.612-1 del código de consumo francés, puede recurrir gratuitamente al mediador de consumo cuyos datos figuran a continuación, en caso de litigio no resuelto por nuestro servicio de atención al cliente.',
    ipTitle: 'Propiedad intelectual',
    ipText:
      'Los textos de este sitio son propiedad del editor. Las marcas, denominaciones comerciales e imágenes de los fabricantes siguen siendo propiedad de sus titulares respectivos y se utilizan en el marco de la reventa de sus productos.',
    toComplete: 'A completar antes de la puesta en marcha comercial.',
  },

  terms: {
    title: 'Condiciones generales de venta',
    lead: 'Versión aplicable a los pedidos realizados en este sitio.',
    toComplete:
      'Este documento es un modelo de trabajo. Hágalo revisar por un jurista antes de la primera venta: las menciones obligatorias varían según el país de destino, y una cláusula abusiva se tiene por no puesta.',
    sections: [
      {
        heading: '1. Objeto y ámbito de aplicación',
        body: 'Las presentes condiciones rigen la venta de aparatos de calefacción con pellets de madera y de sus accesorios por el editor del sitio, a consumidores residentes en uno de los países de entrega indicados en la sección Envío. Todo pedido implica su aceptación sin reservas.',
      },
      {
        heading: '2. Productos',
        body: 'Las características esenciales de los productos figuran en cada ficha. Reproducen los datos facilitados por el fabricante. Las imágenes ilustrativas no tienen valor contractual cuando se señalan como tales. Los productos cumplen las exigencias de los reglamentos UE 2015/1185 y 2015/1186 y la norma EN 14785.',
      },
      {
        heading: '3. Precios',
        body: 'Los precios se indican en euros, con todos los impuestos incluidos, sin los gastos de envío. Los gastos de envío se muestran antes de la validación del pedido y dependen de la zona de destino y de la naturaleza del envío. El vendedor se reserva el derecho de modificar sus precios en cualquier momento, siendo aplicable el precio vigente en el momento del pedido.',
      },
      {
        heading: '4. Pedido y pago',
        body: 'El pedido es firme desde la recepción de la transferencia en la cuenta del vendedor. El pago se efectúa exclusivamente por transferencia bancaria, a los datos comunicados al cliente al realizar el pedido y recordados por correo electrónico. El vendedor no recoge ningún dato de tarjeta bancaria. De no recibirse la transferencia en un plazo de diez días hábiles, el pedido queda anulado de pleno derecho y se informa al cliente. El vendedor puede rechazar un pedido en caso de litigio anterior, sospecha de fraude o dirección de entrega fuera de la zona servida.',
      },
      {
        heading: '5. Entrega',
        body: 'Los aparatos se entregan en palet, por transportista, previa cita telefónica. La descarga se efectúa a pie de camión, salvo que se haya contratado la opción de colocación. Los plazos indicados son estimativos, en días laborables, contados desde la confirmación del pago. La transmisión del riesgo se produce en la entrega efectiva del bien.',
      },
      {
        heading: '6. Reservas en la recepción',
        body: 'El comprador debe comprobar el estado del embalaje y del producto en presencia del transportista y consignar cualquier avería mediante una reserva escrita, precisa y manuscrita en el albarán. Informa al vendedor en un plazo de 48 horas, con fotografías. Sin reserva, la reclamación al transportista resulta prácticamente imposible.',
      },
      {
        heading: '7. Derecho de desistimiento',
        body: 'El consumidor dispone de catorce días desde la recepción para ejercer su derecho de desistimiento, sin motivo. El producto debe devolverse sin instalar, sin usar y en su embalaje original. Los gastos de devolución corren a cargo del comprador. El reembolso se efectúa en los catorce días siguientes a la recuperación del bien.',
      },
      {
        heading: '8. Garantías',
        body: 'Todos los productos cuentan con la garantía legal de conformidad de dos años y, conforme al derecho francés, con la garantía por vicios ocultos. La garantía comercial que eventualmente conceda el fabricante se añade a ellas sin sustituirlas. Quedan excluidas las piezas de desgaste y los daños derivados de una instalación no conforme, de un combustible no certificado o de una falta de mantenimiento.',
      },
      {
        heading: '9. Instalación',
        body: 'La venta no incluye la instalación, ni la conexión, ni la puesta en servicio. Estas operaciones corresponden a un profesional cualificado y deben respetar la normativa aplicable en el lugar de instalación. El vendedor no puede ser considerado responsable de las consecuencias de una instalación no conforme.',
      },
      {
        heading: '10. Datos personales',
        body: 'Los datos recogidos se tratan conforme al reglamento UE 2016/679. El detalle de los tratamientos, los plazos de conservación y los derechos del interesado figuran en la política de privacidad.',
      },
      {
        heading: '11. Derecho aplicable y litigios',
        body: 'El contrato se somete al derecho francés, sin que ello prive al consumidor de la protección que le otorgan las disposiciones imperativas del derecho de su país de residencia. En caso de litigio se buscará una solución amistosa antes de cualquier acción judicial; el consumidor puede recurrir gratuitamente al mediador de consumo.',
      },
    ],
  },

  privacy: {
    title: 'Política de privacidad',
    lead: 'Qué datos, por qué, cuánto tiempo, y cómo hacerlos suprimir.',
    controllerTitle: 'Responsable del tratamiento',
    dataTitle: 'Datos recogidos y finalidades',
    dataRows: [
      { data: 'Nombre, dirección, teléfono', purpose: 'Ejecución del pedido y entrega', basis: 'Ejecución del contrato', retention: '10 años (obligación contable)' },
      { data: 'Correo electrónico', purpose: 'Confirmación del pedido, seguimiento, atención al cliente', basis: 'Ejecución del contrato', retention: '3 años tras el último contacto' },
      { data: 'Detalle del pedido', purpose: 'Facturación, garantía, posventa', basis: 'Obligación legal', retention: '10 años' },
      { data: 'Dirección IP, registros técnicos', purpose: 'Seguridad del sitio, prevención del fraude', basis: 'Interés legítimo', retention: '12 meses' },
    ],
    dataHeaders: { data: 'Dato', purpose: 'Finalidad', basis: 'Base legal', retention: 'Conservación' },
    paymentTitle: 'Pago',
    paymentText:
      'El pago se efectúa por transferencia bancaria, de su banco al del vendedor. En este sitio no se introduce ningún dato de tarjeta y no interviene ningún proveedor de pagos: los datos de su transferencia los tratan su banco y el del vendedor, según sus propias políticas. El vendedor conserva el nombre del titular de la cuenta emisora, cuando usted lo facilita, con el único fin de vincular su pago con su pedido.',
    cookiesTitle: 'Cookies',
    cookiesText:
      'Este sitio no utiliza ninguna cookie publicitaria ni de medición de audiencia. Solo se usa el almacenamiento local del navegador, para conservar su carrito entre visitas: ese dato permanece en su dispositivo y no se nos transmite. Por tanto, no se requiere consentimiento por este motivo.',
    rightsTitle: 'Sus derechos',
    rightsText:
      'Tiene derecho de acceso, rectificación, supresión, limitación, oposición y portabilidad. Escriba a la dirección de contacto que figura abajo: respondemos en el plazo de un mes. También puede dirigirse a la autoridad de protección de datos de su país de residencia.',
    transferTitle: 'Transferencias fuera de la UE',
    transferText:
      'Los datos se alojan en la Unión Europea. Algunos subencargados técnicos pueden operar desde Estados Unidos, al amparo de las cláusulas contractuales tipo de la Comisión Europea.',
  },

  footer: {
    tagline: 'Estufas de pellets hidro y de aire ventilado, dimensionadas antes de comprar.',
    shopTitle: 'Tienda',
    helpTitle: 'Ayuda',
    legalTitle: 'Información legal',
    languageTitle: 'Idioma',
    rights: 'Todos los derechos reservados.',
    vatNote: 'Precios con IVA francés del 20 % incluido. Envío aparte.',
    paymentNote: 'Pago por transferencia bancaria',
  },

  notFound: {
    title: 'Página no encontrada',
    lead: 'Esta dirección no corresponde a ninguna página. Puede haber cambiado de nombre, o el producto se ha retirado del catálogo.',
    cta: 'Volver al inicio',
    shopCta: 'Ver las estufas',
  },

  errors: {
    genericTitle: 'Algo ha ido mal',
    genericLead: 'El error se ha registrado. Inténtelo de nuevo, o escríbanos si persiste.',
    retry: 'Reintentar',
  },
  emails: {
    transferSubject: 'Pedido {ref} — datos para la transferencia',
    transferTitle: 'Su pedido está registrado',
    transferLead:
      'Entra en preparación en cuanto su transferencia llegue a nuestra cuenta. Recibirá un segundo mensaje en ese momento.',
    transferHow: 'Transferencia a realizar',
    transferRefNotice:
      'Indique obligatoriamente {ref} en el concepto de la transferencia: es lo que nos permite vincular su pago con su pedido. Sin esa referencia, la conciliación se hace a mano y tarda varios días.',
    transferFooter:
      'Una transferencia SEPA suele llegar en un día hábil. Si pasados tres días hábiles no tiene noticias nuestras, escríbanos: probablemente algo ha fallado.',
    bankAmount: 'Importe',
    bankReference: 'Referencia',
    bankHolder: 'Beneficiario',
    bankIban: 'IBAN',
    bankBic: 'BIC',
    bankName: 'Banco',
    confirmSubject: 'Pedido {ref} confirmado',
    confirmTitle: 'Pedido confirmado',
    confirmLead: 'Gracias. Su pago está registrado y su pedido entra en preparación.',
    reference: 'Referencia',
    trackCta: 'Seguir mi pedido',
    confirmFooter:
      'El transportista le llamará para acordar una franja de entrega. En la recepción, compruebe el estado del palet antes de firmar: toda avería debe anotarse por escrito en el albarán.',
    shippedSubject: 'Pedido {ref} enviado',
    shippedTitle: 'Su pedido ha salido',
    shippedLead: 'Pedido {ref} enviado por {carrier}.',
    trackingNumber: 'Número de seguimiento',
    trackParcelCta: 'Seguir la entrega',
    shippedFooter:
      'El seguimiento puede tardar unas horas en activarse en el transportista. Si no hay movimiento tras 48 h, responda a este mensaje.',
    subtotal: 'Subtotal',
    total: 'Total',
    vatLine: 'del cual IVA',
    free: 'Gratuito',
    defaultCarrier: 'El transportista',
    footerNote: 'Recibe este mensaje porque ha realizado un pedido en {domain}.',
  },

  api: {
    notConfigured: 'El pago aún no está configurado en esta tienda.',
    unreadableBody: 'Solicitud ilegible.',
    invalidCart: 'Carrito no válido.',
    unknownCountry: 'Todavía no entregamos en «{country}».',
    noCheckoutUrl: 'El proveedor de pago no ha devuelto una dirección de pago.',
    checkoutFailed: 'No se ha podido abrir el pago. Inténtelo de nuevo en un momento.',
    lookupMissingFields: 'Indique la referencia del pedido y el correo utilizado.',
    declareNotPending: 'Este pedido ya no está a la espera de una transferencia.',
    lookupNotFound: 'Ningún pedido coincide con estos datos.',
  },

};

export default es;
