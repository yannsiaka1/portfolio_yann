// Assemble l'interface. Ce qui sert au premier écran (défilement doux, barre, pause, curseur) démarre tout de suite ;
// les sections suivent ensuite, chacune dans sa propre tâche : la page reste réactive pendant le démarrage, aucun
// long calcul ne bloque un toucher ou un clic. L'ordre reste celui d'origine : les découpes de texte (révélations)
// existent avant les animations qui s'en servent, et la section épinglée des projets se mesure en premier quoi qu'il
// arrive (refreshPriority, src/sections/projects.js).
import { ScrollTrigger } from './core/gsap.js';
import { initScroll } from './core/scroll.js';
import { fireIntro } from './core/state.js';
import { initClocks } from './ui/clocks.js';
import { initNav } from './ui/nav.js';
import { initCopy } from './ui/copy.js';
import { initPause } from './ui/pause.js';
import { initCursor, initMagnetic } from './ui/cursor.js';
import { initPosters } from './ui/posters.js';
import { initReveals } from './sections/reveals.js';
import { initProjects } from './sections/projects.js';
import { initMarquee, measureMarquee } from './sections/marquee.js';
import { initSkills } from './sections/skills.js';
import { initMethod, buildGitGraph } from './sections/method.js';
import { initContact } from './sections/contact.js';
import { initFooter } from './sections/footer.js';

/** Rend la main au navigateur entre deux étapes du démarrage, le temps d'afficher ou de répondre à un geste. */
const yieldToMain = () =>
  new Promise((resolve) => {
    if (window.scheduler && typeof window.scheduler.yield === 'function') window.scheduler.yield().then(resolve);
    else setTimeout(resolve, 0);
  });

/** Recalcule les mesures après un redimensionnement, le chargement des polices et des images. */
function initRefresh() {
  const refresh = () => {
    buildGitGraph();
    ScrollTrigger.refresh();
  };
  let timer;
  let lastWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      measureMarquee();
      buildGitGraph();
      // la barre d'adresse mobile ne change que la hauteur : ScrollTrigger s'en occupe seul
      if (window.innerWidth !== lastWidth) {
        lastWidth = window.innerWidth;
        ScrollTrigger.refresh();
      }
    }, 180);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  if (document.readyState === 'complete') refresh();
  else window.addEventListener('load', refresh, { once: true });
}

export async function initApp() {
  initScroll();
  initNav();
  initPause();
  initCursor();
  initMagnetic();
  initCopy();
  // le hero est déjà affiché (son entrée est en CSS) : la scène 3D, quand elle arrive, assemble son symbole aussitôt
  fireIntro();

  const sections = [initPosters, initReveals, initProjects, initMarquee, initSkills, initMethod, initContact, initClocks, initFooter];
  for (const init of sections) {
    await yieldToMain();
    init();
  }
  initRefresh();
}
