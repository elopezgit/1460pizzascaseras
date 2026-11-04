'use strict';

/* ─── 14-60 Pizzas Caseras · WebApp Mobile-First de Pedidos ───────────────── */

const CART_KEY = 'p1460_cart';
const CUSTOMER_KEY = 'p1460_customer';
const THEME_KEY = 'p1460_theme_light_v1';
const LAST_ORDER_KEY = 'p1460_last_order';

const state = {
  categories: clone(DEFAULT_CATEGORIES),
  menu: clone(DEFAULT_MENU),
  banners: clone(DEFAULT_BANNERS),
  cart: loadJSON(CART_KEY, {}),
  customer: loadJSON(CUSTOMER_KEY, {}),
  currentCat: 'todos',
  search: '',
  deliveryMode: 'delivery',
  paymentMethod: 'efectivo',
  modalProductId: null,
  modalQty: 1,
  lastOrder: loadJSON(LAST_ORDER_KEY, null),
  supabase: null,
  toastTimer: null
};

if (state.customer.deliveryMode === 'takeaway') {
  state.deliveryMode = 'takeaway';
}

/* ─── ARRANQUE ───────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', init);

function init() {
  document.body.classList.add('js-ready');
  initTheme();
  bindEvents();
  hydrateCustomerForm();
  renderCategories();
  renderBanners();
  renderMenu();
  renderPickupPoints();
  renderCart();
  renderStoreStatus();
  applyDeliveryMode(state.deliveryMode, false);
  setFooterYear();
  hideSplash();
  loadFromSupabase();
  setInterval(renderStoreStatus, 60_000);
}

function hideSplash() {
  const splash = document.getElementById('splash');
  if (!splash) return;
  const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 120 : 450;
  setTimeout(() => {
    splash.classList.add('is-hidden');
    setTimeout(() => splash.remove(), 450);
  }, delay);
}

/* ─── EVENTOS ────────────────────────────────────────────────────────────── */

function bindEvents() {
  document.getElementById('themeToggleBtn')?.addEventListener('click', toggleTheme);
  document.getElementById('cartOpenBtn')?.addEventListener('click', openCart);
  document.getElementById('sideOpenCheckoutBtn')?.addEventListener('click', openCart);
  document.getElementById('mobileCartTrigger')?.addEventListener('click', openCart);
  document.getElementById('cartCloseBtn')?.addEventListener('click', closeCart);
  document.getElementById('cartOverlay')?.addEventListener('click', closeCart);
  document.getElementById('cartGoMenuBtn')?.addEventListener('click', () => {
    closeCart();
    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
  });

  // Modal de Info y Locales
  document.getElementById('openInfoModalBtn')?.addEventListener('click', openInfoModal);
  document.getElementById('storeInfoCardBtn')?.addEventListener('click', openInfoModal);
  document.getElementById('footerInfoBtn')?.addEventListener('click', openInfoModal);
  document.getElementById('infoModalClose')?.addEventListener('click', closeInfoModal);
  document.getElementById('infoModalOverlay')?.addEventListener('click', (event) => {
    if (event.target === event.currentTarget) closeInfoModal();
  });

  document.getElementById('menuSearch')?.addEventListener('input', (event) => {
    state.search = event.target.value.trim();
    renderMenu();
  });

  document.getElementById('categoryFilters')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-cat]');
    if (!button) return;
    state.currentCat = button.dataset.cat;
    renderCategories();
    renderMenu();
  });

  document.getElementById('clearFiltersBtn')?.addEventListener('click', () => {
    state.currentCat = 'todos';
    state.search = '';
    const search = document.getElementById('menuSearch');
    if (search) search.value = '';
    renderCategories();
    renderMenu();
  });

  document.getElementById('productGrid')?.addEventListener('click', handleProductGridClick);
  document.getElementById('productGrid')?.addEventListener('keydown', handleProductGridKeydown);
  document.getElementById('cartItems')?.addEventListener('click', handleCartClick);
  document.getElementById('cartItems')?.addEventListener('input', handleCartNoteInput);
  document.getElementById('sideCartItems')?.addEventListener('click', handleCartClick);

  document.getElementById('deliveryToggle')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-mode]');
    if (!button) return;
    applyDeliveryMode(button.dataset.mode);
  });

  document.getElementById('sideDeliveryToggle')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-mode]');
    if (!button) return;
    applyDeliveryMode(button.dataset.mode);
  });

  document.getElementById('paymentOptions')?.addEventListener('change', (event) => {
    if (event.target.name === 'pago') {
      state.paymentMethod = event.target.value;
      renderCart();
    }
  });

  document.getElementById('copyAliasBtn')?.addEventListener('click', (event) => {
    copyAliasToClipboard(BRAND.alias, event.currentTarget);
  });

  ['fNombre', 'fTel', 'fDir', 'fNota', 'fPickupPoint'].forEach((id) => {
    document.getElementById(id)?.addEventListener('input', saveCustomerDraft);
    document.getElementById(id)?.addEventListener('change', saveCustomerDraft);
  });

  document.getElementById('checkoutForm')?.addEventListener('submit', submitOrder);
  document.getElementById('waFallbackBtn')?.addEventListener('click', (event) => {
    event.currentTarget.href = buildCartWhatsAppLink();
  });

  document.getElementById('productModalClose')?.addEventListener('click', closeProductModal);
  document.getElementById('productModalOverlay')?.addEventListener('click', (event) => {
    if (event.target === event.currentTarget) closeProductModal();
  });

  document.getElementById('successCloseBtn')?.addEventListener('click', closeSuccessModal);
  document.getElementById('successOverlay')?.addEventListener('click', (event) => {
    if (event.target === event.currentTarget) closeSuccessModal();
  });

  document.addEventListener('keydown', handleEscape);
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ─── COPIAR ALIAS AL PORTAPAPELES ───────────────────────────────────────── */

async function copyAliasToClipboard(aliasText, buttonEl) {
  const alias = String(aliasText || BRAND.alias || '1460pizzas').trim();
  let copied = false;

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(alias);
      copied = true;
    }
  } catch {
    copied = false;
  }

  if (!copied) {
    try {
      const temp = document.createElement('textarea');
      temp.value = alias;
      temp.setAttribute('readonly', '');
      temp.style.position = 'fixed';
      temp.style.opacity = '0';
      document.body.appendChild(temp);
      temp.select();
      temp.setSelectionRange(0, alias.length);
      copied = document.execCommand('copy');
      temp.remove();
    } catch {
      copied = false;
    }
  }

  if (buttonEl) {
    const original = buttonEl.dataset.originalLabel || '📋 Copiar alias';
    buttonEl.dataset.originalLabel = original;
    buttonEl.textContent = '✓ ¡Alias copiado!';
    buttonEl.classList.add('is-copied');
    setTimeout(() => {
      buttonEl.textContent = original;
      buttonEl.classList.remove('is-copied');
    }, 2400);
  }

  showToast(`✓ Alias "${alias}" copiado al portapapeles`);
}

