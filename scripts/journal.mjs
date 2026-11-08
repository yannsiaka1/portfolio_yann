// Journal : les notes écrites en Markdown dans content/journal/ deviennent des pages du site.
//
//   content/journal/fr/<adresse>.md   →  /journal/<adresse>/      note en français
//   content/journal/en/<adresse>.md   →  /en/journal/<adresse>/   note en anglais
//   même nom de fichier dans fr/ et en/ : deux versions d'une même note, reliées entre elles
//
// À chaque lancement de Vite (npm run dev, npm run build), ce module :
//   - écrit les pages des notes et les deux index dans journal/ et en/journal/ (dossiers générés, ignorés par Git) ;
//   - remplit la section Journal des deux pages d'accueil avec les trois dernières notes, ou la retire (avec son
//     lien du menu) tant qu'aucune note n'est publiée ;
//   - produit le flux Atom journal/feed.xml.
// Les pages reprennent la barre et le pied de page de l'accueil (index.html, en/index.html) : une seule source.
// Trois formats : la note courte (quelques lignes, lue directement dans la liste), l'article et la ressource (une vidéo
// ou une page à voir, avec ce que j'en retiens ; une vidéo YouTube se lit dans la note, chargée au clic).
// Brouillons (draft: true) : visibles avec npm run dev et sur les aperçus Vercel, jamais sur le site en ligne.
// Mode d'emploi pour écrire une note : content/journal/README.md
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, posix } from 'node:path';
import { Marked } from 'marked';
import { SITE_URL } from '../site.config.js';

const CONTENT = 'content/journal';
const LANGS = ['fr', 'en'];
const OUT = { fr: 'journal', en: 'en/journal' }; // dossiers générés, relatifs à la racine du site
const HOME = { fr: 'index.html', en: 'en/index.html' }; // pages d'accueil, sources de la barre et du pied de page
const MARK = '.genere-par-scripts-journal'; // témoin : seuls les dossiers qui le portent sont effacés et réécrits
const FEED = 'journal/feed.xml';
const LATEST = 3; // notes montrées sur l'accueil
const WORDS_PER_MINUTE = 200;
const KEYS = ['title', 'date', 'type', 'summary', 'lien', 'tags', 'draft'];
const TYPES = ['note', 'article', 'ressource']; // sans « type », une note est un article
// une vidéo YouTube (watch, youtu.be, shorts, embed, live) : son identifiant de 11 caractères
const YOUTUBE = /^https:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})(?![\w-])/;
// dossiers d'où une liste de notes est lue : les deux accueils et les deux index du journal
const LIST_DIRS = ['', 'en', 'journal', 'en/journal'];

// Noms propres et outils au nom de mot ordinaire : un traducteur automatique ne les touche pas (même liste que
// les pages d'accueil). Pour en protéger un autre dans une note : <span translate="no">Nom</span>.
const TERMS = [
  'Yann Johan Siaka Siaka', 'Yann Siaka', 'World Education Services', 'GitHub Projects', 'Search Console',
  'Mobile Money', 'Laravel Sail', 'Glorious Hall', 'Easy Life', 'EasyTravel', 'IncH Class', 'Precious',
  'Railway', 'Render', 'Resend', 'Postman', 'Payhip', 'Flask', 'Vite',
];

const TEXT = {
  fr: {
    htmlLang: 'fr-CA',
    locale: 'fr-CA',
    og: 'fr_CA',
    eyebrow: 'Journal',
    heading: 'Ce que j’apprends, <em>au jour le jour.</em>',
    intro: 'Une séance de code, une documentation lue, une vidéo regardée&nbsp;: j’en garde l’essentiel ici, en quelques lignes ou en article.',
    types: { note: 'Note', article: 'Article', video: 'Vidéo', ressource: 'Ressource' },
    watch: 'Lire la vidéo',
    watchHint: 'Elle se charge depuis YouTube quand vous cliquez.',
    watchOn: 'Voir sur YouTube',
    source: (host) => `Lire la ressource sur ${host}`,
    newTab: 'nouvel onglet',
    siteTitle: 'Journal de Yann Siaka',
    minutes: (n) => `${n}&nbsp;min de lecture`,
    draft: 'Brouillon',
    inOther: 'En anglais',
    tags: 'Sujets',
    all: 'Toutes les notes',
    feed: 'S’abonner au flux Atom',
    contact: 'Me contacter',
    translation: 'Read this note in English',
    promptBack: 'retour à l’accueil',
    ogAlt: 'Yann Siaka, développeur full-stack à Montréal. Votre vision devient mon objectif.',
    switchShort: 'EN',
    switchLong: 'English',
  },
  en: {
    htmlLang: 'en-CA',
    locale: 'en-CA',
    og: 'en_CA',
    eyebrow: 'Journal',
    heading: 'What I learn, <em>day by day.</em>',
    intro: 'A coding session, a doc I read, a video I watched: I keep the essentials here, in a few lines or a full article.',
    types: { note: 'Note', article: 'Article', video: 'Video', ressource: 'Resource' },
    watch: 'Play the video',
    watchHint: 'It loads from YouTube when you click.',
    watchOn: 'Watch on YouTube',
    source: (host) => `Read the resource on ${host}`,
    newTab: 'new tab',
    siteTitle: 'Yann Siaka’s journal',
    minutes: (n) => `${n}&nbsp;min read`,
    draft: 'Draft',
    inOther: 'In French',
    tags: 'Topics',
    all: 'All notes',
    feed: 'Subscribe to the Atom feed',
    contact: 'Contact me',
    translation: 'Lire cette note en français',
    promptBack: 'back to home',
    ogAlt: 'Yann Siaka, full-stack developer in Montréal. Your vision becomes my goal.',
    switchShort: 'FR',
    switchLong: 'Français',
  },
};

