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
