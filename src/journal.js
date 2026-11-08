// Pages du journal (générées par scripts/journal.mjs) et page 404 : mêmes polices, mêmes styles et même barre que
// l'accueil, sans scène 3D et avec le défilement natif du navigateur, plus confortable pour lire.
import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/newsreader/opsz-italic.css';
import '@fontsource-variable/jetbrains-mono';
import './styles/journal-page.css';

import { initNav } from './ui/nav.js';
import { initClocks } from './ui/clocks.js';
import { initVideos } from './ui/video.js';

initNav();
initClocks();
initVideos();
