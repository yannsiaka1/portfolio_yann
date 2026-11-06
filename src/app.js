// Assemble l'interface. L'ordre compte : le défilement doux et les découpes de texte doivent exister
// avant les animations qui s'en servent, et l'intro part en dernier.
import { ScrollTrigger } from './core/gsap.js';
import { initScroll } from './core/scroll.js';
import { initClocks } from './ui/clocks.js';
import { initNav } from './ui/nav.js';
import { initCopy } from './ui/copy.js';
import { initPause } from './ui/pause.js';
import { initCursor, initMagnetic } from './ui/cursor.js';
import { runLoader } from './ui/loader.js';
import { prepareHero, initHeroIntro } from './sections/hero.js';
import { initPostit } from './sections/postit.js';
import { initReveals } from './sections/reveals.js';
import { initProjects } from './sections/projects.js';
import { initMarquee, measureMarquee } from './sections/marquee.js';
import { initSkills } from './sections/skills.js';
import { initMethod, buildGitGraph } from './sections/method.js';
import { initContact } from './sections/contact.js';
import { initFooter } from './sections/footer.js';

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
  window.addEventListener('load', refresh);
}

export function initApp() {
  initScroll();
  initClocks();
  initNav();
  initCopy();
  initPause();
  initCursor();
  initMagnetic();
  prepareHero();
  initHeroIntro();
  // avant les sections épinglées : un pense-bête déjà retiré pendant la visite disparaît avant leurs mesures
  initPostit();
  initReveals();
  initProjects();
  initMarquee();
  initSkills();
  initMethod();
  initContact();
  initFooter();
  initRefresh();
  runLoader();
}
