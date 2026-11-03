// Bouton pause du hero : fige tout ce qui bouge ou change seul (scène 3D, bandeau, curseur de l'invite,
// horloges, grain, vidéos des prototypes, vague de la signature) — WCAG 2.2.2.
// Masqué avec « réduire les animations », puisque rien ne bouge alors seul ; suivi en cours de visite.
import { $, motionQuery } from '../core/env.js';
import { state, setPaused } from '../core/state.js';
import { t } from '../core/i18n.js';

const LABELS = t({
  fr: { run: 'Mettre les animations en pause', paused: 'Relancer les animations' },
  en: { run: 'Pause animations', paused: 'Resume animations' },
});

export function initPause() {
  const button = $('#heroPause');
  if (!button) return;
  const render = () => {
    button.hidden = motionQuery.matches;
    const label = state.paused ? LABELS.paused : LABELS.run;
    button.setAttribute('aria-label', label);
    button.title = label;
    button.classList.toggle('is-paused', state.paused);
  };
  button.addEventListener('click', () => {
    setPaused(!state.paused);
    render();
  });
  if (motionQuery.addEventListener) motionQuery.addEventListener('change', render);
  else motionQuery.addListener(render);
  render();
}
