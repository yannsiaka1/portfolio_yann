// Bouton « Copier l'adresse » : copie le courriel et le confirme dans une zone annoncée.
// Si le navigateur refuse l'accès au presse-papiers, l'adresse est sélectionnée pour une copie au clavier.
import { $$ } from '../core/env.js';

const MESSAGES = {
  copied: 'Adresse copiée.',
  selected: 'Adresse sélectionnée\u00a0: copiez-la avec Ctrl+C ou Cmd+C.',
};

function selectText(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

export function initCopy() {
  $$('[data-copy]').forEach((button) => {
    const value = button.dataset.copy;
    const source = document.getElementById(button.dataset.copySource);
    const feedback = document.getElementById(button.dataset.copyFeedback);
    let timer = 0;

    const say = (text) => {
      if (!feedback) return;
      feedback.textContent = text;
      clearTimeout(timer);
      timer = setTimeout(() => {
        feedback.textContent = '';
      }, 5000);
    };

    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(value);
        say(MESSAGES.copied);
        return;
      } catch (err) {
        // presse-papiers indisponible (page encadrée, permission refusée) : on passe à la sélection
      }
      if (!source) return;
      selectText(source);
      let copied = false;
      try {
        copied = document.execCommand('copy');
      } catch (err) {
        copied = false;
      }
      say(copied ? MESSAGES.copied : MESSAGES.selected);
    });
  });
}
