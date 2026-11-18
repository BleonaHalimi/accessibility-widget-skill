---
name: accessibility-widget
description: Build, prepare and integrate a self-hosted, open-source accessibility widget (text size, high contrast, grayscale, link underlining, readable font, text spacing, stop animations, focus highlight) into any web project. Use this skill whenever a developer wants to add an accessibility widget, accessibility toolbar, a11y menu or accessibility preferences panel to a site, or wants their project prepared for one, even if they do not say "widget". Covers plain HTML, React, Next.js, Vue, Nuxt, Angular, Svelte/SvelteKit, Astro, WordPress, Shopify, Drupal and server-rendered apps (Django, Rails, Laravel). The skill detects the framework, audits and fixes existing accessibility issues, sets up config, environment variables and CSP headers, installs the widget files, wires them into the framework and verifies the result.
---

# Accessibility Widget

This skill takes a web project from "no widget" to "widget installed, configured and verified". It always works in the same six steps, in order:

1. Detect the environment (framework, package manager, rendering mode).
2. Audit the site and fix existing accessibility issues.
3. Prepare configuration: environment variables and Content-Security-Policy.
4. Add the widget files (`a11y-widget.js` + `a11y-widget.css`).
5. Integrate the widget using the recipe for the detected framework.
6. Verify with keyboard checks and an automated axe test.

## Core principle: the widget is not a compliance fix

An accessibility widget lets visitors adjust the page to their preferences. It does **not** make an inaccessible site accessible, and it does not make a site WCAG, ADA or EAA compliant. Screen reader users, keyboard users and many others never touch the widget; they depend on the underlying HTML being correct. That is why Step 2 is mandatory. Tell the developer this plainly once, never claim the widget provides compliance, and never skip the audit to "save time".

The widget itself must also be accessible: a real `<button>` toggle, a labelled dialog, `aria-pressed` toggles, full keyboard support, Escape to close, focus returned to the toggle, and 44×44 px touch targets. The reference implementation below does all of this; keep these properties if you modify it.

---

## Step 1: Detect the environment

Inspect the project root before changing anything. Use the first match in this table:

| Signal | Environment |
|---|---|
| `wp-config.php`, `wp-content/` or a `style.css` theme header | WordPress |
| `layout/theme.liquid` | Shopify theme |
| `*.info.yml` + `*.libraries.yml` | Drupal theme or module |
| `next` in `package.json` dependencies | Next.js (check for `app/` vs `pages/` router) |
| `nuxt` in dependencies | Nuxt 3 |
| `@angular/core` in dependencies, `angular.json` | Angular |
| `@sveltejs/kit` in dependencies | SvelteKit |
| `astro` in dependencies | Astro |
| `react` + `vite` in dependencies | React (Vite) |
| `vue` + `vite` in dependencies | Vue 3 (Vite) |
| `manage.py` / `Gemfile` with `rails` / `artisan` | Django / Rails / Laravel |
| Only `.html` files | Plain HTML / static site |

