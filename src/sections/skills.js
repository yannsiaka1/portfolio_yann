// Compétences : six couches, de l'analyse du besoin à la mise en ligne, qui se suivent dans la page.
// La couche lue est celle qui passe au milieu de l'écran : son filet passe à l'accent et la pile isométrique
// s'ouvre autour d'elle. Sur grand écran, la pile et la progression restent à l'écran (position collante) pendant
// qu'on parcourt les couches, puis la page passe à la section suivante. Un clic sur une couche de la pile amène
// la page à son panneau. Aucun épinglage ni contenu masqué : quelle que soit la hauteur de l'écran, tout reste
// lisible, au clavier comme au lecteur d'écran (titres de niveau 3).
import { gsap, ScrollTrigger } from '../core/gsap.js';
import { $, $$, reduced, token } from '../core/env.js';
import { scrollToY } from '../core/scroll.js';

export function initSkills() {
  const section = $('#competences');
  if (!section) return;
  const panels = $$('.skills__panel', section);
  const layers = $$('.iso__layer', section);
  const scene = $('#isoScene');
  const bar = $('#skillsBar');
  const count = $('#skillsCount');
  const zone = $('.skills__layers', section);
  const header = $('.site-header');
  const headerH = () => (header ? header.offsetHeight : 0);
  const total = panels.length;
  const pad = (n) => String(n).padStart(2, '0');
  let current = -1;

  const select = (index) => {
    if (index === current || !panels[index]) return;
    current = index;
    panels.forEach((panel, i) => panel.classList.toggle('is-current', i === index));
    layers.forEach((layer) => {
      const on = Number(layer.dataset.layer) === index;
      layer.classList.toggle('is-active', on);
      if (on && scene) scene.style.setProperty('--active-z', layer.style.getPropertyValue('--z'));
    });
    if (count) count.textContent = `${pad(index + 1)} / ${pad(total)}`;
  };

  // la couche lue : celle qui traverse le milieu de l'écran
  panels.forEach((panel, i) => {
    ScrollTrigger.create({
      trigger: panel,
      start: 'top 50%',
      end: 'bottom 50%',
      onToggle: (self) => {
        if (self.isActive) select(i);
      },
    });
  });
  select(0);

  // la barre « Défilez » se remplit du haut de la première couche (sous la barre du site) au bas de la dernière
  if (bar && zone) {
    ScrollTrigger.create({
      trigger: zone,
      start: () => `top ${headerH()}px`,
      end: 'bottom bottom',
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        bar.style.transform = `scaleX(${self.progress.toFixed(3)})`;
      },
    });
  }

  // une couche de la pile cliquée amène la page à son panneau, au ras de la barre du site
  // (position lue sans les transformations : un panneau pas encore révélé est décalé de sa révélation)
  const docTop = (el) => {
    let y = 0;
    for (let node = el; node; node = node.offsetParent) y += node.offsetTop;
    return y;
  };
  layers.forEach((layer) =>
    layer.addEventListener('click', () => {
      const panel = panels[Number(layer.dataset.layer)];
      if (panel) scrollToY(docTop(panel) - headerH(), 0.9);
    }),
  );

  // la pile s'écarte quand elle arrive à l'écran
  if (scene && !reduced()) {
    gsap.fromTo(scene, { '--gap': token('--space-1') }, { '--gap': token('--space-5'), duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: scene, start: 'top 80%', once: true } });
  }
}
