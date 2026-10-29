// Effets sonores synthétisés en direct avec Web Audio : aucun fichier audio à charger.
// Le son est coupé par défaut ; le bouton « Son » de la barre de navigation l'active.

export const audio = (() => {
  let ctx = null;
  let master = null;
  let noise = null;
  let rumble = null;
  let enabled = false;

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    // 2 s de bruit brun, réutilisées par tous les sons « soufflés »
    const len = ctx.sampleRate * 2;
    noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noise.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5 + w * 0.08;
    }
    return ctx;
  }

  function env(g, t, attack, peak, decay) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  function blip(f0, dur, vol, type, f1) {
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, 0.004, vol, dur);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  function hiss(dur, vol, type, f0, f1, q) {
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;
    const s = ctx.createBufferSource();
    s.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    const g = ctx.createGain();
    env(g, t, 0.01, vol, dur);
    s.connect(f).connect(g).connect(master);
    s.start(t, Math.random());
    s.stop(t + dur + 0.1);
  }

  return {
    get enabled() {
      return enabled;
    },
    setEnabled(v) {
      enabled = v;
      if (v) {
        ensure();
        if (ctx && ctx.state === 'suspended') ctx.resume();
      } else this.stopRumble();
    },
    /** Survol d'un panneau du symbole. */
    hover() {
      blip(1500, 0.06, 0.03, 'sine', 2100);
    },
    /** Paquet de données arrivé, couche de la pile activée. */
    tick() {
      blip(2600, 0.03, 0.018, 'square');
    },
    /** Changement de formation du symbole. */
    morph() {
      blip(520, 0.2, 0.035, 'triangle', 980);
    },
    /** Grondement pendant la charge du clic long. */
    startRumble() {
      if (!enabled || !ctx || rumble) return;
      const t = ctx.currentTime;
      const s = ctx.createBufferSource();
      s.buffer = noise;
      s.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(90, t);
      f.frequency.linearRampToValueAtTime(420, t + 0.6);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.32, t + 0.5);
      s.connect(f).connect(g).connect(master);
      s.start(t);
      rumble = { s, g };
    },
    stopRumble() {
      if (!rumble || !ctx) return;
      const t = ctx.currentTime;
      rumble.g.gain.cancelScheduledValues(t);
      rumble.g.gain.setValueAtTime(Math.max(0.0001, rumble.g.gain.value), t);
      rumble.g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
      rumble.s.stop(t + 0.2);
      rumble = null;
    },
    /** Explosion du symbole. */
    blast() {
      if (!enabled || !ctx) return;
      this.stopRumble();
      hiss(0.9, 0.5, 'lowpass', 3200, 120, 0.6);
      hiss(1.4, 0.12, 'bandpass', 600, 2400, 1.2);
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.setValueAtTime(90, t);
      o.frequency.exponentialRampToValueAtTime(32, t + 0.6);
      env(g, t, 0.005, 0.55, 0.7);
      o.connect(g).connect(master);
      o.start(t);
      o.stop(t + 0.8);
    },
    /** Symbole reconstruit, formulaire validé. */
    rollback() {
      blip(880, 0.08, 0.035, 'triangle', 660);
      setTimeout(() => blip(1320, 0.09, 0.03, 'triangle', 990), 90);
    },
    /** Étincelles sur les pistes du circuit. */
    spark() {
      for (let i = 0; i < 4; i++) {
        setTimeout(() => hiss(0.05 + Math.random() * 0.05, 0.1, 'highpass', 3000 + Math.random() * 3000, 6000, 0.5), i * 40 + Math.random() * 30);
      }
    },
    /** Note pincée sur une lettre de la signature du pied de page. */
    pluck(freq) {
      if (!enabled || !ctx) return;
      const t = ctx.currentTime;
      [1, 2, 3].forEach((h, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.frequency.setValueAtTime(freq * h, t);
        env(g, t, 0.004, [0.08, 0.025, 0.012][i], 0.9 / h);
        o.connect(g).connect(master);
        o.start(t);
        o.stop(t + 1.1);
      });
    },
  };
})();
