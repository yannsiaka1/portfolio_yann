// Pied de page : la signature « Yann Siaka » se gonfle sous la souris et chaque lettre joue une note.
import { $, $$, fine, reduce, clamp } from '../core/env.js';
import { audio } from '../core/audio.js';

const NOTES = [196, 220, 247, 294, 330, 392, 440, 494, 587]; // sol3 → ré5

export function initFooter() {
  const wordmark = $('#wordmark');
  if (!wordmark) return;

  const letters = [];
  $$('.word', wordmark).forEach((word) => {
    const text = word.textContent;
    word.textContent = '';
    word.setAttribute('aria-hidden', 'true');
    Array.from(text).forEach((ch) => {
      const s = document.createElement('span');
      s.className = 'ch';
      s.textContent = ch;
      word.appendChild(s);
      letters.push(s);
    });
  });

  letters.forEach((letter, i) =>
    letter.addEventListener('pointerenter', () => {
      audio.pluck(NOTES[i % NOTES.length]);
      letter.classList.add('is-hot');
      setTimeout(() => letter.classList.remove('is-hot'), 420);
    }),
  );

  if (!fine || reduce) return;
  // graisse et chasse variables selon la distance au curseur
  let mx = 0;
  let my = 0;
  let raf = 0;
  const update = () => {
    raf = 0;
    letters.forEach((l) => {
      const r = l.getBoundingClientRect();
      const k = clamp(1 - Math.hypot(mx - (r.left + r.width / 2), my - (r.top + r.height / 2)) / 320, 0, 1);
      l.style.setProperty('--w', String(Math.round(420 + k * 480)));
      l.style.setProperty('--wd', String(Math.round(86 + k * 39)));
    });
  };
  wordmark.addEventListener('pointermove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    if (!raf) raf = requestAnimationFrame(update);
  });
  wordmark.addEventListener('pointerleave', () =>
    letters.forEach((l) => {
      l.style.removeProperty('--w');
      l.style.removeProperty('--wd');
    }),
  );
}
