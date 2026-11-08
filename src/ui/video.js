// Vidéo d'une ressource du journal : le lien vers YouTube devient, au clic, le lecteur intégré (youtube-nocookie).
// Rien n'est chargé depuis YouTube avant ce clic, ni requête ni témoin ; sans JavaScript, le lien ouvre la vidéo
// sur YouTube, dans un nouvel onglet. La politique de sécurité du site n'autorise que ce cadre (vercel.json).
import { $$ } from '../core/env.js';
import { t } from '../core/i18n.js';

export function initVideos() {
  $$('.video__link[data-video]').forEach((link) => {
    // avec JavaScript, la vidéo se lit ici : le lien n'ouvre plus d'onglet, et ne l'annonce plus
    link.removeAttribute('target');
    const tab = link.querySelector('.video__tab');
    if (tab) tab.remove();
    link.addEventListener('click', (e) => {
      const id = link.dataset.video;
      if (!/^[\w-]{11}$/.test(id || '')) return;
      e.preventDefault();
      const frame = document.createElement('iframe');
      frame.className = 'video__frame';
      frame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
      frame.title = t({ fr: `Vidéo : ${link.dataset.title}`, en: `Video: ${link.dataset.title}` });
      frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      frame.allowFullscreen = true;
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      link.replaceWith(frame);
      frame.focus();
    });
  });
}
