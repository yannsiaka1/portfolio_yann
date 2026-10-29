// Préférences de l'appareil et petits utilitaires DOM partagés par tout le site.

export const root = document.documentElement;

/** L'utilisateur a demandé moins d'animations (réglage système). */
export const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/** Souris ou pavé tactile : curseur personnalisé et effets de survol actifs. */
export const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
/** Écran tactile : interactions au toucher, rendu 3D allégé. */
export const coarse = window.matchMedia('(pointer: coarse)').matches;

export const $ = (selector, context = document) => context.querySelector(selector);
export const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
