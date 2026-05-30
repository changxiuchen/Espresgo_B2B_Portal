/* ============================================================
   login.js — Logic for login.html
   Depends on: shared.js (Auth, Products, pouchSVG)
   ============================================================ */

// ── Redirect if already logged in ────────────────────────
if (Auth.isLoggedIn()) window.location.href = 'catalog.html';


// ── Decorative pouch trio on the brand panel ──────────────
// Three pouches at different angles for visual appeal
const pouchConfigs = [
  { rotate: -8, ty: 8, opacity: 0.45 },
  { rotate:  0, ty: 0, opacity: 0.85 },
  { rotate:  7, ty: 8, opacity: 0.45 },
];

const trio = document.getElementById('pouch-trio');
if (trio) {
  pouchConfigs.forEach((p, i) => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `transform:rotate(${p.rotate}deg) translateY(${p.ty}px);opacity:${p.opacity};`;
    wrapper.innerHTML = `<svg width="${i === 1 ? 80 : 62}" height="${i === 1 ? 120 : 93}" viewBox="0 0 36 54" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="0" width="8" height="6" rx="2" fill="#8B3A00"/>
      <path d="M10 6 Q8 9 8 12 L28 12 Q28 9 26 6 Z" fill="#C8580A"/>
      <rect x="4" y="12" width="28" height="36" rx="6" fill="#C8580A"/>
      <rect x="4" y="44" width="28" height="4" rx="3" fill="#8B3A00"/>
      <rect x="7" y="16" width="22" height="26" rx="4" fill="#8B3A00" opacity="0.15"/>
      <text x="18" y="27" text-anchor="middle" font-size="4" font-weight="700" font-family="sans-serif" fill="#8B3A00" letter-spacing="0.3">ESPRESSGO</text>
    </svg>`;
    trio.appendChild(wrapper);
  });
}


// ── Tab state (Sign In vs Register) ───────────────────────
let isLogin = true; // true = sign-in mode, false = register mode

/**
 * Switches the form between Sign In and Register mode.
 * Shows/hides register-only fields and updates labels.
 */
function switchMode(toLogin) {
  isLogin = toLogin;
  document.getElementById('register-fields').style.display = toLogin ? 'none' : 'block';
  document.getElementById('confirm-field').style.display   = toLogin ? 'none' : 'block';
  document.getElementById('strength-wrap').style.display   = toLogin ? 'none' : 'block';
  document.getElementById('forgot-btn').style.display      = toLogin ? 'inline' : 'none';
  document.getElementById('form-title').textContent        = toLogin ? 'Welcome back' : 'Create account';
  document.getElementById('form-subtitle').textContent     = toLogin ? 'Sign in to your wholesale account.' : 'Join the ESPRESSGO buyer network.';
  document.getElementById('auth-label').textContent        = toLogin ? 'Sign In' : 'Create Account';
  document.getElementById('f-password').autocomplete       = toLogin ? 'current-password' : 'new-password';
  document.getElementById('f-password').placeholder        = toLogin ? '••••••••' : 'Min 8 characters';
  document.getElementById('server-err').style.display = 'none';
  clearErrors();
}

// Wire tab buttons
document.getElementById('tab-signin').addEventListener('click', () => {
  document.getElementById('tab-signin').classList.add('active');
  document.getElementById('tab-signin').setAttribute('aria-selected', 'true');
  document.getElementById('tab-register').classList.remove('active');
  document.getElementById('tab-register').setAttribute('aria-selected', 'false');
  switchMode(true);
});
document.getElementById('tab-register').addEventListener('click', () => {
  document.getElementById('tab-register').classList.add('active');
  document.getElementById('tab-register').setAttribute('aria-selected', 'true');
  document.getElementById('tab-signin').classList.remove('active');
  document.getElementById('tab-signin').setAttribute('aria-selected', 'false');
  switchMode(false);
});


// ── Password show/hide toggle ─────────────────────────────
/**
 * Creates a click handler that toggles an input between
 * password and plain-text display.
 */
function makeToggle(toggleId, inputId) {
  document.getElementById(toggleId).addEventListener('click', () => {
    const inp = document.getElementById(inputId);
    inp.type = inp.type === 'password' ? 'text' : 'password';
  });
}
makeToggle('pw-toggle-1', 'f-password');
makeToggle('pw-toggle-2', 'f-confirm');


