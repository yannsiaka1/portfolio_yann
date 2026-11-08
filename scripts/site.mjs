// Ce que lisent les moteurs de recherche et les réseaux, écrit au build à partir d'une seule adresse (site.config.js) :
//   - dans chaque page, __SITE_URL__ devient l'adresse du site (adresse canonique, versions FR et EN, image de partage) ;
//   - sitemap.xml : les deux accueils et les pages publiées du journal, chacune reliée à sa version dans l'autre langue ;
//   - robots.txt : tout le site est ouvert aux moteurs, et leur indique le plan du site ;
//   - 404.html : servie par Vercel à n'importe quelle adresse inconnue, elle vise ses fichiers depuis la racine du site
//     (en chemins relatifs, ses styles ne se chargeraient pas sous /une/adresse/inconnue/).
import { SITE_URL } from '../site.config.js';

const HTML_LANG = { fr: 'fr-CA', en: 'en-CA' };
const HOMES = { fr: '', en: 'en/' };

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function sitemap(entries) {
  const urls = entries.map(({ path, lastmod, alternates }) => {
    const links = alternates
      ? Object.entries(alternates)
          .map(([lang, alt]) => `\n    <xhtml:link rel="alternate" hreflang="${HTML_LANG[lang]}" href="${esc(`${SITE_URL}/${alt}`)}"/>`)
          .join('')
      : '';
    return `  <url>\n    <loc>${esc(`${SITE_URL}/${path}`)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}${links}\n  </url>`;
  });
  return `<?xml version="1.0" encoding="utf-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
}

/** pages : renvoie les pages publiées du journal (scripts/journal.mjs), lues au moment du build. */
export function site({ pages }) {
  return {
    name: 'site',
    // après les extensions de Vite : les pages HTML sont déjà dans le bundle quand on les reprend
    enforce: 'post',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => html.replaceAll('__SITE_URL__', SITE_URL),
    },
    generateBundle(_, bundle) {
      const homes = Object.values(HOMES).map((path) => ({ path, alternates: HOMES }));
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap([...homes, ...pages()]) });
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n` });
      const notFound = bundle['404.html'];
      if (notFound) notFound.source = String(notFound.source).replace(/(href|src)="\.\//g, '$1="/');
    },
  };
}