function handleProductGridClick(event) {
  const addButton = event.target.closest('[data-add]');
  if (addButton) {
    event.preventDefault();
    event.stopPropagation();
    addToCart(addButton.dataset.add, 1);
    return;
  }

  const minusButton = event.target.closest('[data-card-minus]');
  if (minusButton) {
    event.preventDefault();
    event.stopPropagation();
    changeCartQty(minusButton.dataset.cardMinus, -1);
    return;
  }

  const plusButton = event.target.closest('[data-card-plus]');
  if (plusButton) {
    event.preventDefault();
    event.stopPropagation();
    changeCartQty(plusButton.dataset.cardPlus, 1);
    return;
  }

  const card = event.target.closest('[data-product-id]');
  if (card) {
    openProductModal(card.dataset.productId);
  }
}

function handleProductGridKeydown(event) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  const card = event.target.closest('[data-product-id]');
  if (!card || event.target.closest('button')) return;
  event.preventDefault();
  openProductModal(card.dataset.productId);
}

function handleCartClick(event) {
  const minus = event.target.closest('[data-cart-minus]');
  if (minus) {
    changeCartQty(minus.dataset.cartMinus, -1);
    return;
  }

  const plus = event.target.closest('[data-cart-plus]');
  if (plus) {
    changeCartQty(plus.dataset.cartPlus, 1);
    return;
  }

  const remove = event.target.closest('[data-cart-remove]');
  if (remove) {
    removeFromCart(remove.dataset.cartRemove);
  }
}

function handleCartNoteInput(event) {
  const input = event.target.closest('[data-note-id]');
  if (!input) return;
  const id = input.dataset.noteId;
  if (!state.cart[id]) return;
  state.cart[id].note = input.value.trim();
  saveCart();
}

function handleEscape(event) {
  if (event.key !== 'Escape') return;
  if (!document.getElementById('successOverlay')?.hidden) {
    closeSuccessModal();
    return;
  }
  if (!document.getElementById('productModalOverlay')?.hidden) {
    closeProductModal();
    return;
  }
  if (!document.getElementById('infoModalOverlay')?.hidden) {
    closeInfoModal();
    return;
  }
  if (document.getElementById('cartDrawer')?.classList.contains('is-open')) {
    closeCart();
  }
}

function onScroll() {
  document.getElementById('siteHeader')?.classList.toggle('is-scrolled', window.scrollY > 8);
}

/* ─── TEMA (MODO CLARO POR DEFECTO) ──────────────────────────────────────── */

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const theme = saved === 'dark' ? 'dark' : 'light';
  applyTheme(theme);
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  localStorage.setItem(THEME_KEY, theme);
  const button = document.getElementById('themeToggleBtn');
  if (button) {
    button.querySelector('span').textContent = theme === 'dark' ? '☀️' : '🌙';
    button.setAttribute('aria-label', theme === 'dark' ? 'Activar tema claro' : 'Activar tema oscuro');
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'dark' ? '#181920' : '#f5f6f9';
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
}

/* ─── ESTADO DEL LOCAL ───────────────────────────────────────────────────── */

function renderStoreStatus() {
  const wrap = document.getElementById('storeStatus');
  const text = document.getElementById('storeStatusText');
  if (!wrap || !text) return;

  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const morningOpen = minutes >= 8 * 60 + 30 && minutes <= 15 * 60;
  const eveningOpen = minutes >= 19 * 60 && minutes <= 22 * 60;
  const isOpen = morningOpen || eveningOpen;

  wrap.classList.toggle('is-open', isOpen);
  wrap.classList.toggle('is-closed', !isOpen);

  if (isOpen) {
    text.textContent = 'Abierto';
  } else if (minutes < 8 * 60 + 30) {
    text.textContent = 'Abre 8:30 hs';
  } else if (minutes < 19 * 60) {
    text.textContent = 'Abre 19:00 hs';
  } else {
    text.textContent = 'Abre 8:30 hs';
  }
}

/* ─── CATEGORÍAS Y PROMOS ────────────────────────────────────────────────── */

function renderCategories() {
  const container = document.getElementById('categoryFilters');
  if (!container) return;

  const categories = [...state.categories].sort((a, b) => (a.order || 0) - (b.order || 0));
  const total = state.menu.length;
  const hotCount = state.menu.filter((item) => item.hot).length;

  const buttons = [
    `<button type="button" class="filter-chip ${state.currentCat === 'todos' ? 'active' : ''}" data-cat="todos">🍽️ Todo <em>${total}</em></button>`
  ];

  if (hotCount > 0) {
    buttons.push(
      `<button type="button" class="filter-chip ${state.currentCat === 'populares' ? 'active' : ''}" data-cat="populares">🔥 Más pedidas <em>${hotCount}</em></button>`
    );
  }

  categories.forEach((cat) => {
    const count = state.menu.filter((item) => item.cat === cat.slug).length;
    if (count === 0) return;
    buttons.push(
      `<button type="button" class="filter-chip ${state.currentCat === cat.slug ? 'active' : ''}" data-cat="${escapeAttr(cat.slug)}">${escapeHTML(cat.icon || '🍕')} ${escapeHTML(cat.name)} <em>${count}</em></button>`
    );
  });

  container.innerHTML = buttons.join('');
}

function renderBanners() {
  const container = document.getElementById('promoGrid');
  if (!container) return;

  const banners = [...state.banners].sort((a, b) => (a.sort || 0) - (b.sort || 0));
  if (!banners.length) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = banners.map((banner, index) => {
    const link = banner.link || '#menu';
    const external = /^https?:\/\//i.test(link);
    const attrs = external ? ' target="_blank" rel="noopener"' : '';
    const badges = ['🔥 Destacado', '🎊 Eventos', '🍕 Clásicas'];
    const kicker = badges[index % badges.length];
    return `
      <a class="promo-card" href="${escapeAttr(link)}"${attrs}
        style="background-image:url('${escapeAttr(banner.image || '')}')">
        <div class="promo-content">
          <span class="promo-kicker">${escapeHTML(kicker)}</span>
          <h3>${escapeHTML(banner.title || 'Nuestra pizza')}</h3>
          <p>${escapeHTML(banner.subtitle || 'Elegí tus favoritas y pedí online.')}</p>
        </div>
      </a>
    `;
  }).join('');
}

