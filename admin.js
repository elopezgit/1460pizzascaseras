'use strict';

/* ─── 14-60 Pizzas Caseras LPH · Panel de Administración v2 ──────────────── */

const ADMIN_USER = 'admin';
const ADMIN_PASS = '123456';
const ADMIN_SESSION_KEY = 'p1460_admin_session';
const ADMIN_CACHE_KEY = 'p1460_admin_cache_v2';
const ADMIN_THEME_KEY = 'p1460_admin_theme_light_v1';

const STATUS_LABELS = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  preparando: 'En preparación',
  en_preparacion: 'En preparación',
  listo: 'Listo',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado'
};

const CATALOG_VIEWS = ['productos', 'categorias', 'asignacion', 'banners'];
const ALL_VIEWS = ['resumen', 'pedidos', 'productos', 'categorias', 'asignacion', 'banners', 'clientes'];

const PRODUCT_IMAGE_PRESETS = [
  { label: 'Muzzarella', path: 'img/productos/muzzarella.webp' },
  { label: 'Extra Muzza', path: 'img/productos/extra-muzza.webp' },
  { label: 'Especial Jamón', path: 'img/productos/especial-jamon.webp' },
  { label: '4 Quesos', path: 'img/productos/4-quesos.webp' },
  { label: 'Fugazzetta Caram.', path: 'img/productos/fugazzetta-caramelizada.webp' },
  { label: 'Fugazza Especial', path: 'img/productos/fugazza-especial.webp' },
  { label: 'Calabresa', path: 'img/productos/calabresa.webp' },
  { label: 'Provenzal', path: 'img/productos/provenzal.webp' },
  { label: 'Roquefort y Nueces', path: 'img/productos/roquefort-nueces.webp' },
  { label: 'Cheddar', path: 'img/productos/cheddar.webp' },
  { label: 'Turca', path: 'img/productos/turca.webp' },
  { label: 'Huevo', path: 'img/productos/huevo.webp' },
  { label: 'Combo 2 Muzzas', path: 'img/productos/combo-muzzarella.webp' },
  { label: 'Combo 4 Clásicas', path: 'img/productos/combo-clasicas.webp' },
  { label: 'Pizza Party', path: 'img/productos/pizza-party.webp' }
];

const BANNER_IMAGE_PRESETS = [
  { label: 'Banner LPH', path: 'img/banners/banner-lph.webp' },
  { label: 'Banner Pizza Party', path: 'img/banners/banner-pizza-party.webp' },
  { label: 'Banner Clásicas', path: 'img/banners/banner-clasicas.webp' },
  { label: 'Extra Muzza', path: 'img/productos/extra-muzza.webp' },
  { label: 'Combo Muzzarella', path: 'img/productos/combo-muzzarella.webp' },
  { label: 'Pizza Party Foto', path: 'img/productos/pizza-party.webp' }
];

const CATEGORY_ICON_PRESETS = ['🍕', '⭐', '🧅', '🎉', '🧀', '🌶️', '🌿', '🍖', '🔥', '🥟', '🥤', '🍺', '🍽️'];

const adminState = {
  orders: [],
  products: [],
  categories: [],
  banners: [],
  customers: [],
  view: 'resumen',
  orderSearch: '',
  orderStatus: 'todos',
  productSearch: '',
  productCategory: 'todos',
  productStatus: 'todos',
  categorySearch: '',
  assignSearch: '',
  assignFilterCategory: 'todos',
  selectedAssignProducts: new Set(),
  bannerSearch: '',
  customerSearch: '',
  modalProductId: null,
  online: false,
  loading: false,
  toastTimer: null
};

document.addEventListener('DOMContentLoaded', initAdmin);

function initAdmin() {
  initAdminTheme();
  bindAdminEvents();
  setFooterDate();

  if (localStorage.getItem(ADMIN_SESSION_KEY) === '1') {
    showAdmin();
    loadAdminData();
  } else {
    document.getElementById('loginView').hidden = false;
    document.getElementById('adminApp').hidden = true;
    setTimeout(() => document.getElementById('loginUser')?.focus(), 80);
  }
}

/* ─── ACCESO Y EVENTOS ───────────────────────────────────────────────────── */

function bindAdminEvents() {
  document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
  document.getElementById('logoutBtn')?.addEventListener('click', logout);

  document.querySelectorAll('.nav-link, .catalog-tab').forEach((button) => {
    button.addEventListener('click', () => switchView(button.dataset.view));
  });

  document.querySelectorAll('[data-view-link]').forEach((button) => {
    button.addEventListener('click', () => switchView(button.dataset.viewLink));
  });

  document.getElementById('refreshBtn')?.addEventListener('click', () => loadAdminData());
  document.getElementById('themeBtn')?.addEventListener('click', toggleAdminTheme);
  document.getElementById('menuBtn')?.addEventListener('click', () => toggleSidebar());
  document.getElementById('sidebarOverlay')?.addEventListener('click', () => toggleSidebar(false));

  // Filtros Pedidos
  document.getElementById('orderSearch')?.addEventListener('input', (event) => {
    adminState.orderSearch = event.target.value.trim();
    renderOrders();
  });
  document.getElementById('orderStatusFilter')?.addEventListener('change', (event) => {
    adminState.orderStatus = event.target.value;
    renderOrders();
  });

  // Filtros Productos
  document.getElementById('productSearch')?.addEventListener('input', (event) => {
    adminState.productSearch = event.target.value.trim();
    renderProducts();
  });
  document.getElementById('productCategoryFilter')?.addEventListener('change', (event) => {
    adminState.productCategory = event.target.value;
    renderProducts();
  });
  document.getElementById('productStatusFilter')?.addEventListener('change', (event) => {
    adminState.productStatus = event.target.value;
    renderProducts();
  });

  // Filtros Categorías
  document.getElementById('categorySearch')?.addEventListener('input', (event) => {
    adminState.categorySearch = event.target.value.trim();
    renderCategoriesAdmin();
  });

  // Filtros Asignación
  document.getElementById('assignSearch')?.addEventListener('input', (event) => {
    adminState.assignSearch = event.target.value.trim();
    renderAssignmentView();
  });
  document.getElementById('assignFilterCategory')?.addEventListener('change', (event) => {
    adminState.assignFilterCategory = event.target.value;
    renderAssignmentView();
  });
  document.getElementById('assignSelectAll')?.addEventListener('change', (event) => {
    toggleSelectAllVisibleProducts(event.target.checked);
  });
  document.getElementById('assignBulkApplyBtn')?.addEventListener('click', applyBulkCategoryAssignment);

  // Filtros Banners
  document.getElementById('bannerSearch')?.addEventListener('input', (event) => {
    adminState.bannerSearch = event.target.value.trim();
    renderBannersAdmin();
  });

  // Filtros Clientes
  document.getElementById('customerSearch')?.addEventListener('input', (event) => {
    adminState.customerSearch = event.target.value.trim();
    renderCustomers();
  });

  // Botones de alta y acciones principales
  document.getElementById('newProductBtn')?.addEventListener('click', () => openProductModal());
  document.getElementById('quickNewProductBtn')?.addEventListener('click', () => {
    switchView('productos');
    openProductModal();
  });
  document.getElementById('bulkPriceBtn')?.addEventListener('click', () => openBulkPriceModal());

  document.getElementById('newCategoryBtn')?.addEventListener('click', () => openCategoryModal());
  document.getElementById('quickNewCategoryBtn')?.addEventListener('click', () => {
    switchView('categorias');
    openCategoryModal();
  });
  document.getElementById('seedCategoriesBtn')?.addEventListener('click', seedDefaultCategories);

  document.getElementById('newBannerBtn')?.addEventListener('click', () => openBannerModal());
  document.getElementById('quickNewBannerBtn')?.addEventListener('click', () => {
    switchView('banners');
    openBannerModal();
  });
  document.getElementById('seedBannersBtn')?.addEventListener('click', seedDefaultBanners);

  document.getElementById('newCustomerBtn')?.addEventListener('click', () => openCustomerModal());

  document.getElementById('modalCloseBtn')?.addEventListener('click', closeModal);
  document.getElementById('modalOverlay')?.addEventListener('click', (event) => {
    if (event.target === event.currentTarget) closeModal();
  });

  document.addEventListener('click', handleAdminClick);
  document.addEventListener('change', handleAdminChange);
  document.addEventListener('input', handleAdminInput);
  document.addEventListener('submit', handleAdminSubmit);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeModal();
      toggleSidebar(false);
    }
  });
}

function handleLogin(event) {
  event.preventDefault();
  const user = document.getElementById('loginUser')?.value.trim() || '';
  const pass = document.getElementById('loginPass')?.value || '';
  const error = document.getElementById('loginError');

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    localStorage.setItem(ADMIN_SESSION_KEY, '1');
    if (error) error.hidden = true;
    document.getElementById('loginPass').value = '';
    showAdmin();
    loadAdminData();
  } else if (error) {
    error.hidden = false;
    document.getElementById('loginPass').value = '';
    document.getElementById('loginPass')?.focus();
  }
}

function showAdmin() {
  document.getElementById('loginView').hidden = true;
  document.getElementById('adminApp').hidden = false;
  switchView(adminState.view || 'resumen');
  setFooterDate();
}

function logout() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
  closeModal();
  document.getElementById('adminApp').hidden = true;
  document.getElementById('loginView').hidden = false;
  document.getElementById('loginPass').value = '';
  document.getElementById('loginUser')?.focus();
}