/* ---------- petits outils ---------- */

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const other = (lang) => (lang === 'fr' ? 'en' : 'fr');
/** Chemin relatif d'un dossier de page vers un dossier du site (« ../../journal/ ») ; '' désigne la racine. */
const rel = (from, to) => {
  const r = posix.relative(from || '.', to || '.');
  return r ? `${r}/` : './';
};
const slugify = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
/** Apostrophe typographique entre deux lettres (texte brut, ou HTML où marked l'écrit &#39;). */
const smart = (s) => String(s).replace(/([\p{L}\p{N}])(?:'|&#39;)(?=[\p{L}\p{N}])/gu, '$1’');
const formatDate = (iso, lang) =>
  new Intl.DateTimeFormat(TEXT[lang].locale, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));

/** Entités HTML écrites dans le Markdown (« &amp; », « &#39; »…), rendues en caractères. */
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decodeEntities = (s) =>
  s.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (m, e) => {
    if (e[0] !== '#') return ENTITIES[e.toLowerCase()] ?? m;
    const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
  });

/** Début du texte d'une note, sans Markdown ni HTML : la description d'une note courte qui n'a pas de résumé. */
function excerpt(md, max = 155) {
  const text = decodeEntities(
    md
      .replace(/```[\s\S]*?```/g, ' ') // blocs de code
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // liens : le texte reste
      .replace(/<((?:https?|mailto):[^>\s]+)>/gi, '$1') // liens automatiques <https://…> : l'adresse reste
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/?[a-z][^>]*>/gi, '') // balises écrites dans la note (<span translate="no">…) : le texte reste
      .replace(/^[ \t]*(?:>[ \t]?)+/gm, '') // citations
      .replace(/^#{1,6}[ \t]+/gm, '') // intertitres
      .replace(/[`*|]/g, ''), // code en ligne, gras et italique, tableaux
  )
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= max) return text;
  // coupe au dernier espace ; un premier mot plus long que la description (une adresse) est coupé net
  const space = text.lastIndexOf(' ', max);
  let end = space > 0 ? space : max;
  if (/[\uD800-\uDBFF]/.test(text[end - 1])) end -= 1; // jamais au milieu d'un émoji
  return `${text.slice(0, end).replace(/[\s,;:.!?–—-]+$/, '')}…`;
}

/** Données structurées (schema.org) dans la page : « </ » échappé, un texte ne peut pas fermer la balise. */
const jsonLd = (data) => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

/** Photo JPEG tournée d'un quart de tour par son orientation EXIF (5 à 8, fréquent sur téléphone) : le navigateur
 *  l'affiche tournée, largeur et hauteur échangées. t : début de l'en-tête TIFF, dans le segment APP1. */
function exifQuarterTurn(b, t) {
  const le = b.toString('ascii', t, t + 2) === 'II';
  const u16 = (o) => (le ? b.readUInt16LE(o) : b.readUInt16BE(o));
  const ifd = t + (le ? b.readUInt32LE(t + 4) : b.readUInt32BE(t + 4));
  for (let k = 0, n = u16(ifd); k < n; k++) {
    const entry = ifd + 2 + k * 12;
    if (u16(entry) === 0x0112) return u16(entry + 8) >= 5 && u16(entry + 8) <= 8;
  }
  return false;
}

/** Largeur et hauteur affichées d'une image WebP, PNG, JPEG ou GIF, lues dans son en-tête (null pour un autre format).
 *  Un fichier tronqué lève une erreur : l'appelant la rattache à sa note. */
function imageSize(file) {
  const b = readFileSync(file);
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = b.toString('ascii', 12, 16);
    if (chunk === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
    if (chunk === 'VP8L') return { w: 1 + (((b[22] & 0x3f) << 8) | b[21]), h: 1 + (((b[24] & 0xf) << 10) | (b[23] << 2) | ((b[22] & 0xc0) >> 6)) };
    if (chunk === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
  }
  if (b.readUInt32BE(0) === 0x89504e47) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  if (b.toString('ascii', 0, 3) === 'GIF') return { w: b.readUInt16LE(6), h: b.readUInt16LE(8) };
  if (b[0] === 0xff && b[1] === 0xd8) {
    let turned = false;
    for (let i = 2; i + 9 < b.length; ) {
      const marker = b[i + 1];
      // l'orientation (segment APP1 « Exif ») précède toujours les dimensions
      if (marker === 0xe1 && b.toString('latin1', i + 4, i + 10) === 'Exif\0\0') turned = exifQuarterTurn(b, i + 10);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        const w = b.readUInt16BE(i + 7);
        const h = b.readUInt16BE(i + 5);
        return turned ? { w: h, h: w } : { w, h };
      }
      i += 2 + b.readUInt16BE(i + 2);
    }
    throw new Error('JPEG sans dimensions');
  }
  return null;
}

class NoteError extends Error {
  constructor(file, message) {
    super(`${file} : ${message}`);
  }
}

// la liste de l'accueil, où une note courte se lit en entier, est écrite après le traitement des fichiers par Vite :
// une image n'y serait pas publiée
const NOTE_IMAGE = 'une note courte n’a pas d’image : elle se lit aussi sur la page d’accueil. Passer en « type: article » pour garder l’image.';

/* ---------- texte courant : noms protégés, typographie ---------- */

const PROTECTED = new RegExp(
  `(?<![\\w@.-])(${TERMS.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}|[\\w.+-]+@[\\w-]+(?:\\.[\\w-]+)+)(?![\\w-])`,
  'g',
);
const SKIP = new Set(['title', 'script', 'style', 'code', 'pre', 'svg', 'textarea']);
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

/** Dans le texte (jamais dans le code ni les attributs) : noms propres protégés, apostrophe typographique ;
 *  en français, espace insécable avant le deux-points et dans les guillemets, comme le reste du site. */
function polish(html, lang) {
  const out = [];
  const stack = [];
  for (const [tok] of html.matchAll(/<!--[\s\S]*?-->|<![^>]*>|<[^>]+>|[^<]+/g)) {
    if (tok.startsWith('<!')) out.push(tok);
    else if (tok.startsWith('</')) {
      const name = tok.slice(2, -1).trim().toLowerCase();
      while (stack.length && stack.pop()[0] !== name);
      out.push(tok);
    } else if (tok.startsWith('<')) {
      const name = (/^<\s*([a-zA-Z][\w-]*)/.exec(tok) || [])[1];
      if (name && !VOID.has(name.toLowerCase()) && !tok.endsWith('/>')) {
        stack.push([name.toLowerCase(), SKIP.has(name.toLowerCase()) || /\stranslate="no"/.test(tok)]);
      }
      out.push(tok);
    } else if (stack.some(([, blocked]) => blocked)) out.push(tok);
    else {
      let text = smart(tok);
      if (lang === 'fr') text = text.replace(/ :/g, ' :').replace(/« /g, '« ').replace(/ »/g, ' »');
      out.push(text.replace(PROTECTED, '<span translate="no">$1</span>'));
    }
  }
  return out.join('');
}

/* ---------- lecture des notes ---------- */

/** Une valeur entre guillemets droits perd ses guillemets, sauf si le même guillemet revient à l'intérieur
 *  (« 'x' et 'y' » reste tel quel) ; l'apostrophe d'un mot (« L'IA ») n'est jamais un guillemet. */
const unquote = (s) => {
  const q = /^"([^"]*)"$|^'([^']*)'$/.exec(s);
  return q ? (q[1] ?? q[2]) : s;
};

/** Liste « [a, "b, c", d] » : une virgule entre guillemets ne coupe pas le sujet. */
function splitList(s) {
  const items = [];
  let cur = '';
  let quote = '';
  for (const ch of s) {
    if (quote) {
      cur += ch;
      if (ch === quote) quote = '';
    } else if ((ch === '"' || ch === "'") && !cur.trim()) {
      quote = ch;
      cur += ch;
    } else if (ch === ',') {
      items.push(cur);
      cur = '';
    } else cur += ch;
  }
  items.push(cur);
  return items.map((t) => unquote(t.trim())).filter(Boolean);
}

function parseFrontMatter(src, file) {
  const m = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(src);
  if (!m) throw new NoteError(file, 'la note doit commencer par son en-tête, entre deux lignes « --- » (voir content/journal/modele.md).');
  const data = {};
  m[1].split(/\r?\n/).forEach((line, i) => {
    if (!line.trim() || line.trim().startsWith('#')) return;
    const kv = /^([A-Za-z]+)\s*:\s*(.*)$/.exec(line);
    if (!kv) throw new NoteError(file, `ligne ${i + 2} de l’en-tête illisible : « ${line.trim()} ». Écrire « clé: valeur ».`);
    const raw = kv[2].trim();
    data[kv[1]] = /^\[.*\]$/.test(raw) ? splitList(raw.slice(1, -1)) : raw === 'true' ? true : raw === 'false' ? false : unquote(raw);
  });
  return { data, body: src.slice(m[0].length) };
}

function validate(data, file, name) {
  const fail = (msg) => {
    throw new NoteError(file, msg);
  };
  const slug = name.replace(/\.md$/, '');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    fail(`le nom du fichier devient l’adresse de la note : minuscules, chiffres et tirets seulement. Renommer en « ${slugify(slug) || 'ma-note'}.md ».`);
  }
  const unknown = Object.keys(data).find((k) => !KEYS.includes(k));
  if (unknown) fail(`clé inconnue « ${unknown} » dans l’en-tête. Clés possibles : ${KEYS.join(', ')}.`);
  if (typeof data.title !== 'string' || !data.title) fail('il manque le titre : « title: Mon titre ».');
  if (data.type !== undefined && !TYPES.includes(data.type)) {
    fail(`« type » vaut note (quelques lignes), article ou ressource (une vidéo ou une page à voir) ; reçu : « ${data.type} ».`);
  }
  const type = data.type || 'article';
  // une note courte peut se passer de résumé : son début sert de description
  if (type !== 'note' && (typeof data.summary !== 'string' || !data.summary)) {
    fail('il manque le résumé : « summary: Une ou deux phrases. » Il s’affiche dans les listes et les aperçus de partage.');
  }
  if (data.summary !== undefined && typeof data.summary !== 'string') fail('le résumé s’écrit sur une ligne : « summary: Une ou deux phrases. »');
  if (type === 'ressource' && !data.lien) {
    fail('une ressource a besoin de son lien : « lien: https://… » (une vidéo YouTube se lit alors directement dans la note).');
  }
  if (data.lien !== undefined) {
    let ok = false;
    try {
      ok = new URL(data.lien).protocol === 'https:';
    } catch (err) {
      ok = false;
    }
    if (!ok) fail(`le lien s’écrit en adresse complète, en https : « lien: https://www.youtube.com/watch?v=… » (reçu : « ${data.lien} »).`);
  }
  const okDate = typeof data.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data.date) &&
    new Date(`${data.date}T00:00:00Z`).toISOString().startsWith(data.date);
  if (!okDate) fail(`la date s’écrit AAAA-MM-JJ, par exemple « date: 2026-11-06 » (reçu : « ${data.date ?? ''} »).`);
  if (data.tags !== undefined && !Array.isArray(data.tags)) fail('les sujets s’écrivent entre crochets : « tags: [veille, laravel] ».');
  if (data.draft !== undefined && typeof data.draft !== 'boolean') fail('« draft » vaut true (brouillon) ou false (publiée).');
  return slug;
}

function readNotes(root, { drafts, strict, log }) {
  const notes = [];
  for (const lang of LANGS) {
    const dir = join(root, CONTENT, lang);
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir).sort()) {
      if (!name.endsWith('.md')) continue;
      const file = posix.join(CONTENT, lang, name);
      try {
        const src = readFileSync(join(dir, name), 'utf8');
        const { data, body } = parseFrontMatter(src, file);
        const slug = validate(data, file, name);
        if (data.draft && !drafts) continue;
        const type = data.type || 'article';
        // une note courte se lit d'un trait dans la liste : pas d'intertitre (les blocs de code ne comptent pas) ; ni
        // d'image, vérifié au rendu (renderBody et journal())
        if (type === 'note' && /^#{1,6}\s/m.test(body.replace(/```[\s\S]*?```/g, ''))) {
          throw new NoteError(file, 'une note courte se lit d’un trait, sans intertitre : retirer les « ## », ou passer en « type: article ».');
        }
        const words = body.split(/\s+/).filter(Boolean).length;
        notes.push({
          lang, slug, file, body, type,
          title: data.title,
          date: data.date,
          summary: data.summary || '',
          description: data.summary || excerpt(body),
          lien: data.lien || null,
          video: data.lien ? (YOUTUBE.exec(data.lien) || [])[1] || null : null,
          host: data.lien ? new URL(data.lien).hostname.replace(/^www\./, '') : null,
          tags: data.tags || [],
          draft: !!data.draft,
          minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
          dir: `${OUT[lang]}/${slug}`,
        });
      } catch (err) {
        if (strict) throw err;
        log(err.message);
      }
    }
  }
  notes.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
  for (const n of notes) n.translation = notes.find((o) => o.slug === n.slug && o.lang !== n.lang) || null;
  return notes;
}

