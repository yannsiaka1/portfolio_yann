// État partagé entre la page et la scène 3D (chargée à part), et pause globale des animations.
import { root } from './env.js';

export const EVT_GL_READY = 'pf:gl-ready';
export const EVT_INTRO = 'pf:intro';
export const EVT_PAUSE = 'pf:pause';

export const state = {
  /** La scène 3D a rendu sa première image, ou a échoué (repli sans WebGL). */
  glReady: false,
  /** L'intro est terminée : le hero peut jouer sa propre entrée. */
  introFired: false,
  /** Vitesse de défilement, lue par le bandeau. */
  vel: 0,
  /** Bouton pause : tout ce qui bouge seul s'arrête (scène 3D, bandeau, curseur de l'invite). */
  paused: false,
  /** Branchés par le curseur personnalisé, appelés à chaque image par la scène 3D. */
  setHold: () => {},
  cursorSym: () => {},
};

/** La scène 3D signale qu'elle est prête (ok = true) ou indisponible (ok = false). */
export function signalGlReady(ok) {
  root.classList.toggle('gl-ready', ok);
  root.classList.toggle('no-gl', !ok);
  if (state.glReady) return;
  state.glReady = true;
  window.dispatchEvent(new Event(EVT_GL_READY));
}

/** Fin de l'intro : le hero entre en scène, côté page comme côté 3D. */
export function fireIntro() {
  if (state.introFired) return;
  state.introFired = true;
  window.dispatchEvent(new Event(EVT_INTRO));
}

export function setPaused(paused) {
  state.paused = paused;
  root.classList.toggle('is-paused', paused);
  window.dispatchEvent(new Event(EVT_PAUSE));
}
