// Point d'entrée : polices et styles, interface, puis scène 3D chargée à part.
import 'lenis/dist/lenis.css';
import '@fontsource-variable/archivo/wdth.css'; // graisse et chasse variables
import '@fontsource-variable/newsreader/opsz-italic.css'; // italique des mots d'accent, taille optique automatique
import '@fontsource-variable/jetbrains-mono'; // le code et les petites étiquettes techniques
import './styles/index.css';

import { initApp } from './app.js';
import { signalGlReady } from './core/state.js';

initApp();

// three.js arrive dans un fichier séparé : la page est lisible et utilisable avant lui,
// et reste complète si WebGL est indisponible.
import('./hero/scene.js')
  .then(({ initHero }) => initHero())
  .catch((err) => {
    console.error(err);
    signalGlReady(false);
  });
