// Révélations au défilement : titres masqués mot par mot, blocs qui montent,
// phrase d'À propos qui s'éclaire au fil du défilement, compteurs à rouleaux des repères.
// Avec « réduire les animations », tout reste visible et immobile ; de même quand on arrive par un lien vers une
// section (/#contact) : le visiteur vient lire cette section, elle s'affiche d'un coup.
// Ce qui est déjà à l'écran ou plus haut quand la page démarre reste tel quel : les scripts arrivent après le premier
// affichage, et masquer ce que le visiteur a déjà sous les yeux le ferait clignoter.
// Les blocs partent d'une opacité nulle mais restent focalisables (jamais visibility: hidden) : un utilisateur
// au clavier les atteint, la page défile jusqu'à eux, et un bloc qui reçoit le focus avant d'être révélé
// apparaît aussitôt.
// Un seul IntersectionObserver par sorte de révélation plutôt qu'un ScrollTrigger par élément : chaque déclencheur
// mesurait la page au démarrage, le plus long calcul de l'ouverture sur téléphone. Les animations sont jouées par le
// navigateur (Web Animations), hors du fil principal ; seule la phrase d'À propos, liée au défilement, garde GSAP.
import { gsap } from '../core/gsap.js';
import { $, $$, hashTarget, reduced, token, tokenMs } from '../core/env.js';
import { splitText } from '../core/text.js';

const WORDS_IN = 1150; // ms : un mot de titre qui sort de son masque
const WORDS_STEP = 60; // ms entre deux mots
const ODO_IN = 1500; // ms : un rouleau de compteur
const ODO_DELAY = 100; // ms avant le premier rouleau
const ODO_STEP = 120; // ms entre deux rouleaux d'un même nombre

/** Remplace chaque chiffre de [data-odo] par un rouleau de 20 chiffres (0-9 deux fois). */
function buildOdometers() {
  const reels = [];
  $$('[data-odo]').forEach((el) => {
    const text = el.textContent.trim();
    el.classList.add('odo');
    el.textContent = '';
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = text;
    el.appendChild(sr);
    Array.from(text).forEach((ch) => {
      const digit = Number(ch);
      const reel = document.createElement('span');
      reel.className = 'reel';
      reel.setAttribute('aria-hidden', 'true');
      const strip = document.createElement('span');
      strip.className = 'reel__strip';
      for (let k = 0; k < 20; k++) {
        const s = document.createElement('span');
        s.textContent = String(k % 10);
        strip.appendChild(s);
      }
      // position finale visible même sans animation
      strip.style.transform = `translateY(${-(10 + digit) * 5}%)`;
      reel.appendChild(strip);
      el.appendChild(reel);
      reels.push({ el, strip, digit });
    });
  });
  return reels;
}

export function initReveals() {
  const reels = buildOdometers();
  if (reduced() || hashTarget()) return;
  const easing = token('--ease-expo');

  /** Observe des éléments. À la première mesure, celle de l'IntersectionObserver lui-même (aucune lecture forcée de la
   *  mise en page), ceux qui sont déjà à l'écran ou plus haut restent tels quels ; les autres sont préparés (prepare),
   *  puis révélés une fois (reveal) quand leur haut passe sous `at` % de la hauteur de l'écran. */
  const watch = (els, at, prepare, reveal) => {
    const measured = new WeakSet();
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          const el = entry.target;
          if (!measured.has(el)) {
            measured.add(el);
            if (entry.boundingClientRect.top < window.innerHeight) io.unobserve(el);
            else prepare(el);
            return;
          }
          if (!entry.isIntersecting) return;
          io.unobserve(el);
          reveal(el);
        }),
      { rootMargin: `0px 0px -${100 - at}% 0px` },
    );
    els.forEach((el) => io.observe(el));
    return io;
  };

  // titres : chaque mot sort de son masque, l'un après l'autre (ils attendent sous le masque, décalés de 115 %)
  const titles = new Map();
  watch(
    $$('[data-reveal="words"]'),
    88,
    (el) => {
      el.classList.add('reveal-mask');
      const inners = splitText(el, 'mask');
      inners.forEach((inner) => {
        inner.style.translate = '0 115%';
      });
      titles.set(el, inners);
    },
    (el) =>
      titles.get(el).forEach((inner, i) => {
        inner.style.translate = '';
        inner.animate([{ translate: '0 115%' }, { translate: '0 0' }], { duration: WORDS_IN, delay: i * WORDS_STEP, easing, fill: 'backwards' });
      }),
  );

  // blocs qui montent ; le décalage passe par la propriété translate : il s'ajoute aux transformations propres d'un
  // bloc (la pile isométrique) sans les écraser
  const pending = new Set();
  const rise = token('--reveal-rise');
  const duration = tokenMs('--reveal-in');
  const show = (el, animate) => {
    if (!pending.delete(el)) return;
    el.style.opacity = '';
    el.style.translate = '';
    if (animate) el.animate([{ opacity: 0, translate: `0 ${rise}` }, { opacity: 1, translate: '0 0' }], { duration, easing });
  };
  const blocks = $$('.eyebrow, .section-head__intro, .about__prose, .stat, .skills__panel, .iso, .item, .release, .commit, .form, .contact__side, .subsection > h3, .column > h3, .stats__title, .count, .cmd, .notes__item');
  const blocksIo = watch(
    blocks,
    90,
    (el) => {
      pending.add(el);
      el.style.opacity = '0';
      el.style.translate = `0 ${rise}`;
    },
    (el) => show(el, true),
  );
  // focus clavier sur un bloc pas encore révélé : il apparaît tout de suite
  document.addEventListener('focusin', (e) => {
    pending.forEach((el) => {
      if (!el.contains(e.target)) return;
      blocksIo.unobserve(el);
      show(el, false);
    });
  });

  // la phrase d'À propos s'éclaire mot après mot
  const statement = $('#statement');
  if (statement) {
    const words = splitText(statement, 'words');
    // entièrement éclairée dès que son haut atteint 45 % de la fenêtre, là où l'on commence à la lire ; chaque mot passe
    // du gris secondaire au blanc (--lit de 0 à 1, voir sections.css) : lisible à plus de 7:1 à chaque instant
    gsap.fromTo(words, { '--lit': 0 }, { '--lit': 1, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: statement, start: 'top 85%', end: 'top 45%', scrub: true } });
  }

  // compteurs : les rouleaux d'un même nombre partent l'un après l'autre, de 0 jusqu'à leur chiffre (leur position
  // finale est déjà dans la page : sans animation, le nombre est juste)
  const byNumber = new Map();
  reels.forEach((r) => {
    if (!byNumber.has(r.el)) byNumber.set(r.el, []);
    byNumber.get(r.el).push(r);
  });
  watch(
    [...byNumber.keys()],
    92,
    () => {},
    (el) =>
      byNumber.get(el).forEach((r, i) =>
        r.strip.animate([{ transform: 'translateY(0%)' }, { transform: `translateY(${-(10 + r.digit) * 5}%)` }], {
          duration: ODO_IN,
          delay: ODO_DELAY + i * ODO_STEP,
          easing,
          fill: 'backwards',
        }),
      ),
  );
}
