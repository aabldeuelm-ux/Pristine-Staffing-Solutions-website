import { renderHeader, renderFooter } from './components.js';
import { inject } from '@vercel/analytics';
import { initHero3D } from './hero3d.js';
import { initMotion } from './motion.js';
import { initContactForm } from './contact.js';
import { initTheme } from './theme.js';

inject();

document.getElementById('header-root').innerHTML = renderHeader();
document.getElementById('footer-root').innerHTML = renderFooter();

const heroContainer = document.getElementById('hero-three');
if (heroContainer) {
  initHero3D(heroContainer);
}

initTheme();
initMotion();
initContactForm();
