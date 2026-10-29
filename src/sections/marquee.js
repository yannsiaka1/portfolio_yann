// Bandeau défilant infini : accélère et change de sens selon la vitesse du scroll.
import { gsap } from '../core/gsap.js';
import { $, $$, reduce } from '../core/env.js';
import { state } from '../core/state.js';

const measures = [];

export function initMarquee() {
  $$('.marquee__row').forEach((row) => {
    const set = $('.marquee__set', row);
    if (!set) return;
    let w = set.getBoundingClientRect().width || 1;
    // assez de copies pour couvrir deux largeurs d'écran
    const copies = Math.ceil((window.innerWidth * 2.2) / w) + 1;
    for (let i = 0; i < copies; i++) row.appendChild(set.cloneNode(true));
    const dir = Number(row.dataset.dir || -1);
    const speed = Number(row.dataset.speed || 60);
    let x = dir > 0 ? -w : 0;
    measures.push(() => {
      w = set.getBoundingClientRect().width || 1;
    });
    if (reduce) return;

    gsap.ticker.add((time, dtMs) => {
      const v = state.vel || 0;
      const boost = 1 + Math.min(5, Math.abs(v) * 0.08);
      const sign = v < -0.5 ? -1 : 1;
      x += dir * sign * speed * boost * (Math.min(dtMs, 50) / 1000);
      if (x <= -w) x += w;
      if (x > 0) x -= w;
      row.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
    });
  });

  // la vitesse retombe doucement quand le défilement s'arrête
  gsap.ticker.add(() => {
    state.vel *= 0.9;
  });
}

export function measureMarquee() {
  measures.forEach((measure) => measure());
}
