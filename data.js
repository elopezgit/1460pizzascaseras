// ─── CONFIGURACIÓN DE LA MARCA ─────────────────────────────────────────────
const SUPABASE_URL = 'https://koirnjsbkwqqeyusmbgq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_VuzjOCnvBEuufNsyrK8gCw_GCFPwBqL';
const EMPRESA_ID = '3a9972e1-d620-4074-9922-0e06cae36f68';

const BRAND = {
  name: '14-60 Pizzas Caseras LPH',
  shortName: '14-60',
  claim: 'Pizzas LPH · Listas para hornear',
  description: 'Pizzas caseras listas para hornear. Delivery y retiro en San Miguel de Tucumán.',
  phone: '3874094801',
  phoneDisplay: '387 409 4801',
  whatsapp: '5493874094801',
  secondPhone: '3874182889',
  secondPhoneDisplay: '387 418 2889',
  address: 'Luis Patrón Costa 1460',
  city: 'San Miguel de Tucumán',
  mapsUrl: 'https://maps.app.goo.gl/fX2VyuyiG3ybFK156',
  instagram: 'https://www.instagram.com/1460pizzascaseras?xtok=MWlmd3o3cjYyNDM5bQ==',
  facebook: 'https://www.facebook.com/share/1GnadgiySB/',
  alias: '1460pizzas',
  cashDiscount: 0.10,
  logo: 'img/logo/1460-logo.webp',
  hours: [
    { label: 'Mañana', value: '8:30 a 15:00' },
    { label: 'Noche', value: '19:00 a 22:00' }
  ],
  scheduleText: 'Todos los días · 8:30 a 15:00 y 19:00 a 22:00',
  delivery: 'Delivery y retiro',
  payments: ['Efectivo', 'Transferencia'],
  partyService: {
    pricePerPerson: 12500,
    minGuests: 25,
    duration: '2:30 hs',
    deposit: '40%',
    cancellation: 'El día del evento',
    empanadas: ['Carne', 'Árabes', 'Queso']
  }
};

const PICKUP_POINTS = [
  {
    name: 'Centro de producción',
    address: 'Luis Patrón Costa 1460',
    hours: '8:30 a 15:00',
    mapsUrl: 'https://maps.app.goo.gl/fX2VyuyiG3ybFK156',
    whatsapp: '5493874094801',
    icon: '🌅'
  },
  {
    name: 'Punto 28',
    address: 'Camino a San Lorenzo, abajo del 2.º puente, Circunvalación Noroeste',
    hours: '19:00 a 22:00',
    mapsUrl: 'https://maps.app.goo.gl/8ZiDAs8snAA4GnME8',
    whatsapp: '5493874094801',
    icon: '🌙'
  },
  {
    name: 'Punto 51',
    address: 'Entrada Villa Rebeca, a metros de la parada del Colegio',
    hours: '19:00 a 22:00',
    mapsUrl: 'https://maps.app.goo.gl/ujHxb9Vj3VkDTJ5D7',
    whatsapp: '5493874182889',
    icon: '🌙'
  }
];

const DEFAULT_CATEGORIES = [
  { slug: 'clasicas', name: 'Clásicas', icon: '🍕', order: 1 },
  { slug: 'especiales', name: 'Especiales', icon: '⭐', order: 2 },
  { slug: 'fugazzas', name: 'Fugazzas', icon: '🧅', order: 3 },
  { slug: 'promos', name: 'Promos', icon: '🎉', order: 4 }
];

