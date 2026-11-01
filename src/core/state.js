// Lien entre la page et la scène 3D, chargée à part.
import { root } from './env.js';

/**
 * La scène 3D a rendu sa première image (ok = true) ou elle est indisponible (ok = false).
 * La classe posée sur <html> affiche le canvas, ou le symbole de repli dessiné en SVG.
 */
export function signalGlReady(ok) {
  root.classList.toggle('gl-ready', ok);
  root.classList.toggle('no-gl', !ok);
}
