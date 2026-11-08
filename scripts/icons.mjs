// Génère public/icons.svg : les logos des outils affichés dans le hero et dans la section Compétences, réunis dans
// un seul fichier (un symbole par outil), que les pages appellent avec <use href="…icons.svg#identifiant">.
// Une seule couleur, celle du texte autour (currentColor) : le hero reste sobre et lisible sur le fond sombre.
//
// Source : Simple Icons (licence CC0), jamais redessinés à la main. Les marques restent la propriété de leurs
// détenteurs ; elles servent ici à dire quels outils j'utilise.
//
// Ajouter un outil : trouver son identifiant sur https://simpleicons.org, l'ajouter à ICONS, puis lancer
//   npm i --no-save simple-icons@16.36.0 && node scripts/icons.mjs
// (--no-save : le paquet, lourd, ne sert qu'ici et n'entre pas dans les dépendances du site.)
import { writeFileSync } from 'node:fs';
import * as simpleIcons from 'simple-icons';

const ICONS = [
  'uml', 'figma', 'github', 'trello',
  'html5', 'css', 'javascript', 'typescript', 'react', 'tailwindcss', 'bootstrap', 'vite',
  'php', 'laravel', 'python', 'flask', 'django', 'nodedotjs', 'postman',
  'postgresql', 'mysql', 'sqlite', 'redis',
  'git', 'docker', 'vercel', 'render', 'railway',
  'claude',
];

const bySlug = new Map(Object.values(simpleIcons).filter((icon) => icon && icon.slug).map((icon) => [icon.slug, icon]));
const missing = ICONS.filter((slug) => !bySlug.has(slug));
if (missing.length) {
  console.error(`Identifiants inconnus de Simple Icons : ${missing.join(', ')}`);
  process.exit(1);
}

const symbols = ICONS.map((slug) => {
  const { title, path } = bySlug.get(slug);
  return `<symbol id="${slug}" viewBox="0 0 24 24"><!-- ${title} --><path d="${path}"/></symbol>`;
});

const svg = [
  '<svg xmlns="http://www.w3.org/2000/svg">',
  '<!-- Généré par scripts/icons.mjs à partir de Simple Icons (CC0) : ne pas modifier à la main. -->',
  ...symbols,
  '</svg>',
  '',
].join('\n');

writeFileSync(new URL('../public/icons.svg', import.meta.url), svg);
console.log(`public/icons.svg : ${ICONS.length} logos, ${Math.round(svg.length / 1024)} Ko`);