// ── Password strength indicator ───────────────────────────
document.getElementById('f-password').addEventListener('input', () => {
  if (isLogin) return; // only show during registration

  const pw     = document.getElementById('f-password').value;
  const len    = pw.length;
  // Score 1–4 based on length; a real app would check complexity too
  const score  = len >= 12 ? 4 : len >= 10 ? 3 : len >= 8 ? 2 : len > 0 ? 1 : 0;
  const colors = ['', '#f87171', '#fbbf24', '#facc15', '#4ade80'];
  const labels = ['', 'Too short', 'Fair', 'Good', 'Strong'];

  for (let i = 1; i <= 4; i++) {
    document.getElementById('s' + i).style.background = i <= score ? colors[score] : '#E0D5C8';
  }
  document.getElementById('strength-label').textContent = labels[score] || '';
});


// ── Form validation helpers ───────────────────────────────
/** Shows an error message below a specific field. */
function showErr(field, msg) {
  const el  = document.getElementById('err-' + field);
  if (!el) return;
  el.textContent = '⚠ ' + msg;
  el.style.display = 'flex';
  const inp = document.getElementById('f-' + field);
  if (inp) inp.classList.add('error');
}

/** Clears all inline field error messages. */
function clearErrors() {
  ['contactName', 'companyName', 'businessType', 'email', 'password', 'confirm'].forEach(k => {
    const e = document.getElementById('err-' + k);
    if (e) e.style.display = 'none';
    const i = document.getElementById('f-' + k);
    if (i) i.classList.remove('error');
  });
}


// ── Form submit handler ───────────────────────────────────
document.getElementById('auth-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();
  document.getElementById('server-err').style.display = 'none';

  // Collect values
  const email        = document.getElementById('f-email').value.trim();
  const password     = document.getElementById('f-password').value;
  const confirm      = document.getElementById('f-confirm').value;
  const contactName  = document.getElementById('f-contactName')?.value.trim() || '';
  const companyName  = document.getElementById('f-companyName')?.value.trim() || '';
  const businessType = document.getElementById('f-businessType')?.value || '';

  // Validate
  let valid = true;
  if (!isLogin) {
    if (!contactName)                       { showErr('contactName', 'Contact name is required.'); valid = false; }
    if (!companyName || companyName.length < 2) { showErr('companyName', 'Enter your company name (min 2 chars).'); valid = false; }
    if (!businessType)                      { showErr('businessType', 'Please select your business type.'); valid = false; }
  }
  if (!email)                               { showErr('email', 'Email address is required.'); valid = false; }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showErr('email', 'Enter a valid email address.'); valid = false; }
  if (!password)                            { showErr('password', 'Password is required.'); valid = false; }
  else if (!isLogin && password.length < 8) { showErr('password', 'Password must be at least 8 characters.'); valid = false; }
  if (!isLogin && password && confirm !== password) { showErr('confirm', 'Passwords do not match.'); valid = false; }
  if (!valid) return;

  // Show loading spinner
  document.getElementById('auth-label').style.display   = 'none';
  document.getElementById('auth-spinner').style.display = 'inline-block';
  document.getElementById('auth-submit').disabled       = true;

  // Simulate async (network delay)
  await new Promise(r => setTimeout(r, 600));

  // Call Auth helper
  let result;
  if (isLogin) {
    result = await Auth.login(email, password);
  } else {
    result = await Auth.register(email, password, companyName, businessType, contactName);
  }

  if (result.ok) {
    if (result.isAdmin) {
      window.location.href = 'admin/admin-dashboard.html';
    } else {
      window.location.href = 'catalog.html';
    }
  } else {
    document.getElementById('server-err-text').textContent = result.error || 'Something went wrong. Please try again.';
    document.getElementById('server-err').style.display    = 'flex';
    document.getElementById('auth-label').style.display    = 'inline';
    document.getElementById('auth-spinner').style.display  = 'none';
    document.getElementById('auth-submit').disabled        = false;
  }
});


// ── Initialise in Sign In mode ────────────────────────────
switchMode(true);
