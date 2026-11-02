// Curseur personnalisé (point + anneau qui affiche la charge de l'appui long) et boutons magnétiques.
// Seulement avec une souris, et jamais avec « réduire les animations ».
import { gsap } from '../core/gsap.js';
import { $, $$, root, fine, reduced, token } from '../core/env.js';
import { state } from '../core/state.js';

export function initCursor() {
  const cursor = $('#cursor');
  if (!fine || reduced() || !cursor) return;
  root.classList.add('has-cursor');

  const dot = $('.cursor__dot', cursor);
  const ring = $('.cursor__ring', cursor);
  const prog = $('.cursor__prog', cursor);
  const dx = gsap.quickTo(dot, 'x', { duration: 0.06, ease: 'none' });
  const dy = gsap.quickTo(dot, 'y', { duration: 0.06, ease: 'none' });
  const rx = gsap.quickTo(ring, 'x', { duration: 0.42, ease: 'power3.out' });
  const ry = gsap.quickTo(ring, 'y', { duration: 0.42, ease: 'power3.out' });

  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
      cursor.classList.remove('is-out');
    },
    { passive: true },
  );
  document.addEventListener('mouseleave', () => cursor.classList.add('is-out'));

  // anneau agrandi sur tout ce qui se clique
  document.addEventListener('pointerover', (e) => {
    const link = e.target.closest('a, button:not(.hero__symbol), input, textarea, label, [role="tab"], .iso__layer');
    cursor.classList.toggle('is-link', !!link);
  });

  // la scène 3D pilote la jauge circulaire pendant l'appui long
  const C = parseFloat(token('--ring-length')) || 113.1;
  let holdP = -1;
  let overSymbol = false;
  let holdClass = false;
  const sync = () => {
    const on = holdP > 0.001 || overSymbol;
    if (on !== holdClass) {
      holdClass = on;
      cursor.classList.toggle('is-hold', on);
    }
  };
  state.setHold = (p) => {
    if (Math.abs(p - holdP) > 0.002) {
      holdP = p;
      prog.style.strokeDashoffset = (C * (1 - p)).toFixed(2);
    }
    sync();
  };
  state.cursorSym = (on) => {
    overSymbol = on;
    sync();
  };
}

export function initMagnetic() {
  if (!fine || reduced()) return;
  $$('.magnetic').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.4);
    });
    el.addEventListener('pointerleave', () => {
      xTo(0);
      yTo(0);
    });
  });
}
