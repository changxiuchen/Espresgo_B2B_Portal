/* shared.js — navigation, auth, toast, shared state */
/* ============================================================
   This file manages:
   - Navigation rendering + active state
   - Simple localStorage-based auth (demo)
   - Shared product data
   - Shared order data
   - Toast notifications
   ============================================================ */

<<<<<<< HEAD
<<<<<<< HEAD
// ── Supabase Configuration ───────────────────────────────────
// Replace placeholders with your live credentials in production
const SUPABASE_URL = "https://aynwtgkmrymnrhzashtf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_stk65gIeVJPmtvdRM4tKDQ_FRIyop5P";

const isSupabaseEnabled = SUPABASE_URL && SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';
let supabase = null;

if (isSupabaseEnabled) {
  console.log("⚡ Supabase integration active.");
} else {
  console.log("ℹ️ Running in Mock LocalStorage Mode. Set SUPABASE_URL/KEY in shared.js to activate Supabase.");
}

// Dynamic script loader for browser CDN
function loadSupabaseSDK() {
  return new Promise((resolve) => {
    if (!isSupabaseEnabled) { resolve(null); return; }
    if (window.supabase) { resolve(window.supabase); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = () => resolve(window.supabase);
    script.onerror = () => {
      console.warn("⚠️ Failed to load Supabase SDK from CDN. Falling back to Mock mode.");
      resolve(null);
    };
    document.head.appendChild(script);
  });
}

// On-demand Supabase client lazy-initialization
async function getSupabaseClient() {
  if (supabase) return supabase;
  const sdk = await loadSupabaseSDK();
  if (sdk) {
    try {
      supabase = sdk.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      return supabase;
    } catch (err) {
      console.error("⚠️ Supabase initialization failed:", err);
      return null;
    }
  }
  return null;
}
=======
=======
>>>>>>> parent of d1e893d (update)
// ── Supabase Initialization & Setup ─────────────────────────
// Drop your live Supabase credentials here to activate real authentication and PostgreSQL storage!
const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";

let supabase = null;
const isSupabaseEnabled = SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL !== "YOUR_SUPABASE_URL" && SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY";

if (isSupabaseEnabled) {
  try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("🔌 Supabase Integration Enabled.");
  } catch (err) {
    console.error("❌ Failed to initialize Supabase client:", err);
  }
} else {
  console.log("ℹ️ Running in Mock LocalStorage Mode. Set SUPABASE_URL & SUPABASE_ANON_KEY in shared.js to activate.");
}

// Helper to keep localStorage user cache in sync with Supabase auth state automatically
if (isSupabaseEnabled && supabase) {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (profile) {
        localStorage.setItem('espressgo_user', JSON.stringify({
          email: profile.email,
          companyName: profile.company_name,
          contactName: profile.contact_name,
          businessType: profile.business_type,
          deliveryAddress: profile.delivery_address || ''
        }));
        if (profile.is_admin) {
          localStorage.setItem('espressgo_admin', 'true');
        }
      }
    } else if (event === 'SIGNED_OUT') {
      localStorage.removeItem('espressgo_user');
      localStorage.removeItem('espressgo_admin');
    }
  });
}
<<<<<<< HEAD
>>>>>>> parent of d1e893d (update)
=======
>>>>>>> parent of d1e893d (update)

