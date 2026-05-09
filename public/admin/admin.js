/* ============================================================
   Lighthouse Studios By Brainvare — Admin Dashboard v2
   ============================================================ */

'use strict';

/* ── DB SHIMS: normalise DB API for admin.js ── */
// data.js uses DB.getBookings() / DB.updateBooking() — expose as DB.getAll / DB.get
if (typeof DB !== 'undefined') {
    if (!DB.getAll)  DB.getAll  = function() { return this.getBookings(); };
    if (!DB.get)     DB.get     = function(id) { return this.getBookings().find(b => b.id === id) || null; };
    // saveBooking in data.js sets bookingId field and b.id — admin.js uses b.id throughout
}
// Flatten add-ons: ADMIN_DB.getAddons() without arg → flat array for admin UI
const _origGetAddons = typeof ADMIN_DB !== 'undefined' ? ADMIN_DB.getAddons.bind(ADMIN_DB) : null;
if (typeof ADMIN_DB !== 'undefined') {
    ADMIN_DB._getAddonsFlat = function() { return this.getAllAddonsList ? this.getAllAddonsList() : []; };
    ADMIN_DB._getAddonsForService = function(sid) { return _origGetAddons(sid); };
    // Override getAddons to return flat array when called with no arg from admin.js
    ADMIN_DB.getAddons = function(serviceId) {
        if (serviceId) return _origGetAddons(serviceId);
        return this.getAllAddonsList ? this.getAllAddonsList() : [];
    };
    // Override saveAddon to accept (data) instead of (serviceId, addon)
    const _origSaveAddon = ADMIN_DB.saveAddon.bind(ADMIN_DB);
    ADMIN_DB.saveAddon = function(data) {
        const svcId = data.serviceId || 'podcast';
        return _origSaveAddon(svcId, data);
    };
    const _origDeleteAddon = ADMIN_DB.deleteAddon.bind(ADMIN_DB);
    ADMIN_DB.deleteAddon = function(id) {
        // Delete across all service buckets
        const all = JSON.parse(localStorage.getItem('lhs_addons') || 'null') || {};
        Object.keys(all).forEach(svc => { all[svc] = (all[svc] || []).filter(a => a.id !== id); });
        localStorage.setItem('lhs_addons', JSON.stringify(all));
    };
    // Terms: return structured array
    ADMIN_DB.getTerms = function() { return this.getTermsStructured ? this.getTermsStructured() : []; };
    // WhatsApp config: normalise key
    if (typeof STUDIO_CONFIG !== 'undefined' && !STUDIO_CONFIG.whatsapp) {
        STUDIO_CONFIG.whatsapp = STUDIO_CONFIG.whatsappNumber || '';
    }
}

/* ── PRICE CALC SHIM ── normalise return keys ── */
if (typeof PriceCalc !== 'undefined') {
    const _origCalc = PriceCalc.calculate.bind(PriceCalc);
    PriceCalc.calculate = function(opts) {
        const r = _origCalc(opts);
        if (!r) return r;
        // data.js returns { total, advance, balance } — admin.js expects { totalAmount, advanceAmount }
        r.totalAmount  = r.total  ?? r.totalAmount  ?? 0;
        r.advanceAmount= r.advance ?? r.advanceAmount ?? 0;
        return r;
    };
}

/* ── STATE ── */
let currentPage = 'overview';
let currentBookingId = null;
let currentBdTab = 'overview';
let adminCalDate = new Date();
let confirmCallback = null;
let currentUser = null;

/* ══════════════════════════════════════
   INIT
══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  bindGlobalUI();
});

function checkAuth() {
  const sess = sessionStorage.getItem('lhs_admin_user');
  if (sess) {
    try { currentUser = JSON.parse(sess); } catch(e) { currentUser = { name: 'Admin', role: 'superadmin' }; }
    showShell();
  }
}

function showShell() {
  document.getElementById('login-overlay').style.display = 'none';
  document.getElementById('admin-shell').style.display = 'flex';
  document.getElementById('topbar-username').textContent = currentUser?.name || 'Admin';
  document.getElementById('topbar-avatar').textContent = (currentUser?.name || 'A')[0].toUpperCase();
  updateNavBadge();
  loadPage('overview');
}

/* ══════════════════════════════════════
   AUTH
══════════════════════════════════════ */
document.getElementById('login-form').addEventListener('submit', e => {
  e.preventDefault();
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  const err  = document.getElementById('login-error');

  const cfg = STUDIO_CONFIG || {};
  const adminPass = cfg.adminPassword || 'lighthouse2026';

  // Check ADMIN_DB users first
  const users = ADMIN_DB.getUsers ? ADMIN_DB.getUsers() : [];
  const matched = users.find(u => u.username === user && u.password === pass && u.active !== false);

  if (matched) {
    currentUser = matched;
    sessionStorage.setItem('lhs_admin_user', JSON.stringify(matched));
    err.textContent = '';
    showShell();
    return;
  }

  // Fallback: legacy admin/password
  if ((user === 'admin' || user === '') && pass === adminPass) {
    currentUser = { name: 'Admin', username: 'admin', role: 'superadmin' };
    sessionStorage.setItem('lhs_admin_user', JSON.stringify(currentUser));
    err.textContent = '';
    showShell();
    return;
  }

  err.textContent = 'Invalid username or password.';
});

document.getElementById('pass-toggle').addEventListener('click', () => {
  const inp = document.getElementById('login-pass');
  inp.type = inp.type === 'password' ? 'text' : 'password';
});

document.getElementById('logout-btn').addEventListener('click', () => {
  sessionStorage.removeItem('lhs_admin_user');
  currentUser = null;
  document.getElementById('admin-shell').style.display = 'none';
  document.getElementById('login-overlay').style.display = 'flex';
  document.getElementById('login-pass').value = '';
  document.getElementById('login-error').textContent = '';
});

/* ══════════════════════════════════════
   NAV / ROUTING
══════════════════════════════════════ */
function bindGlobalUI() {
  // nav clicks
  document.querySelectorAll('.nav-item[data-page]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      loadPage(a.dataset.page);
      closeSidebar();
    });
  });

  // mobile sidebar
  document.getElementById('topbar-menu').addEventListener('click', openSidebar);
  document.getElementById('sidebar-close').addEventListener('click', closeSidebar);
  document.getElementById('sidebar-overlay').addEventListener('click', closeSidebar);

  // WA topbar btn
  document.getElementById('topbar-wa-btn').addEventListener('click', () => {
    const cfg = STUDIO_CONFIG || {};
    const phone = cfg.whatsapp || '';
    window.open(`https://wa.me/${phone.replace(/\D/g,'')}`, '_blank');
  });

  bindModalCloses();
  bindBookingDetailModal();
  bindConfirmDialog();
}

function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-overlay').classList.add('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}

