// Point d'entrée : police et styles, navigation, bouton de copie, puis scène 3D chargée à part.
import '@fontsource-variable/archivo/wdth.css'; // graisse et chasse variables
import './styles/index.css';

import { initNav } from './ui/nav.js';
import { initCopy } from './ui/copy.js';
import { signalGlReady } from './core/state.js';

initNav();
initCopy();

// three.js arrive dans un fichier séparé : la page est lisible et utilisable avant lui,
// et reste complète si WebGL est indisponible.
import('./hero/scene.js')
  .then(({ initHero }) => initHero())
  .catch((err) => {
    console.error(err);
    signalGlReady(false);
  });
