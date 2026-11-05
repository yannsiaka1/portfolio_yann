// Hero, côté page : le nom découpé en lettres sort du flou à la fin de l'intro, puis le reste monte.
// La partie 3D vit dans src/hero/.
import { gsap } from '../core/gsap.js';
import { $, reduced, coarse } from '../core/env.js';
import { splitText } from '../core/text.js';
import { EVT_INTRO, state } from '../core/state.js';

/** Découpe le nom en lettres : une copie lisible reste pour les lecteurs d'écran. */
export function prepareHero() {
  const name = $('#heroName');
  if (!name || reduced()) return;
  const lines = Array.from(name.querySelectorAll('.hero__name-line'));
  const sr = document.createElement('span');
  sr.className = 'sr-only';
  sr.textContent = 'Yann Siaka,';
  lines.forEach((line) => {
    line.setAttribute('aria-hidden', 'true');
    splitText(line, 'chars');
  });
  name.querySelectorAll('.sr-only').forEach((el) => el.remove());
  name.prepend(sr);
  // opacité seulement : les boutons du hero restent focalisables pendant l'intro
  gsap.set('#heroName .ch', { opacity: 0 });
  gsap.set('.hero [data-intro]', { opacity: 0, y: 22 });
}

function play() {
  if (reduced()) return;
  // chaque lettre sort du flou dans un ordre aléatoire ; sur téléphone, sans flou : animer un filtre sur chaque
  // lettre coûte cher au processeur graphique d'un mobile et faisait saccader l'entrée
  const blur = !coarse;
  gsap.fromTo(
    '#heroName .ch',
    { opacity: 0, yPercent: 24, ...(blur ? { filter: 'blur(14px)' } : {}) },
    {
      opacity: 1,
      yPercent: 0,
      ...(blur ? { filter: 'blur(0px)' } : {}),
      duration: 1.1,
      ease: 'power3.out',
      stagger: { each: 0.05, from: 'random' },
      delay: 0.15,
      clearProps: 'filter,transform',
    },
  );
  gsap.to('.hero [data-intro]', { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.08, delay: 0.55, clearProps: 'transform' });
  gsap.fromTo('.site-header__inner > *', { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06, delay: 0.35, clearProps: 'transform' });
}

export function initHeroIntro() {
  if (state.introFired) play();
  else window.addEventListener(EVT_INTRO, play, { once: true });
}
