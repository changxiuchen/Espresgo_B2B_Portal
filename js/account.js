/* ============================================================
   account.js — Logic for account.html
   Depends on: shared.js (Auth, Orders, showToast, buildNav,
                          buildFooter, requireAuth)
   ============================================================ */

// ── Auth & initialisation ─────────────────────────────────
requireAuth();
buildNav('account');
buildFooter();

const user        = Auth.getUser();
const creditLimit = 25000; // SGD credit limit per account

// Status colours/labels for order badges
const statusCfg = {
  pending:    { label: 'Pending',    dot: '#fbbf24' },
  processing: { label: 'Processing', dot: '#60a5fa' },
  shipped:    { label: 'Shipped',    dot: '#a78bfa' },
  delivered:  { label: 'Delivered',  dot: '#4ade80' },
};


// ── Hero section ──────────────────────────────────────────
/**
 * Fills in the account hub hero with the user's initials,
 * company name, and business type + email.
 */
function initHero() {
  const initials = (user.contactName || user.companyName || 'U')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  document.getElementById('acct-avatar').textContent  = initials;
  document.getElementById('acct-heading').textContent = user.companyName || 'My Account';
  document.getElementById('acct-sub').textContent     = `${user.businessType} · ${user.email}`;
}


// ── Order helpers ─────────────────────────────────────────
/** Returns only the orders belonging to the current user's company. */
function getMyOrders() { return Orders.forCompany(user.companyName); }

/** Sums the totalAmount across an array of orders. */
function totalSpend(orders) { return orders.reduce((s, o) => s + o.totalAmount, 0); }


// ── Order list HTML ───────────────────────────────────────
/**
 * Builds the HTML for the order list (used in both Overview and Orders tabs).
 * Shows an empty state if there are no orders.
 */
function orderListHTML(list, suffix = '') {
  if (!list.length) return `
    <div style="padding:4rem 1.5rem;display:flex;flex-direction:column;align-items:center;text-align:center;">
      <div style="font-size:2.5rem;margin-bottom:.75rem;opacity:.3;">📦</div>
      <div style="color:var(--brown);margin-bottom:.35rem;">No orders yet</div>
      <p style="font-size:13px;color:var(--muted);margin-bottom:1.25rem;">Head to the Catalog to place your first bulk order.</p>
      <a href="catalog.html" class="btn-dark btn-sm">Browse Catalog →</a>
    </div>`;

  return list.map(o => {
    const sc   = statusCfg[o.status] || statusCfg.pending;
    const date = new Date(o.dateOrdered).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' });

    return `<div class="order-row">
      <div class="order-row-header" onclick="toggleOrder('${o.id}', '${suffix}')" role="button" aria-expanded="false" id="hdr-${o.id}${suffix}">
        <div class="order-dot" style="background:${sc.dot};"></div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.2rem;">
            <span class="order-id">#${o.id}</span>
            <span style="font-size:10px;padding:.15rem .45rem;border-radius:9999px;border:1px solid;background:transparent;">${sc.label}</span>
            ${o.notes ? `<span style="font-size:10px;color:var(--muted);">${o.notes}</span>` : ''}
          </div>
          <div class="order-meta">${date} · ${o.totalCartons} ctn · ${(o.totalCartons * 50).toLocaleString()} pouches</div>
        </div>
        <div class="order-amount">SGD $${o.totalAmount.toFixed(2)}</div>
        <div class="order-chevron" id="chev-${o.id}${suffix}">▾</div>
      </div>
      <div class="order-detail" id="det-${o.id}${suffix}">
        <div class="order-items">
          <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:.6rem;">Items</div>
          ${o.items.map(it => `<div class="order-item-row">
            <span style="color:var(--brown);">${it.cartons} cartons × ${it.name}</span>
            <span style="color:var(--brown-lt);">SGD $${(it.cartons * it.pricePerCarton).toFixed(2)}</span>
          </div>`).join('')}
        </div>
        <div style="display:flex;gap:.6rem;">
          <button onclick="handleReorder('${o.id}')" class="btn-dark" style="flex:1;justify-content:center;padding:.6rem;">↩ Reorder</button>
          <button onclick="handleInvoice('${o.id}')" class="btn-ghost" style="padding:.6rem 1rem;">📄 Invoice</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

/** Toggles the expanded/collapsed state of an order row. */
function toggleOrder(id, suffix = '') { // <-- 1. Accept suffix tracking parameter
  const det  = document.getElementById('det-' + id + suffix); // <-- 2. Target localized elements
  const chev = document.getElementById('chev-' + id + suffix);
  const hdr  = document.getElementById('hdr-' + id + suffix);
  const open = det.classList.toggle('open');
  if (chev) chev.classList.toggle('open', open);
  if (hdr)  hdr.setAttribute('aria-expanded', open);
}

/** Duplicates an existing order and adds it as a new pending order. */
async function handleReorder(id) {
  const o = getMyOrders().find(x => x.id === id);
  if (!o) return;
  try {
    const neo = await Orders.add({
      company: user.companyName, contactName: user.contactName,
      businessType: user.businessType, items: o.items,
      totalCartons: o.totalCartons, totalAmount: o.totalAmount,
      status: 'pending', deliveryAddress: user.deliveryAddress || o.deliveryAddress,
      notes: `Reorder of #${o.id}`,
    });
    showToast(`Reorder placed — #${neo.id}`, `${o.totalCartons} ctn · SGD $${o.totalAmount.toFixed(2)} · Pending`);
    renderAll();
  } catch (err) {
    showToast('Reorder failed', err.message || 'Something went wrong.', 'error');
  }
}

