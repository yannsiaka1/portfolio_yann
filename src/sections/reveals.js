// Révélations au défilement : titres masqués mot par mot, blocs qui montent,
// paragraphe « À propos » qui s'éclaire au fil du scroll, compteurs à rouleaux des repères.
import { gsap, ScrollTrigger } from '../core/gsap.js';
import { $, $$, reduce } from '../core/env.js';
import { splitText } from '../core/text.js';

/** Remplace chaque chiffre de [data-odo] par un rouleau de 20 chiffres (0-9 deux fois). */
function buildOdometers() {
  const reels = [];
  $$('[data-odo]').forEach((el) => {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.textContent = '';
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
      // position finale visible sans JS d'animation (mouvement réduit)
      strip.style.transform = `translateY(${-(10 + digit) * 5}%)`;
      reel.appendChild(strip);
      el.appendChild(reel);
      reels.push({ el, strip, digit });
    });
  });
  return reels;
}

export function initReveals() {
  const statement = $('#statement');
  const words = statement ? splitText(statement, 'words') : [];
  const reels = buildOdometers();
  if (reduce) return;

  $$('[data-reveal="words"]').forEach((el) => {
    el.classList.add('reveal-mask');
    const inners = splitText(el, 'mask');
    gsap.from(inners, { yPercent: 115, duration: 1.15, ease: 'expo.out', stagger: 0.05, scrollTrigger: { trigger: el, start: 'top 86%', once: true } });
  });

  $$('[data-reveal="up"]').forEach((el) => {
    gsap.from(el, { y: 44, autoAlpha: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });

  if (words.length) {
    gsap.fromTo(words, { opacity: 0.16 }, { opacity: 1, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: statement, start: 'top 82%', end: 'bottom 50%', scrub: true } });
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
        list.forEach((r, i) =>
          gsap.fromTo(r.strip, { yPercent: 0 }, { yPercent: -(10 + r.digit) * 5, duration: 1.5, ease: 'expo.out', delay: 0.1 + i * 0.12 }),
        ),
    });
  });
}
