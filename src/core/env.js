// Préférences de l'appareil et petits utilitaires DOM partagés par tout le site.

export const root = document.documentElement;

/** Réglage système « réduire les animations ». Il peut changer pendant la visite : les modules écoutent
 *  motionQuery ('change') et lisent reduced(), une valeur gardée à jour ici. Lire .matches à chaque image
 *  (bandeau) empêche Chromium d'envoyer l'événement 'change' de cette requête. */
export const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let reducedNow = motionQuery.matches;
motionQuery.addEventListener('change', (e) => {
  reducedNow = e.matches;
});
export const reduced = () => reducedNow;
/** Souris ou pavé tactile : curseur personnalisé, boutons magnétiques et survols actifs. */
export const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
/** Écran tactile : interactions au toucher, rendu 3D allégé. */
export const coarse = window.matchMedia('(pointer: coarse)').matches;
/** Scène allégée (métal poli au lieu du verre réfractif) : écran tactile ou petite fenêtre. La même requête choisit
 *  l'affiche du symbole dans index.html et en/index.html (<source media>) : les deux doivent rester identiques. */
export const LIGHT_SCENE = '(pointer: coarse), (max-width: 699.98px), (max-height: 699.98px)';

export const $ = (selector, context = document) => context.querySelector(selector);
export const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/** Lit un jeton de tokens.css ; tokenPx convertit rem ou px en pixels, tokenMs une durée (s ou ms) en millisecondes. */
const rootStyle = () => getComputedStyle(root);
export const token = (name) => rootStyle().getPropertyValue(name).trim();
export function tokenPx(name) {
  const value = token(name);
  const n = parseFloat(value) || 0;
  return value.endsWith('rem') ? n * (parseFloat(rootStyle().fontSize) || 16) : n;
}
export function tokenMs(name) {
  const value = token(name);
  const n = parseFloat(value) || 0;
  return value.endsWith('ms') ? n : n * 1000;
}

/** L'élément que vise l'adresse de la page (/#contact, un onglet du journal, un lien du CV), s'il existe. */
export function hashTarget() {
  const hash = window.location.hash.slice(1);
  if (!hash) return null;
  let id = hash;
  try {
    id = decodeURIComponent(hash);
  } catch (err) {
    /* adresse mal encodée : prise telle quelle */
  }
  return document.getElementById(id);
}
