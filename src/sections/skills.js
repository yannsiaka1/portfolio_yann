// Compétences : onglets accessibles (flèches, Début, Fin) synchronisés avec la pile isométrique.
// Sur grand écran, si la couche la plus haute tient dans l'écran, la section s'épingle et le défilement passe
// d'une couche à l'autre (comme les services de Glorious Hall) ; un onglet cliqué amène la page à sa couche.
// Ailleurs, ou avec « réduire les animations », les onglets seuls. Sans JavaScript, tous les panneaux restent visibles.
import { gsap, ScrollTrigger } from '../core/gsap.js';
import { $, $$, reduced, motionQuery, token, tokenPx } from '../core/env.js';
import { scrollToY } from '../core/scroll.js';

const PIN_QUERY = '(min-width: 64rem) and (min-height: 40rem)';
const STEP = 0.6; // défilement consacré à une couche, en hauteurs d'écran

export function initSkills() {
  const tablist = $('.tabs[role="tablist"]');
  if (!tablist) return;
  const section = $('#competences');
  const block = $('.skills', section);
  const tabs = $$('[role="tab"]', tablist);
  const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));
  const layers = $$('.iso__layer');
  const scene = $('#isoScene');
  const pinQuery = window.matchMedia(PIN_QUERY);
  let current = 0;
  let pin = null; // ScrollTrigger quand la section est épinglée
  let target = null; // couche visée par un clic : les couches traversées pour y aller ne s'affichent pas

  const select = (index, focus = false) => {
    const changed = index !== current;
    current = index;
    tabs.forEach((tab, i) => {
      const on = i === index;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      if (panels[i]) panels[i].hidden = !on;
    });
    layers.forEach((layer) => {
      const on = Number(layer.dataset.layer) === index;
      layer.classList.toggle('is-active', on);
      if (on && scene) scene.style.setProperty('--active-z', layer.style.getPropertyValue('--z'));
    });
    if (focus) tabs[index].focus();
    if (changed && !reduced() && panels[index]) {
      gsap.fromTo(panels[index].children, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: parseFloat(token('--slow')), ease: 'expo.out', stagger: 0.05 });
    }
  };

  /** Choisit une couche ; épinglée, la page défile jusqu'à elle. */
  const choose = (index, focus = false) => {
    select(index, focus);
    if (!pin) return;
    target = index;
    const n = tabs.length;
    scrollToY(pin.start + ((index + 0.5) / n) * (pin.end - pin.start), 0.8);
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => choose(i));
    tab.addEventListener('keydown', (e) => {
      const last = tabs.length - 1;
      let next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = i === last ? 0 : i + 1;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = i === 0 ? last : i - 1;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = last;
      if (next === null) return;
      e.preventDefault();
      choose(next, true);
    });
  });
  layers.forEach((layer) => layer.addEventListener('click', () => choose(Number(layer.dataset.layer))));
  select(0);

  // la pile s'écarte quand la section arrive à l'écran
  if (scene && !reduced()) {
    gsap.fromTo(scene, { '--gap': token('--space-1') }, { '--gap': token('--space-6'), duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: scene, start: 'top 80%', once: true } });
  }

  /* ---------- épinglage : une couche par tranche de défilement ---------- */
  const header = $('.site-header');
  const top = () => (header ? header.offsetHeight : 0) + tokenPx('--space-4');

  /** La couche la plus haute (onglets compris) et la pile tiennent-elles dans l'écran ? */
  function fits() {
    const shown = panels.map((p) => p.hidden);
    panels.forEach((p) => (p.hidden = false));
    const tallest = Math.max(...panels.map((p) => p.offsetHeight));
    panels.forEach((p, i) => (p.hidden = shown[i]));
    const tabsH = tablist.offsetHeight + tokenPx('--space-4');
    const isoH = $('.iso', block) ? $('.iso', block).offsetHeight : 0;
    return Math.max(tabsH + tallest, isoH) <= window.innerHeight - top() - tokenPx('--space-4');
  }

  function teardown() {
    if (pin) pin.kill(true);
    pin = null;
    section.classList.remove('is-pinned');
  }

  function setup() {
    const want = !reduced() && pinQuery.matches && fits();
    if (want === !!pin) return;
    teardown();
    if (want) {
      section.classList.add('is-pinned');
      const n = tabs.length;
      pin = ScrollTrigger.create({
        trigger: block,
        start: () => `top ${top()}px`,
        end: () => `+=${Math.round(n * STEP * window.innerHeight)}`,
        pin: true,
        invalidateOnRefresh: true,
        anticipatePin: 1,
        refreshPriority: 1,
        onUpdate: (self) => {
          const i = Math.min(n - 1, Math.floor(self.progress * n));
          if (target !== null) {
            if (i === target) target = null; // arrivé
            return;
          }
          if (i !== current) select(i);
        },
      });
    }
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  }

  const ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  ready.then(setup);
  let timer;
  window.addEventListener('resize', () => {
    clearTimeout(timer);
    timer = setTimeout(setup, 250);
  });
  pinQuery.addEventListener('change', setup);
  motionQuery.addEventListener('change', setup);
  // un défilement par la molette annule une couche visée par un clic qui n'aurait pas été atteinte
  window.addEventListener('wheel', () => (target = null), { passive: true });
}
