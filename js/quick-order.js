/* ============================================================
   quick-order.js — Logic for quick-order.html
   Depends on: shared.js (Auth, Products, Orders, getActiveTier,
                          miniPouchSVG, buildNav, buildFooter,
                          requireAuth)
   ============================================================ */

// ── Auth & initialisation ─────────────────────────────────
requireAuth();
buildNav('quick-order');
buildFooter();

const user       = Auth.getUser();
const active     = Products.filter(p => p.active);
const comingSoon = Products.filter(p => !p.active);

// Per-product quantity state: { productId: number }
let quantities = {};

/** Returns the current quantity for a product (0 if not set). */
function getQty(id) { return quantities[id] || 0; }

/** Updates quantity for a product and re-renders the full UI. */
function setQty(id, val) {
  const n = Math.max(0, parseInt(val) || 0);
  if (n <= 0) { delete quantities[id]; } else { quantities[id] = n; }
  renderAll();
}


// ── Tier progress bar calculation ─────────────────────────
/**
 * Returns a CSS width string showing progress towards the next tier.
 * Stays at 100% once the maximum tier is reached.
 */
function tierBarWidth(product, qty) {
  if (qty === 0) return '0%';
  const idx = product.tiers.findIndex(t => t.min === getActiveTier(product.tiers, qty).min);
  if (idx === product.tiers.length - 1) return '100%';
  const curr = product.tiers[idx];
  const next = product.tiers[idx + 1];
  // Interpolate within the current tier range (mapped to 40% of bar per tier)
  const pct = ((qty - curr.min) / (next.min - curr.min)) * 60 + idx * 40;
  return Math.min(pct, 95) + '%';
}


// ── Product row renderer ──────────────────────────────────
/**
 * Builds HTML for all product rows (active + coming soon).
 * Active rows include a stepper and tier progress bar.
 * Coming-soon rows are dimmed and non-interactive.
 */
function renderProductRows() {
  document.getElementById('product-rows').innerHTML = [
    // Active products with full ordering UI
    ...active.map(p => {
      const qty      = getQty(p.id);
      const tier     = getActiveTier(p.tiers, qty);
      const tierIdx  = p.tiers.findIndex(t => t.min === tier.min);
      const nextTier = p.tiers[tierIdx + 1];
      const subtotal = qty > 0 ? qty * tier.price : 0;
      const pct      = tierIdx > 0 ? Math.round((1 - tier.price / p.tiers[0].price) * 100) : 0;

      return `<div class="product-row-card" role="listitem">
        <div class="product-row-top">
          <div class="product-row-icon" style="background:${p.pouchColor}22;">${miniPouchSVG(p.pouchColor, p.pouchAccent, 28)}</div>
          <div style="flex:1;min-width:0;">
            <div style="color:var(--brown);">${p.name}</div>
            <div style="font-size:12px;color:var(--muted);">${p.subtitle}</div>
          </div>
          <div style="text-align:right;flex-shrink:0;">
            <div style="color:var(--brown);">SGD $${tier.price}<span style="font-size:11px;color:var(--muted);">/ctn</span></div>
            ${pct ? `<div style="font-size:10px;color:#16a34a;">−${pct}% tier</div>` : ''}
          </div>
        </div>
        <div class="product-row-body">
          <!-- Tier progress bar -->
          <div>
            <div class="tier-strip-labels">
              ${p.tiers.map((t, i) => `<span style="${i === tierIdx && qty > 0 ? 'color:var(--amber);font-weight:500;' : ''}">${t.max ? `${t.min}–${t.max}` : `${t.min}+`} ctn</span>`).join('')}
            </div>
            <div class="tier-strip-bar"><div class="tier-strip-fill" style="width:${tierBarWidth(p, qty)};"></div></div>
            ${nextTier && qty > 0 ? `<p class="tier-strip-hint">+${nextTier.min - qty} cartons → unlock <strong>$${nextTier.price}/ctn</strong> (−${Math.round((1 - nextTier.price / p.tiers[0].price) * 100)}%)</p>` : ''}
          </div>
          <!-- Quantity stepper -->
          <div style="display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;">
            <div class="stepper">
              <button class="stepper-btn" onclick="setQty('${p.id}', ${Math.max(0, qty - 1)})" ${qty === 0 ? 'disabled' : ''} aria-label="Decrease quantity">−</button>
              <input class="stepper-input" type="number" min="0" value="${qty || ''}" placeholder="0"
                onchange="setQty('${p.id}', this.value)"
                aria-label="Quantity in cartons"/>
              <button class="stepper-btn" onclick="setQty('${p.id}', ${qty + 1})" aria-label="Increase quantity">+</button>
            </div>
            <span style="font-size:12px;color:var(--muted);">cartons · 50 pouches each</span>
            ${qty > 0 ? `<div class="subtotal-pill" style="margin-left:auto;">
              <div style="color:var(--amber);">SGD $${subtotal.toFixed(2)}</div>
              <div style="font-size:10px;color:var(--muted);">${qty * 50} pouches</div>
            </div>` : ''}
          </div>
        </div>
      </div>`;
    }),

    // Coming-soon products — dimmed, no stepper
    ...comingSoon.map(p => `
      <div class="coming-row">
        <div class="coming-row-inner">
          <div class="product-row-icon" style="background:${p.pouchColor}22;">${miniPouchSVG(p.pouchColor, p.pouchAccent, 28)}</div>
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:.5rem;">
              <span style="color:var(--brown);">${p.name}</span>
              <span class="coming-tag">Coming Soon</span>
            </div>
            <div style="font-size:12px;color:var(--muted);">${p.comingSoonHint}</div>
          </div>
          <div style="font-size:12px;color:var(--muted-lt);">from SGD $${p.tiers[0]?.price}/ctn</div>
        </div>
      </div>`)
  ].join('');
}


