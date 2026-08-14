/**
 * Tab switcher for Install SPEC / Quick start stacks.
 * Markup: [data-spec-tabs] > [data-tab="id"] buttons + [data-panel="id"] panels.
 */
(function () {
  function activate(root, id) {
    root.querySelectorAll('[data-tab]').forEach((btn) => {
      const on = btn.getAttribute('data-tab') === id;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
      btn.setAttribute('tabindex', on ? '0' : '-1');
    });
    root.querySelectorAll('[data-panel]').forEach((panel) => {
      const on = panel.getAttribute('data-panel') === id;
      panel.hidden = !on;
      panel.classList.toggle('is-active', on);
    });
  }

  function bind(root) {
    const buttons = Array.from(root.querySelectorAll('[data-tab]'));
    if (!buttons.length) return;

    const nav = root.querySelector('[role="tablist"]') || root;
    nav.addEventListener('keydown', (ev) => {
      const keys = { ArrowRight: 1, ArrowLeft: -1 };
      if (!(ev.key in keys)) return;
      const current = buttons.findIndex((b) => b.classList.contains('is-active'));
      const next = buttons[(current + keys[ev.key] + buttons.length) % buttons.length];
      activate(root, next.getAttribute('data-tab'));
      next.focus();
      ev.preventDefault();
    });

    buttons.forEach((btn) => {
      btn.setAttribute('role', 'tab');
      btn.addEventListener('click', () => activate(root, btn.getAttribute('data-tab')));
    });
    root.querySelectorAll('[data-panel]').forEach((panel) => {
      panel.setAttribute('role', 'tabpanel');
    });

    const initial = root.querySelector('[data-tab].is-active') || buttons[0];
    activate(root, initial.getAttribute('data-tab'));
  }

  function init() {
    document.querySelectorAll('[data-spec-tabs]').forEach(bind);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
