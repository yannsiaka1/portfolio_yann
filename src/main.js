// Point d'entrée : styles, polices auto-hébergées, interface, puis scène 3D chargée à part.
import 'lenis/dist/lenis.css';
import '@fontsource-variable/archivo/wdth.css'; // graisse + chasse variables
import '@fontsource-variable/newsreader/opsz-italic.css'; // italique, taille optique automatique
import '@fontsource-variable/jetbrains-mono';
import './styles/index.css';

import { initApp } from './app.js';
import { signalGlReady } from './core/state.js';

initApp();

// three.js part dans un fichier séparé : le préchargement s'affiche pendant qu'il arrive,
// et le reste du site fonctionne même si WebGL est indisponible.
import('./hero/scene.js')
  .then(({ initHero }) => initHero())
  .catch((err) => {
    console.error(err);
    signalGlReady(false);
  });
