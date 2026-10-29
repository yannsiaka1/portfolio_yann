// Assemble l'interface. L'ordre compte : le défilement doux et les découpes de texte
// doivent exister avant les animations qui s'en servent, et le préchargement part en dernier.
import { ScrollTrigger } from './core/gsap.js';
import { initScroll } from './core/scroll.js';
import { initClocks } from './ui/clocks.js';
import { initNav } from './ui/nav.js';
import { initCursor, initMagnetic } from './ui/cursor.js';
import { runLoader } from './ui/loader.js';
import { prepareHeroTitle } from './sections/hero.js';
import { initReveals } from './sections/reveals.js';
import { initMarquee, measureMarquee } from './sections/marquee.js';
import { initWork } from './sections/work.js';
import { initStack } from './sections/stack.js';
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
      // la barre d'adresse mobile ne change que la hauteur : ScrollTrigger s'en occupe seul,
      // un rafraîchissement forcé ferait sauter les sections épinglées
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
  // toujours repartir du haut : l'intro et la scène 3D partent du hero
  try {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  } catch (err) {
    /* navigateur ancien : on garde le comportement par défaut */
  }
  window.scrollTo(0, 0);

  initScroll();
  initClocks();
  initNav();
  initCursor();
  initMagnetic();
  prepareHeroTitle();
  initReveals();
  initMarquee();
  initWork();
  initStack();
  initMethod();
  initContact();
  initFooter();
  initRefresh();
  runLoader();
}
