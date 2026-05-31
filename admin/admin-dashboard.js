/* ============================================================
   admin-dashboard.js — Supabase admin dashboard
   Depends on:
   - ../supabase-config.js
   - ../shared.js

   Uses:
   - Auth
   - Orders
   - Products
   - showToast
   - escapeHTML

   This file:
   - Checks admin login
   - Loads orders from Supabase
   - Loads profiles from Supabase
   - Loads feedback from Supabase
   - Updates order fulfilment status
   ============================================================ */


/* ============================================================
   Page state
   ============================================================ */

let currentAdmin = null;

let adminOrders = [];
let adminProfiles = [];
let adminFeedback = [];


/* ============================================================
   DOM helpers
   ============================================================ */

function setAdminLoading(isLoading) {
  const loadingEl = document.getElementById('admin-loading');
  const contentEl = document.getElementById('admin-content');

  if (loadingEl) {
    loadingEl.style.display = isLoading ? 'block' : 'none';
  }

  if (contentEl) {
    contentEl.style.display = isLoading ? 'none' : 'block';
  }
}


/* ============================================================
   Admin auth guard
   ============================================================ */

async function requireAdmin() {
  const profile = await Auth.refreshUser();

  if (!profile || profile.role !== 'admin') {
    localStorage.removeItem('espressgo_admin');
    window.location.href = 'admin-login.html';
    return null;
  }

  localStorage.setItem('espressgo_admin', 'true');

  currentAdmin = profile;

  const adminEmailLabel = document.getElementById('admin-email-label');

  if (adminEmailLabel) {
    adminEmailLabel.textContent = profile.email || 'Admin';
  }

  return profile;
}


/* ============================================================
   Admin logout
   ============================================================ */

async function adminLogout() {
  localStorage.removeItem('espressgo_admin');

  await Auth.logout();

  window.location.href = 'admin-login.html';
}

window.adminLogout = adminLogout;


/* ============================================================
   Panel navigation
   ============================================================ */

function showPanel(name, btn) {
  document.querySelectorAll('.panel').forEach(panel => {
    panel.classList.remove('active');
  });

  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.classList.remove('active');
  });

  const selectedPanel = document.getElementById('panel-' + name);

  if (selectedPanel) {
    selectedPanel.classList.add('active');
  }

  if (btn) {
    btn.classList.add('active');
  }
}

window.showPanel = showPanel;


/* ============================================================
   Status badge styles
   ============================================================ */

const statusStyles = {
  pending: {
    bg: '#fffbeb',
    border: '#fde68a',
    color: '#92400e',
    dot: '🟡'
  },

  processing: {
    bg: '#eff6ff',
    border: '#bfdbfe',
    color: '#1d4ed8',
    dot: '🔵'
  },

  shipped: {
    bg: '#f5f3ff',
    border: '#ddd6fe',
    color: '#5b21b6',
    dot: '🟣'
  },

  delivered: {
    bg: '#f0fdf4',
    border: '#bbf7d0',
    color: '#15803d',
    dot: '🟢'
  }
};


/**
 * Returns HTML status pill for order status.
 */
function statusPill(status) {
  const cleanStatus = status || 'pending';
  const style = statusStyles[cleanStatus] || statusStyles.pending;

  const label =
    cleanStatus.charAt(0).toUpperCase() + cleanStatus.slice(1);

  return `
    <span
      class="status-pill"
      style="
        background:${style.bg};
        border-color:${style.border};
        color:${style.color};
      ">
      ${style.dot} ${escapeHTML(label)}
    </span>
  `;
}


/**
 * Status progression.
 */
const nextStatuses = {
  pending: 'processing',
  processing: 'shipped',
  shipped: 'delivered',
  delivered: 'delivered'
};


/* ============================================================
   Load Supabase data
   ============================================================ */

async function loadAdminData() {
  try {
    adminOrders = await Orders.getAll();
  } catch (error) {
    console.error('Failed to load orders:', error);
    adminOrders = [];

    showToast(
      'Could not load orders',
      error.message || 'Check admin role/RLS permissions.',
      'error'
    );
  }

  try {
    const { data: profiles, error: profileError } = await sb
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profileError) {
      throw profileError;
    }

    adminProfiles = profiles || [];
  } catch (error) {
    console.error('Failed to load profiles:', error);
    adminProfiles = [];

    showToast(
      'Could not load users',
      error.message || 'Check admin role/RLS permissions.',
      'error'
    );
  }

  try {
    const { data: feedback, error: feedbackError } = await sb
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (feedbackError) {
      throw feedbackError;
    }

    adminFeedback = feedback || [];
  } catch (error) {
    console.error('Failed to load feedback:', error);
    adminFeedback = [];

    showToast(
      'Could not load feedback',
      error.message || 'Check admin role/RLS permissions.',
      'error'
    );
  }
}


