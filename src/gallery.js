export function initGalleryLightbox() {
  const items = Array.from(document.querySelectorAll('.gallery__item'));
  if (items.length === 0) return;

  const overlay = document.createElement('div');
  overlay.className = 'lightbox';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.hidden = true;

  overlay.innerHTML = `
    <button type="button" class="lightbox__close" aria-label="Close image viewer">&times;</button>
    <button type="button" class="lightbox__nav lightbox__nav--prev" aria-label="Previous image">&lsaquo;</button>
    <figure class="lightbox__figure">
      <img class="lightbox__img" alt="" />
      <figcaption class="lightbox__caption"></figcaption>
    </figure>
    <button type="button" class="lightbox__nav lightbox__nav--next" aria-label="Next image">&rsaquo;</button>
  `;

  document.body.appendChild(overlay);

  const img = overlay.querySelector('.lightbox__img');
  const caption = overlay.querySelector('.lightbox__caption');
  const closeBtn = overlay.querySelector('.lightbox__close');
  const prevBtn = overlay.querySelector('.lightbox__nav--prev');
  const nextBtn = overlay.querySelector('.lightbox__nav--next');

  let index = 0;
  let lastFocused = null;

  const open = (i) => {
    index = i;
    lastFocused = document.activeElement;
    render();
    overlay.hidden = false;
    document.body.classList.add('lightbox--open');
    closeBtn.focus();
  };

  const close = () => {
    overlay.hidden = true;
    document.body.classList.remove('lightbox--open');
    if (lastFocused) lastFocused.focus();
  };

  const render = () => {
    const figure = items[index];
    const source = figure.querySelector('.gallery__img');
    img.src = source.src;
    img.alt = source.alt || '';
    caption.textContent = source.alt || '';
  };

  const step = (dir) => {
    index = (index + dir + items.length) % items.length;
    render();
  };

  items.forEach((item, i) => {
    item.addEventListener('click', () => open(i));
  });

  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', () => step(-1));
  nextBtn.addEventListener('click', () => step(1));

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  document.addEventListener('keydown', (e) => {
    if (overlay.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  });
}