function renderPickupPoints() {
  const grid = document.getElementById('pickupGrid');
  if (!grid) return;

  const points = Array.isArray(PICKUP_POINTS) ? PICKUP_POINTS : [];
  grid.innerHTML = points.map((point) => {
    const phone = String(point.whatsapp || BRAND.whatsapp).replace(/\D/g, '');
    return `
      <article class="pickup-card">
        <span class="pickup-icon" aria-hidden="true">${escapeHTML(point.icon || '📍')}</span>
        <div>
          <h3>${escapeHTML(point.name)}</h3>
          <p>${escapeHTML(point.address)}</p>
          <p class="pickup-hours">🕒 ${escapeHTML(point.hours)}</p>
          <div class="pickup-links">
            <a href="${escapeAttr(point.mapsUrl)}" target="_blank" rel="noopener">📍 Mapa</a>
            <a href="https://wa.me/${escapeAttr(phone)}?text=${encodeURIComponent(`Hola, quiero consultar por el retiro en ${point.name}.`)}"
              target="_blank" rel="noopener">💬 WhatsApp</a>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

/* ─── MODAL DE INFO Y PUNTOS DE RETIRO ───────────────────────────────────── */

function openInfoModal() {
  const overlay = document.getElementById('infoModalOverlay');
  if (overlay) overlay.hidden = false;
  syncBodyScroll();
}

function closeInfoModal() {
  const overlay = document.getElementById('infoModalOverlay');
  if (overlay) overlay.hidden = true;
  syncBodyScroll();
}

/* ─── MENÚ ESTILO PEDIDOSYA (AGRUPADO POR CATEGORÍA + TARJETAS HORIZONTALES) ─ */

function renderMenu() {
  const grid = document.getElementById('productGrid');
  const empty = document.getElementById('menuEmpty');
  if (!grid) return;

  const query = normalize(state.search);
  const filtered = state.menu
    .filter((item) => {
      if (state.currentCat === 'todos') return true;
      if (state.currentCat === 'populares') return Boolean(item.hot);
      return item.cat === state.currentCat;
    })
    .filter((item) => {
      if (!query) return true;
      const haystack = normalize(`${item.name} ${item.desc} ${item.ingredients} ${(item.tags || []).join(' ')}`);
      return haystack.includes(query);
    })
    .sort((a, b) => (a.sort || 0) - (b.sort || 0));

  if (filtered.length === 0) {
    grid.innerHTML = '';
    grid.hidden = true;
    if (empty) empty.hidden = false;
    return;
  }

  grid.hidden = false;
  if (empty) empty.hidden = true;

  if (state.currentCat === 'todos' && !query) {
    const categories = [...state.categories].sort((a, b) => (a.order || 0) - (b.order || 0));
    const sectionsHTML = [];

    const hotItems = filtered.filter((item) => item.hot);
    if (hotItems.length > 0) {
      sectionsHTML.push(`
        <div class="menu-category-group">
          <div class="menu-group-header">
            <h3>🔥 Más pedidas</h3>
            <span>Favoritas</span>
          </div>
          <div class="menu-cards-grid">
            ${hotItems.map(productCardHTML).join('')}
          </div>
        </div>
      `);
    }

    categories.forEach((cat) => {
      const catItems = filtered.filter((item) => item.cat === cat.slug);
      if (!catItems.length) return;
      sectionsHTML.push(`
        <div class="menu-category-group" id="cat-${escapeAttr(cat.slug)}">
          <div class="menu-group-header">
            <h3>${escapeHTML(cat.icon || '🍕')} ${escapeHTML(cat.name)}</h3>
            <span>${catItems.length}</span>
          </div>
          <div class="menu-cards-grid">
            ${catItems.map(productCardHTML).join('')}
          </div>
        </div>
      `);
    });

    const knownSlugs = new Set(categories.map((c) => c.slug));
    const otherItems = filtered.filter((item) => !knownSlugs.has(item.cat));
    if (otherItems.length) {
      sectionsHTML.push(`
        <div class="menu-category-group">
          <div class="menu-group-header">
            <h3>🍕 Otras variedades</h3>
            <span>${otherItems.length}</span>
          </div>
          <div class="menu-cards-grid">
            ${otherItems.map(productCardHTML).join('')}
          </div>
        </div>
      `);
    }

    grid.innerHTML = sectionsHTML.join('');
    return;
  }

  const title = query
    ? `🔎 Resultados para "${escapeHTML(state.search)}"`
    : state.currentCat === 'populares'
      ? '🔥 Más pedidas'
      : `${categoryIcon(state.currentCat)} ${categoryName(state.currentCat)}`;

  grid.innerHTML = `
    <div class="menu-category-group">
      <div class="menu-group-header">
        <h3>${title}</h3>
        <span>${filtered.length}</span>
      </div>
      <div class="menu-cards-grid">
        ${filtered.map(productCardHTML).join('')}
      </div>
    </div>
  `;
}

function productCardHTML(product) {
  const image = product.image || fallbackImage(product.cat);
  const rating = Number(product.rating || 5).toFixed(1);
  const inCartQty = Number(state.cart[product.id]?.qty || 0);
  const isPerPerson = productUnit(product) === 'persona';
  const cashPrice = getCashPrice(product.price);

  const badgeHTML = product.hot
    ? '<span class="py-badge py-badge-hot">🔥 Popular</span>'
    : `<span class="py-badge py-badge-cat">${escapeHTML(categoryName(product.cat))}</span>`;

  const actionControl = inCartQty > 0
    ? `
      <div class="card-stepper" role="group" aria-label="Cantidad en el pedido">
        <button type="button" class="card-step-btn" data-card-minus="${escapeAttr(product.id)}" aria-label="Restar">−</button>
        <span class="card-step-qty">${inCartQty}</span>
        <button type="button" class="card-step-btn" data-card-plus="${escapeAttr(product.id)}" aria-label="Sumar">+</button>
      </div>
    `
    : `
      <button class="add-btn" type="button" data-add="${escapeAttr(product.id)}"
        aria-label="Agregar ${escapeAttr(product.name)} al pedido">+</button>
    `;

  return `
    <article class="product-card ${inCartQty > 0 ? 'in-cart' : ''}" data-product-id="${escapeAttr(product.id)}" tabindex="0" role="button"
      aria-label="Ver detalle de ${escapeAttr(product.name)}">
      <div class="product-body">
        <div class="product-top-meta">
          ${badgeHTML}
          <span class="product-rating">⭐ ${rating}</span>
        </div>
        <h3 class="product-name">${escapeHTML(product.name)}</h3>
        <p class="product-desc">${escapeHTML(product.desc)}</p>
        <div class="product-footer">
          <div class="product-price-block">
            <div class="price-main-row">
              <span class="product-price">${formatPrice(cashPrice)}</span>
              <span class="cash-pill">10% OFF efvo.</span>
            </div>
            <span class="product-transfer">
              Transf.: <strong>${formatPrice(product.price)}</strong> ${isPerPerson ? '/ persona (mín. 25)' : 'c/u'}
            </span>
          </div>
        </div>
      </div>

      <div class="product-media" data-emoji="${escapeAttr(product.emoji || '🍕')}">
        <img src="${escapeAttr(image)}" alt="${escapeAttr(product.name)}" loading="lazy"
          onerror="this.closest('.product-media').classList.add('no-img')">
        ${actionControl}
      </div>
    </article>
  `;
}

function categoryName(slug) {
  return state.categories.find((cat) => cat.slug === slug)?.name || 'Pizzas';
}

function categoryIcon(slug) {
  return state.categories.find((cat) => cat.slug === slug)?.icon || '🍕';
}

function fallbackImage(cat) {
  const map = {
    clasicas: 'img/productos/muzzarella.webp',
    especiales: 'img/productos/4-quesos.webp',
    fugazzas: 'img/productos/fugazzetta-caramelizada.webp',
    promos: 'img/productos/combo-clasicas.webp'
  };
  return map[cat] || 'img/productos/muzzarella.webp';
}

/* ─── MODAL DE PRODUCTO ──────────────────────────────────────────────────── */

function openProductModal(id) {
  const product = state.menu.find((item) => String(item.id) === String(id));
  if (!product) return;

  const minQty = Math.max(1, Number(product.minQty || 1));
  state.modalProductId = product.id;
  state.modalQty = Math.max(minQty, state.cart[product.id]?.qty || minQty);
  renderProductModal();
  const overlay = document.getElementById('productModalOverlay');
  if (overlay) overlay.hidden = false;
  syncBodyScroll();
  setTimeout(() => document.getElementById('productModalClose')?.focus(), 30);
}

function renderProductModal() {
  const product = state.menu.find((item) => String(item.id) === String(state.modalProductId));
  const container = document.getElementById('productModalContent');
  if (!product || !container) return;

  const image = product.image || fallbackImage(product.cat);
  const rating = Number(product.rating || 5).toFixed(1);
  const tags = (product.tags || []).map((tag) => TAG_LABELS[tag] || tag);
  const tagsHTML = tags.length
    ? `<div class="pm-tags">${tags.map((tag) => `<span>${escapeHTML(tag)}</span>`).join('')}</div>`
    : '';

  container.innerHTML = `
    <div class="pm-media">
      <img src="${escapeAttr(image)}" alt="${escapeAttr(product.name)}">
      <span class="pm-media-badge">${product.hot ? '🔥 Más pedida' : '🍕 Pizza LPH'}</span>
    </div>
    <div class="pm-body">
      <span class="pm-cat">${escapeHTML(categoryName(product.cat))}</span>
      <h2 id="pmTitle">${escapeHTML(product.name)}</h2>
      <div class="pm-rating"><span>⭐ ${rating}</span> · Lista para hornear</div>
      <div class="pm-prices">
        <div class="pm-price-card pm-price-cash">
          <small>💵 Efectivo (10% OFF)</small>
          <strong>${formatPrice(getCashPrice(product.price))}</strong>
        </div>
        <div class="pm-price-card">
          <small>🏦 Transferencia (${productUnit(product) === 'persona' ? 'por persona' : 'lista'})</small>
          <strong>${formatPrice(product.price)}</strong>
        </div>
      </div>
      <p class="pm-desc">${escapeHTML(product.desc)}</p>
      ${tagsHTML}
      <div class="pm-detail-grid">
        <div>
          <h3>Ingredientes</h3>
          <p>${escapeHTML(product.ingredients || 'Consultá los ingredientes por WhatsApp.')}</p>
        </div>
        <div>
          <h3>Cocción</h3>
          <p>${escapeHTML(product.prepDesc || 'Horneá a 220 °C durante 12-15 minutos, sin descongelar.')}</p>
        </div>
      </div>
      <div class="pm-actions">
        <div class="qty-control" aria-label="Cantidad">
          <button type="button" id="pmMinusBtn" aria-label="Restar una unidad">−</button>
          <span id="pmQty">${state.modalQty}</span>
          <button type="button" id="pmPlusBtn" aria-label="Sumar una unidad">+</button>
        </div>
        <button type="button" class="pm-add-btn" id="pmAddBtn">
          Sumar · ${formatPrice(getCashPrice(product.price) * state.modalQty)} efvo.
        </button>
      </div>
    </div>
  `;

  const productForModal = state.menu.find((item) => String(item.id) === String(state.modalProductId));
  const minQtyForModal = Math.max(1, Number(productForModal?.minQty || 1));
  document.getElementById('pmMinusBtn')?.addEventListener('click', () => {
    state.modalQty = Math.max(minQtyForModal, state.modalQty - 1);
    updateModalQtyAndPrice();
  });

  document.getElementById('pmPlusBtn')?.addEventListener('click', () => {
    state.modalQty = Math.min(99, state.modalQty + 1);
    updateModalQtyAndPrice();
  });

  document.getElementById('pmAddBtn')?.addEventListener('click', () => {
    setCartQty(product.id, state.modalQty);
    closeProductModal();
  });
}

function updateModalQtyAndPrice() {
  const product = state.menu.find((item) => String(item.id) === String(state.modalProductId));
  if (!product) return;
  const qty = document.getElementById('pmQty');
  const button = document.getElementById('pmAddBtn');
  if (qty) qty.textContent = state.modalQty;
  if (button) {
    button.textContent = `Sumar · ${formatPrice(getCashPrice(product.price) * state.modalQty)} efvo.`;
  }
}

function closeProductModal() {
  const overlay = document.getElementById('productModalOverlay');
  if (overlay) overlay.hidden = true;
  state.modalProductId = null;
  syncBodyScroll();
}

/* ─── CARRITO ────────────────────────────────────────────────────────────── */

function openCart() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  if (!drawer || !overlay) return;
  overlay.hidden = false;
  drawer.classList.add('is-open');
  drawer.setAttribute('aria-hidden', 'false');
  syncBodyScroll();
}

function closeCart() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  if (!drawer || !overlay) return;
  drawer.classList.remove('is-open');
  drawer.setAttribute('aria-hidden', 'true');
  overlay.hidden = true;
  syncBodyScroll();
}

function syncBodyScroll() {
  const cartOpen = document.getElementById('cartDrawer')?.classList.contains('is-open');
  const productOpen = !document.getElementById('productModalOverlay')?.hidden;
  const infoOpen = !document.getElementById('infoModalOverlay')?.hidden;
  const successOpen = !document.getElementById('successOverlay')?.hidden;
  document.body.classList.toggle('no-scroll', Boolean(cartOpen || productOpen || infoOpen || successOpen));
}

function setCartQty(id, quantity) {
  const product = state.menu.find((item) => String(item.id) === String(id));
  if (!product) return;
  const minQty = Math.max(1, Number(product.minQty || 1));
  const current = state.cart[id] || { qty: 0, note: '' };
  state.cart[id] = {
    qty: Math.min(99, Math.max(minQty, Number(quantity || minQty))),
    note: current.note || ''
  };
  saveCart();
  renderCart();
  renderMenu();
  showToast(`✓ ${product.name} actualizado`);
}

function addToCart(id, quantity = 1) {
  const product = state.menu.find((item) => String(item.id) === String(id));
  if (!product) return;

  const minQty = Math.max(1, Number(product.minQty || 1));
  const current = state.cart[id] || { qty: 0, note: '' };
  const nextQty = current.qty === 0
    ? Math.max(minQty, Number(quantity || 1))
    : Number(current.qty) + Number(quantity || 1);

  state.cart[id] = {
    qty: Math.min(99, nextQty),
    note: current.note || ''
  };
  saveCart();
  renderCart();
  renderMenu();
  showToast(`✓ ${product.name} agregado`);
}

function changeCartQty(id, delta) {
  const entry = state.cart[id];
  if (!entry) return;
  const product = state.menu.find((item) => String(item.id) === String(id));
  const minQty = Math.max(1, Number(product?.minQty || 1));
  const next = Number(entry.qty || 0) + delta;
  if (next < minQty) {
    removeFromCart(id);
    return;
  }
  entry.qty = Math.min(99, next);
  saveCart();
  renderCart();
  renderMenu();
}

function removeFromCart(id) {
  delete state.cart[id];
  saveCart();
  renderCart();
  renderMenu();
}

function clearCart() {
  state.cart = {};
  saveCart();
  renderCart();
  renderMenu();
}

function getCartEntries() {
  const entries = [];

  Object.entries(state.cart).forEach(([id, value]) => {
    const product = state.menu.find((item) => String(item.id) === String(id));
    const qty = Math.max(0, parseInt(value?.qty, 10) || 0);
    if (!product || qty <= 0) return;
    entries.push({
      id,
      qty,
      note: String(value?.note || ''),
      product,
      subtotal: Number(product.price || 0) * qty
    });
  });

  return entries;
}

function renderCart() {
  const entries = getCartEntries();
  const totals = getCartTotals(entries);
  const count = entries.reduce((sum, entry) => sum + entry.qty, 0);
  const cashTotal = Math.round(totals.subtotalLista * (1 - Number(BRAND.cashDiscount || 0)));

  ['cartCount', 'sideCartCount', 'mobileCartCount'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(count);
  });

  const items = document.getElementById('cartItems');
  const empty = document.getElementById('cartEmpty');
  const form = document.getElementById('checkoutForm');
  if (items) items.innerHTML = entries.map(cartItemHTML).join('');
  if (empty) empty.hidden = entries.length > 0;
  if (form) form.hidden = entries.length === 0;

  const sideItems = document.getElementById('sideCartItems');
  const sideEmpty = document.getElementById('sideCartEmpty');
  const sideFooter = document.getElementById('sideCartFooter');
  if (sideItems) {
    sideItems.innerHTML = entries.map(sideCartItemHTML).join('');
    sideItems.hidden = entries.length === 0;
  }
  if (sideEmpty) sideEmpty.hidden = entries.length > 0;
  if (sideFooter) sideFooter.hidden = entries.length === 0;

  setText('sideSubtotal', formatPrice(totals.subtotalLista));
  setText('sideCashTotal', formatPrice(cashTotal));
  setText('sideBtnTotal', formatPrice(totals.total));

  const mobileBar = document.getElementById('mobileCartBar');
  if (mobileBar) mobileBar.hidden = entries.length === 0;
  document.body.classList.toggle('has-mobile-cart', entries.length > 0);
  setText('mobileCartTotal', formatPrice(totals.total));

  setText('cartSubtotal', formatPrice(totals.subtotalLista));
  setText('cartDiscount', `-${formatPrice(totals.descuento)}`);
  setText('cartTotal', formatPrice(totals.total));
  setText('cartShipping', state.deliveryMode === 'delivery' ? 'A coordinar' : 'Retiro en local');

  const discountRow = document.getElementById('discountRow');
  if (discountRow) discountRow.hidden = entries.length === 0 || totals.descuento === 0;

  updatePaymentInfo(totals.descuento);

  const waFallback = document.getElementById('waFallbackBtn');
  if (waFallback) waFallback.href = buildCartWhatsAppLink();

  const checkoutButton = document.getElementById('checkoutBtn');
  if (checkoutButton) checkoutButton.disabled = entries.length === 0;
}

function sideCartItemHTML(entry) {
  const product = entry.product;
  return `
    <div class="side-item">
      <div class="side-item-info">
        <strong>${escapeHTML(product.name)}</strong>
        <small>${formatPrice(getCashPrice(product.price))} efvo. · ${formatPrice(product.price)} lista</small>
      </div>
      <div class="side-item-controls">
        <div class="qty-control qty-sm">
          <button type="button" data-cart-minus="${escapeAttr(entry.id)}" aria-label="Restar">−</button>
          <span>${entry.qty}</span>
          <button type="button" data-cart-plus="${escapeAttr(entry.id)}" aria-label="Sumar">+</button>
        </div>
        <strong class="side-item-sub">${formatPrice(entry.subtotal)}</strong>
      </div>
    </div>
  `;
}

function getCartTotals(entries = getCartEntries()) {
  const subtotalLista = entries.reduce((sum, entry) => sum + entry.subtotal, 0);
  const descuento = state.paymentMethod === 'efectivo'
    ? Math.round(subtotalLista * Number(BRAND.cashDiscount || 0))
    : 0;
  return {
    subtotalLista,
    descuento,
    total: subtotalLista - descuento
  };
}

function getCashPrice(price) {
  return Math.round(Number(price || 0) * (1 - Number(BRAND.cashDiscount || 0)));
}

function updatePaymentInfo(discount = 0) {
  const info = document.getElementById('paymentInfo');
  const aliasBox = document.getElementById('aliasCopyBox');
  const aliasValue = document.getElementById('aliasTextValue');

  if (aliasValue) aliasValue.textContent = BRAND.alias || '1460pizzas';
  if (aliasBox) aliasBox.hidden = state.paymentMethod !== 'transferencia';

  if (!info) return;

  if (state.paymentMethod === 'efectivo') {
    info.innerHTML = discount > 0
      ? `💵 Pagando en efectivo ahorrás <strong>${formatPrice(discount)}</strong> (10% OFF incluido).`
      : '💵 Pagás en efectivo al recibir o retirar el pedido.';
  } else {
    info.innerHTML = `🏦 Copiá el alias de arriba y enviá el comprobante por WhatsApp al confirmar.`;
  }
}

function cartItemHTML(entry) {
  const product = entry.product;
  const image = product.image || fallbackImage(product.cat);
  return `
    <article class="cart-item" data-cart-id="${escapeAttr(entry.id)}">
      <img src="${escapeAttr(image)}" alt="${escapeAttr(product.name)}"
        onerror="this.style.display='none'">
      <div class="cart-item-main">
        <div class="cart-item-top">
          <strong>${escapeHTML(product.name)}</strong>
          <button class="cart-remove" type="button" data-cart-remove="${escapeAttr(entry.id)}"
            aria-label="Quitar ${escapeAttr(product.name)}">✕</button>
        </div>
        <div class="cart-item-price">${formatPrice(getCashPrice(product.price))} efvo. / ${formatPrice(product.price)} ${productUnit(product) === 'persona' ? 'por persona' : 'lista'}</div>
        <div class="qty-control">
          <button type="button" data-cart-minus="${escapeAttr(entry.id)}" aria-label="Restar">−</button>
          <span>${entry.qty}</span>
          <button type="button" data-cart-plus="${escapeAttr(entry.id)}" aria-label="Sumar">+</button>
        </div>
        <input class="cart-item-note" type="text" data-note-id="${escapeAttr(entry.id)}"
          value="${escapeAttr(entry.note)}" maxlength="120" placeholder="Nota para este producto (opcional)">
      </div>
      <strong class="cart-item-subtotal">${formatPrice(entry.subtotal)}</strong>
    </article>
  `;
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
}

/* ─── FORMULARIO DE PEDIDO ───────────────────────────────────────────────── */

function hydrateCustomerForm() {
  setValue('fNombre', state.customer.name || '');
  setValue('fTel', state.customer.phone || '');
  setValue('fDir', state.customer.address || '');
  if (state.customer.pickupPoint) {
    setValue('fPickupPoint', state.customer.pickupPoint);
  }
  applyDeliveryMode(state.deliveryMode, false);
}

function saveCustomerDraft() {
  state.customer = {
    ...state.customer,
    name: document.getElementById('fNombre')?.value.trim() || '',
    phone: document.getElementById('fTel')?.value.trim() || '',
    address: document.getElementById('fDir')?.value.trim() || '',
    pickupPoint: document.getElementById('fPickupPoint')?.value || '',
    deliveryMode: state.deliveryMode
  };
  localStorage.setItem(CUSTOMER_KEY, JSON.stringify(state.customer));
}

function applyDeliveryMode(mode, persist = true) {
  state.deliveryMode = mode === 'takeaway' ? 'takeaway' : 'delivery';

  document.querySelectorAll('#deliveryToggle [data-mode], #sideDeliveryToggle [data-mode]').forEach((button) => {
    button.classList.toggle('active', button.dataset.mode === state.deliveryMode);
  });

  const addressField = document.getElementById('addressField');
  const addressInput = document.getElementById('fDir');
  const pickupField = document.getElementById('pickupPointField');

  if (addressField) addressField.hidden = state.deliveryMode !== 'delivery';
  if (addressInput) addressInput.required = state.deliveryMode === 'delivery';
  if (pickupField) pickupField.hidden = state.deliveryMode !== 'takeaway';

  setText('cartShipping', state.deliveryMode === 'delivery' ? 'A coordinar' : 'Retiro en local');

  if (persist) {
    state.customer.deliveryMode = state.deliveryMode;
    localStorage.setItem(CUSTOMER_KEY, JSON.stringify(state.customer));
  }
}

async function submitOrder(event) {
  event.preventDefault();

  const entries = getCartEntries();
  if (!entries.length) {
    showToast('Tu carrito está vacío. Elegí una pizza primero.', 'error');
    return;
  }

  const nombre = document.getElementById('fNombre')?.value.trim() || '';
  const telefono = document.getElementById('fTel')?.value.trim() || '';
  const direccion = document.getElementById('fDir')?.value.trim() || '';
  const pickupPoint = document.getElementById('fPickupPoint')?.value || 'Centro de producción (Luis Patrón Costa 1460)';
  const nota = document.getElementById('fNota')?.value.trim() || '';

  if (!nombre) {
    showToast('Completá tu nombre.', 'error');
    document.getElementById('fNombre')?.focus();
    return;
  }

  if (!telefono) {
    showToast('Completá tu teléfono.', 'error');
    document.getElementById('fTel')?.focus();
    return;
  }

  if (state.deliveryMode === 'delivery' && !direccion) {
    showToast('Ingresá tu dirección de entrega.', 'error');
    document.getElementById('fDir')?.focus();
    return;
  }

  const totals = getCartTotals(entries);
  const order = {
    codigo: makeOrderCode(),
    nombre,
    telefono,
    modalidad: state.deliveryMode,
    direccion: state.deliveryMode === 'delivery' ? direccion : pickupPoint,
    pickupPoint: state.deliveryMode === 'takeaway' ? pickupPoint : '',
    pago: state.paymentMethod,
    nota,
    items: entries.map((entry) => ({
      id: entry.id,
      name: entry.product.name,
      unit: productUnit(entry.product),
      qty: entry.qty,
      price: Number(entry.product.price),
      subtotal: entry.subtotal,
      note: entry.note
    })),
    subtotalLista: totals.subtotalLista,
    descuento: totals.descuento,
    total: totals.total,
    createdAt: new Date().toISOString()
  };

  const button = document.getElementById('checkoutBtn');
  setButtonLoading(button, true);

  try {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('No se pudo conectar con el sistema de pedidos.');
    }

    const payload = {
      empresa_id: EMPRESA_ID,
      customer_name: nombre,
      customer_phone: telefono,
      delivery_address: state.deliveryMode === 'delivery' ? direccion : `Retiro: ${pickupPoint}`,
      comment: `Pedido ${order.codigo} · ${state.deliveryMode === 'delivery' ? 'Delivery' : `Retiro (${pickupPoint})`} · Pago: ${state.paymentMethod}${nota ? ` · Nota: ${nota}` : ''}`,
      total: totals.total,
      status: 'pendiente',
      items: {
        codigo: order.codigo,
        modalidad: order.modalidad,
        puntoRetiro: order.pickupPoint || null,
        pago: order.pago,
        envio: 'a coordinar',
        notas: nota,
        subtotalLista: totals.subtotalLista,
        descuento: totals.descuento,
        total: totals.total,
        alias: order.pago === 'transferencia' ? BRAND.alias : null,
        detalle: order.items
      }
    };

    const { error } = await client.from('orders').insert(payload);
    if (error) throw error;

    await saveCustomerRecord({ nombre, telefono, direccion: state.deliveryMode === 'delivery' ? direccion : null });
    state.lastOrder = { ...order, saved: true };
    persistLastOrder();
    clearCart();
    closeCart();
    showSuccessModal(state.lastOrder, true);
  } catch (error) {
    console.error('Error al guardar el pedido:', error);
    state.lastOrder = { ...order, saved: false };
    showSuccessModal(state.lastOrder, false);
    showToast('Podés enviar tu pedido directamente por WhatsApp.', 'error');
  } finally {
    setButtonLoading(button, false);
  }
}

async function saveCustomerRecord({ nombre, telefono, direccion }) {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    const phone = telefono.trim();
    const { data: existing, error: findError } = await client
      .from('customers')
      .select('id')
      .eq('empresa_id', EMPRESA_ID)
      .eq('phone', phone)
      .maybeSingle();

    if (findError) throw findError;

    if (existing?.id) {
      await client
        .from('customers')
        .update({
          name: nombre,
          address: direccion || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .eq('empresa_id', EMPRESA_ID);
    } else {
      await client
        .from('customers')
        .insert({
          empresa_id: EMPRESA_ID,
          name: nombre,
          phone,
          address: direccion || null,
          email: null
        });
    }
  } catch (error) {
    console.warn('No se pudo actualizar la ficha del cliente:', error);
  }
}

function makeOrderCode() {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `#1460-${random}`;
}

function persistLastOrder() {
  if (state.lastOrder) {
    localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(state.lastOrder));
  }
}

function showSuccessModal(order, saved) {
  const content = document.getElementById('successContent');
  if (!content) return;

  const modal = order.modalidad === 'delivery'
    ? 'Delivery a domicilio'
    : `Retiro: ${order.pickupPoint || 'En local'}`;
  const pago = order.pago === 'efectivo'
    ? 'Efectivo · 10% OFF'
    : `Transferencia · alias ${BRAND.alias}`;

  const aliasCopyHTML = order.pago === 'transferencia'
    ? `
      <div class="alias-copy-box alias-copy-box-modal">
        <div class="alias-copy-info">
          <small>Transferí al alias</small>
          <strong>${escapeHTML(BRAND.alias)}</strong>
        </div>
        <button type="button" class="btn-copy-alias" id="modalCopyAliasBtn">
          📋 Copiar alias
        </button>
      </div>
    `
    : '';

  content.innerHTML = `
    <div class="success-check" aria-hidden="true">✓</div>
    <h2 id="successTitle">${saved ? '¡Pedido listo!' : 'Enviar pedido'}</h2>
    <p>${saved
      ? 'Guardamos tu pedido. Tocá el botón verde para enviarlo por WhatsApp.'
      : 'Tocá el botón para enviar tu pedido por WhatsApp.'}</p>
    <span class="success-code">${escapeHTML(order.codigo)}</span>
    ${aliasCopyHTML}
    <div class="success-summary">
      ${order.items.map((item) => `
        <div class="success-summary-row">
          <span>${item.qty}× ${escapeHTML(item.name)}</span>
          <strong>${formatPrice(item.subtotal)}</strong>
        </div>
      `).join('')}
      <div class="success-summary-row">
        <span>${escapeHTML(modal)}</span>
        <strong>${escapeHTML(pago)}</strong>
      </div>
      ${order.descuento > 0 ? `
        <div class="success-summary-row discount">
          <span>Descuento efectivo (10% OFF)</span>
          <strong>-${formatPrice(order.descuento)}</strong>
        </div>
      ` : ''}
      <div class="success-summary-row total">
        <span>Total a pagar</span>
        <strong>${formatPrice(order.total)}</strong>
      </div>
    </div>
    <div class="success-actions">
      <a class="btn btn-whatsapp" id="successWaBtn" href="${escapeAttr(buildWhatsAppMessage(order))}"
        target="_blank" rel="noopener">💬 Enviar pedido por WhatsApp</a>
      <button class="btn btn-ghost" id="successContinueBtn" type="button">
        ${saved ? 'Volver al menú' : 'Volver al carrito'}
      </button>
    </div>
  `;

  document.getElementById('modalCopyAliasBtn')?.addEventListener('click', (event) => {
    copyAliasToClipboard(BRAND.alias, event.currentTarget);
  });

  document.getElementById('successContinueBtn')?.addEventListener('click', () => {
    closeSuccessModal();
    if (!saved) openCart();
  });

  const overlay = document.getElementById('successOverlay');
  if (overlay) overlay.hidden = false;
  syncBodyScroll();
}

function closeSuccessModal() {
  const overlay = document.getElementById('successOverlay');
  if (overlay) overlay.hidden = true;
  syncBodyScroll();
}

/* ─── WHATSAPP ───────────────────────────────────────────────────────────── */

function buildWhatsAppMessage(order) {
  const lines = [];
  lines.push(`🍕 *PEDIDO ${order.codigo}*`);
  lines.push('*14-60 Pizzas Caseras*');
  lines.push('');
  lines.push(`👤 *Cliente:* ${order.nombre}`);
  lines.push(`📞 *Teléfono:* ${order.telefono}`);
  lines.push(`🚚 *Modalidad:* ${order.modalidad === 'delivery' ? 'Delivery' : 'Retiro en local'}`);

  if (order.modalidad === 'delivery') {
    lines.push(`📍 *Dirección:* ${order.direccion}`);
  } else {
    lines.push(`📍 *Punto de retiro:* ${order.pickupPoint || 'Coordinar punto de retiro'}`);
  }

  lines.push(`💳 *Pago:* ${order.pago === 'efectivo'
    ? 'Efectivo (10% de descuento)'
    : `Transferencia (alias ${BRAND.alias})`}`);
  lines.push('');
  lines.push('🧾 *Detalle:*');

  order.items.forEach((item) => {
    lines.push(`• ${item.qty}× ${item.name} — ${formatPrice(item.subtotal)}`);
    if (item.note) lines.push(`   _${item.note}_`);
  });

  lines.push('');
  lines.push(`Subtotal: ${formatPrice(order.subtotalLista)}`);
  if (order.descuento > 0) {
    lines.push(`Descuento efectivo (10%): -${formatPrice(order.descuento)}`);
  }
  lines.push('Envío: A coordinar');
  lines.push(`*Total: ${formatPrice(order.total)}*`);

  if (order.pago === 'transferencia') {
    lines.push(`Alias para transferir: *${BRAND.alias}*`);
  }

  if (order.nota) {
    lines.push('');
    lines.push(`📝 *Nota:* ${order.nota}`);
  }

  return `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`;
}

function buildCartWhatsAppLink() {
  const entries = getCartEntries();
  if (!entries.length) {
    return `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent('Hola, quiero hacer un pedido de pizzas.')}`;
  }

  const totals = getCartTotals(entries);
  const lines = ['🍕 Hola, quiero hacer este pedido:', ''];

  entries.forEach((entry) => {
    lines.push(`• ${entry.qty}× ${entry.product.name} — ${formatPrice(entry.subtotal)}`);
    if (entry.note) lines.push(`   _${entry.note}_`);
  });

  lines.push('');
  lines.push(`Subtotal: ${formatPrice(totals.subtotalLista)}`);
  if (totals.descuento > 0) {
    lines.push(`Descuento efectivo (10%): -${formatPrice(totals.descuento)}`);
    lines.push(`*Total en efectivo: ${formatPrice(totals.total)}*`);
  } else {
    lines.push(`*Total transferencia: ${formatPrice(totals.total)}* (alias ${BRAND.alias})`);
  }
  lines.push('Envío: A coordinar');

  return `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`;
}

/* ─── CARGA DESDE SUPABASE ───────────────────────────────────────────────── */

function getSupabaseClient() {
  if (!window.supabase) return null;
  if (!state.supabase) {
    state.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return state.supabase;
}

async function loadFromSupabase() {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    const categoriesResult = await client
      .from('categories')
      .select('*')
      .eq('empresa_id', EMPRESA_ID)
      .eq('is_active', true)
      .order('sort_order');

    if (!categoriesResult.error && categoriesResult.data?.length) {
      state.categories = categoriesResult.data.map((category) => ({
        id: category.id,
        slug: category.slug || 'otros',
        name: category.name,
        icon: category.icon || '🍕',
        order: Number(category.sort_order || 0)
      }));
    }

    const [productsResult, bannersResult] = await Promise.all([
      client
        .from('products')
        .select('*')
        .eq('empresa_id', EMPRESA_ID)
        .eq('is_active', true)
        .order('sort_order'),
      client
        .from('banners')
        .select('*')
        .eq('empresa_id', EMPRESA_ID)
        .eq('is_active', true)
        .order('sort_order')
    ]);

    if (!productsResult.error && productsResult.data?.length) {
      const previousMenu = state.menu;
      const nextMenu = productsResult.data.map((product) => mapSupabaseProduct(product));
      migrateCartByName(previousMenu, nextMenu);
      state.menu = nextMenu;
      saveCart();
    }

    if (!bannersResult.error && bannersResult.data?.length) {
      state.banners = bannersResult.data.map((banner) => ({
        id: banner.id,
        image: banner.image_url,
        title: banner.title || '',
        subtitle: banner.subtitle || '',
        link: banner.link || '#menu',
        sort: Number(banner.sort_order || 0)
      }));
    }

    renderCategories();
    renderBanners();
    renderMenu();
    renderCart();
  } catch (error) {
    console.warn('Se usa el catálogo local:', error);
  }
}

function productUnit(product) {
  return product?.unit || product?.unit_type || 'unidad';
}

function mapSupabaseProduct(product) {
  const category = state.categories.find((cat) => cat.id === product.category_id);
  const unit = product.unit_type || 'unidad';
  return {
    id: product.id,
    cat: category?.slug || 'otros',
    name: product.name,
    desc: product.description || '',
    ingredients: product.ingredients || '',
    prepDesc: product.prep_descripcion || '',
    prepTime: product.prep_tiempo || '',
    price: Number(product.price || 0),
    unit,
    minQty: unit === 'persona' ? 25 : 1,
    image: product.image_url || fallbackImage(category?.slug),
    emoji: product.emoji || '🍕',
    tags: Array.isArray(product.tags) ? product.tags : [],
    hot: Boolean(product.hot),
    rating: Number(product.rating || 5),
    sort: Number(product.sort_order || 0)
  };
}

function migrateCartByName(previousMenu, nextMenu) {
  const nextIds = new Set(nextMenu.map((product) => String(product.id)));

  Object.keys(state.cart).forEach((oldId) => {
    if (nextIds.has(String(oldId))) return;
    const oldProduct = previousMenu.find((product) => String(product.id) === String(oldId));
    if (!oldProduct) return;
    const match = nextMenu.find(
      (product) => normalize(product.name) === normalize(oldProduct.name)
    );
    if (match) {
      state.cart[match.id] = state.cart[oldId];
      delete state.cart[oldId];
    }
  });
}

/* ─── UTILIDADES ─────────────────────────────────────────────────────────── */

function formatPrice(value) {
  const number = Number(value) || 0;
  return `$${number.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
}

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[character]));
}

function escapeAttr(value) {
  return escapeHTML(value);
}

function clone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function setValue(id, value) {
  const element = document.getElementById(id);
  if (element) element.value = value;
}

function setButtonLoading(button, loading) {
  if (!button) return;
  if (loading) {
    button.dataset.originalText = button.textContent;
    button.textContent = 'Procesando…';
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText || 'Confirmar pedido';
    button.disabled = false;
  }
}

function showToast(message, type = '') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  clearTimeout(state.toastTimer);
  toast.textContent = message;
  toast.classList.toggle('is-error', type === 'error');
  toast.classList.add('is-visible');
  state.toastTimer = setTimeout(() => {
    toast.classList.remove('is-visible');
  }, 2600);
}

function setFooterYear() {
  const year = document.getElementById('footerYear');
  if (year) year.textContent = String(new Date().getFullYear());
}
