function prefersReducedMotion() {
  return (
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function initReveal() {
  const els = document.querySelectorAll('[data-reveal]');
  const reduced = prefersReducedMotion();

  if (reduced || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );

  els.forEach((el) => {
    el.classList.add('reveal');
    io.observe(el);
  });
}

function animateCount(el, target, suffix) {
  const duration = 1100;
  const start = performance.now();
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  const frame = (now) => {
    const p = Math.min(Math.max((now - start) / duration, 0), 1);
    el.textContent = Math.round(target * easeOut(p)) + suffix;
    if (p < 1) requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
}

function initCountUp() {
  const els = document.querySelectorAll('[data-count]');
  const reduced = prefersReducedMotion();

  if (reduced || !('IntersectionObserver' in window)) {
    els.forEach((el) => {
      const suffix = el.dataset.suffix || '';
      el.textContent = el.dataset.count + suffix;
    });
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const el = entry.target;
          animateCount(
            el,
            parseFloat(el.dataset.count) || 0,
            el.dataset.suffix || ''
          );
          io.unobserve(el);
        }
      }
    },
    { threshold: 0.6 }
  );

  els.forEach((el) => io.observe(el));
}

function initServiceTiles() {
  const tiles = document.querySelectorAll('.services__tile');
  tiles.forEach((tile) => {
    const desc = tile.querySelector('.services__tile-desc');
    if (!desc) return;

    tile.addEventListener('click', () => {
      const isOpen = desc.hidden === false;

      tiles.forEach((other) => {
        const d = other.querySelector('.services__tile-desc');
        if (!d) return;
        if (other !== tile) {
          d.hidden = true;
          other.classList.remove('is-open');
        }
      });

      desc.hidden = isOpen;
      tile.classList.toggle('is-open', !isOpen);
    });
  });
}

function initCareerRoles() {
  const roles = document.querySelectorAll('.careers__role');
  roles.forEach((role) => {
    const desc = role.querySelector('.careers__role-desc');
    if (!desc) return;

    const toggle = (open) => {
      desc.hidden = !open;
      role.classList.toggle('is-open', open);
    };

    role.addEventListener('click', () => toggle(desc.hidden));
  });
}

function initScrollSpy() {
  const links = Array.from(document.querySelectorAll('.header__link'));
  if (links.length === 0) return;

  const currentPath = window.location.pathname;

  const targets = links.map((link) => {
    const href = link.getAttribute('href') || '/';
    const [pathPart, hash] = href.split('#');
    const targetPage = pathPart === '' || pathPart === '/' ? '/' : pathPart;

    const currentBase = currentPath.split('/').pop().replace('.html', '') || 'index';
    const targetBase = targetPage.split('/').pop().replace('.html', '') || 'index';
    const pageMatches =
      (currentBase === 'index' && targetBase === 'index') ||
      currentBase === targetBase;

    const sectionId = hash || (pageMatches && targetBase !== 'index' ? targetBase : null);
    const section = sectionId ? document.getElementById(sectionId) : null;
    if (pageMatches && targetPage === '/' && !sectionId) {
      return { link, section: document.getElementById('home'), pageMatches };
    }
    return { link, section, pageMatches };
  });

  const setActive = (winning) => {
    targets.forEach(({ link, pageMatches }) => {
      const on = pageMatches && winning && winning.link === link;
      link.classList.toggle('header__link--active', !!on);
    });
  };

  const resolve = (current) =>
    targets.find((t) => t.pageMatches && t.section === current) ||
    targets.find((t) => t.pageMatches);

  const onScroll = () => {
    const offset = 120;
    let current = null;
    for (const { section, pageMatches } of targets) {
      if (!pageMatches || !section) continue;
      if (section.getBoundingClientRect().top <= offset) {
        current = section;
      } else if (current) {
        break;
      }
    }

    setActive(resolve(current));
  };

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

function initHeaderTransform() {
  const header = document.querySelector('.header');
  const nav = header && header.querySelector('.header__nav');
  if (!header || !nav) return null;

  const THRESHOLD = 60;

  const syncHeight = () => {
    document.body.style.setProperty('--header-h', `${header.offsetHeight}px`);
  };

  const centerNav = () => {
    if (window.innerWidth <= 900) return;
    // offsetLeft/offsetWidth are layout-space values that ignore the
    // --nav-shift transform (and its transition), so the computed natural
    // center is stable regardless of the current shift. This lets us recenter
    // whenever the nav's width changes (e.g. the conditional Contact link
    // collapsing/appearing) without any feedback loop.
    const parent = nav.offsetParent;
    const parentLeft = parent ? parent.getBoundingClientRect().left : 0;
    const naturalCenter = parentLeft + nav.offsetLeft + nav.offsetWidth / 2;
    const shift = window.innerWidth / 2 - naturalCenter;
    nav.style.setProperty('--nav-shift', `${shift}px`);
  };

  const resetNav = () => {
    nav.style.setProperty('--nav-shift', '0px');
  };

  const onScroll = () => {
    const compact = window.scrollY > THRESHOLD;
    header.classList.toggle('is-compact', compact);
    if (compact) centerNav();
    else resetNav();
  };

  const navMark = nav.querySelector('.header__nav-mark');

  const recenter = () => {
    if (header.classList.contains('is-compact')) centerNav();
  };

  // When the inline nav logo reveals/collapses, the nav's width animates over
  // its transition; re-center once that layout change completes so the links
  // stay perfectly centered.
  if (navMark) {
    navMark.addEventListener('transitionend', (e) => {
      if (e.propertyName === 'max-width') recenter();
    });
  }

  syncHeight();
  centerNav();
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    syncHeight();
    recenter();
  });

  return {
    recenter() {
      // Re-center if the nav is currently in its compact/centered state so a
      // change in nav width (Contact link appearing/collapsing) stays centered.
      recenter();
    }
  };
}