Also detect the package manager from the lockfile (`pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, `bun.lockb` → bun, `package-lock.json` → npm) and use it for every install command. Check whether the project uses TypeScript (`tsconfig.json`) and whether it renders on the server (Next, Nuxt, SvelteKit, Astro, Angular SSR), because the widget touches `window`, `document` and `localStorage` and must only run in the browser.

Report what you detected in one or two sentences before continuing. If signals conflict (for example a WordPress site with a React block build), ask which part the widget belongs to.

---

## Step 2: Audit and fix existing accessibility issues

### Run an automated audit

Start the site locally (or use the URL the developer gives) and run axe:

```bash
npx @axe-core/cli http://localhost:3000 --exit
# or, for several pages:
npx pa11y-ci --sitemap http://localhost:3000/sitemap.xml
```

For a static folder with no server, run `npx serve .` first. Automated tools catch roughly a third to a half of real issues, so also do the manual checks below.

### Fix in this order

Fix the highest-impact issues first, and show the developer a short summary of what you changed.

1. **Page language.** `<html lang="en">` (or the correct language). In Next.js App Router set it in `app/layout.tsx`; in Nuxt via `app.head.htmlAttrs` in `nuxt.config`; in WordPress use `language_attributes()`.
2. **Images.** Informative images get a concise `alt` describing their purpose. Decorative images get `alt=""`. Never invent what an image shows: if you cannot tell from context, insert `alt=""` only when it is clearly decorative, otherwise add `alt="TODO: describe"` and list it for the developer.
3. **Form labels.** Every input needs a `<label for>`, a wrapping `<label>`, or `aria-label`. Placeholders are not labels.
4. **Buttons and links.** Clickable `<div>`/`<span>` elements become `<button type="button">` (actions) or `<a href>` (navigation). Icon-only buttons get an `aria-label`.
5. **Keyboard focus.** Remove `outline: none` without a replacement. Add a visible style:
   ```css
   :focus-visible { outline: 3px solid #1a56db; outline-offset: 2px; }
   ```
6. **Skip link and landmarks.** Add a skip link as the first focusable element and wrap content in `<header>`, `<nav>`, `<main id="main">`, `<footer>`:
   ```html
   <a class="skip-link" href="#main">Skip to main content</a>
   ```
   ```css
   .skip-link { position: absolute; left: -9999px; }
   .skip-link:focus { left: 1rem; top: 1rem; z-index: 1000; padding: .5rem 1rem; background: #fff; color: #000; }
   ```
7. **Headings.** One `<h1>` per page, no skipped levels used for styling.
8. **Colour contrast.** Text needs 4.5:1 against its background (3:1 for large text and UI component borders). Propose adjusted colour values; do not silently change brand colours without telling the developer.
9. **Motion.** Wrap non-essential animation in `@media (prefers-reduced-motion: no-preference)`.
10. **Rem-based font sizes.** The widget's text-size control scales the root font size, so it only works on text sized in `rem`/`em`/`%`. Flag hard-coded `px` font sizes and offer to convert them (`16px` → `1rem`).

Re-run the audit after fixing and report remaining issues that need human judgment.

---

## Step 3: Prepare configuration

### Environment variables

Use these variables so the widget can be toggled and positioned per environment. Use the prefix the framework exposes to the browser:

| Environment | Variables |
|---|---|
| Next.js | `NEXT_PUBLIC_A11Y_WIDGET_ENABLED`, `NEXT_PUBLIC_A11Y_WIDGET_POSITION` |
| Vite (React, Vue, Svelte) | `VITE_A11Y_WIDGET_ENABLED`, `VITE_A11Y_WIDGET_POSITION` |
| Nuxt 3 | `NUXT_PUBLIC_A11Y_WIDGET_ENABLED`, `NUXT_PUBLIC_A11Y_WIDGET_POSITION` |
| Astro | `PUBLIC_A11Y_WIDGET_ENABLED`, `PUBLIC_A11Y_WIDGET_POSITION` |
| Angular | `a11yWidget` object in `src/environments/environment*.ts` |
| WordPress / Shopify / Drupal | Plugin option / theme setting / module config instead of env vars |

Add the variables to `.env.example` (never to a committed `.env` with secrets) with defaults `true` and `bottom-right`. Valid positions: `bottom-right`, `bottom-left`, `top-right`, `top-left`.

### Content-Security-Policy

The widget is CSP-friendly when self-hosted: it uses no inline `<script>`, no `eval`, no inline `style` attributes in markup, and sets styles only through the CSSOM (`element.style.setProperty`), which CSP allows. A self-hosted install therefore needs nothing beyond:

```
script-src 'self'; style-src 'self'
```

Rules:

- If the site already has a CSP, **merge** into it. Never loosen an existing stricter policy, and never add `'unsafe-inline'` or `'unsafe-eval'` for the widget.
- If config is passed with an inline `<script>` (e.g. `window.A11yWidgetConfig = {...}`), either move it into an external file such as `/a11y-config.js` or add the page's existing nonce to that script.
- If the widget is loaded from a CDN, add that exact host to `script-src` and `style-src` and pin the version in the URL.
- Test CSP against a production build; development servers often need extra allowances that must not ship.

Examples when no CSP exists yet:

```nginx
# nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'self'" always;
```

```js
// next.config.js
const csp = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'none'; base-uri 'self'";
module.exports = {
  async headers() {
    return [{ source: '/(.*)', headers: [{ key: 'Content-Security-Policy', value: csp }] }];
  },
};
```

(Next.js injects its own inline styles and scripts; for a strict Next.js CSP use its nonce-based middleware pattern rather than the simplified header above.)

```apache
# Apache .htaccess
Header always set Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'"
```

---

## Step 4: Add the widget files

Create these two files exactly. Place them where the framework recipe in Step 5 says. They have no dependencies and work in all evergreen browsers.

If this skill's folder contains `assets/a11y-widget.js` and `assets/a11y-widget.css`, copy those files instead of retyping them; they are identical to the code below.

### `a11y-widget.js`

```js
/*! a11y-widget v1.0.0 | MIT License */
(() => {
  'use strict';
  if (typeof window === 'undefined' || window.A11yWidget) return;

  const STORAGE_KEY = 'a11y-widget:prefs';
  const FEATURES = [
    { id: 'contrast', label: 'High contrast' },
    { id: 'grayscale', label: 'Grayscale' },
    { id: 'underline-links', label: 'Underline links' },
    { id: 'readable-font', label: 'Readable font' },
    { id: 'text-spacing', label: 'Text spacing' },
    { id: 'stop-motion', label: 'Stop animations' },
    { id: 'focus-highlight', label: 'Highlight focus' },
  ];
  const DEFAULT_LABELS = {
    open: 'Accessibility options',
    title: 'Accessibility',
    textSize: 'Text size',
    decrease: 'Decrease text size',
    increase: 'Increase text size',
    reset: 'Reset all',
  };
  const POSITIONS = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];
  const ICON = '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="28" height="28">'
    + '<circle cx="12" cy="4" r="2" fill="currentColor"/>'
    + '<path d="M4 8h16v2h-5v3l2 8h-2.2L12 15l-2.8 6H7l2-8v-3H4z" fill="currentColor"/></svg>';

  const html = document.documentElement;
  let state = loadPrefs();
  let root = null;
  let cleanup = null;

  function loadPrefs() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { /* storage blocked */ }
    const prefs = { scale: 1, ...saved };
    // Respect the OS setting until the visitor chooses otherwise.
    if (prefs['stop-motion'] === undefined && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      prefs['stop-motion'] = true;
    }
    return prefs;
  }

  function savePrefs() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* private mode */ }
  }

  function applyPrefs() {
    for (const f of FEATURES) html.classList.toggle(`a11y-${f.id}`, Boolean(state[f.id]));
    html.classList.toggle('a11y-scaled', state.scale !== 1);
    html.style.setProperty('--a11y-scale', String(state.scale));
  }

  function el(tag, attrs = {}, text) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function mount() {
    if (root || !document.body) return;
    const cfg = { position: 'bottom-right', minScale: 0.8, maxScale: 2, step: 0.1, ...window.A11yWidgetConfig };
    if (cfg.enabled === false || cfg.enabled === 'false') return;
    const position = POSITIONS.includes(cfg.position) ? cfg.position : 'bottom-right';
    const label = (key) => cfg.labels?.[key] ?? DEFAULT_LABELS[key] ?? FEATURES.find((f) => f.id === key)?.label;

    root = el('div', { class: `a11yw a11yw--${position}` });

    const toggle = el('button', {
      type: 'button', class: 'a11yw-toggle',
      'aria-expanded': 'false', 'aria-controls': 'a11yw-panel', 'aria-label': label('open'),
    });
    toggle.innerHTML = ICON;

    const panel = el('div', {
      id: 'a11yw-panel', class: 'a11yw-panel', role: 'dialog',
      'aria-modal': 'false', 'aria-labelledby': 'a11yw-title', hidden: '',
    });
    panel.appendChild(el('h2', { id: 'a11yw-title', class: 'a11yw-title' }, label('title')));

    // Text size control
    const sizeRow = el('div', { class: 'a11yw-row', role: 'group', 'aria-labelledby': 'a11yw-size-label' });
    sizeRow.appendChild(el('span', { id: 'a11yw-size-label' }, label('textSize')));
    const dec = el('button', { type: 'button', 'aria-label': label('decrease') }, 'A−');
    const out = el('output', { 'aria-live': 'polite' });
    const inc = el('button', { type: 'button', 'aria-label': label('increase') }, 'A+');
    sizeRow.append(dec, out, inc);
    panel.appendChild(sizeRow);

    const renderScale = () => {
      out.textContent = `${Math.round(state.scale * 100)}%`;
      dec.disabled = state.scale <= cfg.minScale;
      inc.disabled = state.scale >= cfg.maxScale;
    };
    const setScale = (value) => {
      state.scale = Math.round(Math.min(cfg.maxScale, Math.max(cfg.minScale, value)) * 10) / 10;
      applyPrefs(); savePrefs(); renderScale();
    };
    dec.addEventListener('click', () => setScale(state.scale - cfg.step));
    inc.addEventListener('click', () => setScale(state.scale + cfg.step));
    renderScale();

    // Toggle options
    const grid = el('div', { class: 'a11yw-options' });
    const optionButtons = FEATURES.map((f) => {
      const btn = el('button', { type: 'button', class: 'a11yw-option', 'aria-pressed': String(Boolean(state[f.id])) }, label(f.id));
      btn.addEventListener('click', () => {
        state[f.id] = !state[f.id];
        btn.setAttribute('aria-pressed', String(state[f.id]));
        applyPrefs(); savePrefs();
      });
      grid.appendChild(btn);
      return btn;
    });
    panel.appendChild(grid);

    const reset = el('button', { type: 'button', class: 'a11yw-reset' }, label('reset'));
    reset.addEventListener('click', () => {
      state = { scale: 1 };
      for (const f of FEATURES) state[f.id] = false;
      applyPrefs(); savePrefs(); renderScale();
      optionButtons.forEach((b) => b.setAttribute('aria-pressed', 'false'));
    });
    panel.appendChild(reset);

    // Open / close behaviour
    const open = () => {
      panel.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      panel.querySelector('button:not([disabled])')?.focus();
    };
    const close = (returnFocus) => {
      panel.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      if (returnFocus) toggle.focus();
    };
    toggle.addEventListener('click', () => (panel.hidden ? open() : close(false)));
    root.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !panel.hidden) { e.stopPropagation(); close(true); }
    });
    const onDocClick = (e) => { if (!panel.hidden && !root.contains(e.target)) close(false); };
    document.addEventListener('click', onDocClick);

    root.append(panel, toggle);
    document.body.appendChild(root);

    cleanup = () => {
      document.removeEventListener('click', onDocClick);
      root.remove();
      root = null;
    };
  }

  function unmount() {
    cleanup?.();
    cleanup = null;
  }

  function reset() {
    const wasMounted = Boolean(root);
    unmount();
    state = { scale: 1 };
    for (const f of FEATURES) state[f.id] = false;
    applyPrefs(); savePrefs();
    if (wasMounted) mount();
  }

  window.A11yWidget = { mount, unmount, reset, getPrefs: () => ({ ...state }) };

  // Apply saved preferences as early as possible, then build the UI.
  applyPrefs();
  if (window.A11yWidgetConfig?.autoMount !== false) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
    else mount();
  }
})();
```

### `a11y-widget.css`

```css
/*! a11y-widget v1.0.0 | MIT License */

