// Défilement doux (Lenis) piloté par le ticker de GSAP, synchronisé avec ScrollTrigger.
// Désactivé avec « réduire les animations » : le défilement natif reprend la main.
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './gsap.js';
import { reduced, tokenPx } from './env.js';
import { state } from './state.js';

let lenis = null;

/** Le focus vient-il du clavier ? (un clic de souris ne rend pas le focus visible) */
export function focusVisible(el) {
  try {
    return el.matches(':focus-visible');
  } catch (err) {
    return true;
  }
}

export function initScroll() {
  if (!reduced()) {
    try {
      lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      lenis.on('scroll', (l) => {
        state.vel = l.velocity || 0;
        ScrollTrigger.update();
      });
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
      // Lenis ne suit pas le défilement que le navigateur fait vers l'élément qui reçoit le focus :
      // au clavier, on amène nous-mêmes l'élément à l'écran, sous la barre collante
      document.addEventListener('focusin', (e) => {
        const el = e.target;
        if (!(el instanceof Element) || el === document.body || el.closest('.site-header')) return;
        // seulement le focus du clavier : un clic dans le texte focalise #main (tabindex="-1") et ne doit
        // pas ramener la page à son début
        if (!focusVisible(el)) return;
        // projets épinglés : src/sections/projects.js amène la carte entière à l'écran
        if (el.closest('.section--projects.is-deck')) return;
        const r = el.getBoundingClientRect();
        const header = document.querySelector('.site-header');
        const top = (header ? header.offsetHeight : 0) + tokenPx('--space-3');
        if (r.top >= top && r.bottom <= window.innerHeight) return;
        lenis.scrollTo(el, { offset: -top, duration: 0.6 });
      });
    } catch (err) {
      lenis = null;
    }
  }
  if (!lenis) {
    // défilement natif : on mesure quand même la vitesse pour le bandeau
    let lastY = window.scrollY;
    window.addEventListener(
      'scroll',
      () => {
        const y = window.scrollY;
        state.vel = y - lastY;
        lastY = y;
      },
      { passive: true },
    );
  }
}

export const hasSmoothScroll = () => !!lenis;

/** Défile jusqu'à une position précise de la page (projets épinglés : carte suivante, carte qui reçoit le focus). */
export function scrollToY(y, duration = 0.6) {
  if (lenis) lenis.scrollTo(y, { duration, easing: (t) => 1 - Math.pow(1 - t, 3) });
  else window.scrollTo({ top: y, behavior: reduced() ? 'auto' : 'smooth' });
}

/** Défile jusqu'à une position (nombre) ou un élément, sous la barre collante.
 *  Une section épinglée (projets) se vise par son espace d'épinglage, au ras de la barre : on arrive au début
 *  de la section, pas là où elle se trouve après l'épinglage. */
export function scrollToTarget(target) {
  const header = document.querySelector('.site-header');
  const headerH = header ? header.offsetHeight : 0;
  let offset = typeof target === 'number' ? 0 : -(headerH + tokenPx('--space-3'));
  if (target instanceof Element && target.parentElement && target.parentElement.classList.contains('pin-spacer')) {
    target = target.parentElement;
    offset = -headerH;
  }
  // position calculée depuis la page elle-même (window.scrollY), pas depuis l'état interne de Lenis
  const y = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY + offset;
  if (lenis) lenis.scrollTo(y, { duration: 1.3, easing: (t) => 1 - Math.pow(1 - t, 4) });
  else if (typeof target === 'number') window.scrollTo({ top: target, behavior: reduced() ? 'auto' : 'smooth' });
  else target.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' });
}