function initMobileMenu() {
  const header = document.querySelector('.header');
  const nav = document.querySelector('.header__nav');
  const toggle = document.querySelector('[data-nav-toggle]');
  if (!header || !nav || !toggle) return;

  const setOpen = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(!nav.classList.contains('is-open'));
  });

  // Close when a nav link is tapped.
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
  });

  // Close when tapping outside the nav or the toggle.
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('is-open') && !nav.contains(e.target) && !toggle.contains(e.target)) {
      setOpen(false);
    }
  });

  // Close on Escape.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus();
    }
  });

  // Close the menu on resize up to desktop (nav is inline there).
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) setOpen(false);
  });
}

function initScrollIndicator() {
  const indicator = document.querySelector('.hero__scroll[data-scroll-indicator]');
  const hero = document.getElementById('home');
  if (!indicator || !hero) return;

  const onScroll = () => {
    const heroRect = hero.getBoundingClientRect();
    // Show the indicator while the hero section is on screen; hide it once the
    // hero has fully scrolled up past the top of the viewport.
    const hide = heroRect.bottom <= 0;
    indicator.classList.toggle('is-hidden', hide);
  };

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
}

function initContactVisibility(headerApi) {
  const condLink = document.querySelector('.header__link--conditional');
  if (!condLink) return;

  const isHome =
    window.location.pathname === '/' ||
    window.location.pathname.endsWith('index.html');

  const hero = document.getElementById('home');

  // On every page other than the homepage, the Contact link is always visible.
  if (!isHome || !hero) {
    condLink.classList.add('is-visible');
    condLink.classList.remove('is-hidden');
    return;
  }

  const setVisible = (show) => {
    condLink.classList.toggle('is-visible', show);
    condLink.classList.toggle('is-hidden', !show);
    // Changing the nav's content width shifts its center, so re-center the
    // compact nav to keep it perfectly aligned.
    if (headerApi && typeof headerApi.recenter === 'function') headerApi.recenter();
  };

  const onScroll = () => {
    const headerRect = document.querySelector('.header').getBoundingClientRect();
    const heroRect = hero.getBoundingClientRect();
    // Contact appears once the hero has scrolled far enough up that its
    // bottom edge clears the header.
    setVisible(heroRect.bottom < headerRect.bottom - 8);
  };

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
}

export function initMotion() {
  initReveal();
  initCountUp();
  initServiceTiles();
  initCareerRoles();
  initScrollSpy();
  const headerApi = initHeaderTransform();
  initContactVisibility(headerApi);
  initScrollIndicator();
  initMobileMenu();
}