/* ============================================================
   Refresh admin data
   ============================================================ */

async function refreshAdminData() {
  setAdminLoading(true);

  await loadAdminData();

  renderDashboard();
  renderOrders();
  renderUsers();
  renderProducts();
  renderFeedback();

  setAdminLoading(false);

  showToast(
    'Dashboard refreshed',
    'Latest Supabase data loaded.'
  );
}

window.refreshAdminData = refreshAdminData;


/* ============================================================
   Dashboard panel
   ============================================================ */

function renderDashboard() {
  const all = adminOrders;

  const total = all.reduce((sum, order) => {
    return sum + Number(order.totalAmount || 0);
  }, 0);

  const pending = all.filter(order => order.status === 'pending').length;

  const feedbackCount = adminFeedback.length;

  const dateEl = document.getElementById('dash-date');

  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('en-SG', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  const statRow = document.getElementById('stat-row');

  if (statRow) {
    statRow.innerHTML = [
      ['📦', 'Total Orders', all.length, 'all time'],
      ['💰', 'Revenue', 'SGD $' + total.toFixed(2), 'gross'],
      ['⏳', 'Pending', pending, 'awaiting'],
      ['⭐', 'Feedback', feedbackCount, 'messages']
    ].map(([icon, label, value, sub]) => `
      <div class="stat-mini">

        <div class="stat-mini-label">
          ${icon} ${escapeHTML(label)}
        </div>

        <div class="stat-mini-val">
          ${escapeHTML(value)}
        </div>

        <div class="stat-mini-sub">
          ${escapeHTML(sub)}
        </div>

      </div>
    `).join('');
  }

  const body = document.getElementById('dash-orders-body');

  if (!body) return;

  body.innerHTML =
    all.slice(0, 10).map(order => `
      <tr>

        <td style="color:var(--brown);font-weight:500;">
          #${escapeHTML(order.id)}
        </td>

        <td>
          ${escapeHTML(order.company || '—')}
        </td>

        <td>
          ${Number(order.totalCartons || 0)}
        </td>

        <td>
          SGD $${Number(order.totalAmount || 0).toFixed(2)}
        </td>

        <td>
          ${statusPill(order.status)}
        </td>

        <td>
          ${
            order.dateOrdered
              ? new Date(order.dateOrdered).toLocaleDateString('en-SG')
              : '—'
          }
        </td>

      </tr>
    `).join('') ||
    `
      <tr>
        <td
          colspan="6"
          style="text-align:center;padding:2rem;color:var(--muted-lt);">
          No orders yet
        </td>
      </tr>
    `;
}


/* ============================================================
   Orders fulfilment panel
   ============================================================ */

function renderOrders() {
  const body = document.getElementById('orders-body');

  if (!body) return;

  body.innerHTML =
    adminOrders.map(order => `
      <tr>

        <td style="color:var(--brown);font-weight:500;">
          #${escapeHTML(order.id)}
        </td>

        <td>
          ${escapeHTML(order.company || '—')}
        </td>

        <td>
          ${escapeHTML(order.businessType || '—')}
        </td>

        <td>
          ${Number(order.totalCartons || 0)}
        </td>

        <td>
          SGD $${Number(order.totalAmount || 0).toFixed(2)}
        </td>

        <td>
          ${statusPill(order.status)}
        </td>

        <td>
          ${
            order.status !== 'delivered'
              ? `
                <button
                  onclick="advanceOrder('${escapeHTML(order.id)}')"
                  class="btn-amber btn-sm"
                  type="button">
                  → ${escapeHTML(nextStatuses[order.status] || 'processing')}
                </button>
              `
              : `
                <span style="color:var(--muted-lt);font-size:12px;">
                  ✓ Done
                </span>
              `
          }
        </td>

      </tr>
    `).join('') ||
    `
      <tr>
        <td
          colspan="7"
          style="text-align:center;padding:2rem;color:var(--muted-lt);">
          No orders yet
        </td>
      </tr>
    `;
}


/**
 * Advances an order to its next status.
 */
async function advanceOrder(id) {
  const order = adminOrders.find(o => String(o.id) === String(id));

  if (!order) {
    showToast(
      'Order not found',
      'Could not find selected order.',
      'error'
    );

    return;
  }

  const oldStatus = order.status || 'pending';
  const newStatus = nextStatuses[oldStatus] || oldStatus;

  if (oldStatus === 'delivered') {
    showToast(
      'Already delivered',
      `Order #${id} is already complete.`
    );

    return;
  }

  try {
    await Orders.updateStatus(id, newStatus);

    order.status = newStatus;

    renderOrders();
    renderDashboard();

    showToast(
      'Order updated',
      `#${id} → ${newStatus}`
    );
  } catch (error) {
    console.error('Failed to update order status:', error);

    showToast(
      'Update failed',
      error.message || 'Could not update order status.',
      'error'
    );
  }
}

window.advanceOrder = advanceOrder;


/* ============================================================
   Users panel
   ============================================================ */

function renderUsers() {
  const body = document.getElementById('users-body');

  if (!body) return;

  body.innerHTML =
    adminProfiles.map(profile => {
      const role = profile.role || 'buyer';

      return `
        <tr>

          <td>
            ${escapeHTML(profile.email || '—')}
          </td>

          <td>
            ${escapeHTML(profile.company_name || '—')}
          </td>

          <td>
            ${escapeHTML(profile.business_type || '—')}
          </td>

          <td>
            ${
              role === 'admin'
                ? `
                  <span
                    class="status-pill"
                    style="background:#eff6ff;border-color:#bfdbfe;color:#1d4ed8;">
                    🛡 Admin
                  </span>
                `
                : `
                  <span
                    class="status-pill"
                    style="background:#f0fdf4;border-color:#bbf7d0;color:#15803d;">
                    ✅ Approved
                  </span>
                `
            }
          </td>

        </tr>
      `;
    }).join('') ||
    `
      <tr>
        <td
          colspan="4"
          style="text-align:center;padding:2rem;color:var(--muted-lt);">
          No registered users
        </td>
      </tr>
    `;
}


/* ============================================================
   Products panel
   ============================================================ */

function renderProducts() {
  const body = document.getElementById('products-body');

  if (!body) return;

  body.innerHTML = Products.map(product => `
    <tr>

      <td style="font-size:11px;color:var(--muted);">
        ${escapeHTML(product.sku || '—')}
      </td>

      <td style="color:var(--brown);">
        ${escapeHTML(product.name || '—')}
      </td>

      <td>
        $${product.tiers[0]?.price ?? '—'}
      </td>

      <td>
        $${product.tiers[1]?.price ?? '—'}
      </td>

      <td>
        $${product.tiers[2]?.price ?? '—'}
      </td>

      <td>
        ${
          product.active
            ? `
              <span
                class="status-pill"
                style="background:#f0fdf4;border-color:#bbf7d0;color:#15803d;">
                ✅ Active
              </span>
            `
            : `
              <span
                class="status-pill"
                style="background:#f5f3ff;border-color:#ddd6fe;color:#5b21b6;">
                🔒 Coming Soon
              </span>
            `
        }
      </td>

    </tr>
  `).join('');
}


/* ============================================================
   Feedback panel
   ============================================================ */

function renderFeedback() {
  const body = document.getElementById('feedback-body');

  if (!body) return;

  body.innerHTML =
    adminFeedback.map(feedback => {
      const topic = feedback.topic || 'other';
      const message = feedback.message || '';

      return `
        <tr>

          <td style="color:var(--brown);">
            ${escapeHTML(feedback.name || '—')}
          </td>

          <td>
            ${escapeHTML(feedback.email || '—')}
          </td>

          <td
            style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
            title="${escapeHTML(message)}">
            [${escapeHTML(topic)}] ${escapeHTML(message)}
          </td>

          <td>
            ${
              feedback.created_at
                ? new Date(feedback.created_at).toLocaleDateString('en-SG')
                : '—'
            }
          </td>

        </tr>
      `;
    }).join('') ||
    `
      <tr>
        <td
          colspan="4"
          style="text-align:center;padding:2rem;color:var(--muted-lt);">
          No feedback yet
        </td>
      </tr>
    `;
}


/* ============================================================
   Initialise admin dashboard
   ============================================================ */

async function initAdminDashboard() {
  setAdminLoading(true);

  const admin = await requireAdmin();

  if (!admin) return;

  await loadAdminData();

  renderDashboard();
  renderOrders();
  renderUsers();
  renderProducts();
  renderFeedback();

  setAdminLoading(false);
}

initAdminDashboard();