// ── Auth helpers ─────────────────────────────────────────────
const Auth = {
  getUser() {
    try { return JSON.parse(localStorage.getItem('espressgo_user') || 'null'); } catch { return null; }
  },
  setUser(u) { 
    localStorage.setItem('espressgo_user', JSON.stringify(u)); 
    // Sync to Supabase profiles database table if logged in and enabled
    if (isSupabaseEnabled && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          supabase.from('profiles').update({
            company_name: u.companyName,
            contact_name: u.contactName,
            business_type: u.businessType,
            delivery_address: u.deliveryAddress
          }).eq('id', session.user.id).then(({ error }) => {
            if (error) console.error("Error updating profile in database:", error);
          });
        }
      });
    }
  },
  clearUser() { 
    localStorage.removeItem('espressgo_user'); 
    localStorage.removeItem('espressgo_admin');
  },
  isLoggedIn() { return !!this.getUser(); },
  
  async login(email, password) {
<<<<<<< HEAD
<<<<<<< HEAD
    const client = await getSupabaseClient();
    if (!client) {
      // Mock mode fallback
      if (email === 'admin@espressgo.sg' && password === 'admin123') {
        localStorage.setItem('espressgo_admin', 'true');
        this.setUser({ email, companyName: 'ESPRESSGO Admin', contactName: 'System Admin', businessType: 'Admin', deliveryAddress: 'Admin HQ, Singapore' });
        return { ok: true, isAdmin: true };
      }
      const saved = this.getUser();
      if (email === 'test@gmail.com' && password === '123') {
        this.setUser({ email, companyName: 'Demo Company', contactName: 'Demo User', businessType: 'Office Manager', deliveryAddress: '1 Marina Boulevard, Singapore 018989' });
        return { ok: true };
      }
      if (saved && saved.email === email && saved._pw === password) return { ok: true };
      return { ok: false, error: 'Invalid email or password.' };
=======
=======
>>>>>>> parent of d1e893d (update)
    if (isSupabaseEnabled && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { ok: false, error: error.message };

      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileErr || !profile) {
        return { ok: false, error: "Failed to load user profile details." };
      }

      const clientProfile = {
        email: profile.email,
        companyName: profile.company_name,
        contactName: profile.contact_name,
        businessType: profile.business_type,
        deliveryAddress: profile.delivery_address || ''
      };

      this.setUser(clientProfile);
      if (profile.is_admin) {
        localStorage.setItem('espressgo_admin', 'true');
        return { ok: true, isAdmin: true };
      }
      return { ok: true };
    }

    // Mock mode fallback
    if (email === 'admin@espressgo.sg' && password === 'admin123') {
      localStorage.setItem('espressgo_admin', 'true');
      this.setUser({ email, companyName: 'ESPRESSGO Admin', contactName: 'System Admin', businessType: 'Admin', deliveryAddress: 'Admin HQ, Singapore' });
      return { ok: true, isAdmin: true };
>>>>>>> parent of d1e893d (update)
    }

    // Live Supabase Mode
    try {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) return { ok: false, error: error.message };

      // Load matching profile data from public.profiles table
      const { data: profile, error: pError } = await client
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (pError) {
        console.error("⚠️ Failed to load user profile from database:", pError.message);
        // Fallback local user structure
        const localUser = { email, contactName: email.split('@')[0], companyName: 'N/A', businessType: 'N/A', deliveryAddress: '' };
        this.setUser(localUser);
        return { ok: true };
      }

      const isAdmin = profile.role === 'admin';
      if (isAdmin) localStorage.setItem('espressgo_admin', 'true');
      
      const localUser = {
        email: profile.email || email,
        companyName: profile.company_name,
        contactName: profile.contact_name,
        businessType: profile.business_type,
        deliveryAddress: profile.delivery_address || ''
      };
      this.setUser(localUser);
      return { ok: true, isAdmin };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  async register(email, password, companyName, businessType, contactName) {
    const client = await getSupabaseClient();
    if (!client) {
      // Mock mode fallback
      this.setUser({ email, companyName, contactName, businessType, deliveryAddress: '', _pw: password });
      return { ok: true };
    }
<<<<<<< HEAD

    // Live Supabase Mode
    try {
      const { data, error } = await client.auth.signUp({
=======
    if (saved && saved.email === email && saved._pw === password) return { ok: true };
    return { ok: false, error: 'Invalid email or password.' };
  },
  async register(email, password, companyName, businessType, contactName) {
    if (isSupabaseEnabled && supabase) {
      const { data, error } = await supabase.auth.signUp({
<<<<<<< HEAD
>>>>>>> parent of d1e893d (update)
=======
>>>>>>> parent of d1e893d (update)
        email,
        password,
        options: {
          data: {
<<<<<<< HEAD
<<<<<<< HEAD
            contactName,
            companyName,
            businessType,
            deliveryAddress: ''
          }
        }
      });

      if (error) return { ok: false, error: error.message };

      // Wait a moment for PostgreSQL triggers to insert the public.profiles record
      await new Promise(r => setTimeout(r, 600));

      const localUser = { email, companyName, contactName, businessType, deliveryAddress: '' };
      this.setUser(localUser);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
=======
=======
>>>>>>> parent of d1e893d (update)
            contact_name: contactName,
            company_name: companyName,
            business_type: businessType
          }
        }
      });
      if (error) return { ok: false, error: error.message };
      return { ok: true, message: "Please check your email for confirmation." };
    }

    // Mock mode fallback
    this.setUser({ email, companyName, contactName, businessType, deliveryAddress: '', _pw: password });
    return { ok: true };
>>>>>>> parent of d1e893d (update)
  },

  async logout() {
    if (isSupabaseEnabled && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error("Error signing out from Supabase:", err);
      }
    }
    this.clearUser();
    const client = await getSupabaseClient();
    if (client) {
      await client.auth.signOut();
    }
  },

  async updateProfileOnSupabase(fields) {
    const client = await getSupabaseClient();
    if (!client) return true;

    try {
      const { data: { user } } = await client.auth.getUser();
      if (!user) return false;

      const { error } = await client
        .from('profiles')
        .update({
          contact_name: fields.contactName,
          company_name: fields.companyName,
          business_type: fields.businessType,
          delivery_address: fields.deliveryAddress,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error("⚠️ Failed to update profile on Supabase:", error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error("⚠️ Exception updating profile on Supabase:", err);
      return false;
    }
  }
};

// ── Product data ─────────────────────────────────────────────
const Products = [
  {
    id: 'espressgo-original',
    sku: 'ESG-OG-001',
    name: 'ESPRESSGO Original',
    subtitle: 'Classic Vietnamese cold brew gel shot',
    caffeine: '~65mg caffeine',
    format: 'Gel pouch · 25ml',
    shelfLife: '12-month shelf life',
    pouchColor: '#C8580A',
    pouchAccent: '#8B3A00',
    labelColor: '#F5E0C8',
    active: true,
    tiers: [
      { min: 1, max: 9, price: 120 },
      { min: 10, max: 29, price: 108 },
      { min: 30, max: null, price: 96 },
    ],
  },
  {
    id: 'espressgo-oatmilk',
    sku: 'ESG-OAT-002',
    name: 'ESPRESSGO Oat Milk',
    subtitle: 'Creamy oat milk cold brew blend',
    caffeine: '~60mg caffeine',
    format: 'Gel pouch · 30ml',
    shelfLife: '10-month shelf life',
    pouchColor: '#D4956A',
    pouchAccent: '#8B5B3A',
    labelColor: '#FFF0E0',
    active: true,
    tiers: [
      { min: 1, max: 9, price: 130 },
      { min: 10, max: 29, price: 117 },
      { min: 30, max: null, price: 104 },
    ],
  },
  {
    id: 'espressgo-matcha',
    sku: 'ESG-MTG-003',
    name: 'ESPRESSGO Matcha',
    subtitle: 'Japanese matcha energy gel shot',
    caffeine: '~40mg caffeine',
    format: 'Gel pouch · 25ml',
    shelfLife: '12-month shelf life',
    pouchColor: '#4A7C59',
    pouchAccent: '#2D5E3F',
    labelColor: '#E8F5EC',
    active: false,
    comingSoonHint: 'Matcha + espresso blend — Q3 2026',
    tiers: [
      { min: 1, max: 9, price: 125 },
      { min: 10, max: 29, price: 112 },
      { min: 30, max: null, price: 100 },
    ],
  },
  {
    id: 'espressgo-decaf',
    sku: 'ESG-DCF-004',
    name: 'ESPRESSGO Decaf',
    subtitle: 'All the ritual, none of the buzz',
    caffeine: '~5mg caffeine',
    format: 'Gel pouch · 25ml',
    shelfLife: '14-month shelf life',
    pouchColor: '#7A6A5C',
    pouchAccent: '#4A3D33',
    labelColor: '#F0ECE8',
    active: false,
    comingSoonHint: 'Swiss water decaf process — Q4 2026',
    tiers: [
      { min: 1, max: 9, price: 115 },
      { min: 10, max: 29, price: 103 },
      { min: 30, max: null, price: 92 },
    ],
  },
];

function getActiveTier(tiers, qty) {
  if (qty <= 0) return tiers[0];
  let active = tiers[0];
  for (const t of tiers) { if (qty >= t.min) active = t; }
  return active;
}

// ── Order data ───────────────────────────────────────────────
const Orders = {
  _key: 'espressgo_orders',
  
  async getAll() {
<<<<<<< HEAD
<<<<<<< HEAD
    const client = await getSupabaseClient();
    if (!client) {
      return this.getLocalOrders();
    }

    try {
      const { data, error } = await client
        .from('orders')
        .select(`
          id,
          company,
          contact_name,
          business_type,
          delivery_address,
          total_cartons,
          total_amount,
          status,
          notes,
          created_at,
          order_items (
            sku,
            name,
            cartons,
            price_per_carton
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("⚠️ Failed to fetch orders from Supabase:", error.message);
=======
=======
>>>>>>> parent of d1e893d (update)
    if (isSupabaseEnabled && supabase) {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('date_ordered', { ascending: false });

      if (error) {
        console.error("Failed to query orders from database:", error);
<<<<<<< HEAD
>>>>>>> parent of d1e893d (update)
=======
>>>>>>> parent of d1e893d (update)
        return this.getLocalOrders();
      }

      const mapped = data.map(o => ({
<<<<<<< HEAD
<<<<<<< HEAD
        id: String(o.id),
        company: o.company,
        contactName: o.contact_name,
        businessType: o.business_type,
        deliveryAddress: o.delivery_address,
        totalCartons: o.total_cartons,
        totalAmount: Number(o.total_amount),
        status: o.status,
        notes: o.notes,
        dateOrdered: o.created_at,
        items: (o.order_items || []).map(it => ({
          sku: it.sku,
          name: it.name,
          cartons: it.cartons,
          pricePerCarton: Number(it.price_per_carton)
        }))
      }));

      this.save(mapped); // Cache locally
      return mapped;
    } catch (err) {
      console.error("⚠️ Exception fetching orders from Supabase:", err);
      return this.getLocalOrders();
    }
=======
=======
>>>>>>> parent of d1e893d (update)
        id: o.id,
        company: o.company_name,
        contactName: o.contact_name,
        totalAmount: parseFloat(o.total_amount),
        totalCartons: o.total_cartons,
        items: o.items,
        status: o.status,
        dateOrdered: o.date_ordered,
        notes: o.notes || ''
      }));

      this.save(mapped);
      return mapped;
    }
    return this.getLocalOrders();
>>>>>>> parent of d1e893d (update)
  },
  
  getLocalOrders() {
    try { return JSON.parse(localStorage.getItem(this._key) || '[]'); } catch { return []; }
  },
  
  save(orders) { localStorage.setItem(this._key, JSON.stringify(orders)); },
  
  async add(order) {
<<<<<<< HEAD
<<<<<<< HEAD
    const client = await getSupabaseClient();
    if (!client) {
      const all = this.getLocalOrders();
      const newOrder = {
        ...order,
        id: String(Date.now()).slice(-6),
        dateOrdered: new Date().toISOString(),
        status: 'pending'
      };
      all.unshift(newOrder);
      this.save(all);
      return newOrder;
    }

    try {
      const { data: { user } } = await client.auth.getUser();
      
      const { data: newOrderData, error: orderError } = await client
        .from('orders')
        .insert({
          profile_id: user ? user.id : null,
          company: order.company,
          contact_name: order.contactName,
          business_type: order.businessType,
          delivery_address: order.deliveryAddress,
          total_cartons: order.totalCartons,
          total_amount: order.totalAmount,
          status: 'pending',
          notes: order.notes || null
        })
        .select()
        .single();

      if (orderError) throw new Error(orderError.message);

      const orderId = newOrderData.id;

      const itemsToInsert = order.items.map(it => ({
        order_id: orderId,
        product_id: it.sku.includes('OG') ? 'espressgo-original' : (it.sku.includes('OAT') ? 'espressgo-oatmilk' : null),
        sku: it.sku,
        name: it.name,
        cartons: it.cartons,
        price_per_carton: it.pricePerCarton
      }));

      const { error: itemsError } = await client
        .from('order_items')
        .insert(itemsToInsert);

      if (itemsError) {
        console.error("⚠️ Failed to insert order items, but parent order was created:", itemsError.message);
      }

      const formattedOrder = {
        ...order,
        id: String(orderId),
        dateOrdered: newOrderData.created_at,
        status: 'pending'
      };

      // Also append to local storage cache
      const all = this.getLocalOrders();
      all.unshift(formattedOrder);
      this.save(all);

      return formattedOrder;
    } catch (err) {
      console.error("⚠️ Failed to save order to Supabase:", err);
      const all = this.getLocalOrders();
      const newOrder = {
        ...order,
        id: String(Date.now()).slice(-6),
        dateOrdered: new Date().toISOString(),
        status: 'pending',
        notes: (order.notes || '') + ' (Offline Fallback)'
      };
      all.unshift(newOrder);
      this.save(all);
      return newOrder;
    }
=======
=======
>>>>>>> parent of d1e893d (update)
    if (isSupabaseEnabled && supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = Auth.getUser();

        const newOrder = {
          user_id: session ? session.user.id : null,
          company_name: order.company || user.companyName,
          contact_name: order.contactName || user.contactName,
          total_amount: order.totalAmount,
          total_cartons: order.totalCartons,
          items: order.items,
          status: 'pending',
          notes: order.notes || ''
        };

        const { data, error } = await supabase
          .from('orders')
          .insert(newOrder)
          .select()
          .single();

        if (error) throw error;

        const formattedOrder = {
          id: data.id,
          company: data.company_name,
          contactName: data.contact_name,
          totalAmount: parseFloat(data.total_amount),
          totalCartons: data.total_cartons,
          items: data.items,
          status: data.status,
          dateOrdered: data.date_ordered,
          notes: data.notes || ''
        };

        const cached = this.getLocalOrders();
        cached.unshift(formattedOrder);
        this.save(cached);

        return formattedOrder;
      } catch (err) {
        console.error("Error creating database order:", err);
        throw err;
      }
    }

    const all = this.getLocalOrders();
    const newOrder = {
      ...order,
      id: String(Date.now()).slice(-6),
      dateOrdered: new Date().toISOString(),
    };
    all.unshift(newOrder);
    this.save(all);
    return newOrder;
>>>>>>> parent of d1e893d (update)
  },
  
  forCompany(name) { 
    return this.getLocalOrders().filter(o => o.company === name); 
  },
};

// ── Toast ────────────────────────────────────────────────────
function showToast(title, body = '', type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const t = document.createElement('div');
  t.className = `toast ${type} fade-in`;
  t.innerHTML = `
    <div class="toast-icon">${type === 'success' ? '✓' : '!'}</div>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      ${body ? `<div class="toast-sub">${body}</div>` : ''}
    </div>
    <button class="toast-close" aria-label="Close">×</button>
  `;
  t.querySelector('.toast-close').onclick = () => t.remove();
  container.appendChild(t);
  setTimeout(() => t.remove(), 4500);
}

// ── Nav builder ──────────────────────────────────────────────
function buildNav(activePage) {
  const user = Auth.getUser();
  const loggedIn = !!user;
  const initials = user ? (user.contactName || user.companyName || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '';

  const portalLinks = `
  <li>
    <a href="catalog.html"
       class="nav-link ${activePage === 'catalog' ? 'active' : ''}">
       Catalog
    </a>
  </li>

  ${loggedIn ? `
    <li>
      <a href="quick-order.html"
         class="nav-link ${activePage === 'quick-order' ? 'active' : ''}">
         Quick Order
      </a>
    </li>

    <li>
      <a href="account.html"
         class="nav-link ${activePage === 'account' ? 'active' : ''}">
         Account
      </a>
    </li>

    <li><div class="nav-divider"></div></li>
  ` : ''}
`;

  const rightDesktop = loggedIn ? `
    <a href="admin/admin-login.html" class="nav-admin-btn">🛡 Admin</a>
    <div class="nav-divider"></div>
    <div style="position:relative;">
      <button id="user-menu-btn" style="display:flex;align-items:center;gap:.6rem;padding:.4rem .6rem;border-radius:10px;background:none;transition:background .15s;" onmouseover="this.style.background='rgba(255,255,255,.08)'" onmouseout="this.style.background='none'">
        <div style="width:32px;height:32px;background:rgba(200,133,58,.25);border:1px solid rgba(200,133,58,.2);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:12px;color:#D4A574;">${initials}</div>
        <div style="text-align:left;display:none;" class="xl-show">
          <div style="font-size:12px;color:#F5E6D3;">${user.companyName}</div>
          <div style="font-size:10px;color:#6B5744;">${user.email}</div>
        </div>
        <span style="color:#6B5744;font-size:11px;">▾</span>
      </button>
      <div id="user-menu-dropdown" class="user-menu-dropdown">
        <div class="user-menu-header">
          <div class="user-menu-company">${user.companyName}</div>
          <div class="user-menu-email">${user.email}</div>
        </div>
        <a href="account.html" class="user-menu-link">👤 My Account</a>
        <div style="height:1px;background:#F0EAE4;"></div>
        <button onclick="handleLogout()" class="user-menu-logout">🚪 Sign Out</button>
      </div>
    </div>
  ` : `<a href="login.html" class="nav-btn">Sign In</a>`;

  const mobilePortalLinks = `
  <a href="catalog.html"
     class="nav-mobile-link ${activePage === 'catalog' ? 'active' : ''}">
     📦 Catalog
  </a>

  ${loggedIn ? `
    <a href="quick-order.html"
       class="nav-mobile-link ${activePage === 'quick-order' ? 'active' : ''}">
       ⚡ Quick Order
    </a>

    <a href="account.html"
       class="nav-mobile-link ${activePage === 'account' ? 'active' : ''}">
       👤 Account
    </a>

    <div class="nav-mobile-divider"></div>
  ` : ''}
`;

  const mobileAuth = loggedIn ? `
    <a href="admin/admin-login.html" class="nav-mobile-link">🛡 Admin Portal</a>
    <div class="nav-mobile-divider"></div>
    <button onclick="handleLogout()" class="nav-mobile-link" style="background:rgba(239,68,68,.08);color:#ef4444;border:none;cursor:pointer;width:100%;text-align:left;">🚪 Sign Out</button>
  ` : `<a href="login.html" class="nav-mobile-signin">Sign In</a>`;

  const html = `
    <nav class="nav" role="navigation" aria-label="Main navigation">
      <div class="nav-inner">
        <a href="catalog.html" class="nav-logo" aria-label="ESPRESSGO home">
          <div class="nav-logo-icon">E</div>
          <div class="nav-logo-text">
            <div class="nav-logo-name">ESPRESSGO</div>
            <div class="nav-logo-sub">Wholesale Portal</div>
          </div>
        </a>
        <ul class="nav-links" role="list">
          ${portalLinks}
          <li><a href="about.html"   class="nav-link ${activePage === 'about' ? 'active' : ''}">About</a></li>
          <li><a href="contact.html" class="nav-link ${activePage === 'contact' ? 'active' : ''}">Contact</a></li>
        </ul>
        <div class="nav-right-desktop" style="display:flex;align-items:center;gap:.5rem;">${rightDesktop}</div>
        <button class="nav-hamburger" id="hamburger-btn" aria-label="Toggle menu" aria-expanded="false">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>
      <div class="nav-mobile" id="mobile-menu" role="menu" aria-hidden="true">
        ${mobilePortalLinks}
        <a href="about.html"   class="nav-mobile-link ${activePage === 'about' ? 'active' : ''}">ℹ️ About</a>
        <a href="contact.html" class="nav-mobile-link ${activePage === 'contact' ? 'active' : ''}">✉️ Contact</a>
        <div class="nav-mobile-divider"></div>
        ${mobileAuth}
      </div>
    </nav>
  `;
  document.getElementById('nav-placeholder').innerHTML = html;

  // Hamburger toggle
  const ham = document.getElementById('hamburger-btn');
  const mob = document.getElementById('mobile-menu');
  if (ham && mob) {
    ham.addEventListener('click', () => {
      const open = mob.classList.toggle('open');
      ham.setAttribute('aria-expanded', open);
    });
  }

  // User menu dropdown
  const btn = document.getElementById('user-menu-btn');
  const drop = document.getElementById('user-menu-dropdown');
  if (btn && drop) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      drop.style.display = drop.style.display === 'block' ? 'none' : 'block';
    });
    document.addEventListener('click', () => { drop.style.display = 'none'; });
  }
}

function buildFooter() {
  document.getElementById('footer-placeholder').innerHTML = `
    <footer class="footer" role="contentinfo">
      <div class="footer-inner">
        <div class="footer-logo">
          <div class="footer-logo-icon">E</div>
          <span class="footer-logo-text">ESPRESSGO</span>
        </div>
        <nav class="footer-links" aria-label="Footer links">
          <a href="about.html">About</a>
          <a href="contact.html">Contact</a>
        </nav>
        <p class="footer-copy">© 2026 ESPRESSGO. Gel-based espresso shots for business. Singapore.</p>
      </div>
    </footer>
  `;
}

function handleLogout() {
  Auth.logout();
  window.location.href = 'login.html';
}

// ── Require auth (redirect if not logged in) ─────────────────
function requireAuth() {
  if (!Auth.isLoggedIn()) window.location.href = 'login.html';
}

// ── Pouch SVG helper ─────────────────────────────────────────
function pouchSVG(product, size = 130, dimmed = false) {
  const { pouchColor, pouchAccent, labelColor, name } = product;
  const h = size * 1.55;
  const label = name.replace('ESPRESSGO ', '');
  return `<svg width="${size}" height="${h}" viewBox="0 0 100 155" xmlns="http://www.w3.org/2000/svg" style="opacity:${dimmed ? .4 : 1}">
    <rect x="42" y="0" width="16" height="14" rx="4" fill="${pouchAccent}"/>
    <path d="M36 14 Q30 20 28 30 L72 30 Q70 20 64 14 Z" fill="${pouchColor}"/>
    <rect x="18" y="30" width="64" height="100" rx="12" fill="${pouchColor}"/>
    <rect x="18" y="122" width="64" height="8" rx="6" fill="${pouchAccent}"/>
    <rect x="22" y="42" width="56" height="72" rx="6" fill="${labelColor}" opacity="0.92"/>
    <text x="50" y="62" text-anchor="middle" font-size="8.5" font-weight="700" font-family="sans-serif" fill="${pouchAccent}" letter-spacing="0.5">ESPRESSGO</text>
    <line x1="26" y1="66" x2="74" y2="66" stroke="${pouchColor}" stroke-width="0.8" opacity="0.4"/>
    <circle cx="50" cy="68" r="7" fill="${pouchColor}" opacity="0.8"/>
    <path d="M44 75 Q48 84 50 88 Q52 84 56 75 Z" fill="${pouchColor}" opacity="0.7"/>
    <text x="50" y="109" text-anchor="middle" font-size="4.2" font-family="sans-serif" fill="${pouchAccent}" opacity="0.7">${label}</text>
  </svg>`;
}

function miniPouchSVG(color, accent, size = 32) {
  const h = size * 1.5;
  return `<svg width="${size}" height="${h}" viewBox="0 0 36 54" xmlns="http://www.w3.org/2000/svg">
    <rect x="14" y="0" width="8" height="6" rx="2" fill="${accent}"/>
    <path d="M10 6 Q8 9 8 12 L28 12 Q28 9 26 6 Z" fill="${color}"/>
    <rect x="4" y="12" width="28" height="36" rx="6" fill="${color}"/>
    <rect x="4" y="44" width="28" height="4" rx="3" fill="${accent}"/>
    <rect x="7" y="16" width="22" height="26" rx="4" fill="${accent}" opacity="0.18"/>
    <text x="18" y="28" text-anchor="middle" font-size="4" font-weight="700" font-family="sans-serif" fill="${accent}" letter-spacing="0.2">ESG</text>
  </svg>`;
}

// ── Social Floats & FAQ Agent ───────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // 1. Inject Floating Buttons & Chat Widget HTML
  const socialHTML = `
    <div class="social-floats">
      <a href="https://www.linkedin.com/in/damien-teo-371b31257" target="_blank" rel="noopener noreferrer" class="social-float-btn linkedin" aria-label="LinkedIn">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
      </a>
      <a href="https://wa.me/6587977961" target="_blank" rel="noopener noreferrer" class="social-float-btn whatsapp" aria-label="WhatsApp">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 0C5.385 0 0 5.386 0 12.031c0 2.146.561 4.241 1.626 6.096L.18 24l6.02-1.583C7.994 23.366 10.002 24 12.031 24 18.675 24 24 18.614 24 11.97 24 5.326 18.675 0 12.031 0zM12 21.921c-1.847 0-3.655-.494-5.239-1.428l-.375-.221-3.879 1.018 1.036-3.774-.243-.384A9.873 9.873 0 0 1 1.944 12c0-5.466 4.453-9.919 9.923-9.919 5.467 0 9.922 4.454 9.922 9.92S17.467 21.92 12 21.921zm5.45-7.462c-.298-.15-1.767-.872-2.039-.972-.274-.1-.472-.15-.672.15-.199.299-.77 .972-.944 1.17-.174.199-.348.225-.646.075-.298-.15-1.26-.464-2.4-1.485-.886-.793-1.484-1.774-1.658-2.073-.174-.299-.019-.462.13-.611.135-.134.298-.349.447-.523.149-.174.199-.299.298-.499.1-.198.05-.373-.024-.523-.075-.15-.672-1.621-.92-2.22-.242-.584-.488-.505-.672-.514-.174-.01-.373-.01-.572-.01-.199 0-.523.075-.797.374-.274.298-1.045 1.02-1.045 2.49 0 1.47 1.07 2.89 1.219 3.09.15.199 2.106 3.214 5.101 4.506.711.306 1.266.49 1.698.627.714.226 1.365.194 1.88.118.577-.085 1.767-.722 2.016-1.42.249-.697.249-1.295.174-1.42-.074-.124-.274-.198-.572-.348z"/></svg>
      </a>
      <button class="social-float-btn faq" id="faq-toggle-btn" aria-label="KOPIGO FAQ Mascot">
        <span class="notification-badge" id="faq-badge"></span>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;">
          <!-- Saucer -->
          <ellipse cx="50" cy="80" rx="35" ry="10" fill="#2C1810" opacity="0.15"/>
          <ellipse cx="50" cy="78" rx="28" ry="7" fill="#C8853A" opacity="0.3"/>
          <!-- Cup Body -->
          <path d="M25 35 C25 68, 30 72, 50 72 C70 72, 75 68, 75 35 Z" fill="#2C1810"/>
          <path d="M27 37 C27 66, 32 70, 50 70 C68 70, 73 66, 73 37 Z" fill="#F5E6D3"/>
          <!-- Cup Rim / Liquid -->
          <ellipse cx="50" cy="35" rx="25" ry="7" fill="#C8853A"/>
          <ellipse cx="50" cy="35" rx="22" ry="5" fill="#3D2817"/>
          <!-- Handle -->
          <path d="M74 42 C84 42, 84 62, 74 62" stroke="#2C1810" stroke-width="5" stroke-linecap="round" fill="none"/>
          <path d="M74 42 C84 42, 84 62, 74 62" stroke="#F5E6D3" stroke-width="2" stroke-linecap="round" fill="none"/>
          <!-- Steam -->
          <path d="M42 22 Q46 15 42 10" stroke="#C8853A" stroke-width="3" stroke-linecap="round" opacity="0.75"/>
          <path d="M50 25 Q54 18 50 12" stroke="#C8853A" stroke-width="3" stroke-linecap="round" opacity="0.75"/>
          <path d="M58 22 Q62 15 58 10" stroke="#C8853A" stroke-width="3" stroke-linecap="round" opacity="0.75"/>
          <!-- Cute Face -->
          <circle cx="42" cy="52" r="3.5" fill="#2C1810"/>
          <circle cx="41" cy="50.5" r="1" fill="#fff"/>
          <circle cx="58" cy="52" r="3.5" fill="#2C1810"/>
          <circle cx="57" cy="50.5" r="1" fill="#fff"/>
          <path d="M47 57 Q50 60 53 57" stroke="#2C1810" stroke-width="2.5" stroke-linecap="round" fill="none"/>
          <circle cx="36" cy="56" r="3" fill="#ef4444" opacity="0.35"/>
          <circle cx="64" cy="56" r="3" fill="#ef4444" opacity="0.35"/>
        </svg>
      </button>
    </div>

    <div class="faq-widget" id="faq-chat-widget">
      <div class="faq-widget-header">
        <div class="faq-header-info">
          <div class="faq-avatar">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;">
              <!-- Saucer -->
              <ellipse cx="50" cy="80" rx="35" ry="10" fill="#2C1810" opacity="0.15"/>
              <ellipse cx="50" cy="78" rx="28" ry="7" fill="#C8853A" opacity="0.3"/>
              <!-- Cup Body -->
              <path d="M25 35 C25 68, 30 72, 50 72 C70 72, 75 68, 75 35 Z" fill="#2C1810"/>
              <path d="M27 37 C27 66, 32 70, 50 70 C68 70, 73 66, 73 37 Z" fill="#F5E6D3"/>
              <!-- Cup Rim / Liquid -->
              <ellipse cx="50" cy="35" rx="25" ry="7" fill="#C8853A"/>
              <ellipse cx="50" cy="35" rx="22" ry="5" fill="#3D2817"/>
              <!-- Handle -->
              <path d="M74 42 C84 42, 84 62, 74 62" stroke="#2C1810" stroke-width="5" stroke-linecap="round" fill="none"/>
              <path d="M74 42 C84 42, 84 62, 74 62" stroke="#F5E6D3" stroke-width="2" stroke-linecap="round" fill="none"/>
              <!-- Cute Face -->
              <circle cx="42" cy="52" r="3.5" fill="#2C1810"/>
              <circle cx="41" cy="50.5" r="1" fill="#fff"/>
              <circle cx="58" cy="52" r="3.5" fill="#2C1810"/>
              <circle cx="57" cy="50.5" r="1" fill="#fff"/>
              <path d="M47 57 Q50 60 53 57" stroke="#2C1810" stroke-width="2.5" stroke-linecap="round" fill="none"/>
              <circle cx="36" cy="56" r="3" fill="#ef4444" opacity="0.35"/>
              <circle cx="64" cy="56" r="3" fill="#ef4444" opacity="0.35"/>
            </svg>
          </div>
          <div>
            <div class="faq-status-title">KOPIGO</div>
            <div class="faq-status-sub">
              <span class="pulse-dot" style="width: 7px; height: 7px; background: #22c55e;"></span>
              AI Concierge · Online
            </div>
          </div>
        </div>
        <button class="faq-close-btn" id="faq-close-btn" aria-label="Close FAQ menu">×</button>
      </div>
      <div class="faq-chat-body" id="faq-chat-body"></div>
      <div class="faq-options-panel" id="faq-options-panel">
        <div class="faq-options-title">Click a question to ask</div>
        <div id="faq-buttons-container"></div>
      </div>
      <!-- AI Typing Input Area -->
      <div class="faq-input-container">
        <input type="text" id="faq-user-input" class="faq-input" placeholder="Or ask a custom question..." aria-label="Type B2B question">
        <button class="faq-send-btn" id="faq-send-btn" aria-label="Send message">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', socialHTML);

  // 2. State & FAQ Data definitions
  const faqData = [
    {
      q: "How long does delivery take?",
      answer: "Singapore B2B logistics typically take **2 to 3 business days** to arrive at your warehouse! 🚚\n\nNeed it faster? We offer **next-day express delivery** for orders placed before 12 PM, with a small SGD 15 surcharge. Free islandwide delivery for orders of 5+ cartons!"
    },
    {
      q: "Does EspressGo contain dairy or sugar?",
      answer: "Great question! Here's the breakdown of our two B2B variants:\n\n- **ESPRESSGO Original** — Zero added sugar, 100% dairy-free, and fully vegan. Pure Vietnamese robusta cold brew gel.\n- **ESPRESSGO Oat Milk** — Contains organic oat milk (plant-based, 100% dairy-free) with a light touch of natural brown sugar.\n\nBoth are clean-label and office-friendly! ☕"
    },
    {
      q: "Is EspressGo halal-certified?",
      answer: "Absolutely yes! 🌙 ESPRESSGO is proudly **MUIS Halal-certified**, manufactured to the highest compliance standards here in Singapore.\n\nWe can provide a copy of our Halal certificate upon request — just reach out to Damien via <a href='https://wa.me/6587977961' target='_blank'>WhatsApp</a>!"
    },
    {
      q: "Can I track my order?",
      answer: "Yes! Every B2B order comes with **real-time tracking**. 📦\n\nOnce your order is dispatched, you will receive a tracking link via email. You can also monitor all your active orders anytime from your <a href='account.html'>Account Dashboard</a>.\n\nFor urgent tracking queries, contact Damien directly on <a href='https://wa.me/6587977961' target='_blank'>WhatsApp</a> for an instant update!"
    }
  ];

  const faqWidget = document.getElementById('faq-chat-widget');
  const faqToggle = document.getElementById('faq-toggle-btn');
  const faqClose = document.getElementById('faq-close-btn');
  const faqBadge = document.getElementById('faq-badge');
  const faqChatBody = document.getElementById('faq-chat-body');
  const faqButtonsContainer = document.getElementById('faq-buttons-container');
  const faqUserInput = document.getElementById('faq-user-input');
  const faqSendBtn = document.getElementById('faq-send-btn');

  // 3. Mouse Drag Scroll behavior for Desktop Carousel
  let isDown = false;
  let startX;
  let scrollLeft;
  let moved = false;

  faqButtonsContainer.addEventListener('mousedown', (e) => {
    isDown = true;
    moved = false;
    startX = e.pageX - faqButtonsContainer.offsetLeft;
    scrollLeft = faqButtonsContainer.scrollLeft;
  });

  faqButtonsContainer.addEventListener('mouseleave', () => {
    isDown = false;
  });

  faqButtonsContainer.addEventListener('mouseup', () => {
    isDown = false;
  });

  faqButtonsContainer.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - faqButtonsContainer.offsetLeft;
    const walk = (x - startX) * 1.5; // Drag scroll multiplier
    if (Math.abs(x - startX) > 5) {
      moved = true;
    }
    faqButtonsContainer.scrollLeft = scrollLeft - walk;
  });

  // Intercept the click on child elements if moved during drag
  faqButtonsContainer.addEventListener('click', (e) => {
    if (moved) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  let hasInitialized = false;
  let chatHistory = [];

  // Render clickable question buttons
  function renderOptions() {
    faqButtonsContainer.innerHTML = faqData.map((item, index) => `
      <button class="faq-option-btn" data-index="${index}">
        <span>${item.q}</span>
      </button>
    `).join('');

    // Attach listeners to buttons
    faqButtonsContainer.querySelectorAll('.faq-option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = btn.getAttribute('data-index');
        handleQuestionClick(idx);
      });
    });
  }

  // Format response helper: replaces simple markdown bold **text** with HTML <strong>text</strong>
  function formatResponse(text) {
    // Bold tags
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Bullet lists
    formatted = formatted.replace(/^\s*-\s+(.*?)$/gm, '• $1');
    // Newlines to HTML breaks
    formatted = formatted.replace(/\n/g, '<br>');
    return formatted;
  }

  // Add a message bubble to the chat
  function addMessage(sender, text) {
    const msg = document.createElement('div');
    msg.className = `faq-msg ${sender}`;
    msg.innerHTML = formatResponse(text);
    faqChatBody.appendChild(msg);
    faqChatBody.scrollTop = faqChatBody.scrollHeight;
  }

  // Trigger typing indicator
  function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'faq-typing';
    indicator.id = 'faq-typing-indicator';
    indicator.innerHTML = `
      <div class="faq-typing-dot"></div>
      <div class="faq-typing-dot"></div>
      <div class="faq-typing-dot"></div>
    `;
    faqChatBody.appendChild(indicator);
    faqChatBody.scrollTop = faqChatBody.scrollHeight;
  }

  function removeTypingIndicator() {
    const indicator = document.getElementById('faq-typing-indicator');
    if (indicator) indicator.remove();
  }

  // Toggle user control elements during generation state
  function setControlsDisabled(disabled) {
    faqUserInput.disabled = disabled;
    faqSendBtn.disabled = disabled;
    const buttons = faqButtonsContainer.querySelectorAll('.faq-option-btn');
    buttons.forEach(b => b.disabled = disabled);
  }

  // General B2B message post handler connecting to our Node.js Vercel backend proxy
  async function handleUserMessage(text) {
    if (!text || !text.trim()) return;

    const queryText = text.trim();

    // Clear the input bar
    faqUserInput.value = '';

    // Disable all inputs
    setControlsDisabled(true);

    // 1. Post user message bubble
    addMessage('user', queryText);

    // Check if the user query matches a static pre-defined answer to bypass the AI
    const matchedFaq = faqData.find(item => item.answer && item.q.toLowerCase().trim() === queryText.toLowerCase().trim());
    if (matchedFaq) {
      setTimeout(() => {
        showTypingIndicator();
        setTimeout(() => {
          removeTypingIndicator();
          addMessage('agent', matchedFaq.answer);
          chatHistory.push({ role: 'user', content: queryText });
          chatHistory.push({ role: 'agent', content: matchedFaq.answer });
          if (chatHistory.length > 12) chatHistory.splice(0, chatHistory.length - 12);
          setControlsDisabled(false);
          faqChatBody.scrollTop = faqChatBody.scrollHeight;
          faqUserInput.focus();
        }, 600);
      }, 300);
      return;
    }

    // 2. Add organic thinking delay delay
    setTimeout(async () => {
      showTypingIndicator();

      // Backend route proxy for production
      try {
        const resolvedOrders = await Orders.getAll();
        // Query serverless API endpoint
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            question: queryText,
            history: chatHistory,
            user: Auth.getUser(),
            cart: JSON.parse(localStorage.getItem('espressgo_cart') || '{}'),
            orders: resolvedOrders
          })
        });

        removeTypingIndicator();

        if (response.ok) {
          const data = await response.json();
          const rawAnswer = data.answer || "I parsed the coffee matrix, but found an empty response. Try rephrasing!";

          // Regex to check for [[ORDER_ACTION: productId, cartons]]
          const orderMatch = rawAnswer.match(/\[\[ORDER_ACTION:\s*([a-zA-Z0-9_-]+),\s*(\d+)\s*\]\]/);

          // Strip out structured brackets entirely to keep the visual UI clean
          const cleanedAnswer = rawAnswer.replace(/\[\[.*?\]\]/g, '').trim();

          addMessage('agent', cleanedAnswer);

          // Track in chat history
          chatHistory.push({ role: 'user', content: queryText });
          chatHistory.push({ role: 'agent', content: cleanedAnswer });
          if (chatHistory.length > 12) chatHistory.splice(0, chatHistory.length - 12);

          // If the AI trigger is found, update the cart dynamically!
          if (orderMatch) {
            const productId = orderMatch[1];
            const cartons = parseInt(orderMatch[2], 10);

            console.log(`🤖 AI Order Trigger matched! Adding ${cartons} cartons of ${productId} to cart.`);

            // 1. Persist the updated cart state inside localStorage
            const localCart = JSON.parse(localStorage.getItem('espressgo_cart') || '{}');
            localCart[productId] = (localCart[productId] || 0) + cartons;
            localStorage.setItem('espressgo_cart', JSON.stringify(localCart));

            // 2. If currently viewing catalog.html, execute page-level UI refresh
            if (typeof window.updateCart === 'function') {
              window.updateCart(productId, localCart[productId]);
            }

            // 3. Display B2B Toast notification
            if (typeof showToast === 'function') {
              const productName = productId === 'espressgo-original' ? 'ESPRESSGO Original' : 'ESPRESSGO Oat Milk';
              showToast("AI Order Drafted!", `Added ${cartons} cartons of ${productName} to your cart.`, "success");
            }
          }
        } else {
          console.error('API non-OK response status:', response.status);
          if (response.status === 404 && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
            addMessage('agent', "⚠️ **Local Server Route Warning**: It looks like you are running a static local server (like Python's `http.server` or VS Code Live Server). Static servers **cannot** run Node.js backend routes (like `/api/chat.js`), which causes this local 404 error. \n\nTo test the generative AI locally, please run `npx vercel dev` in your command line, or visit the live production site: **[espresgo-b2-b-portal.vercel.app](https://espresgo-b2-b-portal.vercel.app/catalog)**! 👋 \n\nWe apologize for the confusion! For immediate direct B2B inquiries or custom support, please feel free to reach out to **Damien Teo** via <a href='https://wa.me/6587977961' target='_blank'>WhatsApp</a> or <a href='https://www.linkedin.com/in/damien-teo-371b31257' target='_blank'>LinkedIn</a>! ☕");
          } else {
            addMessage('agent', "We are incredibly sorry, but our AI concierge is experiencing a temporary hiccup right now! ☕ Please accept our sincere apologies for the inconvenience. \n\nFor immediate custom assistance, wholesale orders, or premium pricing queries, please feel free to reach out directly to **Damien Teo** via <a href='https://wa.me/6587977961' target='_blank'>WhatsApp</a> or connect with him on <a href='https://www.linkedin.com/in/damien-teo-371b31257' target='_blank'>LinkedIn</a>. We'd love to help you get fueled! 🙏");
          }
        }
      } catch (error) {
        removeTypingIndicator();
        console.error('Fetch client connection exception:', error);
        addMessage('agent', "We are so sorry, but we had trouble reaching our chat servers! ☕ Please accept our sincere apologies for this temporary connection issue. \n\nIf you are running the project locally, please verify that you launched using `vercel dev` instead of a static server to fully activate the `/api` routes. Otherwise, please feel free to contact **Damien Teo** directly via <a href='https://wa.me/6587977961' target='_blank'>WhatsApp</a> or <a href='https://www.linkedin.com/in/damien-teo-371b31257' target='_blank'>LinkedIn</a> for wholesale procurement assistance. We're always here to support you! 🙏");
      } finally {
        setControlsDisabled(false);
        faqChatBody.scrollTop = faqChatBody.scrollHeight;

        faqUserInput.focus();
      }
    }, 400);
  }

  // Handle FAQ question selection
  function handleQuestionClick(index) {
    const item = faqData[index];
    handleUserMessage(item.q);
  }

  // Initialize Chat content
  function initChat() {
    if (hasInitialized) return;
    hasInitialized = true;

    // Greeting Message
    addMessage('agent', "Hello B2B partner! 👋 I am your Smart AI-powered KOPIGO Concierge, powered by Gemini via OpenRouter. Ask me anything about our wholesale pricing, Singapore logistics, caffeine parameters, or procurement! \n\nOr click a shortcut question to begin:");
    renderOptions();
  }

  // Toggle widget event listeners
  faqToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = faqWidget.classList.toggle('open');
    if (isOpen) {
      if (faqBadge) faqBadge.style.display = 'none'; // Dismiss badge
      initChat();
      setTimeout(() => faqUserInput.focus(), 300);
    }
  });

  faqClose.addEventListener('click', (e) => {
    e.stopPropagation();
    faqWidget.classList.remove('open');
  });

  // Attach submit listeners
  faqSendBtn.addEventListener('click', () => {
    handleUserMessage(faqUserInput.value);
  });

  faqUserInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleUserMessage(faqUserInput.value);
    }
  });

  // Close when clicking outside the widget
  document.addEventListener('click', (e) => {
    if (!faqWidget.contains(e.target) && !faqToggle.contains(e.target)) {
      faqWidget.classList.remove('open');
    }
  });
});

