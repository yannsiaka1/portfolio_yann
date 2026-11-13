// Rend le vrai symbole 3D (src/hero/scene.js) en images fixes, à partir du site construit : npm run symbole
//
//   src/assets/symbole/symbole-verre.webp   affiche du hero sur ordinateur (verre réfractif)
//   src/assets/symbole/symbole-metal.webp   affiche au toucher et sur petit écran (métal poli, celui des téléphones)
//   scripts/og/symbole.png                   le symbole seul, repris par l'image de partage
//   public/og/yann-siaka-3d.png              l'image de partage (LinkedIn, messageries), mise en page par
//                                            scripts/og/og-image.html
//
// L'affiche tient la place de la scène tant qu'elle n'est pas prête, et pour de bon sans carte graphique (robots,
// outils de mesure, accélération désactivée) : tout le monde voit le symbole en relief, jamais un dessin plat.
// La photo est cadrée sur la boîte où la scène pose le symbole, agrandie de --symbol-poster-w et --symbol-poster-h
// (src/styles/tokens.css, lus ici) : la feuille de style place l'affiche avec les mêmes jetons, au même endroit.
// Le fond devient transparent et les bords se fondent : la page se voit à travers, sans cadre ni halo, et les pistes
// du circuit s'estompent au lieu d'être coupées net.
//
// La scène refuse le rendu par le processeur (src/core/gpu.js). Ce script lève ce refus dans la copie servie à son
// propre navigateur, et seulement là : Chrome dessine alors la vraie scène sans carte graphique, lentement mais
// fidèlement, dans la pose fixe que voit un visiteur qui demande moins d'animations. Le reste de la page est masqué
// pendant la photo. Rien n'est écrit dans dist/ ; les quatre images ne le sont qu'une fois toutes réussies.
//
// À refaire quand le symbole change : npm run build, npm run symbole, puis npm run build de nouveau.
// Chrome requis, comme pour npm run verify (CHROME_PATH=/chemin/vers/chrome pour en désigner un).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'dist');
const POSTERS = join(ROOT, 'src/assets/symbole');
const OG = join(ROOT, 'scripts/og');
const VIEWPORT = { width: 1440, height: 900 };
const SCALE = 1.5; // la scène limite sa résolution à 1,5 fois la taille CSS : la photo la prend telle quelle
const FADE = 0.8; // les bords de l'affiche deviennent transparents à partir de 80 % de son ellipse
const KEY = [4, 10]; // écart au fond (sur 255) : transparent en dessous de 4, opaque au-delà de 10, fondu entre
const QUALITY = 0.82; // WebP

const fail = (message) => {
  console.error(`✗ ${message}`);
  process.exit(1);
};
if (!existsSync(join(DIST, 'index.html'))) fail('site non construit : lancer npm run build d’abord');

// taille de l'affiche par rapport au symbole : la même que celle de la feuille de style
const tokens = readFileSync(join(ROOT, 'src/styles/tokens.css'), 'utf8');
const ratio = (name) => {
  const m = tokens.match(new RegExp(`${name}:\\s*([\\d.]+)`));
  if (!m) fail(`jeton ${name} introuvable dans src/styles/tokens.css`);
  return parseFloat(m[1]);
};
const POSTER = { w: ratio('--symbol-poster-w'), h: ratio('--symbol-poster-h') };

let chromium;
try {
  ({ chromium } = await import('playwright-core'));
} catch (err) {
  fail('outils absents : lancer npm install (playwright-core est dans devDependencies)');
}

