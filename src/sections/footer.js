// Pied de page : la signature « Yann Siaka » se gonfle sous la souris (graisse et chasse variables).
import { $, $$, fine, reduced, clamp } from '../core/env.js';
import { splitText } from '../core/text.js';

export function initFooter() {
  const signature = $('#signature');
  if (!signature) return;
  const letters = [];
  $$('.signature__word', signature).forEach((word) => letters.push(...splitText(word, 'chars')));
  if (!fine || reduced()) return;

  letters.forEach((letter) =>
    letter.addEventListener('pointerenter', () => {
      letter.classList.add('is-hot');
      setTimeout(() => letter.classList.remove('is-hot'), 420);
    }),
  );
  let mx = 0;
  let my = 0;
  let raf = 0;
  const update = () => {
    raf = 0;
    letters.forEach((l) => {
      const r = l.getBoundingClientRect();
      const k = clamp(1 - Math.hypot(mx - (r.left + r.width / 2), my - (r.top + r.height / 2)) / 320, 0, 1);
      l.style.setProperty('--w', String(Math.round(420 + k * 480)));
      l.style.setProperty('--wd', `${Math.round(86 + k * 39)}%`);
    });
  };
  signature.addEventListener('pointermove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    if (!raf) raf = requestAnimationFrame(update);
  });
  signature.addEventListener('pointerleave', () =>
    letters.forEach((l) => {
      l.style.removeProperty('--w');
      l.style.removeProperty('--wd');
    }),
  );
}