/* ---------- Markdown → HTML ---------- */

const isExternal = (href) => /^[a-z][a-z0-9+.-]*:/i.test(href) && !/^mailto:|^tel:/i.test(href);
const isRelative = (href) => !/^([a-z][a-z0-9+.-]*:|\/|#)/i.test(href);

/** Texte d'une note en HTML. fromDir : dossier de la page qui l'affiche (sa propre page, ou une liste pour une note
 *  courte, lue en entier dans la liste) ; les liens vers d'autres notes et vers des fichiers en partent. */
function renderBody(note, notes, root, fromDir = note.dir) {
  const mdDir = posix.dirname(note.file);
  const ids = new Map();
  const marked = new Marked({
    gfm: true,
    renderer: {
      // « ## » ouvre une partie : le titre de la note est le seul h1 de la page
      heading({ tokens, depth }) {
        const inner = this.parser.parseInline(tokens);
        const base = slugify(this.parser.parseInline(tokens, this.parser.textRenderer)) || 'partie';
        const n = (ids.get(base) || 0) + 1;
        ids.set(base, n);
        const level = Math.min(6, Math.max(2, depth));
        return `<h${level} id="${n > 1 ? `${base}-${n}` : base}">${inner}</h${level}>\n`;
      },
      code({ text, escaped }) {
        return `<pre class="code" translate="no"><code>${escaped ? text : esc(text)}</code></pre>\n`;
      },
      codespan({ text }) {
        return `<code translate="no">${esc(text)}</code>`;
      },
      link({ href, title, tokens }) {
        const inner = this.parser.parseInline(tokens);
        const t = title ? ` title="${esc(smart(title))}"` : '';
        // lien vers une autre note : « autre-note.md » ou « ../en/autre-note.md »
        const md = isRelative(href) && /^(?:\.\/)?(?:\.\.\/(fr|en)\/)?([a-z0-9-]+)\.md(#[\w-]*)?$/.exec(href);
        if (md) {
          const lang = md[1] || note.lang;
          const target = notes.find((o) => o.lang === lang && o.slug === md[2]);
          if (!target) throw new NoteError(note.file, `lien vers une note introuvable : « ${href} ».`);
          return `<a href="${rel(fromDir, target.dir)}${md[3] || ''}"${t}${lang !== note.lang ? ` hreflang="${lang}"` : ''}>${inner}</a>`;
        }
        // lien vers un fichier (« .pdf », « .png »…) : il doit exister dans public/, visé depuis la page de la note
        const file = isRelative(href) && href.split(/[?#]/)[0];
        if (file && /\.[a-z0-9]+$/i.test(file)) {
          const site = posix.normalize(posix.join(note.dir, file));
          if (site.startsWith('..') || !existsSync(join(root, 'public', site))) {
            throw new NoteError(note.file, `lien vers un fichier introuvable : « ${href} ». Une image s’écrit ![description](../images/nom.webp) ; un autre fichier se range dans public/ et se vise depuis la page de la note, par exemple « ../../cv/yann-siaka-cv.pdf ».`);
          }
          if (fromDir !== note.dir) return `<a href="${esc(posix.relative(fromDir || '.', site) + href.slice(file.length))}"${t}>${inner}</a>`;
        }
        if (isExternal(href)) {
          const tab = note.lang === 'fr' ? 'nouvel onglet' : 'new tab';
          return `<a class="ext" href="${esc(href)}"${t} target="_blank" rel="noopener">${inner}<span class="sr-only"> (${tab})</span></a>`;
        }
        return `<a href="${esc(href)}"${t}>${inner}</a>`;
      },
      // une image à côté de la note (« ../images/capture.webp ») est vérifiée, puis confiée à Vite qui l'optimise
      image({ href, title, text }) {
        if (note.type === 'note') throw new NoteError(note.file, NOTE_IMAGE); // Markdown en ligne ou par référence
        let src = href;
        let size = null;
        if (isRelative(href)) {
          const path = posix.normalize(posix.join(mdDir, href));
          if (!existsSync(join(root, path))) throw new NoteError(note.file, `image introuvable : « ${href} » (cherchée dans ${path}).`);
          src = `/${path}`;
          try {
            size = imageSize(join(root, path));
          } catch (err) {
            throw new NoteError(note.file, `image illisible : « ${href} » (fichier vide ou tronqué ?). L’exporter de nouveau, en WebP de préférence.`);
          }
        }
        // ses dimensions réservent sa place avant le chargement : le texte en dessous ne saute pas
        const dims = size ? ` width="${size.w}" height="${size.h}"` : '';
        const caption = title ? `<figcaption>${esc(smart(title))}</figcaption>` : '';
        return `<figure class="prose__figure"><img src="${esc(src)}" alt="${esc(smart(text || ''))}"${dims} loading="lazy" decoding="async">${caption}</figure>`;
      },
      table(token) {
        // un tableau trop large défile dans son cadre, que l'on peut atteindre au clavier
        const label = note.lang === 'fr' ? 'Tableau' : 'Table';
        return `<div class="prose__table" role="region" aria-label="${label}" tabindex="0">${marked.Renderer.prototype.table.call(this, token)}</div>\n`;
      },
    },
  });
  let parsed;
  try {
    parsed = marked.parse(note.body);
  } catch (err) {
    // marked ajoute « Please report this to … » à toute erreur levée dans un rendu : inutile pour l'auteur d'une note
    err.message = err.message.replace(/\s*Please report this to https:\/\/github\.com\/markedjs\/marked\.?\s*$/, '');
    throw err;
  }
  // une image seule dans son paragraphe devient une figure, pas un paragraphe
  const html = parsed.replace(/<p>(<figure class="prose__figure">[\s\S]*?<\/figure>)<\/p>/g, '$1');
  return polish(html, note.lang);
}

/* ---------- morceaux de page ---------- */

/** Barre, pied de page, lien d'évitement et grain, repris de la page d'accueil de la langue, liens réécrits
 *  depuis le dossier de la page générée. */
function chrome(root, lang, pageDir, counterpart, current) {
  const file = HOME[lang];
  const src = readFileSync(join(root, file), 'utf8');
  const pick = (re, what) => {
    const m = re.exec(src);
    if (!m) throw new Error(`${file} : ${what} introuvable. Le journal reprend la barre et le pied de page de l’accueil.`);
    return m[0];
  };
  const T = TEXT[lang];
  const srcDir = lang === 'fr' ? '' : 'en';
  const toHome = rel(pageDir, srcDir);
  // le lien de la section du menu porte aria-current : « page » sur l'index du journal, « true » sur une note
  const journalDir = OUT[lang];
  const fix = (html) =>
    html
      .replace(/<!-- journal:(start|end) -->/g, '')
      // fichiers du site (CV…) : chemins recalculés depuis le dossier de la page
      .replace(/(href|src)="(\.\.?\/[^"#]*)"/g, (m, attr, url) => {
        const target = posix.normalize(posix.join(srcDir || '.', url));
        return `${attr}="${rel(pageDir, target === '.' || target === './' ? '' : target).replace(/\/$/, url.endsWith('/') ? '/' : '')}"`;
      })
      // bouton et lien de langue : vers la même page dans l'autre langue (après le calcul ci-dessus, déjà relatif)
      .replace(/href="[^"]*"(\s+hreflang=")/g, `href="${counterpart}"$1`)
      .replace(/href="#journal"/g, `href="${rel(pageDir, journalDir)}" aria-current="${current}"`)
      .replace(/href="#accueil"/g, `href="${toHome}"`)
      .replace(/href="#(?!main")([\w-]+)"/g, `href="${toHome}#$1"`);
  const header = fix(pick(/<header class="site-header">[\s\S]*?<\/header>/, 'la barre (<header class="site-header">)'))
    // l'invite mène à l'accueil : son texte lu seulement le dit (le texte visible reste le début de son nom)
    .replace(/(<a class="prompt"[^>]*>[\s\S]*?<span class="sr-only">, )[^<]*(<\/span>)/, `$1${T.promptBack}$2`)
    .replace(/(<span class="prompt__path" id="navPath">)[^<]*(<\/span>)/, '$1~/journal$2')
    // dans une section, l'invite se raccourcit sur petit écran (layout.css) : écrit dans la page, pour que la barre ne
    // passe pas sur deux lignes avant que le script ne s'en charge (le contenu sauterait au chargement)
    .replace('<a class="prompt"', '<a class="prompt is-deep"');
  const footer = fix(
    pick(/<footer class="site-footer">[\s\S]*?<\/footer>/, 'le pied de page (<footer class="site-footer">)')
      .replace(/\s*<p class="signature"[\s\S]*?<\/p>/, '')
      .replace(/href="#accueil"/g, 'href="#main"'),
  );
  return {
    skip: pick(/<a class="btn btn--secondary skip-link"[^>]*>[^<]*<\/a>/, 'le lien d’évitement'),
    grain: pick(/<div class="grain"[^>]*><\/div>/, 'le grain'),
    header,
    footer,
  };
}

/** Une page du journal. path : son adresse depuis la racine du site (« journal/ma-note/ ») ; alternate : celle de sa
 *  version dans l'autre langue, s'il y en a une. Les adresses complètes partent de __SITE_URL__ (site.config.js). */
function page({ root, lang, dir, path, alternate, title: rawTitle, description: rawDescription, counterpart, current, main, type, robots, published, data }) {
  const T = TEXT[lang];
  const title = smart(rawTitle);
  const description = smart(rawDescription);
  const c = chrome(root, lang, dir, counterpart, current);
  const toRoot = rel(dir, '');
  const url = `__SITE_URL__/${path}`;
  const meta = [
    `<link rel="canonical" href="${url}">`,
    ...(alternate
      ? [`<link rel="alternate" hreflang="${T.htmlLang}" href="${url}">`, `<link rel="alternate" hreflang="${TEXT[other(lang)].htmlLang}" href="__SITE_URL__/${alternate}">`]
      : []),
    `<meta property="og:type" content="${type}">`,
    `<meta property="og:site_name" content="Yann Siaka">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:locale" content="${T.og}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:image" content="__SITE_URL__/og/yann-siaka.png">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="${esc(T.ogAlt)}">`,
    published ? `<meta property="article:published_time" content="${published}">` : '',
    robots ? `<meta name="robots" content="${robots}">` : '',
    data ? jsonLd(data) : '',
  ].filter(Boolean);
  return `<!doctype html>
<!-- Page générée par scripts/journal.mjs depuis content/journal/ : modifier la note, pas ce fichier. -->
<html lang="${T.htmlLang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="theme-color" content="#121211">
  ${meta.join('\n  ')}
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="alternate" type="application/atom+xml" title="${esc(T.siteTitle)}" vite-ignore href="${toRoot}${FEED}">
  <!-- même script que sur l'accueil, à l'octet près : son empreinte est autorisée par la politique de sécurité -->
  <script>document.documentElement.classList.add('js')</script>
  <script type="module" src="/src/journal.js"></script>
</head>
<body>
${c.skip}
${c.grain}

${c.header}

<main id="main" tabindex="-1" data-path="~/journal">
${main}
</main>

${c.footer}
</body>
</html>
`;
}

/** Format, date et, pour un article, durée de lecture (une note courte se lit d'un coup d'œil, une ressource renvoie
 *  à une vidéo ou à une page : pas de durée). */
function meta(n, lang) {
  const T = TEXT[lang];
  const kind = n.type === 'ressource' && n.video ? 'video' : n.type;
  return [
    `<span class="notes__type">${T.types[kind]}</span>`,
    `<time datetime="${n.date}">${formatDate(n.date, lang)}</time>`,
    n.type === 'article' ? `<span>${T.minutes(n.minutes)}</span>` : '',
    n.type === 'ressource' && !n.video ? `<span translate="no">${esc(n.host)}</span>` : '',
  ].join('');
}

/** Liste de notes : l'accueil (titres h3, sous la section) et l'index du journal (titres h2, sous le h1). */
function list(notes, lang, fromDir, level) {
  const T = TEXT[lang];
  const items = notes.map((n) => {
    const foreign = n.lang !== lang;
    const langAttr = foreign ? ` lang="${TEXT[n.lang].htmlLang}"` : '';
    const badges = [
      n.draft ? `<span class="notes__badge notes__badge--draft">${T.draft}</span>` : '',
      foreign ? `<span class="notes__badge">${T.inOther}</span>` : '',
    ].join('');
    const tags = n.tags.length
      ? `\n        <ul class="tools notes__tags" role="list" aria-label="${T.tags}">${n.tags.map((t) => `<li${langAttr}>${esc(smart(t))}</li>`).join('')}</ul>`
      : '';
    // une note courte se lit en entier dans la liste ; un article et une ressource montrent leur résumé
    const body = n.type === 'note'
      ? `<div class="notes__body prose"${langAttr}>\n${n.listHtml[fromDir]}\n        </div>`
      : `<p class="notes__summary"${langAttr}>${polish(esc(n.summary), n.lang)}</p>`;
    return `      <li class="notes__item notes__item--${n.type}">
        <h${level} class="notes__title"><a class="notes__link" href="${rel(fromDir, n.dir)}"${foreign ? ` hreflang="${TEXT[n.lang].htmlLang}"` : ''}${langAttr}>${polish(esc(n.title), n.lang)}</a></h${level}>
        <p class="notes__meta">${meta(n, lang)}${badges}</p>
        ${body}${tags}
      </li>`;
  });
  return `<ol class="notes" role="list">\n${items.join('\n')}\n    </ol>`;
}

/** Les notes d'une langue, plus celles de l'autre langue qui n'y ont pas de version. */
const notesFor = (notes, lang) => notes.filter((n) => n.lang === lang || !n.translation);

function indexPage(root, notes, lang) {
  const T = TEXT[lang];
  const dir = OUT[lang];
  const shown = notesFor(notes, lang);
  const main = `  <section class="section journal" aria-labelledby="journal-title">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">${T.eyebrow}</p>
        <h1 class="journal__title" id="journal-title">${T.heading}</h1>
        <p class="section-head__intro">${T.intro}</p>
      </div>
    ${list(shown, lang, dir, 2)}
      <p class="journal__feed"><a class="link link--standalone" href="${rel(dir, '')}${FEED}" type="application/atom+xml">${T.feed}</a></p>
    </div>
  </section>`;
  return page({
    root, lang, dir, main,
    path: `${dir}/`,
    alternate: `${OUT[other(lang)]}/`,
    title: T.siteTitle,
    description: T.intro.replace(/&nbsp;/g, ' '),
    counterpart: rel(dir, OUT[other(lang)]),
    current: 'page',
    type: 'website',
  });
}

function notePage(root, note, notes) {
  const lang = note.lang;
  const T = TEXT[lang];
  const twin = note.translation;
  const counterpart = twin ? rel(note.dir, twin.dir) : rel(note.dir, OUT[other(lang)]);
  const tags = note.tags.length
    ? `\n          <ul class="tools notes__tags" role="list" aria-label="${T.tags}">${note.tags.map((t) => `<li>${esc(smart(t))}</li>`).join('')}</ul>`
    : '';
  const translation = twin
    ? `\n          <p class="note__translation"><a class="link link--standalone" href="${counterpart}" hreflang="${TEXT[twin.lang].htmlLang}" lang="${TEXT[twin.lang].htmlLang}">${T.translation}</a></p>`
    : '';
  // une vidéo YouTube : un lien vers YouTube, que src/ui/video.js remplace au clic par le lecteur (rien n'est chargé
  // depuis YouTube avant ce clic) ; une autre ressource : un lien vers la page
  const resource = note.video
    ? `
      <div class="video">
        <a class="video__link" href="https://www.youtube.com/watch?v=${note.video}" target="_blank" rel="noopener" data-video="${note.video}" data-title="${esc(smart(note.title))}">
          <span class="video__play" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M8.5 5.75v12.5L18.25 12z" fill="currentColor"/></svg></span>
          <span class="video__text"><span class="video__label">${T.watch}</span><span class="video__hint">${T.watchHint}</span></span><span class="sr-only video__tab"> (YouTube, ${T.newTab})</span>
        </a>
      </div>
      <p class="note__source"><a class="link link--standalone ext" href="https://www.youtube.com/watch?v=${note.video}" target="_blank" rel="noopener">${T.watchOn}<span class="sr-only"> (${T.newTab})</span></a></p>`
    : note.lien
      ? `
      <p class="note__source"><a class="link link--standalone ext" href="${esc(note.lien)}" target="_blank" rel="noopener">${T.source(`<span translate="no">${esc(note.host)}</span>`)}<span class="sr-only"> (${T.newTab})</span></a></p>`
      : '';
  const main = `  <article class="section note note--${note.type}" aria-labelledby="note-title">
    <div class="container">
      <header class="note__head">
        <p class="eyebrow"><a class="note__crumb" href="${rel(note.dir, OUT[lang])}">${T.eyebrow}</a></p>
        <h1 class="note__title" id="note-title">${polish(esc(note.title), lang)}</h1>${note.summary ? `
        <p class="note__summary">${polish(esc(note.summary), lang)}</p>` : ''}
        <p class="notes__meta">${meta(note, lang)}${note.draft ? `<span class="notes__badge notes__badge--draft">${T.draft}</span>` : ''}</p>${tags}${translation}
      </header>${resource}
      <div class="prose">
${note.html}
      </div>
      <footer class="note__foot">
        <a class="link link--standalone" href="${rel(note.dir, OUT[lang])}">${T.all}</a>
        <a class="btn btn--secondary" href="${rel(note.dir, lang === 'fr' ? '' : 'en')}#contact">${T.contact}</a>
      </footer>
    </div>
  </article>`;
  const path = `${note.dir}/`;
  return page({
    root, lang, main, path,
    dir: note.dir,
    alternate: twin ? `${twin.dir}/` : null,
    title: `${note.title} · ${T.siteTitle}`,
    description: note.description,
    counterpart,
    current: 'true',
    type: 'article',
    robots: note.draft ? 'noindex' : '',
    published: note.date,
    data: note.draft
      ? null
      : {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: smart(note.title),
          description: smart(note.description),
          datePublished: note.date,
          inLanguage: T.htmlLang,
          url: `__SITE_URL__/${path}`,
          mainEntityOfPage: `__SITE_URL__/${path}`,
          image: '__SITE_URL__/og/yann-siaka.png',
          author: { '@type': 'Person', name: 'Yann Siaka', url: '__SITE_URL__/' },
        },
  });
}

function feed(notes) {
  const site = SITE_URL.replace(/\/$/, '');
  const published = notes.filter((n) => !n.draft);
  const updated = published.length ? `${published[0].date}T00:00:00Z` : new Date().toISOString();
  const entries = published.map(
    (n) => `  <entry xml:lang="${TEXT[n.lang].htmlLang}">
    <title>${esc(smart(n.title))}</title>
    <link href="${site}/${n.dir}/"/>
    <id>${site}/${n.dir}/</id>
    <published>${n.date}T00:00:00Z</published>
    <updated>${n.date}T00:00:00Z</updated>
    <summary>${esc(smart(n.description))}</summary>
  </entry>`,
  );
  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="fr-CA">
  <title>${esc(TEXT.fr.siteTitle)}</title>
  <subtitle>${esc(TEXT.fr.intro.replace(/&nbsp;/g, ' '))}</subtitle>
  <link href="${site}/journal/"/>
  <link rel="self" href="${site}/${FEED}"/>
  <id>${site}/journal/</id>
  <updated>${updated}</updated>
  <author><name>Yann Siaka</name></author>
${entries.join('\n')}
</feed>
`;
}

/** Section Journal d'une page d'accueil : remplie avec les dernières notes, ou retirée (et son lien du menu). */
function fillHome(html, notes, lang) {
  if (!notes.length) return html.replace(/[ \t]*<!-- journal:start -->[\s\S]*?<!-- journal:end -->\n?/g, '');
  const homeDir = lang === 'fr' ? '' : 'en';
  return html
    .replace(/<!-- journal:(start|end) -->/g, '')
    .replace('<!-- journal:latest -->', list(notesFor(notes, lang).slice(0, LATEST), lang, homeDir, 3));
}

/* ---------- génération et extension Vite ---------- */

function writePages(root, notes) {
  for (const lang of LANGS) {
    const dir = join(root, OUT[lang]);
    if (existsSync(dir)) {
      if (!existsSync(join(dir, MARK))) {
        throw new Error(`${OUT[lang]}/ existe déjà sans avoir été créé par le journal : le déplacer, le générateur réécrit ce dossier à chaque lancement.`);
      }
      rmSync(dir, { recursive: true, force: true });
    }
  }
  const inputs = {};
  if (!notes.length) return inputs;
  const write = (path, html) => {
    mkdirSync(join(root, posix.dirname(path)), { recursive: true });
    writeFileSync(join(root, path), html);
    inputs[`journal:${path}`] = join(root, path);
  };
  for (const lang of LANGS) {
    mkdirSync(join(root, OUT[lang]), { recursive: true });
    writeFileSync(join(root, OUT[lang], MARK), 'Dossier généré par scripts/journal.mjs depuis content/journal/ : ne rien y modifier.\n');
    write(`${OUT[lang]}/index.html`, indexPage(root, notes, lang));
  }
  for (const n of notes) write(`${n.dir}/index.html`, notePage(root, n, notes));
  return inputs;
}

/**
 * Génère le journal et renvoie { inputs, plugin } : les pages à ajouter aux entrées du build, et l'extension Vite
 * qui remplit les pages d'accueil, sert et émet le flux, et régénère tout quand une note change (npm run dev).
 * drafts : inclure les brouillons ; strict : une note invalide arrête le build au lieu d'être sautée.
 */
export function journal({ root, drafts, strict }) {
  const log = (msg) => console.error(`\n[journal] ${msg}\n`);
  let notes = [];
  const build = () => {
    const all = readNotes(root, { drafts, strict, log });
    // une image ou un lien introuvable : le build s'arrête ; en développement, la note est mise de côté
    notes = all.filter((n) => {
      try {
        n.html = renderBody(n, all, root);
        // une image écrite en HTML dans une note courte (<img>) : le code, échappé, ne compte pas
        if (n.type === 'note' && /<img\b/i.test(n.html)) throw new NoteError(n.file, NOTE_IMAGE);
        if (n.type === 'note') n.listHtml = Object.fromEntries(LIST_DIRS.map((d) => [d, renderBody(n, all, root, d)]));
        return true;
      } catch (err) {
        if (strict) throw err;
        log(err.message);
        return false;
      }
    });
    for (const n of notes) n.translation = notes.find((o) => o.slug === n.slug && o.lang !== n.lang) || null;
    return writePages(root, notes);
  };
  let inputs;
  try {
    inputs = build();
  } catch (err) {
    if (strict) throw err;
    log(err.message);
    inputs = {};
  }

  const plugin = {
    name: 'journal',
    transformIndexHtml(html, ctx) {
      const lang = Object.keys(HOME).find((l) => ctx.path === `/${HOME[l]}`);
      return lang ? fillHome(html, notes, lang) : html;
    },
    generateBundle() {
      // un brouillon n'entre jamais dans le flux, mais le flux existe dès que le journal existe (liens valides)
      if (notes.length) this.emitFile({ type: 'asset', fileName: FEED, source: feed(notes) });
    },
    configureServer(server) {
      server.middlewares.use(`/${FEED}`, (req, res) => {
        res.setHeader('Content-Type', 'application/atom+xml; charset=utf-8');
        res.end(feed(notes));
      });
      const watched = [join(root, CONTENT), join(root, HOME.fr), join(root, HOME.en)];
      server.watcher.add(join(root, CONTENT));
      server.watcher.on('all', (event, file) => {
        if (!watched.some((w) => file === w || file.startsWith(`${w}/`) || file.startsWith(`${w}\\`))) return;
        try {
          build();
        } catch (err) {
          log(err.message);
        }
        server.ws.send({ type: 'full-reload' });
      });
    },
  };
  /** Pages publiées du journal, pour le plan du site (jamais un brouillon, même sur un aperçu). */
  const pages = () => {
    const published = notes.filter((n) => !n.draft);
    if (!published.length) return [];
    const indexAlt = { fr: `${OUT.fr}/`, en: `${OUT.en}/` };
    return [
      ...LANGS.map((lang) => ({ path: `${OUT[lang]}/`, lastmod: published[0].date, alternates: indexAlt })),
      ...published.map((n) => {
        const twin = n.translation && !n.translation.draft ? n.translation : null;
        return { path: `${n.dir}/`, lastmod: n.date, alternates: twin ? { [n.lang]: `${n.dir}/`, [twin.lang]: `${twin.dir}/` } : null };
      }),
    ];
  };
  return { inputs, plugin, pages };
}
