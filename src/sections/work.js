// Projets : section épinglée qui défile à l'horizontale sur grand écran (> 900 px).
// En dessous, ou avec le mouvement réduit, les cartes s'empilent normalement.
import { gsap, ScrollTrigger } from '../core/gsap.js';
import { $, $$ } from '../core/env.js';

export function initWork() {
  const work = $('#projets');
  const track = $('.work__track');
  if (!work || !track) return;
  const bar = $('#workBar');
  const counter = $('#workIdx');

  gsap.matchMedia().add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => {
    work.classList.add('is-horizontal');
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const tween = gsap.to(track, { x: () => -distance(), ease: 'none' });
    const cards = $$('.card', track);

    ScrollTrigger.create({
      trigger: work,
      start: 'top top',
      end: () => `+=${distance()}`,
      pin: true,
      scrub: 0.8,
      animation: tween,
      invalidateOnRefresh: true,
      anticipatePin: 1,
      refreshPriority: 2,
      onUpdate: (self) => {
        if (bar) bar.style.transform = `scaleX(${self.progress.toFixed(3)})`;
        if (counter) {
          // la carte la plus proche du centre de l'écran donne le numéro
          const mid = window.innerWidth / 2;
          let best = 0;
          let bestDist = Infinity;
          cards.forEach((c, i) => {
            const r = c.getBoundingClientRect();
            const d = Math.abs(r.left + r.width / 2 - mid);
            if (d < bestDist) {
              bestDist = d;
              best = i;
            }
          });
          const text = `0${best + 1} / 0${cards.length}`;
          if (counter.textContent !== text) counter.textContent = text;
        }
      },
    });

    // léger parallaxe des maquettes dans leur cadre
    cards.forEach((card) => {
      const mock = $('[data-par]', card);
      if (mock) {
        gsap.fromTo(mock, { xPercent: 5 }, { xPercent: -5, ease: 'none', scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
      }
    });

    return () => work.classList.remove('is-horizontal');
  });
}
