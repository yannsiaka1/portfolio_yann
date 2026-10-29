// Défilement doux (Lenis) piloté par le ticker de GSAP, pour rester synchronisé avec ScrollTrigger.
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './gsap.js';
import { reduce } from './env.js';
import { state } from './state.js';

let lenis = null;

export function initScroll() {
  if (!reduce) {
    try {
      lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      lenis.on('scroll', (l) => {
        state.vel = l.velocity || 0;
        ScrollTrigger.update();
      });
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
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

export function pauseScroll() {
  if (lenis) lenis.stop();
}

export function resumeScroll() {
  if (lenis) lenis.start();
}

/** Défile jusqu'à une position (nombre) ou un élément. */
export function scrollToTarget(target) {
  if (lenis) lenis.scrollTo(target, { duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
  else if (typeof target === 'number') window.scrollTo({ top: target, behavior: reduce ? 'auto' : 'smooth' });
  else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
}