function loadPage(page) {
  currentPage = page;

  // Update nav active state
  document.querySelectorAll('.nav-item[data-page]').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page);
  });

  // Update topbar breadcrumb
  const labels = {
    overview: 'Overview', bookings: 'All Bookings', 'create-booking': 'Create Booking',
    calendar: 'Calendar', customers: 'Customer List', payments: 'Payments',
    coupons: 'Coupons & Discounts', services: 'Services', packages: 'Package Builder',
    addons: 'Add-Ons', tariffs: 'Tariffs', terms: 'Terms & Conditions',
    templates: 'WhatsApp Templates', users: 'Users & Roles', reports: 'Reports', settings: 'Settings'
  };
  document.getElementById('topbar-page').textContent = labels[page] || page;

  const el = document.getElementById('page-content');

  switch(page) {
    case 'overview':       el.innerHTML = renderOverview(); bindOverviewEvents(); break;
    case 'bookings':       el.innerHTML = renderBookings(); bindBookingsEvents(); break;
    case 'create-booking': el.innerHTML = renderCreateBooking(); bindCreateBookingEvents(); break;
    case 'calendar':       el.innerHTML = renderCalendarPage(); bindCalendarEvents(); break;
    case 'customers':      el.innerHTML = renderCustomers(); bindCustomersEvents(); break;
    case 'payments':       el.innerHTML = renderPayments(); bindPaymentsEvents(); break;
    case 'coupons':        el.innerHTML = renderCoupons(); bindCouponsEvents(); break;
    case 'services':       el.innerHTML = renderServices(); bindServicesEvents(); break;
    case 'packages':       el.innerHTML = renderPackages(); bindPackagesEvents(); break;
    case 'addons':         el.innerHTML = renderAddons(); bindAddonsEvents(); break;
    case 'tariffs':        el.innerHTML = renderTariffs(); bindTariffsEvents(); break;
    case 'terms':          el.innerHTML = renderTerms(); bindTermsEvents(); break;
    case 'templates':      el.innerHTML = renderTemplates(); bindTemplatesEvents(); break;
    case 'users':          el.innerHTML = renderUsers(); bindUsersEvents(); break;
    case 'reports':        el.innerHTML = renderReports(); break;
    case 'settings':       el.innerHTML = renderSettings(); bindSettingsEvents(); break;
    default: el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🚧</div><p class="empty-state-title">Coming soon</p></div>`;
  }
}

function updateNavBadge() {
  const all = DB.getAll ? DB.getAll() : [];
  const pending = all.filter(b => ['new-request','awaiting-availability','awaiting-payment'].includes(b.status)).length;
  const badge = document.getElementById('nav-badge-bookings');
  if (badge) { badge.textContent = pending || ''; }
}

/* ══════════════════════════════════════
   HELPERS
══════════════════════════════════════ */
function fmt(n) { return '₹' + Number(n||0).toLocaleString('en-IN'); }
function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}
function fmtTime(h) {
  if (h === undefined || h === null) return '—';
  const hh = Math.floor(h), mm = Math.round((h % 1) * 60);
  const ampm = hh >= 12 ? 'PM' : 'AM';
  const hr = hh % 12 || 12;
  return `${hr}:${mm.toString().padStart(2,'0')} ${ampm}`;
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
function randCode(n=6) { return Math.random().toString(36).slice(2,2+n).toUpperCase(); }

function statusPill(s) {
  const map = {
    'new-request':'new-request','awaiting-availability':'awaiting-availability',
    'awaiting-payment':'awaiting-payment','confirmed':'confirmed',
    'advance-paid':'advance-paid','fully-paid':'fully-paid',
    'in-session':'in-session','completed':'completed',
    'cancelled':'cancelled','rescheduled':'rescheduled'
  };
  const label = s ? s.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) : '—';
  return `<span class="status-pill pill-${map[s]||'new-request'}">${label}</span>`;
}
function payPill(s) {
  const map = { 'not-paid':'not-paid','advance-paid':'advance-paid','fully-paid':'fully-paid-pay','refund-pending':'refund-pending','refunded':'refunded' };
  const label = s ? s.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) : '—';
  return `<span class="status-pill pill-${map[s]||'not-paid'}">${label}</span>`;
}
function deliveryPill(s) {
  const map = { 'not-started':'not-started','editing':'editing','review':'review','delivered':'delivered' };
  const label = s ? s.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) : '—';
  return `<span class="status-pill pill-${map[s]||'not-started'}">${label}</span>`;
}

function showToast(msg, type='info') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 4200);
}

function showConfirm(title, body, cb) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-body').textContent = body;
  document.getElementById('confirm-backdrop').style.display = 'flex';
  confirmCallback = cb;
}

function bindConfirmDialog() {
  document.getElementById('confirm-yes').addEventListener('click', () => {
    document.getElementById('confirm-backdrop').style.display = 'none';
    if (confirmCallback) confirmCallback();
    confirmCallback = null;
  });
  document.getElementById('confirm-no').addEventListener('click', () => {
    document.getElementById('confirm-backdrop').style.display = 'none';
    confirmCallback = null;
  });
}

function bindModalCloses() {
  const pairs = [
    ['customer-modal-backdrop','customer-modal-close','customer-modal-cancel'],
    ['package-modal-backdrop','package-modal-close','package-modal-cancel'],
    ['service-modal-backdrop','service-modal-close','service-modal-cancel'],
    ['addon-modal-backdrop','addon-modal-close','addon-modal-cancel'],
    ['tariff-modal-backdrop','tariff-modal-close','tariff-modal-cancel'],
    ['coupon-modal-backdrop','coupon-modal-close','coupon-modal-cancel'],
    ['user-modal-backdrop','user-modal-close','user-modal-cancel'],
    ['template-modal-backdrop','template-modal-close','template-modal-cancel'],
    ['lineitem-modal-backdrop','lineitem-modal-close','lineitem-modal-cancel'],
    ['drive-modal-backdrop','drive-modal-close','drive-modal-cancel'],
    ['block-slot-backdrop','block-slot-close','block-slot-cancel'],
  ];
  pairs.forEach(([bd, cl, cn]) => {
    const backdrop = document.getElementById(bd);
    const closeBtn = document.getElementById(cl);
    const cancelBtn = document.getElementById(cn);
    if (closeBtn) closeBtn.addEventListener('click', () => { backdrop.style.display = 'none'; });
    if (cancelBtn) cancelBtn.addEventListener('click', () => { backdrop.style.display = 'none'; });
    if (backdrop) backdrop.addEventListener('click', e => { if (e.target === backdrop) backdrop.style.display = 'none'; });
  });
}

/* ══════════════════════════════════════
   OVERVIEW
══════════════════════════════════════ */
function renderOverview() {
  const all = DB.getAll ? DB.getAll() : [];
  const today = new Date().toDateString();
  const todayBooks = all.filter(b => new Date(b.createdAt).toDateString() === today);
  const revenue = all.filter(b => b.paymentStatus === 'fully-paid').reduce((s,b) => s + (b.totalAmount||0), 0);
  const pending = all.filter(b => ['new-request','awaiting-availability','awaiting-payment'].includes(b.status));
  const upcoming = all.filter(b => b.date && new Date(b.date) >= new Date() && !['cancelled','completed'].includes(b.status))
    .sort((a,b) => new Date(a.date) - new Date(b.date)).slice(0,5);

  return `
  <div class="page-header">
    <div class="page-header-left">
      <h1 class="page-title">Dashboard Overview</h1>
      <p class="page-sub">${new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p>
    </div>
    <div class="page-header-right">
      <button class="btn-primary" onclick="loadPage('create-booking')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        New Booking
      </button>
    </div>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-label">Total Bookings</div>
      <div class="stat-value">${all.length}</div>
      <div class="stat-sub">${todayBooks.length} today</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Pending Action</div>
      <div class="stat-value text-warn">${pending.length}</div>
      <div class="stat-sub">Require response</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Revenue Collected</div>
      <div class="stat-value">${fmt(revenue)}</div>
      <div class="stat-sub">Fully paid bookings</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">This Month</div>
      <div class="stat-value">${all.filter(b=>{const d=new Date(b.createdAt);return d.getMonth()===new Date().getMonth()&&d.getFullYear()===new Date().getFullYear();}).length}</div>
      <div class="stat-sub">Bookings created</div>
    </div>
  </div>

  <div class="overview-grid">
    <div>
      <div class="card">
        <div class="card-header">
          <span class="card-title">Upcoming Bookings</span>
          <button class="tbl-btn tbl-btn-ghost" onclick="loadPage('bookings')">View all</button>
        </div>
        ${upcoming.length ? `
        <div class="table-wrap">
          <table>
            <thead><tr><th>ID</th><th>Client</th><th>Date</th><th>Service</th><th>Status</th><th></th></tr></thead>
            <tbody>
              ${upcoming.map(b=>`
              <tr>
                <td class="td-mono">${b.id}</td>
                <td class="td-bold">${b.customerName||'—'}</td>
                <td>${fmtDate(b.date)}</td>
                <td class="td-muted">${b.serviceName||b.serviceId||'—'}</td>
                <td>${statusPill(b.status)}</td>
                <td><button class="tbl-btn tbl-btn-primary" onclick="openBookingDetail('${b.id}')">View</button></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>` : `<div class="empty-state"><div class="empty-state-icon">📅</div><p class="empty-state-title">No upcoming bookings</p><p>Create a new booking to get started.</p></div>`}
      </div>
    </div>
    <div>
      <div class="card" style="margin-bottom:1rem">
        <div class="card-header"><span class="card-title">Quick Actions</span></div>
        <div class="card-body">
          <div class="quick-actions-grid">
            <button class="quick-action-btn" onclick="loadPage('create-booking')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              New Booking
            </button>
            <button class="quick-action-btn" onclick="loadPage('customers');setTimeout(()=>document.getElementById('open-add-customer-btn')?.click(),100)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Add Customer
            </button>
            <button class="quick-action-btn" onclick="loadPage('calendar')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Calendar
            </button>
            <button class="quick-action-btn" onclick="exportBookings()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export CSV
            </button>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Pending Actions</span></div>
        ${pending.length ? `
        <div style="padding:.5rem 0">
          ${pending.slice(0,5).map(b=>`
          <div style="display:flex;align-items:center;gap:.6rem;padding:.55rem 1rem;border-bottom:1px solid var(--border)">
            <div style="flex:1;min-width:0">
              <div style="font-weight:600;font-size:.85rem">${b.customerName||'—'}</div>
              <div style="font-size:.75rem;color:var(--muted)">${fmtDate(b.date)}</div>
            </div>
            ${statusPill(b.status)}
            <button class="tbl-btn tbl-btn-primary btn-sm" onclick="openBookingDetail('${b.id}')">Act</button>
          </div>`).join('')}
        </div>` : `<div class="empty-state" style="padding:1.5rem"><p>No pending actions</p></div>`}
      </div>
    </div>
  </div>`;
}
function bindOverviewEvents() {}

/* ══════════════════════════════════════
   ALL BOOKINGS
══════════════════════════════════════ */
function renderBookings(filter={}) {
  let all = DB.getAll ? DB.getAll() : [];
  const q = (filter.q||'').toLowerCase();
  const st = filter.status || '';
  const pay = filter.pay || '';

  if (q) all = all.filter(b => (b.id+b.customerName+b.customerPhone+b.serviceName+b.packageName).toLowerCase().includes(q));
  if (st) all = all.filter(b => b.status === st);
  if (pay) all = all.filter(b => b.paymentStatus === pay);

  all.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  return `
  <div class="page-header">
    <div class="page-header-left">
      <h1 class="page-title">All Bookings</h1>
      <p class="page-sub">${all.length} bookings</p>
    </div>
    <div class="page-header-right">
      <button class="btn-ghost btn-sm" onclick="exportBookings()">Export CSV</button>
      <button class="btn-primary" onclick="loadPage('create-booking')">+ New Booking</button>
    </div>
  </div>
  <div class="filter-bar">
    <input class="filter-search" id="bk-search" placeholder="Search name, ID, phone…" value="${filter.q||''}" />
    <select class="filter-select" id="bk-status">
      <option value="">All Statuses</option>
      ${['new-request','awaiting-availability','awaiting-payment','confirmed','advance-paid','fully-paid','in-session','completed','cancelled','rescheduled'].map(s=>`<option value="${s}" ${st===s?'selected':''}>${s.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>`).join('')}
    </select>
    <select class="filter-select" id="bk-pay">
      <option value="">All Payments</option>
      ${['not-paid','advance-paid','fully-paid','refund-pending','refunded'].map(s=>`<option value="${s}" ${pay===s?'selected':''}>${s.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>`).join('')}
    </select>
  </div>
  <div class="table-wrap">
    <table>
      <thead><tr><th>ID</th><th>Client</th><th>Date &amp; Time</th><th>Service / Package</th><th>Amount</th><th>Status</th><th>Payment</th><th>Actions</th></tr></thead>
      <tbody>
        ${all.length ? all.map(b=>`
        <tr>
          <td class="td-mono">${b.id}</td>
          <td>
            <div class="td-bold">${b.customerName||'—'}</div>
            <div class="td-muted text-sm">${b.customerPhone||''}</div>
          </td>
          <td>
            <div>${fmtDate(b.date)}</div>
            <div class="td-muted text-sm">${fmtTime(b.startHour)} – ${fmtTime(b.endHour)}</div>
          </td>
          <td>
            <div>${b.serviceName||b.serviceId||'—'}</div>
            <div class="td-muted text-sm">${b.packageName||''}</div>
          </td>
          <td class="td-bold">${fmt(b.totalAmount)}</td>
          <td>${statusPill(b.status)}</td>
          <td>${payPill(b.paymentStatus)}</td>
          <td class="td-actions">
            <button class="tbl-btn tbl-btn-primary" onclick="openBookingDetail('${b.id}')">View</button>
            <button class="tbl-btn tbl-btn-wa" onclick="waBooking('${b.id}')" title="WhatsApp">
              <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
            </button>
          </td>
        </tr>`).join('') : `<tr><td colspan="8"><div class="empty-state"><div class="empty-state-icon">📋</div><p class="empty-state-title">No bookings found</p><p>Try adjusting your filters.</p></div></td></tr>`}
      </tbody>
    </table>
  </div>`;
}

function bindBookingsEvents() {
  let debounce;
  const getFilter = () => ({
    q: document.getElementById('bk-search')?.value || '',
    status: document.getElementById('bk-status')?.value || '',
    pay: document.getElementById('bk-pay')?.value || ''
  });
  document.getElementById('bk-search')?.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => { document.getElementById('page-content').innerHTML = renderBookings(getFilter()); bindBookingsEvents(); }, 250);
  });
  document.getElementById('bk-status')?.addEventListener('change', () => { document.getElementById('page-content').innerHTML = renderBookings(getFilter()); bindBookingsEvents(); });
  document.getElementById('bk-pay')?.addEventListener('change', () => { document.getElementById('page-content').innerHTML = renderBookings(getFilter()); bindBookingsEvents(); });
}

function exportBookings() {
  const all = DB.getAll ? DB.getAll() : [];
  const cols = ['id','customerName','customerPhone','customerEmail','date','startHour','endHour','serviceName','packageName','totalAmount','status','paymentStatus','deliveryStatus','paymentRef','createdAt'];
  const csv = [cols.join(','), ...all.map(b => cols.map(c => JSON.stringify(b[c]||'')).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = `lhs-bookings-${Date.now()}.csv`;
  a.click();
  showToast('Exported successfully', 'success');
}

function waBooking(id) {
  const b = DB.get ? DB.get(id) : null;
  if (!b) return;
  const phone = (b.customerPhone||'').replace(/\D/g,'');
  const msg = encodeURIComponent(`Hi ${b.customerName}, regarding your booking ${b.id} on ${fmtDate(b.date)}.`);
  window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
}

/* ══════════════════════════════════════
   BOOKING DETAIL MODAL (5 tabs)
══════════════════════════════════════ */
function bindBookingDetailModal() {
  document.getElementById('bd-close').addEventListener('click', closeBookingDetail);
  document.getElementById('booking-detail-backdrop').addEventListener('click', e => {
    if (e.target === document.getElementById('booking-detail-backdrop')) closeBookingDetail();
  });

  document.querySelectorAll('.modal-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentBdTab = tab.dataset.tab;
      renderBdTab();
    });
  });

  document.getElementById('bd-save-btn').addEventListener('click', saveBdChanges);
  document.getElementById('bd-cancel-booking-btn').addEventListener('click', () => {
    showConfirm('Cancel Booking', 'This will mark the booking as cancelled. Are you sure?', () => {
      const b = DB.get(currentBookingId);
      if (!b) return;
      DB.updateBooking(currentBookingId, { status: 'cancelled' });
      showToast('Booking cancelled', 'warn');
      closeBookingDetail();
      loadPage(currentPage);
    });
  });

  document.getElementById('bd-wa-btn').addEventListener('click', () => {
    const b = DB.get ? DB.get(currentBookingId) : null;
    if (!b) return;
    const phone = (b.customerPhone||'').replace(/\D/g,'');
    window.open(`https://wa.me/${phone}`, '_blank');
  });

  document.getElementById('bd-receipt-btn').addEventListener('click', () => {
    window.open(`receipt.html?id=${currentBookingId}`, '_blank');
  });
}

function openBookingDetail(id) {
  currentBookingId = id;
  currentBdTab = 'overview';
  const b = DB.get ? DB.get(id) : null;
  if (!b) return;

  document.getElementById('bd-modal-title').textContent = b.customerName || 'Booking Detail';
  document.getElementById('bd-booking-id').textContent = b.id;
  document.getElementById('bd-status-pill').outerHTML = `<span class="status-pill pill-${b.status||'new-request'}" id="bd-status-pill">${(b.status||'').replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</span>`;

  // Populate footer selects
  const statuses = ['new-request','awaiting-availability','awaiting-payment','confirmed','advance-paid','fully-paid','in-session','completed','cancelled','rescheduled'];
  const payStatuses = ['not-paid','advance-paid','fully-paid','refund-pending','refunded'];
  const deliveryStatuses = ['not-started','editing','review','delivered'];

  document.getElementById('bd-status-select').innerHTML = statuses.map(s=>`<option value="${s}" ${b.status===s?'selected':''}>${s.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>`).join('');
  document.getElementById('bd-payment-select').innerHTML = payStatuses.map(s=>`<option value="${s}" ${b.paymentStatus===s?'selected':''}>${s.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>`).join('');
  document.getElementById('bd-delivery-select').innerHTML = deliveryStatuses.map(s=>`<option value="${s}" ${b.deliveryStatus===s?'selected':''}>${s.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>`).join('');

  document.querySelectorAll('.modal-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'overview'));
  renderBdTab();
  document.getElementById('booking-detail-backdrop').style.display = 'flex';
}

function closeBookingDetail() {
  document.getElementById('booking-detail-backdrop').style.display = 'none';
  currentBookingId = null;
}

function saveBdChanges() {
  if (!currentBookingId) return;
  const status = document.getElementById('bd-status-select').value;
  const paymentStatus = document.getElementById('bd-payment-select').value;
  const deliveryStatus = document.getElementById('bd-delivery-select').value;
  DB.updateBooking(currentBookingId, { status, paymentStatus, deliveryStatus });
  showToast('Booking updated', 'success');
  // refresh pill
  const b = DB.get(currentBookingId);
  const pill = document.getElementById('bd-status-pill');
  if (pill && b) { pill.className = `status-pill pill-${b.status}`; pill.textContent = b.status.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase()); }
  updateNavBadge();
}

function renderBdTab() {
  const b = DB.get ? DB.get(currentBookingId) : null;
  if (!b) return;
  const el = document.getElementById('bd-tab-body');
  switch(currentBdTab) {
    case 'overview':     el.innerHTML = renderBdOverview(b); break;
    case 'lineitems':    el.innerHTML = renderBdLineItems(b); bindBdLineItemEvents(); break;
    case 'notes':        el.innerHTML = renderBdNotes(b); bindBdNoteEvents(); break;
    case 'deliverables': el.innerHTML = renderBdDeliverables(b); bindBdDriveEvents(); break;
    case 'qrcomms':      el.innerHTML = renderBdQrComms(b); setTimeout(()=>renderQR(b), 50); break;
  }
}

