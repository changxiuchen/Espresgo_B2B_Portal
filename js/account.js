/* ============================================================
   account.js — Logic for account.html
   Depends on: shared.js
   Uses:
   - Auth
   - Orders
   - showToast
   - buildNav
   - buildFooter
   - escapeHTML

   Supabase version
   ============================================================ */


/* ============================================================
   Page state
   ============================================================ */

let user = null;
let myOrders = [];
let editing = false;

const creditLimit = 25000; // SGD credit limit per account


/* ============================================================
   Status colours / labels
   ============================================================ */

const statusCfg = {
  pending: {
    label: 'Pending',
    dot: '#fbbf24'
  },

  processing: {
    label: 'Processing',
    dot: '#60a5fa'
  },

  shipped: {
    label: 'Shipped',
    dot: '#a78bfa'
  },

  delivered: {
    label: 'Delivered',
    dot: '#4ade80'
  },
};


/* ============================================================
   Hero section
   ============================================================ */

/**
 * Fills in the account hub hero with:
 * - user initials
 * - company name
 * - business type
 * - email
 */
function initHero() {
  if (!user) return;

  const initials = (user.contactName || user.companyName || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  document.getElementById('acct-avatar').textContent = initials;

  document.getElementById('acct-heading').textContent =
    user.companyName || 'My Account';

  document.getElementById('acct-sub').textContent =
    `${user.businessType || 'Buyer'} · ${user.email || ''}`;
}


/* ============================================================
   Order helpers
   ============================================================ */

/**
 * Returns orders belonging to the current user.
 */
function getMyOrders() {
  return myOrders;
}


/**
 * Sums totalAmount across an array of orders.
 */
function totalSpend(orders) {
  return orders.reduce((sum, order) => {
    return sum + Number(order.totalAmount || 0);
  }, 0);
}


/**
 * Formats order date.
 */
function formatOrderDate(dateValue) {
  if (!dateValue) return '—';

  return new Date(dateValue).toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}


/* ============================================================
   Order list HTML
   ============================================================ */

/**
 * Builds the HTML for the order list.
 * Used in both:
 * - Overview tab
 * - Orders tab
 */
function orderListHTML(list, suffix = '') {
  if (!list.length) {
    return `
      <div
        style="padding:4rem 1.5rem;display:flex;flex-direction:column;align-items:center;text-align:center;">

        <div style="font-size:2.5rem;margin-bottom:.75rem;opacity:.3;">
          📦
        </div>

        <div style="color:var(--brown);margin-bottom:.35rem;">
          No orders yet
        </div>

        <p style="font-size:13px;color:var(--muted);margin-bottom:1.25rem;">
          Head to the Catalog to place your first bulk order.
        </p>

        <a href="catalog.html" class="btn-dark btn-sm">
          Browse Catalog →
        </a>

      </div>
    `;
  }

  return list.map(order => {
    const sc = statusCfg[order.status] || statusCfg.pending;
    const date = formatOrderDate(order.dateOrdered);

    return `
      <div class="order-row">

        <div
          class="order-row-header"
          onclick="toggleOrder('${order.id}', '${suffix}')"
          role="button"
          aria-expanded="false"
          id="hdr-${order.id}${suffix}">

          <div
            class="order-dot"
            style="background:${sc.dot};">
          </div>

          <div style="flex:1;min-width:0;">

            <div
              style="display:flex;align-items:center;gap:.5rem;margin-bottom:.2rem;flex-wrap:wrap;">

              <span class="order-id">
                #${escapeHTML(order.id)}
              </span>

              <span
                style="font-size:10px;padding:.15rem .45rem;border-radius:9999px;border:1px solid;background:transparent;">
                ${escapeHTML(sc.label)}
              </span>

              ${
                order.notes
                  ? `<span style="font-size:10px;color:var(--muted);">${escapeHTML(order.notes)}</span>`
                  : ''
              }

            </div>

            <div class="order-meta">
              ${escapeHTML(date)} · ${Number(order.totalCartons || 0)} ctn · ${(Number(order.totalCartons || 0) * 50).toLocaleString()} pouches
            </div>

          </div>

          <div class="order-amount">
            SGD $${Number(order.totalAmount || 0).toFixed(2)}
          </div>

          <div
            class="order-chevron"
            id="chev-${order.id}${suffix}">
            ▾
          </div>

        </div>

        <div
          class="order-detail"
          id="det-${order.id}${suffix}">

          <div class="order-items">

            <div
              style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:.6rem;">
              Items
            </div>

            ${(order.items || []).map(item => `
              <div class="order-item-row">

                <span style="color:var(--brown);">
                  ${Number(item.cartons || 0)} cartons × ${escapeHTML(item.name || '')}
                </span>

                <span style="color:var(--brown-lt);">
                  SGD $${(Number(item.cartons || 0) * Number(item.pricePerCarton || 0)).toFixed(2)}
                </span>

              </div>
            `).join('')}

          </div>

          <div style="display:flex;gap:.6rem;">

            <button
              onclick="handleReorder('${order.id}')"
              class="btn-dark"
              style="flex:1;justify-content:center;padding:.6rem;"
              type="button">
              ↩ Reorder
            </button>

            <button
              onclick="handleInvoice('${order.id}')"
              class="btn-ghost"
              style="padding:.6rem 1rem;"
              type="button">
              📄 Invoice
            </button>

          </div>

        </div>

      </div>
    `;
  }).join('');
}


/* ============================================================
   Order row toggling
   ============================================================ */

function toggleOrder(id, suffix = '') {
  const detail = document.getElementById('det-' + id + suffix);
  const chevron = document.getElementById('chev-' + id + suffix);
  const header = document.getElementById('hdr-' + id + suffix);

  if (!detail) return;

  const open = detail.classList.toggle('open');

  if (chevron) {
    chevron.classList.toggle('open', open);
  }

  if (header) {
    header.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
}


/* ============================================================
   Reorder
   ============================================================ */

async function handleReorder(id) {
  const existingOrder = getMyOrders().find(order => order.id === id);

  if (!existingOrder) {
    showToast('Order not found', 'Could not find the selected order.', 'error');
    return;
  }

  if (!user) {
    showToast('Please sign in', 'You need to sign in before reordering.', 'error');
    window.location.href = 'login.html';
    return;
  }

  try {
    const newOrder = await Orders.add({
      company: user.companyName,
      contactName: user.contactName || user.email,
      businessType: user.businessType,
      items: existingOrder.items || [],
      totalCartons: existingOrder.totalCartons,
      totalAmount: existingOrder.totalAmount,
      status: 'pending',
      deliveryAddress: user.deliveryAddress || existingOrder.deliveryAddress || '',
      notes: `Reorder of #${existingOrder.id}`,
    });

    myOrders = await Orders.forCurrentUser();

    showToast(
      `Reorder placed — #${newOrder.id}`,
      `${existingOrder.totalCartons} ctn · SGD $${Number(existingOrder.totalAmount || 0).toFixed(2)} · Pending`
    );

    renderAll();
  } catch (error) {
    console.error('Reorder failed:', error);

    showToast(
      'Reorder failed',
      error.message || 'Could not place reorder.',
      'error'
    );
  }
}


/* ============================================================
   PDF invoice generation
   ============================================================ */

function handleInvoice(id) {
  const order = getMyOrders().find(o => o.id === id);

  if (!order) {
    showToast('Error', 'Order details not found.', 'error');
    return;
  }

  const PDFDocument = window.PDFDocument;

  if (!PDFDocument) {
    showToast('Error', 'PDF engine failed to load. Please reload.', 'error');
    return;
  }

  try {
    const pdfChunks = [];
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40
    });

    doc.on('data', chunk => {
      pdfChunks.push(chunk);
    });

    const dateStr = formatOrderDate(order.dateOrdered);
    const rightAlignX = 555;

    /* ── Header ─────────────────────────────────────────── */

    doc
      .fillColor('#2B1B10')
      .font('Helvetica-Bold')
      .fontSize(24)
      .text('INVOICE', 40, 50);

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#646464')
      .text(`Invoice ID: #${order.id}`, 350, 45, {
        width: 205,
        align: 'right'
      })
      .text(`Date Issued: ${dateStr}`, 350, 58, {
        width: 205,
        align: 'right'
      })
      .text('Payment Terms: Net 30', 350, 71, {
        width: 205,
        align: 'right'
      });

    doc
      .moveTo(40, 95)
      .lineTo(rightAlignX, 95)
      .lineWidth(0.5)
      .strokeColor('#F0EAE4')
      .stroke();

    /* ── Billing details ────────────────────────────────── */

    doc
      .fillColor('#2B1B10')
      .font('Helvetica-Bold')
      .fontSize(11)
      .text('Billed To:', 40, 115);

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#2B1B10')
      .text(user.companyName || order.company || 'Valued Customer', 40, 132)
      .text(`Attn: ${user.contactName || order.contactName || 'Procurement Team'}`, 40, 147);

    doc.text(
      user.deliveryAddress || order.deliveryAddress || 'Singapore',
      40,
      162,
      {
        width: 250
      }
    );

    /* ── Table header ───────────────────────────────────── */

    let startY = 230;

    doc
      .rect(40, startY, 515, 20)
      .fill('#FAF8F5');

    doc
      .fillColor('#786E64')
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('Item Description', 50, startY + 6)
      .text('Qty (ctn)', 330, startY + 6, {
        width: 50,
        align: 'right'
      })
      .text('Price/ctn', 380, startY + 6, {
        width: 90,
        align: 'right'
      })
      .text('Total Amount', 480, startY + 6, {
        width: 70,
        align: 'right'
      });

    /* ── Items ──────────────────────────────────────────── */

    let currentY = startY + 20;

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#2B1B10');

    (order.items || []).forEach(item => {
      const cartons = Number(item.cartons || 0);
      const pricePerCarton = Number(item.pricePerCarton || 0);
      const itemTotal = cartons * pricePerCarton;

      doc
        .fillColor('#2B1B10')
        .font('Helvetica')
        .fontSize(10)
        .text(item.name || 'Product', 50, currentY + 7, {
          width: 280
        })
        .text(String(cartons), 330, currentY + 7, {
          width: 50,
          align: 'right'
        })
        .text(`SGD $${pricePerCarton.toFixed(2)}`, 380, currentY + 7, {
          width: 90,
          align: 'right'
        })
        .text(`SGD $${itemTotal.toFixed(2)}`, 480, currentY + 7, {
          width: 70,
          align: 'right'
        });

      currentY += 24;

      doc
        .moveTo(40, currentY)
        .lineTo(rightAlignX, currentY)
        .lineWidth(0.5)
        .strokeColor('#E8E0D8')
        .stroke();
    });

    /* ── Summary ────────────────────────────────────────── */

    currentY += 20;

    doc
      .fillColor('#2B1B10')
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('Total Cartons Ordered:', 320, currentY, {
        width: 140,
        align: 'right'
      });

    doc
      .font('Helvetica')
      .text(`${Number(order.totalCartons || 0)} cartons`, 470, currentY, {
        width: 80,
        align: 'right'
      });

    currentY += 18;

    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#2B1B10')
      .text('Grand Total Due (SGD):', 300, currentY, {
        width: 160,
        align: 'right'
      });

    doc
      .fillColor('#D97706')
      .text(`$${Number(order.totalAmount || 0).toFixed(2)}`, 470, currentY, {
        width: 80,
        align: 'right'
      });

    /* ── Footer note ────────────────────────────────────── */

    doc
      .fillColor('#969696')
      .font('Helvetica-Oblique')
      .fontSize(8)
      .text(
        'Thank you for your business! Payment is due within 30 days via GIRO / Corporate PayNow transfers.',
        40,
        currentY + 50,
        {
          width: 515,
          align: 'center'
        }
      );

    /* ── Compile and download ───────────────────────────── */

    doc.on('end', () => {
      const blob = new Blob(pdfChunks, {
        type: 'application/pdf'
      });

      const url = URL.createObjectURL(blob);

      const downloadLink = document.createElement('a');

      downloadLink.href = url;
      downloadLink.download = `Invoice_${order.id}.pdf`;

      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      URL.revokeObjectURL(url);

      showToast(
        'Invoice downloaded',
        `Saved Invoice #${order.id} successfully.`
      );
    });

    doc.end();
  } catch (error) {
    console.error('Invoice generation failed:', error);

    showToast(
      'Invoice failed',
      error.message || 'Could not generate invoice.',
      'error'
    );
  }
}


