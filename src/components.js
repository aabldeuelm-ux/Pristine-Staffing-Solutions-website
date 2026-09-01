function renderHeader() {
  const currentPath = window.location.pathname;
  const currentHash = window.location.hash;
  const isHome = currentPath === '/' || currentPath.endsWith('index.html');
  const isGallery = currentPath.endsWith('gallery.html');
  const isCareers = currentPath.endsWith('careers.html');

  const navLinks = [
    { href: '/', label: 'Home', active: isHome && !currentHash },
    { href: '/#about', label: 'About', active: isHome && currentHash === '#about' },
    { href: '/gallery.html', label: 'Gallery', active: isGallery },
    { href: '/#services', label: 'Services', active: isHome && currentHash === '#services' },
    { href: '/careers.html', label: 'Careers', active: isCareers },
    { href: '/careers.html#contact', label: 'Contact', active: isCareers && currentHash === '#contact', conditional: true },
  ];

  const linksHTML = navLinks
    .map(
      (link) =>
        `<a href="${link.href}" class="header__link${link.active ? ' header__link--active' : ''}${link.conditional ? ' header__link--conditional' : ''}">${link.label}</a>`
    )
    .join('');

  return `
    <header class="header">
      <div class="container header__inner">
        <a href="/" class="header__brand">
          <img class="header__logo-mark" src="/pristine-logo.svg" alt="Pristine Staffing Solutions logo" />
          <span class="header__logo">Pristine <span>Staffing Solutions</span></span>
        </a>
        <nav class="header__nav" id="site-nav" aria-label="Primary">
          <img
            class="header__nav-mark"
            src="/pristine-logo.svg"
            alt=""
            aria-hidden="true"
          />
          ${linksHTML}
          <button
            type="button"
            class="theme-toggle"
            data-theme-toggle
            aria-label="Switch to dark mode"
          >
            <span class="theme-toggle__icon theme-toggle__sun" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <circle cx="12" cy="12" r="4"/>
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>
              </svg>
            </span>
            <span class="theme-toggle__icon theme-toggle__moon" aria-hidden="true" hidden>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>
              </svg>
            </span>
          </button>
        </nav>
        <button
          type="button"
          class="header__toggle"
          data-nav-toggle
          aria-label="Open menu"
          aria-controls="site-nav"
          aria-expanded="false"
        >
          <span class="header__toggle-bar" aria-hidden="true"></span>
        </button>
      </div>
    </header>
  `;
}

function renderFooter() {
  const year = new Date().getFullYear();

  return `
    <footer class="footer">
      <div class="container">
        <div class="footer__inner">
          <div>
            <h4>Pristine Staffing Solutions</h4>
            <p>HR consulting and facility management<br/>Bengaluru, India</p>
          </div>
          <div>
            <h4>Quick Links</h4>
            <nav class="footer__nav" aria-label="Footer navigation">
              <a href="/">Home</a>
              <a href="/#about">About</a>
              <a href="/gallery.html">Gallery</a>
              <a href="/#services">Services</a>
              <a href="/careers.html">Careers</a>
              <a href="/careers.html#contact">Contact</a>
            </nav>
          </div>
          <div>
            <h4>Contact</h4>
            <ul class="footer__contact">
              <li><a href="tel:08041327770">080 4132 7770</a></li>
              <li><a href="tel:+919845615587">+91 98456 15587</a></li>
              <li><a href="mailto:hr@pristiness.in">hr@pristiness.in</a></li>
              <li class="footer__address">No 59/1 #A-310, 3rd Floor, GVR Plaza, 3rd Main Road, Srinivasa Layout, Raghavendra Temple Road, Kavalbyrasandra, RT Nagar Post, Bengaluru - 560032, Karnataka, India</li>
            </ul>
          </div>
        </div>
        <div class="footer__bottom">
          <div class="footer__social" aria-label="Follow Pristine Staffing Solutions">
            <a href="https://www.instagram.com/pristine_ss" target="_blank" rel="noopener" aria-label="Instagram">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none"/>
              </svg>
            </a>
            <a href="https://www.linkedin.com/in/pristiness/" target="_blank" rel="noopener" aria-label="LinkedIn">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.22 8h4.56V23H.22V8zM8 8h4.37v2.05h.06c.61-1.15 2.1-2.37 4.32-2.37 4.62 0 5.47 3.04 5.47 7V23h-4.56v-7.2c0-1.72-.03-3.93-2.4-3.93-2.4 0-2.77 1.87-2.77 3.8V23H8V8z"/>
              </svg>
            </a>
            <a href="https://x.com/pristine_ss" target="_blank" rel="noopener" aria-label="X (formerly Twitter)">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93zm-1.29 19.5h2.04L6.49 3.24H4.3l13.31 17.41z"/>
              </svg>
            </a>
          </div>
          <p class="footer__copyright">&copy; ${year} Pristine Staffing Solutions. All rights reserved.</p>
        </div>
      </div>
    </footer>
  `;
}

export { renderHeader, renderFooter };
