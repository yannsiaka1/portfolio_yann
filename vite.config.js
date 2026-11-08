import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { journal } from './scripts/journal.mjs';
import { site } from './scripts/site.mjs';

const page = (path) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig(({ command }) => {
  // Journal : les notes de content/journal/ deviennent des pages (scripts/journal.mjs). Les brouillons se voient
  // avec npm run dev et sur les aperçus Vercel des branches, jamais sur le site en ligne ; JOURNAL_DRAFTS=1 les
  // montre aussi dans un build local. Au build, une note mal écrite arrête tout avec un message qui dit quoi corriger.
  const drafts = command === 'serve' || process.env.VERCEL_ENV === 'preview' || process.env.JOURNAL_DRAFTS === '1';
  const notes = journal({ root: page('./'), drafts, strict: command === 'build' });

  return {
    // chemins relatifs : le build fonctionne à la racine d'un domaine comme dans un sous-dossier (GitHub Pages)
    base: './',
    // adresse du site, plan du site, robots.txt et page 404 (scripts/site.mjs), puis le journal
    plugins: [site({ pages: notes.pages }), notes.plugin],
    build: {
      target: 'es2020',
      // three.js est volontairement isolé dans son propre fichier (import dynamique dans main.js)
      chunkSizeWarningLimit: 800,
      // une police n'est jamais glissée dans la feuille de style en data: (Vite le fait sous 4 ko) : la politique de
      // sécurité n'accepte que les polices servies par le site (font-src 'self', vercel.json)
      assetsInlineLimit: (file) => (file.endsWith('.woff2') ? false : undefined),
      // deux pages d'accueil, même structure : le français à la racine, l'anglais dans en/ ; la page 404 ; puis les
      // pages du journal
      rollupOptions: {
        input: { fr: page('./index.html'), en: page('./en/index.html'), notFound: page('./404.html'), ...notes.inputs },
      },
    },
  };
});
