// Révélations au défilement : titres masqués mot par mot, blocs qui montent, captures qui se dévoilent,
// phrase d'À propos qui s'éclaire au fil du défilement, compteurs à rouleaux des repères.
// Avec « réduire les animations », tout reste visible et immobile.
// Les blocs partent d'une opacité nulle mais restent focalisables (jamais visibility: hidden) : un utilisateur
// au clavier les atteint, la page défile jusqu'à eux, et un bloc qui reçoit le focus avant d'être révélé
// apparaît aussitôt.
import { gsap, ScrollTrigger } from '../core/gsap.js';
import { $, $$, reduced } from '../core/env.js';
import { splitText } from '../core/text.js';

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
  if (reduced()) return;

  $$('[data-reveal="words"]').forEach((el) => {
    el.classList.add('reveal-mask');
    const inners = splitText(el, 'mask');
    gsap.from(inners, { yPercent: 115, duration: 1.15, ease: 'expo.out', stagger: 0.06, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });

  const pending = new Set();
  const ups = $$('.section-head__intro, .about__prose, .stat, .project__body, .skills__main, .iso, .item, .release, .commit, .form, .contact__side, .subsection > h3, .column > h3, .cmd');
  ups.forEach((el) => {
    pending.add(el);
    gsap.from(el, {
      y: 36,
      opacity: 0,
      duration: 1,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true, onEnter: () => pending.delete(el) },
    });
  });
  // focus clavier sur un bloc pas encore révélé : il apparaît tout de suite
  document.addEventListener('focusin', (e) => {
    pending.forEach((el) => {
      if (!el.contains(e.target)) return;
      pending.delete(el);
      gsap.killTweensOf(el);
      gsap.set(el, { opacity: 1, y: 0 });
    });
  });

  // les captures se dévoilent de bas en haut, l'image se pose
  $$('.project__media').forEach((media) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: media, start: 'top 85%', once: true } });
    tl.from(media, { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.2, ease: 'expo.inOut' });
    const shot = $('.project__shot', media) || $('.schema', media);
    if (shot) tl.from(shot, { scale: 1.08, duration: 1.4, ease: 'expo.out' }, '<0.2');
    const phone = $('.project__phone', media);
    if (phone) {
      tl.from(phone, { yPercent: 18, opacity: 0, duration: 1, ease: 'expo.out' }, '<0.35');
      // léger parallaxe du téléphone pendant le défilement
      gsap.to(phone, { yPercent: -10, ease: 'none', scrollTrigger: { trigger: media, start: 'top bottom', end: 'bottom top', scrub: true } });
    }
  });

  // la phrase d'À propos s'éclaire mot après mot
  const statement = $('#statement');
  if (statement) {
    const words = splitText(statement, 'words');
    // entièrement éclairée dès que son haut atteint 45 % de la fenêtre, là où l'on commence à la lire
    gsap.fromTo(words, { opacity: 0.3 }, { opacity: 1, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: statement, start: 'top 85%', end: 'top 45%', scrub: true } });
  }

  // les rouleaux d'un même nombre partent l'un après l'autre
  const byNumber = new Map();
  reels.forEach((r) => {
    if (!byNumber.has(r.el)) byNumber.set(r.el, []);
    byNumber.get(r.el).push(r);
  });
  byNumber.forEach((list, el) => {
    list.forEach((r) => {
      r.strip.style.transform = '';
      gsap.set(r.strip, { yPercent: -(10 + r.digit) * 5 });
    });
    ScrollTrigger.create({
      trigger: el,
      start: 'top 92%',
      once: true,
      onEnter: () =>
        list.forEach((r, i) => gsap.fromTo(r.strip, { yPercent: 0 }, { yPercent: -(10 + r.digit) * 5, duration: 1.5, ease: 'expo.out', delay: 0.1 + i * 0.12 })),
    });
  });
}
