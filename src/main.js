// Point d'entrée : polices et styles, interface, puis scène 3D chargée à part.
import 'lenis/dist/lenis.css';
import '@fontsource-variable/archivo/wdth.css'; // graisse et chasse variables
import '@fontsource-variable/newsreader/opsz-italic.css'; // italique des mots d'accent, taille optique automatique
import '@fontsource-variable/jetbrains-mono'; // le code et les petites étiquettes techniques
import './styles/index.css';

import { initApp } from './app.js';
import { coarse, hashTarget } from './core/env.js';
import { scrollToTarget } from './core/scroll.js';
import { signalGlReady } from './core/state.js';

// arrivée par un lien vers une section (/#contact) : la page s'ouvre sur elle dès le premier affichage, sans attendre
// le navigateur ; src/app.js la garde ensuite en place pendant le démarrage
const arrival = hashTarget();
if (arrival && arrival.id !== 'accueil') scrollToTarget(arrival, { immediate: true });

// l'interface démarre juste après le premier affichage : le hero, écrit en HTML et animé en CSS, n'attend pas les
// scripts, et le navigateur peint la page avant de les exécuter
requestAnimationFrame(() => setTimeout(initApp, 0));

// three.js (le plus gros fichier du site) arrive après la page : le hero s'affiche et se lit sans l'attendre, et le
// symbole dessiné tient sa place en attendant (et pour de bon sans WebGL 2).
// - À la souris : quand le navigateur n'a plus rien d'urgent à faire, une fois la page chargée.
// - Sur écran tactile : au premier geste (toucher, défilement, touche), pour ne pas dépenser la batterie et le forfait
//   d'un téléphone avant que le visiteur ne s'intéresse à la page.
// - Avec l'économiseur de données du navigateur : jamais, le symbole dessiné reste.
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
} else if (coarse) {
  const gestures = ['pointerdown', 'keydown', 'wheel', 'scroll'];
  const onFirstGesture = () => {
    gestures.forEach((type) => window.removeEventListener(type, onFirstGesture));
    whenIdle(startScene);
  };
  gestures.forEach((type) => window.addEventListener(type, onFirstGesture, { passive: true }));
} else {
  afterLoad(() => whenIdle(startScene));
}
