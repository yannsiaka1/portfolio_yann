// Affiches des vidéos de prototypes : posées quand la carte approche de l'écran, pas avec la page. Une affiche écrite
// dans l'attribut poster se télécharge dès l'ouverture, même tout en bas de la page, et prend de la bande passante au
// premier écran. Elles vivent dans public/posters/ et attendent dans data-poster ; sans JavaScript, la vidéo garde ses
// commandes et son cadre (dimensions fixées dans la page).
import { $$ } from '../core/env.js';

export function initPosters() {
  const videos = $$('video[data-poster]');
  if (!videos.length) return;
  const show = (video) => {
    video.poster = video.dataset.poster;
    video.removeAttribute('data-poster');
  };
  if (!('IntersectionObserver' in window)) {
    videos.forEach(show);
    return;
  }
  // un écran de marge dans tous les sens : les cartes des projets épinglés arrivent aussi par la droite
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        show(entry.target);
        io.unobserve(entry.target);
      }),
    { rootMargin: '100%' },
  );
  videos.forEach((video) => io.observe(video));
}
