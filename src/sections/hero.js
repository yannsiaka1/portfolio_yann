// Hero, côté DOM : titre découpé en lettres et intro jouée à la fin du préchargement.
// La partie 3D vit dans src/hero/.
import { gsap } from '../core/gsap.js';
import { $, $$, reduce } from '../core/env.js';
import { splitText } from '../core/text.js';
import { fireIntro } from '../core/state.js';

/** Découpe le titre en lettres en gardant un libellé lisible pour les lecteurs d'écran. */
export function prepareHeroTitle() {
  const title = $('#heroTitle');
  if (!title) return;
  title.setAttribute('aria-label', title.textContent.trim());
  splitText(title, 'chars');
  $$('.line', title).forEach((line) => line.setAttribute('aria-hidden', 'true'));
}

export function playHeroIntro() {
  fireIntro();
  if (reduce) return;
  // chaque lettre sort du flou dans un ordre aléatoire
  gsap.fromTo(
    '#heroTitle .ch',
    { autoAlpha: 0, filter: 'blur(14px)', yPercent: 24 },
    {
      autoAlpha: 1,
      filter: 'blur(0px)',
      yPercent: 0,
      duration: 1.1,
      ease: 'power3.out',
      stagger: { each: 0.05, from: 'random' },
      delay: 0.25,
      clearProps: 'filter,transform',
    },
  );
  gsap.fromTo('.hero [data-intro]', { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.07, delay: 0.75, clearProps: 'transform' });
  gsap.fromTo('.nav__inner > *', { autoAlpha: 0, y: -14 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06, delay: 0.5, clearProps: 'transform' });
}
