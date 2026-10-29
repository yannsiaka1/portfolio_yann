// Contact : le formulaire affiche la requête JSON au fil de la saisie et valide côté client.
// Aucun envoi réel pour l'instant : à brancher sur un endpoint (Laravel, Formspree…).
import { $, $$ } from '../core/env.js';
import { audio } from '../core/audio.js';

const MIN_MESSAGE = 20;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const escapeHtml = (s) => s.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);

function initForm() {
  const form = $('#contactForm');
  if (!form) return;
  const out = $('#reqBody');
  const res = $('#reqRes');
  const count = $('#msgCount');

  const read = () => {
    const fd = new FormData(form);
    return {
      nom: String(fd.get('nom') || '').trim(),
      courriel: String(fd.get('courriel') || '').trim(),
      besoin: String(fd.get('besoin') || ''),
      message: String(fd.get('message') || '').trim(),
    };
  };

  const render = () => {
    const data = read();
    const keys = Object.keys(data);
    out.innerHTML =
      '{\n' +
      keys.map((k, i) => `  <span class="k">"${k}"</span>: <span class="s">${escapeHtml(JSON.stringify(data[k]))}</span>${i < keys.length - 1 ? ',' : ''}`).join('\n') +
      '\n}';
    const n = data.message.length;
    count.textContent = `${n} / ${MIN_MESSAGE} caractères minimum`;
    count.style.color = n >= MIN_MESSAGE ? 'var(--ambre)' : '';
    return data;
  };

  const setError = (fieldId, errId, msg) => {
    const field = document.getElementById(fieldId);
    const err = document.getElementById(errId);
    if (field) field.classList.toggle('is-bad', !!msg);
    if (err) err.textContent = msg || '';
  };

  form.addEventListener('input', render);
  form.addEventListener('change', render);
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const data = render();
    let firstBad = null;

    if (data.nom.length < 2) {
      setError('fieldName', 'err-nom', 'Indiquez votre nom.');
      firstBad = firstBad || '#f-nom';
    } else setError('fieldName', 'err-nom');

    if (!EMAIL_RE.test(data.courriel)) {
      setError('fieldMail', 'err-courriel', 'Adresse incomplète. Exemple : nom@domaine.com');
      firstBad = firstBad || '#f-courriel';
    } else setError('fieldMail', 'err-courriel');

    if (data.message.length < MIN_MESSAGE) {
      setError('fieldMsg', 'err-message', `Le message doit compter au moins ${MIN_MESSAGE} caractères (encore ${MIN_MESSAGE - data.message.length}).`);
      firstBad = firstBad || '#f-message';
    } else setError('fieldMsg', 'err-message');

    if (firstBad) {
      res.innerHTML = '<span style="color:var(--braise)">422 Unprocessable Content</span>\n// Corrigez les champs signalés à gauche.';
      const el = $(firstBad);
      if (el) el.focus();
      return;
    }
    res.innerHTML =
      '<span class="ok">202 Accepted</span> · aperçu\n{\n  <span class="k">"statut"</span>: <span class="s">"aperçu"</span>,\n  <span class="k">"envoye"</span>: <span class="n">false</span>,\n  <span class="k">"note"</span>: <span class="s">"Démo : aucun message n’est parti. À brancher sur l’endpoint Laravel."</span>\n}';
    if (audio.enabled) audio.rollback();
  });

  render();
}

/** Bouton « Copier » du courriel, avec sélection du texte en secours. */
function initCopyButtons() {
  $$('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const text = btn.dataset.copy;
      const done = (msg) => {
        btn.textContent = msg;
        setTimeout(() => {
          btn.textContent = 'Copier';
        }, 1600);
      };
      const fallback = () => {
        const target = document.getElementById(btn.dataset.target);
        if (target) {
          const range = document.createRange();
          range.selectNodeContents(target);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
        done('Sélectionné');
      };
      try {
        const p = navigator.clipboard && navigator.clipboard.writeText(text);
        if (p && p.then) p.then(() => done('Copié ✓'), fallback);
        else fallback();
      } catch (err) {
        fallback();
      }
    });
  });
}

export function initContact() {
  initForm();
  initCopyButtons();
}