function renderBdOverview(b) {
  const addons = (b.selectedAddons||[]).map(a => `<div class="bd-row"><span class="bd-row-label">${a.name}</span><span class="bd-row-value">${fmt(a.total||a.price)}</span></div>`).join('');
  return `
  <div class="bd-grid">
    <div class="bd-section">
      <div class="bd-section-title">Customer</div>
      <div class="bd-row"><span class="bd-row-label">Name</span><span class="bd-row-value">${b.customerName||'—'}</span></div>
      <div class="bd-row"><span class="bd-row-label">Phone</span><span class="bd-row-value">${b.customerPhone||'—'}</span></div>
      <div class="bd-row"><span class="bd-row-label">Email</span><span class="bd-row-value">${b.customerEmail||'—'}</span></div>
      <div class="bd-row"><span class="bd-row-label">Guests</span><span class="bd-row-value">${b.guestCount||'—'}</span></div>
      ${b.companyName ? `<div class="bd-row"><span class="bd-row-label">Company</span><span class="bd-row-value">${b.companyName}</span></div>` : ''}
    </div>
    <div class="bd-section">
      <div class="bd-section-title">Session</div>
      <div class="bd-row"><span class="bd-row-label">Date</span><span class="bd-row-value">${fmtDate(b.date)}</span></div>
      <div class="bd-row"><span class="bd-row-label">Time</span><span class="bd-row-value">${fmtTime(b.startHour)} – ${fmtTime(b.endHour)}</span></div>
      <div class="bd-row"><span class="bd-row-label">Duration</span><span class="bd-row-value">${b.endHour && b.startHour ? (b.endHour - b.startHour) + ' hrs' : '—'}</span></div>
      <div class="bd-row"><span class="bd-row-label">Service</span><span class="bd-row-value">${b.serviceName||b.serviceId||'—'}</span></div>
      <div class="bd-row"><span class="bd-row-label">Package</span><span class="bd-row-value">${b.packageName||b.packageId||'—'}</span></div>
    </div>
    <div class="bd-section">
      <div class="bd-section-title">Pricing</div>
      <div class="bd-row"><span class="bd-row-label">Base Amount</span><span class="bd-row-value">${fmt(b.baseAmount)}</span></div>
      ${b.tariffSurcharge ? `<div class="bd-row"><span class="bd-row-label">Tariff Surcharge</span><span class="bd-row-value">${fmt(b.tariffSurcharge)}</span></div>` : ''}
      ${b.addonTotal ? `<div class="bd-row"><span class="bd-row-label">Add-Ons</span><span class="bd-row-value">${fmt(b.addonTotal)}</span></div>` : ''}
      ${addons}
      ${b.couponDiscount ? `<div class="bd-row"><span class="bd-row-label">Coupon (${b.couponCode})</span><span class="bd-row-value text-success">-${fmt(b.couponDiscount)}</span></div>` : ''}
      ${b.customDiscount ? `<div class="bd-row"><span class="bd-row-label">Custom Discount</span><span class="bd-row-value text-success">-${fmt(b.customDiscount)}</span></div>` : ''}
      ${b.gstAmount ? `<div class="bd-row"><span class="bd-row-label">GST (18%)</span><span class="bd-row-value">${fmt(b.gstAmount)}</span></div>` : ''}
      <div class="bd-total-row"><span class="bd-total-label">Total</span><span class="bd-total-value">${fmt(b.totalAmount)}</span></div>
    </div>
    <div class="bd-section">
      <div class="bd-section-title">Payment & Delivery</div>
      <div class="bd-row"><span class="bd-row-label">Payment Status</span><span class="bd-row-value">${payPill(b.paymentStatus)}</span></div>
      <div class="bd-row"><span class="bd-row-label">Payment Ref</span><span class="bd-row-value">${b.paymentRef||'—'}</span></div>
      <div class="bd-row"><span class="bd-row-label">Payment Method</span><span class="bd-row-value">${b.paymentMethod||'—'}</span></div>
      <div class="bd-row"><span class="bd-row-label">Delivery Status</span><span class="bd-row-value">${deliveryPill(b.deliveryStatus)}</span></div>
      <div class="bd-row"><span class="bd-row-label">Advance Due</span><span class="bd-row-value">${fmt(b.advanceAmount)}</span></div>
      <div class="bd-row"><span class="bd-row-label">Balance Due</span><span class="bd-row-value">${fmt((b.totalAmount||0)-(b.advanceAmount||0))}</span></div>
      <div class="bd-row"><span class="bd-row-label">Created</span><span class="bd-row-value">${fmtDate(b.createdAt)}</span></div>
      <div style="margin-top:.75rem">
        <label class="field-label">Payment Reference / Remark</label>
        <div style="display:flex;gap:.4rem;margin-top:.3rem">
          <input class="field-input" id="bd-payref-input" value="${b.paymentRef||''}" placeholder="UPI ref, cheque no, remark…" style="flex:1" />
          <select class="field-input" id="bd-paymethod-input" style="width:120px">
            ${['','UPI','Cash','Bank Transfer','Card','Cheque'].map(m=>`<option value="${m}" ${b.paymentMethod===m?'selected':''}>${m||'Method…'}</option>`).join('')}
          </select>
          <button class="btn-primary btn-sm" onclick="saveBdPaymentRef()">Save</button>
        </div>
      </div>
    </div>
  </div>
  ${b.notes ? `<div style="margin-top:1rem"><div class="bd-section"><div class="bd-section-title">Customer Notes</div><p style="font-size:.875rem;line-height:1.6">${b.notes}</p></div></div>` : ''}`;
}

function saveBdPaymentRef() {
  const ref = document.getElementById('bd-payref-input')?.value || '';
  const method = document.getElementById('bd-paymethod-input')?.value || '';
  DB.updateBooking(currentBookingId, { paymentRef: ref, paymentMethod: method });
  showToast('Payment reference saved', 'success');
}

function renderBdLineItems(b) {
  const items = ADMIN_DB.getLineItems ? ADMIN_DB.getLineItems(b.id) : (b.lineItems||[]);
  const extraTotal = items.reduce((s,i) => s + (i.type==='discount' ? -(i.price||0) : (i.price||0)), 0);
  return `
  <div style="margin-bottom:.75rem;display:flex;justify-content:flex-end">
    <button class="btn-primary btn-sm" id="bd-add-lineitem-btn">+ Add Item</button>
  </div>
  <div class="lineitems-table-wrap">
    <div class="table-wrap">
      <table>
        <thead><tr><th>Item</th><th>Type</th><th>Amount</th><th>Note</th><th></th></tr></thead>
        <tbody>
          ${items.length ? items.map(i=>`
          <tr>
            <td class="td-bold">${i.name}</td>
            <td>${i.type==='discount'?'<span class="text-success">Discount</span>':'<span class="text-gold">Charge</span>'}</td>
            <td class="${i.type==='discount'?'lineitem-discount':'lineitem-charge'}">${i.type==='discount'?'-':''}${fmt(i.price)}</td>
            <td class="td-muted">${i.note||'—'}</td>
            <td><button class="tbl-btn tbl-btn-danger" onclick="removeLineItem('${b.id}','${i.id}')">Remove</button></td>
          </tr>`).join('') : `<tr><td colspan="5"><div class="empty-state" style="padding:1.5rem"><p>No extra line items</p></div></td></tr>`}
        </tbody>
      </table>
    </div>
  </div>
  <div class="lineitem-total-bar">
    <span class="lineitem-total-label">Extra Items Total</span>
    <span class="lineitem-total-value ${extraTotal<0?'text-success':''}">${extraTotal<0?'-':''}${fmt(Math.abs(extraTotal))}</span>
  </div>`;
}

function bindBdLineItemEvents() {
  document.getElementById('bd-add-lineitem-btn')?.addEventListener('click', () => {
    document.getElementById('li-name').value = '';
    document.getElementById('li-price').value = '';
    document.getElementById('li-note').value = '';
    document.getElementById('lineitem-modal-backdrop').style.display = 'flex';
  });
  document.getElementById('lineitem-modal-save')?.addEventListener('click', () => {
    const name = document.getElementById('li-name').value.trim();
    const price = parseFloat(document.getElementById('li-price').value) || 0;
    const type = document.getElementById('li-type').value;
    const note = document.getElementById('li-note').value.trim();
    if (!name || !price) return showToast('Name and amount required', 'error');
    ADMIN_DB.addLineItem(currentBookingId, { name, price, type, note });
    document.getElementById('lineitem-modal-backdrop').style.display = 'none';
    renderBdTab();
    showToast('Item added', 'success');
  });
}

function removeLineItem(bookingId, itemId) {
  ADMIN_DB.removeLineItem(bookingId, itemId);
  renderBdTab();
  showToast('Item removed', 'warn');
}

function renderBdNotes(b) {
  const notes = ADMIN_DB.getNotes ? ADMIN_DB.getNotes(b.id) : [];
  const typeIcon = { note:'💬', 'status-change':'🔄', payment:'💰', delivery:'📦', system:'⚙️' };
  return `
  <div class="notes-add-form">
    <textarea id="bd-note-text" placeholder="Add an internal note…" rows="2"></textarea>
    <button class="btn-primary" id="bd-add-note-btn" style="align-self:flex-end">Add Note</button>
  </div>
  <div class="notes-feed">
    ${notes.length ? [...notes].reverse().map(n=>`
    <div class="note-item">
      <div class="note-dot note-dot-${n.type||'note'}">${typeIcon[n.type]||'💬'}</div>
      <div class="note-content">
        <div class="note-text">${n.text}</div>
        <div class="note-meta">
          <span>${fmtDate(n.createdAt)} ${n.createdAt ? new Date(n.createdAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) : ''}</span>
          <span class="note-type-label">${n.type||'note'}</span>
          ${n.author ? `<span>by ${n.author}</span>` : ''}
        </div>
      </div>
    </div>`).join('') : `<div class="empty-state" style="padding:2rem"><div class="empty-state-icon">📝</div><p class="empty-state-title">No notes yet</p><p>Add a note above to start tracking activity.</p></div>`}
  </div>`;
}

function bindBdNoteEvents() {
  document.getElementById('bd-add-note-btn')?.addEventListener('click', () => {
    const text = document.getElementById('bd-note-text')?.value.trim();
    if (!text) return;
    ADMIN_DB.addNote(currentBookingId, text, 'note', currentUser?.name || 'Admin');
    document.getElementById('bd-note-text').value = '';
    renderBdTab();
    showToast('Note added', 'success');
  });
}

