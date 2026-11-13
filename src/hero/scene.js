// Scène 3D du hero : des symboles de code en panneaux de verre.
// - les mêmes panneaux se recomposent en 7 symboles (formations.js), environ toutes les 7 s
// - le symbole s'incline vers le pointeur ; sur ordinateur, le panneau survolé s'illumine
// - clic court, toucher, Entrée ou Espace : symbole suivant ; appui maintenu : la page tremble, le symbole
//   éclate (« casser la prod »), puis se reconstruit au relâchement (« rollback »)
// - pistes de circuit : les survoler (ou les toucher) lance des étincelles et des paquets vers le symbole
// - au défilement, les panneaux s'écartent pendant que la section suivante recouvre le hero
// - le bouton pause (src/ui/pause.js) et le réglage « réduire les animations » figent tout ce qui bouge seul
//
// L'écartement passe par une seule valeur, explodeAmt = max(défilement, survol, éclatement, intro) :
// relâcher à n'importe quel moment inverse donc l'effet.
// La boîte .hero__stage (CSS) décide où se pose le symbole ; le canvas couvre tout le hero.
// Les couleurs et l'espacement viennent des jetons de src/styles/tokens.css.
import * as THREE from 'three';
import { coarse, motionQuery, reduced, clamp, token, tokenPx, LIGHT_SCENE } from '../core/env.js';
import { GL_ATTRS, isSoftwareGl } from '../core/gpu.js';
import { state, signalGlReady, EVT_INTRO, EVT_PAUSE } from '../core/state.js';
import { scramble } from '../core/text.js';
import { FORMS, POOL, TRACE_DEFS, ZTR, V } from './formations.js';
import { TAU, easeInOutCubic, easeOutCubic, roundedBox, resample, dotTexture } from './helpers.js';
import { t } from '../core/i18n.js';

const CHARGE = 0.55; // durée de la charge avant l'éclatement (s)
const CYCLE = 7; // temps passé sur chaque symbole (s)
const MORPH = 1.35; // durée d'une transition entre symboles (s)
// part de la largeur de la scène occupée par le symbole, et de la hauteur restante une fois la légende placée : les
// mêmes jetons placent l'affiche du symbole (tokens.css, hero.css), qui tient sa place tant qu'elle n'est pas prête
const FIT_W = parseFloat(token('--symbol-fit-w')) / 100;
const FIT_H = parseFloat(token('--symbol-fit-h'));
const SYM_W = 3.5; // le symbole tient dans un rectangle d'environ 3,5 × 2,4 unités (formations.js)
const SYM_H = 2.4;

const HINTS = t({
  fr: {
    idle: 'Cliquez sur le symbole pour le changer, maintenez pour <b>casser la prod</b>.',
    idleTouch: 'Touchez le symbole pour le changer, appui long pour <b>casser la prod</b>.',
    still: 'Cliquez sur le symbole pour passer au suivant.',
    stillTouch: 'Touchez le symbole pour passer au suivant.',
    charge: '<code>deploy --force</code> en cours…',
    blast: 'Tout est cassé. Relâchez pour un <b>rollback</b>.',
    rollback: '<b>Rollback</b> effectué, tout est rentré dans l’ordre.',
    touchTrace: 'Touchez une piste',
  },
  en: {
    idle: 'Click the symbol to change it, hold to <b>break prod</b>.',
    idleTouch: 'Tap the symbol to change it, long-press to <b>break prod</b>.',
    still: 'Click the symbol to see the next one.',
    stillTouch: 'Tap the symbol to see the next one.',
    charge: '<code>deploy --force</code> running…',
    blast: 'Everything is broken. Release to <b>roll back</b>.',
    rollback: '<b>Rollback</b> done, everything is back in order.',
    touchTrace: 'Tap a trace',
  },
});
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function initHero() {
  try {
    start();
  } catch (err) {
    console.error(err);
    signalGlReady(false);
  }
}