/* ---------- Page adjustments (driven by classes on <html>) ---------- */
html.a11y-scaled { font-size: calc(var(--a11y-scale, 1) * 100%); }

html.a11y-contrast body > :not(.a11yw) { filter: contrast(1.5); }
html.a11y-grayscale body > :not(.a11yw) { filter: grayscale(1); }
html.a11y-contrast.a11y-grayscale body > :not(.a11yw) { filter: contrast(1.5) grayscale(1); }

html.a11y-underline-links a:not(.a11yw *) { text-decoration: underline !important; }

html.a11y-readable-font body :not(.a11yw, .a11yw *, i, code, pre, kbd, samp, [class*="icon"], [class*="fa-"]) {
  font-family: Verdana, Tahoma, "Segoe UI", Arial, sans-serif !important;
}

/* WCAG 1.4.12 text-spacing values */
html.a11y-text-spacing body :not(.a11yw, .a11yw *) {
  line-height: 1.5 !important;
  letter-spacing: 0.12em !important;
  word-spacing: 0.16em !important;
}
html.a11y-text-spacing body p:not(.a11yw *) { margin-bottom: 2em !important; }

html.a11y-stop-motion *,
html.a11y-stop-motion *::before,
html.a11y-stop-motion *::after {
  animation-duration: 0.001ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.001ms !important;
  scroll-behavior: auto !important;
}

