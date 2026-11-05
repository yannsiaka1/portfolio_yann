// Point d'entrée : polices et styles, interface, puis scène 3D chargée à part.
import 'lenis/dist/lenis.css';
import '@fontsource-variable/archivo/wdth.css'; // graisse et chasse variables
import '@fontsource-variable/newsreader/opsz-italic.css'; // italique des mots d'accent, taille optique automatique
import '@fontsource-variable/jetbrains-mono'; // le code et les petites étiquettes techniques
import './styles/index.css';

import { initApp } from './app.js';
import { coarse } from './core/env.js';
import { state, signalGlReady, EVT_INTRO } from './core/state.js';

initApp();

// three.js arrive dans un fichier séparé : la page est lisible et utilisable avant lui,
// et reste complète si WebGL est indisponible.
const startScene = () =>
  import('./hero/scene.js')
    .then(({ initHero }) => initHero())
    .catch((err) => {
      console.error(err);
      signalGlReady(false);
    });

// Sur téléphone, la scène 3D démarre une fois l'entrée du nom jouée : son chargement (fichier, géométries,
// shaders) ne vient plus faire saccader l'animation du début. Le symbole s'assemble juste après.
const SCENE_DELAY = 1400; // ms après la fin de l'intro, le temps que le nom apparaisse
if (coarse) {
  const later = () => setTimeout(startScene, SCENE_DELAY);
  if (state.introFired) later();
  else window.addEventListener(EVT_INTRO, later, { once: true });
} else {
  startScene();
}