function setFooterDate() {
  const subtitle = document.getElementById('pageSubtitle');
  if (subtitle && !adminState.loading) {
    subtitle.textContent = new Intl.DateTimeFormat('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date());
  }
}

/* ─── NAVEGACIÓN ─────────────────────────────────────────────────────────── */

function switchView(view) {
  const target = ALL_VIEWS.includes(view) ? view : 'resumen';
  adminState.view = target;

  document.querySelectorAll('.nav-link').forEach((button) => {
    button.classList.toggle('active', button.dataset.view === target);
  });

  document.querySelectorAll('.catalog-tab').forEach((button) => {
    button.classList.toggle('active', button.dataset.view === target);
  });

  const catalogTabs = document.getElementById('catalogTabs');
  if (catalogTabs) {
    catalogTabs.hidden = !CATALOG_VIEWS.includes(target);
  }

  document.querySelectorAll('.view').forEach((section) => {
    section.classList.toggle('active', section.id === `view-${target}`);
  });

  const meta = {
    resumen: { title: 'Resumen General', eyebrow: 'Administración' },
    pedidos: { title: 'Pedidos', eyebrow: 'Ventas y entregas' },
    productos: { title: 'CRUD de Productos', eyebrow: 'Gestión del Menú' },
    categorias: { title: 'CRUD de Categorías', eyebrow: 'Gestión del Menú' },
    asignacion: { title: 'Asignación Producto ↔ Categoría', eyebrow: 'Gestión del Menú' },
    banners: { title: 'CRUD de Banners', eyebrow: 'Gestión del Menú' },
    clientes: { title: 'Clientes', eyebrow: 'Base de datos' }
  }[target];

  const title = document.getElementById('pageTitle');
  const eyebrow = document.getElementById('pageEyebrow');
  if (title && meta) title.textContent = meta.title;
  if (eyebrow && meta) eyebrow.textContent = meta.eyebrow;
  setFooterDate();
  toggleSidebar(false);
}

function toggleSidebar(force) {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (!sidebar || !overlay) return;
  const open = typeof force === 'boolean' ? force : !sidebar.classList.contains('is-open');
  sidebar.classList.toggle('is-open', open);
  overlay.classList.toggle('is-open', open);
}

/* ─── CARGA Y SINCRONIZACIÓN SUPABASE ────────────────────────────────────── */

function getClient() {
  if (!window.supabase) return null;
  if (!adminState.client) {
    adminState.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return adminState.client;
}

async function loadAdminData(showFeedback = true) {
  const client = getClient();
  if (!client) {
    loadAdminCache();
    setConnection(false);
    renderAll();
    if (showFeedback) showToast('Sin conexión con Supabase. Mostrando datos guardados.', 'error');
    return;
  }

  setSyncLoading(true);

  try {
    const [ordersResult, productsResult, categoriesResult, bannersResult, customersResult] = await Promise.all([
      client.from('orders')
        .select('id, empresa_id, customer_name, customer_phone, delivery_address, comment, total, status, items, created_at')
        .eq('empresa_id', EMPRESA_ID)
        .order('created_at', { ascending: false }),
      client.from('products')
        .select('*')
        .eq('empresa_id', EMPRESA_ID)
        .order('sort_order'),
      client.from('categories')
        .select('*')
        .eq('empresa_id', EMPRESA_ID)
        .order('sort_order'),
      client.from('banners')
        .select('*')
        .eq('empresa_id', EMPRESA_ID)
        .order('sort_order'),
      client.from('customers')
        .select('*')
        .eq('empresa_id', EMPRESA_ID)
        .order('created_at', { ascending: false })
    ]);

    if (!ordersResult.error) adminState.orders = ordersResult.data || [];
    if (!productsResult.error) adminState.products = productsResult.data || [];
    if (!categoriesResult.error) adminState.categories = categoriesResult.data || [];
    if (!bannersResult.error) adminState.banners = bannersResult.data || [];
    if (!customersResult.error) adminState.customers = customersResult.data || [];

    const criticalErrors = [ordersResult, productsResult, categoriesResult].filter((r) => r.error);

    if (criticalErrors.length) {
      setConnection(false);
      if (showFeedback) {
        showToast(`Error parcial al sincronizar: ${criticalErrors[0].error.message}`, 'error');
      }
    } else {
      setConnection(true);
      saveAdminCache();
      if (showFeedback) showToast('Datos sincronizados con Supabase.');
    }
  } catch (error) {
    console.error('Error al cargar el panel:', error);
    loadAdminCache();
    setConnection(false);
    if (showFeedback) showToast('No se pudo conectar. Mostrando caché local.', 'error');
  } finally {
    setSyncLoading(false);
    renderAll();
  }
}

function setSyncLoading(loading) {
  adminState.loading = loading;
  const button = document.getElementById('refreshBtn');
  if (button) {
    button.disabled = loading;
    button.textContent = loading ? 'Actualizando…' : '↻ Actualizar';
  }
}

function setConnection(online) {
  adminState.online = Boolean(online);
  const badge = document.getElementById('connectionBadge');
  const text = document.getElementById('connectionText');
  if (!badge || !text) return;
  badge.classList.toggle('is-online', online);
  badge.classList.toggle('is-offline', !online);
  text.textContent = online ? 'Supabase conectado' : 'Sin conexión · caché local';
}

function saveAdminCache() {
  try {
    localStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify({
      orders: adminState.orders,
      products: adminState.products,
      categories: adminState.categories,
      banners: adminState.banners,
      customers: adminState.customers,
      savedAt: new Date().toISOString()
    }));
  } catch (error) {
    console.warn('No se pudo guardar la caché del panel:', error);
  }
}

function loadAdminCache() {
  try {
    const raw = localStorage.getItem(ADMIN_CACHE_KEY);
    if (!raw) return;
    const cached = JSON.parse(raw);
    if (Array.isArray(cached.orders)) adminState.orders = cached.orders;
    if (Array.isArray(cached.products)) adminState.products = cached.products;
    if (Array.isArray(cached.categories)) adminState.categories = cached.categories;
    if (Array.isArray(cached.banners)) adminState.banners = cached.banners;
    if (Array.isArray(cached.customers)) adminState.customers = cached.customers;
  } catch (error) {
    console.warn('No se pudo leer la caché del panel:', error);
  }
}

/* ─── RENDER GENERAL ─────────────────────────────────────────────────────── */

function renderAll() {
  renderCounts();
  renderStats();
  renderRecentOrders();
  renderOrders();
  renderCategorySelects();
  renderProducts();
  renderCategoriesAdmin();
  renderAssignmentView();
  renderBannersAdmin();
  renderCustomers();
}

function getUnassignedProductsCount() {
  const validCatIds = new Set(adminState.categories.map((c) => String(c.id)));
  return adminState.products.filter((p) => !p.category_id || !validCatIds.has(String(p.category_id))).length;
}

function renderCounts() {
  const unassigned = getUnassignedProductsCount();
  setText('navOrdersCount', String(adminState.orders.length));
  setText('navProductsCount', String(adminState.products.length));
  setText('navCategoriesCount', String(adminState.categories.length));
  setText('navUnassignedCount', String(unassigned));
  setText('navBannersCount', String(adminState.banners.length));
  setText('navCustomersCount', String(adminState.customers.length));
}

function renderStats() {
  const activeOrders = adminState.orders.filter((order) => normalizeStatus(order.status) !== 'cancelado');
  const pending = adminState.orders.filter((order) => ['pendiente', 'confirmado', 'preparando', 'en_preparacion'].includes(normalizeStatus(order.status)));
  const revenue = activeOrders.reduce((sum, order) => sum + getOrderTotal(order), 0);
  const activeProducts = adminState.products.filter((p) => p.is_active !== false).length;
  const activeCategories = adminState.categories.filter((c) => c.is_active !== false).length;
  const activeBanners = adminState.banners.filter((b) => b.is_active !== false).length;
  const unassigned = getUnassignedProductsCount();

  setText('statOrders', String(adminState.orders.length));
  setText('statPending', String(pending.length));
  setText('statRevenue', formatPrice(revenue));
  setText('statActiveProducts', `${activeProducts} / ${adminState.products.length}`);
  setText('statCustomers', String(adminState.customers.length));

  setText('summaryProductsTotal', `${activeProducts} activos (${adminState.products.length} total)`);
  setText('summaryCategoriesTotal', `${activeCategories} activas (${adminState.categories.length} total)`);
  setText('summaryUnassignedTotal', unassigned > 0 ? `⚠️ ${unassigned} sin asignar` : '0 (todos asignados)');
  setText('summaryBannersTotal', `${activeBanners} activos (${adminState.banners.length} total)`);
}

function renderCategorySelects() {
  const sortedCategories = [...adminState.categories].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));

  // 1. Filtro de productos
  const prodSelect = document.getElementById('productCategoryFilter');
  if (prodSelect) {
    const current = adminState.productCategory;
    prodSelect.innerHTML = [
      '<option value="todos">Todas las categorías</option>',
      '<option value="sin_categoria">⚠️ Sin categoría asignada</option>',
      ...sortedCategories.map((cat) => `<option value="${escapeAttr(cat.id)}">${escapeHTML(cat.icon || '🍕')} ${escapeHTML(cat.name)}</option>`)
    ].join('');
    const validValues = new Set(['todos', 'sin_categoria', ...sortedCategories.map((c) => String(c.id))]);
    prodSelect.value = validValues.has(String(current)) ? current : 'todos';
    adminState.productCategory = prodSelect.value;
  }

  // 2. Filtro en vista de Asignación
  const assignFilter = document.getElementById('assignFilterCategory');
  if (assignFilter) {
    const current = adminState.assignFilterCategory;
    assignFilter.innerHTML = [
      '<option value="todos">Todas las categorías</option>',
      '<option value="sin_categoria">⚠️ Solo productos sin categoría</option>',
      ...sortedCategories.map((cat) => `<option value="${escapeAttr(cat.id)}">${escapeHTML(cat.icon || '🍕')} ${escapeHTML(cat.name)}</option>`)
    ].join('');
    const validValues = new Set(['todos', 'sin_categoria', ...sortedCategories.map((c) => String(c.id))]);
    assignFilter.value = validValues.has(String(current)) ? current : 'todos';
    adminState.assignFilterCategory = assignFilter.value;
  }

  // 3. Destino masivo en vista de Asignación
  const bulkTarget = document.getElementById('assignBulkTargetCategory');
  if (bulkTarget) {
    const previous = bulkTarget.value;
    bulkTarget.innerHTML = [
      '<option value="">Elegir categoría destino…</option>',
      ...sortedCategories.map((cat) => `<option value="${escapeAttr(cat.id)}">${escapeHTML(cat.icon || '🍕')} ${escapeHTML(cat.name)}</option>`),
      '<option value="__none__">🚫 Quitar categoría (dejar sin asignar)</option>'
    ].join('');
    if (previous) bulkTarget.value = previous;
  }
}

/* ─── PEDIDOS ────────────────────────────────────────────────────────────── */

function renderRecentOrders() {
  const body = document.getElementById('recentOrdersBody');
  if (!body) return;
  const recent = adminState.orders.slice(0, 6);

  if (!recent.length) {
    body.innerHTML = '<tr><td colspan="4" class="empty-cell">Sin pedidos todavía.</td></tr>';
    return;
  }

  body.innerHTML = recent.map((order) => {
    const meta = getOrderMeta(order);
    return `
      <tr data-order-open="${escapeAttr(order.id)}" tabindex="0" role="button">
        <td>
          <span class="cell-main mono">${escapeHTML(meta.codigo)}</span>
          <span class="cell-sub">${formatDate(order.created_at)}</span>
        </td>
        <td>${escapeHTML(order.customer_name || 'Sin nombre')}</td>
        <td><strong>${formatPrice(getOrderTotal(order))}</strong></td>
        <td>${statusBadge(order.status)}</td>
      </tr>
    `;
  }).join('');
}

function renderOrders() {
  const body = document.getElementById('ordersBody');
  if (!body) return;

  const query = normalizeText(adminState.orderSearch);
  const filter = adminState.orderStatus;

  const orders = adminState.orders.filter((order) => {
    const status = normalizeStatus(order.status);
    if (filter !== 'todos') {
      if (filter === 'preparando') {
        if (status !== 'preparando' && status !== 'en_preparacion') return false;
      } else if (status !== filter) {
        return false;
      }
    }
    if (!query) return true;
    const meta = getOrderMeta(order);
    const haystack = normalizeText([
      meta.codigo,
      order.customer_name,
      order.customer_phone,
      order.delivery_address,
      order.comment,
      meta.pago,
      ...meta.items.map((item) => item.name)
    ].join(' '));
    return haystack.includes(query);
  });

  if (!orders.length) {
    body.innerHTML = '<tr><td colspan="7" class="empty-cell">No hay pedidos que coincidan con el filtro.</td></tr>';
    return;
  }

  body.innerHTML = orders.map((order) => {
    const meta = getOrderMeta(order);
    const entrega = meta.modalidad === 'delivery' ? '🛵 Delivery' : '🏪 Retiro';
    const pago = meta.pago === 'efectivo' ? '💵 Efectivo' : meta.pago === 'transferencia' ? '🏦 Transferencia' : '—';
    return `
      <tr data-order-open="${escapeAttr(order.id)}" tabindex="0" role="button">
        <td>
          <span class="cell-main mono">${escapeHTML(meta.codigo)}</span>
          <span class="cell-sub">${formatDate(order.created_at)}</span>
        </td>
        <td>
          <span class="cell-main">${escapeHTML(order.customer_name || 'Sin nombre')}</span>
          <span class="cell-sub">${escapeHTML(order.customer_phone || '')}</span>
        </td>
        <td>
          <span class="cell-main">${entrega}</span>
          <span class="cell-sub">${escapeHTML(meta.modalidad === 'delivery' ? (order.delivery_address || 'Sin dirección') : 'Retiro en local')}</span>
        </td>
        <td>${pago}</td>
        <td><strong>${formatPrice(getOrderTotal(order))}</strong></td>
        <td>${statusBadge(order.status)}</td>
        <td><button type="button" class="btn btn-ghost btn-small" data-order-open="${escapeAttr(order.id)}">Ver</button></td>
      </tr>
    `;
  }).join('');
}