/** Generates and downloads a PDF invoice using PDFKit & localized memory streams. */
function handleInvoice(id) {
  const o = getMyOrders().find(x => x.id === id);
  if (!o) {
    showToast('Error', 'Order details not found.');
    return;
  }

  // 1. Get the verified PDFDocument class
  const PDFDocument = window.PDFDocument;
  if (!PDFDocument) {
    showToast('Error', 'PDF Engine failed to load. Please reload.');
    return;
  }

  // 2. INLINE BLOB-STREAM FACTORY (Replaces the broken external library file completely)
  const pdfChunks = [];
  const doc = new PDFDocument({ size: 'A4', margin: 40 });

  // Capture document compilation output array streams natively
  doc.on('data', chunk => pdfChunks.push(chunk));

  const dateStr = new Date(o.dateOrdered).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' });
  const rightAlignX = 555; // Right margin bound based on A4 width

  // ── HEADER SECTION ──
  doc.fillColor('#2B1B10') // Deep brown color match
     .font('Helvetica-Bold')
     .fontSize(24)
     .text('INVOICE', 40, 50);

  // Invoice Meta (Right-aligned using column formatting options)
  doc.font('Helvetica')
     .fontSize(10)
     .fillColor('#646464')
     .text(`Invoice ID: #${o.id}`, 350, 45, { width: 205, align: 'right' })
     .text(`Date Issued: ${dateStr}`, 350, 58, { width: 205, align: 'right' })
     .text(`Payment Terms: Net 30`, 350, 71, { width: 205, align: 'right' });

  // Horizontal Rule Line
  doc.moveTo(40, 95)
     .lineTo(rightAlignX, 95)
     .lineWidth(0.5)
     .strokeColor('#F0EAE4')
     .stroke();

  // ── BILLING DETAILS ──
  doc.fillColor('#2B1B10')
     .font('Helvetica-Bold')
     .fontSize(11)
     .text('Billed To:', 40, 115);

  doc.font('Helvetica')
     .fontSize(10)
     .text(user.companyName || 'Valued Customer', 40, 132)
     .text(`Attn: ${user.contactName || 'Procurement Team'}`, 40, 147);
  
  // Wrap and print multi-line delivery address block smoothly
  doc.text(user.deliveryAddress || 'Singapore', 40, 162, { width: 250 });

  // ── TABLE CONSTRUCT ──
  let startY = 230;

  // Render Table Header Background Strip
  doc.rect(40, startY, 515, 20)
     .fill('#FAF8F5');

  // Table Column Typography Headers
  doc.fillColor('#786E64')
     .font('Helvetica-Bold')
     .fontSize(9)
     .text('Item Description', 50, startY + 6)
     .text('Qty (ctn)', 330, startY + 6, { width: 50, align: 'right' })
     .text('Price/ctn', 380, startY + 6, { width: 90, align: 'right' })
     .text('Total Amount', 480, startY + 6, { width: 70, align: 'right' });

  // Print Line Item Loop rows
  let currentY = startY + 20;
  doc.font('Helvetica')
     .fontSize(10)
     .fillColor('#2B1B10');

  o.items.forEach((item) => {
    const itemTotal = item.cartons * item.pricePerCarton;

    // Row Data Output
    doc.text(item.name, 50, currentY + 7, { width: 280 })
       .text(item.cartons.toString(), 330, currentY + 7, { width: 50, align: 'right' })
       .text(`SGD $${item.pricePerCarton.toFixed(2)}`, 380, currentY + 7, { width: 90, align: 'right' })
       .text(`SGD $${itemTotal.toFixed(2)}`, 480, currentY + 7, { width: 70, align: 'right' });

    currentY += 24;

    // Draw row divider lines
    doc.moveTo(40, currentY)
       .lineTo(rightAlignX, currentY)
       .lineWidth(0.5)
       .strokeColor('#000000')
       .stroke();
  });

  // ── SUMMARY FOOTER BLOCK ──
  currentY += 20;
  doc.font('Helvetica-Bold')
     .fontSize(10)
     .text('Total Cartons Ordered:', 320, currentY, { width: 140, align: 'right' });
  doc.font('Helvetica')
     .text(`${o.totalCartons} cartons`, 470, currentY, { width: 80, align: 'right' });

  currentY += 18;
  doc.font('Helvetica-Bold')
     .fontSize(12)
     .text('Grand Total Due (SGD):', 300, currentY, { width: 160, align: 'right' });
  doc.fillColor('#D97706') // Amber accent brand match color
     .text(`$${o.totalAmount.toFixed(2)}`, 470, currentY, { width: 80, align: 'right' });

  // Legal / Terms Footer Notes
  doc.fillColor('#969696')
     .font('Helvetica-Oblique')
     .fontSize(8)
     .text('Thank you for your business! Payment is due within 30 days via GIRO / Corporate PayNow transfers.', 40, currentY + 50, { width: 515, align: 'center' });

  // 3. SECURELY COMPILE AND DOWNLOAD AUTOMATICALLY
  // Instead of an asynchronous stream library event listener, we compile immediately upon ending
  doc.on('end', () => {
    const blob = new Blob(pdfChunks, { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `Invoice_${o.id}.pdf`;
    
    document.body.appendChild(downloadLink);
    downloadLink.click();
    
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
    showToast('Invoice Downloaded', `Saved Invoice #${o.id} successfully.`);
  });

  // Closes the document mapping engine, firing the 'end' event block above
  doc.end();
}


// ── Tab panel renderers ───────────────────────────────────
/** Renders the Overview tab: KPI cards, recent orders, quick links. */
function renderOverview() {
  const my        = getMyOrders();
  const spend     = totalSpend(my);
  const pending   = my.filter(o => o.status === 'pending' || o.status === 'processing').length;
  const creditUsed = Math.min((spend / creditLimit) * 100, 100);
  const nextStatus = my.find(o => o.status === 'shipped') ? 'In Transit'
    : my.find(o => o.status === 'processing') ? 'Being Prepared' : '—';

  document.getElementById('panel-overview').innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon" style="background:#EEF2FF;">🛍️</div>
        <div>
          <div class="kpi-label">Total Orders</div>
          <div class="kpi-num">${my.length}</div>
          <div class="kpi-sub">SGD $${spend.toLocaleString()} lifetime</div>
          ${pending > 0 ? `<span style="font-size:10px;background:#fffbeb;border:1px solid #fde68a;color:#92400e;padding:2px 8px;border-radius:9999px;display:inline-block;margin-top:.35rem;">${pending} active</span>` : ''}
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="background:#EFF6FF;">🚚</div>
        <div>
          <div class="kpi-label">Next Delivery</div>
          <div class="kpi-num" style="font-size:1rem;">${nextStatus}</div>
          <div class="kpi-sub">Est. 3–5 business days</div>
        </div>
      </div>
      <div class="kpi-card" style="flex-direction:column;gap:.75rem;">
        <div style="display:flex;align-items:center;gap:.75rem;">
          <div class="kpi-icon" style="background:#FEF3E2;">💳</div>
          <div>
            <div class="kpi-label">Credit Available</div>
            <div style="color:var(--brown);">SGD $${(creditLimit - spend).toLocaleString()}</div>
          </div>
        </div>
        <div class="credit-bar"><div class="credit-fill" style="width:${creditUsed}%;background:var(--amber);"></div></div>
        <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted-lt);"><span>Used $${spend.toLocaleString()}</span><span>Limit $25,000</span></div>
      </div>
    </div>

    <div class="card" style="margin-bottom:1rem;">
      <div style="padding:1rem 1.5rem;border-bottom:1px solid #F0EAE4;display:flex;align-items:center;justify-content:space-between;">
        <h2 style="font-size:1rem;color:var(--brown);">Recent Orders</h2>
        <button onclick="switchTab('orders')" style="font-size:12px;color:var(--amber);background:none;border:none;cursor:pointer;">View all →</button>
      </div>
      ${orderListHTML(my.slice(0, 3), '-ov')}
    </div>

    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:.75rem;">
      <button onclick="switchTab('profile')" class="quick-link">
        <div style="display:flex;align-items:center;gap:.75rem;">
          <div style="width:36px;height:36px;background:#FEF3E2;border-radius:10px;display:flex;align-items:center;justify-content:center;">👤</div>
          <div style="text-align:left;"><div style="font-size:13px;color:var(--brown);">Business Profile</div><div style="font-size:11px;color:var(--muted);">${user.companyName}</div></div>
        </div>
        <span style="color:var(--muted-lt);">›</span>
      </button>
      <button onclick="switchTab('billing')" class="quick-link">
        <div style="display:flex;align-items:center;gap:.75rem;">
          <div style="width:36px;height:36px;background:#EFF6FF;border-radius:10px;display:flex;align-items:center;justify-content:center;">💳</div>
          <div style="text-align:left;"><div style="font-size:13px;color:var(--brown);">Billing &amp; Address</div><div style="font-size:11px;color:var(--muted);">Net 30 · SGD $25,000 limit</div></div>
        </div>
        <span style="color:var(--muted-lt);">›</span>
      </button>
    </div>`;
}

/** Renders the Orders tab: full order history. */
function renderOrders() {
  const my = getMyOrders();
  document.getElementById('panel-orders').innerHTML = `
    <div class="card">
      <div style="padding:1rem 1.5rem;border-bottom:1px solid #F0EAE4;display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:.75rem;">
          <div style="width:32px;height:32px;background:#F5F0EB;border-radius:10px;display:flex;align-items:center;justify-content:center;">📦</div>
          <div><h2 style="font-size:1rem;color:var(--brown);">Order History</h2><p style="font-size:11px;color:var(--muted);">${my.length} order${my.length !== 1 ? 's' : ''}</p></div>
        </div>
        <a href="catalog.html" style="font-size:12px;color:var(--amber);">+ New Order</a>
      </div>
      ${orderListHTML(my)}
    </div>`;
}

// Profile edit state
let editing = false;

/** Renders the Profile tab in either view or edit mode. */
function renderProfile() {
  const u = Auth.getUser();

  const viewHTML = `
    <div class="card">
      <div style="padding:1rem 1.5rem;border-bottom:1px solid #F0EAE4;display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:.75rem;">
          <div style="width:32px;height:32px;background:#FEF3E2;border-radius:10px;display:flex;align-items:center;justify-content:center;">👤</div>
          <h2 style="font-size:1rem;color:var(--brown);">Business Profile</h2>
        </div>
        <button onclick="startEdit()" class="btn-ghost btn-sm">✏️ Edit</button>
      </div>
      <div style="padding:1.5rem;">
        <div class="profile-grid">
          ${[['Contact Name', u.contactName || '—'], ['Email', u.email || '—', 'Contact support to change'], ['Company Name', u.companyName || '—'], ['Business Type', u.businessType || '—']].map(([l, v, n]) => `
            <div>
              <div class="profile-field-label">${l}</div>
              <div class="profile-field-value">${v}</div>
              ${n ? `<div class="profile-field-note">${n}</div>` : ''}
            </div>`).join('')}
          <div style="grid-column:1/-1;">
            <div class="profile-field-label">Delivery Address</div>
            <div class="profile-field-value">${u.deliveryAddress || '<span style="color:var(--muted-lt);font-style:italic;">Not set — click Edit to add</span>'}</div>
          </div>
        </div>
      </div>
    </div>`;

  const editHTML = `
    <div class="card">
      <div style="padding:1rem 1.5rem;border-bottom:1px solid #F0EAE4;display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:.75rem;">
          <div style="width:32px;height:32px;background:#FEF3E2;border-radius:10px;display:flex;align-items:center;justify-content:center;">👤</div>
          <h2 style="font-size:1rem;color:var(--brown);">Business Profile</h2>
        </div>
        <div style="display:flex;gap:.5rem;">
          <button onclick="cancelEdit()" class="btn-ghost btn-sm">× Cancel</button>
          <button onclick="saveProfile()" class="btn-dark btn-sm">💾 Save</button>
        </div>
      </div>
      <div style="padding:1.5rem;">
        <div id="profile-err" style="display:none;" class="server-err" role="alert"></div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:1rem;">
          <div class="field"><label for="p-contactName">Contact Name</label><input class="input" id="p-contactName" value="${u.contactName || ''}" placeholder="Jane Tan"/></div>
          <div class="field"><label>Email</label><div class="input input-muted">${u.email}</div><p style="font-size:10px;color:var(--muted-lt);margin-top:4px;">Contact support to change</p></div>
          <div class="field"><label for="p-companyName">Company Name</label><input class="input" id="p-companyName" value="${u.companyName || ''}" placeholder="Your Company Pte. Ltd."/></div>
          <div class="field"><label for="p-businessType">Business Type</label>
            <select class="input" id="p-businessType">
              <option value="">Select type…</option>
              ${['Office Manager','Gym Operator','Event Organiser','Café Distributor','Convenience Store','Other'].map(t => `<option ${u.businessType === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="field"><label for="p-address">Delivery Address <span style="color:var(--muted-lt);">(Singapore)</span></label><textarea class="input" id="p-address" rows="2" style="resize:none;" placeholder="10 Anson Road, #22-01, Singapore 079903">${u.deliveryAddress || ''}</textarea></div>
      </div>
    </div>`;

  document.getElementById('panel-profile').innerHTML = editing ? editHTML : viewHTML;
}

function startEdit()  { editing = true;  renderProfile(); }
function cancelEdit() { editing = false; renderProfile(); }

/** Validates and saves profile changes to localStorage via Auth. */
function saveProfile() {
  const contactName    = document.getElementById('p-contactName').value.trim();
  const companyName    = document.getElementById('p-companyName').value.trim();
  const businessType   = document.getElementById('p-businessType').value;
  const deliveryAddress = document.getElementById('p-address').value.trim();
  const errEl          = document.getElementById('profile-err');

  // Inline validation
  if (!contactName)         { errEl.textContent = '⚠️ Contact name is required.';                        errEl.style.display = 'flex'; return; }
  if (companyName.length < 2) { errEl.textContent = '⚠️ Company name must be at least 2 characters.'; errEl.style.display = 'flex'; return; }
  if (!businessType)        { errEl.textContent = '⚠️ Please select a business type.';                  errEl.style.display = 'flex'; return; }

  const updatedUser = { ...Auth.getUser(), contactName, companyName, businessType, deliveryAddress };
  Auth.setUser(updatedUser);
  
  // Asynchronously synchronize profile updates to the live database if active
  Auth.updateProfileOnSupabase(updatedUser);

  editing = false;
  showToast('Profile updated', 'Your account details have been saved.');
  initHero();
  renderAll();
}

/** Renders the Billing tab: payment terms, credit bar, delivery address. */
function renderBilling() {
  const my    = getMyOrders();
  const spend = totalSpend(my);
  const avail = creditLimit - spend;
  const used  = Math.min((spend / creditLimit) * 100, 100);
  const u     = Auth.getUser();

  // Credit bar colour: red >80%, amber >50%, default amber otherwise
  const barColor = used > 80 ? '#f87171' : used > 50 ? '#fbbf24' : 'var(--amber)';

  document.getElementById('panel-billing').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:1rem;">
      <div class="card" style="padding:1.5rem;">
        <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1.25rem;">
          <div style="width:36px;height:36px;background:#FEF3E2;border-radius:10px;display:flex;align-items:center;justify-content:center;">💳</div>
          <h3 style="color:var(--brown);">Payment Terms</h3>
        </div>
        ${[['Payment Terms','Net 30',false],['Credit Limit','SGD $25,000',false],['Available Credit',`SGD $${avail.toLocaleString()}`,true],['Used',`SGD $${spend.toLocaleString()}`,false]].map(([l,v,g]) =>
          `<div class="billing-row"><span style="color:var(--brown-lt);">${l}</span><span style="${g ? 'color:#16a34a;' : 'color:var(--brown);'}">${v}</span></div>`
        ).join('')}
        <div style="margin-top:1rem;">
          <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-bottom:.35rem;"><span>Credit utilisation</span><span>${Math.round(used)}%</span></div>
          <div class="credit-bar"><div class="credit-fill" style="width:${used}%;background:${barColor};"></div></div>
        </div>
      </div>
      <div class="card" style="padding:1.5rem;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;">
          <div style="display:flex;align-items:center;gap:.75rem;">
            <div style="width:36px;height:36px;background:#EFF6FF;border-radius:10px;display:flex;align-items:center;justify-content:center;">📍</div>
            <h3 style="color:var(--brown);">Delivery Address</h3>
          </div>
          <button onclick="switchTab('profile');startEdit();" style="font-size:12px;color:var(--amber);background:none;border:none;cursor:pointer;">✏️ Edit</button>
        </div>
        <div style="background:#FAF8F5;border:1px solid #F0EAE4;border-radius:12px;padding:1rem;font-size:13px;color:var(--brown-lt);">
          ${u.companyName ? `<div style="color:var(--brown);margin-bottom:.25rem;">${u.companyName}</div>` : ''}
          ${u.deliveryAddress || '<span style="color:var(--muted-lt);font-style:italic;">No address saved yet.</span>'}
        </div>
      </div>
    </div>`;
}

/** Re-renders all tab panels and updates the order count badge. */
function renderAll() {
  renderOverview();
  renderOrders();
  renderProfile();
  renderBilling();
  const count = getMyOrders().length;
  document.getElementById('order-count-badge').textContent = count > 0 ? count : '';
}


// ── Tab switching ─────────────────────────────────────────
/**
 * Shows the requested tab panel and hides all others.
 * Also updates ARIA attributes for accessibility.
 */
function switchTab(name) {
  ['overview', 'orders', 'profile', 'billing'].forEach(t => {
    document.getElementById('panel-' + t).style.display = t === name ? 'block' : 'none';
    const btn = document.getElementById('tab-' + t);
    btn.classList.toggle('active', t === name);
    btn.setAttribute('aria-selected', t === name);
  });
}

// Wire up tab buttons
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});


// ── Initialise ────────────────────────────────────────────
initHero();

// Async database load
(async () => {
  try {
    if (typeof Orders !== 'undefined' && Orders.getAll) {
      await Orders.getAll();
      renderAll();
    }
  } catch (err) {
    console.error("Failed to load orders on load:", err);
  }
})();

renderAll();
switchTab('overview');
