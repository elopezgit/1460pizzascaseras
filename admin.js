'use strict';

/* ─── 14-60 Pizzas Caseras · panel de administración ─────────────────────── */

const ADMIN_USER = 'admin';
const ADMIN_PASS = '123456';
const ADMIN_SESSION_KEY = 'p1460_admin_session';
const ADMIN_CACHE_KEY = 'p1460_admin_cache';
const ADMIN_THEME_KEY = 'p1460_admin_theme';

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

const adminState = {
  orders: [],
  products: [],
  categories: [],
  customers: [],
  view: 'resumen',
  orderSearch: '',
  orderStatus: 'todos',
  productSearch: '',
  productCategory: 'todos',
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

/* ─── ACCESO ─────────────────────────────────────────────────────────────── */

function bindAdminEvents() {
  document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
  document.getElementById('logoutBtn')?.addEventListener('click', logout);

  document.querySelectorAll('.nav-link').forEach((button) => {
    button.addEventListener('click', () => switchView(button.dataset.view));
  });

  document.querySelectorAll('[data-view-link]').forEach((button) => {
    button.addEventListener('click', () => switchView(button.dataset.viewLink));
  });

  document.getElementById('refreshBtn')?.addEventListener('click', () => loadAdminData());
  document.getElementById('themeBtn')?.addEventListener('click', toggleAdminTheme);
  document.getElementById('menuBtn')?.addEventListener('click', () => toggleSidebar());
  document.getElementById('sidebarOverlay')?.addEventListener('click', () => toggleSidebar(false));

  document.getElementById('orderSearch')?.addEventListener('input', (event) => {
    adminState.orderSearch = event.target.value.trim();
    renderOrders();
  });
  document.getElementById('orderStatusFilter')?.addEventListener('change', (event) => {
    adminState.orderStatus = event.target.value;
    renderOrders();
  });
  document.getElementById('productSearch')?.addEventListener('input', (event) => {
    adminState.productSearch = event.target.value.trim();
    renderProducts();
  });
  document.getElementById('productCategoryFilter')?.addEventListener('change', (event) => {
    adminState.productCategory = event.target.value;
    renderProducts();
  });
  document.getElementById('customerSearch')?.addEventListener('input', (event) => {
    adminState.customerSearch = event.target.value.trim();
    renderCustomers();
  });
  document.getElementById('newProductBtn')?.addEventListener('click', () => openProductModal());

  document.getElementById('modalCloseBtn')?.addEventListener('click', closeModal);
  document.getElementById('modalOverlay')?.addEventListener('click', (event) => {
    if (event.target === event.currentTarget) closeModal();
  });

  document.addEventListener('click', handleAdminClick);
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
  switchView('resumen');
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
  const target = ['resumen', 'pedidos', 'productos', 'clientes'].includes(view) ? view : 'resumen';
  adminState.view = target;

  document.querySelectorAll('.nav-link').forEach((button) => {
    button.classList.toggle('active', button.dataset.view === target);
  });

  document.querySelectorAll('.view').forEach((section) => {
    section.classList.toggle('active', section.id === `view-${target}`);
  });

  const meta = {
    resumen: { title: 'Resumen', eyebrow: 'Administración' },
    pedidos: { title: 'Pedidos', eyebrow: 'Ventas y entregas' },
    productos: { title: 'Productos', eyebrow: 'Catálogo' },
    clientes: { title: 'Clientes', eyebrow: 'Base de datos' }
  }[target];

  const title = document.getElementById('pageTitle');
  const eyebrow = document.getElementById('pageEyebrow');
  if (title) title.textContent = meta.title;
  if (eyebrow) eyebrow.textContent = meta.eyebrow;
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

/* ─── DATOS ──────────────────────────────────────────────────────────────── */

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
    const [ordersResult, productsResult, categoriesResult, customersResult] = await Promise.all([
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
      client.from('customers')
        .select('*')
        .eq('empresa_id', EMPRESA_ID)
        .order('created_at', { ascending: false })
    ]);

    const results = [ordersResult, productsResult, categoriesResult, customersResult];
    const errors = results.filter((result) => result.error);

    if (!ordersResult.error) adminState.orders = ordersResult.data || [];
    if (!productsResult.error) adminState.products = productsResult.data || [];
    if (!categoriesResult.error) adminState.categories = categoriesResult.data || [];
    if (!customersResult.error) adminState.customers = customersResult.data || [];

    if (errors.length) {
      setConnection(false);
      if (showFeedback) {
        showToast(`No se pudieron cargar todos los datos: ${errors[0].error.message}`, 'error');
      }
    } else {
      setConnection(true);
      saveAdminCache();
      if (showFeedback) showToast('Datos actualizados.');
    }
  } catch (error) {
    console.error('Error al cargar el panel:', error);
    loadAdminCache();
    setConnection(false);
    if (showFeedback) showToast('No se pudo conectar. Mostrando datos guardados.', 'error');
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
  renderProducts();
  renderCustomers();
  renderCategoryFilter();
}

function renderCounts() {
  setText('navOrdersCount', String(adminState.orders.length));
  setText('navProductsCount', String(adminState.products.length));
  setText('navCustomersCount', String(adminState.customers.length));
}

function renderStats() {
  const activeOrders = adminState.orders.filter((order) => normalizeStatus(order.status) !== 'cancelado');
  const pending = adminState.orders.filter((order) => ['pendiente', 'confirmado', 'preparando', 'en_preparacion'].includes(normalizeStatus(order.status)));
  const revenue = activeOrders.reduce((sum, order) => sum + getOrderTotal(order), 0);

  setText('statOrders', String(adminState.orders.length));
  setText('statPending', String(pending.length));
  setText('statRevenue', formatPrice(revenue));
  setText('statCustomers', String(adminState.customers.length));
}

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

function renderCategoryFilter() {
  const select = document.getElementById('productCategoryFilter');
  if (!select) return;
  const current = adminState.productCategory;
  const categories = [...adminState.categories].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
  select.innerHTML = [
    '<option value="todos">Todas las categorías</option>',
    ...categories.map((category) => `<option value="${escapeAttr(category.id)}">${escapeHTML(category.name)}</option>`)
  ].join('');
  select.value = categories.some((category) => category.id === current) ? current : 'todos';
  if (select.value !== current) adminState.productCategory = select.value;
}

function renderProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  const query = normalizeText(adminState.productSearch);
  const categoryFilter = adminState.productCategory;

  const products = adminState.products
    .filter((product) => {
      if (categoryFilter !== 'todos' && product.category_id !== categoryFilter) return false;
      if (!query) return true;
      return normalizeText(`${product.name} ${product.description} ${product.code} ${(product.tags || []).join(' ')}`).includes(query);
    })
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));

  if (!products.length) {
    grid.innerHTML = '<div class="panel"><p class="empty-cell">No hay productos que coincidan con el filtro.</p></div>';
    return;
  }

  grid.innerHTML = products.map((product) => {
    const image = product.image_url || 'img/productos/muzzarella.webp';
    const active = product.is_active !== false;
    return `
      <article class="admin-product ${active ? '' : 'is-inactive'}">
        <div class="admin-product-media">
          <img src="${escapeAttr(image)}" alt="${escapeAttr(product.name)}" loading="lazy"
            onerror="this.src='img/productos/muzzarella.webp'">
          <span class="product-tag ${active ? 'is-on' : ''}">${active ? 'Activo' : 'Oculto'}</span>
        </div>
        <div class="admin-product-body">
          <span class="product-cat">${escapeHTML(categoryName(product.category_id))}</span>
          <h3>${escapeHTML(product.name)}</h3>
          <p>${escapeHTML(product.description || 'Sin descripción.')}</p>
          <div class="admin-product-prices">
            <strong>${formatPrice(product.price)} ${product.unit_type === 'persona' ? 'por persona' : 'transferencia'}</strong>
            <span>${formatPrice(getCashPrice(product.price))} ${product.unit_type === 'persona' ? 'por persona en efectivo' : 'en efectivo'}</span>
          </div>
          <div class="admin-product-actions">
            <button type="button" class="btn btn-ghost btn-small" data-product-edit="${escapeAttr(product.id)}">Editar</button>
            <button type="button" class="btn btn-ghost btn-small" data-product-toggle="${escapeAttr(product.id)}">${active ? 'Ocultar' : 'Mostrar'}</button>
            <button type="button" class="btn btn-danger btn-small" data-product-delete="${escapeAttr(product.id)}">Borrar</button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

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
        <td><button type="button" class="btn btn-ghost btn-small" data-customer-edit="${escapeAttr(customer.id)}">Editar</button></td>
      </tr>
    `;
  }).join('');
}