/* ============================================================
   Overview tab renderer
   ============================================================ */

function renderOverview() {
  const orders = getMyOrders();

  const spend = totalSpend(orders);
  const pending = orders.filter(order =>
    order.status === 'pending' ||
    order.status === 'processing'
  ).length;

  const creditUsed = Math.min((spend / creditLimit) * 100, 100);

  const nextStatus = orders.find(order => order.status === 'shipped')
    ? 'In Transit'
    : orders.find(order => order.status === 'processing')
      ? 'Being Prepared'
      : '—';

  document.getElementById('panel-overview').innerHTML = `
    <div class="kpi-grid">

      <div class="kpi-card">

        <div
          class="kpi-icon"
          style="background:#EEF2FF;">
          🛍️
        </div>

        <div>
          <div class="kpi-label">Total Orders</div>

          <div class="kpi-num">
            ${orders.length}
          </div>

          <div class="kpi-sub">
            SGD $${spend.toLocaleString()} lifetime
          </div>

          ${
            pending > 0
              ? `
                <span
                  style="font-size:10px;background:#fffbeb;border:1px solid #fde68a;color:#92400e;padding:2px 8px;border-radius:9999px;display:inline-block;margin-top:.35rem;">
                  ${pending} active
                </span>
              `
              : ''
          }
        </div>

      </div>

      <div class="kpi-card">

        <div
          class="kpi-icon"
          style="background:#EFF6FF;">
          🚚
        </div>

        <div>
          <div class="kpi-label">Next Delivery</div>

          <div
            class="kpi-num"
            style="font-size:1rem;">
            ${nextStatus}
          </div>

          <div class="kpi-sub">
            Est. 3–5 business days
          </div>
        </div>

      </div>

      <div
        class="kpi-card"
        style="flex-direction:column;gap:.75rem;">

        <div style="display:flex;align-items:center;gap:.75rem;">

          <div
            class="kpi-icon"
            style="background:#FEF3E2;">
            💳
          </div>

          <div>
            <div class="kpi-label">Credit Available</div>

            <div style="color:var(--brown);">
              SGD $${Math.max(creditLimit - spend, 0).toLocaleString()}
            </div>
          </div>

        </div>

        <div class="credit-bar">
          <div
            class="credit-fill"
            style="width:${creditUsed}%;background:var(--amber);">
          </div>
        </div>

        <div
          style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted-lt);">
          <span>Used $${spend.toLocaleString()}</span>
          <span>Limit $25,000</span>
        </div>

      </div>

    </div>

    <div
      class="card"
      style="margin-bottom:1rem;">

      <div
        style="padding:1rem 1.5rem;border-bottom:1px solid #F0EAE4;display:flex;align-items:center;justify-content:space-between;">

        <h2 style="font-size:1rem;color:var(--brown);">
          Recent Orders
        </h2>

        <button
          onclick="switchTab('orders')"
          style="font-size:12px;color:var(--amber);background:none;border:none;cursor:pointer;"
          type="button">
          View all →
        </button>

      </div>

      ${orderListHTML(orders.slice(0, 3), '-ov')}

    </div>

    <div
      style="display:grid;grid-template-columns:repeat(2,1fr);gap:.75rem;">

      <button
        onclick="switchTab('profile')"
        class="quick-link"
        type="button">

        <div style="display:flex;align-items:center;gap:.75rem;">

          <div
            style="width:36px;height:36px;background:#FEF3E2;border-radius:10px;display:flex;align-items:center;justify-content:center;">
            👤
          </div>

          <div style="text-align:left;">

            <div style="font-size:13px;color:var(--brown);">
              Business Profile
            </div>

            <div style="font-size:11px;color:var(--muted);">
              ${escapeHTML(user.companyName || 'Company')}
            </div>

          </div>

        </div>

        <span style="color:var(--muted-lt);">
          ›
        </span>

      </button>

      <button
        onclick="switchTab('billing')"
        class="quick-link"
        type="button">

        <div style="display:flex;align-items:center;gap:.75rem;">

          <div
            style="width:36px;height:36px;background:#EFF6FF;border-radius:10px;display:flex;align-items:center;justify-content:center;">
            💳
          </div>

          <div style="text-align:left;">

            <div style="font-size:13px;color:var(--brown);">
              Billing &amp; Address
            </div>

            <div style="font-size:11px;color:var(--muted);">
              Net 30 · SGD $25,000 limit
            </div>

          </div>

        </div>

        <span style="color:var(--muted-lt);">
          ›
        </span>

      </button>

    </div>
  `;
}


