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
  const formatters = { mtl: makeFormatter(ZONES.mtl), dla: makeFormatter(ZONES.dla) };
  const clocks = $$('[data-clock]');
  if (!clocks.length) return;
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
  tick();
  setInterval(tick, 1000);
}
