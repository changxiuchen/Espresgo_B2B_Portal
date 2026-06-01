# ESPRESSGO B2B Wholesale Portal

A client-side HTML/CSS/JavaScript B2B wholesale portal for ESPRESSGO — gel-based espresso shot pouches made in Singapore.

---

## 📁 Project Structure

```
Espressob2b/
├── index.html              # Entry point — redirects based on login state
├── about.html              # Public landing / about page
├── contact.html            # Contact / enquiry form
├── login.html              # Sign in & register page
├── catalog.html            # Product catalog with cart & checkout
├── quick-order.html        # Quick-entry bulk order form
├── account.html            # Account hub (orders, profile, billing)
│
├── shared.css              # Global design tokens, layout, nav, footer, components
├── shared.js               # Shared data, auth helpers, nav/footer builders
│
├── css/                    # Page-specific stylesheets (extracted from HTML)
│   ├── account.css
│   ├── catalog.css
│   ├── quick-order.css
│   ├── login.css
│   ├── about.css
│   └── contact.css
│
├── js/                     # Page-specific scripts (extracted from HTML)
│   ├── account.js
│   ├── catalog.js
│   ├── quick-order.js
│   ├── login.js
│   ├── about.js
│   └── contact.js
│
└── admin/
    ├── admin-login.html    # Admin sign-in gate
    ├── admin-dashboard.html # Internal order/user/product management panel
    ├── admin-login.css     # Admin login styles
    ├── admin-login.js      # Admin login logic
    ├── admin-dashboard.css # Admin dashboard styles
    └── admin-dashboard.js  # Admin dashboard logic
```

---

## 🚀 Running Locally

This project is pure HTML/CSS/JS — no build step needed.

1. Place the folder inside your web server root (e.g., `C:/wamp64/www/Espressob2b`)
2. Start WAMP (or any local web server)
3. Open `http://localhost/Espressob2b/` in your browser

---

## 🔑 Demo Credentials

| Role  | Email                   | Password   |
|-------|-------------------------|------------|
| Buyer | test@gmail.com          | 123        |
| Admin | admin@espressgo.sg      | admin123   |

> **Note:** Auth is localStorage-based (demo only). No real backend.

---

## 🗂 Key Files Explained

| File         | Purpose |
|--------------|---------|
| `shared.css` | Design tokens (colours, typography), reset, nav, footer, buttons, cards, form inputs, toasts, utilities, responsive breakpoints |
| `shared.js`  | `Auth` object (login/register/logout), `Products` array (pricing tiers), `Orders` object (localStorage CRUD), `showToast()`, `buildNav()`, `buildFooter()`, `pouchSVG()` |

---

## 🎨 Design System

Colours are defined as CSS custom properties in `shared.css`:

| Token        | Value     | Usage |
|--------------|-----------|-------|
| `--brown`    | `#2C1810` | Primary dark |
| `--amber`    | `#C8853A` | Accent / CTA |
| `--cream`    | `#F5E6D3` | Light text on dark |
| `--sand`     | `#F6F2EE` | Page background |
| `--border`   | `#E8E0D8` | Card borders |
| `--muted`    | `#8B7355` | Secondary text |

---

## 👥 Contributing (GitHub)

1. Clone the repo: `git clone <repo-url>`
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Commit with a clear message: `git commit -m "feat: describe your change"`
5. Push and open a Pull Request

### Conventions
- Page CSS lives in `css/<page-name>.css`
- Page JS lives in `js/<page-name>.js`
- Shared styles/logic belong in `shared.css` / `shared.js`
- Use CSS custom properties (variables) — avoid hardcoding hex colours
