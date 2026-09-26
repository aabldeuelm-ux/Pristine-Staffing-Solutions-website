const LOGO_FLIGHT_END = 0.55;
const HEADLINE_IN = [0.55, 1];
const EYEBROW_IN = [0.74, 0.89];
const LEDE_IN = [0.82, 0.96];
const ACTIONS_IN = [0.88, 1];
const INTRO_LOGO_WIDTH = 0.34;
const INTRO_LOGO_MAX_W = 320;
const INTRO_LOGO_HEIGHT = 0.5;
const INTRO_STAGE_LOGO = 0.56;
const INTRO_GAP = 0.16;
const INTRO_TEXT_MIN = 40;
const INTRO_TEXT_MAX = 68;
const INTRO_TEXT_VW = 0.09;
const SEED_GAP = 0.02;
const SEED_STRETCH = 0.045;
const LETTER_STAGGER = 0.022;
const FRAME_WAIT = 2500;
const SEQUENCE_HERO_RATIO = 0.85;
const SEQUENCE_VIEW_RATIO = 0.85;
const SEQUENCE_MIN = 420;

function clamp01(value) {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

function lerp(from, to, t) {
  return from + (to - from) * t;
}

function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOut(t) {
  return 1 - Math.pow(1 - t, 3);
}

function span(value, range) {
  return clamp01((value - range[0]) / (range[1] - range[0]));
}

function prefersReducedMotion() {
  return (
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function untransformedRect(el) {
  const previous = el.style.transform;
  el.style.transform = 'none';
  const rect = el.getBoundingClientRect();
  el.style.transform = previous;
  return rect;
}

// The headline is split into one span per character so the three seed letters
// (the first letter of each word — "PSS") can physically travel, spread and
// scale into the finished headline instead of being cross-faded with it.
function splitHeadline(title) {
  const label = title.textContent.replace(/\s+/g, ' ').trim();
  if (!label) return [];

  const letters = [];
  const words = label.split(' ');
  title.textContent = '';
  title.setAttribute('aria-label', label);
  title.style.opacity = '1';

  words.forEach((word, wordIndex) => {
    const wordEl = document.createElement('span');
    wordEl.className = 'hl-w';
    Array.from(word).forEach((glyph, charIndex) => {
      const el = document.createElement('span');
      el.className = 'hl-c';
      el.textContent = glyph;
      if (charIndex > 0) el.style.transformOrigin = 'left center';
      wordEl.appendChild(el);
      letters.push({ el, seed: charIndex === 0, order: charIndex, wordIndex });
    });
    title.appendChild(wordEl);
    if (wordIndex < words.length - 1) {
      title.appendChild(document.createTextNode(' '));
    }
  });

  return letters;
}

export function initHeroScroll(visual, hero3d) {
  const hero = document.querySelector('.hero');
  if (!hero || !visual) return;

  const title = hero.querySelector('.hero__title');
  if (!title) return;

  const getLogoFrame = (hero3d && hero3d.getLogoFrame) || null;
  const setOversample = (hero3d && hero3d.setOversample) || null;
  const reduced = prefersReducedMotion();
  const stage = hero.closest('.hero-stage');

  // With reduced motion there is no sequence to run: the hero is not pinned,
  // no scroll distance is added, and the stylesheet already shows the finished
  // layout. The headline is left as plain text and nothing is measured, split
  // or listened for, so the hero is complete and usable from the first paint.
  if (reduced) {
    hero.classList.add('is-settled');
    return;
  }

  const letters = splitHeadline(title);
  const pieces = [
    { el: hero.querySelector('.hero__eyebrow'), range: EYEBROW_IN },
    { el: hero.querySelector('.hero__lede'), range: LEDE_IN },
    { el: hero.querySelector('.hero__actions'), range: ACTIONS_IN },
  ].filter((piece) => piece.el);

  let metrics = null;
  let sequenceDistance = 600;
  let frameReady = !getLogoFrame;
  let settled = false;
  let idle = false;
  let io = null;
  let ro = null;
  let waitTimer = null;

  function measure() {
    const heroRect = hero.getBoundingClientRect();
    const visualRect = untransformedRect(visual);
    const titleSize = parseFloat(getComputedStyle(title).fontSize);
    const frame = (getLogoFrame && getLogoFrame()) || {
      width: visualRect.width * 0.66,
      height: visualRect.height * 0.66,
    };

    // The hero sticks to the top of the viewport, but the fixed header keeps
    // the intro composition clear of it. Reading the offset from the body
    // padding keeps the composition identical in both scroll states.
    const headerOffset = parseFloat(getComputedStyle(document.body).paddingTop) || 0;
    const stageBox = Math.min(
      heroRect.height,
      Math.max(window.innerHeight - headerOffset, 0)
    );
    const maxLogoHeight = Math.min(
      heroRect.height * INTRO_LOGO_HEIGHT,
      stageBox * INTRO_STAGE_LOGO
    );
    const startScale = Math.min(
      Math.min(heroRect.width * INTRO_LOGO_WIDTH, INTRO_LOGO_MAX_W) /
        frame.width,
      maxLogoHeight / frame.height
    );
    const logoHeight = frame.height * startScale;
    const gap = logoHeight * INTRO_GAP;
    const introTextSize = Math.min(
      Math.max(window.innerWidth * INTRO_TEXT_VW, INTRO_TEXT_MIN),
      INTRO_TEXT_MAX
    );
    const seedScale = titleSize > 0 ? introTextSize / titleSize : 1;
    const textHeight = titleSize * 1.1;
    const groupTop = Math.max(
      (stageBox - (logoHeight + gap + textHeight)) / 2,
      0
    );

    metrics = {
      startScale,
      visualOffsetX:
        heroRect.width / 2 -
        (visualRect.left - heroRect.left + visualRect.width / 2),
      visualOffsetY:
        groupTop + logoHeight / 2 -
        (visualRect.top - heroRect.top + visualRect.height / 2),
      seedScale,
      letters: measureLetters(
        logoHeight,
        gap,
        groupTop,
        seedScale,
        titleSize,
        heroRect
      ),
    };

    if (stage && !reduced) {
      sequenceDistance = Math.max(
        SEQUENCE_MIN,
        Math.min(
          heroRect.height * SEQUENCE_HERO_RATIO,
          window.innerHeight * SEQUENCE_VIEW_RATIO
        )
      );
      const stageHeight = Math.round(heroRect.height + sequenceDistance);
      if (Math.abs(stage.getBoundingClientRect().height - stageHeight) > 1) {
        stage.style.height = stageHeight + 'px';
      }
    }
  }

  // Measures where every character sits in the finished headline, then works
  // out the two positions of the "PSS" cluster: centred beneath the centred
  // logo at the start, and over the headline once the logo has moved aside.
  function measureLetters(
    logoHeight,
    gap,
    groupTop,
    seedScale,
    titleSize,
    heroRect
  ) {
    if (!letters.length) return [];

    const saved = letters.map((letter) => letter.el.style.cssText);
    letters.forEach((letter) => {
      letter.el.style.transform = 'none';
      letter.el.style.opacity = '1';
      letter.el.style.clipPath = 'none';
    });

    const titleRect = untransformedRect(title);
    const placed = letters.map((letter) => {
      const rect = letter.el.getBoundingClientRect();
      return {
        x: rect.left - titleRect.left,
        y: rect.top - titleRect.top,
        baseWidth: rect.width,
        height: rect.height,
        width: rect.width * (letter.seed ? seedScale : 1),
      };
    });

    letters.forEach((letter, index) => {
      letter.el.style.cssText = saved[index];
    });

    // The cluster is positioned against the hero, but each letter is moved by
    // a transform inside the headline, so both spaces have to be reconciled.
    const titleLeft = titleRect.left - heroRect.left;
    const titleTop = titleRect.top - heroRect.top;
    const seedGap = titleSize * SEED_GAP;
    const clusterWidth =
      placed.reduce((total, item, index) => {
        const letter = letters[index];
        return letter.seed ? total + item.width + seedGap : total;
      }, -seedGap);
    const clusterLeft = heroRect.width / 2 - clusterWidth / 2;
    const clusterTop = groupTop + logoHeight + gap;

    // The logo travels right to its final place while the cluster travels left
    // to the headline, both on the same curve, so the split that follows is a
    // bloom in place instead of a second journey across the hero. The cluster
    // lands on the centre of mass of the three real seed letters, which keeps
    // that bloom balanced and its travel minimal.
    const seeds = [];
    let cursor = clusterLeft;
    placed.forEach((item, index) => {
      if (!letters[index].seed) return;
      seeds[index] = {
        el: letters[index].el,
        x: item.x,
        y: item.y,
        startX: cursor,
        layoutCx: item.x + item.baseWidth / 2 + titleLeft,
        clusterCx: cursor + item.width / 2,
        layoutCy: item.y + item.height / 2 + titleTop,
        clusterCy: clusterTop + (item.height * seedScale) / 2,
      };
      cursor += item.width + seedGap;
    });

    const liveSeeds = seeds.filter(Boolean);
    const mean = (values) => values.reduce((a, b) => a + b, 0) / values.length;
    const shiftX =
      mean(liveSeeds.map((s) => s.layoutCx)) -
      mean(liveSeeds.map((s) => s.clusterCx));
    const shiftY =
      mean(liveSeeds.map((s) => s.layoutCy)) -
      mean(liveSeeds.map((s) => s.clusterCy));

    return placed.map((item, index) => {
      const letter = letters[index];
      if (!letter.seed) {
        return {
          el: letter.el,
          seed: false,
          delay: letter.order * LETTER_STAGGER,
        };
      }
      const seed = seeds[index];
      return {
        el: seed.el,
        seed: true,
        x: seed.x,
        y: seed.y,
        x0: seed.startX - titleLeft,
        y0: clusterTop - titleTop,
        x1: seed.startX + shiftX - titleLeft,
        y1: clusterTop + shiftY - titleTop,
      };
    });
  }

  function apply(p) {
    if (!metrics) return;

    // Stage 1: the logo flies right to its final place and the "PSS" flies
    // left to the headline at the same time, on the same curve.
    const flight = easeInOut(span(p, [0, LOGO_FLIGHT_END]));
    const scale = lerp(metrics.startScale, 1, flight);

    visual.style.visibility = frameReady ? 'visible' : 'hidden';
    visual.style.transform = `translate3d(${(
      metrics.visualOffsetX * (1 - flight)
    ).toFixed(2)}px, ${(metrics.visualOffsetY * (1 - flight)).toFixed(
      2
    )}px, 0) scale(${scale.toFixed(4)})`;
    if (setOversample) setOversample(scale);

    // Stage 2: the "PSS" splits open and expands into the headline in place,
    // the remaining letters unfolding behind them.
    const morph = easeInOut(span(p, HEADLINE_IN));
    const stretch = SEED_STRETCH * Math.sin(Math.PI * morph);

    metrics.letters.forEach((letter) => {
      if (letter.seed) {
        const groupX = lerp(letter.x0, letter.x1, flight);
        const groupY = lerp(letter.y0, letter.y1, flight);
        const toX = (lerp(groupX, letter.x, morph) - letter.x).toFixed(2);
        const toY = (lerp(groupY, letter.y, morph) - letter.y).toFixed(2);
        letter.el.style.opacity = '1';
        letter.el.style.clipPath = 'none';
        letter.el.style.transform =
          `translate(${toX}px, ${toY}px) ` +
          `scale(${(lerp(metrics.seedScale, 1, morph) + stretch).toFixed(4)})`;
        return;
      }
      const t = easeOut(
        clamp01((morph - letter.delay) / Math.max(1 - letter.delay, 0.001))
      );
      letter.el.style.transform = `scale(${t.toFixed(4)})`;
      letter.el.style.opacity = t.toFixed(3);
      letter.el.style.clipPath = `inset(0 ${((1 - t) * 100).toFixed(2)}% 0 0)`;
    });

    pieces.forEach((piece) => {
      const t = easeOut(span(p, piece.range));
      piece.el.style.opacity = t.toFixed(3);
      piece.el.style.transform =
        t >= 1 ? 'none' : `translateY(${lerp(20, 0, t).toFixed(2)}px)`;
    });

    // 0.995 absorbs sub-pixel scroll rounding at the end of the pinned range;
    // every value it forces is already visually final at that point.
    const done = p >= 0.995;
    if (done && !settled) {
      settled = true;
      hero.classList.add('is-settled');
      title.style.opacity = '1';
      metrics.letters.forEach((letter) => {
        letter.el.style.transform = 'none';
        letter.el.style.opacity = '1';
        letter.el.style.clipPath = 'none';
      });
      visual.style.transform = 'none';
      if (setOversample) setOversample(1);
    } else if (!done && settled) {
      settled = false;
      hero.classList.remove('is-settled');
    }

    hero.classList.toggle('is-scrolling', p > 0.02);
  }

  function readProgress() {
    return clamp01(window.scrollY / sequenceDistance);
  }

  function render() {
    apply(readProgress());
  }

  function onScroll() {
    if (idle) return;
    render();
  }

  function sync() {
    measure();
    render();
  }

  function waitForFrame() {
    if (!getLogoFrame) return;
    waitTimer = window.setInterval(() => {
      if (!getLogoFrame()) return;
      window.clearInterval(waitTimer);
      waitTimer = null;
      frameReady = true;
      sync();
    }, 80);
    window.setTimeout(() => {
      if (waitTimer === null) return;
      window.clearInterval(waitTimer);
      waitTimer = null;
      frameReady = true;
      sync();
    }, FRAME_WAIT);
  }

  measure();
  render();

  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          idle = !entry.isIntersecting;
          if (!idle) render();
        }
      },
      { threshold: 0 }
    );
    io.observe(hero);
  }

  if ('ResizeObserver' in window) {
    ro = new ResizeObserver(sync);
    ro.observe(hero);
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(sync);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', sync);
  window.addEventListener('orientationchange', sync);

  waitForFrame();
}
