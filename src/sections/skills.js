// Compétences : onglets accessibles (flèches, Début, Fin) synchronisés avec la pile isométrique.
// Cliquer une couche de la pile choisit l'onglet correspondant. Sans JavaScript, tous les panneaux restent visibles.
import { gsap } from '../core/gsap.js';
import { $, $$, reduced, token } from '../core/env.js';

export function initSkills() {
  const tablist = $('.tabs[role="tablist"]');
  if (!tablist) return;
  const tabs = $$('[role="tab"]', tablist);
  const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));
  const layers = $$('.iso__layer');
  const scene = $('#isoScene');
  let current = 0;

  const select = (index, focus = false) => {
    const changed = index !== current;
    current = index;
    tabs.forEach((tab, i) => {
      const on = i === index;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      if (panels[i]) panels[i].hidden = !on;
    });
    layers.forEach((layer) => layer.classList.toggle('is-active', Number(layer.dataset.layer) === index));
    if (focus) tabs[index].focus();
    if (changed && !reduced() && panels[index]) {
      gsap.fromTo(panels[index].children, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: parseFloat(token('--slow')), ease: 'expo.out', stagger: 0.05 });
    }
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(i));
    tab.addEventListener('keydown', (e) => {
      const last = tabs.length - 1;
      let next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = i === last ? 0 : i + 1;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = i === 0 ? last : i - 1;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = last;
      if (next === null) return;
      e.preventDefault();
      select(next, true);
    });
  });
  layers.forEach((layer) => layer.addEventListener('click', () => select(Number(layer.dataset.layer))));
  select(0);

  // la pile s'écarte quand la section arrive à l'écran
  if (scene && !reduced()) {
    gsap.fromTo(scene, { '--gap': token('--space-1') }, { '--gap': token('--space-6'), duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: scene, start: 'top 80%', once: true } });
  }
}