function openOrderModal(orderId) {
  const order = adminState.orders.find((row) => String(row.id) === String(orderId));
  if (!order) return;

  const meta = getOrderMeta(order);
  const status = normalizeStatus(order.status);
  const selectedStatus = status === 'en_preparacion' ? 'preparando' : status;
  const alias = meta.pago === 'transferencia' ? `<div><span>Alias</span><strong>${escapeHTML(BRAND.alias)}</strong></div>` : '';
  const itemsRows = meta.items.length
    ? meta.items.map((item) => `
        <tr>
          <td>${escapeHTML(item.name || 'Producto')}${item.note ? `<span class="cell-sub">${escapeHTML(item.note)}</span>` : ''}</td>
          <td>${Number(item.qty || 0)}</td>
          <td>${formatPrice(item.subtotal ?? Number(item.price || 0) * Number(item.qty || 0))}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="3" class="empty-cell">Sin detalle de productos.</td></tr>';

  const subtotal = Number(meta.subtotalLista || getOrderTotal(order));
  const discount = Number(meta.descuento || 0);
  const total = Number(meta.total ?? getOrderTotal(order));

  document.getElementById('modalContent').innerHTML = `
    <div class="modal-head">
      <p class="eyebrow">Pedido</p>
      <h2>${escapeHTML(meta.codigo)}</h2>
      <p>${formatDateTime(order.created_at)} · ${statusBadge(order.status)}</p>
    </div>

    <div class="order-detail-grid">
      <div><span>Cliente</span><strong>${escapeHTML(order.customer_name || 'Sin nombre')}</strong></div>
      <div><span>Teléfono</span><strong>${escapeHTML(order.customer_phone || '—')}</strong></div>
      <div><span>Modalidad</span><strong>${meta.modalidad === 'delivery' ? 'Delivery' : 'Retiro en local'}</strong></div>
      <div><span>Pago</span><strong>${meta.pago ? capitalize(meta.pago) : '—'}</strong></div>
      <div class="span-2"><span>Dirección</span><strong>${escapeHTML(meta.modalidad === 'delivery' ? (order.delivery_address || 'Sin dirección') : 'Coordinar punto de retiro')}</strong></div>
      ${alias}
    </div>

    <table class="order-items">
      <thead><tr><th>Producto</th><th>Cant.</th><th>Subtotal</th></tr></thead>
      <tbody>${itemsRows}</tbody>
    </table>

    <div class="order-totals">
      <div><span>Subtotal</span><strong>${formatPrice(subtotal)}</strong></div>
      ${discount > 0 ? `<div class="discount"><span>Descuento efectivo (10%)</span><strong>-${formatPrice(discount)}</strong></div>` : ''}
      <div class="total"><span>Total</span><strong>${formatPrice(total)}</strong></div>
    </div>

    ${order.comment || meta.notas ? `<p class="order-note"><strong>Nota:</strong> ${escapeHTML(meta.notas || order.comment)}</p>` : ''}

    <form class="status-form" id="orderStatusForm" data-order-id="${escapeAttr(order.id)}">
      <label class="field">
        <span>Estado del pedido</span>
        <select name="status" id="orderStatusSelect">
          ${Object.entries(STATUS_LABELS)
            .filter(([key]) => key !== 'en_preparacion')
            .map(([key, label]) => `<option value="${key}" ${selectedStatus === key ? 'selected' : ''}>${label}</option>`)
            .join('')}
        </select>
      </label>
      <button type="submit" class="btn btn-primary">Guardar estado</button>
    </form>

    <div class="modal-actions">
      <a class="btn btn-ghost" href="${escapeAttr(customerWhatsApp(order.customer_phone, meta.codigo))}" target="_blank" rel="noopener">💬 WhatsApp al cliente</a>
      <button type="button" class="btn btn-ghost" data-close-modal>Cerrar</button>
    </div>
  `;

  openModal();
}

async function updateOrderStatus(orderId, status) {
  const client = getClient();
  if (!client) {
    showToast('Sin conexión con Supabase.', 'error');
    return;
  }

  try {
    const { data, error } = await client
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .eq('empresa_id', EMPRESA_ID)
      .select('id');

    if (error) throw error;
    if (!data?.length) throw new Error('No se encontró el pedido en esta empresa.');

    const order = adminState.orders.find((row) => String(row.id) === String(orderId));
    if (order) order.status = status;
    saveAdminCache();
    closeModal();
    renderAll();
    showToast('Estado del pedido actualizado.');
  } catch (error) {
    console.error('Error al actualizar el estado:', error);
    showToast(`No se pudo actualizar el estado: ${error.message}`, 'error');
  }
}

/* ─── 1. CRUD DE PRODUCTOS ───────────────────────────────────────────────── */

function renderProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  const query = normalizeText(adminState.productSearch);
  const categoryFilter = adminState.productCategory;
  const statusFilter = adminState.productStatus;
  const validCatIds = new Set(adminState.categories.map((c) => String(c.id)));
  const sortedCategories = [...adminState.categories].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));

  const products = adminState.products
    .filter((product) => {
      const hasValidCategory = product.category_id && validCatIds.has(String(product.category_id));
      if (categoryFilter === 'sin_categoria') {
        if (hasValidCategory) return false;
      } else if (categoryFilter !== 'todos' && String(product.category_id) !== String(categoryFilter)) {
        return false;
      }

      if (statusFilter === 'activos' && product.is_active === false) return false;
      if (statusFilter === 'ocultos' && product.is_active !== false) return false;
      if (statusFilter === 'destacados' && !product.hot) return false;
      if (statusFilter === 'sin_categoria' && hasValidCategory) return false;

      if (!query) return true;
      return normalizeText(`${product.name} ${product.description} ${product.ingredients} ${product.code} ${(product.tags || []).join(' ')}`).includes(query);
    })
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));

  if (!products.length) {
    grid.innerHTML = `
      <div class="panel span-full empty-panel">
        <p class="empty-cell">No hay productos que coincidan con la búsqueda o filtro actual.</p>
        <div class="empty-panel-actions">
          <button type="button" class="btn btn-primary" data-action="new-product">+ Crear nuevo producto</button>
        </div>
      </div>
    `;
    return;
  }

  grid.innerHTML = products.map((product) => {
    const image = product.image_url || 'img/productos/muzzarella.webp';
    const active = product.is_active !== false;
    const isHot = Boolean(product.hot);
    const catOptions = [
      `<option value="">⚠️ Sin categoría</option>`,
      ...sortedCategories.map((cat) => `<option value="${escapeAttr(cat.id)}" ${String(product.category_id) === String(cat.id) ? 'selected' : ''}>${escapeHTML(cat.icon || '🍕')} ${escapeHTML(cat.name)}</option>`)
    ].join('');

    return `
      <article class="admin-product ${active ? '' : 'is-inactive'}">
        <div class="admin-product-media">
          <img src="${escapeAttr(image)}" alt="${escapeAttr(product.name)}" loading="lazy"
            onerror="this.src='img/productos/muzzarella.webp'">
          <div class="product-badges-top">
            <span class="product-tag ${active ? 'is-on' : ''}">${active ? 'Activo' : 'Oculto'}</span>
            ${isHot ? '<span class="product-tag is-hot">🔥 Más pedida</span>' : ''}
          </div>
          <span class="product-order-pill" title="Orden de aparición">#${Number(product.sort_order || 0)}</span>
        </div>
        <div class="admin-product-body">
          <div class="product-inline-cat">
            <label class="sr-only">Categoría</label>
            <select class="inline-cat-select" data-inline-category-product="${escapeAttr(product.id)}" title="Cambiar categoría instantáneamente">
              ${catOptions}
            </select>
          </div>
          <h3>${escapeHTML(product.emoji || '🍕')} ${escapeHTML(product.name)}</h3>
          <p>${escapeHTML(product.description || 'Sin descripción.')}</p>
          <div class="admin-product-prices">
            <strong>${formatPrice(product.price)}</strong>
            <span>💵 ${formatPrice(getCashPrice(product.price))} efvo. ${product.unit_type === 'persona' ? '/ pers.' : ''}</span>
          </div>
          <div class="admin-product-actions">
            <button type="button" class="btn btn-primary btn-small" data-product-edit="${escapeAttr(product.id)}">✏️ Editar</button>
            <button type="button" class="btn btn-ghost btn-small" data-product-hot="${escapeAttr(product.id)}" title="${isHot ? 'Quitar de destacados' : 'Destacar como más pedida'}">${isHot ? '🔥 Destacado' : '☆ Destacar'}</button>
            <button type="button" class="btn btn-ghost btn-small" data-product-toggle="${escapeAttr(product.id)}">${active ? '👁️ Ocultar' : '👁️ Mostrar'}</button>
            <button type="button" class="btn btn-ghost btn-small" data-product-duplicate="${escapeAttr(product.id)}" title="Duplicar producto">📋 Duplicar</button>
            <button type="button" class="btn btn-danger btn-small" data-product-delete="${escapeAttr(product.id)}" title="Eliminar producto">🗑️</button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function openProductModal(productId = null, duplicateSource = null) {
  adminState.modalProductId = productId;
  const product = duplicateSource || (productId
    ? adminState.products.find((row) => String(row.id) === String(productId))
    : null);
  const isEditing = Boolean(productId && !duplicateSource);

  const categoryOptions = [...adminState.categories]
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
    .map((category) => `<option value="${escapeAttr(category.id)}" ${String(product?.category_id) === String(category.id) ? 'selected' : ''}>${escapeHTML(category.icon || '🍕')} ${escapeHTML(category.name)}</option>`)
    .join('');

  const basePrice = product ? Number(product.price || 0) : 10000;
  const currentImage = product?.image_url || 'img/productos/muzzarella.webp';
  const nextOrder = isEditing
    ? Number(product?.sort_order || 0)
    : (adminState.products.reduce((max, p) => Math.max(max, Number(p.sort_order || 0)), 0) + 1);

  const presetsHtml = PRODUCT_IMAGE_PRESETS.map((preset) => `
    <button type="button" class="img-preset-chip ${currentImage === preset.path ? 'is-selected' : ''}" data-pick-image="${escapeAttr(preset.path)}">
      <img src="${escapeAttr(preset.path)}" alt="${escapeAttr(preset.label)}" loading="lazy">
      <span>${escapeHTML(preset.label)}</span>
    </button>
  `).join('');

  document.getElementById('modalContent').innerHTML = `
    <div class="modal-head">
      <p class="eyebrow">${isEditing ? 'Editar producto' : duplicateSource ? 'Duplicar producto' : 'Nuevo producto'}</p>
      <h2>${isEditing ? escapeHTML(product.name) : duplicateSource ? `Copia de ${escapeHTML(product.name)}` : 'Agregar producto al menú'}</h2>
      <p>El precio ingresado es el de lista/transferencia. El precio con 10% OFF en efectivo se calcula automáticamente.</p>
    </div>

    <form id="productForm" data-product-id="${isEditing ? escapeAttr(product.id) : ''}">
      <div class="form-grid">
        <label class="field span-2">
          <span>Nombre del producto *</span>
          <input type="text" name="name" value="${escapeAttr(duplicateSource ? `${product.name} (Copia)` : (product?.name || ''))}" required maxlength="120" placeholder="Ej: Extra Muzza">
        </label>

        <label class="field">
          <span>Categoría</span>
          <select name="category_id">
            <option value="">⚠️ Sin categoría asignada</option>
            ${categoryOptions}
          </select>
        </label>

        <label class="field">
          <span>Código interno</span>
          <input type="text" name="code" value="${escapeAttr(duplicateSource ? '' : (product?.code || ''))}" placeholder="Ej: 1460-016">
        </label>

        <label class="field">
          <span>Precio lista / transferencia (ARS) *</span>
          <input type="number" name="price" id="modalProductPriceInput" value="${basePrice}" min="0" step="100" required>
          <small id="modalProductCashPreview">💵 En efectivo (10% OFF): <strong>${formatPrice(getCashPrice(basePrice))}</strong></small>
        </label>

        <label class="field">
          <span>Unidad de venta</span>
          <select name="unit_type">
            <option value="unidad" ${product?.unit_type === 'unidad' || !product?.unit_type ? 'selected' : ''}>Por unidad (Pizza / Combo)</option>
            <option value="persona" ${product?.unit_type === 'persona' ? 'selected' : ''}>Por persona (Eventos / Party)</option>
          </select>
        </label>

        <label class="field">
          <span>Orden de aparición</span>
          <input type="number" name="sort_order" value="${nextOrder}" step="1">
        </label>

        <label class="field">
          <span>Emoji / Ícono</span>
          <input type="text" name="emoji" value="${escapeAttr(product?.emoji || '🍕')}" maxlength="8">
        </label>

        <div class="field span-2 image-picker-box">
          <span>Imagen del producto (URL o ruta local)</span>
          <div class="image-input-preview-row">
            <img id="modalImagePreview" class="modal-img-preview" src="${escapeAttr(currentImage)}" alt="Vista previa" onerror="this.src='img/productos/muzzarella.webp'">
            <div style="flex:1">
              <input type="text" name="image_url" id="modalImageUrlInput" value="${escapeAttr(currentImage)}" placeholder="img/productos/muzzarella.webp o https://...">
              <small>Podés pegar un link externo o elegir una foto del catálogo aquí abajo:</small>
            </div>
          </div>
          <div class="img-presets-strip">
            ${presetsHtml}
          </div>
        </div>

        <label class="field span-2">
          <span>Descripción corta (se ve en la tarjeta del menú)</span>
          <textarea name="description" rows="2" maxlength="240" placeholder="Ej: Doble muzzarella y un borde dorado…">${escapeHTML(product?.description || '')}</textarea>
        </label>

        <label class="field span-2">
          <span>Ingredientes</span>
          <textarea name="ingredients" rows="2" maxlength="300" placeholder="Masa artesanal, salsa de tomate, muzzarella…">${escapeHTML(product?.ingredients || '')}</textarea>
        </label>

        <label class="field">
          <span>Tiempo de horneado</span>
          <input type="text" name="prep_tiempo" value="${escapeAttr(product?.prep_tiempo || '12-15 min')}" maxlength="40">
        </label>

        <label class="field">
          <span>Etiquetas <small>(separadas por coma)</small></span>
          <input type="text" name="tags" value="${escapeAttr((product?.tags || []).join(', '))}" placeholder="popular, clasica, premium">
        </label>

        <label class="field span-2">
          <span>Instrucciones de preparación</span>
          <textarea name="prep_descripcion" rows="2" maxlength="300" placeholder="Horneá a 220 °C durante 12-15 minutos, sin descongelar.">${escapeHTML(product?.prep_descripcion || 'Horneá a 220 °C durante 12-15 minutos, sin descongelar.')}</textarea>
        </label>

        <div class="span-2 check-row">
          <label><input type="checkbox" name="is_active" ${product?.is_active === false ? '' : 'checked'}> Visible en la tienda</label>
          <label><input type="checkbox" name="hot" ${product?.hot ? 'checked' : ''}> 🔥 Destacar en "Las más pedidas"</label>
        </div>
      </div>

      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" data-close-modal>Cancelar</button>
        <button type="submit" class="btn btn-primary">${isEditing ? 'Guardar cambios' : 'Crear producto'}</button>
      </div>
    </form>
  `;

  openModal();
}

async function saveProduct(form) {
  const client = getClient();
  if (!client) {
    showToast('Sin conexión con Supabase.', 'error');
    return;
  }

  const data = new FormData(form);
  const productId = form.dataset.productId || '';
  const price = Number(data.get('price'));

  if (!Number.isFinite(price) || price < 0) {
    showToast('Ingresá un precio válido.', 'error');
    return;
  }

  const payload = {
    empresa_id: EMPRESA_ID,
    name: String(data.get('name') || '').trim(),
    category_id: data.get('category_id') || null,
    code: String(data.get('code') || '').trim() || null,
    price,
    sort_order: Number(data.get('sort_order')) || 0,
    image_url: String(data.get('image_url') || '').trim() || null,
    emoji: String(data.get('emoji') || '').trim() || '🍕',
    prep_tiempo: String(data.get('prep_tiempo') || '').trim() || null,
    description: String(data.get('description') || '').trim() || null,
    ingredients: String(data.get('ingredients') || '').trim() || null,
    prep_descripcion: String(data.get('prep_descripcion') || '').trim() || null,
    tags: String(data.get('tags') || '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    is_active: data.get('is_active') === 'on',
    hot: data.get('hot') === 'on',
    unit_type: String(data.get('unit_type') || 'unidad'),
    price_half: null,
    price_unit: null
  };

  const button = form.querySelector('[type="submit"]');
  setButtonLoading(button, true);

  try {
    let result;
    if (productId) {
      result = await client
        .from('products')
        .update(payload)
        .eq('id', productId)
        .eq('empresa_id', EMPRESA_ID)
        .select('id');
    } else {
      result = await client
        .from('products')
        .insert(payload)
        .select('id');
    }

    if (result.error) throw result.error;
    if (!result.data?.length) throw new Error('No se pudo confirmar el guardado del producto.');

    closeModal();
    showToast(productId ? 'Producto actualizado.' : 'Producto creado con éxito.');
    await loadAdminData(false);
  } catch (error) {
    console.error('Error al guardar el producto:', error);
    showToast(`No se pudo guardar: ${error.message}`, 'error');
  } finally {
    setButtonLoading(button, false);
  }
}

async function toggleProduct(productId) {
  const client = getClient();
  const product = adminState.products.find((row) => String(row.id) === String(productId));
  if (!client || !product) return;

  const nextActive = product.is_active === false;

  try {
    const { data, error } = await client
      .from('products')
      .update({ is_active: nextActive })
      .eq('id', product.id)
      .eq('empresa_id', EMPRESA_ID)
      .select('id');

    if (error) throw error;
    if (!data?.length) throw new Error('Producto no encontrado.');

    product.is_active = nextActive;
    saveAdminCache();
    renderAll();
    showToast(nextActive ? `"${product.name}" ahora está visible.` : `"${product.name}" oculto de la tienda.`);
  } catch (error) {
    console.error('Error al cambiar visibilidad:', error);
    showToast(`No se pudo actualizar: ${error.message}`, 'error');
  }
}

async function toggleProductHot(productId) {
  const client = getClient();
  const product = adminState.products.find((row) => String(row.id) === String(productId));
  if (!client || !product) return;

  const nextHot = !product.hot;

  try {
    const { data, error } = await client
      .from('products')
      .update({ hot: nextHot })
      .eq('id', product.id)
      .eq('empresa_id', EMPRESA_ID)
      .select('id');

    if (error) throw error;
    if (!data?.length) throw new Error('Producto no encontrado.');

    product.hot = nextHot;
    saveAdminCache();
    renderAll();
    showToast(nextHot ? `🔥 "${product.name}" destacado en Más Pedidas.` : `"${product.name}" quitado de Más Pedidas.`);
  } catch (error) {
    console.error('Error al destacar producto:', error);
    showToast(`No se pudo actualizar: ${error.message}`, 'error');
  }
}

async function deleteProduct(productId) {
  const client = getClient();
  const product = adminState.products.find((row) => String(row.id) === String(productId));
  if (!client || !product) return;

  if (!window.confirm(`¿Borrar "${product.name}" definitivamente del menú?`)) return;

  try {
    const { data, error } = await client
      .from('products')
      .delete()
      .eq('id', product.id)
      .eq('empresa_id', EMPRESA_ID)
      .select('id');

    if (error) throw error;
    if (!data?.length) throw new Error('Producto no encontrado.');

    adminState.products = adminState.products.filter((row) => String(row.id) !== String(product.id));
    adminState.selectedAssignProducts.delete(String(product.id));
    saveAdminCache();
    renderAll();
    showToast('Producto eliminado.');
  } catch (error) {
    console.error('Error al borrar el producto:', error);
    showToast(`No se pudo borrar: ${error.message}`, 'error');
  }
}

function openBulkPriceModal() {
  const categoryOptions = [...adminState.categories]
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
    .map((cat) => `<option value="${escapeAttr(cat.id)}">Solo categoría: ${escapeHTML(cat.icon || '🍕')} ${escapeHTML(cat.name)}</option>`)
    .join('');

  document.getElementById('modalContent').innerHTML = `
    <div class="modal-head">
      <p class="eyebrow">Herramienta de precios</p>
      <h2>Ajuste masivo de precios</h2>
      <p>Actualizá el precio de todos los productos o de una categoría entera en un solo paso.</p>
    </div>

    <form id="bulkPriceForm">
      <div class="form-grid">
        <label class="field span-2">
          <span>Aplicar a</span>
          <select name="scope" required>
            <option value="todos">Todos los productos (${adminState.products.length})</option>
            ${categoryOptions}
          </select>
        </label>

        <label class="field">
          <span>Tipo de ajuste</span>
          <select name="mode" id="bulkPriceMode">
            <option value="percent">Porcentaje (% de aumento o descuento)</option>
            <option value="fixed">Fijar un precio único exacto ($)</option>
            <option value="add">Sumar / restar monto fijo ($)</option>
          </select>
        </label>

        <label class="field">
          <span>Valor (redondeado a $100)</span>
          <input type="number" name="amount" value="10" step="any" required placeholder="Ej: 10 o 12000">
        </label>
      </div>

      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" data-close-modal>Cancelar</button>
        <button type="submit" class="btn btn-primary">Aplicar ajuste masivo</button>
      </div>
    </form>
  `;
  openModal();
}

async function saveBulkPriceAdjustment(form) {
  const client = getClient();
  if (!client) {
    showToast('Sin conexión con Supabase.', 'error');
    return;
  }

  const data = new FormData(form);
  const scope = String(data.get('scope') || 'todos');
  const mode = String(data.get('mode') || 'percent');
  const amount = Number(data.get('amount'));

  if (!Number.isFinite(amount)) {
    showToast('Ingresá un valor numérico válido.', 'error');
    return;
  }

  const targets = adminState.products.filter((p) => scope === 'todos' || String(p.category_id) === scope);
  if (!targets.length) {
    showToast('No hay productos en esa selección.', 'error');
    return;
  }

  if (!window.confirm(`¿Actualizar el precio de ${targets.length} producto(s)?`)) return;

  const button = form.querySelector('[type="submit"]');
  setButtonLoading(button, true);

  try {
    await Promise.all(targets.map((product) => {
      const current = Number(product.price || 0);
      let nextPrice = current;
      if (mode === 'percent') {
        nextPrice = Math.round((current * (1 + amount / 100)) / 100) * 100;
      } else if (mode === 'fixed') {
        nextPrice = Math.max(0, Math.round(amount));
      } else if (mode === 'add') {
        nextPrice = Math.max(0, Math.round((current + amount) / 100) * 100);
      }
      return client
        .from('products')
        .update({ price: nextPrice })
        .eq('id', product.id)
        .eq('empresa_id', EMPRESA_ID);
    }));

    closeModal();
    showToast(`Se actualizaron los precios de ${targets.length} productos.`);
    await loadAdminData(false);
  } catch (error) {
    console.error('Error en ajuste masivo:', error);
    showToast(`No se pudo completar el ajuste: ${error.message}`, 'error');
  } finally {
    setButtonLoading(button, false);
  }
}

/* ─── 2. CRUD DE CATEGORÍAS ──────────────────────────────────────────────── */

function renderCategoriesAdmin() {
  const grid = document.getElementById('categoriesGrid');
  if (!grid) return;

  const query = normalizeText(adminState.categorySearch);
  const categories = [...adminState.categories]
    .filter((cat) => {
      if (!query) return true;
      return normalizeText(`${cat.name} ${cat.slug} ${cat.icon}`).includes(query);
    })
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));

  if (!categories.length) {
    grid.innerHTML = `
      <div class="panel span-full empty-panel">
        <p class="empty-cell">No hay categorías cargadas o que coincidan con el filtro.</p>
        <div class="empty-panel-actions">
          <button type="button" class="btn btn-ghost" data-action="seed-categories">✨ Cargar categorías base</button>
          <button type="button" class="btn btn-primary" data-action="new-category">+ Crear categoría</button>
        </div>
      </div>
    `;
    return;
  }

  grid.innerHTML = categories.map((cat, idx) => {
    const active = cat.is_active !== false;
    const assignedProducts = adminState.products.filter((p) => String(p.category_id) === String(cat.id));
    const previewNames = assignedProducts.slice(0, 4).map((p) => `<span class="cat-prod-chip">${escapeHTML(p.name)}</span>`).join('');
    const extraCount = assignedProducts.length > 4 ? `<span class="cat-prod-chip is-more">+${assignedProducts.length - 4} más</span>` : '';

    return `
      <article class="admin-category-card ${active ? '' : 'is-inactive'}">
        <div class="admin-category-top">
          <div class="admin-category-identity">
            <span class="admin-category-icon">${escapeHTML(cat.icon || '🍕')}</span>
            <div>
              <div class="admin-category-title-row">
                <h3>${escapeHTML(cat.name)}</h3>
                <span class="product-tag ${active ? 'is-on' : ''}">${active ? 'Activa' : 'Oculta'}</span>
              </div>
              <p class="mono cell-sub">slug: ${escapeHTML(cat.slug || '—')} · orden #${Number(cat.sort_order || 0)}</p>
            </div>
          </div>
          <div class="order-move-btns">
            <button type="button" class="icon-btn btn-mini" data-category-move="${escapeAttr(cat.id)}" data-dir="-1" ${idx === 0 ? 'disabled' : ''} title="Subir orden">↑</button>
            <button type="button" class="icon-btn btn-mini" data-category-move="${escapeAttr(cat.id)}" data-dir="1" ${idx === categories.length - 1 ? 'disabled' : ''} title="Bajar orden">↓</button>
          </div>
        </div>

        <div class="admin-category-products-box">
          <div class="admin-category-products-head">
            <span><strong>${assignedProducts.length}</strong> producto${assignedProducts.length === 1 ? '' : 's'} asignado${assignedProducts.length === 1 ? '' : 's'}</span>
            <button type="button" class="text-btn" data-category-assign-modal="${escapeAttr(cat.id)}">🔗 Asignar / quitar productos →</button>
          </div>
          <div class="cat-prod-chips">
            ${assignedProducts.length ? `${previewNames}${extraCount}` : '<span class="cell-sub">Sin productos asignados todavía.</span>'}
          </div>
        </div>

        <div class="admin-product-actions">
          <button type="button" class="btn btn-primary btn-small" data-category-edit="${escapeAttr(cat.id)}">✏️ Editar</button>
          <button type="button" class="btn btn-ghost btn-small" data-category-assign-modal="${escapeAttr(cat.id)}">🔗 Productos (${assignedProducts.length})</button>
          <button type="button" class="btn btn-ghost btn-small" data-category-toggle="${escapeAttr(cat.id)}">${active ? '👁️ Ocultar' : '👁️ Mostrar'}</button>
          <button type="button" class="btn btn-danger btn-small" data-category-delete="${escapeAttr(cat.id)}" title="Borrar categoría">🗑️</button>
        </div>
      </article>
    `;
  }).join('');
}

function openCategoryModal(categoryId = null) {
  const category = categoryId
    ? adminState.categories.find((row) => String(row.id) === String(categoryId))
    : null;

  const nextOrder = category
    ? Number(category.sort_order || 0)
    : (adminState.categories.reduce((max, c) => Math.max(max, Number(c.sort_order || 0)), 0) + 1);
  const currentIcon = category?.icon || '🍕';

  const iconChips = CATEGORY_ICON_PRESETS.map((emoji) => `
    <button type="button" class="emoji-chip ${currentIcon === emoji ? 'is-selected' : ''}" data-pick-emoji="${escapeAttr(emoji)}">${emoji}</button>
  `).join('');

  document.getElementById('modalContent').innerHTML = `
    <div class="modal-head">
      <p class="eyebrow">${category ? 'Editar categoría' : 'Nueva categoría'}</p>
      <h2>${category ? `${escapeHTML(category.icon || '🍕')} ${escapeHTML(category.name)}` : 'Crear categoría del menú'}</h2>
      <p>Las categorías organizan las pestañas del menú público y agrupan los productos.</p>
    </div>

    <form id="categoryForm" data-category-id="${category ? escapeAttr(category.id) : ''}">
      <div class="form-grid">
        <label class="field">
          <span>Nombre de la categoría *</span>
          <input type="text" name="name" id="modalCategoryName" value="${escapeAttr(category?.name || '')}" required maxlength="80" placeholder="Ej: Especiales">
        </label>

        <label class="field">
          <span>Slug (identificador URL) *</span>
          <input type="text" name="slug" id="modalCategorySlug" value="${escapeAttr(category?.slug || '')}" required maxlength="80" placeholder="Ej: especiales">
        </label>

        <label class="field">
          <span>Ícono / Emoji</span>
          <input type="text" name="icon" id="modalCategoryIcon" value="${escapeAttr(currentIcon)}" maxlength="10">
        </label>

        <label class="field">
          <span>Orden de aparición</span>
          <input type="number" name="sort_order" value="${nextOrder}" step="1">
        </label>

        <div class="field span-2">
          <span>Elegir ícono rápido</span>
          <div class="emoji-picker-row">
            ${iconChips}
          </div>
        </div>

        <div class="span-2 check-row">
          <label><input type="checkbox" name="is_active" ${category?.is_active === false ? '' : 'checked'}> Categoría activa y visible en la tienda</label>
        </div>
      </div>

      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" data-close-modal>Cancelar</button>
        <button type="submit" class="btn btn-primary">${category ? 'Guardar categoría' : 'Crear categoría'}</button>
      </div>
    </form>
  `;

  openModal();
}

async function saveCategory(form) {
  const client = getClient();
  if (!client) {
    showToast('Sin conexión con Supabase.', 'error');
    return;
  }

  const data = new FormData(form);
  const categoryId = form.dataset.categoryId || '';
  const name = String(data.get('name') || '').trim();
  const slug = slugify(data.get('slug') || name);

  if (!name) {
    showToast('Ingresá un nombre para la categoría.', 'error');
    return;
  }

  const payload = {
    empresa_id: EMPRESA_ID,
    name,
    slug: slug || 'categoria',
    icon: String(data.get('icon') || '🍕').trim() || '🍕',
    sort_order: Number(data.get('sort_order')) || 0,
    is_active: data.get('is_active') === 'on'
  };

  const button = form.querySelector('[type="submit"]');
  setButtonLoading(button, true);

  try {
    let result;
    if (categoryId) {
      result = await client
        .from('categories')
        .update(payload)
        .eq('id', categoryId)
        .eq('empresa_id', EMPRESA_ID)
        .select('id');
    } else {
      result = await client
        .from('categories')
        .insert(payload)
        .select('id');
    }

    if (result.error) throw result.error;
    if (!result.data?.length) throw new Error('No se pudo confirmar el guardado de la categoría.');

    closeModal();
    showToast(categoryId ? 'Categoría actualizada.' : 'Categoría creada con éxito.');
    await loadAdminData(false);
  } catch (error) {
    console.error('Error al guardar categoría:', error);
    showToast(`No se pudo guardar: ${error.message}`, 'error');
  } finally {
    setButtonLoading(button, false);
  }
}

async function toggleCategory(categoryId) {
  const client = getClient();
  const category = adminState.categories.find((row) => String(row.id) === String(categoryId));
  if (!client || !category) return;

  const nextActive = category.is_active === false;

  try {
    const { data, error } = await client
      .from('categories')
      .update({ is_active: nextActive })
      .eq('id', category.id)
      .eq('empresa_id', EMPRESA_ID)
      .select('id');

    if (error) throw error;
    if (!data?.length) throw new Error('Categoría no encontrada.');

    category.is_active = nextActive;
    saveAdminCache();
    renderAll();
    showToast(nextActive ? `Categoría "${category.name}" activada.` : `Categoría "${category.name}" oculta.`);
  } catch (error) {
    console.error('Error al cambiar estado de categoría:', error);
    showToast(`No se pudo actualizar: ${error.message}`, 'error');
  }
}

async function moveCategoryOrder(categoryId, direction) {
  const client = getClient();
  if (!client) return;

  const sorted = [...adminState.categories].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
  const index = sorted.findIndex((c) => String(c.id) === String(categoryId));
  const targetIndex = index + Number(direction);
  if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) return;

  const current = sorted[index];
  const neighbor = sorted[targetIndex];
  const orderA = index + 1;
  const orderB = targetIndex + 1;

  try {
    await Promise.all([
      client.from('categories').update({ sort_order: orderB }).eq('id', current.id).eq('empresa_id', EMPRESA_ID),
      client.from('categories').update({ sort_order: orderA }).eq('id', neighbor.id).eq('empresa_id', EMPRESA_ID)
    ]);
    current.sort_order = orderB;
    neighbor.sort_order = orderA;
    saveAdminCache();
    renderAll();
    showToast('Orden de categoría actualizado.');
  } catch (error) {
    console.error('Error al reordenar categoría:', error);
    showToast('No se pudo reordenar la categoría.', 'error');
  }
}

