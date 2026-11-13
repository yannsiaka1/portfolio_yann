// Point d'entrée : polices et styles, interface, puis scène 3D chargée à part.
import 'lenis/dist/lenis.css';
import '@fontsource-variable/archivo/wdth.css'; // graisse et chasse variables
import '@fontsource-variable/newsreader/opsz-italic.css'; // italique des mots d'accent, taille optique automatique
import '@fontsource-variable/jetbrains-mono'; // le code et les petites étiquettes techniques
import './styles/index.css';

import { initApp } from './app.js';
import { hasGpu } from './core/gpu.js';
import { signalGlReady } from './core/state.js';

// l'interface démarre juste après le premier affichage : le hero, écrit en HTML et animé en CSS, n'attend pas les
// scripts, et le navigateur peint la page avant de les exécuter
requestAnimationFrame(() => setTimeout(initApp, 0));

// three.js (le plus gros fichier du site) arrive après la page, quand le navigateur n'a plus rien d'urgent à faire :
// le hero s'affiche et se lit sans l'attendre, et l'affiche du symbole (une image fixe de la vraie scène) tient sa
// place en attendant. Sur téléphone aussi, sans attendre un premier geste : le visiteur qui arrive de LinkedIn et
// regarde le hero sans toucher l'écran voit la scène vivante.
// Jamais sans vraie carte graphique (src/core/gpu.js, testé avant de télécharger three.js : les robots et les outils
// de mesure ne paient rien), ni avec l'économiseur de données du navigateur : l'affiche reste.
let started = false;
const startScene = () => {
  if (started) return;
  started = true;
  import('./hero/scene.js')
    .then(({ initHero }) => initHero())
    .catch((err) => {
      console.error(err);
      signalGlReady(false);
    });
};
const whenIdle = (fn) => ('requestIdleCallback' in window ? window.requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 300));
const afterLoad = (fn) => (document.readyState === 'complete' ? fn() : window.addEventListener('load', fn, { once: true }));

// police des mots d'accent : après le chargement, ou tout de suite si l'adresse vise une section (base.css)
const accentReady = () => document.documentElement.classList.add('accent-ready');
if (window.location.hash) accentReady();
else afterLoad(() => whenIdle(accentReady));

if (navigator.connection && navigator.connection.saveData) {
  signalGlReady(false);
} else {
  afterLoad(() =>
    whenIdle(() => {
      if (hasGpu()) startScene();
      else signalGlReady(false);
    }),
  );
}
