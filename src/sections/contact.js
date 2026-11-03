// Contact : le formulaire prépare un courriel. L'aperçu JSON suit la saisie, la validation se fait ici,
// puis le logiciel de courriel s'ouvre avec le message rédigé (lien mailto:). Rien n'est envoyé par le site.
import { $ } from '../core/env.js';
import { t } from '../core/i18n.js';

const TO = 'yannsiaka1@gmail.com';
const MIN_MESSAGE = 20;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const escapeHtml = (s) => s.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);

// textes du formulaire dans la langue de la page (les noms des champs, nom, courriel, besoin, message, ne changent pas)
const TEXT = t({
  fr: {
    keys: ['à', 'de', 'nom', 'besoin', 'message'],
    count: (n) => `${n} caractère${n > 1 ? 's' : ''} sur ${MIN_MESSAGE} au minimum`,
    name: 'Indiquez votre nom.',
    email: 'Adresse incomplète. Exemple : nom@domaine.com',
    message: (left) => `Le message doit compter au moins ${MIN_MESSAGE} caractères (encore ${left}).`,
    fix: 'Corrigez les champs signalés, puis préparez le courriel.',
    subject: (need, name) => `${need}, de la part de ${name}`,
    sent: 'Votre logiciel de courriel s’ouvre avec le message prêt à partir. Rien ne s’ouvre? Utilisez le bouton « Copier l’adresse ».',
  },
  en: {
    keys: ['to', 'from', 'name', 'need', 'message'],
    count: (n) => `${n} character${n === 1 ? '' : 's'}, ${MIN_MESSAGE} minimum`,
    name: 'Enter your name.',
    email: 'Incomplete email address. Example: name@domain.com',
    message: (left) => `Your message needs at least ${MIN_MESSAGE} characters (${left} to go).`,
    fix: 'Fix the highlighted fields, then prepare the email.',
    subject: (need, name) => `${need}, from ${name}`,
    sent: 'Your email app opens with the message ready to send. Nothing opens? Use the “Copy address” button.',
  },
});

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
    const values = [TO, data.courriel, data.nom, data.besoin, data.message];
    const keys = TEXT.keys;
    const shown = Object.fromEntries(keys.map((k, i) => [k, values[i]]));
    if (preview) {
      preview.innerHTML =
        '{\n' +
        keys.map((k, i) => `  <span class="k">"${k}"</span>: <span class="s">${escapeHtml(JSON.stringify(shown[k]))}</span>${i < keys.length - 1 ? ',' : ''}`).join('\n') +
        '\n}';
    }
    const n = data.message.length;
    if (count) count.textContent = TEXT.count(n);
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
      [$('#f-nom'), $('#err-nom'), data.nom.length < 2 ? TEXT.name : ''],
      [$('#f-courriel'), $('#err-courriel'), EMAIL_RE.test(data.courriel) ? '' : TEXT.email],
      [
        $('#f-message'),
        $('#err-message'),
        data.message.length < MIN_MESSAGE ? TEXT.message(MIN_MESSAGE - data.message.length) : '',
      ],
    ];
    let firstBad = null;
    fields.forEach(([input, errorEl, message]) => {
      setError(input, errorEl, message);
      if (message && !firstBad) firstBad = input;
    });
    if (firstBad) {
      if (status) status.textContent = TEXT.fix;
      firstBad.focus();
      return;
    }
    const subject = TEXT.subject(data.besoin, data.nom);
    const body = `${data.message}\n\n${data.nom}\n${data.courriel}`;
    if (status) status.textContent = TEXT.sent;
    window.location.href = `mailto:${TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });

  render();
}
