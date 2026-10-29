// Curseur personnalisé (point + anneau qui affiche la charge du clic long) et boutons magnétiques.
// Actifs seulement avec une souris, et jamais si l'utilisateur demande moins d'animations.
import { gsap } from '../core/gsap.js';
import { $, $$, root, fine, reduce } from '../core/env.js';
import { state } from '../core/state.js';

export function initCursor() {
  const cursor = $('#cursor');
  if (!fine || reduce || !cursor) return;
  root.classList.add('has-cursor');

  const dot = $('.cursor__dot', cursor);
  const ring = $('.cursor__ring', cursor);
  const label = $('.cursor__label', cursor);
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
  root.addEventListener('mouseleave', () => cursor.classList.add('is-out'));

  // libellé (« Défilez ») sur les cartes projet, anneau agrandi sur les liens
  document.addEventListener('pointerover', (e) => {
    const labelled = e.target.closest('[data-cursor]');
    const link = e.target.closest('a,button,input,textarea,label');
    cursor.classList.toggle('is-label', !!labelled && !link);
    cursor.classList.toggle('is-link', !!link);
    if (labelled) label.textContent = labelled.dataset.cursor;
  });

  // la scène 3D pilote la jauge circulaire pendant le clic long
  const C = 2 * Math.PI * 18;
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
  if (!fine || reduce) return;
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
