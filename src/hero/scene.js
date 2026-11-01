// Scène 3D du hero : des symboles de code en panneaux de verre.
// - les mêmes panneaux se recomposent en 7 symboles (formations.js), environ toutes les 7 s
// - le symbole s'incline vers le pointeur ; sur ordinateur, le panneau survolé s'illumine
// - clic court : symbole suivant ; clic maintenu : le symbole éclate, puis se reconstruit au relâchement
// - au défilement, les panneaux s'écartent pendant que la section suivante recouvre le hero
//
// L'écartement passe par une seule valeur, explodeAmt = max(défilement, survol, éclatement, intro) :
// relâcher à n'importe quel moment inverse donc l'effet.
// La boîte .hero__stage (CSS) décide où se pose le symbole ; le canvas couvre tout le hero.
import * as THREE from 'three';
import { coarse, reduce, clamp } from '../core/env.js';
import { signalGlReady } from '../core/state.js';
import { FORMS, POOL, V } from './formations.js';
import { TAU, easeInOutCubic, easeOutCubic, roundedBox } from './helpers.js';

const CHARGE = 0.55; // durée de la charge avant l'éclatement (s)
const CYCLE = 7; // temps passé sur chaque symbole (s) ; aucun passage automatique si le mouvement est réduit
const MORPH = 1.35; // durée d'une transition entre symboles (s)
const CLEAR = 0x121211; // = --bg dans src/styles/tokens.css
const FIT_W = 0.84; // part de la largeur de la scène occupée par le symbole
const FIT_H = 0.86; // part de la hauteur restante une fois l'indice placé
const HINT_GAP = 24; // espace entre le symbole et l'indice (px) = --space-3