html.a11y-focus-highlight :focus-visible {
  outline: 3px solid #ffbf47 !important;
  outline-offset: 2px !important;
  box-shadow: 0 0 0 6px #0b0c0c !important;
}

/* ---------- Widget UI ---------- */
.a11yw {
  --a11yw-bg: #ffffff;
  --a11yw-fg: #1a1a1a;
  --a11yw-border: #8a8a8a;
  --a11yw-accent: #1a56db;
  --a11yw-on-accent: #ffffff;
  position: fixed;
  z-index: 2147483000;
  bottom: 20px;
  right: 20px;
  font: 16px/1.4 system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
  letter-spacing: normal;
  word-spacing: normal;
  text-align: left;
}
@media (prefers-color-scheme: dark) {
  .a11yw {
    --a11yw-bg: #1e1e1e;
    --a11yw-fg: #f2f2f2;
    --a11yw-border: #8a8a8a;
    --a11yw-accent: #7aa7ff;
    --a11yw-on-accent: #0b0c0c;
  }
}
.a11yw--bottom-left { right: auto; left: 20px; }
.a11yw--top-right { bottom: auto; top: 20px; }
.a11yw--top-left { bottom: auto; top: 20px; right: auto; left: 20px; }

.a11yw *, .a11yw *::before, .a11yw *::after { box-sizing: border-box; }
.a11yw button { font: inherit; cursor: pointer; margin: 0; }
.a11yw button:focus-visible { outline: 3px solid #ffbf47; outline-offset: 2px; }
.a11yw button:disabled { opacity: 0.5; cursor: not-allowed; }

.a11yw-toggle {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  padding: 0;
  border: 2px solid #ffffff;
  border-radius: 50%;
  background: #1a56db;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
@media (prefers-reduced-motion: no-preference) {
  .a11yw-toggle { transition: transform 0.15s ease; }
  .a11yw-toggle:hover { transform: scale(1.06); }
}

.a11yw-panel {
  position: absolute;
  bottom: 68px;
  right: 0;
  width: min(320px, calc(100vw - 40px));
  max-height: calc(100vh - 120px);
  overflow: auto;
  padding: 16px;
  background: var(--a11yw-bg);
  color: var(--a11yw-fg);
  border: 1px solid var(--a11yw-border);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}
.a11yw-panel[hidden] { display: none; }
.a11yw--bottom-left .a11yw-panel,
.a11yw--top-left .a11yw-panel { right: auto; left: 0; }
.a11yw--top-right .a11yw-panel,
.a11yw--top-left .a11yw-panel { bottom: auto; top: 68px; }

.a11yw-title { margin: 0 0 12px; font-size: 18px; font-weight: 700; color: inherit; }
.a11yw-row { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.a11yw-row > span { flex: 1; }
.a11yw-row output { min-width: 3.5em; text-align: center; }
.a11yw-options { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

.a11yw-row button,
.a11yw-option,
.a11yw-reset {
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid var(--a11yw-border);
  border-radius: 8px;
  background: transparent;
  color: var(--a11yw-fg);
}
.a11yw-option[aria-pressed="true"] {
  background: var(--a11yw-accent);
  border-color: var(--a11yw-accent);
  color: var(--a11yw-on-accent);
}
.a11yw-reset { width: 100%; margin-top: 12px; }

@media print { .a11yw { display: none; } }
```

### Configuration API

Set `window.A11yWidgetConfig` **before** the script runs (or before `A11yWidget.mount()` when `autoMount` is `false`):

| Key | Default | Purpose |
|---|---|---|
| `enabled` | `true` | `false` (or `"false"` from an env var) disables the UI |
| `position` | `"bottom-right"` | One of the four corner positions |
| `minScale` / `maxScale` / `step` | `0.8` / `2` / `0.1` | Text-size range |
| `labels` | English | Override any label for translation, e.g. `{ title: 'Accesibilidad', contrast: 'Alto contraste' }` |
| `autoMount` | `true` | `false` lets an SPA call `window.A11yWidget.mount()` itself |

Runtime API: `A11yWidget.mount()`, `A11yWidget.unmount()`, `A11yWidget.reset()`, `A11yWidget.getPrefs()`.

### Known limitations (tell the developer)

- Text size only scales text sized in `rem`/`em`/`%` (see Step 2, item 10). While scaled, the widget sets the root `font-size` to a percentage of the browser default, which overrides any root size the site sets itself (for example the `62.5%` trick).
- Contrast and grayscale use CSS `filter` on the body's direct children; this makes those children the containing block for any `position: fixed` element inside them, which can shift sticky headers or modals while those modes are on.
- Readable font skips common icon-font classes; a site with unusual icon class names may need its own exclusion added to the selector.
- Preferences are stored per browser in `localStorage`; they do not follow the visitor across devices.

---

## Step 5: Integrate by framework

Place the two files as shown, then apply only the recipe that matches Step 1.

### Plain HTML / static sites

Put the files in `/assets/a11y-widget/` and add to every page `<head>`:

```html
<link rel="stylesheet" href="/assets/a11y-widget/a11y-widget.css">
<script src="/assets/a11y-widget/a11y-config.js" defer></script>  <!-- optional -->
<script src="/assets/a11y-widget/a11y-widget.js" defer></script>
```

```js
// a11y-config.js (external file keeps CSP strict)
window.A11yWidgetConfig = { position: 'bottom-right' };
```

The config script must come **before** the widget script: deferred scripts run in document order.

For static site generators (Eleventy, Hugo, Jekyll) add the same tags to the base layout template.

### React (Vite)

Files in `src/a11y-widget/`. In `src/main.tsx`:

```tsx
import './a11y-widget/a11y-widget.css';

if (import.meta.env.VITE_A11Y_WIDGET_ENABLED !== 'false') {
  window.A11yWidgetConfig = { position: import.meta.env.VITE_A11Y_WIDGET_POSITION ?? 'bottom-right' };
  import('./a11y-widget/a11y-widget.js');
}
```

### Next.js (App Router)

Files in `lib/a11y-widget/`. Create `components/A11yWidget.tsx`:

```tsx
'use client';
import { useEffect } from 'react';

export default function A11yWidget() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_A11Y_WIDGET_ENABLED === 'false') return;
    window.A11yWidgetConfig = { position: process.env.NEXT_PUBLIC_A11Y_WIDGET_POSITION ?? 'bottom-right' };
    import('@/lib/a11y-widget/a11y-widget.js');
  }, []);
  return null;
}
```

In `app/layout.tsx`:

```tsx
import '@/lib/a11y-widget/a11y-widget.css';
import A11yWidget from '@/components/A11yWidget';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <A11yWidget />
      </body>
    </html>
  );
}
```

For the Pages Router, render `<A11yWidget />` in `pages/_app.tsx` and import the CSS there. The widget's own guard makes the double effect in React Strict Mode harmless.

### TypeScript declaration (all TS projects)

Add `src/a11y-widget.d.ts` (or `types/a11y-widget.d.ts`):

```ts
export {};
declare global {
  interface Window {
    A11yWidgetConfig?: {
      enabled?: boolean | string;
      position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
      minScale?: number; maxScale?: number; step?: number;
      labels?: Record<string, string>;
      autoMount?: boolean;
    };
    A11yWidget?: { mount(): void; unmount(): void; reset(): void; getPrefs(): Record<string, unknown> };
  }
}
```

If the build rejects importing a `.js` file, set `"allowJs": true` in `tsconfig.json` or rename the file to `a11y-widget.ts` with `// @ts-nocheck` at the top.