/* ============================================================
   Orders tab renderer
   ============================================================ */

function renderOrders() {
  const orders = getMyOrders();

  document.getElementById('panel-orders').innerHTML = `
    <div class="card">

      <div
        style="padding:1rem 1.5rem;border-bottom:1px solid #F0EAE4;display:flex;align-items:center;justify-content:space-between;">

        <div style="display:flex;align-items:center;gap:.75rem;">

          <div
            style="width:32px;height:32px;background:#F5F0EB;border-radius:10px;display:flex;align-items:center;justify-content:center;">
            📦
          </div>

          <div>
            <h2 style="font-size:1rem;color:var(--brown);">
              Order History
            </h2>

            <p style="font-size:11px;color:var(--muted);">
              ${orders.length} order${orders.length !== 1 ? 's' : ''}
            </p>
          </div>

        </div>

        <a
          href="catalog.html"
          style="font-size:12px;color:var(--amber);">
          + New Order
        </a>

      </div>

      ${orderListHTML(orders)}

    </div>
  `;
}


/* ============================================================
   Profile tab renderer
   ============================================================ */

function renderProfile() {
  const u = user || Auth.getUser();

  if (!u) return;

  const viewHTML = `
    <div class="card">

      <div
        style="padding:1rem 1.5rem;border-bottom:1px solid #F0EAE4;display:flex;align-items:center;justify-content:space-between;">

        <div style="display:flex;align-items:center;gap:.75rem;">

          <div
            style="width:32px;height:32px;background:#FEF3E2;border-radius:10px;display:flex;align-items:center;justify-content:center;">
            👤
          </div>

          <h2 style="font-size:1rem;color:var(--brown);">
            Business Profile
          </h2>

        </div>

        <button
          onclick="startEdit()"
          class="btn-ghost btn-sm"
          type="button">
          ✏️ Edit
        </button>

      </div>

      <div style="padding:1.5rem;">

        <div class="profile-grid">

          ${[
            ['Contact Name', u.contactName || '—'],
            ['Email', u.email || '—', 'Contact support to change'],
            ['Company Name', u.companyName || '—'],
            ['Business Type', u.businessType || '—']
          ].map(([label, value, note]) => `
            <div>

              <div class="profile-field-label">
                ${escapeHTML(label)}
              </div>

              <div class="profile-field-value">
                ${escapeHTML(value)}
              </div>

              ${
                note
                  ? `<div class="profile-field-note">${escapeHTML(note)}</div>`
                  : ''
              }

            </div>
          `).join('')}

          <div style="grid-column:1/-1;">

            <div class="profile-field-label">
              Delivery Address
            </div>

            <div class="profile-field-value">
              ${
                u.deliveryAddress
                  ? escapeHTML(u.deliveryAddress)
                  : '<span style="color:var(--muted-lt);font-style:italic;">Not set — click Edit to add</span>'
              }
            </div>

          </div>

        </div>

      </div>

    </div>
  `;

  const businessTypes = [
    'Office Manager',
    'Gym Operator',
    'Event Organiser',
    'Café Distributor',
    'Convenience Store',
    'Other'
  ];

  const editHTML = `
    <div class="card">

      <div
        style="padding:1rem 1.5rem;border-bottom:1px solid #F0EAE4;display:flex;align-items:center;justify-content:space-between;">

        <div style="display:flex;align-items:center;gap:.75rem;">

          <div
            style="width:32px;height:32px;background:#FEF3E2;border-radius:10px;display:flex;align-items:center;justify-content:center;">
            👤
          </div>

          <h2 style="font-size:1rem;color:var(--brown);">
            Business Profile
          </h2>

        </div>

        <div style="display:flex;gap:.5rem;">

          <button
            onclick="cancelEdit()"
            class="btn-ghost btn-sm"
            type="button">
            × Cancel
          </button>

          <button
            onclick="saveProfile()"
            class="btn-dark btn-sm"
            type="button">
            💾 Save
          </button>

        </div>

      </div>

      <div style="padding:1.5rem;">

        <div
          id="profile-err"
          style="display:none;"
          class="server-err"
          role="alert">
        </div>

        <div
          style="display:grid;grid-template-columns:repeat(2,1fr);gap:1rem;">

          <div class="field">

            <label for="p-contactName">
              Contact Name
            </label>

            <input
              class="input"
              id="p-contactName"
              value="${escapeHTML(u.contactName || '')}"
              placeholder="Jane Tan"/>

          </div>

          <div class="field">

            <label>
              Email
            </label>

            <div class="input input-muted">
              ${escapeHTML(u.email || '')}
            </div>

            <p style="font-size:10px;color:var(--muted-lt);margin-top:4px;">
              Contact support to change
            </p>

          </div>

          <div class="field">

            <label for="p-companyName">
              Company Name
            </label>

            <input
              class="input"
              id="p-companyName"
              value="${escapeHTML(u.companyName || '')}"
              placeholder="Your Company Pte. Ltd."/>

          </div>

          <div class="field">

            <label for="p-businessType">
              Business Type
            </label>

            <select
              class="input"
              id="p-businessType">

              <option value="">
                Select type…
              </option>

              ${businessTypes.map(type => `
                <option
                  value="${escapeHTML(type)}"
                  ${u.businessType === type ? 'selected' : ''}>
                  ${escapeHTML(type)}
                </option>
              `).join('')}

            </select>

          </div>

        </div>

        <div class="field">

          <label for="p-address">
            Delivery Address
            <span style="color:var(--muted-lt);">
              (Singapore)
            </span>
          </label>

          <textarea
            class="input"
            id="p-address"
            rows="2"
            style="resize:none;"
            placeholder="10 Anson Road, #22-01, Singapore 079903">${escapeHTML(u.deliveryAddress || '')}</textarea>

        </div>

      </div>

    </div>
  `;

  document.getElementById('panel-profile').innerHTML =
    editing ? editHTML : viewHTML;
}


