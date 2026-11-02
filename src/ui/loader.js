// Intro : journal de build, compteur, puis ouverture en huit bandes. Une fois par visite (sessionStorage),
// jamais avec « réduire les animations » (le script de <head> ne pose alors pas .is-loading), et un clic ou
// Échap la passe. Elle attend la scène 3D et les polices, avec des délais de secours.
import { gsap, ScrollTrigger } from '../core/gsap.js';
import { $, $$, root } from '../core/env.js';
import { state, EVT_GL_READY, fireIntro } from '../core/state.js';
import { pauseScroll, resumeScroll } from '../core/scroll.js';

const MIN_TIME = 1300; // durée minimale à l'écran (ms)
const GL_TIMEOUT = 4000; // au-delà, on continue sans attendre la 3D
const FONTS_TIMEOUT = 2000;

export function runLoader() {
  const loader = $('#loader');
  const finish = () => {
    root.classList.remove('is-loading');
    resumeScroll();
    fireIntro();
    ScrollTrigger.refresh();
  };
  if (!loader || !root.classList.contains('is-loading')) {
    if (loader) loader.remove();
    return finish();
  }
  try {
    sessionStorage.setItem('pf-intro', '1');
  } catch (err) {
    /* stockage indisponible : l'intro rejouera à la prochaine visite, sans autre effet */
  }
  pauseScroll();

  const count = $('#loaderCount');
  const lines = $$('.loader__log p', loader);
  const counter = { v: 0 };
  const paint = () => {
    if (count) count.textContent = String(Math.round(counter.v)).padStart(3, '0');
    const shown = Math.max(1, Math.ceil((counter.v / 100) * lines.length));
    lines.forEach((l, i) => l.classList.toggle('is-on', i < shown));
  };
  paint();
  gsap.from('.loader__inner > *', { autoAlpha: 0, y: 18, duration: 0.7, ease: 'expo.out', stagger: 0.06 });
  gsap.to(counter, { v: 74, duration: 1.1, ease: 'power2.inOut', onUpdate: paint, delay: 0.1 });

  let done = false;
  const close = () => {
    if (done) return;
    done = true;
    gsap.killTweensOf(counter);
    gsap
      .timeline({ onComplete: () => loader.remove() })
      .to(counter, { v: 100, duration: 0.4, ease: 'power2.out', onUpdate: paint })
      .to('.loader__inner', { autoAlpha: 0, y: -16, duration: 0.35, ease: 'power2.in' }, '+=0.08')
      .add(finish)
      .to('.loader__belts i', { scaleY: 0, duration: 0.8, ease: 'expo.inOut', stagger: 0.045 }, '<');
  };
  // passer l'intro : clic, toucher ou Échap
  loader.addEventListener('pointerdown', close, { once: true });
  window.addEventListener('keydown', (e) => e.key === 'Escape' && close(), { once: true });

  const glReady = new Promise((resolve) => {
    if (state.glReady) return resolve();
    window.addEventListener(EVT_GL_READY, resolve, { once: true });
    setTimeout(resolve, GL_TIMEOUT);
  });
  const fontsReady =
    document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, FONTS_TIMEOUT))]) : Promise.resolve();
  const minTime = new Promise((r) => setTimeout(r, MIN_TIME));
  Promise.all([glReady, fontsReady, minTime]).then(close);
}