async function deleteCategory(categoryId) {
  const client = getClient();
  const category = adminState.categories.find((row) => String(row.id) === String(categoryId));
  if (!client || !category) return;

  const assigned = adminState.products.filter((p) => String(p.category_id) === String(category.id));
  const confirmMsg = assigned.length
    ? `La categoría "${category.name}" tiene ${assigned.length} producto(s) asignado(s). Si la borrás, esos productos quedarán "Sin categoría" (no se borrarán). ¿Continuar?`
    : `¿Borrar la categoría "${category.name}"?`;

  if (!window.confirm(confirmMsg)) return;

  try {
    if (assigned.length) {
      const { error: unassignError } = await client
        .from('products')
        .update({ category_id: null })
        .eq('category_id', category.id)
        .eq('empresa_id', EMPRESA_ID);
      if (unassignError) throw unassignError;
    }

    const { data, error } = await client
      .from('categories')
      .delete()
      .eq('id', category.id)
      .eq('empresa_id', EMPRESA_ID)
      .select('id');

    if (error) throw error;
    if (!data?.length) throw new Error('Categoría no encontrada.');

    showToast(`Categoría "${category.name}" eliminada.`);
    await loadAdminData(false);
  } catch (error) {
    console.error('Error al borrar categoría:', error);
    showToast(`No se pudo borrar: ${error.message}`, 'error');
  }
}

