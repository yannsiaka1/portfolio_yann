// Les 7 symboles du hero, décrits comme des listes de panneaux (position, rotation, taille).
// Les mêmes panneaux passent d'un symbole à l'autre : POOL = taille du plus grand symbole.
//
// Ajouter un symbole : écrire une fonction qui renvoie une liste d'éléments (avec bar, splitBar,
// cube ou slab), puis l'ajouter dans FORMS. Unité : le symbole tient dans un carré d'environ 3,5 × 2,4.
// Option g (0, 1, 2) : groupe du panneau, pour décaler la respiration des bras.
// Option glow (0 → 1) : intensité de la lueur ambrée. Option blink : clignote comme un curseur.
import * as THREE from 'three';

export const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const X_AXIS = V(1, 0, 0);
const element = (p, q, s, o = {}) => ({ p, q, s, glow: o.glow || 0, g: o.g || 0, blink: !!o.blink });

/** Barre de a à b, d'épaisseur t et de profondeur d. */
function bar(a, b, t, d, o = {}) {
  const dir = b.clone().sub(a);
  const len = dir.length();
  dir.normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(X_AXIS, dir);
  const ext = o.ext ?? t * 0.85;
  return element(a.clone().add(b).multiplyScalar(0.5), q, V(len + ext, t, d), o);
}

/** Barre coupée en k segments légèrement décalés en profondeur. */
function splitBar(a, b, t, d, k, o = {}) {
  const out = [];
  const gap = 0.06;
  const ext = (o.ext ?? t * 0.85) * 0.5;
  const dir = b.clone().sub(a).normalize();
  for (let j = 0; j < k; j++) {
    const A = a.clone().lerp(b, j / k);
    const B = a.clone().lerp(b, (j + 1) / k);
    if (j > 0) A.addScaledVector(dir, gap / 2);
    else A.addScaledVector(dir, -ext);
    if (j < k - 1) B.addScaledVector(dir, -gap / 2);
    else B.addScaledVector(dir, ext);
    const z = (j % 2 ? 1 : -1) * 0.04;
    A.z += z;
    B.z += z;
    out.push(bar(A, B, t, d, { ...o, ext: 0 }));
  }
  return out;
}

const cube = (p, size, rot = [0, 0, 0], o = {}) => element(p, new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), V(size, size, size), o);
const slab = (p, sx, sy, sz, o = {}) => element(p, new THREE.Quaternion(), V(sx, sy, sz), o);

/** </> */
function code() {
  const t = 0.27;
  const d = 0.34;
  return [
    ...splitBar(V(-0.78, 0.84), V(-1.62, 0), t, d, 2, { g: 0 }),
    ...splitBar(V(-1.62, 0), V(-0.78, -0.84), t, d, 2, { g: 0 }),
    ...splitBar(V(0.4, 1.08), V(-0.4, -1.08), t, d, 3, { g: 1 }),
    ...splitBar(V(0.78, 0.84), V(1.62, 0), t, d, 2, { g: 2 }),
    ...splitBar(V(1.62, 0), V(0.78, -0.84), t, d, 2, { g: 2 }),
  ];
}

/** { • • • } */
function braces() {
  const t = 0.22;
  const d = 0.3;
  const out = [];
  const L = [V(-0.6, 1.1), V(-0.92, 1.1), V(-0.92, 0.3), V(-1.24, 0), V(-0.92, -0.3), V(-0.92, -1.1), V(-0.6, -1.1)];
  for (let i = 0; i < L.length - 1; i++) out.push(bar(L[i], L[i + 1], t, d, { g: 0 }));
  const R = L.map((p) => V(-p.x, p.y));
  for (let i = 0; i < R.length - 1; i++) out.push(bar(R[i], R[i + 1], t, d, { g: 2 }));
  [-0.36, 0, 0.36].forEach((x, i) => out.push(cube(V(x, -0.02, 0.05), 0.2, [0.5, 0.6, 0], { g: 1, glow: i === 1 ? 0.8 : 0 })));
  return out;
}

/** Fenêtre de terminal avec >_ et curseur clignotant. */
function terminal() {
  const w = 1.62;
  const h = 1.12;
  const ft = 0.1;
  const fd = 0.22;
  const out = [];
  out.push(bar(V(-w, h), V(w, h), ft, fd, { g: 0, ext: ft }));
  out.push(bar(V(-w, -h), V(w, -h), ft, fd, { g: 0, ext: ft }));
  out.push(bar(V(-w, h), V(-w, -h), ft, fd, { g: 0, ext: ft }));
  out.push(bar(V(w, h), V(w, -h), ft, fd, { g: 0, ext: ft }));
  out.push(bar(V(-w, 0.64), V(w, 0.64), 0.05, 0.12, { g: 0, ext: 0 }));
  [-1.34, -1.1, -0.86].forEach((x) => out.push(cube(V(x, 0.88, 0.02), 0.13, [0, 0, 0], { g: 0 })));
  out.push(bar(V(-1.08, 0.3), V(-0.5, -0.1), 0.25, 0.34, { g: 1 }));
  out.push(bar(V(-0.5, -0.1), V(-1.08, -0.5), 0.25, 0.34, { g: 1 }));
  out.push(bar(V(-0.26, -0.52), V(0.86, -0.52), 0.23, 0.34, { g: 2, glow: 1, blink: true }));
  return out;
}