/* ============================================================
   Profile edit controls
   ============================================================ */

function startEdit() {
  editing = true;
  renderProfile();
}


function cancelEdit() {
  editing = false;
  renderProfile();
}


async function saveProfile() {
  const contactName = document.getElementById('p-contactName').value.trim();
  const companyName = document.getElementById('p-companyName').value.trim();
  const businessType = document.getElementById('p-businessType').value;
  const deliveryAddress = document.getElementById('p-address').value.trim();
  const errEl = document.getElementById('profile-err');

  errEl.textContent = '';
  errEl.style.display = 'none';

  if (!contactName) {
    errEl.textContent = '⚠️ Contact name is required.';
    errEl.style.display = 'flex';
    return;
  }

  if (companyName.length < 2) {
    errEl.textContent = '⚠️ Company name must be at least 2 characters.';
    errEl.style.display = 'flex';
    return;
  }

  if (!businessType) {
    errEl.textContent = '⚠️ Please select a business type.';
    errEl.style.display = 'flex';
    return;
  }

  const result = await Auth.updateProfile({
    contactName,
    companyName,
    businessType,
    deliveryAddress
  });

  if (!result.ok) {
    errEl.textContent = '⚠️ ' + result.error;
    errEl.style.display = 'flex';
    return;
  }

  user = Auth.getUser();
  editing = false;

  showToast(
    'Profile updated',
    'Your account details have been saved.'
  );

  buildNav('account');
  initHero();
  renderAll();
}