async function seedDefaultCategories() {
  const client = getClient();
  if (!client) {
    showToast('Sin conexión con Supabase.', 'error');
    return;
  }

  const existingSlugs = new Set(adminState.categories.map((c) => normalizeText(c.slug)));
  const missing = DEFAULT_CATEGORIES.filter((c) => !existingSlugs.has(normalizeText(c.slug)));

  if (!missing.length) {
    showToast('Todas las categorías base ya están creadas.');
    return;
  }

  try {
    const payload = missing.map((cat) => ({
      empresa_id: EMPRESA_ID,
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon || '🍕',
      sort_order: cat.order || 1,
      is_active: true
    }));

    const { error } = await client.from('categories').insert(payload);
    if (error) throw error;

    showToast(`Se cargaron ${payload.length} categorías base.`);
    await loadAdminData(false);
  } catch (error) {
    console.error('Error al cargar categorías base:', error);
    showToast(`No se pudieron crear: ${error.message}`, 'error');
  }
}

/* ─── 3. CRUD DE ASIGNACIÓN DE PRODUCTOS A CATEGORÍAS ────────────────────── */

function renderAssignmentView() {
  const strip = document.getElementById('assignSummaryStrip');
  const tbody = document.getElementById('assignTableBody');
  if (!strip || !tbody) return;

  const sortedCategories = [...adminState.categories].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
  const validCatIds = new Set(sortedCategories.map((c) => String(c.id)));
  const unassignedCount = adminState.products.filter((p) => !p.category_id || !validCatIds.has(String(p.category_id))).length;

  // Renderizar tarjetas resumen por categoría
  strip.innerHTML = [
    `
      <div class="assign-cat-pill ${adminState.assignFilterCategory === 'todos' ? 'is-active' : ''}" data-assign-filter-pill="todos">
        <div>
          <strong>🍕 Todos</strong>
          <span>${adminState.products.length} productos</span>
        </div>
      </div>
    `,
    `
      <div class="assign-cat-pill ${unassignedCount > 0 ? 'is-warning' : ''} ${adminState.assignFilterCategory === 'sin_categoria' ? 'is-active' : ''}" data-assign-filter-pill="sin_categoria">
        <div>
          <strong>⚠️ Sin categoría</strong>
          <span>${unassignedCount} producto${unassignedCount === 1 ? '' : 's'}</span>
        </div>
      </div>
    `,
    ...sortedCategories.map((cat) => {
      const count = adminState.products.filter((p) => String(p.category_id) === String(cat.id)).length;
      return `
        <div class="assign-cat-pill ${String(adminState.assignFilterCategory) === String(cat.id) ? 'is-active' : ''}" data-assign-filter-pill="${escapeAttr(cat.id)}">
          <div>
            <strong>${escapeHTML(cat.icon || '🍕')} ${escapeHTML(cat.name)}</strong>
            <span>${count} producto${count === 1 ? '' : 's'}</span>
          </div>
          <button type="button" class="btn btn-ghost btn-small" data-category-assign-modal="${escapeAttr(cat.id)}" title="Elegir qué productos pertenecen a ${escapeAttr(cat.name)}">Asignar</button>
        </div>
      `;
    })
  ].join('');

  // Filtrar productos para la tabla de asignación
  const query = normalizeText(adminState.assignSearch);
  const filterCat = adminState.assignFilterCategory;

  const filteredProducts = adminState.products
    .filter((product) => {
      const hasValidCat = product.category_id && validCatIds.has(String(product.category_id));
      if (filterCat === 'sin_categoria') {
        if (hasValidCat) return false;
      } else if (filterCat !== 'todos' && String(product.category_id) !== String(filterCat)) {
        return false;
      }
      if (!query) return true;
      return normalizeText(`${product.name} ${product.code} ${categoryName(product.category_id)}`).includes(query);
    })
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));

  updateAssignSelectedCounter(filteredProducts);

  if (!filteredProducts.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-cell">No hay productos en este filtro.</td></tr>';
    return;
  }

  tbody.innerHTML = filteredProducts.map((product) => {
    const checked = adminState.selectedAssignProducts.has(String(product.id));
    const hasValidCat = product.category_id && validCatIds.has(String(product.category_id));
    const currentCatObj = sortedCategories.find((c) => String(c.id) === String(product.category_id));
    const active = product.is_active !== false;

    const selectOptions = [
      `<option value="">⚠️ Sin categoría asignada</option>`,
      ...sortedCategories.map((cat) => `<option value="${escapeAttr(cat.id)}" ${String(product.category_id) === String(cat.id) ? 'selected' : ''}>${escapeHTML(cat.icon || '🍕')} ${escapeHTML(cat.name)}</option>`)
    ].join('');

    return `
      <tr class="${checked ? 'is-selected-row' : ''}">
        <td>
          <input type="checkbox" data-assign-check="${escapeAttr(product.id)}" ${checked ? 'checked' : ''} aria-label="Seleccionar ${escapeAttr(product.name)}">
        </td>
        <td>
          <div class="assign-prod-cell">
            <img src="${escapeAttr(product.image_url || 'img/productos/muzzarella.webp')}" alt="" onerror="this.src='img/productos/muzzarella.webp'">
            <div>
              <span class="cell-main">${escapeHTML(product.emoji || '🍕')} ${escapeHTML(product.name)}</span>
              <span class="cell-sub">${escapeHTML(product.code || 'Sin código')}</span>
            </div>
          </div>
        </td>
        <td><strong>${formatPrice(product.price)}</strong></td>
        <td>
          ${hasValidCat
            ? `<span class="cat-badge">${escapeHTML(currentCatObj.icon || '🍕')} ${escapeHTML(currentCatObj.name)}</span>`
            : `<span class="cat-badge is-unassigned">⚠️ Sin categoría</span>`}
        </td>
        <td>
          <select class="assign-row-select" data-inline-category-product="${escapeAttr(product.id)}">
            ${selectOptions}
          </select>
        </td>
        <td style="width:95px;">
          <input type="number" class="assign-order-input" data-inline-order-product="${escapeAttr(product.id)}" value="${Number(product.sort_order || 0)}" step="1">
        </td>
        <td>
          <button type="button" class="btn btn-ghost btn-small" data-product-toggle="${escapeAttr(product.id)}">
            ${active ? '🟢 Activo' : '⚪ Oculto'}
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function updateAssignSelectedCounter(visibleProducts = []) {
  const countEl = document.getElementById('assignSelectedCount');
  if (countEl) countEl.textContent = String(adminState.selectedAssignProducts.size);

  const selectAllCheckbox = document.getElementById('assignSelectAll');
  if (selectAllCheckbox) {
    const allVisibleSelected = visibleProducts.length > 0 && visibleProducts.every((p) => adminState.selectedAssignProducts.has(String(p.id)));
    selectAllCheckbox.checked = allVisibleSelected;
  }
}

function toggleSelectAllVisibleProducts(checked) {
  const checkboxes = document.querySelectorAll('[data-assign-check]');
  checkboxes.forEach((cb) => {
    const id = String(cb.dataset.assignCheck);
    if (checked) {
      adminState.selectedAssignProducts.add(id);
    } else {
      adminState.selectedAssignProducts.delete(id);
    }
  });
  renderAssignmentView();
}

async function assignSingleProductCategory(productId, categoryId) {
  const client = getClient();
  const product = adminState.products.find((p) => String(p.id) === String(productId));
  if (!client || !product) return;

  const nextCategoryId = categoryId || null;

  try {
    const { data, error } = await client
      .from('products')
      .update({ category_id: nextCategoryId })
      .eq('id', product.id)
      .eq('empresa_id', EMPRESA_ID)
      .select('id');

    if (error) throw error;
    if (!data?.length) throw new Error('Producto no encontrado.');

    product.category_id = nextCategoryId;
    saveAdminCache();
    renderAll();
    const destName = nextCategoryId ? categoryName(nextCategoryId) : 'Sin categoría';
    showToast(`"${product.name}" asignado a ${destName}.`);
  } catch (error) {
    console.error('Error al asignar categoría:', error);
    showToast(`No se pudo asignar: ${error.message}`, 'error');
  }
}

async function updateSingleProductOrder(productId, sortOrder) {
  const client = getClient();
  const product = adminState.products.find((p) => String(p.id) === String(productId));
  if (!client || !product) return;

  const nextOrder = Number(sortOrder) || 0;

  try {
    const { error } = await client
      .from('products')
      .update({ sort_order: nextOrder })
      .eq('id', product.id)
      .eq('empresa_id', EMPRESA_ID);

    if (error) throw error;

    product.sort_order = nextOrder;
    saveAdminCache();
    renderAll();
    showToast(`Orden de "${product.name}" actualizado (#${nextOrder}).`);
  } catch (error) {
    console.error('Error al actualizar orden:', error);
    showToast(`No se pudo cambiar el orden: ${error.message}`, 'error');
  }
}

async function applyBulkCategoryAssignment() {
  const client = getClient();
  if (!client) {
    showToast('Sin conexión con Supabase.', 'error');
    return;
  }

  const selectedIds = Array.from(adminState.selectedAssignProducts);
  if (!selectedIds.length) {
    showToast('Seleccioná al menos un producto de la lista.', 'error');
    return;
  }

  const targetSelect = document.getElementById('assignBulkTargetCategory');
  const rawTarget = targetSelect?.value || '';
  if (!rawTarget) {
    showToast('Elegí una categoría destino primero.', 'error');
    return;
  }

  const nextCategoryId = rawTarget === '__none__' ? null : rawTarget;
  const button = document.getElementById('assignBulkApplyBtn');
  setButtonLoading(button, true);

  try {
    const { error } = await client
      .from('products')
      .update({ category_id: nextCategoryId })
      .in('id', selectedIds)
      .eq('empresa_id', EMPRESA_ID);

    if (error) throw error;

    adminState.selectedAssignProducts.clear();
    const destLabel = nextCategoryId ? categoryName(nextCategoryId) : 'Sin categoría';
    showToast(`${selectedIds.length} producto(s) asignados a "${destLabel}".`);
    await loadAdminData(false);
  } catch (error) {
    console.error('Error en asignación masiva:', error);
    showToast(`No se pudo aplicar la asignación: ${error.message}`, 'error');
  } finally {
    setButtonLoading(button, false);
  }
}

function openCategoryAssignModal(categoryId) {
  const category = adminState.categories.find((c) => String(c.id) === String(categoryId));
  if (!category) return;

  const sortedProducts = [...adminState.products].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));

  const checklistHtml = sortedProducts.map((product) => {
    const belongsHere = String(product.category_id) === String(category.id);
    const otherCat = !belongsHere && product.category_id ? categoryName(product.category_id) : 'Sin categoría';
    return `
      <label class="assign-modal-item ${belongsHere ? 'is-checked' : ''}">
        <input type="checkbox" name="product_ids" value="${escapeAttr(product.id)}" ${belongsHere ? 'checked' : ''}>
        <img src="${escapeAttr(product.image_url || 'img/productos/muzzarella.webp')}" alt="" onerror="this.src='img/productos/muzzarella.webp'">
        <div class="assign-modal-item-info">
          <strong>${escapeHTML(product.name)}</strong>
          <span>${belongsHere ? `En ${escapeHTML(category.name)}` : `Actual: ${escapeHTML(otherCat)}`} · ${formatPrice(product.price)}</span>
        </div>
      </label>
    `;
  }).join('');

  document.getElementById('modalContent').innerHTML = `
    <div class="modal-head">
      <p class="eyebrow">Asignación de productos a categoría</p>
      <h2>${escapeHTML(category.icon || '🍕')} ${escapeHTML(category.name)}</h2>
      <p>Marcá los productos que pertenecen a <strong>${escapeHTML(category.name)}</strong>. Los que desmarques y estaban en esta categoría quedarán disponibles sin categoría.</p>
    </div>

    <form id="categoryAssignChecklistForm" data-category-id="${escapeAttr(category.id)}">
      <div class="assign-modal-list">
        ${checklistHtml || '<p class="empty-cell">No hay productos creados todavía.</p>'}
      </div>

      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" data-close-modal>Cancelar</button>
        <button type="submit" class="btn btn-primary">Guardar asignación en ${escapeHTML(category.name)}</button>
      </div>
    </form>
  `;

  openModal();
}