### Vue 3 (Vite)

Files in `src/a11y-widget/`. In `src/main.ts`, before `createApp(...).mount('#app')`:

```ts
import './a11y-widget/a11y-widget.css';

if (import.meta.env.VITE_A11Y_WIDGET_ENABLED !== 'false') {
  window.A11yWidgetConfig = { position: import.meta.env.VITE_A11Y_WIDGET_POSITION ?? 'bottom-right' };
  import('./a11y-widget/a11y-widget.js');
}
```

### Nuxt 3

Files in `assets/a11y-widget/`. In `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  css: ['~/assets/a11y-widget/a11y-widget.css'],
  runtimeConfig: {
    public: { a11yWidgetEnabled: 'true', a11yWidgetPosition: 'bottom-right' },
  },
});
```

Create `plugins/a11y-widget.client.ts` (the `.client` suffix keeps it out of SSR):

```ts
export default defineNuxtPlugin(async () => {
  const { a11yWidgetEnabled, a11yWidgetPosition } = useRuntimeConfig().public;
  if (String(a11yWidgetEnabled) === 'false') return;
  window.A11yWidgetConfig = { position: a11yWidgetPosition as any };
  await import('~/assets/a11y-widget/a11y-widget.js');
});
```

`NUXT_PUBLIC_A11Y_WIDGET_ENABLED` and `NUXT_PUBLIC_A11Y_WIDGET_POSITION` override these at runtime.

