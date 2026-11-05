// Pied de page : la signature « Yann Siaka » ondule seule, en boucle, tant qu'elle est à l'écran. Une vague gonfle
// les lettres l'une après l'autre, de gauche à droite, comme une main qui signe (graisse et chasse variables).
// Sous la souris, la signature suit le curseur, puis la vague reprend. Immobile avec « réduire les animations »,
// avec le bouton pause (WCAG 2.2.2) et hors de l'écran.
import { gsap } from '../core/gsap.js';
import { $, $$, fine, reduced, clamp, motionQuery } from '../core/env.js';
import { state, EVT_PAUSE } from '../core/state.js';
import { splitText } from '../core/text.js';

const SIGMA = 1.1; // largeur de la vague, en lettres
const SWEEP = 2.8; // durée d'un passage, en secondes
const REST = 1.2; // repos entre deux passages, en secondes

export function initFooter() {
  const signature = $('#signature');
  if (!signature) return;
  const letters = [];
  $$('.signature__word', signature).forEach((word) => letters.push(...splitText(word, 'chars')));
  const n = letters.length;
  if (!n) return;

  /** Rend chaque lettre à sa graisse et à sa chasse de repos (la transition CSS les y ramène en douceur). */
  const rest = () =>
    letters.forEach((l) => {
      l.style.removeProperty('--w');
      l.style.removeProperty('--wd');
      l.classList.remove('is-hot');
    });

  /* ---------- la vague : un sommet qui passe de la première à la dernière lettre, un léger creux de part et d'autre ---------- */
  const wave = { p: -4 };
  const paint = () => {
    letters.forEach((l, i) => {
      const d = (i - wave.p) / SIGMA;
      const f = (1 - d * d) * Math.exp((-d * d) / 2); // 1 au sommet, environ -0,45 au creux, 0 au loin
      const w = f > 0 ? 640 + f * 260 : 640 + f * 220; // graisse de repos 640, jusqu'à 900 au sommet
      const wd = f > 0 ? 112 + f * 13 : 112 + f * 26; // chasse de repos 112 %, jusqu'à 125 % au sommet
      l.style.setProperty('--w', String(Math.round(w)));
      l.style.setProperty('--wd', `${wd.toFixed(1)}%`);
      l.classList.toggle('is-hot', f > 0.72);
    });
  };
  const tween = gsap.fromTo(
    wave,
    { p: -4 },
    { p: n + 3, duration: SWEEP, ease: 'sine.inOut', repeat: -1, repeatDelay: REST, paused: true, immediateRender: false, onUpdate: paint },
  );

  /* ---------- une ou deux lignes, décidé une fois et jamais pendant l'animation ----------
     Les lettres gonflées sont plus larges : si le nom tenait tout juste sur une ligne, le passage de la vague le
     faisait passer sur deux lignes puis revenir, et la page sautait. On rejoue donc la vague hors écran, position
     par position : si le nom tient sur une ligne à chaque instant, la ligne est figée ; sinon, chaque mot a la sienne.
     (Le survol à la souris affine les lettres éloignées du curseur : il reste plus étroit que la vague.) */
  const words = $$('.signature__word', signature);
  const fit = () => {
    const saved = letters.map((l) => [l.style.getPropertyValue('--w'), l.style.getPropertyValue('--wd'), l.classList.contains('is-hot')]);
    const p0 = wave.p;
    signature.classList.remove('is-one-line', 'is-stacked');
    signature.classList.add('is-measuring');
    let oneLine = true;
    for (let pos = -2; pos <= n + 1 && oneLine; pos += 0.5) {
      wave.p = pos;
      paint();
      oneLine = words.every((w) => w.offsetTop === words[0].offsetTop);
    }
    wave.p = p0;
    letters.forEach((l, i) => {
      const [w, wd, hot] = saved[i];
      if (w) l.style.setProperty('--w', w);
      else l.style.removeProperty('--w');
      if (wd) l.style.setProperty('--wd', wd);
      else l.style.removeProperty('--wd');
      l.classList.toggle('is-hot', hot);
    });
    signature.classList.remove('is-measuring');
    signature.classList.add(oneLine ? 'is-one-line' : 'is-stacked');
  };
  fit();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  let fitTimer;
  let lastWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    if (window.innerWidth === lastWidth) return; // la barre d'adresse mobile ne change que la hauteur
    lastWidth = window.innerWidth;
    clearTimeout(fitTimer);
    fitTimer = setTimeout(fit, 150);
  });

  let visible = false;
  let hovering = false;
  const update = () => {
    const run = visible && !hovering && !reduced() && !state.paused;
    if (run && tween.paused()) {
      signature.classList.add('is-waving');
      tween.restart();
    } else if (!run && !tween.paused()) {
      tween.pause();
      signature.classList.remove('is-waving');
      if (!hovering) rest();
    }
  };

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    }).observe(signature);
  }
  window.addEventListener(EVT_PAUSE, update);
  motionQuery.addEventListener('change', update);

  /* ---------- à la souris : les lettres proches du curseur gonflent, les autres s'affinent ---------- */
  if (!fine) return;
  letters.forEach((letter) =>
    letter.addEventListener('pointerenter', () => {
      if (reduced()) return;
      letter.classList.add('is-hot');
      setTimeout(() => letter.classList.remove('is-hot'), 420);
    }),
  );
  let mx = 0;
  let my = 0;
  let raf = 0;
  const follow = () => {
    raf = 0;
    const radius = parseFloat(getComputedStyle(signature).fontSize) * 1.35;
    letters.forEach((l) => {
      const r = l.getBoundingClientRect();
      const k = clamp(1 - Math.hypot(mx - (r.left + r.width / 2), my - (r.top + r.height / 2)) / radius, 0, 1);
      l.style.setProperty('--w', String(Math.round(420 + k * 480)));
      l.style.setProperty('--wd', `${Math.round(86 + k * 39)}%`);
    });
  };
  signature.addEventListener('pointerenter', () => {
    if (reduced()) return;
    hovering = true;
    update();
  });
  signature.addEventListener('pointermove', (e) => {
    if (!hovering) return;
    mx = e.clientX;
    my = e.clientY;
    if (!raf) raf = requestAnimationFrame(follow);
  });
  signature.addEventListener('pointerleave', () => {
    if (!hovering) return;
    hovering = false;
    rest();
    // la vague reprend une fois les lettres revenues au repos
    setTimeout(update, 600);
  });
}
