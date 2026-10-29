// Méthode : graphe « git log » tracé en SVG, avec une branche feature, qui se dessine au défilement.
import { gsap, ScrollTrigger } from '../core/gsap.js';
import { $, $$, reduce } from '../core/env.js';

/** Recalcule les tracés à partir de la position réelle des pastilles (à refaire au redimensionnement). */
export function buildGitGraph() {
  const wrap = $('#gitlog');
  if (!wrap) return;
  const svg = $('#gitSvg');
  const dots = $$('.commit__dot', wrap);
  if (dots.length < 5) return;
  const box = wrap.getBoundingClientRect();
  const pts = dots.map((d) => {
    const r = d.getBoundingClientRect();
    return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top };
  });
  svg.setAttribute('viewBox', `0 0 ${Math.round(box.width)} ${Math.round(box.height)}`);
  const x0 = pts[0].x;
  const [, a, b, c] = pts;
  const main = `M ${x0} ${Math.max(0, pts[0].y - 40)} L ${x0} ${pts[4].y}`;
  const branch = `M ${x0} ${a.y} C ${x0} ${a.y + 50}, ${b.x} ${b.y - 70}, ${b.x} ${b.y} C ${b.x} ${b.y + 70}, ${x0} ${c.y - 50}, ${x0} ${c.y}`;
  $('#gitBaseMain').setAttribute('d', main);
  $('#gitProgMain').setAttribute('d', main);
  $('#gitBaseBranch').setAttribute('d', branch);
  $('#gitProgBranch').setAttribute('d', branch);
}

export function initMethod() {
  const wrap = $('#gitlog');
  if (!wrap) return;
  buildGitGraph();
  const commits = $$('.commit', wrap);
  if (reduce) {
    commits.forEach((c) => c.classList.add('is-lit'));
    return;
  }
  const progMain = $('#gitProgMain');
  const progBranch = $('#gitProgBranch');
  gsap.set([progMain, progBranch], { strokeDasharray: 1, strokeDashoffset: 1 });
  gsap.to(progMain, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: wrap, start: 'top 72%', end: 'bottom 72%', scrub: true } });
  gsap.to(progBranch, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: commits[1], start: 'top 72%', endTrigger: commits[3], end: 'top 72%', scrub: true } });
  commits.forEach((c) =>
    ScrollTrigger.create({
      trigger: c,
      start: 'top 72%',
      onEnter: () => c.classList.add('is-lit'),
      onLeaveBack: () => c.classList.remove('is-lit'),
    }),
  );
}
