import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { journal } from './scripts/journal.mjs';

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
    plugins: [notes.plugin],
    build: {
      target: 'es2020',
      // three.js est volontairement isolé dans son propre fichier (import dynamique dans main.js)
      chunkSizeWarningLimit: 800,
      // deux pages d'accueil, même structure : le français à la racine, l'anglais dans en/ ; puis les pages du journal
      rollupOptions: {
        input: { fr: page('./index.html'), en: page('./en/index.html'), ...notes.inputs },
      },
    },
  };
});
