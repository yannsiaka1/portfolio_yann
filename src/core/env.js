// Préférences de l'appareil et petits utilitaires DOM partagés par tout le site.

export const root = document.documentElement;

/** Réglage système « réduire les animations » : lire .matches au moment voulu, il peut changer pendant la visite. */
export const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
export const reduced = () => motionQuery.matches;
/** Souris ou pavé tactile : curseur personnalisé, boutons magnétiques et survols actifs. */
export const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
/** Écran tactile : interactions au toucher, rendu 3D allégé. */
export const coarse = window.matchMedia('(pointer: coarse)').matches;

export const $ = (selector, context = document) => context.querySelector(selector);
export const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/** Lit un jeton de tokens.css ; tokenPx convertit rem ou px en pixels. */
const rootStyle = () => getComputedStyle(root);
export const token = (name) => rootStyle().getPropertyValue(name).trim();
export function tokenPx(name) {
  const value = token(name);
  const n = parseFloat(value) || 0;
  return value.endsWith('rem') ? n * (parseFloat(rootStyle().fontSize) || 16) : n;
}
