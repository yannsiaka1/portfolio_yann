// Projets. Trois façons de les montrer, choisies selon l'écran et les préférences :
// - « deck » (grand écran, cartes qui tiennent dans la hauteur) : la section s'épingle, chaque projet arrive par
//   la droite pendant que le précédent bascule à gauche, avec un temps de repos par carte et un aimant qui
//   termine le geste commencé ;
// - « flow » (mobile, écran bas, carte trop haute) : les cartes s'empilent ; chacune arrive par la droite en
//   entrant et repart à gauche en sortant, et reste immobile pendant qu'on la lit ;
// - « static » (« réduire les animations ») : les cartes empilées, immobiles.
// Dans tous les cas, tout le contenu reste dans la page et au clavier : la carte qui reçoit le focus est amenée
// à l'écran. Les vidéos des prototypes ne jouent que visibles, s'arrêtent avec la pause générale et ont leur bouton.
import { gsap, ScrollTrigger } from '../core/gsap.js';
import { $, $$, reduced, motionQuery } from '../core/env.js';
import { scrollToY, focusVisible } from '../core/scroll.js';
import { state, EVT_PAUSE } from '../core/state.js';
import { t } from '../core/i18n.js';

const DECK_QUERY = '(min-width: 64rem) and (min-height: 40rem)';
const HOLD = 0.7; // repos d'une carte, en durées de transition
const UNIT = 0.85; // défilement d'une transition, en hauteurs d'écran
const SNAP_DELAY = 160; // ms sans défilement avant de terminer le geste
const PEEK = 74; // le premier projet dépasse à droite de l'introduction (décalage en % de sa largeur)

