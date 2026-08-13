/**
 * i18n para Tuk Tuk landing (misma dinámica ES/EN que Job Copilot / useLocales).
 * Librería: i18next (CDN) · storage: p2l-locale
 * Catálogos embebidos en scripts/locales-embed.js (sin fetch; evita claves crudas).
 */
(function () {
  const STORAGE_KEY = 'p2l-locale'
  const DEFAULT_LANG = 'es'

  function normalizeLocale(code) {
    return String(code || '').toLowerCase().startsWith('en') ? 'en' : 'es'
  }

  function getSavedLocale() {
    try {
      return normalizeLocale(localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG)
    } catch (_) {
      return DEFAULT_LANG
    }
  }

  function persistLocale(code) {
    const normalized = normalizeLocale(code)
    try {
      localStorage.setItem(STORAGE_KEY, normalized)
    } catch (_) {
      /* ignore */
    }
    document.documentElement.lang = normalized
    return normalized
  }

  function applyStaticTranslations() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n')
      if (!key) return
      const value = i18next.t(key)
      if (value == null || value === key || typeof value !== 'string') return
      if (el.hasAttribute('data-i18n-html')) {
        el.innerHTML = value
      } else {
        el.textContent = value
      }
    })

    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      const key = el.getAttribute('data-i18n-aria')
      if (!key) return
      const value = i18next.t(key)
      if (value && value !== key && typeof value === 'string') {
        el.setAttribute('aria-label', value)
      }
    })

    document.querySelectorAll('[data-i18n-meta]').forEach((el) => {
      const key = el.getAttribute('data-i18n-meta')
      if (!key) return
      const value = i18next.t(key)
      if (value && value !== key && typeof value === 'string') {
        el.setAttribute('content', value)
      }
    })
  }

  function syncLangSwitch(active) {
    document.querySelectorAll('[data-set-locale]').forEach((btn) => {
      const code = btn.getAttribute('data-set-locale')
      btn.classList.toggle('qa-lang-switch__btn--active', code === active)
      btn.setAttribute('aria-pressed', code === active ? 'true' : 'false')
    })
  }

  async function setLocale(code, opts = {}) {
    const lang = persistLocale(code)
    await i18next.changeLanguage(lang)
    syncLangSwitch(lang)
    applyStaticTranslations()
    if (typeof window.onTukiLocaleChange === 'function') {
      window.onTukiLocaleChange(lang, { skipScroll: !!opts.skipScroll })
    }
  }

  async function initI18n() {
    if (typeof i18next === 'undefined') {
      console.error('[Tuk Tuk i18n] i18next no cargó')
      return
    }

    const resources = window.TUKI_I18N_RESOURCES
    if (!resources || !resources.es || !resources.en) {
      console.error('[Tuk Tuk i18n] Falta scripts/locales-embed.js')
      return
    }

    const initial = getSavedLocale()
    persistLocale(initial)

    await i18next.init({
      lng: initial,
      fallbackLng: DEFAULT_LANG,
      debug: false,
      resources,
      returnObjects: true,
      interpolation: { escapeValue: false }
    })

    syncLangSwitch(initial)
    applyStaticTranslations()

    document.querySelectorAll('[data-set-locale]').forEach((btn) => {
      btn.addEventListener('click', () => {
        setLocale(btn.getAttribute('data-set-locale'), { skipScroll: true })
      })
    })

    window.tukiI18n = {
      t: (key, opts) => i18next.t(key, opts),
      setLocale,
      getLocale: () => normalizeLocale(i18next.language),
      applyStaticTranslations,
      ready: true
    }

    if (typeof window.onTukiI18nReady === 'function') {
      window.onTukiI18nReady(initial)
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initI18n)
  } else {
    initI18n()
  }
})()
