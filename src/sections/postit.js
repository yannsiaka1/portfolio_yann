// Pense-bête du hero : trois choses à faire pendant la visite (parcourir les projets, vérifier les diplômes,
// écrire un mot). Il se colle à la fin de l'intro, coche chaque tâche faite et se retire avec OK, sans jamais
// bloquer la page. Son état dure le temps de la visite (sessionStorage), comme l'intro.
// Sans JavaScript, il reste une simple liste de liens ; avec « réduire les animations », il apparaît et part sans bouger.
import { ScrollTrigger } from '../core/gsap.js';
import { $, $$, reduced } from '../core/env.js';
import { t } from '../core/i18n.js';
import { state, EVT_INTRO, EVT_SECTION, EVT_WROTE } from '../core/state.js';

const KEY = 'pf-postit';
const STICK_DELAY = 1100; // ms après la fin de l'intro : le nom et les boutons sont arrivés
const PEEL_FALLBACK = 1000; // ms : plus long que --postit-out
const DWELL = 1200; // ms dans une section pour la cocher : la traverser en défilant (lien du menu) ne compte pas
const DONE = t({ fr: ' (fait)', en: ' (done)' });

const load = () => {
  try {
    return JSON.parse(sessionStorage.getItem(KEY)) || {};
  } catch (err) {
    return {};
  }
};

const save = (data) => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(data));
  } catch (err) {
    /* stockage indisponible : le pense-bête oublie son état au prochain chargement, sans autre effet */
  }
};

export function initPostit() {
  const note = $('#postit');
  if (!note) return;
  const saved = load();
  if (saved.off) {
    note.remove();
    return;
  }

  /* ---------- tâches : « projets » et « parcours » se cochent dans leur section, « ecrire » en écrivant ---------- */
  const items = $$('[data-todo]', note);
  const done = new Set(Array.isArray(saved.done) ? saved.done : []);
  const paint = (key) => {
    const item = items.find((el) => el.dataset.todo === key);
    if (!item) return;
    item.classList.add('is-done');
    const label = $('.postit__state', item);
    if (label) label.textContent = DONE;
  };
  // déjà faites pendant la visite : cochées avant que le pense-bête n'apparaisse
  done.forEach(paint);

  // une tâche faite pendant que le pense-bête est hors de l'écran attend son retour pour tracer la coche
  let inView = !('IntersectionObserver' in window);
  const waiting = new Set();
  if (!inView) {
    new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (!inView) return;
        waiting.forEach(paint);
        waiting.clear();
      },
      { threshold: 0.6 },
    ).observe(note);
  }
  const tick = (key) => {
    if (done.has(key)) return;
    done.add(key);
    save({ ...load(), done: [...done] });
    if (inView) paint(key);
    else waiting.add(key);
  };

  let timer = 0;
  const visit = (id) => {
    clearTimeout(timer);
    if (items.some((el) => el.dataset.todo === id)) timer = setTimeout(() => tick(id), DWELL);
  };
  window.addEventListener(EVT_SECTION, (e) => visit(e.detail));
  if (state.section) visit(state.section);
  window.addEventListener(EVT_WROTE, () => tick('ecrire'));
  // écrire directement ou copier l'adresse compte aussi
  document.addEventListener('click', (e) => {
    if (e.target instanceof Element && e.target.closest('a[href^="mailto:"], [data-copy]')) tick('ecrire');
  });

  /* ---------- apparition : il se colle quand le hero a fini d'entrer (animation dans hero.css) ---------- */
  const stick = () => note.classList.add('is-stuck');
  const later = () => (reduced() ? stick() : setTimeout(stick, STICK_DELAY));
  if (state.introFired) later();
  else window.addEventListener(EVT_INTRO, later, { once: true });

  /* ---------- OK : il se décolle et ne revient pas de la visite ---------- */
  const ok = $('.postit__ok', note);
  if (!ok) return;
  ok.addEventListener('click', () => {
    save({ ...load(), off: true });
    const hadFocus = note.contains(document.activeElement);
    // sous 1280 px, il occupe une place dans le hero : les sections épinglées doivent se remesurer après lui
    const inFlow = getComputedStyle(note).position !== 'absolute';
    let ended = false;
    const end = () => {
      if (ended) return;
      ended = true;
      note.remove();
      if (hadFocus) {
        const next = $('.hero__actions .btn');
        if (next) next.focus({ preventScroll: true });
      }
      if (inFlow) ScrollTrigger.refresh();
    };
    if (reduced()) return end();
    note.addEventListener('animationend', end, { once: true });
    note.classList.add('is-peeling');
    setTimeout(end, PEEL_FALLBACK); // filet de sécurité si l'animation ne se termine pas (onglet en arrière-plan)
  });
}