const HINTS = {
  mouse: 'Cliquez sur le symbole pour passer au suivant, maintenez le clic pour le faire éclater.',
  touch: 'Touchez le symbole pour passer au suivant, appuyez longuement pour le faire éclater.',
  mouseReduced: 'Cliquez sur le symbole pour passer au suivant.',
  touchReduced: 'Touchez le symbole pour passer au suivant.',
};

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
  const hint = document.getElementById('heroHint');
  if (!canvas || !hero || !stage) return signalGlReady(false);

  // three.js exige WebGL 2 : on vérifie avant de créer le renderer, pour un repli sans erreur
  const attrs = { antialias: true, alpha: false, powerPreference: 'high-performance' };
  let context = null;
  try {
    context = canvas.getContext('webgl2', attrs);
  } catch (err) {
    context = null;
  }
  if (!context) return signalGlReady(false);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, context, ...attrs });
  } catch (err) {
    return signalGlReady(false);
  }

  if (hint) hint.textContent = HINTS[(coarse ? 'touch' : 'mouse') + (reduce ? 'Reduced' : '')];

  // verre réfractif sur ordinateur, métal poli (plus léger) sur mobile
  const small = Math.min(window.innerWidth, window.innerHeight) < 700;
  const hq = !coarse && !small;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(CLEAR, 1);
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
    softbox(9, 1.4, 0xf2b13a, 2.6, [0, -6, 5]);
    softbox(4, 4, 0xffffff, 1.1, [0, 1, 9]);
    scene.environment = pmrem.fromScene(env, 0.035).texture;
    pmrem.dispose();
  })();

  const key = new THREE.DirectionalLight(0xffffff, 1.3);
  key.position.set(3, 5, 6);
  scene.add(key);
  const warm = new THREE.PointLight(0xf2b13a, 16, 16, 2);
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
        emissive: new THREE.Color(0xf2b13a),
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
        emissive: new THREE.Color(0xf2b13a),
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

  /* ---------- état ---------- */
  const st = {
    time: 0, cw: 1, ch: 1, heroH: 1, scale: 1, rect: canvas.getBoundingClientRect(),
    form: 0, morphing: false, morphStart: 0, cycleT: 0,
    rotY: 0, mouse: new THREE.Vector2(), ndc: new THREE.Vector2(), px: -9999, py: -9999, hasPointer: false,
    symX: 0, symY: 0, symR: 1, overSym: false, hoverAmt: 0, hovered: null, activeMeshes: [],
    holding: false, holdTime: 0, blasted: false, charge: 0, shake: 0, clickBurst: 0, kick: 0, downX: 0, downY: 0, downAt: 0,
    introStart: -1, introAmt: reduce ? 0 : 1, scrollP: 0, explodeAmt: 1,
  };

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
  }
  const nextForm = () => setFormation((st.form + 1) % FORMS.length);

  /* ---------- mise en page : le symbole se centre dans .hero__stage ---------- */
  function layout() {
    st.cw = canvas.clientWidth || 1;
    st.ch = canvas.clientHeight || 1;
    renderer.setSize(st.cw, st.ch, false);
    camera.aspect = st.cw / st.ch;
    camera.updateProjectionMatrix();

    const cr = canvas.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    const hintH = hint && hint.offsetParent ? hint.offsetHeight : 0;
    const gap = hintH ? HINT_GAP : 0;
    const upp = (2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / st.ch; // unités 3D par pixel
    const maxH = Math.max(40, sr.height - hintH - gap);
    st.scale = Math.min((sr.width * FIT_W * upp) / 3.5, (maxH * FIT_H * upp) / 2.4);
    // le bloc « symbole + indice » est centré dans la scène, l'indice juste sous le symbole
    const symH = (2.4 * st.scale) / upp;
    const top = Math.max(0, (sr.height - symH - gap - hintH) / 2);
    if (hint) {
      hint.style.top = `${Math.round(top + symH + gap)}px`;
      hint.style.bottom = 'auto';
    }
    const cx = sr.left + sr.width / 2 - cr.left;
    const cy = sr.top + top + symH / 2 - cr.top;
    group.position.set((cx - st.cw / 2) * upp, -(cy - st.ch / 2) * upp, 0);
    group.scale.setScalar(st.scale);
    st.heroH = hero.offsetHeight || st.ch;
    st.rect = cr;
  }

  const _v = new THREE.Vector3();
  function projectSymbol() {
    _v.copy(group.position).project(camera);
    st.symX = st.rect.left + (_v.x * 0.5 + 0.5) * st.cw;
    st.symY = st.rect.top + (-_v.y * 0.5 + 0.5) * st.ch;
    _v.copy(group.position);
    _v.x += 1.75 * st.scale;
    _v.project(camera);
    st.symR = Math.abs(st.rect.left + (_v.x * 0.5 + 0.5) * st.cw - st.symX);
  }

  /* ---------- interactions ---------- */
  function setPointer(e) {
    st.px = e.clientX;
    st.py = e.clientY;
    st.ndc.set(((e.clientX - st.rect.left) / st.cw) * 2 - 1, -((e.clientY - st.rect.top) / st.ch) * 2 + 1);
    st.hasPointer = true;
  }
  window.addEventListener(
    'pointermove',
    (e) => {
      setPointer(e);
      // au doigt, glisser annule l'appui long : la page doit pouvoir défiler
      if (st.holding && e.pointerType !== 'mouse' && Math.hypot(e.clientX - st.downX, e.clientY - st.downY) > 14) release(null, true);
    },
    { passive: true },
  );
  document.addEventListener('pointerleave', () => {
    st.hasPointer = false;
  });
  stage.addEventListener('pointerdown', (e) => {
    if (e.button > 0 || st.scrollP > 0.15 || st.introAmt > 0.2) return;
    setPointer(e);
    if (Math.hypot(e.clientX - st.symX, e.clientY - st.symY) > st.symR * 1.1) return;
    st.holding = true;
    st.holdTime = 0;
    st.blasted = false;
    st.downX = e.clientX;
    st.downY = e.clientY;
    st.downAt = st.time;
  });
  function release(e, cancelled) {
    if (!st.holding) return;
    st.holding = false;
    // clic court : symbole suivant
    if (!st.blasted && !cancelled && st.time - st.downAt < 0.32 && !st.morphing) nextForm();
    if (e && e.pointerType !== 'mouse') st.hasPointer = false;
  }
  window.addEventListener('pointerup', (e) => release(e, false));
  window.addEventListener('pointercancel', () => release(null, true));
  stage.addEventListener('contextmenu', (e) => {
    if (st.holding || st.blasted) e.preventDefault();
  });

  /* ---------- boucle ---------- */
  const tmpQ = new THREE.Quaternion();
  const tmpQ2 = new THREE.Quaternion();
  const raycaster = new THREE.Raycaster();

  function updatePanels(dt, t) {
    const mt = (t - st.morphStart) / MORPH;
    let done = true;
    const ex = st.explodeAmt;
    const driftK = reduce ? 0 : 1 - Math.min(1, ex * 3);
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
      let glow = P.cur.glow;
      if (P.blink && !st.morphing && !reduce) glow *= Math.sin(t * TAU * 0.9) > -0.15 ? 1 : 0.06;
      const em = glow * (0.85 + 0.15 * Math.sin(t * 2 + P.phase)) + P.flash * 1.3 + charge * charge * 0.6;
      P.mat.emissiveIntensity = Math.min(2.6, em);
      P.mat.envMapIntensity = ENV_BASE + P.flash * 1.4 + charge * 0.8;
    }
    if (st.morphing && done) st.morphing = false;
  }

  function update(dt, t) {
    if (st.introStart < 0) st.introStart = t;
    st.introAmt = reduce ? 0 : 1 - easeOutCubic(clamp((t - st.introStart) / 2.3, 0, 1));

    // le symbole suit le pointeur (pas avec le mouvement réduit)
    const mk = Math.min(1, dt * 4);
    const follow = st.hasPointer && !reduce;
    st.mouse.x += ((follow ? st.ndc.x : 0) - st.mouse.x) * mk * (follow ? 1 : 0.5);
    st.mouse.y += ((follow ? st.ndc.y : 0) - st.mouse.y) * mk * (follow ? 1 : 0.5);

    projectSymbol();
    st.overSym = st.hasPointer && !coarse && st.scrollP < 0.1 && Math.hypot(st.px - st.symX, st.py - st.symY) < st.symR;
    st.hoverAmt += ((st.overSym && !st.holding && !reduce ? 0.07 : 0) - st.hoverAmt) * Math.min(1, dt * 5);

    // appui maintenu : charge, puis éclatement (pas avec le mouvement réduit)
    if (st.holding && !reduce) {
      st.holdTime += dt;
      if (st.holdTime < CHARGE) {
        st.charge = st.holdTime / CHARGE;
        st.shake = 0.25 + st.charge * 0.75;
      } else {
        if (!st.blasted) {
          st.blasted = true;
          st.kick = 1;
        }
        st.charge = Math.max(0, st.charge - dt * 6);
        st.shake *= Math.pow(0.88, dt * 60);
        st.clickBurst = Math.min(1, st.clickBurst + dt * 1.5);
      }
    } else {
      st.charge = Math.max(0, st.charge - dt * 5);
      st.shake = Math.max(0, st.shake - dt * 5);
      st.clickBurst = Math.max(0, st.clickBurst - dt * 1.05);
    }
    st.kick = Math.max(0, st.kick - dt * 2.5);

    const scrollAmt = reduce ? 0 : Math.pow(st.scrollP, 1.15);
    const burst = st.scrollP < 0.15 ? st.clickBurst : 0;
    st.explodeAmt = Math.max(scrollAmt, st.hoverAmt, burst, st.introAmt);

    // passage automatique au symbole suivant, seulement quand rien d'autre ne se passe
    const idle = !reduce && !st.morphing && !st.holding && st.clickBurst < 0.01 && st.introAmt < 0.03 && st.scrollP < 0.04 && !st.overSym;
    if (idle) st.cycleT += dt;
    if (st.cycleT > CYCLE) nextForm();

    updatePanels(dt, t);

    const f = FORMS[st.form];
    if (f.spin && !reduce) st.rotY += dt * 0.3;
    else {
      // symboles plats : retour de face au tour complet le plus proche
      const k = Math.round(st.rotY / TAU) * TAU;
      st.rotY += (k - st.rotY) * Math.min(1, dt * 2.4);
    }
    const sway = f.spin || reduce ? 0 : Math.sin(t * 0.55) * 0.34;
    const swayX = reduce ? 0 : f.spin ? Math.sin(t * 0.3) * 0.08 : Math.sin(t * 0.42) * 0.1;
    const kr = Math.min(1, dt * 3.2);
    group.rotation.x += (swayX - st.mouse.y * 0.3 - group.rotation.x) * kr;
    group.rotation.y += (st.rotY + sway + st.mouse.x * 0.42 - group.rotation.y) * kr;

    const shake = st.shake * 0.035 + st.kick * 0.12;
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
  }

  function tick(dt) {
    st.time += dt;
    st.rect = canvas.getBoundingClientRect();
    st.scrollP = clamp((window.scrollY || 0) / (st.heroH * 0.85), 0, 1);
    update(dt, st.time);
    renderer.render(scene, camera);
  }

  // rendu seulement quand le hero est à l'écran et l'onglet visible
  let rafId = 0;
  let last = 0;
  let onScreen = true;
  function loop(now) {
    rafId = requestAnimationFrame(loop);
    const dt = clamp((now - last) / 1000, 0, 0.05);
    last = now;
    tick(dt);
  }
  function syncLoop() {
    const run = onScreen && !document.hidden;
    if (run && !rafId) {
      last = performance.now();
      rafId = requestAnimationFrame(loop);
    } else if (!run && rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      syncLoop();
    }).observe(hero);
  }
  document.addEventListener('visibilitychange', syncLoop);

  // la taille du hero change avec la fenêtre, le chargement de la police ou la barre d'adresse mobile
  let layoutQueued = false;
  const queueLayout = () => {
    if (layoutQueued) return;
    layoutQueued = true;
    requestAnimationFrame(() => {
      layoutQueued = false;
      layout();
    });
  };
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(queueLayout);
    ro.observe(canvas);
    ro.observe(stage);
  } else window.addEventListener('resize', queueLayout);

  layout();
  setFormation(0, true);
  st.explodeAmt = st.introAmt;
  updatePanels(0, 0);
  try {
    // compile les shaders avant la première image pour éviter un à-coup
    renderer.compile(scene, camera);
    renderer.render(scene, camera);
  } catch (err) {
    return signalGlReady(false);
  }
  signalGlReady(true);
  syncLoop();
}