export function initProjects() {
  const section = $('#projets');
  const root = $('#projects');
  if (!section || !root) return;
  const panels = $$('.projects__panel', root);
  const cards = $$('.card', root);
  const bar = $('#projectsBar');
  const count = $('#projectsCount');
  const total = cards.length;
  const deckQuery = window.matchMedia(DECK_QUERY);

  let mode = null;
  let ctx = null;
  let deck = null; // { st, tl, rest, period }
  let active = 0; // panneau au repos (0 : l'introduction)

  /* ---------- vidéos des prototypes : l'ERP, et Easy Life en thème clair et sombre côte à côte ----------
     Une carte = un lecteur (une ou plusieurs vidéos, un bouton). Les vidéos ne jouent que visibles, s'arrêtent
     avec la pause générale, ne partent jamais seules avec « réduire les animations », et le bouton de la carte
     décide en dernier. Deux vidéos côte à côte repartent ensemble à chaque tour, pour rester synchrones. */
  const players = $$('.card__visual', root)
    .map((visual) => {
      const videos = $$('video', visual);
      const btn = $('.card__play', visual);
      if (!videos.length || !btn) return null;
      return { visual, videos, btn, panel: panels.indexOf(visual.closest('.projects__panel')), seen: false, choice: null };
    })
    .filter(Boolean);

  const isPlaying = (p) => !p.videos[0].paused;
  const start = (p) => p.videos.forEach((v) => v.play().catch(() => {}));
  const stop = (p) => p.videos.forEach((v) => v.pause());
  const visible = (p) => (mode === 'deck' ? !!deck && deck.st.isActive && active === p.panel : p.seen);

  function apply(p) {
    const auto = !reduced() && !state.paused;
    const want = visible(p) && (p.choice === true || (p.choice === null && auto));
    if (want && !isPlaying(p)) start(p);
    else if (!want && isPlaying(p)) stop(p);
  }
  const applyVideo = () => players.forEach(apply);

  function syncButton(p) {
    const many = p.videos.length > 1;
    const label = isPlaying(p)
      ? many ? t({ fr: 'Mettre les vidéos en pause', en: 'Pause the videos' }) : t({ fr: 'Mettre la vidéo en pause', en: 'Pause the video' })
      : many ? t({ fr: 'Lire les vidéos', en: 'Play the videos' }) : t({ fr: 'Lire la vidéo', en: 'Play the video' });
    p.btn.classList.toggle('is-playing', isPlaying(p));
    p.btn.setAttribute('aria-label', label);
    p.btn.title = label;
  }

  players.forEach((p) => {
    p.videos.forEach((v) => {
      // le bouton de la carte remplace les commandes natives, gardées pour une visite sans JavaScript
      v.removeAttribute('controls');
      v.addEventListener('play', () => syncButton(p));
      v.addEventListener('pause', () => syncButton(p));
    });
    if (p.videos.length > 1) {
      p.videos.forEach((v) => v.removeAttribute('loop'));
      p.videos[0].addEventListener('ended', () => {
        p.videos.forEach((v) => {
          v.currentTime = 0;
        });
        start(p);
      });
    }
    p.btn.hidden = false;
    p.btn.addEventListener('click', () => {
      p.choice = !isPlaying(p);
      if (p.choice) start(p);
      else stop(p);
    });
    new IntersectionObserver(
      ([entry]) => {
        p.seen = entry.isIntersecting;
        apply(p);
      },
      { threshold: 0.4 },
    ).observe(p.visual);
  });
  window.addEventListener(EVT_PAUSE, () => {
    players.forEach((p) => {
      p.choice = null;
    });
    applyVideo();
  });
  motionQuery.addEventListener('change', applyVideo);

  /* ---------- barre et compteur (mode épinglé) ---------- */
  function sync() {
    if (!deck) return;
    const t = deck.tl.time();
    let best = 0;
    deck.rest.forEach((r, i) => {
      if (Math.abs(t - r) < Math.abs(t - deck.rest[best])) best = i;
    });
    if (bar) bar.style.transform = `scaleX(${deck.tl.progress().toFixed(3)})`;
    if (count) {
      const text = `${String(Math.max(1, best)).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
      if (count.textContent !== text) count.textContent = text;
    }
    if (best !== active) {
      active = best;
      applyVideo();
    }
  }

  /** Les cartes tiennent-elles dans la fenêtre épinglée ? (mesuré avec les styles du mode épinglé) */
  function cardsFit() {
    const had = section.classList.contains('is-deck');
    section.classList.add('is-deck', 'is-measuring');
    const ok = cards.every((card) => {
      const body = $('.card__body', card);
      return body.scrollHeight <= body.clientHeight + 1;
    });
    section.classList.remove('is-measuring');
    if (!had) section.classList.remove('is-deck');
    return ok;
  }

  function wantedMode() {
    if (reduced()) return 'static';
    if (deckQuery.matches && cardsFit()) return 'deck';
    return 'flow';
  }

  /* ---------- mode épinglé ---------- */
  function buildDeck() {
    section.classList.add('is-deck');
    const header = $('.site-header');
    const headerH = () => (header ? header.offsetHeight : 0);
    const period = 1 + HOLD;

    gsap.set(panels, { zIndex: (i) => i + 1 });
    gsap.set(panels.slice(2), { xPercent: 105 });
    gsap.set(panels[1], { xPercent: PEEK });

    const tl = gsap.timeline({ defaults: { duration: 1, ease: 'power2.inOut' }, onUpdate: sync });
    const rest = [HOLD / 2];
    tl.to({}, { duration: HOLD });
    for (let i = 0; i < panels.length - 1; i++) {
      const at = i * period + HOLD;
      // le précédent bascule à gauche : il recule, pivote sur son bord gauche et s'efface sous le suivant
      tl.to(panels[i], { xPercent: -22, scale: 0.86, rotationY: 14, opacity: 0, transformOrigin: '0% 50%' }, at);
      // le suivant arrive par la droite, sa maquette un peu en retard sur la carte
      tl.fromTo(panels[i + 1], { xPercent: i === 0 ? PEEK : 105 }, { xPercent: 0 }, at);
      const stage = $('[data-par]', panels[i + 1]);
      if (stage) tl.fromTo(stage, { xPercent: 12 }, { xPercent: 0, ease: 'power3.out' }, at);
      tl.to({}, { duration: HOLD }, at + 1);
      rest.push((i + 1) * period + HOLD / 2);
    }
    const duration = tl.duration();

    const st = ScrollTrigger.create({
      trigger: section,
      start: () => `top ${headerH()}px`,
      end: () => `+=${Math.round(duration * UNIT * window.innerHeight)}`,
      pin: true,
      scrub: 0.6,
      animation: tl,
      invalidateOnRefresh: true,
      anticipatePin: 1,
      // créée après les révélations des sections suivantes, que son épinglage décale : recalculée avant elles
      refreshPriority: 2,
      onToggle: applyVideo,
    });
    deck = { st, tl, rest, period, duration };
    sync();
  }

  /** Position de la page où le panneau i est au repos (au centre de son temps de repos). */
  function restY(i) {
    const { st, rest, duration } = deck;
    return st.start + (rest[i] / duration) * (st.end - st.start);
  }

  // Aimant : un geste arrêté au milieu d'une transition se termine vers la carte suivante dans le sens où l'on
  // défilait ; au clavier, quelques flèches font sortir du repos, puis l'aimant amène la carte voisine.
  let lastY = window.scrollY;
  let dir = 1;
  let snapTimer;
  function snap() {
    if (mode !== 'deck' || !deck) return;
    const { st, period, duration } = deck;
    const y = window.scrollY;
    if (y <= st.start + 1 || y >= st.end - 1) return;
    const t = ((y - st.start) / (st.end - st.start)) * duration;
    const k = Math.floor(t / period);
    const local = t - k * period;
    if (local <= HOLD) return; // déjà au repos
    const f = local - HOLD; // avancement de la transition k → k + 1, de 0 à 1
    // un petit pas (flèche du clavier, cran de molette) suffit : la transition se termine dans le sens du geste
    const forward = dir > 0 ? f > 0.02 : f > 0.98;
    const target = forward ? (k + 1) * period + 0.02 : k * period + HOLD - 0.02;
    scrollToY(st.start + (target / duration) * (st.end - st.start), 0.7);
  }
  window.addEventListener(
    'scroll',
    () => {
      const y = window.scrollY;
      if (y !== lastY) dir = y > lastY ? 1 : -1;
      lastY = y;
      clearTimeout(snapTimer);
      snapTimer = setTimeout(snap, SNAP_DELAY);
    },
    { passive: true },
  );

  // Au clavier : la carte qui reçoit le focus vient au repos à l'écran.
  root.addEventListener('focusin', (e) => {
    if (mode !== 'deck' || !deck || !focusVisible(e.target)) return;
    const i = panels.indexOf(e.target.closest('.projects__panel'));
    if (i < 0) return;
    const y = restY(i);
    if (Math.abs(window.scrollY - y) > 2) scrollToY(y, 0.6);
  });

  /* ---------- mode empilé, avec mouvement ---------- */
  function buildFlow() {
    cards.forEach((card) => {
      // arrivée par la droite pendant que la carte entre par le bas, terminée avant qu'on lise son texte
      gsap.fromTo(
        card,
        { xPercent: 16, rotationY: -9, opacity: 0.25 },
        {
          xPercent: 0,
          rotationY: 0,
          opacity: 1,
          ease: 'none',
          transformPerspective: 1200,
          transformOrigin: '100% 50%',
          scrollTrigger: { trigger: card, start: 'top 100%', end: 'top 58%', scrub: 0.4 },
        },
      );
      // départ à gauche quand il ne reste plus que son bas à l'écran
      gsap.to(card, {
        xPercent: -14,
        rotationY: 10,
        scale: 0.94,
        opacity: 0.25,
        ease: 'none',
        transformPerspective: 1200,
        transformOrigin: '0% 50%',
        immediateRender: false,
        scrollTrigger: { trigger: card, start: 'bottom 26%', end: 'bottom -4%', scrub: 0.4 },
      });
    });
  }

  function teardown() {
    if (ctx) ctx.revert();
    ctx = null;
    deck = null;
    active = 0;
    section.classList.remove('is-deck');
    if (bar) bar.style.transform = '';
  }

  function setup() {
    const next = wantedMode();
    if (next === mode) return;
    teardown();
    mode = next;
    if (mode !== 'static') {
      ctx = gsap.context(() => {
        if (mode === 'deck') buildDeck();
        else buildFlow();
      });
    }
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    applyVideo();
  }

  // les cartes se mesurent une fois les polices chargées ; puis à chaque changement de taille ou de préférence
  const ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  ready.then(setup);
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(setup, 250);
  });
  deckQuery.addEventListener('change', setup);
  motionQuery.addEventListener('change', setup);
}