/* ─── DETALLE DE PEDIDO ──────────────────────────────────────────────────── */

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

/* ─── PRODUCTOS ──────────────────────────────────────────────────────────── */

function openProductModal(productId = null) {
  adminState.modalProductId = productId;
  const product = productId
    ? adminState.products.find((row) => String(row.id) === String(productId))
    : null;

  const categoryOptions = [...adminState.categories]
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
    .map((category) => `<option value="${escapeAttr(category.id)}" ${product?.category_id === category.id ? 'selected' : ''}>${escapeHTML(category.name)}</option>`)
    .join('');
  const basePrice = product ? Number(product.price || 0) : 10000;

  document.getElementById('modalContent').innerHTML = `
    <div class="modal-head">
      <p class="eyebrow">${product ? 'Editar producto' : 'Nuevo producto'}</p>
      <h2>${product ? escapeHTML(product.name) : 'Agregar al catálogo'}</h2>
      <p>El precio base es el de transferencia. El efectivo se calcula automáticamente con 10% de descuento.</p>
    </div>

    <form id="productForm" data-product-id="${product ? escapeAttr(product.id) : ''}">
      <div class="form-grid">
        <label class="field span-2">
          <span>Nombre</span>
          <input type="text" name="name" value="${escapeAttr(product?.name || '')}" required maxlength="120">
        </label>

        <label class="field">
          <span>Categoría</span>
          <select name="category_id" required>
            <option value="">Elegir categoría…</option>
            ${categoryOptions}
          </select>
        </label>

        <label class="field">
          <span>Código interno</span>
          <input type="text" name="code" value="${escapeAttr(product?.code || '')}" placeholder="1460-016">
        </label>

        <label class="field">
          <span>Precio transferencia (ARS)</span>
          <input type="number" name="price" value="${basePrice}" min="0" step="100" required>
          <small>En efectivo: ${formatPrice(getCashPrice(basePrice))}</small>
        </label>

        <label class="field">
          <span>Unidad de venta</span>
          <select name="unit_type">
            <option value="unidad" ${product?.unit_type === 'unidad' || !product?.unit_type ? 'selected' : ''}>Unidad</option>
            <option value="persona" ${product?.unit_type === 'persona' ? 'selected' : ''}>Persona</option>
          </select>
        </label>

        <label class="field">
          <span>Orden</span>
          <input type="number" name="sort_order" value="${Number(product?.sort_order || 0)}" step="1">
        </label>

        <label class="field span-2">
          <span>Imagen (URL o ruta)</span>
          <input type="text" name="image_url" value="${escapeAttr(product?.image_url || '')}" placeholder="img/productos/muzzarella.webp">
        </label>

        <label class="field">
          <span>Emoji</span>
          <input type="text" name="emoji" value="${escapeAttr(product?.emoji || '🍕')}" maxlength="8">
        </label>

        <label class="field">
          <span>Tiempo de preparación</span>
          <input type="text" name="prep_tiempo" value="${escapeAttr(product?.prep_tiempo || '12-15 min')}" maxlength="40">
        </label>

        <label class="field span-2">
          <span>Descripción corta</span>
          <textarea name="description" rows="2" maxlength="240">${escapeHTML(product?.description || '')}</textarea>
        </label>

        <label class="field span-2">
          <span>Ingredientes</span>
          <textarea name="ingredients" rows="2" maxlength="300">${escapeHTML(product?.ingredients || '')}</textarea>
        </label>

        <label class="field span-2">
          <span>Descripción de preparación</span>
          <textarea name="prep_descripcion" rows="2" maxlength="300">${escapeHTML(product?.prep_descripcion || '')}</textarea>
        </label>

        <label class="field span-2">
          <span>Etiquetas <small>(separadas por coma)</small></span>
          <input type="text" name="tags" value="${escapeAttr((product?.tags || []).join(', '))}" placeholder="popular, clasica">
        </label>

        <div class="span-2 check-row">
          <label><input type="checkbox" name="is_active" ${product?.is_active === false ? '' : 'checked'}> Visible en el sitio</label>
          <label><input type="checkbox" name="hot" ${product?.hot ? 'checked' : ''}> Destacar como más pedida</label>
        </div>
      </div>

      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" data-close-modal>Cancelar</button>
        <button type="submit" class="btn btn-primary">${product ? 'Guardar cambios' : 'Crear producto'}</button>
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
    emoji: String(data.get('emoji') || '').trim() || null,
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
    showToast(productId ? 'Producto actualizado.' : 'Producto creado.');
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

  try {
    const { data, error } = await client
      .from('products')
      .update({ is_active: product.is_active === false })
      .eq('id', product.id)
      .eq('empresa_id', EMPRESA_ID)
      .select('id');

    if (error) throw error;
    if (!data?.length) throw new Error('Producto no encontrado en esta empresa.');

    product.is_active = product.is_active === false;
    saveAdminCache();
    renderProducts();
    showToast(product.is_active ? 'Producto visible en el sitio.' : 'Producto oculto del sitio.');
  } catch (error) {
    console.error('Error al cambiar la visibilidad:', error);
    showToast(`No se pudo actualizar: ${error.message}`, 'error');
  }
}

async function deleteProduct(productId) {
  const client = getClient();
  const product = adminState.products.find((row) => String(row.id) === String(productId));
  if (!client || !product) return;

  if (!window.confirm(`¿Borrar "${product.name}"? Esta acción no se puede deshacer.`)) return;

  try {
    const { data, error } = await client
      .from('products')
      .delete()
      .eq('id', product.id)
      .eq('empresa_id', EMPRESA_ID)
      .select('id');

    if (error) throw error;
    if (!data?.length) throw new Error('Producto no encontrado en esta empresa.');

    adminState.products = adminState.products.filter((row) => String(row.id) !== String(product.id));
    saveAdminCache();
    renderAll();
    showToast('Producto eliminado.');
  } catch (error) {
    console.error('Error al borrar el producto:', error);
    showToast(`No se pudo borrar: ${error.message}`, 'error');
  }
}

/* ─── CLIENTES ───────────────────────────────────────────────────────────── */

function openCustomerModal(customerId) {
  const customer = adminState.customers.find((row) => String(row.id) === String(customerId));
  if (!customer) return;

  document.getElementById('modalContent').innerHTML = `
    <div class="modal-head">
      <p class="eyebrow">Ficha de cliente</p>
      <h2>${escapeHTML(customer.name || 'Cliente')}</h2>
      <p>Los cambios se guardan solo para 14-60 Pizzas Caseras.</p>
    </div>

    <form id="customerForm" data-customer-id="${escapeAttr(customer.id)}">
      <div class="form-grid">
        <label class="field span-2">
          <span>Nombre y apellido</span>
          <input type="text" name="name" value="${escapeAttr(customer.name || '')}" required maxlength="120">
        </label>

        <label class="field">
          <span>Teléfono</span>
          <input type="tel" name="phone" value="${escapeAttr(customer.phone || '')}" required maxlength="40">
        </label>

        <label class="field">
          <span>Email</span>
          <input type="email" name="email" value="${escapeAttr(customer.email || '')}" maxlength="120">
        </label>

        <label class="field span-2">
          <span>Dirección</span>
          <input type="text" name="address" value="${escapeAttr(customer.address || '')}" maxlength="200">
        </label>

        <label class="field">
          <span>Fecha de nacimiento</span>
          <input type="date" name="birth_date" value="${escapeAttr(customer.birth_date || '')}">
        </label>
      </div>

      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" data-close-modal>Cancelar</button>
        <button type="submit" class="btn btn-primary">Guardar cambios</button>
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
  const customerId = form.dataset.customerId;
  const payload = {
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
    const { data: updated, error } = await client
      .from('customers')
      .update(payload)
      .eq('id', customerId)
      .eq('empresa_id', EMPRESA_ID)
      .select('id');

    if (error) {
      if (String(error.message || '').toLowerCase().includes('duplicate')) {
        throw new Error('Ya existe otro cliente con ese teléfono.');
      }
      throw error;
    }
    if (!updated?.length) throw new Error('Cliente no encontrado en esta empresa.');

    closeModal();
    showToast('Cliente actualizado.');
    await loadAdminData(false);
  } catch (error) {
    console.error('Error al guardar el cliente:', error);
    showToast(`No se pudo guardar: ${error.message}`, 'error');
  } finally {
    setButtonLoading(button, false);
  }
}

/* ─── DELEGACIÓN DE EVENTOS ──────────────────────────────────────────────── */

function handleAdminClick(event) {
  const closeButton = event.target.closest('[data-close-modal]');
  if (closeButton) {
    closeModal();
    return;
  }

  const orderRow = event.target.closest('[data-order-open]');
  if (orderRow) {
    openOrderModal(orderRow.dataset.orderOpen);
    return;
  }

  const editProduct = event.target.closest('[data-product-edit]');
  if (editProduct) {
    openProductModal(editProduct.dataset.productEdit);
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

  const editCustomer = event.target.closest('[data-customer-edit]');
  if (editCustomer) {
    openCustomerModal(editCustomer.dataset.customerEdit);
  }
}

function handleAdminSubmit(event) {
  if (event.target.id === 'productForm') {
    event.preventDefault();
    saveProduct(event.target);
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
  return adminState.categories.find((category) => category.id === categoryId)?.name || 'Sin categoría';
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
  const text = code ? `Hola, te escribo por el pedido ${code} de 14-60 Pizzas Caseras.` : 'Hola, te escribo de 14-60 Pizzas Caseras.';
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
  applyAdminTheme(saved === 'light' ? 'light' : 'dark');
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
