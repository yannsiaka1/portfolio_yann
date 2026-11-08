// Assemble l'interface. Ce qui sert au premier écran (défilement doux, barre, pause, curseur) démarre tout de suite ;
// les sections suivent ensuite, chacune dans sa propre tâche : la page reste réactive pendant le démarrage, aucun
// long calcul ne bloque un toucher ou un clic. L'ordre reste celui d'origine : les découpes de texte (révélations)
// existent avant les animations qui s'en servent, et la section épinglée des projets se mesure en premier quoi qu'il
// arrive (refreshPriority, src/sections/projects.js).
import { ScrollTrigger } from './core/gsap.js';
import { hashTarget } from './core/env.js';
import { initScroll, scrollToTarget } from './core/scroll.js';
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

/** Recalcule les mesures après un redimensionnement, le chargement des polices et des images.
 *  Renvoie une promesse tenue une fois faites les deux mesures de fin de chargement (polices, page entière). */
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
  const fonts = document.fonts && document.fonts.ready ? document.fonts.ready.then(refresh) : Promise.resolve();
  const page = new Promise((resolve) => {
    const done = () => {
      refresh();
      resolve();
    };
    if (document.readyState === 'complete') done();
    else window.addEventListener('load', done, { once: true });
  });
  return Promise.all([fonts, page]);
}

/** Arrivée par un lien vers une section (/#contact, un onglet du journal, un lien du CV) : la page s'ouvre sur elle.
 *  Le navigateur y saute seul au chargement (base.css), mais le démarrage allonge ensuite la page (espaces des sections
 *  épinglées, polices) et chaque mesure complète de ScrollTrigger remet le défilement à zéro avant de le restaurer :
 *  sans ces sauts, on arrive ailleurs, souvent en haut de la page. La section est replacée après chaque étape du
 *  démarrage et après chaque mesure, jusqu'à la fin du chargement ou jusqu'au premier geste du visiteur. */
function holdHashTarget() {
  const target = hashTarget();
  if (!target) return { jump() {}, release() {} };
  let held = true;
  const jump = () => {
    if (held) scrollToTarget(target.id === 'accueil' ? 0 : target, { immediate: true });
  };
  const gestures = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
  const release = () => {
    held = false;
    ScrollTrigger.removeEventListener('refresh', jump);
    gestures.forEach((type) => window.removeEventListener(type, release));
  };
  gestures.forEach((type) => window.addEventListener(type, release, { passive: true }));
  ScrollTrigger.addEventListener('refresh', jump);
  return { jump, release };
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
  const arrival = holdHashTarget();
  arrival.jump();

  const sections = [initPosters, initReveals, initProjects, initMarquee, initSkills, initMethod, initContact, initClocks, initFooter];
  for (const init of sections) {
    await yieldToMain();
    init();
    // dans la même tâche que l'étape qui a changé la page : aucune image n'affiche la section ailleurs
    arrival.jump();
  }
  initRefresh().then(() => requestAnimationFrame(arrival.release));
}