### Angular

Files in `src/a11y-widget/`. In `angular.json` under the build target's `options`, add only the stylesheet:

```json
"styles": ["src/styles.css", "src/a11y-widget/a11y-widget.css"]
```

In each `src/environments/environment*.ts` add `a11yWidget: { enabled: true, position: 'bottom-right' }`, then in `src/main.ts`:

```ts
import { environment } from './environments/environment';

if (environment.a11yWidget?.enabled !== false) {
  window.A11yWidgetConfig = environment.a11yWidget;
  import('./a11y-widget/a11y-widget.js');
}
```

Do **not** add the widget to `angular.json` `scripts`. Angular emits global scripts as deferred scripts, which run after parsing when `document.readyState` is already `interactive`, so the widget would mount immediately, before `main.ts` has set `A11yWidgetConfig`, and silently ignore `enabled` and `position`. The dynamic import above sets the config first. It needs `"allowJs": true` (see the TypeScript section). With Angular SSR, `main.ts` is the browser entry (`main.server.ts` is separate), so the widget only runs in the browser.

### SvelteKit / Svelte

Files in `src/lib/a11y-widget/`. In `src/routes/+layout.svelte`:

```svelte
<script>
  import { onMount } from 'svelte';
  import { env } from '$env/dynamic/public';
  import '$lib/a11y-widget/a11y-widget.css';

  onMount(() => {
    if (env.PUBLIC_A11Y_WIDGET_ENABLED === 'false') return;
    window.A11yWidgetConfig = { position: env.PUBLIC_A11Y_WIDGET_POSITION ?? 'bottom-right' };
    import('$lib/a11y-widget/a11y-widget.js');
  });
</script>

<slot />
```

