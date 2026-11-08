// Vérification complète du site, point par point, dans l'ordre : npm run verify
//
//   1. construction        le site se construit, avec et sans les brouillons du journal
//   2. deux langues        index.html et en/index.html gardent la même structure (scripts/check-i18n.mjs)
//   3. référencement       chaque page a sa langue, son titre, sa description, son adresse canonique et un seul h1 ;
//                          plan du site et robots.txt présents, aucun brouillon dans le plan, aucune adresse oubliée
//   4. liens               chaque lien et chaque fichier visé par une page existe, chaque logo appelé existe
//   5. sécurité            chaque script en ligne est autorisé par la politique de sécurité (vercel.json),
//                          aucun style en ligne (la politique les refuse)
//   6. navigateur          sur le site servi avec les en-têtes de Vercel : aucune erreur ni violation de la
//                          politique de sécurité, aucun défilement horizontal de 320 à 2 560 px, aucune erreur
//                          d'accessibilité (axe, WCAG 2.2 AA, et texte contrasté à 7:1, règle du projet), barre sur
//                          une ligne, cibles de 48 px, un lien vers une section ouvre la page sur elle
//
// Le navigateur utilisé est Google Chrome installé sur l'ordinateur (ou Edge) ; pour en choisir un autre :
//   CHROME_PATH=/chemin/vers/chrome npm run verify
// Le script s'arrête au premier point en échec, avec ce qu'il faut corriger. Rien n'est envoyé hors de l'ordinateur.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { extname, join, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'dist');
const DRAFTS = join(ROOT, 'node_modules', '.verify', 'dist-brouillons'); // ignoré par Git avec node_modules
const WIDTHS = [320, 390, 768, 1024, 1280, 1440, 1920, 2560];
const TARGET = 48; // px : hauteur minimale d'une cible (règle du projet, tokens.css --target)
const require = createRequire(import.meta.url);

let step = 0;
const title = (text) => console.log(`\n${++step}. ${text}`);
const ok = (text) => console.log(`   ✓ ${text}`);
function fail(text, details = []) {
  console.error(`   ✗ ${text}`);
  details.slice(0, 15).forEach((d) => console.error(`     - ${d.length > 220 ? `${d.slice(0, 220)}…` : d}`));
  if (details.length > 15) console.error(`     … et ${details.length - 15} autres`);
  process.exit(1);
}

/** Fichiers d'un dossier, récursivement, chemins relatifs au dossier. */
function files(dir, base = dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? files(full, base) : [posix.relative(base.split('\\').join('/'), full.split('\\').join('/'))];
  });
}

/* ---------- 1. construction ---------- */
title('Construction');
// d'abord avec les brouillons (pages du journal à vérifier dans le navigateur), puis le build du site en ligne :
// le journal généré dans les sources reste ainsi celui du site en ligne
process.env.JOURNAL_DRAFTS = '1';
await build({ root: ROOT, logLevel: 'error', build: { outDir: DRAFTS, emptyOutDir: true } });
delete process.env.JOURNAL_DRAFTS;
await build({ root: ROOT, logLevel: 'error' });
ok('le site se construit, avec et sans les brouillons du journal');

/* ---------- 2. deux langues ---------- */
title('Deux langues');
try {
  ok(execFileSync(process.execPath, [join(ROOT, 'scripts/check-i18n.mjs')], { encoding: 'utf8' }).trim());
} catch (err) {
  fail('les pages française et anglaise n’ont plus la même structure', [String(err.stdout || err.message).trim()]);
}

