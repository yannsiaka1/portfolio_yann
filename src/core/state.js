// État partagé entre l'interface (DOM) et la scène 3D, qui est chargée à part.
import { root } from './env.js';

export const EVT_GL_READY = 'pf:gl-ready';
export const EVT_INTRO = 'pf:intro';

export const state = {
  /** La scène 3D a rendu sa première image, ou a échoué (repli sans WebGL). */
  glReady: false,
  /** Le préchargement est terminé : l'intro du hero peut jouer. */
  introFired: false,
  /** Vitesse de défilement, lue par le bandeau défilant. */
  vel: 0,
  /** Branchés par le curseur personnalisé, appelés à chaque image par la scène 3D. */
  setHold: () => {},
  cursorSym: () => {},
};

/** La scène 3D signale qu'elle est prête (ok = true) ou indisponible (ok = false). */
export function signalGlReady(ok) {
  root.classList.toggle('no-gl', !ok);
  if (state.glReady) return;
  state.glReady = true;
  window.dispatchEvent(new Event(EVT_GL_READY));
}

/** Fin du préchargement : lance l'intro du hero, côté DOM comme côté 3D. */
export function fireIntro() {
  state.introFired = true;
  window.dispatchEvent(new Event(EVT_INTRO));
}