For plain Svelte + Vite, use the Vue/React `main.ts` pattern with `VITE_` variables.

### Astro

Files in `src/a11y-widget/`. In the base layout (`src/layouts/Layout.astro`):

```astro
---
import '../a11y-widget/a11y-widget.css';
---
<html lang="en">
  <body>
    <slot />
    <script>
      if (import.meta.env.PUBLIC_A11Y_WIDGET_ENABLED !== 'false') {
        window.A11yWidgetConfig = { position: import.meta.env.PUBLIC_A11Y_WIDGET_POSITION ?? 'bottom-right' };
        import('../a11y-widget/a11y-widget.js');
      }
    </script>
  </body>
</html>
```

Astro bundles this `<script>` into an external module, so it stays CSP-friendly.

### WordPress

Create a small plugin at `wp-content/plugins/a11y-widget/` with the two files in `assets/` and this `a11y-widget.php`:

```php
<?php
/**
 * Plugin Name: Accessibility Widget
 * Description: Self-hosted open-source accessibility preferences widget.
 * Version:     1.0.0
 * License:     MIT
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('wp_enqueue_scripts', function () {
    $ver = '1.0.0';
    $url = plugin_dir_url(__FILE__) . 'assets/';

    wp_enqueue_style('a11y-widget', $url . 'a11y-widget.css', [], $ver);
    wp_enqueue_script('a11y-widget', $url . 'a11y-widget.js', [], $ver, [
        'strategy'  => 'defer',
        'in_footer' => true,
    ]);

    $config = apply_filters('a11y_widget_config', [
        'position' => get_option('a11y_widget_position', 'bottom-right'),
    ]);
    wp_add_inline_script('a11y-widget', 'window.A11yWidgetConfig = ' . wp_json_encode($config) . ';', 'before');
});
```

