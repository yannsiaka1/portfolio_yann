// Barre de navigation : invite « yann@siaka:~/section$ », section en cours, menu mobile, ancres.
import { $, $$ } from '../core/env.js';
import { t } from '../core/i18n.js';
import { scramble } from '../core/text.js';
import { scrollToTarget, hasSmoothScroll } from '../core/scroll.js';

export function initNav() {
  const header = $('.site-header');
  if (!header) return;
  const toggle = $('.menu-toggle', header);
  const nav = $('#site-nav');
  const wide = window.matchMedia('(min-width: 64rem)');

  /* ---------- menu mobile ---------- */
  const isOpen = () => header.classList.contains('is-open');
  const setOpen = (open, refocus = false) => {
    header.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? t({ fr: 'Fermer', en: 'Close' }) : 'Menu';
    if (!open && refocus) toggle.focus();
  };

  if (toggle && nav) {
    toggle.addEventListener('click', () => setOpen(!isOpen()));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen()) setOpen(false, true);
    });
    document.addEventListener('click', (e) => {
      if (isOpen() && !header.contains(e.target)) setOpen(false);
    });
    // le focus quitte la barre (Tab après le dernier lien) : le menu se referme au lieu de masquer la page
    header.addEventListener('focusout', (e) => {
      if (isOpen() && e.relatedTarget && !header.contains(e.relatedTarget)) setOpen(false);
    });
    wide.addEventListener('change', () => setOpen(false));
  }

  /* ---------- ancres : défilement doux, puis focus sur la section (le lien du menu disparaît avec lui) ---------- */
  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (!id || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (isOpen()) setOpen(false);
      scrollToTarget(id === '#accueil' ? 0 : target);
      if (id === '#main' || id === '#accueil') {
        if (id === '#main') target.focus({ preventScroll: true });
        return;
      }
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      setTimeout(() => target.focus({ preventScroll: true }), hasSmoothScroll() ? 900 : 0);
    });
  });

  /* ---------- filet sous la barre dès que la page défile ---------- */
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- section en cours : celle qui contient le milieu de l'écran ----------
     Mesurée à chaque défilement (une fois par image) plutôt qu'avec un IntersectionObserver : les sections
     épinglées (projets, compétences) restent ainsi reconnues pendant tout leur épinglage. */
  const links = $$('.site-nav__link');
  const pathEl = $('#navPath');
  const prompt = $('.prompt');
  const sections = $$('[data-path]');
  let currentPath = null;
  let queued = false;
  const update = () => {
    queued = false;
    const mid = window.innerHeight * 0.47;
    const section = sections.find((el) => {
      const r = el.getBoundingClientRect();
      return r.top <= mid && r.bottom > mid;
    });
    if (!section) return; // bandeau entre le hero et les projets : on garde la section précédente
    const id = `#${section.id}`;
    links.forEach((a) => {
      if (a.getAttribute('href') === id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    const path = section.dataset.path || '~';
    if (path !== currentPath) {
      const first = currentPath === null;
      currentPath = path;
      // dans une section, l'invite se raccourcit sur les petits écrans (voir layout.css) ; à l'accueil, « yann@siaka:~$ »
      if (prompt) prompt.classList.toggle('is-deep', path !== '~');
      if (first) pathEl.textContent = path;
      else scramble(pathEl, path, 0.45);
    }
  };
  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  update();
}