async function saveCategoryAssignChecklist(form) {
  const client = getClient();
  const categoryId = form.dataset.categoryId;
  const category = adminState.categories.find((c) => String(c.id) === String(categoryId));
  if (!client || !category) return;

  const checkedIds = new Set(
    Array.from(form.querySelectorAll('input[name="product_ids"]:checked')).map((el) => String(el.value))
  );

  const toAdd = adminState.products
    .filter((p) => checkedIds.has(String(p.id)) && String(p.category_id) !== String(category.id))
    .map((p) => p.id);

  const toRemove = adminState.products
    .filter((p) => !checkedIds.has(String(p.id)) && String(p.category_id) === String(category.id))
    .map((p) => p.id);

  const button = form.querySelector('[type="submit"]');
  setButtonLoading(button, true);

  try {
    if (toAdd.length) {
      const { error } = await client
        .from('products')
        .update({ category_id: category.id })
        .in('id', toAdd)
        .eq('empresa_id', EMPRESA_ID);
      if (error) throw error;
    }

    if (toRemove.length) {
      const { error } = await client
        .from('products')
        .update({ category_id: null })
        .in('id', toRemove)
        .eq('empresa_id', EMPRESA_ID);
      if (error) throw error;
    }

    closeModal();
    showToast(`Productos de "${category.name}" actualizados.`);
    await loadAdminData(false);
  } catch (error) {
    console.error('Error al guardar checklist de categoría:', error);
    showToast(`No se pudo guardar: ${error.message}`, 'error');
  } finally {
    setButtonLoading(button, false);
  }
}

/* ─── 4. CRUD DE BANNERS ─────────────────────────────────────────────────── */

