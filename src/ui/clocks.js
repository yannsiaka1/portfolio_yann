// Horloges Montréal et Douala (repères, pied de page). Elles s'arrêtent avec le bouton pause (WCAG 2.2.2).
import { locale } from '../core/i18n.js';
import { $$ } from '../core/env.js';
import { state } from '../core/state.js';

const ZONES = { mtl: 'America/Toronto', dla: 'Africa/Douala' };

/** Heure au format 24 h « 14:05:09 », quelle que soit la langue du navigateur. */
function makeFormatter(timeZone) {
  try {
    const f = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23', timeZone });
    return {
      format: (date) => {
        const parts = Object.fromEntries(f.formatToParts(date).map((p) => [p.type, p.value]));
        return `${parts.hour}:${parts.minute}:${parts.second}`;
      },
    };
  } catch (err) {
    return null;
  }
}

export function initClocks() {
  const clocks = $$('[data-clock]');
  if (!clocks.length) return;
  let formatters = null;
  const tick = () => {
    if (state.paused) return;
    const now = new Date();
    clocks.forEach((el) => {
      const f = formatters[el.dataset.clock];
      if (!f) return;
      el.textContent = f.format(now);
      el.dateTime = now.toISOString();
    });
  };
  // les horloges démarrent quand elles approchent de l'écran : préparer les fuseaux horaires coûte un long calcul au
  // démarrage d'un téléphone, pour des horloges placées loin sous le premier écran
  const start = () => {
    if (formatters) return;
    formatters = { mtl: makeFormatter(ZONES.mtl), dla: makeFormatter(ZONES.dla) };
    tick();
    setInterval(tick, 1000);
  };
  if (!('IntersectionObserver' in window)) return start();
  const io = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    io.disconnect();
    start();
  }, { rootMargin: '50%' });
  clocks.forEach((el) => io.observe(el));
}
