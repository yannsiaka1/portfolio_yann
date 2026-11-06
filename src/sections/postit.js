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
const COLLAPSE_FALLBACK = 1200; // ms : plus long que --slow, la fermeture de sa place
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

  // onglet en arrière-plan : le temps ne compte pas, il reprend au retour du visiteur
  let timer = 0;
  const visit = (id) => {
    clearTimeout(timer);
    if (!document.hidden && items.some((el) => el.dataset.todo === id)) timer = setTimeout(() => tick(id), DWELL);
  };
  window.addEventListener(EVT_SECTION, (e) => visit(e.detail));
  document.addEventListener('visibilitychange', () => visit(state.section));
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
    if (note.classList.contains('is-peeling')) return;
    save({ ...load(), off: true });
    const hadFocus = note.contains(document.activeElement);
    // sous 1280 px, il occupe une place dans le hero : elle se referme, puis les sections épinglées se remesurent
    const inFlow = getComputedStyle(note).position !== 'absolute';
    const refocus = () => {
      if (!hadFocus) return;
      const next = $('.hero__actions .btn');
      if (next) next.focus({ preventScroll: true });
    };
    let removed = false;
    const remove = () => {
      if (removed) return;
      removed = true;
      note.remove();
      if (inFlow) ScrollTrigger.refresh();
    };
    if (reduced()) {
      refocus();
      return remove();
    }
    // 1. il se décolle (transform et opacité) ; 2. sa place se referme en douceur au lieu de faire sauter la page
    let peeled = false;
    const collapse = () => {
      if (peeled) return;
      peeled = true;
      refocus();
      if (!inFlow) return remove();
      note.classList.add('is-collapsing');
      note.style.height = `${note.offsetHeight}px`;
      void note.offsetHeight; // point de départ mesuré avant la transition
      note.style.height = '0px';
      note.style.marginTop = '0px';
      note.addEventListener('transitionend', (e) => e.target === note && remove());
      setTimeout(remove, COLLAPSE_FALLBACK);
    };
    note.addEventListener('animationend', (e) => e.target === note && collapse());
    note.classList.add('is-peeling');
    setTimeout(collapse, PEEL_FALLBACK); // filets de sécurité si une animation ne se termine pas (onglet en arrière-plan)
  });
}
