// Contact : le formulaire prépare un courriel. L'aperçu JSON suit la saisie, la validation se fait ici,
// puis le logiciel de courriel s'ouvre avec le message rédigé (lien mailto:). Rien n'est envoyé par le site.
import { $ } from '../core/env.js';

const TO = 'yannsiaka1@gmail.com';
const MIN_MESSAGE = 20;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const escapeHtml = (s) => s.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);

export function initContact() {
  const form = $('#contactForm');
  if (!form) return;
  const preview = $('#previewBody');
  const count = $('#msg-count');
  const status = $('#form-status');

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
    const shown = { à: TO, de: data.courriel, nom: data.nom, besoin: data.besoin, message: data.message };
    const keys = Object.keys(shown);
    if (preview) {
      preview.innerHTML =
        '{\n' +
        keys.map((k, i) => `  <span class="k">"${k}"</span>: <span class="s">${escapeHtml(JSON.stringify(shown[k]))}</span>${i < keys.length - 1 ? ',' : ''}`).join('\n') +
        '\n}';
    }
    const n = data.message.length;
    if (count) count.textContent = `${n} caractère${n > 1 ? 's' : ''} sur ${MIN_MESSAGE} au minimum`;
    return data;
  };

  const setError = (input, errorEl, message) => {
    if (input) {
      if (message) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    }
    if (errorEl) errorEl.textContent = message || '';
  };

  form.addEventListener('input', render);
  form.addEventListener('change', render);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = render();
    const fields = [
      [$('#f-nom'), $('#err-nom'), data.nom.length < 2 ? 'Indiquez votre nom.' : ''],
      [$('#f-courriel'), $('#err-courriel'), EMAIL_RE.test(data.courriel) ? '' : 'Adresse incomplète. Exemple : nom@domaine.com'],
      [
        $('#f-message'),
        $('#err-message'),
        data.message.length < MIN_MESSAGE ? `Le message doit compter au moins ${MIN_MESSAGE} caractères (encore ${MIN_MESSAGE - data.message.length}).` : '',
      ],
    ];
    let firstBad = null;
    fields.forEach(([input, errorEl, message]) => {
      setError(input, errorEl, message);
      if (message && !firstBad) firstBad = input;
    });
    if (firstBad) {
      if (status) status.textContent = 'Corrigez les champs signalés, puis préparez le courriel.';
      firstBad.focus();
      return;
    }
    const subject = `${data.besoin}, de la part de ${data.nom}`;
    const body = `${data.message}\n\n${data.nom}\n${data.courriel}`;
    if (status) status.textContent = 'Votre logiciel de courriel s’ouvre avec le message prêt à partir. Rien ne s’ouvre? Copiez l’adresse ci-contre.';
    window.location.href = `mailto:${TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });

  render();
}