function renderBannersAdmin() {
  const grid = document.getElementById('bannersGrid');
  if (!grid) return;

  const query = normalizeText(adminState.bannerSearch);
  const banners = [...adminState.banners]
    .filter((b) => {
      if (!query) return true;
      return normalizeText(`${b.title} ${b.subtitle} ${b.link}`).includes(query);
    })
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));

  if (!banners.length) {
    grid.innerHTML = `
      <div class="panel span-full empty-panel">
        <p class="empty-cell">No hay banners promocionales cargados en la base de datos (la tienda muestra los banners por defecto).</p>
        <div class="empty-panel-actions">
          <button type="button" class="btn btn-ghost" data-action="seed-banners">✨ Cargar banners iniciales</button>
          <button type="button" class="btn btn-primary" data-action="new-banner">+ Crear nuevo banner</button>
        </div>
      </div>
    `;
    return;
  }

  grid.innerHTML = banners.map((banner, idx) => {
    const active = banner.is_active !== false;
    const image = banner.image_url || 'img/banners/banner-lph.webp';
    return `
      <article class="admin-banner-card ${active ? '' : 'is-inactive'}">
        <div class="admin-banner-preview">
          <img src="${escapeAttr(image)}" alt="${escapeAttr(banner.title || 'Banner')}" loading="lazy"
            onerror="this.src='img/banners/banner-lph.webp'">
          <div class="admin-banner-overlay">
            <div class="product-badges-top">
              <span class="product-tag ${active ? 'is-on' : ''}">${active ? 'Activo' : 'Oculto'}</span>
              <span class="product-tag">Orden #${Number(banner.sort_order || 0)}</span>
            </div>
            <div class="admin-banner-copy">
              <span>Promo 14-60</span>
              <h3>${escapeHTML(banner.title || 'Sin título')}</h3>
              <p>${escapeHTML(banner.subtitle || '')}</p>
            </div>
          </div>
        </div>
        <div class="admin-banner-body">
          <div class="admin-banner-meta">
            <span class="mono cell-sub">🔗 Destino: ${escapeHTML(banner.link || '#menu')}</span>
            <div class="order-move-btns">
              <button type="button" class="icon-btn btn-mini" data-banner-move="${escapeAttr(banner.id)}" data-dir="-1" ${idx === 0 ? 'disabled' : ''} title="Subir orden">↑</button>
              <button type="button" class="icon-btn btn-mini" data-banner-move="${escapeAttr(banner.id)}" data-dir="1" ${idx === banners.length - 1 ? 'disabled' : ''} title="Bajar orden">↓</button>
            </div>
          </div>
          <div class="admin-product-actions">
            <button type="button" class="btn btn-primary btn-small" data-banner-edit="${escapeAttr(banner.id)}">✏️ Editar</button>
            <button type="button" class="btn btn-ghost btn-small" data-banner-toggle="${escapeAttr(banner.id)}">${active ? '👁️ Ocultar' : '👁️ Mostrar'}</button>
            <button type="button" class="btn btn-danger btn-small" data-banner-delete="${escapeAttr(banner.id)}" title="Eliminar banner">🗑️ Borrar</button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function openBannerModal(bannerId = null) {
  const banner = bannerId
    ? adminState.banners.find((row) => String(row.id) === String(bannerId))
    : null;

  const currentImage = banner?.image_url || 'img/banners/banner-lph.webp';
  const nextOrder = banner
    ? Number(banner.sort_order || 0)
    : (adminState.banners.reduce((max, b) => Math.max(max, Number(b.sort_order || 0)), 0) + 1);

  const presetsHtml = BANNER_IMAGE_PRESETS.map((preset) => `
    <button type="button" class="img-preset-chip ${currentImage === preset.path ? 'is-selected' : ''}" data-pick-image="${escapeAttr(preset.path)}">
      <img src="${escapeAttr(preset.path)}" alt="${escapeAttr(preset.label)}" loading="lazy">
      <span>${escapeHTML(preset.label)}</span>
    </button>
  `).join('');

  document.getElementById('modalContent').innerHTML = `
    <div class="modal-head">
      <p class="eyebrow">${banner ? 'Editar banner' : 'Nuevo banner'}</p>
      <h2>${banner ? escapeHTML(banner.title || 'Banner promocional') : 'Crear banner de portada'}</h2>
      <p>Los banners activos se muestran en el carrusel superior de la tienda.</p>
    </div>

    <form id="bannerForm" data-banner-id="${banner ? escapeAttr(banner.id) : ''}">
      <div class="form-grid">
        <label class="field">
          <span>Título principal *</span>
          <input type="text" name="title" value="${escapeAttr(banner?.title || '')}" required maxlength="90" placeholder="Ej: Listas para hornear">
        </label>

        <label class="field">
          <span>Orden de aparición</span>
          <input type="number" name="sort_order" value="${nextOrder}" step="1">
        </label>

        <label class="field span-2">
          <span>Subtítulo / Bajada</span>
          <input type="text" name="subtitle" value="${escapeAttr(banner?.subtitle || '')}" maxlength="160" placeholder="Ej: Del freezer al horno, en 12-15 minutos.">
        </label>

        <div class="field span-2 image-picker-box">
          <span>Imagen del banner (URL o ruta local) *</span>
          <div class="image-input-preview-row">
            <img id="modalImagePreview" class="modal-img-preview is-banner" src="${escapeAttr(currentImage)}" alt="Vista previa" onerror="this.src='img/banners/banner-lph.webp'">
            <div style="flex:1">
              <input type="text" name="image_url" id="modalImageUrlInput" value="${escapeAttr(currentImage)}" required placeholder="img/banners/banner-lph.webp">
              <small>Elegí una imagen de banner predefinida o pegá una URL:</small>
            </div>
          </div>
          <div class="img-presets-strip">
            ${presetsHtml}
          </div>
        </div>

        <div class="field span-2">
          <span>Enlace al tocar el banner</span>
          <input type="text" name="link" id="modalBannerLinkInput" value="${escapeAttr(banner?.link || '#menu')}" placeholder="#menu o https://wa.me/...">
          <div class="link-presets-row">
            <button type="button" class="btn btn-ghost btn-small" data-pick-link="#menu">🍕 Ir al menú (#menu)</button>
            <button type="button" class="btn btn-ghost btn-small" data-pick-link="https://wa.me/5493874094801?text=Hola%2C%20quiero%20consultar%20por%20Pizza%20Party">🎉 WhatsApp Pizza Party</button>
            <button type="button" class="btn btn-ghost btn-small" data-pick-link="https://wa.me/5493874094801?text=Hola%2C%20quiero%20hacer%20un%20pedido">💬 WhatsApp Directo</button>
          </div>
        </div>

        <div class="span-2 check-row">
          <label><input type="checkbox" name="is_active" ${banner?.is_active === false ? '' : 'checked'}> Banner activo y visible en la portada</label>
        </div>
      </div>

      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" data-close-modal>Cancelar</button>
        <button type="submit" class="btn btn-primary">${banner ? 'Guardar cambios' : 'Crear banner'}</button>
      </div>
    </form>
  `;

  openModal();
}

async function saveBanner(form) {
  const client = getClient();
  if (!client) {
    showToast('Sin conexión con Supabase.', 'error');
    return;
  }

  const data = new FormData(form);
  const bannerId = form.dataset.bannerId || '';
  const title = String(data.get('title') || '').trim();
  const image_url = String(data.get('image_url') || '').trim();

  if (!title || !image_url) {
    showToast('Completá el título y la imagen del banner.', 'error');
    return;
  }

  const payload = {
    empresa_id: EMPRESA_ID,
    title,
    subtitle: String(data.get('subtitle') || '').trim() || null,
    image_url,
    link: String(data.get('link') || '#menu').trim() || '#menu',
    sort_order: Number(data.get('sort_order')) || 0,
    is_active: data.get('is_active') === 'on'
  };

  const button = form.querySelector('[type="submit"]');
  setButtonLoading(button, true);

  try {
    let result;
    if (bannerId) {
      result = await client
        .from('banners')
        .update(payload)
        .eq('id', bannerId)
        .eq('empresa_id', EMPRESA_ID)
        .select('id');
    } else {
      result = await client
        .from('banners')
        .insert(payload)
        .select('id');
    }

    if (result.error) throw result.error;
    if (!result.data?.length) throw new Error('No se pudo confirmar el guardado del banner.');

    closeModal();
    showToast(bannerId ? 'Banner actualizado.' : 'Banner creado con éxito.');
    await loadAdminData(false);
  } catch (error) {
    console.error('Error al guardar banner:', error);
    showToast(`No se pudo guardar el banner: ${error.message}`, 'error');
  } finally {
    setButtonLoading(button, false);
  }
}

async function toggleBanner(bannerId) {
  const client = getClient();
  const banner = adminState.banners.find((row) => String(row.id) === String(bannerId));
  if (!client || !banner) return;

  const nextActive = banner.is_active === false;

  try {
    const { data, error } = await client
      .from('banners')
      .update({ is_active: nextActive })
      .eq('id', banner.id)
      .eq('empresa_id', EMPRESA_ID)
      .select('id');

    if (error) throw error;
    if (!data?.length) throw new Error('Banner no encontrado.');

    banner.is_active = nextActive;
    saveAdminCache();
    renderAll();
    showToast(nextActive ? 'Banner visible en la tienda.' : 'Banner oculto de la tienda.');
  } catch (error) {
    console.error('Error al cambiar visibilidad del banner:', error);
    showToast(`No se pudo actualizar: ${error.message}`, 'error');
  }
}

async function moveBannerOrder(bannerId, direction) {
  const client = getClient();
  if (!client) return;

  const sorted = [...adminState.banners].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
  const index = sorted.findIndex((b) => String(b.id) === String(bannerId));
  const targetIndex = index + Number(direction);
  if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) return;

  const current = sorted[index];
  const neighbor = sorted[targetIndex];
  const orderA = index + 1;
  const orderB = targetIndex + 1;

  try {
    await Promise.all([
      client.from('banners').update({ sort_order: orderB }).eq('id', current.id).eq('empresa_id', EMPRESA_ID),
      client.from('banners').update({ sort_order: orderA }).eq('id', neighbor.id).eq('empresa_id', EMPRESA_ID)
    ]);
    current.sort_order = orderB;
    neighbor.sort_order = orderA;
    saveAdminCache();
    renderAll();
    showToast('Orden del banner actualizado.');
  } catch (error) {
    console.error('Error al reordenar banner:', error);
    showToast('No se pudo reordenar el banner.', 'error');
  }
}

async function deleteBanner(bannerId) {
  const client = getClient();
  const banner = adminState.banners.find((row) => String(row.id) === String(bannerId));
  if (!client || !banner) return;

  if (!window.confirm(`¿Borrar el banner "${banner.title || 'Sin título'}"?`)) return;

  try {
    const { data, error } = await client
      .from('banners')
      .delete()
      .eq('id', banner.id)
      .eq('empresa_id', EMPRESA_ID)
      .select('id');

    if (error) throw error;
    if (!data?.length) throw new Error('Banner no encontrado.');

    adminState.banners = adminState.banners.filter((row) => String(row.id) !== String(banner.id));
    saveAdminCache();
    renderAll();
    showToast('Banner eliminado.');
  } catch (error) {
    console.error('Error al borrar banner:', error);
    showToast(`No se pudo borrar: ${error.message}`, 'error');
  }
}

async function seedDefaultBanners() {
  const client = getClient();
  if (!client) {
    showToast('Sin conexión con Supabase.', 'error');
    return;
  }

  const existingTitles = new Set(adminState.banners.map((b) => normalizeText(b.title)));
  const missing = DEFAULT_BANNERS.filter((b) => !existingTitles.has(normalizeText(b.title)));

  if (!missing.length) {
    showToast('Los banners iniciales ya están cargados.');
    return;
  }

  try {
    const payload = missing.map((b, idx) => ({
      empresa_id: EMPRESA_ID,
      title: b.title,
      subtitle: b.subtitle,
      image_url: b.image,
      link: b.link || '#menu',
      sort_order: adminState.banners.length + idx + 1,
      is_active: true
    }));

    const { error } = await client.from('banners').insert(payload);
    if (error) throw error;

    showToast(`Se cargaron ${payload.length} banners iniciales.`);
    await loadAdminData(false);
  } catch (error) {
    console.error('Error al cargar banners iniciales:', error);
    showToast(`No se pudieron cargar los banners: ${error.message}`, 'error');
  }
}

/* ─── 5. CRUD DE CLIENTES ────────────────────────────────────────────────── */

function renderCustomers() {
  const body = document.getElementById('customersBody');
  if (!body) return;

  const query = normalizeText(adminState.customerSearch);
  const customers = adminState.customers.filter((customer) => {
    if (!query) return true;
    return normalizeText(`${customer.name} ${customer.phone} ${customer.address} ${customer.email}`).includes(query);
  });

  if (!customers.length) {
    body.innerHTML = '<tr><td colspan="6" class="empty-cell">No hay clientes que coincidan con el filtro.</td></tr>';
    return;
  }

  body.innerHTML = customers.map((customer) => {
    const relatedOrders = adminState.orders.filter((order) => samePhone(order.customer_phone, customer.phone));
    const spent = relatedOrders.reduce((sum, order) => sum + getOrderTotal(order), 0);
    return `
      <tr>
        <td><span class="cell-main">${escapeHTML(customer.name || 'Sin nombre')}</span></td>
        <td><a class="cell-main" href="${escapeAttr(customerWhatsApp(customer.phone))}" target="_blank" rel="noopener">${escapeHTML(customer.phone || '—')}</a></td>
        <td>${escapeHTML(customer.address || '—')}</td>
        <td>
          <span class="cell-main">${relatedOrders.length}</span>
          <span class="cell-sub">${formatPrice(spent)}</span>
        </td>
        <td>${formatDate(customer.created_at)}</td>
        <td>
          <div class="row-actions">
            <button type="button" class="btn btn-ghost btn-small" data-customer-edit="${escapeAttr(customer.id)}">Editar</button>
            <button type="button" class="btn btn-danger btn-small" data-customer-delete="${escapeAttr(customer.id)}">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openCustomerModal(customerId = null) {
  const customer = customerId
    ? adminState.customers.find((row) => String(row.id) === String(customerId))
    : null;

  document.getElementById('modalContent').innerHTML = `
    <div class="modal-head">
      <p class="eyebrow">${customer ? 'Ficha de cliente' : 'Nuevo cliente'}</p>
      <h2>${customer ? escapeHTML(customer.name || 'Cliente') : 'Registrar cliente'}</h2>
      <p>Los datos quedan asociados a 14-60 Pizzas Caseras LPH.</p>
    </div>

    <form id="customerForm" data-customer-id="${customer ? escapeAttr(customer.id) : ''}">
      <div class="form-grid">
        <label class="field span-2">
          <span>Nombre y apellido *</span>
          <input type="text" name="name" value="${escapeAttr(customer?.name || '')}" required maxlength="120">
        </label>

        <label class="field">
          <span>Teléfono *</span>
          <input type="tel" name="phone" value="${escapeAttr(customer?.phone || '')}" required maxlength="40">
        </label>

        <label class="field">
          <span>Email</span>
          <input type="email" name="email" value="${escapeAttr(customer?.email || '')}" maxlength="120">
        </label>

        <label class="field span-2">
          <span>Dirección habitual</span>
          <input type="text" name="address" value="${escapeAttr(customer?.address || '')}" maxlength="200">
        </label>

        <label class="field">
          <span>Fecha de nacimiento</span>
          <input type="date" name="birth_date" value="${escapeAttr(customer?.birth_date || '')}">
        </label>
      </div>

      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" data-close-modal>Cancelar</button>
        <button type="submit" class="btn btn-primary">${customer ? 'Guardar cambios' : 'Crear cliente'}</button>
      </div>
    </form>
  `;

  openModal();
}

async function saveCustomer(form) {
  const client = getClient();
  if (!client) {
    showToast('Sin conexión con Supabase.', 'error');
    return;
  }

  const data = new FormData(form);
  const customerId = form.dataset.customerId || '';
  const payload = {
    empresa_id: EMPRESA_ID,
    name: String(data.get('name') || '').trim(),
    phone: String(data.get('phone') || '').trim(),
    email: String(data.get('email') || '').trim() || null,
    address: String(data.get('address') || '').trim() || null,
    birth_date: String(data.get('birth_date') || '').trim() || null,
    updated_at: new Date().toISOString()
  };

  const button = form.querySelector('[type="submit"]');
  setButtonLoading(button, true);

  try {
    let result;
    if (customerId) {
      result = await client
        .from('customers')
        .update(payload)
        .eq('id', customerId)
        .eq('empresa_id', EMPRESA_ID)
        .select('id');
    } else {
      result = await client
        .from('customers')
        .insert(payload)
        .select('id');
    }

    if (result.error) {
      if (String(result.error.message || '').toLowerCase().includes('duplicate')) {
        throw new Error('Ya existe otro cliente con ese teléfono.');
      }
      throw result.error;
    }
    if (!result.data?.length) throw new Error('No se pudo guardar el cliente.');

    closeModal();
    showToast(customerId ? 'Cliente actualizado.' : 'Cliente registrado.');
    await loadAdminData(false);
  } catch (error) {
    console.error('Error al guardar el cliente:', error);
    showToast(`No se pudo guardar: ${error.message}`, 'error');
  } finally {
    setButtonLoading(button, false);
  }
}

async function deleteCustomer(customerId) {
  const client = getClient();
  const customer = adminState.customers.find((row) => String(row.id) === String(customerId));
  if (!client || !customer) return;

  if (!window.confirm(`¿Borrar al cliente "${customer.name}"?`)) return;

  try {
    const { error } = await client
      .from('customers')
      .delete()
      .eq('id', customer.id)
      .eq('empresa_id', EMPRESA_ID);

    if (error) throw error;

    adminState.customers = adminState.customers.filter((row) => String(row.id) !== String(customer.id));
    saveAdminCache();
    renderAll();
    showToast('Cliente eliminado.');
  } catch (error) {
    console.error('Error al borrar cliente:', error);
    showToast(`No se pudo borrar: ${error.message}`, 'error');
  }
}

/* ─── DELEGACIÓN DE EVENTOS ──────────────────────────────────────────────── */

function handleAdminClick(event) {
  const closeButton = event.target.closest('[data-close-modal]');
  if (closeButton) {
    closeModal();
    return;
  }

  // Acciones en paneles vacíos
  const emptyAction = event.target.closest('[data-action]');
  if (emptyAction) {
    const action = emptyAction.dataset.action;
    if (action === 'new-product') openProductModal();
    if (action === 'new-category') openCategoryModal();
    if (action === 'seed-categories') seedDefaultCategories();
    if (action === 'new-banner') openBannerModal();
    if (action === 'seed-banners') seedDefaultBanners();
    return;
  }

  // Selector de imagen preset en modal
  const pickImageBtn = event.target.closest('[data-pick-image]');
  if (pickImageBtn) {
    const path = pickImageBtn.dataset.pickImage;
    const input = document.getElementById('modalImageUrlInput');
    const preview = document.getElementById('modalImagePreview');
    if (input) input.value = path;
    if (preview) preview.src = path;
    document.querySelectorAll('[data-pick-image]').forEach((chip) => {
      chip.classList.toggle('is-selected', chip.dataset.pickImage === path);
    });
    return;
  }

  // Selector de emoji en modal de categoría
  const pickEmojiBtn = event.target.closest('[data-pick-emoji]');
  if (pickEmojiBtn) {
    const emoji = pickEmojiBtn.dataset.pickEmoji;
    const input = document.getElementById('modalCategoryIcon');
    if (input) input.value = emoji;
    document.querySelectorAll('[data-pick-emoji]').forEach((chip) => {
      chip.classList.toggle('is-selected', chip.dataset.pickEmoji === emoji);
    });
    return;
  }

  // Selector de link rápido en modal de banner
  const pickLinkBtn = event.target.closest('[data-pick-link]');
  if (pickLinkBtn) {
    const link = pickLinkBtn.dataset.pickLink;
    const input = document.getElementById('modalBannerLinkInput');
    if (input) input.value = link;
    return;
  }

  // Píldoras de filtro en vista de Asignación
  const assignModalBtn = event.target.closest('[data-category-assign-modal]');
  if (assignModalBtn) {
    openCategoryAssignModal(assignModalBtn.dataset.categoryAssignModal);
    return;
  }

  const assignFilterPill = event.target.closest('[data-assign-filter-pill]');
  if (assignFilterPill) {
    adminState.assignFilterCategory = assignFilterPill.dataset.assignFilterPill;
    const select = document.getElementById('assignFilterCategory');
    if (select) select.value = adminState.assignFilterCategory;
    renderAssignmentView();
    return;
  }

  // Pedidos
  const orderRow = event.target.closest('[data-order-open]');
  if (orderRow) {
    openOrderModal(orderRow.dataset.orderOpen);
    return;
  }

  // Productos
  const editProduct = event.target.closest('[data-product-edit]');
  if (editProduct) {
    openProductModal(editProduct.dataset.productEdit);
    return;
  }

  const duplicateProduct = event.target.closest('[data-product-duplicate]');
  if (duplicateProduct) {
    const source = adminState.products.find((p) => String(p.id) === String(duplicateProduct.dataset.productDuplicate));
    if (source) openProductModal(null, source);
    return;
  }

  const hotProduct = event.target.closest('[data-product-hot]');
  if (hotProduct) {
    toggleProductHot(hotProduct.dataset.productHot);
    return;
  }

  const toggleButton = event.target.closest('[data-product-toggle]');
  if (toggleButton) {
    toggleProduct(toggleButton.dataset.productToggle);
    return;
  }

  const deleteButton = event.target.closest('[data-product-delete]');
  if (deleteButton) {
    deleteProduct(deleteButton.dataset.productDelete);
    return;
  }

  // Categorías
  const editCategory = event.target.closest('[data-category-edit]');
  if (editCategory) {
    openCategoryModal(editCategory.dataset.categoryEdit);
    return;
  }

  const toggleCatBtn = event.target.closest('[data-category-toggle]');
  if (toggleCatBtn) {
    toggleCategory(toggleCatBtn.dataset.categoryToggle);
    return;
  }

  const moveCatBtn = event.target.closest('[data-category-move]');
  if (moveCatBtn) {
    moveCategoryOrder(moveCatBtn.dataset.categoryMove, moveCatBtn.dataset.dir);
    return;
  }

  const deleteCatBtn = event.target.closest('[data-category-delete]');
  if (deleteCatBtn) {
    deleteCategory(deleteCatBtn.dataset.categoryDelete);
    return;
  }

  // Banners
  const editBanner = event.target.closest('[data-banner-edit]');
  if (editBanner) {
    openBannerModal(editBanner.dataset.bannerEdit);
    return;
  }

  const toggleBannerBtn = event.target.closest('[data-banner-toggle]');
  if (toggleBannerBtn) {
    toggleBanner(toggleBannerBtn.dataset.bannerToggle);
    return;
  }

  const moveBannerBtn = event.target.closest('[data-banner-move]');
  if (moveBannerBtn) {
    moveBannerOrder(moveBannerBtn.dataset.bannerMove, moveBannerBtn.dataset.dir);
    return;
  }

  const deleteBannerBtn = event.target.closest('[data-banner-delete]');
  if (deleteBannerBtn) {
    deleteBanner(deleteBannerBtn.dataset.bannerDelete);
    return;
  }

  // Clientes
  const editCustomer = event.target.closest('[data-customer-edit]');
  if (editCustomer) {
    openCustomerModal(editCustomer.dataset.customerEdit);
    return;
  }

  const deleteCustomerBtn = event.target.closest('[data-customer-delete]');
  if (deleteCustomerBtn) {
    deleteCustomer(deleteCustomerBtn.dataset.customerDelete);
  }
}

function handleAdminChange(event) {
  // Cambio directo de categoría en tarjeta de producto o tabla de asignación
  const inlineCatSelect = event.target.closest('[data-inline-category-product]');
  if (inlineCatSelect) {
    assignSingleProductCategory(inlineCatSelect.dataset.inlineCategoryProduct, inlineCatSelect.value);
    return;
  }

  // Cambio directo de orden en tabla de asignación
  const inlineOrderInput = event.target.closest('[data-inline-order-product]');
  if (inlineOrderInput) {
    updateSingleProductOrder(inlineOrderInput.dataset.inlineOrderProduct, inlineOrderInput.value);
    return;
  }

  // Checkboxes individuales de asignación masiva
  const assignCheck = event.target.closest('[data-assign-check]');
  if (assignCheck) {
    const id = String(assignCheck.dataset.assignCheck);
    if (assignCheck.checked) {
      adminState.selectedAssignProducts.add(id);
    } else {
      adminState.selectedAssignProducts.delete(id);
    }
    renderAssignmentView();
  }
}

function handleAdminInput(event) {
  // Preview en vivo del precio en efectivo dentro del modal de producto
  if (event.target.id === 'modalProductPriceInput') {
    const price = Number(event.target.value || 0);
    const preview = document.getElementById('modalProductCashPreview');
    if (preview) {
      preview.innerHTML = `💵 En efectivo (10% OFF): <strong>${formatPrice(getCashPrice(price))}</strong>`;
    }
    return;
  }

  // Preview en vivo de la imagen cuando escribe URL manualmente
  if (event.target.id === 'modalImageUrlInput') {
    const preview = document.getElementById('modalImagePreview');
    if (preview && event.target.value.trim()) {
      preview.src = event.target.value.trim();
    }
    return;
  }

  // Autogenerar slug de categoría al escribir el nombre (si está creando)
  if (event.target.id === 'modalCategoryName') {
    const form = event.target.closest('#categoryForm');
    const slugInput = document.getElementById('modalCategorySlug');
    if (form && !form.dataset.categoryId && slugInput) {
      slugInput.value = slugify(event.target.value);
    }
  }
}

function handleAdminSubmit(event) {
  if (event.target.id === 'productForm') {
    event.preventDefault();
    saveProduct(event.target);
    return;
  }

  if (event.target.id === 'bulkPriceForm') {
    event.preventDefault();
    saveBulkPriceAdjustment(event.target);
    return;
  }

  if (event.target.id === 'categoryForm') {
    event.preventDefault();
    saveCategory(event.target);
    return;
  }

  if (event.target.id === 'categoryAssignChecklistForm') {
    event.preventDefault();
    saveCategoryAssignChecklist(event.target);
    return;
  }

  if (event.target.id === 'bannerForm') {
    event.preventDefault();
    saveBanner(event.target);
    return;
  }

  if (event.target.id === 'customerForm') {
    event.preventDefault();
    saveCustomer(event.target);
    return;
  }

  if (event.target.id === 'orderStatusForm') {
    event.preventDefault();
    const status = event.target.querySelector('[name="status"]')?.value;
    const orderId = event.target.dataset.orderId;
    if (status && orderId) updateOrderStatus(orderId, status);
  }
}

/* ─── MODAL ──────────────────────────────────────────────────────────────── */

function openModal() {
  const overlay = document.getElementById('modalOverlay');
  if (!overlay) return;
  overlay.hidden = false;
  document.body.classList.add('no-scroll');
  setTimeout(() => document.getElementById('modalCloseBtn')?.focus(), 40);
}

function closeModal() {
  const overlay = document.getElementById('modalOverlay');
  if (!overlay) return;
  overlay.hidden = true;
  document.body.classList.remove('no-scroll');
  const content = document.getElementById('modalContent');
  if (content) content.innerHTML = '';
  adminState.modalProductId = null;
}

/* ─── UTILIDADES ─────────────────────────────────────────────────────────── */

function getOrderMeta(order) {
  const raw = order?.items;
  let items = [];
  let meta = {};

  if (Array.isArray(raw)) {
    items = raw;
  } else if (raw && typeof raw === 'object') {
    items = Array.isArray(raw.detalle) ? raw.detalle : [];
    meta = raw;
  }

  const subtotalLista = Number(meta.subtotalLista ?? order.total ?? 0);
  const descuento = Number(meta.descuento ?? 0);
  const total = Number(meta.total ?? order.total ?? 0);

  return {
    codigo: meta.codigo || `#${String(order?.id || '').slice(0, 8).toUpperCase()}`,
    modalidad: meta.modalidad || (order?.delivery_address ? 'delivery' : 'takeaway'),
    pago: meta.pago || '',
    notas: meta.notas || '',
    items,
    subtotalLista,
    descuento,
    total
  };
}

function getOrderTotal(order) {
  const meta = getOrderMeta(order);
  return Number(meta.total || order.total || 0);
}

function getCashPrice(price) {
  return Math.round(Number(price || 0) * (1 - Number(BRAND.cashDiscount || 0)));
}

function categoryName(categoryId) {
  const cat = adminState.categories.find((category) => String(category.id) === String(categoryId));
  return cat ? `${cat.icon || '🍕'} ${cat.name}` : 'Sin categoría';
}

function slugify(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function statusBadge(status) {
  const key = normalizeStatus(status);
  const label = STATUS_LABELS[key] || capitalize(String(status || 'pendiente').replace(/_/g, ' '));
  return `<span class="status-badge status-${escapeAttr(key || 'pendiente')}">${escapeHTML(label)}</span>`;
}

function normalizeStatus(value) {
  return normalizeText(value).replace(/\s+/g, '_');
}

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function samePhone(a, b) {
  const left = String(a || '').replace(/\D/g, '');
  const right = String(b || '').replace(/\D/g, '');
  if (!left || !right) return false;
  return left === right || left.endsWith(right) || right.endsWith(left);
}

function customerWhatsApp(phone, code = '') {
  let digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '#';
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (!digits.startsWith('54')) digits = `549${digits}`;
  const text = code ? `Hola, te escribo por el pedido ${code} de 14-60 Pizzas Caseras LPH.` : 'Hola, te escribo de 14-60 Pizzas Caseras LPH.';
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

function formatPrice(value) {
  return `$${(Number(value) || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(date);
}

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function capitalize(value) {
  const text = String(value || '');
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function setButtonLoading(button, loading) {
  if (!button) return;
  if (loading) {
    button.dataset.originalText = button.textContent;
    button.textContent = 'Guardando…';
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText || 'Guardar';
    button.disabled = false;
  }
}

function showToast(message, type = '') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  clearTimeout(adminState.toastTimer);
  toast.textContent = message;
  toast.classList.toggle('is-error', type === 'error');
  toast.classList.add('is-visible');
  adminState.toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3400);
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

/* ─── TEMA ───────────────────────────────────────────────────────────────── */

function initAdminTheme() {
  const saved = localStorage.getItem(ADMIN_THEME_KEY);
  applyAdminTheme(saved === 'dark' ? 'dark' : 'light');
}

function toggleAdminTheme() {
  const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  applyAdminTheme(next);
}

function applyAdminTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(ADMIN_THEME_KEY, theme);
  const button = document.getElementById('themeBtn');
  if (button) {
    button.textContent = theme === 'dark' ? '☀️' : '🌙';
    button.setAttribute('aria-label', theme === 'dark' ? 'Usar tema claro' : 'Usar tema oscuro');
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'dark' ? '#08080a' : '#fffaf2';
}