// le site construit, servi tel quel, sur cet ordinateur seulement
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webp': 'image/webp', '.png': 'image/png', '.mp4': 'video/mp4', '.json': 'application/json' };
const server = createServer((req, res) => {
  let path;
  try {
    path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch (err) {
    res.writeHead(400);
    return res.end();
  }
  let file = join(DIST, path);
  if (file !== DIST && !file.startsWith(DIST + sep)) file = join(DIST, '404.html');
  if (existsSync(file) && !extname(file)) file = join(file, 'index.html');
  if (!existsSync(file)) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
  res.end(readFileSync(file));
}).listen(0, '127.0.0.1');
await new Promise((resolve) => server.once('listening', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;

// WebGL par le moteur logiciel de Chrome (SwiftShader) : aucune carte graphique nécessaire
const args = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
let browser;
for (const opts of [process.env.CHROME_PATH && { executablePath: process.env.CHROME_PATH }, { channel: 'chrome' }, { channel: 'msedge' }, {}].filter(Boolean)) {
  try {
    browser = await chromium.launch({ ...opts, args });
    break;
  } catch (err) {
    /* navigateur suivant */
  }
}
if (!browser) {
  server.close();
  fail('aucun navigateur trouvé : installer Google Chrome, ou lancer CHROME_PATH=/chemin/vers/chrome npm run symbole');
}

// les deux refus du rendu logiciel, tels qu'ils sortent du build (src/core/gpu.js)
const REFUSALS = [
  ['failIfMajorPerformanceCaveat:!0', 'failIfMajorPerformanceCaveat:!1'],
  ['/swiftshader|llvmpipe|softpipe|software|basic render/i', '/(?!)/'],
];
const lifted = new Set();
class CaptureError extends Error {}
const isReady = (page) => page.evaluate(() => document.documentElement.classList.contains('gl-ready'));

/** Photographie la scène : renvoie la page (PNG en base64) et la boîte où la scène pose le symbole (le bouton
 *  invisible posé dessus), en pixels de la photo. */
async function shoot(touch) {
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: SCALE, reducedMotion: 'reduce', hasTouch: touch, isMobile: touch });
  try {
    await context.route('**/assets/*.js', async (route) => {
      const response = await route.fetch();
      let body = await response.text();
      for (const [from, to] of REFUSALS) {
        if (body.includes(from)) {
          body = body.split(from).join(to);
          lifted.add(from);
        }
      }
      await route.fulfill({ response, body });
    });
    const page = await context.newPage();
    await page.goto(`${origin}/`, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {
      throw new CaptureError('la page du site construit ne s’ouvre pas dans le navigateur de capture');
    });
    await page.waitForFunction(() => /\b(gl-ready|no-gl)\b/.test(document.documentElement.className), null, { timeout: 180000 }).catch(() => {
      throw new CaptureError('la scène 3D ne répond pas après trois minutes');
    });
    if (REFUSALS.some(([from]) => !lifted.has(from))) throw new CaptureError('les refus du rendu logiciel ont changé dans le build : adapter REFUSALS');
    if (!(await isReady(page))) throw new CaptureError('la scène 3D ne s’est pas lancée dans le navigateur de capture');
    await page.waitForTimeout(4000); // la pose fixe est atteinte
    const sym = await page.evaluate((scale) => {
      const r = document.getElementById('heroSymbol').getBoundingClientRect();
      return { x: r.x * scale, y: r.y * scale, w: r.width * scale, h: r.height * scale };
    }, SCALE);
    if (!sym.w || !sym.h) throw new CaptureError('la scène n’a pas placé le symbole (#heroSymbol)');
    await page.addStyleTag({ content: 'body *{visibility:hidden!important} #gl{visibility:visible!important} .grain{display:none!important}' });
    await page.waitForTimeout(500);
    // le garde-fou de la scène a pu l'arrêter pendant l'attente : la photo montrerait une zone vide
    if (!(await isReady(page))) throw new CaptureError('la scène 3D s’est arrêtée avant la photo (garde-fou de performance)');
    return { shot: (await page.screenshot()).toString('base64'), sym };
  } finally {
    await context.close();
  }
}

/** Dans le navigateur : cadre la photo sur la boîte du symbole agrandie (POSTER), vérifie que les panneaux du symbole
 *  (blocs épais, sans les traits fins du circuit) restent dans la partie opaque, rend le fond transparent, fond les
 *  bords et encode en WebP et en PNG. */
async function crop(shot, sym) {
  const page = await browser.newPage();
  try {
    return await page.evaluate(
      async ({ shot, sym, poster, fade, key, quality }) => {
        const img = new Image();
        img.src = `data:image/png;base64,${shot}`;
        await img.decode();
        const src = document.createElement('canvas');
        src.width = img.width;
        src.height = img.height;
        const ctx = src.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const { data, width } = ctx.getImageData(0, 0, img.width, img.height);
        const at = (x, y) => (y * width + x) * 4;
        const bg = [data[at(10, 10)], data[at(10, 10) + 1], data[at(10, 10) + 2]];
        const box = { w: Math.round(sym.w * poster.w), h: Math.round(sym.h * poster.h) };
        box.x = Math.round(sym.x + sym.w / 2 - box.w / 2);
        box.y = Math.round(sym.y + sym.h / 2 - box.h / 2);
        if (box.x < 0 || box.y < 0 || box.x + box.w > img.width || box.y + box.h > img.height) return { error: 'le cadre de l’affiche sort de la photo' };
        // rayon de l'ellipse inscrite dans le cadre, de 0 (centre) à 1 (bord)
        const radius = (x, y) => Math.hypot((x - box.x - box.w / 2) / (box.w / 2), (y - box.y - box.h / 2) / (box.h / 2));
        const differs = (x, y) => Math.max(Math.abs(data[at(x, y)] - bg[0]), Math.abs(data[at(x, y) + 1] - bg[1]), Math.abs(data[at(x, y) + 2] - bg[2])) > 12;
        // case de 8 × 8 px retenue si la plupart de ses points diffèrent du fond : un trait fin n'y suffit pas
        let reach = 0;
        let cells = 0;
        for (let by = 0; by + 8 <= img.height; by += 8) {
          for (let bx = 0; bx + 8 <= img.width; bx += 8) {
            let n = 0;
            for (let y = by; y < by + 8; y += 2) for (let x = bx; x < bx + 8; x += 2) if (differs(x, y)) n += 1;
            if (n < 12) continue;
            cells += 1;
            reach = Math.max(reach, radius(bx + 4, by + 4));
          }
        }
        if (!cells) return { error: 'symbole introuvable sur la photo' };
        if (reach > fade) return { error: `le symbole déborde de la partie opaque de l’affiche (${reach.toFixed(2)} > ${fade}) : agrandir --symbol-poster-w et --symbol-poster-h` };
        const dst = document.createElement('canvas');
        dst.width = box.w;
        dst.height = box.h;
        const out = dst.getContext('2d');
        out.drawImage(src, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
        // transparence : le fond disparaît (la page, de la même couleur, le remplace exactement), et hors de l'ellipse
        // inscrite tout s'efface progressivement à partir de `fade` de son rayon
        const pixels = out.getImageData(0, 0, box.w, box.h);
        const p = pixels.data;
        const smooth = (t) => t * t * (3 - 2 * t);
        for (let y = 0; y < box.h; y++) {
          for (let x = 0; x < box.w; x++) {
            const i = (y * box.w + x) * 4;
            const d = Math.max(Math.abs(p[i] - bg[0]), Math.abs(p[i + 1] - bg[1]), Math.abs(p[i + 2] - bg[2]));
            const keyed = Math.min(1, Math.max(0, (d - key[0]) / (key[1] - key[0])));
            const r = radius(box.x + x, box.y + y);
            const edge = r <= fade ? 1 : r >= 1 ? 0 : 1 - smooth((r - fade) / (1 - fade));
            p[i + 3] = Math.round(255 * keyed * edge);
          }
        }
        out.putImageData(pixels, 0, 0);
        return { box, reach, webp: dst.toDataURL('image/webp', quality), png: dst.toDataURL('image/png') };
      },
      { shot, sym, poster: POSTER, fade: FADE, key: KEY, quality: QUALITY },
    );
  } finally {
    await page.close();
  }
}

const decode = (url) => Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
const files = new Map();
const symbolPng = join(OG, 'symbole.png');
const previous = existsSync(symbolPng) ? readFileSync(symbolPng) : null;
let done = false;
try {
  for (const [name, touch] of [['verre', false], ['metal', true]]) {
    const { shot, sym } = await shoot(touch);
    const out = await crop(shot, sym);
    if (out.error) throw new CaptureError(`symbole-${name} : ${out.error}`);
    files.set(join(POSTERS, `symbole-${name}.webp`), decode(out.webp));
    if (name === 'verre') files.set(symbolPng, decode(out.png));
    console.log(`✓ symbole-${name}.webp : ${out.box.w} × ${out.box.h} px, ${Math.round(decode(out.webp).length / 1024)} ko ; le symbole tient dans ${Math.round(out.reach * 100)} % de l’ellipse`);
  }
  // l'image de partage, mise en page par scripts/og/og-image.html autour du nouveau symbole (écrit un instant pour
  // la mise en page, et remis tel quel si la suite échoue)
  writeFileSync(symbolPng, files.get(symbolPng));
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(join(OG, 'og-image.html')).href);
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForTimeout(300);
  files.set(join(ROOT, 'public/og/yann-siaka-3d.png'), await page.screenshot());
  mkdirSync(POSTERS, { recursive: true });
  for (const [file, data] of files) writeFileSync(file, data);
  done = true;
  console.log('✓ public/og/yann-siaka-3d.png : 1200 × 630 px');
  console.log('Reconstruire le site (npm run build) pour publier les nouvelles images.');
} catch (err) {
  console.error(`✗ ${err instanceof CaptureError ? err.message : `capture interrompue : ${err.message}`}`);
  process.exitCode = 1;
} finally {
  if (!done && previous) writeFileSync(symbolPng, previous);
  await browser.close();
  server.close();
}
