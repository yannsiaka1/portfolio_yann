// Scène 3D du hero : des symboles de code en panneaux de verre.
// - les mêmes panneaux se recomposent en 7 formations (src/hero/formations.js)
// - le symbole s'incline vers le curseur ; le panneau survolé s'illumine (raycast)
// - clic long : charge, explosion, puis « rollback » au relâchement ; clic court : symbole suivant
// - pistes de circuit derrière le symbole : étincelles et paquets de données au survol
//
// Tout l'état passe par une seule valeur, explodeAmt = max(scroll, survol, explosion, intro),
// qui décide de l'écartement des panneaux. Relâcher à n'importe quel moment inverse donc l'effet.
import * as THREE from 'three';
import { coarse, reduce, clamp } from '../core/env.js';
import { state, signalGlReady, EVT_INTRO } from '../core/state.js';
import { audio } from '../core/audio.js';
import { scramble } from '../core/text.js';
import { FORMS, POOL, TRACE_DEFS, ZTR, V } from './formations.js';
import { TAU, easeInOutCubic, easeOutCubic, roundedBox, resample, dotTexture } from './helpers.js';

const CHARGE = 0.55; // durée de la charge avant l'explosion (s)
const CYCLE = reduce ? 9 : 5.6; // temps passé sur chaque symbole (s)
const MORPH = 1.35; // durée d'une transition entre symboles (s)

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
  if (!canvas || !hero) return signalGlReady(false);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  } catch (err) {
    return signalGlReady(false);
  }
  if (!renderer.getContext()) return signalGlReady(false);

  // verre réfractif sur ordinateur, métal poli (plus léger) sur mobile
  const small = Math.min(window.innerWidth, window.innerHeight) < 700;
  const hq = !coarse && !small;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, hq ? 1.75 : 1.5));
  renderer.setClearColor(0x0a0a09, 1);
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
    softbox(9, 1.4, 0xffb000, 2.6, [0, -6, 5]);
    softbox(4, 4, 0xffffff, 1.1, [0, 1, 9]);
    scene.environment = pmrem.fromScene(env, 0.035).texture;
    pmrem.dispose();
  })();

  const key = new THREE.DirectionalLight(0xffffff, 1.3);
  key.position.set(3, 5, 6);
  scene.add(key);
  const warm = new THREE.PointLight(0xffb000, 16, 16, 2);
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
        emissive: new THREE.Color(0xffb000),
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
        emissive: new THREE.Color(0xffb000),
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
      i,
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
  const DIM = new THREE.Color(0x5c4a26);
  const HOT = new THREE.Color(0xffc24a);
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
    const m = new THREE.LineBasicMaterial({ color: i % 2 ? 0xffb000 : 0xfff3dc, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
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
  const pkMat = new THREE.PointsMaterial({ size: 0.15, map: dotTexture(), color: 0xffc04d, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
  const pkPoints = new THREE.Points(pkGeo, pkMat);
  pkPoints.frustumCulled = false;
  pkPoints.renderOrder = 6;
  traceGroup.add(pkPoints);
  const packets = Array.from({ length: PK }, () => ({ alive: false, tr: 0, s: 0, speed: 0 }));

  /* ---------- état ---------- */
  const st = {
    time: 0, w: 1, h: 1, heroH: 1, scale: 1, hidden: false,
    form: 0, morphing: false, morphStart: 0, cycleT: 0,
    rotY: 0, mouse: new THREE.Vector2(), ndc: new THREE.Vector2(), px: -9999, py: -9999, hasPointer: false,
    symX: 0, symY: 0, symR: 1, overSym: false, hoverAmt: 0, hovered: null, activeMeshes: [],
    holding: false, holdTime: 0, blasted: false, charge: 0, vibrate: 0, clickBurst: 0, kick: 0, downX: 0, downY: 0, downAt: 0,
    introStart: -1, introAmt: reduce ? 0 : 1, traceProg: reduce ? 1 : 0, scrollP: 0, explodeAmt: 1,
    hoverTrace: -1, sparkLocal: null, burstLeft: 0, weldCd: 0, sparkSound: false, hint: '', hintAt: 0, vibOn: false, tagOn: false,
  };

  /* ---------- éléments du DOM pilotés par la scène ---------- */
  const figN = document.getElementById('figN');
  const figSym = document.getElementById('figSym');
  const figName = document.getElementById('figName');
  const figBar = document.getElementById('figBar');
  const hint = document.getElementById('holdHint');
  const hintText = hint ? hint.querySelector('.hint__text') : null;
  const tag = document.getElementById('traceTag');
  if (tag && coarse) tag.textContent = '⚡ touchez une piste';
  const vibEls = Array.from(document.querySelectorAll('[data-vibrate]'));
  const HINTS = {
    idle: coarse ? 'Appui long sur le symbole pour <b>casser la prod</b>' : 'Maintenez le symbole appuyé pour <b>casser la prod</b>',
    charge: '<b>deploy --force</b> en cours…',
    blast: 'Tout est cassé. Relâchez pour un <b>rollback</b>',
    rollback: '<b>Rollback</b> effectué, tout est rentré dans l’ordre',
  };
  function setHint(name) {
    if (!hint || st.hint === name) return;
    st.hint = name;
    st.hintAt = st.time;
    hint.dataset.state = name;
    if (hintText) hintText.innerHTML = HINTS[name];
  }
  function updateHud(i) {
    const f = FORMS[i];
    if (figN) figN.textContent = `fig. ${String(i + 1).padStart(2, '0')}/${String(FORMS.length).padStart(2, '0')}`;
    if (figSym) figSym.textContent = f.sym;
    if (figName) scramble(figName, f.name, 0.5);
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
      // direction d'explosion propre à chaque panneau
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
    updateHud(idx);
  }
  function nextForm() {
    setFormation((st.form + 1) % FORMS.length);
    audio.morph();
  }

  /* ---------- mise en page : moitié droite sur ordinateur, haut de l'écran sur mobile ---------- */
  function layout() {
    st.w = window.innerWidth;
    st.h = window.innerHeight;
    renderer.setSize(st.w, st.h, false);
    camera.aspect = st.w / st.h;
    camera.updateProjectionMatrix();
    const visH = 2 * 11 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const visW = visH * camera.aspect;
    let s;
    let x;
    let y;
    if (camera.aspect < 0.95) {
      s = Math.min((visW * 0.78) / 3.5, (visH * 0.27) / 2.3);
      x = 0;
      y = visH * 0.2;
    } else {
      s = Math.min((visH * 0.56) / 2.4, (visW * 0.4) / 3.5);
      x = visW * 0.17;
      y = visH * 0.07;
    }
    st.scale = s;
    group.position.set(x, y, 0);
    group.scale.setScalar(s);
    traceGroup.position.set(x, y, 0);
    traceGroup.scale.setScalar(s);
    st.heroH = hero.offsetHeight || st.h;
  }

  const _v = new THREE.Vector3();
  const _a = { x: 0, y: 0 };
  const _b = { x: 0, y: 0 };
  function toScreen(local, out) {
    _v.copy(local);
    traceGroup.localToWorld(_v);
    _v.project(camera);
    out.x = (_v.x * 0.5 + 0.5) * st.w;
    out.y = (-_v.y * 0.5 + 0.5) * st.h;
    return out;
  }
  function projectSymbol() {
    _v.copy(group.position).project(camera);
    st.symX = (_v.x * 0.5 + 0.5) * st.w;
    st.symY = (-_v.y * 0.5 + 0.5) * st.h;
    _v.copy(group.position);
    _v.x += 1.75 * st.scale;
    _v.project(camera);
    st.symR = Math.abs((_v.x * 0.5 + 0.5) * st.w - st.symX);
  }

  /* ---------- pistes : détection, éclairs, paquets ---------- */
  function hitTrace(mx, my) {
    const threshold = coarse ? 26 : 14;
    for (let i = 0; i < traces.length; i++) {
      const pts = traces[i].pts;
      for (let s = 0; s < pts.length - 1; s++) {
        const a = toScreen(pts[s], _a);
        const b = toScreen(pts[s + 1], _b);
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
      const b = pts[s + 1];
      const ab = b.clone().sub(a);
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
      st.sparkSound = true;
      spawnPackets(hit.idx, hit.local, 3);
    }
    if (st.burstLeft > 0 && st.weldCd <= 0) {
      const others = [0, 1, 2]
        .filter((k) => k !== hit.idx)
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.random() > 0.5 ? 1 : 2);
      others.forEach((k) => fireBolt(hit.local, nearestOn(k, hit.local)));
      if (st.sparkSound) {
        audio.spark();
        st.sparkSound = false;
      }
      st.burstLeft--;
      st.weldCd = 0.04 + Math.random() * 0.06;
    }
  }

  /* ---------- interactions ---------- */
  function setPointer(e) {
    st.px = e.clientX;
    st.py = e.clientY;
    st.ndc.set((e.clientX / st.w) * 2 - 1, -(e.clientY / st.h) * 2 + 1);
    st.hasPointer = true;
  }
  window.addEventListener(
    'pointermove',
    (e) => {
      setPointer(e);
      // au doigt, glisser annule le clic long (on veut pouvoir faire défiler la page)
      if (st.holding && e.pointerType !== 'mouse' && Math.hypot(e.clientX - st.downX, e.clientY - st.downY) > 14) cancelHold();
    },
    { passive: true },
  );
  document.addEventListener('pointerleave', () => {
    st.hasPointer = false;
  });
  hero.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    if (e.target.closest('a,button,input,textarea,select,label')) return;
    if (!st.w || st.scrollP > 0.15 || st.introAmt > 0.2) return;
    setPointer(e);
    if (Math.hypot(e.clientX - st.symX, e.clientY - st.symY) > st.symR * 1.1) {
      // hors du symbole : au doigt, toucher une piste déclenche les étincelles
      if (e.pointerType !== 'mouse' && st.traceProg > 0.99) {
        const hit = hitTrace(e.clientX, e.clientY);
        if (hit) {
          st.hoverTrace = -1;
          sparkAt(hit);
        }
      }
      return;
    }
    st.holding = true;
    st.holdTime = 0;
    st.blasted = false;
    st.downX = e.clientX;
    st.downY = e.clientY;
    st.downAt = st.time;
    audio.startRumble();
    setHint('charge');
  });
  function release(e, cancelled) {
    if (!st.holding) return;
    st.holding = false;
    audio.stopRumble();
    if (st.blasted) {
      audio.rollback();
      setHint('rollback');
    } else {
      setHint('idle');
      // clic court : symbole suivant
      if (!cancelled && st.time - st.downAt < 0.32 && !st.morphing) nextForm();
    }
    if (e && e.pointerType !== 'mouse') st.hasPointer = false;
  }
  function cancelHold() {
    release(null, true);
  }
  window.addEventListener('pointerup', (e) => release(e, false));
  window.addEventListener('pointercancel', () => release(null, true));
  hero.addEventListener('contextmenu', (e) => {
    if (st.holding || st.blasted) e.preventDefault();
  });

  const onIntro = () => {
    if (st.introStart < 0) st.introStart = st.time;
  };
  window.addEventListener(EVT_INTRO, onIntro);
  if (state.introFired) onIntro();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(layout, 120);
  });

  /* ---------- boucle ---------- */
  const tmpQ = new THREE.Quaternion();
  const tmpQ2 = new THREE.Quaternion();
  const raycaster = new THREE.Raycaster();

  function updatePanels(dt, t) {
    const mt = (t - st.morphStart) / MORPH;
    let done = true;
    const ex = st.explodeAmt;
    const driftK = 1 - Math.min(1, ex * 3);
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
      // écartement (explosion, scroll, survol, intro) + respiration décalée par groupe
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
      let glow = P.cur.glow;
      if (P.blink && !st.morphing) glow *= Math.sin(t * TAU * 0.9) > -0.15 ? 1 : 0.06;
      const em = glow * (0.85 + 0.15 * Math.sin(t * 2 + P.phase)) + P.flash * 1.3 + charge * charge * 0.6;
      P.mat.emissiveIntensity = Math.min(2.6, em);
      P.mat.envMapIntensity = ENV_BASE + P.flash * 1.4 + charge * 0.8;
    }
    if (st.morphing && done) st.morphing = false;
  }

  /** Pendant la charge, le titre, la barre de navigation et les indices tremblent. */
  function vibrateUI(t) {
    const a = reduce ? 0 : st.vibrate * 2.4;
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
        el.style.transition = 'transform .7s cubic-bezier(.25,.46,.45,.94)';
        el.style.transform = '';
      });
    }
  }

  function update(dt, t) {
    if (st.introStart >= 0) {
      st.introAmt = reduce ? 0 : 1 - easeOutCubic(clamp((t - st.introStart) / 2.3, 0, 1));
      st.traceProg = reduce ? 1 : easeInOutCubic(clamp((t - st.introStart - 0.9) / 1.4, 0, 1));
    }

    const mk = Math.min(1, dt * 4);
    if (st.hasPointer) {
      st.mouse.x += (st.ndc.x - st.mouse.x) * mk;
      st.mouse.y += (st.ndc.y - st.mouse.y) * mk;
    } else {
      st.mouse.x += (0 - st.mouse.x) * mk * 0.5;
      st.mouse.y += (0 - st.mouse.y) * mk * 0.5;
    }

    projectSymbol();
    st.overSym = st.hasPointer && !coarse && st.scrollP < 0.1 && Math.hypot(st.px - st.symX, st.py - st.symY) < st.symR;
    st.hoverAmt += ((st.overSym && !st.holding ? 0.07 : 0) - st.hoverAmt) * Math.min(1, dt * 5);

    if (st.holding) {
      st.holdTime += dt;
      if (st.holdTime < CHARGE) {
        st.charge = st.holdTime / CHARGE;
        st.vibrate = 0.25 + st.charge * 0.75;
      } else {
        if (!st.blasted) {
          st.blasted = true;
          st.kick = 1;
          audio.blast();
          setHint('blast');
        }
        st.charge = Math.max(0, st.charge - dt * 6);
        st.vibrate *= Math.pow(0.88, dt * 60);
        st.clickBurst = Math.min(1, st.clickBurst + dt * 1.5);
      }
    } else {
      st.charge = Math.max(0, st.charge - dt * 5);
      st.vibrate = Math.max(0, st.vibrate - dt * 5);
      st.clickBurst = Math.max(0, st.clickBurst - dt * 1.05);
      if (st.hint === 'rollback' && st.clickBurst <= 0.001 && t - st.hintAt > 1.6) setHint('idle');
    }
    st.kick = Math.max(0, st.kick - dt * 2.5);

    const burst = st.scrollP < 0.15 ? st.clickBurst : 0;
    st.explodeAmt = Math.max(Math.pow(st.scrollP, 1.15), st.hoverAmt, burst, st.introAmt);

    // passage automatique au symbole suivant, seulement quand rien d'autre ne se passe
    const idle = !st.morphing && !st.holding && st.clickBurst < 0.01 && st.introAmt < 0.03 && st.scrollP < 0.04 && !st.overSym;
    if (idle) st.cycleT += dt;
    if (st.cycleT > CYCLE) nextForm();
    if (figBar) figBar.style.transform = `scaleX(${clamp(st.cycleT / CYCLE, 0, 1).toFixed(3)})`;

    updatePanels(dt, t);

    const f = FORMS[st.form];
    if (f.spin) st.rotY += dt * (reduce ? 0.08 : 0.3);
    else {
      // symboles plats : on revient de face au tour complet le plus proche
      const k = Math.round(st.rotY / TAU) * TAU;
      st.rotY += (k - st.rotY) * Math.min(1, dt * 2.4);
    }
    const sway = f.spin || reduce ? 0 : Math.sin(t * 0.55) * 0.34;
    const swayX = reduce ? 0 : f.spin ? Math.sin(t * 0.3) * 0.08 : Math.sin(t * 0.42) * 0.1;
    const kr = Math.min(1, dt * 3.2);
    group.rotation.x += (swayX - st.mouse.y * 0.3 - group.rotation.x) * kr;
    group.rotation.y += (st.rotY + sway + st.mouse.x * 0.42 - group.rotation.y) * kr;

    const shake = reduce ? 0 : st.vibrate * 0.035 + st.kick * 0.12;
    camera.position.x = (Math.random() - 0.5) * shake;
    camera.position.y = (Math.random() - 0.5) * shake;
    camera.updateMatrixWorld();

    // survol magnétique : le panneau sous le curseur s'illumine
    if (!coarse && st.hasPointer && st.explodeAmt < 0.08 && !st.morphing && !st.holding) {
      group.updateMatrixWorld();
      raycaster.setFromCamera(st.ndc, camera);
      const hits = raycaster.intersectObjects(st.activeMeshes, false);
      const hit = hits.length ? hits[0].object : null;
      if (hit !== st.hovered) {
        if (hit) {
          hit.userData.P.flash = 1;
          audio.hover();
        }
        st.hovered = hit;
      }
    } else st.hovered = null;

    // pistes
    const tracesReady = st.traceProg > 0.99;
    for (let i = 0; i < traces.length; i++) {
      const tr = traces[i];
      tr.geo.setDrawRange(0, Math.floor(tr.count * st.traceProg));
      tr.heat = Math.max(0, tr.heat - dt * 1.6);
      tr.mat.color.copy(DIM).lerp(HOT, Math.min(1, tr.heat));
    }
    st.weldCd -= dt;
    if (tracesReady && !coarse && st.hasPointer && !st.holding && st.scrollP < 0.1 && !st.overSym) {
      const hit = hitTrace(st.px, st.py);
      if (hit) sparkAt(hit);
      else st.hoverTrace = -1;
    } else if (!coarse) st.hoverTrace = -1;
    if (coarse && st.burstLeft > 0 && st.hoverTrace >= 0 && st.weldCd <= 0 && st.sparkLocal) {
      sparkAt({ idx: st.hoverTrace, local: st.sparkLocal });
    }

    for (let i = 0; i < bolts.length; i++) {
      const b = bolts[i];
      if (b.life > 0) {
        b.life -= dt;
        b.mat.opacity = Math.max(0, (b.life / b.max) * (0.55 + Math.random() * 0.45));
        if (b.life <= 0) b.line.visible = false;
      }
    }
    const parr = pkGeo.attributes.position.array;
    for (let i = 0; i < PK; i++) {
      const pk = packets[i];
      if (pk.alive) {
        pk.s -= pk.speed * dt;
        if (pk.s <= 0) {
          // le paquet atteint le symbole : un panneau s'allume
          pk.alive = false;
          const P = panels[(Math.random() * FORMS[st.form].els.length) | 0];
          if (P) P.flash = 1;
          audio.tick();
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

    // interface : vibration, jauge, curseur, étiquette des pistes
    vibrateUI(t);
    const meter = st.holding ? (st.blasted ? 1 : st.charge) : st.clickBurst;
    if (hint) hint.style.setProperty('--charge', meter.toFixed(3));
    state.setHold(st.holding ? (st.blasted ? 1 : st.charge) : 0);
    state.cursorSym(st.overSym && !st.holding);
    if (tag) {
      const show = tracesReady && st.scrollP < 0.05 && !st.holding && st.clickBurst < 0.05 && st.introAmt < 0.05;
      if (show) {
        const p = toScreen(camera.aspect < 0.95 ? traces[2].pts[1] : traces[1].pts[2], _a);
        const x = clamp(p.x + 14, 16, st.w - 200);
        const y = clamp(p.y - 30, 70, st.h - 40);
        tag.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
      }
      if (show !== st.tagOn) {
        st.tagOn = show;
        tag.classList.toggle('is-on', show);
      }
    }
  }

  // rendu en pause dès que le hero sort de l'écran ou que l'onglet est caché
  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = clamp((now - last) / 1000, 0, 0.05);
    last = now;
    const y = window.scrollY || 0;
    const visible = !document.hidden && y < st.heroH + 60;
    if (!visible) {
      if (!st.hidden) {
        st.hidden = true;
        canvas.style.visibility = 'hidden';
        if (tag) tag.classList.remove('is-on');
        st.tagOn = false;
      }
      return;
    }
    if (st.hidden) {
      st.hidden = false;
      canvas.style.visibility = '';
    }
    st.time += dt;
    st.scrollP = clamp(y / (st.heroH * 0.85), 0, 1);
    update(dt, st.time);
    renderer.render(scene, camera);
  }

  layout();
  setFormation(0, true);
  setHint('idle');
  st.explodeAmt = st.introAmt;
  updatePanels(0, 0);
  try {
    // compile les shaders avant la fin du préchargement pour éviter un à-coup à la première image
    renderer.compile(scene, camera);
    renderer.render(scene, camera);
  } catch (err) {
    return signalGlReady(false);
  }
  signalGlReady(true);
  requestAnimationFrame(frame);
}
