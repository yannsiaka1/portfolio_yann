// Expertise : la pile interface → API → données → cloud s'écarte puis s'allume couche par couche
// pendant que la section est épinglée (grand écran uniquement).
import { gsap, ScrollTrigger } from '../core/gsap.js';
import { $, $$, root, clamp } from '../core/env.js';
import { audio } from '../core/audio.js';

export function initStack() {
  const scene = $('#isoScene');
  if (!scene) return;
  const layers = $$('.iso__layer');
  const infos = $$('.layer-info');
  const steps = $$('.stack__steps i');
  let current = -1;

  const setLayer = (i) => {
    if (i === current) return;
    current = i;
    layers.forEach((l) => l.classList.toggle('is-active', Number(l.dataset.layer) === i));
    infos.forEach((n) => n.classList.toggle('is-active', Number(n.dataset.info) === i));
    steps.forEach((s, k) => s.classList.toggle('is-on', k <= i));
    if (audio.enabled) audio.tick();
  };

  gsap.matchMedia().add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => {
    root.classList.add('js-stack');
    current = -1;
    setLayer(0);
    scene.style.setProperty('--gap', '22px');

    ScrollTrigger.create({
      trigger: '#expertise',
      start: 'top top',
      end: () => `+=${window.innerHeight * 2.6}`,
      pin: true,
      scrub: true,
      invalidateOnRefresh: true,
      refreshPriority: 1,
      onUpdate: (self) => {
        const p = self.progress;
        const spread = clamp(p / 0.18, 0, 1);
        scene.style.setProperty('--gap', `${(22 + spread * 58).toFixed(1)}px`);
        scene.style.setProperty('--rz', `${(-46 + p * 18).toFixed(2)}deg`);
        setLayer(Math.min(3, Math.floor(clamp((p - 0.06) / 0.94, 0, 0.999) * 4)));
      },
    });

    return () => {
      root.classList.remove('js-stack');
      scene.style.removeProperty('--gap');
      scene.style.removeProperty('--rz');
    };
  });
}