/** Nœud API central et six branches terminées par un module. */
function api() {
  const out = [cube(V(0, 0, 0), 0.72, [0.62, 0.79, 0], { g: 1, glow: 0.6 })];
  const rot = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.35, 0.5, 0.15));
  const ends = [1.38, 1.25, 1.3, 1.42, 1.2, 1.32];
  [V(1, 0.18, 0.12), V(-1, 0.22, -0.12), V(0.12, 1, 0.2), V(-0.18, -1, 0.12), V(0.25, 0.1, 1), V(-0.2, -0.12, -1)].forEach((dv, i) => {
    dv.normalize().applyQuaternion(rot);
    out.push(bar(dv.clone().multiplyScalar(0.5), dv.clone().multiplyScalar(ends[i]), 0.085, 0.085, { g: i % 3, ext: 0 }));
    out.push(cube(dv.clone().multiplyScalar(ends[i] + 0.2), 0.3, [i * 0.7, i * 1.1, 0.3], { g: i % 3, glow: i === 0 ? 0.4 : 0 }));
  });
  return out;
}

/** Réseau de services : un hub et six nœuds reliés. */
function network() {
  const out = [];
  const nodes = [V(0, 0.02, 0.4), V(-1.38, 0.52, -0.1), V(-0.46, 1.16, 0.32), V(0.86, 0.94, -0.28), V(1.46, -0.22, 0.26), V(0.56, -1.06, -0.22), V(-0.82, -0.96, 0.3)];
  const sizes = [0.36, 0.26, 0.24, 0.28, 0.25, 0.27, 0.24];
  nodes.forEach((p, i) => out.push(cube(p, sizes[i], [i * 0.6, i * 0.9, i * 0.3], { g: i % 3, glow: i === 0 ? 0.65 : 0 })));
  [[1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 1], [0, 2], [0, 4], [0, 6], [0, 3]].forEach(([a, b], k) => {
    const dir = nodes[b].clone().sub(nodes[a]).normalize();
    const A = nodes[a].clone().addScaledVector(dir, sizes[a] * 0.5);
    const B = nodes[b].clone().addScaledVector(dir, -sizes[b] * 0.5);
    out.push(bar(A, B, 0.055, 0.055, { g: k % 3, ext: 0 }));
  });
  return out;
}

/** Module : arêtes d'un cube et noyau lumineux. */
function moduleCube() {
  const out = [];
  const h = 0.95;
  const t = 0.14;
  const s = [-h, h];
  s.forEach((y) => s.forEach((z) => out.push(bar(V(-h, y, z), V(h, y, z), t, t, { g: 0, ext: t }))));
  s.forEach((x) => s.forEach((z) => out.push(bar(V(x, -h, z), V(x, h, z), t, t, { g: 1, ext: t }))));
  s.forEach((x) => s.forEach((y) => out.push(bar(V(x, y, -h), V(x, y, h), t, t, { g: 2, ext: t }))));
  out.push(cube(V(0, 0, 0), 0.82, [0.6, 0.8, 0.2], { g: 1, glow: 0.8 }));
  return out;
}

/** Pile interface → API → base de données. */
function stack() {
  const out = [];
  const ys = [0.78, 0, -0.78];
  const glows = [0, 0.15, 0.7];
  ys.forEach((y, li) => {
    out.push(slab(V(-0.6, y, 0), 1.14, 0.16, 2.3, { g: li, glow: glows[li] }));
    out.push(slab(V(0.6, y, 0), 1.14, 0.16, 2.3, { g: li, glow: glows[li] }));
  });
  [[0.78, 0], [0, -0.78]].forEach(([y0, y1], k) => {
    out.push(bar(V(-0.78, y0 - 0.08, 0.78), V(-0.78, y1 + 0.08, 0.78), 0.05, 0.05, { g: k, ext: 0 }));
    out.push(bar(V(0.78, y0 - 0.08, -0.78), V(0.78, y1 + 0.08, -0.78), 0.05, 0.05, { g: k + 1, ext: 0 }));
  });
  return out;
}

/** sym et name s'affichent dans la barre du hero (« fig. 01/07 </> interfaces »). */
export const FORMS = [
  { sym: '</>', name: 'interfaces', els: code(), rot: [0, 0, 0], spin: false },
  { sym: '{ }', name: 'logique métier', els: braces(), rot: [0, 0, 0], spin: false },
  { sym: '>_', name: 'outillage', els: terminal(), rot: [0, 0, 0], spin: false },
  { sym: 'GET /', name: 'API REST', els: api(), rot: [0, 0, 0], spin: true },
  { sym: '⇄', name: 'intégrations', els: network(), rot: [0, 0, 0], spin: true },
  { sym: '[■]', name: 'modules', els: moduleCube(), rot: [0.5, 0.72, 0], spin: true },
  { sym: '≡', name: 'full-stack', els: stack(), rot: [0.6, 0.785, 0], spin: true },
];

// rotation de présentation propre à chaque symbole
FORMS.forEach((f) => {
  const qb = new THREE.Quaternion().setFromEuler(new THREE.Euler(...f.rot));
  f.els.forEach((e) => {
    e.p.applyQuaternion(qb);
    e.q.premultiply(qb);
  });
});

export const POOL = Math.max(...FORMS.map((f) => f.els.length));

/** Pistes de circuit derrière le symbole, en coordonnées du symbole (z = profondeur). */
export const ZTR = -0.9;
export const TRACE_DEFS = [
  [V(-0.95, 0.12, ZTR), V(-2.15, 0.12, ZTR), V(-2.65, -0.38, ZTR), V(-17, -0.38, ZTR)],
  [V(0.95, 0.42, ZTR), V(2.05, 0.42, ZTR), V(2.55, 0.92, ZTR), V(17, 0.92, ZTR)],
  [V(0.18, -0.95, ZTR), V(0.18, -1.95, ZTR), V(-0.32, -2.45, ZTR), V(-0.32, -15, ZTR)],
];
