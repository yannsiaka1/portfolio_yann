// Horloges Montréal / Douala (menu, repères, pied de page) et abréviations de fuseau.
import { $$ } from '../core/env.js';

const ZONES = { mtl: 'America/Toronto', dla: 'Africa/Douala' };

function makeFormatter(timeZone) {
  try {
    return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone });
  } catch (err) {
    return null;
  }
}

export function initClocks() {
  const formatters = { mtl: makeFormatter(ZONES.mtl), dla: makeFormatter(ZONES.dla) };

  // HAE / HNE à Montréal, UTC+1 à Douala
  $$('[data-tz]').forEach((el) => {
    try {
      const part = new Intl.DateTimeFormat('fr-CA', { timeZone: ZONES[el.dataset.tz], timeZoneName: 'short' })
        .formatToParts(new Date())
        .find((x) => x.type === 'timeZoneName');
      el.textContent = part ? part.value : '';
    } catch (err) {
      el.textContent = '';
    }
  });

  const clocks = $$('[data-clock]');
  const tick = () => {
    const now = new Date();
    clocks.forEach((el) => {
      const f = formatters[el.dataset.clock];
      if (f) el.textContent = f.format(now);
    });
  };
  tick();
  setInterval(tick, 1000);
}
