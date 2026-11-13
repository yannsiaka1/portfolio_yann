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

/** Réglages du contexte WebGL 2 de la scène. failIfMajorPerformanceCaveat : le navigateur refuse le contexte s'il ne
 *  peut le dessiner qu'avec le processeur (Firefox ne le respecte plus : le nom du moteur sert alors de filet). */
export const GL_ATTRS = { antialias: true, alpha: false, powerPreference: 'high-performance', failIfMajorPerformanceCaveat: true };

/** Test léger, avant de télécharger three.js : le canvas de la scène obtient-il un contexte WebGL 2 accéléré ?
 *  Le contexte est créé avec les réglages de la scène et gardé : la scène le retrouvera tel quel (getContext rend le
 *  même), sans en créer un second. Refusé, il est rendu aussitôt (loseContext). */
export function hasGpu(canvas) {
  let gl = null;
  try {
    gl = canvas ? canvas.getContext('webgl2', GL_ATTRS) : null;
  } catch (err) {
    gl = null;
  }
  if (gl && !isSoftwareGl(gl)) return true;
  const lose = gl && gl.getExtension('WEBGL_lose_context');
  if (lose) lose.loseContext();
  return false;
}
