// Découpe de texte (lettres, mots, masques) et effet de brouillage « terminal ».
import { reduce } from './env.js';

/**
 * Découpe le texte d'un élément en conservant sa structure (em, span…).
 * - 'chars' : une span.ch par lettre, regroupées par mot (span.w) pour éviter les coupures au milieu d'un mot
 * - 'mask'  : une span.wi par mot dans une span.w qui sert de masque
 * - 'words' : une span.w par mot
 * Renvoie les éléments à animer.
 */
export function splitText(el, mode) {
  const out = [];
  const walk = (node) => {
    Array.from(node.childNodes).forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(part));
            return;
          }
          const w = document.createElement('span');
          w.className = 'w';
          if (mode === 'chars') {
            Array.from(part).forEach((ch) => {
              const c = document.createElement('span');
              c.className = 'ch';
              c.textContent = ch;
              w.appendChild(c);
              out.push(c);
            });
          } else if (mode === 'mask') {
            const i = document.createElement('span');
            i.className = 'wi';
            i.textContent = part;
            w.appendChild(i);
            out.push(i);
          } else {
            w.textContent = part;
            out.push(w);
          }
          frag.appendChild(w);
        });
        n.parentNode.replaceChild(frag, n);
      } else if (n.nodeType === 1 && !n.classList.contains('work__count')) walk(n);
    });
  };
  walk(el);
  return out;
}

const GLYPHS = '</>{}[]_#$%&*+=;:01';

/** Fait défiler des glyphes de code avant d'afficher le texte final. */
export function scramble(el, text, dur = 0.5) {
  if (!el) return;
  if (reduce) {
    el.textContent = text;
    return;
  }
  cancelAnimationFrame(el._scr);
  const t0 = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - t0) / (dur * 1000));
    let out = '';
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      out += i / text.length < p * 1.25 - 0.15 || ch === ' ' ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    el.textContent = out;
    if (p < 1) el._scr = requestAnimationFrame(step);
    else el.textContent = text;
  };
  el._scr = requestAnimationFrame(step);
}