/* ---------- 3. référencement ---------- */
title('Référencement');
const htmlFiles = (dir) => files(dir).filter((f) => f.endsWith('.html'));
const read = (dir, f) => readFileSync(join(dir, f), 'utf8');
{
  const problems = [];
  for (const f of htmlFiles(DIST)) {
    const html = read(DIST, f);
    const page = f === '404.html';
    if (!/<html lang="(fr|en)-CA"/.test(html)) problems.push(`${f} : langue de la page absente`);
    if (!/<title>[^<]+<\/title>/.test(html)) problems.push(`${f} : titre absent`);
    if ((html.match(/<h1\b/g) || []).length !== 1) problems.push(`${f} : il faut un seul titre de niveau 1 (h1)`);
    if (!page && !/<meta name="description" content="[^"]{50,}"/.test(html)) problems.push(`${f} : description absente ou trop courte`);
    if (!page && !/<link rel="canonical" href="https:\/\/[^"]+">/.test(html)) problems.push(`${f} : adresse canonique absente`);
    if (!page && !/<meta property="og:image" content="https:\/\/[^"]+">/.test(html)) problems.push(`${f} : image de partage absente`);
    if (html.includes('__SITE_URL__')) problems.push(`${f} : __SITE_URL__ n’a pas été remplacée`);
  }
  for (const f of ['robots.txt', 'sitemap.xml']) if (!existsSync(join(DIST, f))) problems.push(`${f} absent`);
  const sitemap = existsSync(join(DIST, 'sitemap.xml')) ? read(DIST, 'sitemap.xml') : '';
  if (sitemap.includes('__SITE_URL__') || !/<loc>https:\/\/[^<]+\/<\/loc>/.test(sitemap)) problems.push('sitemap.xml : adresses incomplètes');
  // aucun brouillon dans le plan du site
  for (const lang of ['fr', 'en']) {
    const dir = join(ROOT, 'content/journal', lang);
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir).filter((n) => n.endsWith('.md'))) {
      if (/^draft:\s*true\s*$/m.test(readFileSync(join(dir, name), 'utf8')) && sitemap.includes(`/${name.replace(/\.md$/, '')}/`)) {
        problems.push(`sitemap.xml : le brouillon ${lang}/${name} y figure`);
      }
    }
  }
  if (problems.length) fail('ce que lisent les moteurs de recherche est incomplet', problems);
  ok(`${htmlFiles(DIST).length} pages : langue, titre, description, adresse canonique, image de partage, un seul h1`);
  ok('sitemap.xml et robots.txt présents, sans brouillon');
}

/* ---------- 4. liens ---------- */
title('Liens et fichiers');
{
  const problems = [];
  const icons = existsSync(join(DIST, 'icons.svg')) ? read(DIST, 'icons.svg') : '';
  for (const dir of [DIST, DRAFTS]) {
    for (const f of htmlFiles(dir)) {
      const html = read(dir, f).replace(/<!--[\s\S]*?-->/g, '');
      for (const m of html.matchAll(/\s(?:href|src|data-poster)="([^"]+)"/g)) {
        const url = m[1];
        if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#|__)/i.test(url)) continue; // adresse complète, ancre, mailto…
        const [path, hash] = url.split('#');
        const clean = path.split('?')[0];
        if (!clean) continue;
        // la page 404 vise ses fichiers depuis la racine ; les autres pages, depuis leur propre dossier
        const target = clean.startsWith('/') ? clean.slice(1) : posix.normalize(posix.join(posix.dirname(f), clean));
        const file = target === '.' || target.endsWith('/') || target === '' ? posix.join(target, 'index.html') : target;
        if (!existsSync(join(dir, file))) {
          problems.push(`${dir === DIST ? '' : '(brouillons) '}${f} : « ${url} » introuvable`);
          continue;
        }
        if (file.endsWith('icons.svg') && hash && !icons.includes(`<symbol id="${hash}"`)) problems.push(`${f} : logo « ${hash} » absent de icons.svg`);
      }
    }
  }
  if (problems.length) fail('des liens ou des fichiers manquent', problems);
  ok('chaque lien interne, fichier et logo appelé par les pages existe');
}