Activate it under Plugins. If the site enforces a strict CSP, replace `wp_add_inline_script` with a second enqueued file (`a11y-config.js`) loaded before the widget. Prefer a plugin over editing the theme's `functions.php`, because theme updates overwrite theme files. For a settings screen, register `a11y_widget_position` with the Settings API.

### Shopify

Upload both files to the theme's `assets/` folder, then in `layout/theme.liquid` before `</head>`:

```liquid
{{ 'a11y-widget.css' | asset_url | stylesheet_tag }}
<script src="{{ 'a11y-widget.js' | asset_url }}" defer></script>
```

### Drupal

In the theme's `mytheme.libraries.yml`:

```yaml
a11y-widget:
  version: 1.0.0
  css:
    theme:
      a11y-widget/a11y-widget.css: {}
  js:
    a11y-widget/a11y-widget.js: { attributes: { defer: true } }
```

Then add `- mytheme/a11y-widget` under `libraries:` in `mytheme.info.yml` and clear caches (`drush cr`).

### Server-rendered apps (Django, Rails, Laravel) and anything else

Copy the files into the framework's static/public folder (`static/`, `app/assets/` or `public/`) and add the two plain-HTML tags to the base template using the framework's asset helper (`{% static %}`, `asset_path`, `asset()`). For any other framework, follow the same rule: load the CSS globally, run the JS once in the browser only, and set `window.A11yWidgetConfig` before it runs.

---

## Step 6: Verify

### Manual checklist

- [ ] Tab reaches the round toggle button; it has a visible focus ring.
- [ ] Enter/Space opens the panel and moves focus inside it.
- [ ] Every option toggles and its pressed state is announced by a screen reader (test with NVDA, VoiceOver or TalkBack).
- [ ] Escape closes the panel and focus returns to the toggle.
- [ ] Preferences survive a reload and a navigation to another page.
- [ ] The widget does not cover cookie banners, chat buttons or the page's own controls (change `position` if it does).
- [ ] The configured `position` is actually applied (confirms the config ran before the widget).
- [ ] No CSP violations in the browser console on a production build.
- [ ] Page works on a 320 px-wide viewport and at 200% browser zoom.

### Automated test (Playwright + axe)

```bash
npm i -D @playwright/test @axe-core/playwright
```

```ts
// tests/a11y-widget.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('accessibility widget works and introduces no violations', async ({ page }) => {
  await page.goto('/');

  const toggle = page.getByRole('button', { name: 'Accessibility options' });
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Accessibility' })).toBeVisible();

  await page.getByRole('button', { name: 'High contrast' }).click();
  await expect(page.locator('html')).toHaveClass(/a11y-contrast/);

  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused();

  await page.reload();
  await expect(page.locator('html')).toHaveClass(/a11y-contrast/);

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

Finish by giving the developer a short report: what was detected, what was fixed in Step 2, what still needs human review, which files were added or changed, and how to toggle the widget per environment.

---

## Optional: publish the widget as an npm package

When the developer wants to reuse the widget across projects, package the two files:

```json
{
  "name": "@your-scope/a11y-widget",
  "version": "1.0.0",
  "description": "Self-hosted, dependency-free accessibility preferences widget",
  "license": "MIT",
  "files": ["a11y-widget.js", "a11y-widget.css", "a11y-widget.d.ts"],
  "main": "a11y-widget.js",
  "types": "a11y-widget.d.ts",
  "sideEffects": true,
  "exports": {
    ".": "./a11y-widget.js",
    "./style.css": "./a11y-widget.css"
  },
  "keywords": ["accessibility", "a11y", "widget", "wcag"]
}
```

Publish with `npm publish --access public`. Projects then use `import '@your-scope/a11y-widget/style.css'` and `import('@your-scope/a11y-widget')` in place of the local paths, and a version-pinned jsDelivr URL (`https://cdn.jsdelivr.net/npm/@your-scope/a11y-widget@1.0.0/a11y-widget.js`) works for non-bundled sites, with the CSP host added as described in Step 3.
