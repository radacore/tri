import { STRINGS, type Lang } from '../i18n/ui';

const KEY = 'lp-lang';

declare global {
  interface Window {
    __lpGetLang?: () => Lang;
    __lpSetLang?: (l: Lang) => void;
    __lpT?: typeof STRINGS;
  }
}

export function getLang(): Lang {
  if (typeof window === 'undefined') return 'en';
  try {
    const s = localStorage.getItem(KEY);
    if (s === 'en' || s === 'id') return s;
    const nav = (navigator.language || 'en').toLowerCase();
    return nav.startsWith('id') ? 'id' : 'en';
  } catch {
    return 'en';
  }
}

function paintSwitcher(l: Lang) {
  document.querySelectorAll('[data-lang-btn]').forEach((b) => {
    const on = b.getAttribute('data-lang-btn') === l;
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.classList.toggle('bg-dark', on);
    b.classList.toggle('text-white', on);
    b.classList.toggle('text-slate-500', !on);
  });
}

export function applyLang(l: Lang) {
  const d = STRINGS[l];
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const v = d[el.getAttribute('data-i18n') || ''];
    if (v != null) el.textContent = v;
  });
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => {
    const v = d[el.getAttribute('data-i18n-ph') || ''];
    if (v != null) (el as HTMLInputElement | HTMLTextAreaElement).placeholder = v;
  });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const v = d[el.getAttribute('data-i18n-aria') || ''];
    if (v != null) el.setAttribute('aria-label', v);
  });
  document.querySelectorAll('[data-l]').forEach((el) => {
    (el as HTMLElement).hidden = el.getAttribute('data-l') !== l;
  });
  document.documentElement.lang = l;
  paintSwitcher(l);
}

export function setLang(l: Lang) {
  try {
    localStorage.setItem(KEY, l);
  } catch {
    /* private mode — tetap terapkan untuk sesi ini */
  }
  applyLang(l);
  window.dispatchEvent(new CustomEvent('lp-lang', { detail: l }));
}

export function initLang() {
  window.__lpGetLang = getLang;
  window.__lpSetLang = setLang;
  window.__lpT = STRINGS;
  document.querySelectorAll('[data-lang-btn]').forEach((b) => {
    b.addEventListener('click', () => setLang((b.getAttribute('data-lang-btn') || 'en') as Lang));
  });
  applyLang(getLang());
  document.addEventListener('lp-lang', () => {
    /* halaman dinamis (mis. ringkasan order) bisa me-refresh lewat event ini */
  });
}

initLang();