// ── Order summary sidebar renderer ────────────────────────
/** Rebuilds the sidebar summary with current quantities and totals. */
function renderSummary() {
  const lines = active.filter(p => getQty(p.id) > 0).map(p => {
    const qty  = getQty(p.id);
    const tier = getActiveTier(p.tiers, qty);
    return { p, qty, tier, subtotal: qty * tier.price };
  });

  const hasLines = lines.length > 0;
  const totalCtn = lines.reduce((s, l) => s + l.qty, 0);
  const totalAmt = lines.reduce((s, l) => s + l.subtotal, 0);
  const baseAmt  = lines.reduce((s, l) => s + l.qty * l.p.tiers[0].price, 0);
  const savings  = baseAmt - totalAmt; // volume discount saving

  // Toggle empty state and button states
  document.getElementById('empty-summary').style.display   = hasLines ? 'none' : 'block';
  document.getElementById('place-order-btn').disabled      = !hasLines;
  document.getElementById('clear-all-btn').disabled        = !hasLines;

  if (hasLines) {
    document.getElementById('summary-lines').innerHTML = lines.map(({ p, qty, tier, subtotal }) => `
      <div class="summary-line">
        <div class="summary-dot" style="background:${p.pouchColor};"></div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:11px;color:var(--brown);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p.name}</div>
          <div style="font-size:10px;color:var(--muted);">${qty} ctn × SGD $${tier.price}</div>
        </div>
        <span style="font-size:12px;color:var(--brown);white-space:nowrap;">SGD $${subtotal.toFixed(2)}</span>
      </div>`).join('');

    document.getElementById('summary-totals').style.display = 'flex';
    document.getElementById('summary-totals').innerHTML = `
      <div class="summary-total-row"><span>Cartons</span><span>${totalCtn}</span></div>
      <div class="summary-total-row"><span>Pouches</span><span>${(totalCtn * 50).toLocaleString()}</span></div>
      ${savings > 0 ? `<div class="savings-row"><span>✨ Volume savings</span><span>−SGD $${savings.toFixed(2)}</span></div>` : ''}
      <div class="summary-total-row" style="font-size:14px;color:var(--brown);border-top:1px solid #F0EAE4;padding-top:.5rem;margin-top:.15rem;">
        <span>Total</span><span style="color:var(--amber);font-size:1.1rem;">SGD $${totalAmt.toFixed(2)}</span>
      </div>`;
  } else {
    document.getElementById('summary-lines').innerHTML        = '';
    document.getElementById('summary-totals').style.display  = 'none';
  }
}

/** Renders both the product list and the summary sidebar. */
function renderAll() { renderProductRows(); renderSummary(); }


// ── Place order ───────────────────────────────────────────
document.getElementById('place-order-btn').addEventListener('click', () => {
  const lines = active.filter(p => getQty(p.id) > 0).map(p => {
    const qty  = getQty(p.id);
    const tier = getActiveTier(p.tiers, qty);
    return { p, qty, tier, subtotal: qty * tier.price };
  });
  if (!lines.length || !user) return;

  const totalCtn = lines.reduce((s, l) => s + l.qty, 0);
  const totalAmt = lines.reduce((s, l) => s + l.subtotal, 0);

  Orders.add({
    company: user.companyName,
    contactName: user.contactName,
    businessType: user.businessType,
    items: lines.map(({ p, qty, tier }) => ({ sku: p.sku, name: p.name, cartons: qty, pricePerCarton: tier.price })),
    totalCartons: totalCtn,
    totalAmount: totalAmt,
    status: 'pending',
    deliveryAddress: user.deliveryAddress || '',
  });

  // Show success screen, then reset after 3.5s
  document.getElementById('success-summary').textContent = `${totalCtn} cartons · ${totalCtn * 50} pouches · SGD $${totalAmt.toFixed(2)}`;
  document.getElementById('qo-main').style.display       = 'none';
  document.getElementById('success-state').style.display = 'flex';

  quantities = {};
  setTimeout(() => {
    document.getElementById('success-state').style.display = 'none';
    document.getElementById('qo-main').style.display       = 'block';
    renderAll();
  }, 3500);
});

// Clear all quantities
document.getElementById('clear-all-btn').addEventListener('click', () => {
  quantities = {};
  renderAll();
});


// ── Initialise ────────────────────────────────────────────
renderAll();
