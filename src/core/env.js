// Préférences de l'appareil et petits utilitaires DOM partagés par tout le site.

export const root = document.documentElement;

/** Réglage système « réduire les animations » : lire .matches au moment voulu, il peut changer pendant la visite. */
export const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
/** Écran tactile : interactions au toucher, rendu 3D allégé. */
export const coarse = window.matchMedia('(pointer: coarse)').matches;

export const $ = (selector, context = document) => context.querySelector(selector);
export const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