/* ---------- 5. sécurité ---------- */
title('Politique de sécurité');
const vercel = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8'));
{
  const csp = vercel.headers.flatMap((h) => h.headers).find((h) => h.key === 'Content-Security-Policy')?.value || '';
  const scriptSrc = (csp.split(';').map((d) => d.trim()).find((d) => d.startsWith('script-src')) || '').split(/\s+/);
  const problems = [];
  if (!csp) problems.push('vercel.json : aucune politique de sécurité (Content-Security-Policy)');
  if (/style-src[^;]*'unsafe-inline'|script-src[^;]*'unsafe-(inline|eval)'/.test(csp)) problems.push('la politique autorise du code en ligne non vérifié (unsafe-inline / unsafe-eval)');
  for (const dir of [DIST, DRAFTS]) {
    for (const f of htmlFiles(dir)) {
      const html = read(dir, f);
      for (const m of html.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
        const attrs = m[1] || '';
        if (/\ssrc=/.test(attrs) || /type="application\/ld\+json"/.test(attrs)) continue; // fichier, ou données
        const hash = `'sha256-${createHash('sha256').update(m[2]).digest('base64')}'`;
        if (!scriptSrc.includes(hash)) problems.push(`${f} : script en ligne non autorisé (ajouter ${hash} à script-src, ou le rendre identique aux autres)`);
      }
      if (/\sstyle="/.test(html) || /<style\b/.test(html)) problems.push(`${f} : style en ligne (la politique le refuse ; le passer dans une feuille de style)`);
      if (/\son[a-z]+="/.test(html)) problems.push(`${f} : gestionnaire d’évènement en ligne (onclick…), refusé par la politique`);
    }
  }
  if (problems.length) fail('la politique de sécurité bloquerait une partie du site, ou serait trop permissive', [...new Set(problems)]);
  ok('chaque script en ligne est autorisé par son empreinte, aucun style ni gestionnaire en ligne');
}

/* ---------- 6. navigateur ---------- */
title('Dans le navigateur');
let chromium;
let axeSource;
try {
  ({ chromium } = await import('playwright-core'));
  axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
} catch (err) {
  fail('outils absents : lancer npm install (playwright-core et axe-core sont dans devDependencies)');
}

// le site construit avec les brouillons, servi avec les en-têtes de vercel.json, comme sur Vercel
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain', '.pdf': 'application/pdf', '.mp4': 'video/mp4', '.webm': 'video/webm', '.json': 'application/json' };
const rules = vercel.headers.map((h) => ({ re: new RegExp(`^${h.source.replace(/\(\.\*\)/g, '.*')}$`), headers: h.headers }));
const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://local').pathname);
  let file = resolve(DRAFTS, `.${path}`);
  if (!file.startsWith(DRAFTS)) {
    res.writeHead(403).end();
    return;
  }
  if (existsSync(file) && statSync(file).isDirectory()) {
    if (!path.endsWith('/')) {
      res.writeHead(308, { Location: `${path}/` }).end(); // trailingSlash: true, comme sur Vercel
      return;
    }
    file = join(file, 'index.html');
  }
  const found = existsSync(file);
  const headers = { 'Content-Type': TYPES[extname(found ? file : '404.html')] || 'application/octet-stream' };
  rules.filter((r) => r.re.test(path)).forEach((r) => r.headers.forEach((h) => (headers[h.key] = h.value)));
  res.writeHead(found ? 200 : 404, headers);
  res.end(readFileSync(found ? file : join(DRAFTS, '404.html')));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;

const notes = htmlFiles(DRAFTS).filter((f) => /^(en\/)?journal\/.+\/index\.html$/.test(f)).map((f) => `/${f.replace(/index\.html$/, '')}`);
const pages = ['/', '/en/', ...(existsSync(join(DRAFTS, 'journal/index.html')) ? ['/journal/', '/en/journal/'] : []), ...notes.slice(0, 2), '/adresse-qui-n-existe-pas/'];

let browser;
for (const opts of [process.env.CHROME_PATH && { executablePath: process.env.CHROME_PATH }, { channel: 'chrome' }, { channel: 'msedge' }, {}].filter(Boolean)) {
  try {
    browser = await chromium.launch(opts);
    break;
  } catch (err) {
    /* navigateur suivant */
  }
}
if (!browser) {
  server.close();
  fail('aucun navigateur trouvé : installer Google Chrome, ou lancer CHROME_PATH=/chemin/vers/chrome npm run verify');
}

const problems = [];
try {
  // a) erreurs et violations de la politique de sécurité, animations actives, toutes les pages
  for (const path of pages) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    const youtube = []; // requêtes vers YouTube : aucune ne doit partir avant le clic sur « Lire la vidéo »
    page.on('request', (r) => /youtube/.test(r.url()) && youtube.push(r.url()));
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && !/status of 404/.test(m.text()) && errors.push(m.text()));
    await page.addInitScript(() => {
      window.__violations = [];
      document.addEventListener('securitypolicyviolation', (e) => window.__violations.push(`${e.violatedDirective} : ${e.blockedURI || 'en ligne'}`));
    });
    await page.goto(origin + path, { waitUntil: 'networkidle' });
    await page.mouse.wheel(0, 2400);
    await page.waitForTimeout(1500);
    const violations = await page.evaluate(() => window.__violations);
    errors.concat(violations).forEach((e) => problems.push(`${path} : ${e}`));
    // vidéo d'une ressource : rien de YouTube avant le clic, le lecteur après
    if (await page.$('.video__link[data-video]')) {
      if (youtube.length) problems.push(`${path} : YouTube contacté avant le clic (${youtube[0]})`);
      await page.click('.video__link');
      const frame = await page.waitForSelector('iframe.video__frame[src*="youtube-nocookie.com/embed/"]', { timeout: 3000 }).catch(() => null);
      if (!frame) problems.push(`${path} : le lecteur vidéo ne remplace pas le lien au clic`);
    }
    await page.close();
  }
  if (problems.length) fail('erreurs dans le navigateur', problems);
  ok(`${pages.length} pages sans erreur ni violation de la politique de sécurité`);

  // b) défilement horizontal, barre sur une ligne, cibles : toutes les largeurs, et un téléphone en paysage
  for (const path of pages) {
    for (const [w, h] of [...WIDTHS.map((x) => [x, 900]), [844, 390]]) {
      const page = await browser.newPage({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
      await page.goto(origin + path, { waitUntil: 'networkidle' });
      const r = await page.evaluate((target) => {
        const header = document.querySelector('.site-header__inner');
        const box = (el) => el && el.getBoundingClientRect();
        const list = box(document.querySelector('.site-nav__list'));
        const promptBox = box(document.querySelector('.prompt'));
        const right = box(document.querySelector('.lang-switch'));
        const small = [...document.querySelectorAll('.btn, .site-nav__link, .notes__link, .link--standalone')]
          .filter((el) => el.offsetParent && el.getBoundingClientRect().height > 0 && el.getBoundingClientRect().height < target - 0.5)
          .map((el) => `${el.className.split(' ')[0]} « ${el.textContent.trim().slice(0, 30)} » (${Math.round(el.getBoundingClientRect().height)} px)`);
        return {
          overflow: document.documentElement.scrollWidth - innerWidth,
          headerH: header ? header.getBoundingClientRect().height : 0,
          headerMin: header ? parseFloat(getComputedStyle(header).minHeight) : 0,
          overlap: !!(list && innerWidth >= 1280 && ((promptBox && list.left < promptBox.right) || (right && list.right > right.left))),
          small,
        };
      }, TARGET);
      if (r.overflow > 0) problems.push(`${path} à ${w} × ${h} : la page défile de côté (${r.overflow} px)`);
      if (r.headerH > r.headerMin + 1) problems.push(`${path} à ${w} px : la barre passe sur deux lignes`);
      if (r.overlap) problems.push(`${path} à ${w} px : les onglets centrés chevauchent l’invite ou les boutons`);
      r.small.forEach((s) => problems.push(`${path} à ${w} px : cible trop petite, ${s}`));
      await page.close();
    }
  }
  if (problems.length) fail('mise en page', [...new Set(problems)]);
  ok(`aucun défilement horizontal de ${WIDTHS[0]} à ${WIDTHS.at(-1)} px ni en paysage, barre sur une ligne, cibles d’au moins ${TARGET} px`);

  // c) accessibilité : axe, règles WCAG 2.2 AA, sur téléphone et sur ordinateur, animations réduites (états finaux)
  for (const path of pages) {
    for (const w of [390, 1440]) {
      // bypassCSP : la politique du site refuse, à raison, le script d'axe injecté pour l'audit (elle est vérifiée plus haut)
      const page = await browser.newPage({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce', bypassCSP: true });
      await page.goto(origin + path, { waitUntil: 'networkidle' });
      await page.addScriptTag({ content: axeSource });
      const violations = await page.evaluate(async () => {
        // color-contrast-enhanced : le contraste du texte à 7:1 (4,5:1 pour les grands titres), règle du projet
        const res = await window.axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
          rules: { 'color-contrast-enhanced': { enabled: true } },
        });
        return res.violations.map((v) => `${v.id} : ${v.help} (${v.nodes.length} élément(s), ex. ${v.nodes[0].target.join(' ')})`);
      });
      violations.forEach((v) => problems.push(`${path} à ${w} px : ${v}`));
      await page.close();
    }
  }
  if (problems.length) fail('erreurs d’accessibilité', problems);
  ok(`aucune erreur d’accessibilité (axe, WCAG 2.2 AA, contraste du texte à 7:1) sur ${pages.length} pages, à 390 et 1 440 px`);

  // d) arrivée par un lien vers une section (onglets du journal, « Me contacter » sous une note, liens du CV), animations
  //    actives, à la souris et au doigt : la page s'ouvre sur la section, juste sous la barre, son contenu affiché
  const landing = () => {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (!target) return { missing: true };
    const header = document.querySelector('.site-header');
    return {
      top: Math.round(target.getBoundingClientRect().top),
      under: Math.round(header ? header.getBoundingClientRect().bottom : 0),
      // masqués par les révélations (src/sections/reveals.js) : bloc transparent, mot de titre sous son masque
      hidden: [...target.querySelectorAll('[style]')].filter((el) => el.style.opacity === '0' || /115%/.test(el.style.translate)).length,
    };
  };
  const landed = (label, r) => {
    if (r.missing) problems.push(`${label} : la section visée n’existe pas`);
    else if (r.top < r.under - 1 || r.top > r.under + 64) problems.push(`${label} : la section est à ${r.top} px du haut de l’écran (attendu : juste sous la barre, ${r.under} px)`);
    else if (r.hidden) problems.push(`${label} : ${r.hidden} élément(s) de la section encore masqué(s)`);
  };
  const arrivals = ['/#competences', '/#contact', '/en/#contact'];
  for (const [w, h, touch] of [[1440, 900, false], [390, 844, true]]) {
    for (const path of arrivals) {
      const page = await browser.newPage({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch });
      await page.goto(origin + path, { waitUntil: 'networkidle' });
      await page.waitForTimeout(800);
      landed(`${path} à ${w} px`, await page.evaluate(landing));
      await page.close();
    }
  }
  if (pages.includes('/journal/')) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(origin + '/journal/', { waitUntil: 'networkidle' });
    await Promise.all([page.waitForURL(/\/#competences$/), page.click('.site-nav__link[href$="#competences"]')]);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
    landed('onglet « Compétences » du journal', await page.evaluate(landing));
    await page.close();
  }
  if (problems.length) fail('liens vers une section', problems);
  ok('un lien vers une section ouvre la page sur elle, à la souris et au doigt, depuis le journal comme depuis l’extérieur');
} finally {
  await browser.close();
  server.close();
}

console.log('\nTout est en place.\n');
