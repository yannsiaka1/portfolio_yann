// Barre de navigation : invite « yann@siaka:~/section$ », liens, bouton son, menu plein écran et ancres.
import { $, $$, root } from '../core/env.js';
import { audio } from '../core/audio.js';
import { scramble } from '../core/text.js';
import { pauseScroll, resumeScroll, scrollToTarget, hasSmoothScroll } from '../core/scroll.js';

const els = {};
let menuOpen = false;

/* ---------- menu ---------- */
/** Menu ouvert : la page derrière devient inerte (ni focus clavier, ni lecteur d'écran). */
function setPageInert(on) {
  [$('#main'), $('.footer')].forEach((el) => {
    if (el) el.inert = on;
  });
}

function openMenu() {
  const { menu, menuBtn, panel, nav } = els;
  if (!menu || menuOpen) return;
  menuOpen = true;
  // le cercle du clip-path s'ouvre depuis le bouton Menu
  const r = menuBtn.getBoundingClientRect();
  const pr = panel.getBoundingClientRect();
  panel.style.setProperty('--mx', `${r.left + r.width / 2 - pr.left}px`);
  panel.style.setProperty('--my', `${r.top + r.height / 2 - pr.top}px`);
  menu.classList.add('is-open');
  root.classList.add('menu-open');
  menuBtn.setAttribute('aria-expanded', 'true');
  nav.classList.remove('is-hidden');
  setPageInert(true);
  pauseScroll();
  setTimeout(() => {
    const first = $('a', menu);
    if (first) first.focus({ preventScroll: true });
  }, 380);
}

function closeMenu(refocus) {
  const { menu, menuBtn } = els;
  if (!menu || !menuOpen) return;
  menuOpen = false;
  menu.classList.remove('is-open');
  root.classList.remove('menu-open');
  menuBtn.setAttribute('aria-expanded', 'false');
  setPageInert(false);
  resumeScroll();
  if (refocus) menuBtn.focus({ preventScroll: true });
}

function initMenu() {
  const { menuBtn } = els;
  if (menuBtn) menuBtn.addEventListener('click', () => (menuOpen ? closeMenu(true) : openMenu()));
  $$('[data-close]').forEach((el) => el.addEventListener('click', () => closeMenu(true)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu(true);
  });
}

/* ---------- bouton son ---------- */
function initSoundToggle() {
  const btn = $('#soundBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const on = !audio.enabled;
    audio.setEnabled(on);
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', on ? 'Couper le son' : 'Activer le son');
    const label = $('.sound__label', btn);
    if (label) label.textContent = on ? 'Son on' : 'Son off';
    if (on) audio.morph();
  });
}

/* ---------- ancres internes ---------- */
function initAnchors() {
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      closeMenu(false);
      // une section épinglée par ScrollTrigger vit dans un « pin-spacer » : on vise celui-ci
      const host = target.parentElement && target.parentElement.classList.contains('pin-spacer') ? target.parentElement : target;
      scrollToTarget(id === '#accueil' ? 0 : host);
      if (id !== '#accueil') {
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        setTimeout(() => target.focus({ preventScroll: true }), hasSmoothScroll() ? 900 : 300);
      }
    });
  });
  const toTop = $('#toTop');
  if (toTop) toTop.addEventListener('click', () => scrollToTarget(0));
}

/* ---------- état de la barre et chemin de l'invite ---------- */
function initNavState() {
  const { nav } = els;
  const pathEl = $('#navPath');
  const sections = $$('[data-path]');
  const links = $$('.nav__links a');
  let lastY = 0;
  let curPath = '~';
  let ticking = false;

  const update = () => {
    ticking = false;
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 30);
    // cachée en descendant, réaffichée en remontant
    if (!menuOpen) {
      if (y > lastY + 2 && y > window.innerHeight * 0.8) nav.classList.add('is-hidden');
      else if (y < lastY - 2 || y < window.innerHeight * 0.8) nav.classList.remove('is-hidden');
    }
    lastY = y;

    const mid = window.innerHeight * 0.42;
    let found = sections[0];
    for (let i = 0; i < sections.length; i++) if (sections[i].getBoundingClientRect().top <= mid) found = sections[i];
    const path = found ? found.dataset.path : '~';
    if (path !== curPath) {
      curPath = path;
      scramble(pathEl, path, 0.45);
      const id = found && found.id ? `#${found.id}` : '';
      links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === id));
    }
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  update();
}

export function initNav() {
  els.nav = $('#nav');
  els.menu = $('#menu');
  els.menuBtn = $('#menuBtn');
  els.panel = $('.menu__panel');

  initSoundToggle();
  initMenu();
  initAnchors();
  initNavState();

  // les liens de la barre se brouillent au survol
  $$('[data-scramble]').forEach((a) => {
    const text = a.textContent;
    a.addEventListener('pointerenter', () => scramble(a, text, 0.4));
    a.addEventListener('focus', () => scramble(a, text, 0.4));
  });
}
