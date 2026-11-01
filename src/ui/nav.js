// Barre de navigation : filet au défilement, menu mobile, section en cours.
import { $, $$ } from '../core/env.js';

export function initNav() {
  const header = $('.site-header');
  if (!header) return;
  const toggle = $('.menu-toggle', header);
  const nav = $('#site-nav');
  const wide = window.matchMedia('(min-width: 48rem)');

  /* ---------- menu mobile ---------- */
  const isOpen = () => header.classList.contains('is-open');
  const setOpen = (open, refocus = false) => {
    header.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Fermer' : 'Menu';
    if (!open && refocus) toggle.focus();
  };

  if (toggle && nav) {
    toggle.addEventListener('click', () => setOpen(!isOpen()));
    // un lien choisi referme le menu ; le focus suit vers la section, puisque le lien disparaît avec le menu
    nav.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link || !isOpen()) return;
      setOpen(false);
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      requestAnimationFrame(() => target.focus({ preventScroll: true }));
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen()) setOpen(false, true);
    });
    document.addEventListener('click', (e) => {
      if (isOpen() && !header.contains(e.target)) setOpen(false);
    });
    wide.addEventListener('change', () => setOpen(false));
  }

  /* ---------- filet sous la barre dès que la page défile ---------- */
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- section en cours : celle qui traverse le milieu de l'écran ---------- */
  const links = $$('.site-nav__link');
  const sections = $$('main > section[id]');
  if (!('IntersectionObserver' in window) || !links.length) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = `#${entry.target.id}`;
        links.forEach((a) => {
          if (a.getAttribute('href') === id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  sections.forEach((section) => observer.observe(section));
}
