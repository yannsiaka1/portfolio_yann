// Les deux pages, index.html (français) et en/index.html (anglais), doivent garder la même structure :
// mêmes balises, dans le même ordre, avec les mêmes identifiants, classes, rôles et liens entre éléments.
// Seuls changent le texte, les attributs lisibles (alt, aria-label, title, valeurs), la langue et les chemins.
// À lancer après toute modification du contenu : npm run check:i18n
import { readFileSync } from 'node:fs';

const PAGES = ['index.html', 'en/index.html'];
// attributs qui décrivent la structure ; les autres (texte lisible, langue, chemins) peuvent différer
const KEEP = ['id', 'class', 'role', 'type', 'name', 'for', 'tabindex', 'hidden', 'translate', 'download', 'target',
  'aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-hidden', 'aria-expanded', 'data-reveal', 'data-layer'];

function structure(file) {
  // commentaires et scripts neutralisés, en gardant les retours à la ligne pour des numéros de ligne justes
  const html = readFileSync(file, 'utf8')
    .replace(/<!--[\s\S]*?-->/g, (c) => c.replace(/[^\n]/g, ' '))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, (c) => '<script>' + c.slice(8).replace(/[^\n]/g, ' '));
  const tags = [];
  for (const m of html.matchAll(/<([a-zA-Z][\w-]*)(\s[^>]*)?>/g)) {
    const attrs = new Map();
    for (const a of (m[2] || '').matchAll(/([\w:-]+)(?:="([^"]*)")?/g)) attrs.set(a[1], a[2] ?? '');
    const kept = KEEP.filter((k) => attrs.has(k)).map((k) => `${k}="${attrs.get(k)}"`);
    tags.push({ sig: [m[1].toLowerCase(), ...kept].join(' '), line: html.slice(0, m.index).split('\n').length });
  }
  return tags;
}

const [fr, en] = PAGES.map(structure);
const problems = [];
for (let i = 0; i < Math.max(fr.length, en.length) && problems.length < 8; i++) {
  if (fr[i]?.sig !== en[i]?.sig) problems.push(`  ${PAGES[0]}:${fr[i]?.line ?? '-'}  ${fr[i]?.sig ?? '(fin)'}\n  ${PAGES[1]}:${en[i]?.line ?? '-'}  ${en[i]?.sig ?? '(fin)'}`);
}
if (problems.length) {
  console.error(`Structures différentes (${fr.length} et ${en.length} balises). Premiers écarts :\n${problems.join('\n\n')}`);
  process.exit(1);
}
console.log(`Même structure dans les deux langues : ${fr.length} balises comparées.`);
