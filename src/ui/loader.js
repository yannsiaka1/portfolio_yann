// Préchargement : journal de build, compteur à rouleaux, puis ouverture en 10 bandes.
// Il attend la scène 3D, les polices et une durée minimale, avec des délais de secours.
import { gsap, ScrollTrigger } from '../core/gsap.js';
import { $, $$, root, reduce } from '../core/env.js';
import { state, EVT_GL_READY } from '../core/state.js';
import { pauseScroll, resumeScroll } from '../core/scroll.js';
import { playHeroIntro } from '../sections/hero.js';

const MIN_TIME = 1650; // durée minimale à l'écran (ms)
const GL_TIMEOUT = 5000; // au-delà, on continue sans attendre la 3D
const FONTS_TIMEOUT = 2500;

export function runLoader() {
  const loader = $('#loader');
  const finish = () => {
    root.classList.remove('is-loading');
    resumeScroll();
    playHeroIntro();
    ScrollTrigger.refresh();
  };
  if (!loader) return finish();
  if (reduce) {
    loader.remove();
    return finish();
  }

  root.classList.add('is-loading');
  pauseScroll();

  const strips = $$('.reel__strip', loader);
  const lines = $$('.loader__log p', loader);
  const counter = { v: 0 };
  const paint = () => {
    const digits = String(Math.round(counter.v)).padStart(3, '0');
    strips.forEach((r, i) => {
      r.style.transform = `translateY(${-Number(digits[i])}em)`;
    });
    const shown = Math.max(1, Math.ceil((counter.v / 100) * lines.length));
    lines.forEach((l, i) => l.classList.toggle('is-on', i < shown));
  };
  paint();

  gsap.from('.loader__corner', {
    autoAlpha: 0,
    x: (i) => [-40, 40, -40, 40][i],
    y: (i) => [-40, -40, 40, 40][i],
    duration: 0.8,
    ease: 'expo.out',
    stagger: 0.05,
  });
  gsap.to(counter, { v: 74, duration: 1.5, ease: 'power2.inOut', onUpdate: paint, delay: 0.15 });

  const glReady = new Promise((resolve) => {
    if (state.glReady) return resolve();
    window.addEventListener(EVT_GL_READY, resolve, { once: true });
    setTimeout(resolve, GL_TIMEOUT);
  });
  const fontsReady =
    document.fonts && document.fonts.ready
      ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, FONTS_TIMEOUT))])
      : Promise.resolve();
  const minTime = new Promise((r) => setTimeout(r, MIN_TIME));

  Promise.all([glReady, fontsReady, minTime]).then(() => {
    if (!state.glReady) root.classList.add('no-gl');
    gsap.killTweensOf(counter);
    gsap
      .timeline({ onComplete: () => loader.remove() })
      .to(counter, { v: 100, duration: 0.55, ease: 'power2.out', onUpdate: paint })
      .to('.loader__frame', { autoAlpha: 0, y: -18, duration: 0.45, ease: 'power2.in' }, '+=0.12')
      .add(finish)
      .to('.loader__belts i', { scaleY: 0, duration: 0.85, ease: 'expo.inOut', stagger: { each: 0.045, from: 'start' } }, '<');
  });
}
