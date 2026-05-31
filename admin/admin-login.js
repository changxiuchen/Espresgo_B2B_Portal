/* ============================================================
   admin-login.js — Supabase admin login
   Depends on:
   - ../supabase-config.js
   - ../shared.js

   This file logs in through Supabase Auth, then checks whether
   the logged-in profile has role = "admin".
   ============================================================ */


/* ============================================================
   DOM elements
   ============================================================ */

const form = document.getElementById('admin-form');

const emailInput = document.getElementById('a-email');
const passwordInput = document.getElementById('a-pw');

const serverErr = document.getElementById('server-err');
const errEmail = document.getElementById('err-email');
const errPw = document.getElementById('err-pw');

const submitBtn = document.getElementById('admin-submit');
const adminLabel = document.getElementById('admin-label');
const adminSpinner = document.getElementById('admin-spinner');


/* ============================================================
   Redirect if already logged in as admin
   ============================================================ */

(async function checkExistingAdminSession() {
  try {
    const profile = await Auth.refreshUser();

    if (profile && profile.role === 'admin') {
      localStorage.setItem('espressgo_admin', 'true');
      window.location.href = 'admin-dashboard.html';
    }
  } catch (error) {
    console.warn('No active admin session:', error);
  }
})();


/* ============================================================
   Password visibility toggle
   ============================================================ */

function togglePw() {
  if (!passwordInput) return;

  passwordInput.type =
    passwordInput.type === 'password'
      ? 'text'
      : 'password';
}

window.togglePw = togglePw;


/* ============================================================
   Error helpers
   ============================================================ */

function showError(element, message) {
  if (!element) return;

  element.textContent = message;
  element.style.display = 'block';
}


function clearErrors() {
  if (serverErr) {
    serverErr.style.display = 'none';
    serverErr.textContent = '';
  }

  if (errEmail) {
    errEmail.style.display = 'none';
    errEmail.textContent = '';
  }

  if (errPw) {
    errPw.style.display = 'none';
    errPw.textContent = '';
  }

  if (emailInput) {
    emailInput.classList.remove('error');
  }

  if (passwordInput) {
    passwordInput.classList.remove('error');
  }
}


function showServerError(message) {
  if (!serverErr) return;

  serverErr.textContent = message;
  serverErr.style.display = 'flex';
}


function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


/* ============================================================
   Loading state
   ============================================================ */

function setLoading(isLoading) {
  if (submitBtn) {
    submitBtn.disabled = isLoading;
  }

  if (adminLabel) {
    adminLabel.style.display = isLoading ? 'none' : 'inline';
  }

  if (adminSpinner) {
    adminSpinner.style.display = isLoading ? 'inline-block' : 'none';
  }
}


/* ============================================================
   Form submit
   ============================================================ */

form.addEventListener('submit', async function (event) {
  event.preventDefault();

  clearErrors();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  let valid = true;

  if (!email) {
    showError(errEmail, 'Email is required.');
    emailInput.classList.add('error');
    valid = false;
  } else if (!isValidEmail(email)) {
    showError(errEmail, 'Enter a valid email address.');
    emailInput.classList.add('error');
    valid = false;
  }

  if (!password) {
    showError(errPw, 'Password is required.');
    passwordInput.classList.add('error');
    valid = false;
  }

  if (!valid) return;

  setLoading(true);

  let result;

  try {
    result = await Auth.login(email, password);
  } catch (error) {
    console.error('Admin login failed:', error);

    result = {
      ok: false,
      error: error.message || 'Login failed. Please try again.'
    };
  }

  if (!result.ok) {
    showServerError(result.error || 'Invalid admin email or password.');
    setLoading(false);
    return;
  }

  const profile = Auth.getUser();

  if (!profile || profile.role !== 'admin') {
    await Auth.logout();

    showServerError('Access denied. This account is not an admin account.');
    setLoading(false);
    return;
  }

  localStorage.setItem('espressgo_admin', 'true');

  window.location.href = 'admin-dashboard.html';
});