/* ============================================================
   Billing tab renderer
   ============================================================ */

function renderBilling() {
  const orders = getMyOrders();
  const spend = totalSpend(orders);
  const available = Math.max(creditLimit - spend, 0);
  const used = Math.min((spend / creditLimit) * 100, 100);

  const barColor = used > 80
    ? '#f87171'
    : used > 50
      ? '#fbbf24'
      : 'var(--amber)';

  const u = user || Auth.getUser();

  document.getElementById('panel-billing').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:1rem;">

      <div
        class="card"
        style="padding:1.5rem;">

        <div
          style="display:flex;align-items:center;gap:.75rem;margin-bottom:1.25rem;">

          <div
            style="width:36px;height:36px;background:#FEF3E2;border-radius:10px;display:flex;align-items:center;justify-content:center;">
            💳
          </div>

          <h3 style="color:var(--brown);">
            Payment Terms
          </h3>

        </div>

        ${[
          ['Payment Terms', 'Net 30', false],
          ['Credit Limit', 'SGD $25,000', false],
          ['Available Credit', `SGD $${available.toLocaleString()}`, true],
          ['Used', `SGD $${spend.toLocaleString()}`, false]
        ].map(([label, value, green]) => `
          <div class="billing-row">

            <span style="color:var(--brown-lt);">
              ${escapeHTML(label)}
            </span>

            <span style="${green ? 'color:#16a34a;' : 'color:var(--brown);'}">
              ${escapeHTML(value)}
            </span>

          </div>
        `).join('')}

        <div style="margin-top:1rem;">

          <div
            style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-bottom:.35rem;">

            <span>Credit utilisation</span>
            <span>${Math.round(used)}%</span>

          </div>

          <div class="credit-bar">
            <div
              class="credit-fill"
              style="width:${used}%;background:${barColor};">
            </div>
          </div>

        </div>

      </div>

      <div
        class="card"
        style="padding:1.5rem;">

        <div
          style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;">

          <div style="display:flex;align-items:center;gap:.75rem;">

            <div
              style="width:36px;height:36px;background:#EFF6FF;border-radius:10px;display:flex;align-items:center;justify-content:center;">
              📍
            </div>

            <h3 style="color:var(--brown);">
              Delivery Address
            </h3>

          </div>

          <button
            onclick="switchTab('profile');startEdit();"
            style="font-size:12px;color:var(--amber);background:none;border:none;cursor:pointer;"
            type="button">
            ✏️ Edit
          </button>

        </div>

        <div
          style="background:#FAF8F5;border:1px solid #F0EAE4;border-radius:12px;padding:1rem;font-size:13px;color:var(--brown-lt);">

          ${
            u.companyName
              ? `<div style="color:var(--brown);margin-bottom:.25rem;">${escapeHTML(u.companyName)}</div>`
              : ''
          }

          ${
            u.deliveryAddress
              ? escapeHTML(u.deliveryAddress)
              : '<span style="color:var(--muted-lt);font-style:italic;">No address saved yet.</span>'
          }

        </div>

      </div>

    </div>
  `;
}


/* ============================================================
   Render all panels
   ============================================================ */

function renderAll() {
  renderOverview();
  renderOrders();
  renderProfile();
  renderBilling();

  const count = getMyOrders().length;
  const badge = document.getElementById('order-count-badge');

  if (badge) {
    badge.textContent = count > 0 ? count : '';
  }
}


/* ============================================================
   Tab switching
   ============================================================ */

function switchTab(name) {
  ['overview', 'orders', 'profile', 'billing'].forEach(tab => {
    const panel = document.getElementById('panel-' + tab);
    const btn = document.getElementById('tab-' + tab);

    if (panel) {
      panel.style.display = tab === name ? 'block' : 'none';
    }

    if (btn) {
      btn.classList.toggle('active', tab === name);
      btn.setAttribute('aria-selected', tab === name ? 'true' : 'false');
    }
  });
}


/* ============================================================
   Wire tab buttons
   ============================================================ */

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    switchTab(btn.dataset.tab);
  });
});


/* ============================================================
   Loading display
   ============================================================ */

function setAccountLoading(isLoading) {
  const loading = document.getElementById('account-loading');
  const panels = document.getElementById('account-panels');

  if (loading) {
    loading.style.display = isLoading ? 'block' : 'none';
  }

  if (panels) {
    panels.style.display = isLoading ? 'none' : 'block';
  }
}


/* ============================================================
   Initialise page
   ============================================================ */

async function initAccountPage() {
  buildNav('account');
  buildFooter();

  setAccountLoading(true);

  const refreshedUser = await Auth.refreshUser();

  if (!refreshedUser) {
    localStorage.setItem('redirectAfterLogin', 'account.html');
    window.location.href = 'login.html';
    return;
  }

  user = refreshedUser;

  try {
    myOrders = await Orders.forCurrentUser();
  } catch (error) {
    console.error('Failed to load orders:', error);

    showToast(
      'Could not load orders',
      'Please refresh the page or try again later.',
      'error'
    );

    myOrders = [];
  }

  initHero();
  renderAll();
  switchTab('overview');

  setAccountLoading(false);
}

initAccountPage();