const DEFAULT_MENU = [
  {
    id: 'default-extra-muzza',
    cat: 'clasicas',
    name: 'Extra Muzza',
    desc: 'Doble muzzarella y un borde dorado. La favorita para los que quieren más queso.',
    ingredients: 'Masa artesanal, salsa de tomate, muzzarella y aceite de oliva.',
    prepDesc: 'Horneá a 220 °C durante 12-15 minutos, sin descongelar.',
    prepTime: '12-15 min',
    price: 10000,
    image: 'img/productos/extra-muzza.webp',
    emoji: '🍕',
    tags: ['popular', 'premium'],
    hot: true,
    rating: 5.0,
    sort: 1
  },
  {
    id: 'default-muzzarella',
    cat: 'clasicas',
    name: 'Muzzarella',
    desc: 'La clásica de siempre: masa fina, salsa casera y muzzarella de verdad.',
    ingredients: 'Masa artesanal, salsa de tomate, muzzarella y orégano.',
    prepDesc: 'Horneá a 220 °C durante 12-15 minutos, sin descongelar.',
    prepTime: '12-15 min',
    price: 10000,
    image: 'img/productos/muzzarella.webp',
    emoji: '🍕',
    tags: ['clasica', 'popular'],
    hot: true,
    rating: 4.9,
    sort: 2
  },
  {
    id: 'default-provenzal',
    cat: 'clasicas',
    name: 'Provenzal',
    desc: 'Muzzarella con mucho ajo, perejil fresco y un hilo de aceite de oliva.',
    ingredients: 'Masa artesanal, salsa de tomate, muzzarella, ajo, perejil y aceite de oliva.',
    prepDesc: 'Horneá a 220 °C durante 12-15 minutos, sin descongelar.',
    prepTime: '12-15 min',
    price: 10000,
    image: 'img/productos/provenzal.webp',
    emoji: '🌿',
    tags: ['clasica', 'vegetariana'],
    hot: false,
    rating: 4.8,
    sort: 3
  },
  {
    id: 'default-calabresa',
    cat: 'clasicas',
    name: 'Calabresa',
    desc: 'Muzzarella y rodajas de calabresa. Para los que piden sabor.',
    ingredients: 'Masa artesanal, salsa de tomate, muzzarella y calabresa.',
    prepDesc: 'Horneá a 220 °C durante 12-15 minutos, sin descongelar.',
    prepTime: '12-15 min',
    price: 10000,
    image: 'img/productos/calabresa.webp',
    emoji: '🌶️',
    tags: ['clasica', 'picante'],
    hot: false,
    rating: 4.8,
    sort: 4
  },
  {
    id: 'default-turca',
    cat: 'clasicas',
    name: 'Turca',
    desc: 'Muzzarella, rodajas de tomate y un toque de ajo. Una combinación fresca y distinta.',
    ingredients: 'Masa artesanal, salsa de tomate, muzzarella, tomate y ajo.',
    prepDesc: 'Horneá a 220 °C durante 12-15 minutos, sin descongelar.',
    prepTime: '12-15 min',
    price: 10000,
    image: 'img/productos/turca.webp',
    emoji: '🍅',
    tags: ['clasica', 'vegetariana'],
    hot: false,
    rating: 4.8,
    sort: 5
  },
  {
    id: 'default-huevo',
    cat: 'clasicas',
    name: 'Huevo',
    desc: 'Muzzarella con huevo duro y perejil. Sencilla, abundante y bien nuestra.',
    ingredients: 'Masa artesanal, salsa de tomate, muzzarella, huevo duro y perejil.',
    prepDesc: 'Horneá a 220 °C durante 12-15 minutos, sin descongelar.',
    prepTime: '12-15 min',
    price: 10000,
    image: 'img/productos/huevo.webp',
    emoji: '🥚',
    tags: ['clasica', 'casera'],
    hot: false,
    rating: 4.8,
    sort: 6
  },
  {
    id: 'default-cheddar',
    cat: 'clasicas',
    name: 'Cheddar',
    desc: 'Muzzarella y cheddar fundido con cebolla caramelizada.',
    ingredients: 'Masa artesanal, salsa de tomate, muzzarella, cheddar y cebolla caramelizada.',
    prepDesc: 'Horneá a 220 °C durante 12-15 minutos, sin descongelar.',
    prepTime: '12-15 min',
    price: 10000,
    image: 'img/productos/cheddar.webp',
    emoji: '🧀',
    tags: ['clasica', 'premium'],
    hot: false,
    rating: 4.9,
    sort: 7
  },
  {
    id: 'default-especial-jamon',
    cat: 'especiales',
    name: 'Especial Jamón',
    desc: 'Jamón cocido, muzzarella y morrones en una pizza bien completa.',
    ingredients: 'Masa artesanal, salsa de tomate, muzzarella, jamón cocido y morrones.',
    prepDesc: 'Horneá a 220 °C durante 12-15 minutos, sin descongelar.',
    prepTime: '12-15 min',
    price: 10000,
    image: 'img/productos/especial-jamon.webp',
    emoji: '🍖',
    tags: ['especial', 'popular'],
    hot: true,
    rating: 4.9,
    sort: 8
  },
  {
    id: 'default-4-quesos',
    cat: 'especiales',
    name: '4 Quesos',
    desc: 'Muzzarella, provolone, roquefort y parmesano. Cuatro quesos, una sola porción no alcanza.',
    ingredients: 'Masa artesanal, salsa de tomate, muzzarella, provolone, roquefort y parmesano.',
    prepDesc: 'Horneá a 220 °C durante 12-15 minutos, sin descongelar.',
    prepTime: '12-15 min',
    price: 10000,
    image: 'img/productos/4-quesos.webp',
    emoji: '🧀',
    tags: ['especial', 'premium', 'vegetariana'],
    hot: true,
    rating: 5.0,
    sort: 9
  },
  {
    id: 'default-roquefort-nueces',
    cat: 'especiales',
    name: 'Roquefort y Nueces',
    desc: 'Roquefort, nueces y muzzarella sobre masa fina. Intensa y equilibrada.',
    ingredients: 'Masa artesanal, salsa de tomate, muzzarella, roquefort y nueces.',
    prepDesc: 'Horneá a 220 °C durante 12-15 minutos, sin descongelar.',
    prepTime: '12-15 min',
    price: 10000,
    image: 'img/productos/roquefort-nueces.webp',
    emoji: '🌰',
    tags: ['especial', 'premium', 'vegetariana'],
    hot: false,
    rating: 4.9,
    sort: 10
  },
  {
    id: 'default-fugazza-especial',
    cat: 'fugazzas',
    name: 'Fugazza Especial',
    desc: 'Cebolla, muzzarella y orégano. La fugazza de siempre, con el toque de la casa.',
    ingredients: 'Masa artesanal, cebolla, muzzarella, salsa de tomate y orégano.',
    prepDesc: 'Horneá a 220 °C durante 12-15 minutos, sin descongelar.',
    prepTime: '12-15 min',
    price: 10000,
    image: 'img/productos/fugazza-especial.webp',
    emoji: '🧅',
    tags: ['fugazza', 'vegetariana'],
    hot: false,
    rating: 4.8,
    sort: 11
  },
  {
    id: 'default-fugazzetta',
    cat: 'fugazzas',
    name: 'Fugazzetta Caramelizada',
    desc: 'Cebolla caramelizada, muzzarella y un final dulce. La que convierte a todos.',
    ingredients: 'Masa artesanal, cebolla caramelizada, muzzarella y orégano.',
    prepDesc: 'Horneá a 220 °C durante 12-15 minutos, sin descongelar.',
    prepTime: '12-15 min',
    price: 10000,
    image: 'img/productos/fugazzetta-caramelizada.webp',
    emoji: '🧅',
    tags: ['fugazza', 'premium', 'vegetariana'],
    hot: true,
    rating: 5.0,
    sort: 12
  },
  {
    id: 'default-combo-2-muzzas',
    cat: 'promos',
    name: 'Combo 2 Muzzarellas',
    desc: 'Dos muzzarellas listas para hornear. Ideal para compartir.',
    ingredients: 'Incluye 2 pizzas de muzzarella.',
    prepDesc: 'Horneá las dos pizzas a 220 °C durante 12-15 minutos.',
    prepTime: '12-15 min',
    price: 20000,
    image: 'img/productos/combo-muzzarella.webp',
    emoji: '🎉',
    tags: ['promo', 'popular'],
    hot: true,
    rating: 4.9,
    sort: 13
  },
  {
    id: 'default-combo-4-clasicas',
    cat: 'promos',
    name: 'Combo 4 Clásicas',
    desc: 'Cuatro pizzas clásicas a elección. Consultá sabores al confirmar.',
    ingredients: 'Incluye 4 pizzas clásicas a elección.',
    prepDesc: 'Horneá a 220 °C durante 12-15 minutos, sin descongelar.',
    prepTime: '12-15 min',
    price: 40000,
    image: 'img/productos/combo-clasicas.webp',
    emoji: '🎉',
    tags: ['promo', 'familiar'],
    hot: false,
    rating: 4.9,
    sort: 14
  },
  {
    id: 'default-pizza-party',
    cat: 'promos',
    name: 'Pizza Party',
    desc: 'Servicio completo para tu evento: empanadas de entrada, pizzas a elección y food truck. Mínimo 25 personas. Las variedades de pizza se eligen al reservar.',
    ingredients: 'Empanadas de carne, árabes o queso + pizzas LPH a elección, cocinadas y servidas en el evento.',
    prepDesc: 'Llevamos el food truck y todos los utensilios. Duración aproximada 2:30 hs. Seña del 40% para reservar.',
    prepTime: '2:30 hs',
    price: 12500,
    unit: 'persona',
    minQty: 25,
    image: 'img/productos/pizza-party.webp',
    emoji: '🔥',
    tags: ['promo', 'evento'],
    hot: true,
    rating: 5.0,
    sort: 15
  }
];

const DEFAULT_BANNERS = [
  {
    image: 'img/banners/banner-lph.webp',
    title: 'Listas para hornear',
    subtitle: 'Del freezer al horno, en minutos.',
    link: '#menu'
  },
  {
    image: 'img/banners/banner-pizza-party.webp',
    title: 'Pizza Party',
    subtitle: 'Cocinamos en tu evento. Pedí tu presupuesto.',
    link: 'https://wa.me/5493874094801?text=Hola%2C%20quiero%20consultar%20por%20Pizza%20Party'
  },
  {
    image: 'img/banners/banner-clasicas.webp',
    title: 'Clásicas de siempre',
    subtitle: 'Muzzarella, fugazzas y especiales.',
    link: '#menu'
  }
];

const TAG_LABELS = {
  popular: '🔥 Popular',
  premium: '⭐ Premium',
  clasica: '🍕 Clásica',
  especial: '✨ Especial',
  fugazza: '🧅 Fugazza',
  promo: '🎉 Promo',
  familiar: '👨‍👩‍👧‍👦 Familiar',
  evento: '🎊 Evento',
  picante: '🌶️ Picante',
  vegetariana: '🌿 Veggie',
  casera: '🏠 Casera'
};