function renderBdDeliverables(b) {
  const links = ADMIN_DB.getDriveLinks ? ADMIN_DB.getDriveLinks(b.id) : [];
  const typeIcon = { 'raw-footage':'🎬','edited':'✂️','photos':'📷','other':'🔗' };
  const ds = b.deliveryStatus || 'not-started';
  const steps = ['not-started','editing','review','delivered'];
  const si = steps.indexOf(ds);
  return `
  <div class="delivery-tracker">
    ${steps.map((s,i)=>`<div class="delivery-step ${i<si?'done':i===si?'active':''}">${s.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</div>`).join('')}
  </div>
  <div style="display:flex;justify-content:flex-end;margin-bottom:.75rem">
    <button class="btn-primary btn-sm" id="bd-add-drive-btn">+ Add Drive Link</button>
  </div>
  <div class="drive-grid">
    ${links.length ? links.map(l=>`
    <div class="drive-card">
      <div class="drive-icon">${typeIcon[l.type]||'🔗'}</div>
      <div class="drive-info">
        <div class="drive-label">${l.label}</div>
        <div class="drive-url">${l.url}</div>
      </div>
      <span class="drive-type-badge">${(l.type||'other').replace(/-/g,' ')}</span>
      <a href="${l.url}" target="_blank" class="tbl-btn tbl-btn-primary">Open</a>
      <button class="tbl-btn tbl-btn-danger" onclick="removeDriveLink('${b.id}','${l.id}')">✕</button>
    </div>`).join('') : `<div class="empty-state" style="padding:2rem"><div class="empty-state-icon">📁</div><p class="empty-state-title">No links yet</p><p>Add Google Drive or delivery links above.</p></div>`}
  </div>`;
}

function bindBdDriveEvents() {
  document.getElementById('bd-add-drive-btn')?.addEventListener('click', () => {
    document.getElementById('df-label').value = '';
    document.getElementById('df-url').value = '';
    document.getElementById('df-type').value = 'raw-footage';
    document.getElementById('drive-modal-backdrop').style.display = 'flex';
  });
  document.getElementById('drive-modal-save')?.addEventListener('click', () => {
    const label = document.getElementById('df-label').value.trim();
    const url   = document.getElementById('df-url').value.trim();
    const type  = document.getElementById('df-type').value;
    if (!label || !url) return showToast('Label and URL required', 'error');
    ADMIN_DB.addDriveLink(currentBookingId, label, url, type);
    document.getElementById('drive-modal-backdrop').style.display = 'none';
    renderBdTab();
    showToast('Link added', 'success');
  });
}

function removeDriveLink(bookingId, linkId) {
  ADMIN_DB.removeDriveLink ? ADMIN_DB.removeDriveLink(bookingId, linkId) : null;
  renderBdTab();
  showToast('Link removed', 'warn');
}

function renderBdQrComms(b) {
  const receiptUrl = `${location.origin}${location.pathname.replace('admin.html','receipt.html')}?id=${b.id}`;
  const templates = ADMIN_DB.getTemplates ? ADMIN_DB.getTemplates() : [];
  return `
  <div class="qr-box">
    <div id="qr-canvas"></div>
    <p class="qr-label">Booking Receipt QR</p>
    <a class="qr-link" href="${receiptUrl}" target="_blank">${receiptUrl}</a>
    <div style="display:flex;gap:.5rem;flex-wrap:wrap;justify-content:center;margin-top:.3rem">
      <button class="btn-ghost btn-sm" onclick="navigator.clipboard.writeText('${receiptUrl}').then(()=>showToast('Link copied','success'))">Copy Link</button>
      <a class="btn-primary btn-sm" href="${receiptUrl}" target="_blank">Open Receipt</a>
    </div>
  </div>
  <div class="card-header" style="margin-bottom:.75rem"><span class="card-title">Send via WhatsApp</span></div>
  <div class="wa-templates-grid">
    ${templates.map(t=>`
    <div class="wa-template-card">
      <div class="wa-template-name">${t.name}</div>
      <div class="wa-template-preview">${fillTemplate(t.body, b)}</div>
      <button class="btn-wa btn-sm" onclick="sendWaTemplate('${t.id}','${b.id}')">
        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
        Send WhatsApp
      </button>
    </div>`).join('')}
  </div>`;
}

function renderQR(b) {
  const el = document.getElementById('qr-canvas');
  if (!el || !window.QRCode) return;
  el.innerHTML = '';
  const url = `${location.origin}${location.pathname.replace('admin.html','receipt.html')}?id=${b.id}`;
  new QRCode(el, { text: url, width: 160, height: 160, colorDark: '#0B0F14', colorLight: '#ffffff' });
}

function fillTemplate(body, b) {
  return (body||'')
    .replace(/{name}/g, b.customerName||'')
    .replace(/{bookingId}/g, b.id||'')
    .replace(/{date}/g, fmtDate(b.date))
    .replace(/{time}/g, fmtTime(b.startHour))
    .replace(/{service}/g, b.serviceName||'')
    .replace(/{package}/g, b.packageName||'')
    .replace(/{amount}/g, fmt(b.totalAmount))
    .replace(/{status}/g, b.status||'');
}

function sendWaTemplate(templateId, bookingId) {
  const b = DB.get ? DB.get(bookingId) : null;
  if (!b) return;
  const templates = ADMIN_DB.getTemplates ? ADMIN_DB.getTemplates() : [];
  const t = templates.find(t => t.id === templateId);
  if (!t) return;
  const msg = fillTemplate(t.body, b);
  const phone = (b.customerPhone||'').replace(/\D/g,'');
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
}

/* ══════════════════════════════════════
   CREATE BOOKING
══════════════════════════════════════ */
function renderCreateBooking() {
  const services = ADMIN_DB.getServices ? ADMIN_DB.getServices().filter(s=>s.active!==false) : [];
  const customers = ADMIN_DB.getCustomers ? ADMIN_DB.getCustomers() : [];
  return `
  <div class="page-header">
    <div class="page-header-left">
      <h1 class="page-title">Create Booking</h1>
      <p class="page-sub">Add a new booking manually from the admin backend</p>
    </div>
  </div>
  <div class="create-booking-layout">
    <div>
      <div class="card" style="margin-bottom:1rem">
        <div class="card-header"><span class="card-title">Customer</span></div>
        <div class="card-body">
          <div class="form-grid-2">
            <div class="field-group">
              <label class="field-label">Existing Customer</label>
              <select class="field-input" id="cb-customer-select">
                <option value="">— New customer —</option>
                ${customers.map(c=>`<option value="${c.id}" data-name="${c.name}" data-phone="${c.phone||''}" data-email="${c.email||''}">${c.name} ${c.phone?'('+c.phone+')':''}</option>`).join('')}
              </select>
            </div>
            <div></div>
          </div>
          <div id="cb-customer-fields">
            <div class="form-grid-2">
              <div class="field-group"><label class="field-label">Name *</label><input class="field-input" id="cb-name" type="text" placeholder="Full name" required /></div>
              <div class="field-group"><label class="field-label">Phone *</label><input class="field-input" id="cb-phone" type="tel" placeholder="+91 98765 43210" required /></div>
            </div>
            <div class="form-grid-2">
              <div class="field-group"><label class="field-label">Email</label><input class="field-input" id="cb-email" type="email" placeholder="email@example.com" /></div>
              <div class="field-group"><label class="field-label">Guests</label><input class="field-input" id="cb-guests" type="number" min="1" value="2" /></div>
            </div>
            <div class="field-group"><label class="field-label">Company / Brand</label><input class="field-input" id="cb-company" type="text" placeholder="Optional" /></div>
          </div>
        </div>
      </div>
      <div class="card" style="margin-bottom:1rem">
        <div class="card-header"><span class="card-title">Service &amp; Package</span></div>
        <div class="card-body">
          <div class="form-grid-2">
            <div class="field-group">
              <label class="field-label">Service *</label>
              <select class="field-input" id="cb-service">
                <option value="">Select service…</option>
                ${services.map(s=>`<option value="${s.id}">${s.icon||''} ${s.name}</option>`).join('')}
              </select>
            </div>
            <div class="field-group">
              <label class="field-label">Package *</label>
              <select class="field-input" id="cb-package"><option value="">Select service first…</option></select>
            </div>
          </div>
        </div>
      </div>
      <div class="card" style="margin-bottom:1rem">
        <div class="card-header"><span class="card-title">Date &amp; Time</span></div>
        <div class="card-body">
          <div class="form-grid-2">
            <div class="field-group"><label class="field-label">Date *</label><input class="field-input" id="cb-date" type="date" min="${new Date().toISOString().split('T')[0]}" required /></div>
            <div></div>
          </div>
          <div class="form-grid-2">
            <div class="field-group">
              <label class="field-label">Start Time *</label>
              <select class="field-input" id="cb-start-hr">
                ${Array.from({length:19},(_,i)=>i+6).map(h=>`<option value="${h}">${fmtTime(h)}</option>`).join('')}
              </select>
            </div>
            <div class="field-group">
              <label class="field-label">End Time *</label>
              <select class="field-input" id="cb-end-hr">
                ${Array.from({length:18},(_,i)=>i+7).map(h=>`<option value="${h}" ${h===10?'selected':''}>${fmtTime(h)}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>
      </div>
      <div class="card" style="margin-bottom:1rem">
        <div class="card-header"><span class="card-title">Add-Ons</span></div>
        <div class="card-body" id="cb-addons-body">
          <p class="text-muted text-sm">Select a package to see available add-ons.</p>
        </div>
      </div>
      <div class="card" style="margin-bottom:1rem">
        <div class="card-header"><span class="card-title">Discounts &amp; Payment</span></div>
        <div class="card-body">
          <div class="form-grid-2">
            <div class="field-group">
              <label class="field-label">Coupon Code</label>
              <div class="input-addon-wrap">
                <input class="field-input" id="cb-coupon" type="text" placeholder="LAUNCH20" style="text-transform:uppercase" />
                <button type="button" class="input-addon-btn" id="cb-apply-coupon">Apply</button>
              </div>
              <span id="cb-coupon-msg" style="font-size:.78rem;margin-top:.2rem"></span>
            </div>
            <div class="field-group">
              <label class="field-label">Custom Discount (₹)</label>
              <input class="field-input" id="cb-discount" type="number" min="0" step="50" placeholder="0" />
            </div>
          </div>
          <div class="form-grid-2">
            <div class="field-group">
              <label class="field-label">Payment Status</label>
              <select class="field-input" id="cb-pay-status">
                <option value="not-paid">Not Paid</option>
                <option value="advance-paid">Advance Paid</option>
                <option value="fully-paid">Fully Paid</option>
              </select>
            </div>
            <div class="field-group">
              <label class="field-label">Payment Reference</label>
              <input class="field-input" id="cb-pay-ref" type="text" placeholder="UPI ref, cheque no…" />
            </div>
          </div>
          <div class="field-group">
            <label class="field-label">Internal Notes</label>
            <textarea class="field-input" id="cb-notes" rows="2" placeholder="Any notes about this booking…"></textarea>
          </div>
        </div>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:.5rem">
        <button class="btn-ghost" onclick="loadPage('bookings')">Cancel</button>
        <button class="btn-primary" id="cb-submit-btn">Create Booking</button>
      </div>
    </div>
    <div class="price-preview-card">
      <div class="price-preview-title">Price Preview</div>
      <div id="cb-price-lines"><p class="text-muted text-sm">Fill in the form to see pricing.</p></div>
    </div>
  </div>`;
}

function bindCreateBookingEvents() {
  let cbCouponDiscount = 0;
  let cbCouponCode = '';
  const cbState = () => ({
    serviceId: document.getElementById('cb-service')?.value,
    packageId: document.getElementById('cb-package')?.value,
    startHour: parseFloat(document.getElementById('cb-start-hr')?.value)||9,
    endHour: parseFloat(document.getElementById('cb-end-hr')?.value)||11,
    date: document.getElementById('cb-date')?.value || new Date().toISOString().split('T')[0],
    addons: [],
    addonQtys: {},
    couponCode: cbCouponCode,
    customDiscount: parseFloat(document.getElementById('cb-discount')?.value)||0
  });

  const refreshPrice = () => {
    const s = cbState();
    if (!s.serviceId || !s.packageId) return;
    // gather addons
    document.querySelectorAll('.cb-addon-check:checked').forEach(inp => {
      s.addons.push(inp.dataset.id);
      const qty = document.getElementById('cb-qty-'+inp.dataset.id);
      s.addonQtys[inp.dataset.id] = qty ? parseInt(qty.value)||1 : 1;
    });
    try {
      const result = PriceCalc.calculate(s);
      let html = `
        <div class="price-line"><span class="price-line-label">Base</span><span class="price-line-value">${fmt(result.baseAmount)}</span></div>
        ${result.tariffSurcharge ? `<div class="price-line"><span class="price-line-label">Surcharge</span><span class="price-line-value">${fmt(result.tariffSurcharge)}</span></div>` : ''}
        ${result.addonTotal ? `<div class="price-line"><span class="price-line-label">Add-Ons</span><span class="price-line-value">${fmt(result.addonTotal)}</span></div>` : ''}
        ${result.couponDiscount ? `<div class="price-line price-line-discount"><span class="price-line-label">Coupon</span><span class="price-line-value">-${fmt(result.couponDiscount)}</span></div>` : ''}
        ${result.customDiscount ? `<div class="price-line price-line-discount"><span class="price-line-label">Discount</span><span class="price-line-value">-${fmt(result.customDiscount)}</span></div>` : ''}
        ${result.gstAmount ? `<div class="price-line"><span class="price-line-label">GST (18%)</span><span class="price-line-value">${fmt(result.gstAmount)}</span></div>` : ''}
        <div class="price-line price-line-total"><span class="price-line-label">Total</span><span class="price-line-value">${fmt(result.totalAmount)}</span></div>
        <div class="price-line"><span class="price-line-label">Advance Due (50%)</span><span class="price-line-value">${fmt(result.advanceAmount)}</span></div>`;
      document.getElementById('cb-price-lines').innerHTML = html;
    } catch(e) {}
  };

  // service change → load packages
  document.getElementById('cb-service')?.addEventListener('change', () => {
    const sId = document.getElementById('cb-service').value;
    const pkgs = ADMIN_DB.getPackages ? ADMIN_DB.getPackages().filter(p => p.serviceId === sId && p.active !== false) : [];
    const sel = document.getElementById('cb-package');
    sel.innerHTML = `<option value="">Select package…</option>` + pkgs.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
    refreshPrice();
  });

  document.getElementById('cb-package')?.addEventListener('change', () => {
    // Load add-ons
    const addons = ADMIN_DB.getAddons ? ADMIN_DB.getAddons().filter(a=>a.active!==false) : [];
    const body = document.getElementById('cb-addons-body');
    if (!addons.length) { body.innerHTML = '<p class="text-muted text-sm">No add-ons configured.</p>'; return; }
    body.innerHTML = addons.map(a=>`
      <div class="settings-row" style="padding:.6rem 0">
        <div style="display:flex;align-items:center;gap:.6rem">
          <input type="checkbox" class="cb-addon-check" id="cb-a-${a.id}" data-id="${a.id}" style="accent-color:var(--gold);width:15px;height:15px" />
          <label for="cb-a-${a.id}" style="cursor:pointer">${a.icon||''} ${a.name} <span class="text-muted text-sm">${fmt(a.price)}/${a.unit||'flat'}</span></label>
        </div>
        <input type="number" class="payment-ref-input" id="cb-qty-${a.id}" value="1" min="1" max="${a.maxQty||5}" style="width:60px" />
      </div>`).join('');
    body.querySelectorAll('.cb-addon-check,.payment-ref-input').forEach(el => el.addEventListener('change', refreshPrice));
    refreshPrice();
  });

  document.getElementById('cb-start-hr')?.addEventListener('change', refreshPrice);
  document.getElementById('cb-end-hr')?.addEventListener('change', refreshPrice);
  document.getElementById('cb-date')?.addEventListener('change', refreshPrice);
  document.getElementById('cb-discount')?.addEventListener('input', refreshPrice);

  document.getElementById('cb-apply-coupon')?.addEventListener('click', () => {
    const code = document.getElementById('cb-coupon').value.trim().toUpperCase();
    const s = cbState();
    const res = ADMIN_DB.validateCoupon ? ADMIN_DB.validateCoupon(code, 1000, s.serviceId) : { valid: false, error: 'Not supported' };
    const msg = document.getElementById('cb-coupon-msg');
    if (res.valid) {
      cbCouponCode = code;
      cbCouponDiscount = res.discount;
      msg.style.color = 'var(--success)';
      msg.textContent = `✓ Coupon applied — saving ${fmt(res.discount)}`;
      refreshPrice();
    } else {
      cbCouponCode = '';
      msg.style.color = 'var(--danger)';
      msg.textContent = res.error || 'Invalid coupon';
    }
  });

  document.getElementById('cb-customer-select')?.addEventListener('change', function() {
    const opt = this.options[this.selectedIndex];
    if (opt.value) {
      document.getElementById('cb-name').value = opt.dataset.name || '';
      document.getElementById('cb-phone').value = opt.dataset.phone || '';
      document.getElementById('cb-email').value = opt.dataset.email || '';
    }
  });

  document.getElementById('cb-submit-btn')?.addEventListener('click', () => {
    const name  = document.getElementById('cb-name').value.trim();
    const phone = document.getElementById('cb-phone').value.trim();
    const sId   = document.getElementById('cb-service').value;
    const pId   = document.getElementById('cb-package').value;
    const date  = document.getElementById('cb-date').value;
    const startHour = parseFloat(document.getElementById('cb-start-hr').value);
    const endHour   = parseFloat(document.getElementById('cb-end-hr').value);

    if (!name || !phone || !sId || !pId || !date) return showToast('Please fill all required fields', 'error');
    if (endHour <= startHour) return showToast('End time must be after start time', 'error');

    const s = cbState();
    s.couponCode = cbCouponCode;
    const addons = [];
    const addonQtys = {};
    document.querySelectorAll('.cb-addon-check:checked').forEach(inp => {
      addons.push(inp.dataset.id);
      const qty = document.getElementById('cb-qty-'+inp.dataset.id);
      addonQtys[inp.dataset.id] = qty ? parseInt(qty.value)||1 : 1;
    });
    s.addons = addons;
    s.addonQtys = addonQtys;

    let price = {};
    try { price = PriceCalc.calculate(s); } catch(e) { price = {}; }

    const services = ADMIN_DB.getServices ? ADMIN_DB.getServices() : [];
    const packages = ADMIN_DB.getPackages ? ADMIN_DB.getPackages() : [];
    const svc = services.find(sv=>sv.id===sId);
    const pkg = packages.find(pk=>pk.id===pId);

    const booking = {
      customerName: name,
      customerPhone: phone,
      customerEmail: document.getElementById('cb-email').value.trim(),
      companyName: document.getElementById('cb-company').value.trim(),
      guestCount: parseInt(document.getElementById('cb-guests').value)||1,
      serviceId: sId,
      serviceName: svc?.name || sId,
      packageId: pId,
      packageName: pkg?.name || pId,
      date, startHour, endHour,
      selectedAddons: (ADMIN_DB.getAddons?.() || []).filter(a=>addons.includes(a.id)).map(a=>({...a, qty: addonQtys[a.id]||1, total: a.price*(addonQtys[a.id]||1)})),
      couponCode: cbCouponCode,
      couponDiscount: price.couponDiscount || 0,
      customDiscount: price.customDiscount || 0,
      baseAmount: price.baseAmount || 0,
      tariffSurcharge: price.tariffSurcharge || 0,
      addonTotal: price.addonTotal || 0,
      gstAmount: price.gstAmount || 0,
      totalAmount: price.totalAmount || 0,
      advanceAmount: price.advanceAmount || 0,
      paymentStatus: document.getElementById('cb-pay-status').value,
      paymentRef: document.getElementById('cb-pay-ref').value.trim(),
      deliveryStatus: 'not-started',
      status: 'confirmed',
      notes: document.getElementById('cb-notes').value.trim(),
      createdBy: currentUser?.name || 'Admin'
    };

    if (cbCouponCode) ADMIN_DB.markCouponUsed?.(cbCouponCode);

    const saved = DB.saveBooking(booking);
    ADMIN_DB.addNote(saved.id, `Booking created by admin (${currentUser?.name||'Admin'})`, 'system', currentUser?.name||'Admin');
    showToast(`Booking ${saved.id} created!`, 'success');
    updateNavBadge();
    setTimeout(() => openBookingDetail(saved.id), 300);
    loadPage('bookings');
  });
}

/* ══════════════════════════════════════
   CALENDAR
══════════════════════════════════════ */
function renderCalendarPage() {
  const y = adminCalDate.getFullYear();
  const m = adminCalDate.getMonth();
  const monthLabel = adminCalDate.toLocaleDateString('en-IN',{month:'long',year:'numeric'});
  const firstDay = new Date(y,m,1).getDay();
  const daysInMonth = new Date(y,m+1,0).getDate();
  const bookings = DB.getAll ? DB.getAll() : [];
  const blocked = DB.getBlockedSlots ? DB.getBlockedSlots() : [];
  const today = new Date();

  const cells = [];
  // pad start
  for (let i=0; i<firstDay; i++) cells.push({ day: new Date(y,m,0-firstDay+i+1).getDate(), other: true });
  for (let d=1; d<=daysInMonth; d++) cells.push({ day: d, date: new Date(y,m,d) });
  while (cells.length % 7) cells.push({ day: cells.length - daysInMonth - firstDay + 1, other: true });

  const eventsForDate = (date) => {
    if (!date) return [];
    const ds = date.toISOString().split('T')[0];
    return bookings.filter(b => b.date === ds && !['cancelled'].includes(b.status));
  };
  const isBlocked = (date) => {
    if (!date) return false;
    const ds = date.toISOString().split('T')[0];
    return blocked.some(b => b.date === ds);
  };

  return `
  <div class="page-header">
    <div class="page-header-left">
      <h1 class="page-title">Studio Calendar</h1>
    </div>
    <div class="page-header-right">
      <button class="btn-ghost btn-sm" id="cal-block-btn">+ Block Slot</button>
    </div>
  </div>
  <div class="calendar-header">
    <div class="calendar-nav">
      <button class="calendar-nav-btn" id="cal-prev">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <div class="calendar-month">${monthLabel}</div>
      <button class="calendar-nav-btn" id="cal-next">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>
    <button class="btn-ghost btn-sm" id="cal-today-btn">Today</button>
  </div>
  <div class="calendar-grid">
    ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>`<div class="cal-dow">${d}</div>`).join('')}
    ${cells.map(cell => {
      if (cell.other) return `<div class="cal-day other-month"><div class="cal-day-num">${cell.day}</div></div>`;
      const evs = eventsForDate(cell.date);
      const blocked2 = isBlocked(cell.date);
      const isToday = cell.date.toDateString() === today.toDateString();
      const ds = cell.date.toISOString().split('T')[0];
      return `<div class="cal-day ${isToday?'today':''} ${blocked2?'blocked':''} ${evs.length?'has-event':''}" data-date="${ds}">
        <div class="cal-day-num">${cell.day}</div>
        ${evs.slice(0,3).map(e=>`<div class="cal-event cal-event-${['confirmed','advance-paid','fully-paid','completed'].includes(e.status)?'confirmed':['cancelled'].includes(e.status)?'blocked':'pending'}" onclick="event.stopPropagation();openBookingDetail('${e.id}')">${e.customerName||e.id}</div>`).join('')}
        ${evs.length>3?`<div class="cal-event" style="color:var(--muted)">+${evs.length-3} more</div>`:''}
        ${blocked2?`<div class="cal-event cal-event-blocked">Blocked</div>`:''}
      </div>`;
    }).join('')}
  </div>`;
}

function bindCalendarEvents() {
  document.getElementById('cal-prev')?.addEventListener('click', () => { adminCalDate.setMonth(adminCalDate.getMonth()-1); loadPage('calendar'); });
  document.getElementById('cal-next')?.addEventListener('click', () => { adminCalDate.setMonth(adminCalDate.getMonth()+1); loadPage('calendar'); });
  document.getElementById('cal-today-btn')?.addEventListener('click', () => { adminCalDate = new Date(); loadPage('calendar'); });
  document.getElementById('cal-block-btn')?.addEventListener('click', () => {
    document.getElementById('bs-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('bs-start').value = '09:00';
    document.getElementById('bs-end').value = '18:00';
    document.getElementById('bs-reason').value = '';
    document.getElementById('block-slot-backdrop').style.display = 'flex';
  });
  document.getElementById('block-slot-save')?.addEventListener('click', () => {
    const date = document.getElementById('bs-date').value;
    const start = document.getElementById('bs-start').value;
    const end = document.getElementById('bs-end').value;
    const reason = document.getElementById('bs-reason').value;
    if (!date || !start || !end) return showToast('Fill all fields', 'error');
    const slots = DB.getBlockedSlots ? DB.getBlockedSlots() : [];
    slots.push({ id: uid(), date, start, end, reason });
    localStorage.setItem('lhs_blocked_slots', JSON.stringify(slots));
    document.getElementById('block-slot-backdrop').style.display = 'none';
    showToast('Slot blocked', 'success');
    loadPage('calendar');
  });
}

/* ══════════════════════════════════════
   CUSTOMERS
══════════════════════════════════════ */
function renderCustomers() {
  const customers = ADMIN_DB.getCustomers ? ADMIN_DB.getCustomers() : [];
  const all = DB.getAll ? DB.getAll() : [];
  const enriched = customers.map(c => ({
    ...c,
    bookingCount: all.filter(b => b.customerPhone === c.phone || b.customerEmail === c.email).length,
    totalSpent: all.filter(b => (b.customerPhone===c.phone||b.customerEmail===c.email)&&b.paymentStatus==='fully-paid').reduce((s,b)=>s+(b.totalAmount||0),0)
  }));
  return `
  <div class="page-header">
    <div class="page-header-left">
      <h1 class="page-title">Customer List</h1>
      <p class="page-sub">${customers.length} customers</p>
    </div>
    <div class="page-header-right">
      <button class="btn-primary" id="open-add-customer-btn">+ Add Customer</button>
    </div>
  </div>
  <div class="filter-bar">
    <input class="filter-search" id="cust-search" placeholder="Search name, phone, email…" />
    <select class="filter-select" id="cust-type">
      <option value="">All Types</option>
      <option value="individual">Individual</option>
      <option value="business">Business</option>
      <option value="agency">Agency</option>
      <option value="vip">VIP</option>
    </select>
  </div>
  <div class="customer-grid" id="customer-grid">
    ${enriched.length ? enriched.map(c => renderCustomerCard(c)).join('') : `<div class="empty-state"><div class="empty-state-icon">👥</div><p class="empty-state-title">No customers yet</p><p>Add a customer above.</p></div>`}
  </div>`;
}

function renderCustomerCard(c) {
  const typeClass = { individual:'badge-individual', business:'badge-business', agency:'badge-agency', vip:'badge-vip' };
  return `
  <div class="customer-card">
    <div class="customer-card-header">
      <div class="customer-avatar">${(c.name||'?')[0].toUpperCase()}</div>
      <div style="flex:1;min-width:0">
        <div class="customer-name">${c.name}</div>
        <div class="customer-meta">${c.phone||''} ${c.email?'· '+c.email:''}</div>
        ${c.company?`<div class="customer-meta">${c.company}</div>`:''}
      </div>
      <span class="customer-type-badge ${typeClass[c.type]||'badge-individual'}">${c.type||'individual'}</span>
    </div>
    <div class="customer-stats">
      <div class="customer-stat"><strong>${c.bookingCount||0}</strong> bookings</div>
      <div class="customer-stat"><strong>${fmt(c.totalSpent||0)}</strong> spent</div>
    </div>
    <div class="customer-card-footer">
      <button class="tbl-btn tbl-btn-ghost" onclick="filterBookingsByCustomer('${c.phone||c.email||''}')">View Bookings</button>
      <div style="display:flex;gap:.4rem">
        <button class="tbl-btn tbl-btn-primary" onclick="openEditCustomer('${c.id}')">Edit</button>
        <button class="tbl-btn tbl-btn-danger" onclick="deleteCustomer('${c.id}')">Delete</button>
      </div>
    </div>
  </div>`;
}

function bindCustomersEvents() {
  document.getElementById('open-add-customer-btn')?.addEventListener('click', () => openCustomerModal());
  document.getElementById('customer-modal-save')?.addEventListener('click', saveCustomer);
  let debounce;
  document.getElementById('cust-search')?.addEventListener('input', function() {
    clearTimeout(debounce);
    debounce = setTimeout(() => filterCustomers(), 250);
  });
  document.getElementById('cust-type')?.addEventListener('change', filterCustomers);
}

function filterCustomers() {
  const q = (document.getElementById('cust-search')?.value||'').toLowerCase();
  const type = document.getElementById('cust-type')?.value||'';
  let customers = ADMIN_DB.getCustomers ? ADMIN_DB.getCustomers() : [];
  const all = DB.getAll ? DB.getAll() : [];
  if (q) customers = customers.filter(c=>(c.name+c.phone+c.email).toLowerCase().includes(q));
  if (type) customers = customers.filter(c=>c.type===type);
  const enriched = customers.map(c=>({...c, bookingCount: all.filter(b=>b.customerPhone===c.phone).length, totalSpent: all.filter(b=>b.customerPhone===c.phone&&b.paymentStatus==='fully-paid').reduce((s,b)=>s+(b.totalAmount||0),0)}));
  document.getElementById('customer-grid').innerHTML = enriched.length ? enriched.map(renderCustomerCard).join('') : '<div class="empty-state"><p>No customers found</p></div>';
}

function openCustomerModal(c=null) {
  document.getElementById('customer-modal-title').textContent = c ? 'Edit Customer' : 'Add Customer';
  document.getElementById('cf-id').value = c?.id || '';
  document.getElementById('cf-name').value = c?.name || '';
  document.getElementById('cf-email').value = c?.email || '';
  document.getElementById('cf-phone').value = c?.phone || '';
  document.getElementById('cf-type').value = c?.type || 'individual';
  document.getElementById('cf-company').value = c?.company || '';
  document.getElementById('cf-notes').value = c?.notes || '';
  document.getElementById('customer-modal-backdrop').style.display = 'flex';
}

function openEditCustomer(id) {
  const customers = ADMIN_DB.getCustomers ? ADMIN_DB.getCustomers() : [];
  const c = customers.find(c=>c.id===id);
  if (c) openCustomerModal(c);
}

function saveCustomer() {
  const name = document.getElementById('cf-name').value.trim();
  const phone = document.getElementById('cf-phone').value.trim();
  if (!name || !phone) return showToast('Name and phone required', 'error');
  const data = {
    id: document.getElementById('cf-id').value || uid(),
    name, phone,
    email: document.getElementById('cf-email').value.trim(),
    type: document.getElementById('cf-type').value,
    company: document.getElementById('cf-company').value.trim(),
    notes: document.getElementById('cf-notes').value.trim(),
    createdAt: document.getElementById('cf-id').value ? undefined : new Date().toISOString()
  };
  ADMIN_DB.saveCustomer ? ADMIN_DB.saveCustomer(data) : null;
  document.getElementById('customer-modal-backdrop').style.display = 'none';
  showToast('Customer saved', 'success');
  loadPage('customers');
}

function deleteCustomer(id) {
  showConfirm('Delete Customer', 'This will permanently delete the customer record.', () => {
    ADMIN_DB.deleteCustomer ? ADMIN_DB.deleteCustomer(id) : null;
    showToast('Customer deleted', 'warn');
    loadPage('customers');
  });
}

function filterBookingsByCustomer(phone) {
  loadPage('bookings');
  setTimeout(() => {
    const s = document.getElementById('bk-search');
    if (s) { s.value = phone; s.dispatchEvent(new Event('input')); }
  }, 100);
}

/* ══════════════════════════════════════
   PAYMENTS
══════════════════════════════════════ */
function renderPayments() {
  const all = (DB.getAll ? DB.getAll() : []).filter(b=>b.status!=='new-request');
  const revenue = all.filter(b=>b.paymentStatus==='fully-paid').reduce((s,b)=>s+(b.totalAmount||0),0);
  const advance = all.filter(b=>b.paymentStatus==='advance-paid').reduce((s,b)=>s+(b.advanceAmount||0),0);
  const pending = all.filter(b=>b.paymentStatus==='not-paid').reduce((s,b)=>s+(b.totalAmount||0),0);
  return `
  <div class="page-header">
    <div class="page-header-left"><h1 class="page-title">Payments</h1></div>
    <div class="page-header-right"><button class="btn-ghost btn-sm" onclick="exportBookings()">Export CSV</button></div>
  </div>
  <div class="stats-grid" style="grid-template-columns:repeat(3,1fr)">
    <div class="stat-card"><div class="stat-label">Revenue Collected</div><div class="stat-value text-success">${fmt(revenue)}</div></div>
    <div class="stat-card"><div class="stat-label">Advance Received</div><div class="stat-value text-warn">${fmt(advance)}</div></div>
    <div class="stat-card"><div class="stat-label">Pending Collection</div><div class="stat-value text-danger">${fmt(pending)}</div></div>
  </div>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Booking ID</th><th>Client</th><th>Date</th><th>Total</th><th>Payment Status</th><th>Method</th><th>Reference</th><th>Actions</th></tr></thead>
      <tbody>
        ${all.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(b=>`
        <tr>
          <td class="td-mono">${b.id}</td>
          <td class="td-bold">${b.customerName||'—'}</td>
          <td>${fmtDate(b.date)}</td>
          <td class="td-bold">${fmt(b.totalAmount)}</td>
          <td>${payPill(b.paymentStatus)}</td>
          <td class="td-muted">${b.paymentMethod||'—'}</td>
          <td><input class="payment-ref-input" value="${b.paymentRef||''}" placeholder="Add ref…" onblur="savePayRef('${b.id}',this.value)" /></td>
          <td><button class="tbl-btn tbl-btn-primary" onclick="openBookingDetail('${b.id}')">View</button></td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}
function bindPaymentsEvents() {}
function savePayRef(id, val) {
  DB.updateBooking(id, { paymentRef: val });
}

/* ══════════════════════════════════════
   COUPONS
══════════════════════════════════════ */
function renderCoupons() {
  const coupons = ADMIN_DB.getCoupons ? ADMIN_DB.getCoupons() : [];
  return `
  <div class="page-header">
    <div class="page-header-left"><h1 class="page-title">Coupons &amp; Discounts</h1><p class="page-sub">${coupons.length} coupons</p></div>
    <div class="page-header-right"><button class="btn-primary" id="open-add-coupon-btn">+ New Coupon</button></div>
  </div>
  <div class="coupon-grid">
    ${coupons.length ? coupons.map(c=>{
      const isActive = c.active !== false && (!c.expiry || new Date(c.expiry) >= new Date()) && (!c.usageLimit || (c.usageCount||0) < c.usageLimit);
      return `
      <div class="coupon-card ${!isActive?'inactive':''}">
        <div class="coupon-code">${c.code}</div>
        <div class="coupon-value">${c.type==='percent'?c.value+'%':fmt(c.value)} off</div>
        <div class="coupon-meta">
          ${c.minAmount ? `<span>Min booking: ${fmt(c.minAmount)}</span>` : ''}
          ${c.maxDiscount ? `<span>Max discount: ${fmt(c.maxDiscount)}</span>` : ''}
          ${c.expiry ? `<span>Expires: ${fmtDate(c.expiry)}</span>` : '<span>No expiry</span>'}
          ${c.serviceId ? `<span>Service restricted</span>` : '<span>All services</span>'}
          ${c.desc ? `<span class="text-muted">${c.desc}</span>` : ''}
        </div>
        <div class="coupon-footer">
          <span class="coupon-usage">${c.usageCount||0}${c.usageLimit?'/'+c.usageLimit:''} used</span>
          <div style="display:flex;gap:.4rem">
            <button class="tbl-btn tbl-btn-primary" onclick="openEditCoupon('${c.id}')">Edit</button>
            <button class="tbl-btn tbl-btn-ghost" onclick="toggleCoupon('${c.id}')">${c.active===false?'Enable':'Disable'}</button>
            <button class="tbl-btn tbl-btn-danger" onclick="deleteCoupon('${c.id}')">Delete</button>
          </div>
        </div>
      </div>`;
    }).join('') : `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">🏷️</div><p class="empty-state-title">No coupons yet</p><p>Create your first coupon above.</p></div>`}
  </div>`;
}

function bindCouponsEvents() {
  document.getElementById('open-add-coupon-btn')?.addEventListener('click', () => openCouponModal());
  document.getElementById('coupon-modal-save')?.addEventListener('click', saveCoupon);
  document.getElementById('cpf-generate')?.addEventListener('click', () => {
    document.getElementById('cpf-code').value = randCode(8);
  });
  // populate service select
  const svcSel = document.getElementById('cpf-service');
  if (svcSel) {
    const svcs = ADMIN_DB.getServices ? ADMIN_DB.getServices() : [];
    svcSel.innerHTML = `<option value="">All Services</option>` + svcs.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');
  }
}

function openCouponModal(c=null) {
  document.getElementById('coupon-modal-title').textContent = c ? 'Edit Coupon' : 'New Coupon';
  document.getElementById('cpf-id').value = c?.id || '';
  document.getElementById('cpf-code').value = c?.code || '';
  document.getElementById('cpf-type').value = c?.type || 'percent';
  document.getElementById('cpf-value').value = c?.value || '';
  document.getElementById('cpf-max-discount').value = c?.maxDiscount || '';
  document.getElementById('cpf-min-amount').value = c?.minAmount || '';
  document.getElementById('cpf-usage-limit').value = c?.usageLimit || '';
  document.getElementById('cpf-expiry').value = c?.expiry || '';
  document.getElementById('cpf-service').value = c?.serviceId || '';
  document.getElementById('cpf-desc').value = c?.desc || '';
  document.getElementById('cpf-active').checked = c?.active !== false;
  document.getElementById('coupon-modal-backdrop').style.display = 'flex';
}

function openEditCoupon(id) {
  const c = (ADMIN_DB.getCoupons?.() || []).find(c=>c.id===id);
  if (c) openCouponModal(c);
}

function saveCoupon() {
  const code = document.getElementById('cpf-code').value.trim().toUpperCase();
  const value = parseFloat(document.getElementById('cpf-value').value);
  if (!code || !value) return showToast('Code and value required', 'error');
  const data = {
    id: document.getElementById('cpf-id').value || uid(),
    code, type: document.getElementById('cpf-type').value,
    value, maxDiscount: parseFloat(document.getElementById('cpf-max-discount').value)||null,
    minAmount: parseFloat(document.getElementById('cpf-min-amount').value)||0,
    usageLimit: parseInt(document.getElementById('cpf-usage-limit').value)||null,
    expiry: document.getElementById('cpf-expiry').value || null,
    serviceId: document.getElementById('cpf-service').value || null,
    desc: document.getElementById('cpf-desc').value.trim(),
    active: document.getElementById('cpf-active').checked,
    usageCount: 0
  };
  ADMIN_DB.saveCoupon ? ADMIN_DB.saveCoupon(data) : null;
  document.getElementById('coupon-modal-backdrop').style.display = 'none';
  showToast('Coupon saved', 'success');
  loadPage('coupons');
}

function toggleCoupon(id) {
  const c = (ADMIN_DB.getCoupons?.() || []).find(c=>c.id===id);
  if (!c) return;
  ADMIN_DB.saveCoupon?.({ ...c, active: !c.active });
  loadPage('coupons');
}

function deleteCoupon(id) {
  showConfirm('Delete Coupon', 'This cannot be undone.', () => {
    ADMIN_DB.deleteCoupon?.(id);
    showToast('Coupon deleted', 'warn');
    loadPage('coupons');
  });
}

/* ══════════════════════════════════════
   SERVICES
══════════════════════════════════════ */
function renderServices() {
  const svcs = ADMIN_DB.getServices ? ADMIN_DB.getServices() : [];
  return `
  <div class="page-header">
    <div class="page-header-left"><h1 class="page-title">Services</h1><p class="page-sub">Configure what services you offer</p></div>
    <div class="page-header-right"><button class="btn-primary" id="open-add-service-btn">+ New Service</button></div>
  </div>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Icon</th><th>Name</th><th>Description</th><th>Base Rate</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>
        ${svcs.map(s=>`
        <tr>
          <td style="font-size:1.4rem">${s.icon||'🎬'}</td>
          <td class="td-bold">${s.name}</td>
          <td class="td-muted">${s.desc||'—'}</td>
          <td>${s.basePrice ? fmt(s.basePrice)+'/hr' : '—'}</td>
          <td>${s.active!==false?'<span class="active-dot"></span> Active':'<span class="inactive-dot"></span> Inactive'}</td>
          <td class="td-actions">
            <button class="tbl-btn tbl-btn-primary" onclick="openEditService('${s.id}')">Edit</button>
            <button class="tbl-btn tbl-btn-danger" onclick="deleteService('${s.id}')">Delete</button>
          </td>
        </tr>`).join('')}
        ${!svcs.length?`<tr><td colspan="6"><div class="empty-state" style="padding:2rem"><p class="empty-state-title">No services yet</p></div></td></tr>`:''}
      </tbody>
    </table>
  </div>`;
}

function bindServicesEvents() {
  document.getElementById('open-add-service-btn')?.addEventListener('click', () => openServiceModal());
  document.getElementById('service-modal-save')?.addEventListener('click', saveService);
}

function openServiceModal(s=null) {
  document.getElementById('service-modal-title').textContent = s ? 'Edit Service' : 'New Service';
  document.getElementById('sf-id').value = s?.id || '';
  document.getElementById('sf-name').value = s?.name || '';
  document.getElementById('sf-icon').value = s?.icon || '';
  document.getElementById('sf-desc').value = s?.desc || '';
  document.getElementById('sf-base-price').value = s?.basePrice || '';
  document.getElementById('sf-color').value = s?.color || '#D6A84F';
  document.getElementById('sf-active').checked = s?.active !== false;
  document.getElementById('service-modal-backdrop').style.display = 'flex';
}

function openEditService(id) {
  const s = (ADMIN_DB.getServices?.() || []).find(s=>s.id===id);
  if (s) openServiceModal(s);
}

function saveService() {
  const name = document.getElementById('sf-name').value.trim();
  if (!name) return showToast('Name required', 'error');
  const data = {
    id: document.getElementById('sf-id').value || uid(),
    name, icon: document.getElementById('sf-icon').value,
    desc: document.getElementById('sf-desc').value.trim(),
    basePrice: parseFloat(document.getElementById('sf-base-price').value)||0,
    color: document.getElementById('sf-color').value,
    active: document.getElementById('sf-active').checked
  };
  ADMIN_DB.saveService?.(data);
  document.getElementById('service-modal-backdrop').style.display = 'none';
  showToast('Service saved', 'success');
  loadPage('services');
}

function deleteService(id) {
  showConfirm('Delete Service', 'This will also affect packages linked to this service.', () => {
    ADMIN_DB.deleteService?.(id);
    showToast('Service deleted', 'warn');
    loadPage('services');
  });
}

/* ══════════════════════════════════════
   PACKAGES
══════════════════════════════════════ */
function renderPackages() {
  const pkgs = ADMIN_DB.getPackages ? ADMIN_DB.getPackages() : [];
  const svcs = ADMIN_DB.getServices ? ADMIN_DB.getServices() : [];
  const svcName = (id) => svcs.find(s=>s.id===id)?.name || id;
  return `
  <div class="page-header">
    <div class="page-header-left"><h1 class="page-title">Package Builder</h1><p class="page-sub">Configure pricing packages per service</p></div>
    <div class="page-header-right"><button class="btn-primary" id="open-add-pkg-btn">+ New Package</button></div>
  </div>
  <div class="package-grid">
    ${pkgs.map(p=>`
    <div class="package-card ${p.active===false?'inactive':''}">
      <div class="package-card-header">
        <div class="package-card-name">${p.name}</div>
        <span class="package-card-service">${svcName(p.serviceId)}</span>
      </div>
      ${p.desc ? `<p class="text-muted text-sm">${p.desc}</p>` : ''}
      <div class="package-price-row">
        <div class="package-price-item"><div class="package-price-label">1st Hour</div><div class="package-price-value">${fmt(p.firstHourPrice || 0)}</div></div>
        <div class="package-price-item"><div class="package-price-label">Each Extra Hr</div><div class="package-price-value">+${fmt(p.additionalHourPrice || 0)}</div></div>
      </div>
      ${p.includes?.length ? `<div class="package-includes">${p.includes.slice(0,4).map(i=>`<span class="package-include-tag">${i}</span>`).join('')}</div>` : ''}
      <div class="package-card-footer">
        <span class="${p.active!==false?'active-dot':'inactive-dot'}"></span>
        <div style="display:flex;gap:.4rem">
          <button class="tbl-btn tbl-btn-primary" onclick="openEditPackage('${p.id}')">Edit</button>
          <button class="tbl-btn tbl-btn-danger" onclick="deletePackage('${p.id}')">Delete</button>
        </div>
      </div>
    </div>`).join('')}
    ${!pkgs.length?`<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">📦</div><p class="empty-state-title">No packages yet</p><p>Create your first package above.</p></div>`:''}
  </div>`;
}

function bindPackagesEvents() {
  document.getElementById('open-add-pkg-btn')?.addEventListener('click', () => openPackageModal());
  document.getElementById('package-modal-save')?.addEventListener('click', savePackage);
  // populate service select in modal
  const sel = document.getElementById('pf-service');
  if (sel) {
    const svcs = ADMIN_DB.getServices ? ADMIN_DB.getServices() : [];
    sel.innerHTML = svcs.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');
  }
}

function openPackageModal(p=null) {
  document.getElementById('package-modal-title').textContent = p ? 'Edit Package' : 'New Package';
  document.getElementById('pf-id').value = p?.id || '';
  document.getElementById('pf-name').value = p?.name || '';
  document.getElementById('pf-service').value = p?.serviceId || (ADMIN_DB.getServices?.()[0]?.id || '');
  document.getElementById('pf-desc').value = p?.desc || '';
  document.getElementById('pf-price-hr').value = p?.firstHourPrice || '';
  document.getElementById('pf-price-half').value = p?.additionalHourPrice || '';
  document.getElementById('pf-min-hrs').value = p?.minHours || 2;
  document.getElementById('pf-max-guests').value = p?.maxGuests || 10;
  document.getElementById('pf-includes').value = (p?.includes||[]).join(', ');
  document.getElementById('pf-active').checked = p?.active !== false;
  document.getElementById('package-modal-backdrop').style.display = 'flex';
}

function openEditPackage(id) {
  const p = (ADMIN_DB.getPackages?.() || []).find(p=>p.id===id);
  if (p) openPackageModal(p);
}

function savePackage() {
  const name = document.getElementById('pf-name').value.trim();
  if (!name) return showToast('Name required', 'error');
  const data = {
    id: document.getElementById('pf-id').value || uid(),
    name, serviceId: document.getElementById('pf-service').value,
    desc: document.getElementById('pf-desc').value.trim(),
    firstHourPrice: parseFloat(document.getElementById('pf-price-hr').value)||0,
    additionalHourPrice: parseFloat(document.getElementById('pf-price-half').value)||0,
    minHours: parseInt(document.getElementById('pf-min-hrs').value)||2,
    maxGuests: parseInt(document.getElementById('pf-max-guests').value)||10,
    includes: document.getElementById('pf-includes').value.split(',').map(s=>s.trim()).filter(Boolean),
    active: document.getElementById('pf-active').checked
  };
  ADMIN_DB.savePackage?.(data);
  document.getElementById('package-modal-backdrop').style.display = 'none';
  showToast('Package saved', 'success');
  loadPage('packages');
}

function deletePackage(id) {
  showConfirm('Delete Package', 'This cannot be undone.', () => {
    ADMIN_DB.deletePackage?.(id);
    showToast('Package deleted', 'warn');
    loadPage('packages');
  });
}

/* ══════════════════════════════════════
   ADD-ONS
══════════════════════════════════════ */
function renderAddons() {
  const addons = ADMIN_DB.getAddons ? ADMIN_DB.getAddons() : [];
  return `
  <div class="page-header">
    <div class="page-header-left"><h1 class="page-title">Add-Ons</h1><p class="page-sub">Extra services customers can add to their booking</p></div>
    <div class="page-header-right"><button class="btn-primary" id="open-add-addon-btn">+ New Add-On</button></div>
  </div>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Icon</th><th>Name</th><th>Description</th><th>Price</th><th>Unit</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>
        ${addons.map(a=>`
        <tr>
          <td style="font-size:1.2rem">${a.icon||'➕'}</td>
          <td class="td-bold">${a.name}</td>
          <td class="td-muted">${a.desc||'—'}</td>
          <td>${fmt(a.price)}</td>
          <td class="td-muted">${a.unit||'flat'}</td>
          <td>${a.active!==false?'<span class="active-dot"></span> Active':'<span class="inactive-dot"></span> Inactive'}</td>
          <td class="td-actions">
            <button class="tbl-btn tbl-btn-primary" onclick="openEditAddon('${a.id}')">Edit</button>
            <button class="tbl-btn tbl-btn-danger" onclick="deleteAddon('${a.id}')">Delete</button>
          </td>
        </tr>`).join('')}
        ${!addons.length?`<tr><td colspan="7"><div class="empty-state" style="padding:2rem"><p class="empty-state-title">No add-ons yet</p></div></td></tr>`:''}
      </tbody>
    </table>
  </div>`;
}

function bindAddonsEvents() {
  document.getElementById('open-add-addon-btn')?.addEventListener('click', () => openAddonModal());
  document.getElementById('addon-modal-save')?.addEventListener('click', saveAddon);
}

function openAddonModal(a=null) {
  document.getElementById('addon-modal-title').textContent = a ? 'Edit Add-On' : 'New Add-On';
  document.getElementById('af-id').value = a?.id || '';
  document.getElementById('af-name').value = a?.name || '';
  document.getElementById('af-icon').value = a?.icon || '';
  document.getElementById('af-desc').value = a?.desc || '';
  document.getElementById('af-price').value = a?.price || '';
  document.getElementById('af-unit').value = a?.unit || 'flat';
  document.getElementById('af-max-qty').value = a?.maxQty || 5;
  document.getElementById('af-active').checked = a?.active !== false;
  document.getElementById('addon-modal-backdrop').style.display = 'flex';
}

function openEditAddon(id) {
  const a = (ADMIN_DB.getAddons?.() || []).find(a=>a.id===id);
  if (a) openAddonModal(a);
}

function saveAddon() {
  const name = document.getElementById('af-name').value.trim();
  const price = parseFloat(document.getElementById('af-price').value);
  if (!name || !price) return showToast('Name and price required', 'error');
  const data = {
    id: document.getElementById('af-id').value || uid(),
    name, icon: document.getElementById('af-icon').value,
    desc: document.getElementById('af-desc').value,
    price, unit: document.getElementById('af-unit').value,
    maxQty: parseInt(document.getElementById('af-max-qty').value)||5,
    active: document.getElementById('af-active').checked
  };
  ADMIN_DB.saveAddon?.(data);
  document.getElementById('addon-modal-backdrop').style.display = 'none';
  showToast('Add-on saved', 'success');
  loadPage('addons');
}

function deleteAddon(id) {
  showConfirm('Delete Add-On', 'This cannot be undone.', () => {
    ADMIN_DB.deleteAddon?.(id);
    showToast('Add-on deleted', 'warn');
    loadPage('addons');
  });
}

/* ══════════════════════════════════════
   TARIFFS
══════════════════════════════════════ */
function renderTariffs() {
  const tariffs = ADMIN_DB.getTariffs ? ADMIN_DB.getTariffs() : [];
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  return `
  <div class="page-header">
    <div class="page-header-left"><h1 class="page-title">Tariffs</h1><p class="page-sub">Surcharge rules applied on top of base pricing</p></div>
    <div class="page-header-right"><button class="btn-primary" id="open-add-tariff-btn">+ New Rule</button></div>
  </div>
  <div class="tariff-list">
    ${tariffs.map(t=>{
      const conditions = [];
      if (t.startHour!=null && t.endHour!=null) conditions.push(`${fmtTime(t.startHour)} – ${fmtTime(t.endHour)}`);
      if (t.days?.length) conditions.push(t.days.map(d=>dayNames[d]).join(', '));
      if (t.dateFrom && t.dateTo) conditions.push(`${fmtDate(t.dateFrom)} – ${fmtDate(t.dateTo)}`);
      return `
      <div class="tariff-card ${t.active===false?'inactive':''}">
        <div class="tariff-name">${t.name}</div>
        <div class="tariff-amount">${t.type==='percent'?t.amount+'%':fmt(t.amount)}${t.type==='fixed-per-hour'?'/hr':''}</div>
        <div class="tariff-conditions">${conditions.join(' · ') || 'Always applies'}</div>
        <span class="${t.active!==false?'active-dot':'inactive-dot'}"></span>
        <div class="tariff-actions">
          <button class="tbl-btn tbl-btn-primary" onclick="openEditTariff('${t.id}')">Edit</button>
          <button class="tbl-btn tbl-btn-ghost" onclick="toggleTariff('${t.id}')">${t.active===false?'Enable':'Disable'}</button>
          <button class="tbl-btn tbl-btn-danger" onclick="deleteTariff('${t.id}')">Delete</button>
        </div>
      </div>`;
    }).join('')}
    ${!tariffs.length?`<div class="empty-state"><div class="empty-state-icon">⏰</div><p class="empty-state-title">No tariff rules yet</p><p>Add surcharges for after-hours, weekends, or special dates.</p></div>`:''}
  </div>`;
}

function bindTariffsEvents() {
  document.getElementById('open-add-tariff-btn')?.addEventListener('click', () => openTariffModal());
  document.getElementById('tariff-modal-save')?.addEventListener('click', saveTariff);
}

function openTariffModal(t=null) {
  document.getElementById('tariff-modal-title').textContent = t ? 'Edit Tariff Rule' : 'New Tariff Rule';
  document.getElementById('tf-id').value = t?.id || '';
  document.getElementById('tf-name').value = t?.name || '';
  document.getElementById('tf-type').value = t?.type || 'percent';
  document.getElementById('tf-amount').value = t?.amount || '';
  document.getElementById('tf-start-hr').value = t?.startHour ?? '';
  document.getElementById('tf-end-hr').value = t?.endHour ?? '';
  document.getElementById('tf-date-from').value = t?.dateFrom || '';
  document.getElementById('tf-date-to').value = t?.dateTo || '';
  document.getElementById('tf-active').checked = t?.active !== false;
  document.querySelectorAll('[name="tf-day"]').forEach(cb => {
    cb.checked = t?.days?.includes(parseInt(cb.value)) || false;
  });
  document.getElementById('tariff-modal-backdrop').style.display = 'flex';
}

function openEditTariff(id) {
  const t = (ADMIN_DB.getTariffs?.() || []).find(t=>t.id===id);
  if (t) openTariffModal(t);
}

function saveTariff() {
  const name = document.getElementById('tf-name').value.trim();
  const amount = parseFloat(document.getElementById('tf-amount').value);
  if (!name || !amount) return showToast('Name and amount required', 'error');
  const days = [...document.querySelectorAll('[name="tf-day"]:checked')].map(cb=>parseInt(cb.value));
  const data = {
    id: document.getElementById('tf-id').value || uid(),
    name, type: document.getElementById('tf-type').value,
    amount,
    startHour: document.getElementById('tf-start-hr').value !== '' ? parseFloat(document.getElementById('tf-start-hr').value) : null,
    endHour: document.getElementById('tf-end-hr').value !== '' ? parseFloat(document.getElementById('tf-end-hr').value) : null,
    days: days.length ? days : null,
    dateFrom: document.getElementById('tf-date-from').value || null,
    dateTo: document.getElementById('tf-date-to').value || null,
    active: document.getElementById('tf-active').checked
  };
  ADMIN_DB.saveTariff?.(data);
  document.getElementById('tariff-modal-backdrop').style.display = 'none';
  showToast('Tariff rule saved', 'success');
  loadPage('tariffs');
}

function toggleTariff(id) {
  const t = (ADMIN_DB.getTariffs?.() || []).find(t=>t.id===id);
  if (!t) return;
  ADMIN_DB.saveTariff?.({ ...t, active: !t.active });
  loadPage('tariffs');
}

function deleteTariff(id) {
  showConfirm('Delete Tariff Rule', 'This cannot be undone.', () => {
    ADMIN_DB.deleteTariff?.(id);
    showToast('Rule deleted', 'warn');
    loadPage('tariffs');
  });
}

/* ══════════════════════════════════════
   TERMS & CONDITIONS
══════════════════════════════════════ */
let currentTermsKey = null;
function renderTerms() {
  const terms = ADMIN_DB.getTerms ? ADMIN_DB.getTerms() : [];
  const first = terms[0];
  currentTermsKey = first?.id || null;
  return `
  <div class="page-header">
    <div class="page-header-left"><h1 class="page-title">Terms &amp; Conditions</h1><p class="page-sub">Editable terms shown to customers during booking</p></div>
    <div class="page-header-right"><button class="btn-primary" id="terms-save-btn">Save Changes</button></div>
  </div>
  <div class="terms-editor-wrap">
    <div class="terms-list-col">
      ${terms.map(t=>`<button class="terms-item-btn ${t.id===currentTermsKey?'active':''}" data-terms-id="${t.id}">${t.title||t.id}</button>`).join('')}
      <button class="terms-item-btn" id="terms-add-btn">+ Add Section</button>
    </div>
    <div class="terms-editor-col">
      <div class="field-group"><label class="field-label">Section Title</label><input class="field-input" id="terms-title-input" value="${first?.title||''}" /></div>
      <div class="field-group"><label class="field-label">Content</label><textarea id="terms-body-input" rows="18">${first?.body||''}</textarea></div>
    </div>
  </div>`;
}

function bindTermsEvents() {
  document.querySelectorAll('.terms-item-btn[data-terms-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentTermsKey = btn.dataset.termsId;
      document.querySelectorAll('.terms-item-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const t = (ADMIN_DB.getTerms?.() || []).find(t=>t.id===currentTermsKey);
      document.getElementById('terms-title-input').value = t?.title||'';
      document.getElementById('terms-body-input').value = t?.body||'';
    });
  });
  document.getElementById('terms-save-btn')?.addEventListener('click', () => {
    if (!currentTermsKey) return;
    const title = document.getElementById('terms-title-input').value.trim();
    const body  = document.getElementById('terms-body-input').value;
    const terms = ADMIN_DB.getTerms?.() || [];
    const idx = terms.findIndex(t=>t.id===currentTermsKey);
    if (idx>=0) { terms[idx] = { ...terms[idx], title, body }; }
    else { terms.push({ id: currentTermsKey, title, body }); }
    localStorage.setItem('lhs_terms', JSON.stringify(terms));
    showToast('Terms saved', 'success');
  });
  document.getElementById('terms-add-btn')?.addEventListener('click', () => {
    const id = uid();
    const terms = ADMIN_DB.getTerms?.() || [];
    terms.push({ id, title: 'New Section', body: '' });
    localStorage.setItem('lhs_terms', JSON.stringify(terms));
    loadPage('terms');
  });
}

/* ══════════════════════════════════════
   WHATSAPP TEMPLATES
══════════════════════════════════════ */
function renderTemplates() {
  const templates = ADMIN_DB.getTemplates ? ADMIN_DB.getTemplates() : [];
  return `
  <div class="page-header">
    <div class="page-header-left"><h1 class="page-title">WhatsApp Templates</h1><p class="page-sub">Pre-written messages for quick communication</p></div>
  </div>
  <div class="template-page-grid">
    ${templates.map(t=>`
    <div class="template-card">
      <div class="template-card-name">${t.name}</div>
      <div class="template-card-preview">${t.body}</div>
      <div class="template-card-footer">
        <button class="tbl-btn tbl-btn-primary" onclick="openTemplateModal('${t.id}')">Edit</button>
      </div>
    </div>`).join('')}
    ${!templates.length?`<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">💬</div><p class="empty-state-title">No templates yet</p></div>`:''}
  </div>`;
}

function bindTemplatesEvents() {
  document.getElementById('template-modal-save')?.addEventListener('click', saveTemplate);
}

function openTemplateModal(id) {
  const templates = ADMIN_DB.getTemplates?.() || [];
  const t = templates.find(t=>t.id===id);
  if (!t) return;
  document.getElementById('tmf-id').value = t.id;
  document.getElementById('tmf-name').value = t.name;
  document.getElementById('tmf-body').value = t.body;
  document.getElementById('template-modal-backdrop').style.display = 'flex';
}

function saveTemplate() {
  const id = document.getElementById('tmf-id').value;
  const body = document.getElementById('tmf-body').value.trim();
  if (!body) return showToast('Message body required', 'error');
  const templates = ADMIN_DB.getTemplates?.() || [];
  const idx = templates.findIndex(t=>t.id===id);
  if (idx>=0) templates[idx].body = body;
  localStorage.setItem('lhs_templates', JSON.stringify(templates));
  document.getElementById('template-modal-backdrop').style.display = 'none';
  showToast('Template saved', 'success');
  loadPage('templates');
}

/* ══════════════════════════════════════
   USERS & ROLES
══════════════════════════════════════ */
function renderUsers() {
  const users = ADMIN_DB.getUsers ? ADMIN_DB.getUsers() : [];
  return `
  <div class="page-header">
    <div class="page-header-left"><h1 class="page-title">Users &amp; Roles</h1><p class="page-sub">Manage admin access</p></div>
    <div class="page-header-right"><button class="btn-primary" id="open-add-user-btn">+ New User</button></div>
  </div>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>
        ${users.map(u=>`
        <tr>
          <td class="td-bold">${u.name}</td>
          <td class="td-mono">${u.username}</td>
          <td class="td-muted">${u.email||'—'}</td>
          <td><span class="role-badge role-${u.role||'staff'}">${(u.role||'staff').replace(/\b\w/g,c=>c.toUpperCase())}</span></td>
          <td>${u.active!==false?'<span class="active-dot"></span> Active':'<span class="inactive-dot"></span> Inactive'}</td>
          <td class="td-actions">
            <button class="tbl-btn tbl-btn-primary" onclick="openEditUser('${u.id}')">Edit</button>
            <button class="tbl-btn tbl-btn-danger" onclick="deleteUser('${u.id}')">Delete</button>
          </td>
        </tr>`).join('')}
        ${!users.length?`<tr><td colspan="6"><div class="empty-state" style="padding:2rem"><p class="empty-state-title">No users yet</p></div></td></tr>`:''}
      </tbody>
    </table>
  </div>`;
}

function bindUsersEvents() {
  document.getElementById('open-add-user-btn')?.addEventListener('click', () => openUserModal());
  document.getElementById('user-modal-save')?.addEventListener('click', saveUser);
}

function openUserModal(u=null) {
  document.getElementById('user-modal-title').textContent = u ? 'Edit User' : 'New User';
  document.getElementById('uf-id').value = u?.id || '';
  document.getElementById('uf-name').value = u?.name || '';
  document.getElementById('uf-username').value = u?.username || '';
  document.getElementById('uf-password').value = '';
  document.getElementById('uf-role').value = u?.role || 'staff';
  document.getElementById('uf-email').value = u?.email || '';
  document.getElementById('uf-active').checked = u?.active !== false;
  document.getElementById('user-modal-backdrop').style.display = 'flex';
}

function openEditUser(id) {
  const u = (ADMIN_DB.getUsers?.() || []).find(u=>u.id===id);
  if (u) openUserModal(u);
}

function saveUser() {
  const name = document.getElementById('uf-name').value.trim();
  const username = document.getElementById('uf-username').value.trim();
  const password = document.getElementById('uf-password').value;
  const existingId = document.getElementById('uf-id').value;
  if (!name || !username) return showToast('Name and username required', 'error');
  if (!existingId && !password) return showToast('Password required for new user', 'error');
  const existing = existingId ? (ADMIN_DB.getUsers?.() || []).find(u=>u.id===existingId) : null;
  const data = {
    id: existingId || uid(),
    name, username,
    password: password || existing?.password || '',
    role: document.getElementById('uf-role').value,
    email: document.getElementById('uf-email').value.trim(),
    active: document.getElementById('uf-active').checked
  };
  ADMIN_DB.saveUser?.(data);
  document.getElementById('user-modal-backdrop').style.display = 'none';
  showToast('User saved', 'success');
  loadPage('users');
}

function deleteUser(id) {
  showConfirm('Delete User', 'This will remove admin access for this user.', () => {
    ADMIN_DB.deleteUser?.(id);
    showToast('User deleted', 'warn');
    loadPage('users');
  });
}

/* ══════════════════════════════════════
   REPORTS
══════════════════════════════════════ */
function renderReports() {
  const all = DB.getAll ? DB.getAll() : [];
  const months = {};
  all.forEach(b => {
    const d = new Date(b.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    if (!months[key]) months[key] = { count: 0, revenue: 0 };
    months[key].count++;
    if (b.paymentStatus === 'fully-paid') months[key].revenue += b.totalAmount||0;
  });
  const sortedMonths = Object.entries(months).sort((a,b)=>a[0].localeCompare(b[0])).slice(-12);
  const maxRev = Math.max(...sortedMonths.map(m=>m[1].revenue), 1);
  const byService = {};
  all.forEach(b => {
    const s = b.serviceName||b.serviceId||'Unknown';
    if (!byService[s]) byService[s] = 0;
    byService[s]++;
  });
  const statusCounts = {};
  all.forEach(b => { statusCounts[b.status] = (statusCounts[b.status]||0) + 1; });
  return `
  <div class="page-header">
    <div class="page-header-left"><h1 class="page-title">Reports</h1></div>
    <div class="page-header-right"><button class="btn-ghost btn-sm" onclick="exportBookings()">Export CSV</button></div>
  </div>
  <div class="stats-grid">
    <div class="stat-card"><div class="stat-label">Total Bookings</div><div class="stat-value">${all.length}</div></div>
    <div class="stat-card"><div class="stat-label">Completed</div><div class="stat-value text-success">${all.filter(b=>b.status==='completed').length}</div></div>
    <div class="stat-card"><div class="stat-label">Cancelled</div><div class="stat-value text-danger">${all.filter(b=>b.status==='cancelled').length}</div></div>
    <div class="stat-card"><div class="stat-label">Total Revenue</div><div class="stat-value">${fmt(all.filter(b=>b.paymentStatus==='fully-paid').reduce((s,b)=>s+(b.totalAmount||0),0))}</div></div>
  </div>
  <div class="report-grid">
    <div class="card" style="grid-column:1/-1">
      <div class="card-header"><span class="card-title">Monthly Revenue (Last 12 months)</span></div>
      <div class="card-body">
        <div class="mini-chart-bar">
          ${sortedMonths.map(([key, data])=>`
          <div class="chart-bar" style="height:${Math.max(4,(data.revenue/maxRev)*100)}%" title="${key}: ${fmt(data.revenue)}">
            <div class="chart-bar-label">${key.slice(5)}</div>
          </div>`).join('')}
          ${!sortedMonths.length?'<p class="text-muted text-sm">No data yet.</p>':''}
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">Bookings by Service</span></div>
      <div class="card-body">
        ${Object.entries(byService).sort((a,b)=>b[1]-a[1]).map(([s,n])=>`
        <div class="settings-row">
          <span class="settings-row-label">${s}</span>
          <span class="settings-row-value">${n}</span>
        </div>`).join('')}
        ${!Object.keys(byService).length?'<p class="text-muted text-sm">No data yet.</p>':''}
      </div>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">Bookings by Status</span></div>
      <div class="card-body">
        ${Object.entries(statusCounts).sort((a,b)=>b[1]-a[1]).map(([s,n])=>`
        <div class="settings-row">
          <span class="settings-row-label">${statusPill(s)}</span>
          <span class="settings-row-value">${n}</span>
        </div>`).join('')}
        ${!Object.keys(statusCounts).length?'<p class="text-muted text-sm">No data yet.</p>':''}
      </div>
    </div>
  </div>`;
}

/* ══════════════════════════════════════
   SETTINGS
══════════════════════════════════════ */
function renderSettings() {
  const cfg = STUDIO_CONFIG || {};
  return `
  <div class="page-header">
    <div class="page-header-left"><h1 class="page-title">Settings</h1><p class="page-sub">Studio configuration &amp; preferences</p></div>
    <div class="page-header-right"><button class="btn-primary" id="settings-save-btn">Save Settings</button></div>
  </div>
  <div class="settings-grid">
    <div class="settings-section">
      <div class="settings-section-header"><div class="settings-section-title">Studio Info</div></div>
      <div class="settings-section-body">
        <div class="field-group"><label class="field-label">Studio Name</label><input class="field-input" id="s-studio-name" value="${cfg.studioName||'Lighthouse Studios'}" /></div>
        <div class="field-group"><label class="field-label">Tagline</label><input class="field-input" id="s-tagline" value="${cfg.tagline||''}" /></div>
        <div class="field-group"><label class="field-label">Address</label><input class="field-input" id="s-address" value="${cfg.address||''}" /></div>
        <div class="field-group"><label class="field-label">City</label><input class="field-input" id="s-city" value="${cfg.city||''}" /></div>
      </div>
    </div>
    <div class="settings-section">
      <div class="settings-section-header"><div class="settings-section-title">Contact</div></div>
      <div class="settings-section-body">
        <div class="field-group"><label class="field-label">WhatsApp Number</label><input class="field-input" id="s-whatsapp" value="${cfg.whatsapp||''}" placeholder="+919876543210" /></div>
        <div class="field-group"><label class="field-label">Email</label><input class="field-input" id="s-email" value="${cfg.email||''}" /></div>
        <div class="field-group"><label class="field-label">Instagram Handle</label><input class="field-input" id="s-instagram" value="${cfg.instagram||''}" placeholder="@lighthousestudios" /></div>
      </div>
    </div>
    <div class="settings-section">
      <div class="settings-section-header"><div class="settings-section-title">Booking Rules</div></div>
      <div class="settings-section-body">
        <div class="field-group"><label class="field-label">Opening Hour (0–23)</label><input class="field-input" id="s-open-hr" type="number" min="0" max="23" value="${cfg.openingHour??6}" /></div>
        <div class="field-group"><label class="field-label">Closing Hour (0–23)</label><input class="field-input" id="s-close-hr" type="number" min="0" max="23" value="${cfg.closingHour??23}" /></div>
        <div class="field-group"><label class="field-label">Advance Payment % (0–100)</label><input class="field-input" id="s-advance-pct" type="number" min="0" max="100" value="${cfg.advancePercent??50}" /></div>
        <div class="field-group"><label class="field-label">GST Rate %</label><input class="field-input" id="s-gst" type="number" min="0" max="28" value="${cfg.gstRate??18}" /></div>
        <div class="field-group"><label class="field-label">Min Booking Hours</label><input class="field-input" id="s-min-hrs" type="number" min="1" value="${cfg.minBookingHours??2}" /></div>
        <div class="field-group"><label class="field-label">Buffer Between Sessions (mins)</label><input class="field-input" id="s-buffer" type="number" min="0" value="${cfg.bufferMinutes??30}" /></div>
      </div>
    </div>
    <div class="settings-section">
      <div class="settings-section-header"><div class="settings-section-title">Admin Access</div></div>
      <div class="settings-section-body">
        <div class="field-group"><label class="field-label">Admin Password</label><input class="field-input" id="s-admin-pass" type="password" placeholder="Change password…" /></div>
        <div class="field-group"><label class="field-label">Confirm Password</label><input class="field-input" id="s-admin-pass2" type="password" placeholder="Confirm new password…" /></div>
        <p class="text-muted text-sm">Leave blank to keep current password.</p>
      </div>
    </div>
    <div class="settings-section" style="grid-column:1/-1">
      <div class="settings-section-header"><div class="settings-section-title">Cancellation Policy</div></div>
      <div class="settings-section-body">
        <div class="field-group"><label class="field-label">Policy Text (shown to customers)</label><textarea class="field-input" id="s-cancellation" rows="5">${cfg.cancellationPolicy||''}</textarea></div>
      </div>
    </div>
    <div class="settings-section" style="grid-column:1/-1">
      <div class="settings-section-header"><div class="settings-section-title">Data Management</div></div>
      <div class="settings-section-body">
        <div style="display:flex;gap:.75rem;flex-wrap:wrap">
          <button class="btn-ghost" onclick="exportBookings()">Export All Bookings (CSV)</button>
          <button class="btn-danger btn-sm" onclick="confirmClearData()">Clear All Test Data</button>
        </div>
        <p class="text-muted text-sm" style="margin-top:.5rem">Clearing test data removes all bookings from localStorage. Cannot be undone.</p>
      </div>
    </div>
  </div>`;
}

function bindSettingsEvents() {
  document.getElementById('settings-save-btn')?.addEventListener('click', saveSettings);
}

function saveSettings() {
  const pass  = document.getElementById('s-admin-pass')?.value;
  const pass2 = document.getElementById('s-admin-pass2')?.value;
  if (pass && pass !== pass2) return showToast('Passwords do not match', 'error');

  const existing = JSON.parse(localStorage.getItem('lhs_settings') || '{}');
  const updated = {
    ...existing,
    studioName: document.getElementById('s-studio-name')?.value.trim(),
    tagline: document.getElementById('s-tagline')?.value.trim(),
    address: document.getElementById('s-address')?.value.trim(),
    city: document.getElementById('s-city')?.value.trim(),
    whatsapp: document.getElementById('s-whatsapp')?.value.trim(),
    email: document.getElementById('s-email')?.value.trim(),
    instagram: document.getElementById('s-instagram')?.value.trim(),
    openingHour: parseInt(document.getElementById('s-open-hr')?.value)||6,
    closingHour: parseInt(document.getElementById('s-close-hr')?.value)||23,
    advancePercent: parseInt(document.getElementById('s-advance-pct')?.value)||50,
    gstRate: parseInt(document.getElementById('s-gst')?.value)||18,
    minBookingHours: parseInt(document.getElementById('s-min-hrs')?.value)||2,
    bufferMinutes: parseInt(document.getElementById('s-buffer')?.value)||30,
    cancellationPolicy: document.getElementById('s-cancellation')?.value.trim(),
  };
  if (pass) updated.adminPassword = pass;
  localStorage.setItem('lhs_settings', JSON.stringify(updated));
  // refresh STUDIO_CONFIG if defined
  if (typeof STUDIO_CONFIG !== 'undefined') Object.assign(STUDIO_CONFIG, updated);
  showToast('Settings saved', 'success');
}

function confirmClearData() {
  showConfirm('Clear All Data', 'This will permanently delete ALL bookings and cannot be undone. Are you absolutely sure?', () => {
    localStorage.removeItem('lhs_bookings');
    localStorage.removeItem('lhs_notes');
    localStorage.removeItem('lhs_drive');
    localStorage.removeItem('lhs_blocked_slots');
    showToast('All booking data cleared', 'warn');
    loadPage('overview');
  });
}