function start() {
  const canvas = document.getElementById('gl');
  const hero = document.getElementById('accueil');
  const stage = document.getElementById('heroStage');
  const symbolBtn = document.getElementById('heroSymbol');
  const controls = document.getElementById('heroControls');
  const hint = document.getElementById('heroHint');
  const hintText = hint ? hint.querySelector('.hero__hint-text') : null;
  const tag = document.getElementById('traceTag');
  const figN = document.getElementById('figN');
  const figSym = document.getElementById('figSym');
  const figName = document.getElementById('figName');
  const figBar = document.getElementById('figBar');
  const vibEls = Array.from(document.querySelectorAll('[data-vibrate]'));
  if (!canvas || !hero || !stage) return signalGlReady(false);
  if (tag && coarse) tag.textContent = HINTS.touchTrace;

  // three.js exige WebGL 2 : on vérifie avant de créer le renderer, pour un repli sans erreur. Le contexte est celui
  // que le test de src/main.js (hasGpu) a déjà obtenu, retrouvé avec les mêmes réglages. Sans accélération matérielle
  // (rendu par le processeur : machine virtuelle, carte graphique désactivée), il est refusé, ou reconnu au nom du
  // moteur (src/core/gpu.js) : chaque image coûterait plus que la page entière, l'affiche du symbole reste
  let context = null;
  try {
    context = canvas.getContext('webgl2', GL_ATTRS);
  } catch (err) {
    context = null;
  }
  if (!context || isSoftwareGl(context)) return signalGlReady(false);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, context, ...GL_ATTRS });
  } catch (err) {
    return signalGlReady(false);
  }
  // les écouteurs de la scène partagent ce signal : giveUp() les retire tous d'un coup
  const teardown = new AbortController();
  const { signal } = teardown;

  // pas de valeur de repli : un jeton renommé doit se voir, pas retomber sur une ancienne couleur
  const BG = new THREE.Color(token('--bg'));
  const ACCENT = new THREE.Color(token('--accent'));

  // verre réfractif sur ordinateur, métal poli (plus léger) au toucher et sur petit écran : même règle que l'affiche
  const hq = !window.matchMedia(LIGHT_SCENE).matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(BG, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 11);

  // environnement de studio pour les reflets, généré sur place (aucun fichier HDR)
  (() => {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = new THREE.Scene();
    env.background = new THREE.Color(0x030303);
    const softbox = (w, h, color, k, pos) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide }));
      m.position.set(...pos);
      m.lookAt(0, 0, 0);
      env.add(m);
    };
    softbox(10, 2.2, 0xffffff, 3.2, [0, 7, 3]);
    softbox(2.2, 9, 0xffe2b0, 2.4, [-8, 0.5, 2]);
    softbox(2.2, 9, 0xb8cfff, 1.8, [8, -0.5, -1]);
    softbox(9, 1.4, ACCENT, 2.6, [0, -6, 5]);
    softbox(4, 4, 0xffffff, 1.1, [0, 1, 9]);
    scene.environment = pmrem.fromScene(env, 0.035).texture;
    pmrem.dispose();
  })();

  const key = new THREE.DirectionalLight(0xffffff, 1.3);
  key.position.set(3, 5, 6);
  scene.add(key);
  const warm = new THREE.PointLight(ACCENT, 16, 16, 2);
  warm.position.set(-2.6, -2.4, 3.2);
  scene.add(warm);

  const base = hq
    ? new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 0.1,
        transmission: 1,
        thickness: 1.1,
        ior: 1.48,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        iridescence: 0.55,
        iridescenceIOR: 1.32,
        iridescenceThicknessRange: [140, 520],
        envMapIntensity: 1.5,
        attenuationColor: new THREE.Color(0xffd7a0),
        attenuationDistance: 3.2,
        emissive: ACCENT.clone(),
        emissiveIntensity: 0,
      })
    : new THREE.MeshPhysicalMaterial({
        color: 0x1b1b1b,
        metalness: 0.55,
        roughness: 0.16,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
        iridescence: 0.5,
        iridescenceIOR: 1.3,
        iridescenceThicknessRange: [140, 520],
        envMapIntensity: 1.8,
        emissive: ACCENT.clone(),
        emissiveIntensity: 0,
      });
  const ENV_BASE = base.envMapIntensity;

  /* ---------- panneaux ---------- */
  const geo = roundedBox(0.14, 3);
  const group = new THREE.Group();
  scene.add(group);
  const panels = [];
  for (let i = 0; i < POOL; i++) {
    const mat = base.clone();
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    group.add(mesh);
    const P = {
      mesh,
      mat,
      active: false,
      g: 0,
      blink: false,
      flash: 0,
      phase: Math.random() * TAU,
      from: { p: V(0, 0, 0), q: new THREE.Quaternion(), s: V(0.001, 0.001, 0.001), glow: 0 },
      to: { p: V(0, 0, 0), q: new THREE.Quaternion(), s: V(0.001, 0.001, 0.001), glow: 0 },
      cur: { p: V(0, 0, 0), q: new THREE.Quaternion(), s: V(0.001, 0.001, 0.001), glow: 0 },
      delay: 0,
      bulge: V(0, 0, 0),
      mAxis: V(1, 0, 0),
      dir: V(0, 0, 1),
      spinAxis: V(1, 0, 0),
      spinSpeed: 1,
      xDelay: 0,
    };
    mesh.userData.P = P;
    panels.push(P);
  }

  /* ---------- pistes, éclairs, paquets ---------- */
  const traceGroup = new THREE.Group();
  scene.add(traceGroup);
  const DIM = ACCENT.clone().multiplyScalar(0.36);
  const HOT = ACCENT.clone().lerp(new THREE.Color(0xffffff), 0.2);
  const traces = TRACE_DEFS.map((pts) => {
    const dense = resample(pts, 0.04);
    const g = new THREE.BufferGeometry().setFromPoints(dense);
    g.setDrawRange(0, 0);
    const m = new THREE.LineBasicMaterial({ color: DIM.clone() });
    const line = new THREE.Line(g, m);
    line.frustumCulled = false;
    traceGroup.add(line);
    return { pts, dense, geo: g, mat: m, count: dense.length, heat: 0 };
  });

  const BOLT_PTS = 26;
  const bolts = [];
  for (let i = 0; i < 14; i++) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(BOLT_PTS * 3), 3));
    const m = new THREE.LineBasicMaterial({ color: i % 2 ? ACCENT : 0xfff3dc, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const line = new THREE.Line(g, m);
    line.frustumCulled = false;
    line.visible = false;
    line.renderOrder = 5;
    traceGroup.add(line);
    bolts.push({ line, geo: g, mat: m, life: 0, max: 1 });
  }
  const PK = 24;
  const pkGeo = new THREE.BufferGeometry();
  pkGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(PK * 3).fill(-999), 3));
  const pkMat = new THREE.PointsMaterial({ size: 0.15, map: dotTexture(ACCENT), color: ACCENT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
  const pkPoints = new THREE.Points(pkGeo, pkMat);
  pkPoints.frustumCulled = false;
  pkPoints.renderOrder = 6;
  traceGroup.add(pkPoints);
  const packets = Array.from({ length: PK }, () => ({ alive: false, tr: 0, s: 0, speed: 0 }));

  /* ---------- état ---------- */
  const st = {
    time: 0, cw: 1, ch: 1, heroH: 1, scale: 1, rect: canvas.getBoundingClientRect(),
    form: 0, morphing: false, morphStart: 0, cycleT: 0,
    rotY: 0, mouse: new THREE.Vector2(), ndc: new THREE.Vector2(), px: -9999, py: -9999, hasPointer: false, overUI: false,
    onSymbol: false, overSym: false, hoverAmt: 0, hovered: null, activeMeshes: [],
    holding: false, holdTime: 0, blasted: false, suppressClick: false, charge: 0, shake: 0, clickBurst: 0, kick: 0, downX: 0, downY: 0,
    introStart: -1, introAmt: 1, traceProg: 0, scrollP: 0, explodeAmt: 1,
    hoverTrace: -1, sparkLocal: null, burstLeft: 0, weldCd: 0, hint: '', hintAt: 0, vibOn: false, tagOn: false,
    dirty: true, settling: false, flashing: false, active: false,
  };

  /** Rien ne bouge seul : réglage « réduire les animations » ou bouton pause. */
  // reduced() et non motionQuery.matches : lire la requête à chaque image fait perdre son événement 'change'
  const still = () => reduced() || state.paused;

  function setHint(name) {
    if (!hint) return;
    const key = name === 'idle' ? `${still() ? 'still' : 'idle'}${coarse ? 'Touch' : ''}` : name;
    if (st.hint === key) return;
    st.hint = key;
    st.hintAt = st.time;
    hint.dataset.state = name;
    if (hintText) hintText.innerHTML = HINTS[key];
  }

  function updateFig(i) {
    const f = FORMS[i];
    if (figN) figN.textContent = `${String(i + 1).padStart(2, '0')} / ${String(FORMS.length).padStart(2, '0')}`;
    if (figSym) figSym.textContent = f.sym;
    if (figName) scramble(figName, capitalize(f.name), 0.5);
  }

  /* ---------- formations ---------- */
  function setFormation(idx, instant = false) {
    st.form = idx;
    const f = FORMS[idx];
    panels.forEach((P, i) => {
      P.from.p.copy(P.cur.p);
      P.from.q.copy(P.cur.q);
      P.from.s.copy(P.cur.s);
      P.from.glow = P.cur.glow;
      const e = f.els[i];
      if (e) {
        P.to.p.copy(e.p);
        P.to.q.copy(e.q);
        P.to.s.copy(e.s);
        P.to.glow = e.glow;
        P.g = e.g;
        P.blink = e.blink;
        P.active = true;
      } else {
        // panneau inutile dans ce symbole : il rétrécit vers le centre
        P.to.p.copy(P.cur.p).multiplyScalar(0.15);
        P.to.q.identity();
        P.to.s.set(0.001, 0.001, 0.001);
        P.to.glow = 0;
        P.blink = false;
        P.active = false;
      }
      // trajectoire de transition : départ décalé, courbe vers l'extérieur, petite rotation
      P.delay = Math.random() * 0.28;
      P.bulge.copy(P.to.p).add(P.cur.p).normalize().multiplyScalar(0.6 + Math.random() * 0.7);
      P.bulge.z += (Math.random() - 0.3) * 1.2;
      P.mAxis.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      // direction d'écartement propre à chaque panneau
      const dir = P.to.p.clone();
      if (dir.lengthSq() < 1e-4) dir.set(Math.random() - 0.5, Math.random() - 0.5, 0);
      dir.normalize();
      dir.x += (Math.random() - 0.5) * 0.8;
      dir.y += (Math.random() - 0.5) * 0.8;
      dir.z = -0.2 + Math.random() * 1.1;
      P.dir.copy(dir.normalize().multiplyScalar(0.7 + Math.random() * 0.6));
      P.spinAxis.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      P.spinSpeed = 0.6 + Math.random() * 1.4;
      P.xDelay = Math.random() * 0.16;
      if (instant) {
        P.cur.p.copy(P.to.p);
        P.cur.q.copy(P.to.q);
        P.cur.s.copy(P.to.s);
        P.cur.glow = P.to.glow;
      }
    });
    st.activeMeshes = panels.filter((P) => P.active).map((P) => P.mesh);
    st.morphing = !instant;
    st.morphStart = st.time;
    st.cycleT = 0;
    st.dirty = true;
    updateFig(idx);
  }
  const nextForm = () => setFormation((st.form + 1) % FORMS.length);

  /* ---------- mise en page : le symbole se centre dans .hero__stage, la légende juste dessous ---------- */
  function layout() {
    st.cw = canvas.clientWidth || 1;
    st.ch = canvas.clientHeight || 1;
    renderer.setSize(st.cw, st.ch, false);
    camera.aspect = st.cw / st.ch;
    camera.updateProjectionMatrix();

    const cr = canvas.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    const upp = (2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / st.ch; // unités 3D par pixel
    const ctrlH = controls && controls.offsetParent ? controls.offsetHeight : 0;
    const minGap = ctrlH ? tokenPx('--space-5') : 0;
    st.scale = Math.min((sr.width * FIT_W * upp) / SYM_W, (Math.max(40, sr.height - ctrlH - minGap) * FIT_H * upp) / SYM_H);
    const symW = (SYM_W * st.scale) / upp; // taille du symbole à l'écran (px)
    const symH = (SYM_H * st.scale) / upp;
    // le symbole s'incline et s'écarte au survol : la légende garde une marge proportionnelle
    const gap = ctrlH ? Math.max(minGap, symH * 0.14) : 0;
    const top = Math.max(0, (sr.height - symH - gap - ctrlH) / 2);
    const left = (sr.width - symW) / 2;
    if (controls) {
      controls.style.top = `${Math.round(top + symH + gap)}px`;
      controls.style.bottom = 'auto';
    }
    if (symbolBtn) {
      symbolBtn.style.left = `${Math.round(left)}px`;
      symbolBtn.style.top = `${Math.round(top)}px`;
      symbolBtn.style.width = `${Math.round(symW)}px`;
      symbolBtn.style.height = `${Math.round(symH)}px`;
    }
    const cx = sr.left + sr.width / 2 - cr.left;
    const cy = sr.top + top + symH / 2 - cr.top;
    group.position.set((cx - st.cw / 2) * upp, -(cy - st.ch / 2) * upp, 0);
    group.scale.setScalar(st.scale);
    traceGroup.position.copy(group.position);
    traceGroup.scale.setScalar(st.scale);
    st.heroH = hero.offsetHeight || st.ch;
    st.rect = cr;
    st.dirty = true;
  }

  /* ---------- pistes : détection (en pixels du canvas), éclairs, paquets ---------- */
  const _v = new THREE.Vector3();
  const _a = { x: 0, y: 0 };
  const _b = { x: 0, y: 0 };
  function toCanvas(local, out) {
    _v.copy(local);
    traceGroup.localToWorld(_v);
    _v.project(camera);
    out.x = (_v.x * 0.5 + 0.5) * st.cw;
    out.y = (-_v.y * 0.5 + 0.5) * st.ch;
    return out;
  }
  function hitTrace(mx, my) {
    const threshold = coarse ? 26 : 14;
    for (let i = 0; i < traces.length; i++) {
      const pts = traces[i].pts;
      for (let s = 0; s < pts.length - 1; s++) {
        const a = toCanvas(pts[s], _a);
        const b = toCanvas(pts[s + 1], _b);
        const abx = b.x - a.x;
        const aby = b.y - a.y;
        const len2 = abx * abx + aby * aby || 1;
        const u = clamp(((mx - a.x) * abx + (my - a.y) * aby) / len2, 0, 1);
        if (Math.hypot(mx - (a.x + abx * u), my - (a.y + aby * u)) < threshold) return { idx: i, local: pts[s].clone().lerp(pts[s + 1], u) };
      }
    }
    return null;
  }
  function nearestOn(i, p) {
    const pts = traces[i].pts;
    let best = null;
    let bestD = Infinity;
    for (let s = 0; s < pts.length - 1; s++) {
      const a = pts[s];
      const ab = pts[s + 1].clone().sub(a);
      const u = clamp(p.clone().sub(a).dot(ab) / (ab.lengthSq() || 1), 0, 1);
      const q = a.clone().addScaledVector(ab, u);
      const d = q.distanceToSquared(p);
      if (d < bestD) {
        bestD = d;
        best = q;
      }
    }
    return best;
  }
  function fireBolt(a, b) {
    const bolt = bolts.find((x) => x.life <= 0) || bolts[(Math.random() * bolts.length) | 0];
    const arr = bolt.geo.attributes.position.array;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const lift = (Math.random() > 0.5 ? 1 : -1) * len * (0.12 + Math.random() * 0.14);
    for (let i = 0; i < BOLT_PTS; i++) {
      const t = i / (BOLT_PTS - 1);
      const env = Math.sin(Math.PI * t);
      const off = (Math.random() - 0.5) * len * 0.2 * env + env * lift;
      arr[i * 3] = a.x + dx * t + nx * off;
      arr[i * 3 + 1] = a.y + dy * t + ny * off;
      arr[i * 3 + 2] = ZTR + 0.06;
    }
    bolt.geo.attributes.position.needsUpdate = true;
    bolt.life = bolt.max = 0.14 + Math.random() * 0.14;
    bolt.line.visible = true;
  }
  function spawnPackets(i, local, n) {
    const tr = traces[i];
    let best = 0;
    let bestD = Infinity;
    tr.dense.forEach((d, k) => {
      const dd = d.distanceToSquared(local);
      if (dd < bestD) {
        bestD = dd;
        best = k;
      }
    });
    for (let j = 0; j < n; j++) {
      const pk = packets.find((x) => !x.alive);
      if (!pk) break;
      pk.alive = true;
      pk.tr = i;
      pk.s = best + j * 7;
      pk.speed = 95 + Math.random() * 45;
    }
  }
  function sparkAt(hit) {
    const tr = traces[hit.idx];
    tr.heat = Math.max(tr.heat, 1);
    if (st.hoverTrace !== hit.idx) {
      // nouvelle piste touchée : une rafale de 5 à 6 éclairs et trois paquets vers le symbole
      st.hoverTrace = hit.idx;
      st.sparkLocal = hit.local;
      st.burstLeft = 5 + ((Math.random() * 2) | 0);
      spawnPackets(hit.idx, hit.local, 3);
    }
    if (st.burstLeft > 0 && st.weldCd <= 0) {
      const others = [0, 1, 2]
        .filter((k) => k !== hit.idx)
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.random() > 0.5 ? 1 : 2);
      others.forEach((k) => fireBolt(hit.local, nearestOn(k, hit.local)));
      st.burstLeft--;
      st.weldCd = 0.04 + Math.random() * 0.06;
    }
  }

  /* ---------- interactions ---------- */
  function setPointer(e) {
    st.px = e.clientX - st.rect.left;
    st.py = e.clientY - st.rect.top;
    st.ndc.set((st.px / st.cw) * 2 - 1, -(st.py / st.ch) * 2 + 1);
    st.hasPointer = true;
    st.overUI = !!(e.target && e.target.closest && e.target.closest('a, button:not(.hero__symbol), input, textarea, label'));
  }
  window.addEventListener(
    'pointermove',
    (e) => {
      setPointer(e);
      // au doigt, glisser annule l'appui long : la page doit pouvoir défiler
      if (st.holding && e.pointerType !== 'mouse' && Math.hypot(e.clientX - st.downX, e.clientY - st.downY) > 14) release(null, true);
    },
    { passive: true, signal },
  );
  document.addEventListener(
    'pointerleave',
    () => {
      st.hasPointer = false;
    },
    { signal },
  );
  // au doigt, toucher une piste n'importe où dans le hero lance les étincelles
  hero.addEventListener(
    'pointerdown',
    (e) => {
      if (e.pointerType === 'mouse' || st.traceProg < 0.99 || still()) return;
      if (e.target.closest('a, button, input, textarea, label')) return;
      setPointer(e);
      const hit = hitTrace(st.px, st.py);
      if (hit) {
        st.hoverTrace = -1;
        sparkAt(hit);
        st.active = true;
      }
    },
    { signal },
  );

  if (symbolBtn) {
    symbolBtn.addEventListener(
      'pointerenter',
      () => {
        st.onSymbol = true;
      },
      { signal },
    );
    symbolBtn.addEventListener(
      'pointerleave',
      () => {
        st.onSymbol = false;
      },
      { signal },
    );
    symbolBtn.addEventListener(
      'pointerdown',
      (e) => {
        if (e.button > 0) return;
        setPointer(e);
        st.suppressClick = false;
        if (still() || st.scrollP > 0.15 || st.introAmt > 0.2) return;
        st.holding = true;
        st.holdTime = 0;
        st.blasted = false;
        st.downX = e.clientX;
        st.downY = e.clientY;
        setHint('charge');
      },
      { signal },
    );
    // clic, toucher, Entrée ou Espace : symbole suivant (sauf à la fin d'un appui long ;
    // un clic venu du clavier a detail = 0 et passe toujours)
    symbolBtn.addEventListener(
      'click',
      (e) => {
        if (st.suppressClick && e.detail !== 0) {
          st.suppressClick = false;
          return;
        }
        st.suppressClick = false;
        if (!st.morphing) nextForm();
      },
      { signal },
    );
    symbolBtn.addEventListener(
      'contextmenu',
      (e) => {
        if (st.holding || st.blasted) e.preventDefault();
      },
      { signal },
    );
  }
  function release(e, cancelled) {
    if (!st.holding) return;
    st.holding = false;
    if (st.blasted) setHint('rollback');
    else setHint('idle');
    if (st.blasted || cancelled) st.suppressClick = true;
    if (e && e.pointerType !== 'mouse') st.hasPointer = false;
  }
  window.addEventListener('pointerup', (e) => release(e, false), { signal });
  window.addEventListener('pointercancel', () => release(null, true), { signal });

  const refreshStill = () => {
    st.hint = '';
    setHint('idle');
    st.dirty = true;
  };
  window.addEventListener(EVT_PAUSE, refreshStill, { signal });
  if (motionQuery.addEventListener) motionQuery.addEventListener('change', refreshStill, { signal });
  else motionQuery.addListener(refreshStill);

  const onIntro = () => {
    if (st.introStart < 0) st.introStart = st.time;
  };
  window.addEventListener(EVT_INTRO, onIntro, { signal });
  if (state.introFired) onIntro();

  /* ---------- boucle ---------- */
  const tmpQ = new THREE.Quaternion();
  const tmpQ2 = new THREE.Quaternion();
  const raycaster = new THREE.Raycaster();

  function updatePanels(dt, t) {
    const mt = (t - st.morphStart) / MORPH;
    let done = true;
    let flashing = false;
    const calm = still();
    const ex = st.explodeAmt;
    const driftK = calm ? 0 : 1 - Math.min(1, ex * 3);
    const charge = st.charge;
    for (let i = 0; i < panels.length; i++) {
      const P = panels[i];
      if (st.morphing) {
        const local = clamp((mt - P.delay) / 0.72, 0, 1);
        if (local < 1) done = false;
        const e = easeInOutCubic(local);
        const arc = Math.sin(Math.PI * e);
        P.cur.p.lerpVectors(P.from.p, P.to.p, e).addScaledVector(P.bulge, arc * 0.9);
        P.cur.q.slerpQuaternions(P.from.q, P.to.q, e);
        tmpQ.setFromAxisAngle(P.mAxis, arc * 1.6);
        P.cur.q.multiply(tmpQ);
        P.cur.s.lerpVectors(P.from.s, P.to.s, e);
        P.cur.glow = P.from.glow + (P.to.glow - P.from.glow) * e;
      }
      // écartement (défilement, survol, éclatement, intro) + respiration décalée par groupe
      const amt = Math.max(0, (ex - P.xDelay) / (1 - P.xDelay));
      const burst = amt * 5.2;
      const ph = P.g * (TAU / 3);
      P.mesh.position.set(
        P.cur.p.x + P.dir.x * burst + Math.sin(t * 0.4 + ph) * 0.03 * driftK,
        P.cur.p.y + P.dir.y * burst + Math.cos(t * 0.35 + ph) * 0.024 * driftK,
        P.cur.p.z + P.dir.z * burst + Math.sin(t * 0.3 + ph * 1.5) * 0.03 * driftK,
      );
      tmpQ2.setFromAxisAngle(P.spinAxis, P.spinSpeed * amt * Math.PI);
      P.mesh.quaternion.multiplyQuaternions(tmpQ2, P.cur.q);
      P.mesh.scale.copy(P.cur.s);
      P.mesh.visible = P.cur.s.x > 0.012;

      P.flash *= Math.pow(0.92, dt * 60);
      if (P.flash > 0.01) flashing = true;
      let glow = P.cur.glow;
      if (P.blink && !st.morphing && !calm) glow *= Math.sin(t * TAU * 0.9) > -0.15 ? 1 : 0.06;
      const pulse = calm ? 1 : 0.85 + 0.15 * Math.sin(t * 2 + P.phase);
      const em = glow * pulse + P.flash * 1.3 + charge * charge * 0.6;
      P.mat.emissiveIntensity = Math.min(2.6, em);
      P.mat.envMapIntensity = ENV_BASE + P.flash * 1.4 + charge * 0.8;
    }
    if (st.morphing && done) st.morphing = false;
    st.flashing = flashing;
  }

  /** Pendant la charge, le texte du hero, la barre de navigation et la légende tremblent. */
  function vibrateUI(t) {
    const a = still() ? 0 : st.shake * 2.4;
    if (a > 0.03) {
      st.vibOn = true;
      for (let k = 0; k < vibEls.length; k++) {
        const el = vibEls[k];
        el.style.transition = 'none';
        el.style.transform = `translate3d(${(Math.sin(t * 97 + k * 1.7) * a).toFixed(2)}px,${(Math.cos(t * 83 + k) * a * 0.7).toFixed(2)}px,0)`;
      }
    } else if (st.vibOn) {
      st.vibOn = false;
      vibEls.forEach((el) => {
        el.style.transition = `transform ${token('--slow')} ${token('--ease')}`;
        el.style.transform = '';
      });
    }
  }

  function update(dt, t) {
    const calm = still();
    if (st.introStart >= 0) {
      st.introAmt = calm ? 0 : 1 - easeOutCubic(clamp((t - st.introStart) / 2.3, 0, 1));
      st.traceProg = calm ? 1 : easeInOutCubic(clamp((t - st.introStart - 0.9) / 1.4, 0, 1));
    } else if (calm) {
      st.introAmt = 0;
      st.traceProg = 1;
    }

    // le symbole suit le pointeur, sauf quand rien ne doit bouger seul
    const mk = Math.min(1, dt * 4);
    const follow = st.hasPointer && !calm;
    st.mouse.x += ((follow ? st.ndc.x : 0) - st.mouse.x) * mk * (follow ? 1 : 0.5);
    st.mouse.y += ((follow ? st.ndc.y : 0) - st.mouse.y) * mk * (follow ? 1 : 0.5);

    st.overSym = st.onSymbol && !coarse && st.scrollP < 0.1;
    st.hoverAmt += ((st.overSym && !st.holding && !calm ? 0.07 : 0) - st.hoverAmt) * Math.min(1, dt * 5);

    // appui maintenu : charge, puis éclatement
    if (st.holding && !calm) {
      st.holdTime += dt;
      if (st.holdTime < CHARGE) {
        st.charge = st.holdTime / CHARGE;
        st.shake = 0.25 + st.charge * 0.75;
      } else {
        if (!st.blasted) {
          st.blasted = true;
          st.kick = 1;
          setHint('blast');
        }
        st.charge = Math.max(0, st.charge - dt * 6);
        st.shake *= Math.pow(0.88, dt * 60);
        st.clickBurst = Math.min(1, st.clickBurst + dt * 1.5);
      }
    } else {
      st.charge = Math.max(0, st.charge - dt * 5);
      st.shake = Math.max(0, st.shake - dt * 5);
      st.clickBurst = Math.max(0, st.clickBurst - dt * 1.05);
      if (st.hint === 'rollback' && st.clickBurst <= 0.001 && t - st.hintAt > 1.6) setHint('idle');
    }
    st.kick = Math.max(0, st.kick - dt * 2.5);

    const scrollAmt = calm ? 0 : Math.pow(st.scrollP, 1.15);
    const burst = st.scrollP < 0.15 ? st.clickBurst : 0;
    st.explodeAmt = Math.max(scrollAmt, st.hoverAmt, burst, st.introAmt);

    // passage automatique au symbole suivant, seulement quand rien d'autre ne se passe
    const idle = !calm && !st.morphing && !st.holding && st.clickBurst < 0.01 && st.introAmt < 0.03 && st.scrollP < 0.04 && !st.overSym;
    if (idle) st.cycleT += dt;
    if (st.cycleT > CYCLE) nextForm();
    if (figBar) figBar.style.transform = `scaleX(${calm ? 0 : clamp(st.cycleT / CYCLE, 0, 1).toFixed(3)})`;

    updatePanels(dt, t);

    const f = FORMS[st.form];
    let settling = false;
    if (f.spin && !calm) st.rotY += dt * 0.3;
    else {
      // symboles plats, ou rien ne bouge seul : retour de face au tour complet le plus proche
      const k = Math.round(st.rotY / TAU) * TAU;
      st.rotY += (k - st.rotY) * Math.min(1, dt * 2.4);
      if (Math.abs(k - st.rotY) > 1e-4) settling = true;
    }
    const sway = f.spin || calm ? 0 : Math.sin(t * 0.55) * 0.34;
    const swayX = calm ? 0 : f.spin ? Math.sin(t * 0.3) * 0.08 : Math.sin(t * 0.42) * 0.1;
    const kr = Math.min(1, dt * 3.2);
    const targetX = swayX - st.mouse.y * 0.3;
    const targetY = st.rotY + sway + st.mouse.x * 0.42;
    group.rotation.x += (targetX - group.rotation.x) * kr;
    group.rotation.y += (targetY - group.rotation.y) * kr;
    if (Math.abs(targetX - group.rotation.x) > 1e-4 || Math.abs(targetY - group.rotation.y) > 1e-4 || st.mouse.lengthSq() > 1e-8) settling = true;
    st.settling = settling;

    const shake = calm ? 0 : st.shake * 0.035 + st.kick * 0.12;
    camera.position.x = (Math.random() - 0.5) * shake;
    camera.position.y = (Math.random() - 0.5) * shake;
    camera.updateMatrixWorld();

    // survol : le panneau sous le curseur s'illumine
    if (!coarse && st.hasPointer && st.explodeAmt < 0.08 && !st.morphing && !st.holding) {
      group.updateMatrixWorld();
      raycaster.setFromCamera(st.ndc, camera);
      const hits = raycaster.intersectObjects(st.activeMeshes, false);
      const hit = hits.length ? hits[0].object : null;
      if (hit !== st.hovered) {
        if (hit) hit.userData.P.flash = 1;
        st.hovered = hit;
      }
    } else st.hovered = null;

    // pistes : tracé, chaleur, étincelles au survol
    const tracesReady = st.traceProg > 0.99;
    let heat = false;
    for (let i = 0; i < traces.length; i++) {
      const tr = traces[i];
      tr.geo.setDrawRange(0, Math.floor(tr.count * st.traceProg));
      tr.heat = Math.max(0, tr.heat - dt * 1.6);
      if (tr.heat > 0) heat = true;
      tr.mat.color.copy(DIM).lerp(HOT, Math.min(1, tr.heat));
    }
    st.weldCd -= dt;
    if (tracesReady && !coarse && !calm && st.hasPointer && !st.overUI && !st.holding && st.scrollP < 0.1 && !st.overSym) {
      const hit = hitTrace(st.px, st.py);
      if (hit) sparkAt(hit);
      else st.hoverTrace = -1;
    } else if (!coarse) st.hoverTrace = -1;
    if (coarse && st.burstLeft > 0 && st.hoverTrace >= 0 && st.weldCd <= 0 && st.sparkLocal) sparkAt({ idx: st.hoverTrace, local: st.sparkLocal });

    let boltsAlive = false;
    for (let i = 0; i < bolts.length; i++) {
      const b = bolts[i];
      if (b.life > 0) {
        boltsAlive = true;
        b.life -= dt;
        b.mat.opacity = Math.max(0, (b.life / b.max) * (0.55 + Math.random() * 0.45));
        if (b.life <= 0) b.line.visible = false;
      }
    }
    let packetsAlive = false;
    const parr = pkGeo.attributes.position.array;
    for (let i = 0; i < PK; i++) {
      const pk = packets[i];
      if (pk.alive) {
        packetsAlive = true;
        pk.s -= pk.speed * dt;
        if (pk.s <= 0) {
          // le paquet atteint le symbole : un panneau s'allume
          pk.alive = false;
          const P = panels[(Math.random() * FORMS[st.form].els.length) | 0];
          if (P) P.flash = 1;
        } else {
          const d = traces[pk.tr].dense[Math.min(traces[pk.tr].dense.length - 1, pk.s | 0)];
          parr[i * 3] = d.x;
          parr[i * 3 + 1] = d.y;
          parr[i * 3 + 2] = ZTR + 0.08;
        }
      }
      if (!pk.alive) {
        parr[i * 3] = 0;
        parr[i * 3 + 1] = 0;
        parr[i * 3 + 2] = -999;
      }
    }
    pkGeo.attributes.position.needsUpdate = true;
    st.active = heat || boltsAlive || packetsAlive || (st.traceProg > 0 && st.traceProg < 1);

    // interface : vibration, jauge, curseur, étiquette des pistes
    vibrateUI(t);
    const meter = st.holding ? (st.blasted ? 1 : st.charge) : st.clickBurst;
    if (hint) hint.style.setProperty('--charge', meter.toFixed(3));
    state.setHold(st.holding ? (st.blasted ? 1 : st.charge) : 0);
    state.cursorSym(st.overSym && !st.holding);
    if (tag) {
      const show = tracesReady && !calm && st.scrollP < 0.05 && !st.holding && st.clickBurst < 0.05 && st.introAmt < 0.05;
      if (show) {
        // au bout d'une piste, décalée d'un pas de la grille, sans jamais sortir du hero
        const portrait = camera.aspect < 0.95;
        const p = toCanvas(portrait ? traces[2].pts[1] : traces[1].pts[2], _a);
        const step = tokenPx('--space-2');
        const x = clamp(p.x + step, step, st.cw - tag.offsetWidth - step);
        const y = clamp(p.y - tokenPx('--space-4'), step, st.heroH - tokenPx('--space-5'));
        tag.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
      }
      if (show !== st.tagOn) {
        st.tagOn = show;
        tag.classList.toggle('is-on', show);
      }
    }
  }

  /** Quand rien ne bouge seul, on ne redessine que si quelque chose a changé. */
  const busy = () =>
    st.dirty || st.morphing || st.holding || st.settling || st.flashing || st.active ||
    st.charge > 1e-3 || st.clickBurst > 1e-3 || st.kick > 1e-3 || st.introAmt > 1e-3 || st.hoverAmt > 1e-3;

  /** Une image de la scène ; renvoie vrai si elle a été dessinée (le garde-fou ne mesure que celles-là). */
  function tick(dt) {
    st.time += dt;
    st.rect = canvas.getBoundingClientRect();
    st.scrollP = clamp((window.scrollY || 0) / (st.heroH * 0.85), 0, 1);
    update(dt, st.time);
    if (still() && !busy()) return false;
    renderer.render(scene, camera);
    st.dirty = false;
    return true;
  }

  // rendu seulement quand le hero est à l'écran et l'onglet visible
  let rafId = 0;
  let last = 0;
  let onScreen = true;
  let screenIo = null;
  let sizeRo = null;
  // garde-fou : si la scène tourne trop lentement (carte graphique faible), elle s'arrête et l'affiche du symbole
  // reprend sa place : mieux vaut un symbole immobile qu'une page qui rame.
  // On mesure l'écart entre deux images dessinées, ce que voit le visiteur, et on retient l'écart moyen, le pire mis
  // de côté : un à-coup isolé (premier défilement sur téléphone, changement de police, pause du système) ne décide pas
  // à lui seul ; une page qui se fige à répétition, si. La médiane, essayée d'abord, se laissait tromper : une carte
  // saturée se bloque plusieurs secondes, puis rend d'un coup quelques images rapides, et la scène restait à deux
  // images par seconde. Un réglage plus ancien, sur les huit premières images, l'arrêtait à tort au premier
  // défilement. La mesure se compte en temps : sur une carte lente, la décision tombe en deux secondes environ.
  const WARMUP = 500; // ms de mise en route ignorées (dernières préparations de la carte graphique)
  const REWARM = 250; // ms ignorées à chaque reprise, quand le hero revient à l'écran pendant la mesure
  const PROBE = 60; // images mesurées au plus…
  const PROBE_MS = 1500; // …ou 1,5 s mesurées, sans le pire écart…
  const PROBE_MIN = 3; // …sur au moins 3 images
  const SLOW = 45; // ms d'écart moyen : sous 22 images par seconde, la scène ralentit toute la page
  let warmLeft = WARMUP;
  let probeN = 0;
  let probeSum = 0;
  let probeMax = 0;
  let probed = false;
  let disabled = false;
  /** Mesure du garde-fou, image dessinée après image dessinée, jusqu'à sa décision. */
  function probe(gap) {
    if (probed) return;
    if (warmLeft > 0) {
      warmLeft -= gap;
      return;
    }
    probeN += 1;
    probeSum += gap;
    probeMax = Math.max(probeMax, gap);
    const time = probeSum - probeMax;
    if (probeN < PROBE && (time < PROBE_MS || probeN < PROBE_MIN)) return;
    probed = true;
    if (time / (probeN - 1) > SLOW) giveUp();
  }
  /** Arrête la scène pour de bon : boucle, écouteurs et observateurs retirés, affiche rendue tout de suite, mémoire
   *  de la carte graphique ensuite. */
  function giveUp() {
    if (disabled) return;
    disabled = true;
    cancelAnimationFrame(rafId);
    rafId = 0;
    teardown.abort();
    if (screenIo) screenIo.disconnect();
    if (sizeRo) sizeRo.disconnect();
    if (symbolBtn) symbolBtn.hidden = true;
    if (tag) tag.classList.remove('is-on');
    signalGlReady(false);
    renderer.dispose();
    releaseContext();
  }
  // Rendre le contexte d'un coup attend que la carte graphique ait fini les images en retard : sur une carte saturée,
  // la page restait figée cinq secondes de plus. On pose un repère au bout de sa file de travail, on vérifie sans
  // bloquer qu'elle l'a atteint, et seulement alors on rend le contexte.
  function releaseContext() {
    const gl = renderer.getContext();
    if (gl.isContextLost()) return;
    const fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    let tries = 100; // 20 s au plus ; au-delà, le canvas caché garde sa mémoire jusqu'à la fin de la visite
    const check = () => {
      if (gl.isContextLost()) return;
      if (fence && gl.getSyncParameter(fence, gl.SYNC_STATUS) !== gl.SIGNALED) {
        if (--tries > 0) setTimeout(check, 200);
        return;
      }
      if (fence) gl.deleteSync(fence);
      renderer.forceContextLoss();
    };
    setTimeout(check, 200);
  }
  function loop(now) {
    rafId = requestAnimationFrame(loop);
    const gap = now - last;
    const dt = clamp(gap / 1000, 0, 0.05);
    last = now;
    if (tick(dt)) probe(gap);
  }
  function syncLoop() {
    const run = !disabled && onScreen && !document.hidden;
    if (run && !rafId) {
      last = performance.now();
      if (!probed) warmLeft = Math.max(warmLeft, REWARM);
      rafId = requestAnimationFrame(loop);
    } else if (!run && rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
      if (tag) tag.classList.remove('is-on');
      st.tagOn = false;
    }
  }
  if ('IntersectionObserver' in window) {
    screenIo = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      syncLoop();
    });
    screenIo.observe(hero);
  }
  document.addEventListener('visibilitychange', syncLoop, { signal });
  // contexte perdu (téléphone à court de mémoire, carte graphique réinitialisée) : rien ne garantit son retour, la
  // scène s'arrête et l'affiche reprend sa place, plutôt qu'une zone vide
  canvas.addEventListener('webglcontextlost', giveUp, { signal });

  // la taille du hero change avec la fenêtre, le chargement de la police ou la barre d'adresse mobile
  let layoutQueued = false;
  const queueLayout = () => {
    if (layoutQueued) return;
    layoutQueued = true;
    requestAnimationFrame(() => {
      layoutQueued = false;
      if (!disabled) layout();
    });
  };
  if ('ResizeObserver' in window) {
    sizeRo = new ResizeObserver(queueLayout);
    sizeRo.observe(canvas);
    sizeRo.observe(stage);
    if (controls) sizeRo.observe(controls);
  } else window.addEventListener('resize', queueLayout, { signal });

  if (symbolBtn) symbolBtn.hidden = false;
  setHint('idle');
  layout();
  setFormation(0, true);
  st.introAmt = still() ? 0 : 1;
  st.traceProg = still() ? 1 : 0;
  st.explodeAmt = st.introAmt;
  updatePanels(0, 0);
  try {
    // compile les shaders avant la fin de l'intro pour éviter un à-coup à la première image
    renderer.compile(scene, camera);
    renderer.render(scene, camera);
  } catch (err) {
    if (symbolBtn) symbolBtn.hidden = true;
    return signalGlReady(false);
  }
  signalGlReady(true);
  syncLoop();
}
