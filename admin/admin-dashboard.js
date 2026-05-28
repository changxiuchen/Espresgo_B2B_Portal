/* ============================================================
   admin-dashboard.js — Logic for admin/admin-dashboard.html
   Depends on: ../shared.js (Auth, Orders, Products, showToast)
   ============================================================ */

// ── Auth guard ────────────────────────────────────────────
// Redirect to login if admin session is not active
if (localStorage.getItem('espressgo_admin') !== 'true') {
  window.location.href = 'admin-login.html';
}


// ── Admin logout ──────────────────────────────────────────
function adminLogout() {
  localStorage.removeItem('espressgo_admin');
  if (typeof Auth !== 'undefined') {
    Auth.logout();
  }
  window.location.href = 'admin-login.html';
}


// ── Panel navigation ──────────────────────────────────────
/**
 * Shows the selected panel and highlights the corresponding
 * sidebar link. Called by onclick attributes on sidebar buttons.
 */
function showPanel(name, btn) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-link').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-' + name).classList.add('active');
  btn.classList.add('active');
}


// ── Status badge styles ───────────────────────────────────
const statusStyles = {
  pending:    { bg: '#fffbeb', border: '#fde68a', color: '#92400e', dot: '🟡' },
  processing: { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8', dot: '🔵' },
  shipped:    { bg: '#f5f3ff', border: '#ddd6fe', color: '#5b21b6', dot: '🟣' },
  delivered:  { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d', dot: '🟢' },
};

/** Returns an HTML status pill for a given order status string. */
function statusPill(status) {
  const s = statusStyles[status] || statusStyles.pending;
  return `<span class="status-pill" style="background:${s.bg};border-color:${s.border};color:${s.color};">${s.dot} ${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
}

// Status progression: each status advances to the next
const nextStatuses = {
  pending:    'processing',
  processing: 'shipped',
  shipped:    'delivered',
  delivered:  'delivered', // terminal state
};


// ── Dashboard panel ───────────────────────────────────────
/** Renders summary stats and the recent orders table on the Dashboard panel. */
function renderDashboard() {
  const all       = Orders.getAll();
  const total     = all.reduce((s, o) => s + o.totalAmount, 0);
  const pending   = all.filter(o => o.status === 'pending').length;
  const feedbacks = JSON.parse(localStorage.getItem('espressgo_feedback') || '[]');

  // Current date header
  document.getElementById('dash-date').textContent = new Date().toLocaleDateString('en-SG', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  // KPI stat cards
  document.getElementById('stat-row').innerHTML = [
    ['📦', 'Total Orders',  all.length,                   'all time'],
    ['💰', 'Revenue',       'SGD $' + total.toFixed(2),   'gross'],
    ['⏳', 'Pending',       pending,                      'awaiting'],
    ['⭐', 'Feedback',      feedbacks.length,              'messages'],
  ].map(([i, l, v, s]) => `
    <div class="stat-mini">
      <div class="stat-mini-label">${i} ${l}</div>
      <div class="stat-mini-val">${v}</div>
      <div class="stat-mini-sub">${s}</div>
    </div>`).join('');

  // Recent orders table (max 10 rows)
  document.getElementById('dash-orders-body').innerHTML = all.slice(0, 10).map(o => `
    <tr>
      <td style="color:var(--brown);font-weight:500;">#${o.id}</td>
      <td>${o.company}</td>
      <td>${o.totalCartons}</td>
      <td>SGD $${o.totalAmount.toFixed(2)}</td>
      <td>${statusPill(o.status)}</td>
      <td>${new Date(o.dateOrdered).toLocaleDateString('en-SG')}</td>
    </tr>`).join('') || '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--muted-lt);">No orders yet</td></tr>';
}


// ── Orders fulfilment panel ───────────────────────────────
/** Renders the full order table with advance-status buttons. */
function renderOrders() {
  const all = Orders.getAll();
  document.getElementById('orders-body').innerHTML = all.map(o => `
    <tr>
      <td style="color:var(--brown);font-weight:500;">#${o.id}</td>
      <td>${o.company}</td>
      <td>${o.businessType || '—'}</td>
      <td>${o.totalCartons}</td>
      <td>SGD $${o.totalAmount.toFixed(2)}</td>
      <td>${statusPill(o.status)}</td>
      <td>
        ${o.status !== 'delivered'
          ? `<button onclick="advanceOrder('${o.id}')" class="btn-amber btn-sm">→ ${nextStatuses[o.status]}</button>`
          : '<span style="color:var(--muted-lt);font-size:12px;">✓ Done</span>'}
      </td>
    </tr>`).join('') || '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--muted-lt);">No orders yet</td></tr>';
}

/**
 * Advances an order to its next status and saves it.
 * Re-renders both the orders table and the dashboard stats.
 */
function advanceOrder(id) {
  const all   = Orders.getAll();
  const order = all.find(o => o.id === id);
  if (!order) return;
  order.status = nextStatuses[order.status] || order.status;
  Orders.save(all);
  renderOrders();
  renderDashboard();
  showToast('Order updated', `#${id} → ${order.status}`);
}


// ── Users panel ───────────────────────────────────────────
/** Renders the registered buyer list (single user in demo mode). */
function renderUsers() {
  const demoUser = Auth.getUser();
  const users    = demoUser ? [demoUser] : [];
  document.getElementById('users-body').innerHTML = users.map(u => `
    <tr>
      <td>${u.email}</td>
      <td>${u.companyName || '—'}</td>
      <td>${u.businessType || '—'}</td>
      <td><span class="status-pill" style="background:#f0fdf4;border-color:#bbf7d0;color:#15803d;">✅ Approved</span></td>
    </tr>`).join('') || '<tr><td colspan="4" style="text-align:center;padding:2rem;color:var(--muted-lt);">No registered users</td></tr>';
}


// ── Products panel ────────────────────────────────────────
/** Renders the product catalogue with tier pricing and status. */
function renderProducts() {
  document.getElementById('products-body').innerHTML = Products.map(p => `
    <tr>
      <td style="font-size:11px;color:var(--muted);">${p.sku}</td>
      <td style="color:var(--brown);">${p.name}</td>
      <td>$${p.tiers[0]?.price}</td>
      <td>$${p.tiers[1]?.price}</td>
      <td>$${p.tiers[2]?.price}</td>
      <td>${p.active
        ? '<span class="status-pill" style="background:#f0fdf4;border-color:#bbf7d0;color:#15803d;">✅ Active</span>'
        : '<span class="status-pill" style="background:#f5f3ff;border-color:#ddd6fe;color:#5b21b6;">🔒 Coming Soon</span>'}</td>
    </tr>`).join('');
}


// ── Feedback panel ────────────────────────────────────────
/** Renders contact form submissions from localStorage. */
function renderFeedback() {
  const fb = JSON.parse(localStorage.getItem('espressgo_feedback') || '[]');
  document.getElementById('feedback-body').innerHTML = fb.map(f => `
    <tr>
      <td style="color:var(--brown);">${f.name}</td>
      <td>${f.email}</td>
      <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${f.message}">${f.message}</td>
      <td>${new Date(f.date).toLocaleDateString('en-SG')}</td>
    </tr>`).join('') || '<tr><td colspan="4" style="text-align:center;padding:2rem;color:var(--muted-lt);">No feedback yet</td></tr>';
}


// ── Initialise all panels ─────────────────────────────────
renderDashboard();
renderOrders();
renderUsers();
renderProducts();
renderFeedback();
