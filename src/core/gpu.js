// Une vraie carte graphique ? Sans elle (robots d'indexation, outils de mesure, machines virtuelles, accélération
// désactivée dans le navigateur), WebGL passe par le processeur : chaque image de la scène 3D coûterait plus que la
// page entière. L'affiche du symbole (une image fixe de la vraie scène) reste alors à sa place.
// scripts/symbole.mjs lève ces deux refus, et seulement dans son propre navigateur, pour photographier la scène.

// rendu par le processeur que le navigateur ne signale pas toujours, lu dans le nom du moteur de rendu
const SOFTWARE = /swiftshader|llvmpipe|softpipe|software|basic render/i;

/** Vrai si ce contexte WebGL est dessiné par le processeur plutôt que par une carte graphique. */
export function isSoftwareGl(gl) {
  const debug = gl.getExtension('WEBGL_debug_renderer_info');
  return SOFTWARE.test(String(gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER)));
}

/** Test léger, avant de télécharger three.js : le navigateur peut-il créer un contexte WebGL 2 accéléré ?
 *  Le contexte d'essai est rendu aussitôt (loseContext), la scène crée le sien. */
export function hasGpu() {
  let gl = null;
  try {
    gl = document.createElement('canvas').getContext('webgl2', { failIfMajorPerformanceCaveat: true });
    return Boolean(gl) && !isSoftwareGl(gl);
  } catch (err) {
    return false;
  } finally {
    const lose = gl && gl.getExtension('WEBGL_lose_context');
    if (lose) lose.loseContext();
  }
}
