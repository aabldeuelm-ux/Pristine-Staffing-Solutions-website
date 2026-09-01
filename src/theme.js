const STORAGE_KEY = 'pristine-theme';

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const buttons = document.querySelectorAll('[data-theme-toggle]');
  buttons.forEach((btn) => {
    btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    const sun = btn.querySelector('.theme-toggle__sun');
    const moon = btn.querySelector('.theme-toggle__moon');
    if (sun) sun.hidden = theme === 'dark';
    if (moon) moon.hidden = theme === 'light';
  });
}

export function initTheme() {
  const saved = (() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  })();

  const prefersDark =
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  const initial =
    saved === 'light' || saved === 'dark'
      ? saved
      : prefersDark
      ? 'dark'
      : 'light';

  applyTheme(initial);

  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next =
        document.documentElement.getAttribute('data-theme') === 'dark'
          ? 'light'
          : 'dark';
      applyTheme(next);
      window.dispatchEvent(new CustomEvent('theme:toggle'));
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* storage unavailable */
      }
    });
  });
}