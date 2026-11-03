import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const page = (path) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  // chemins relatifs : le build fonctionne à la racine d'un domaine comme dans un sous-dossier (GitHub Pages)
  base: './',
  build: {
    target: 'es2020',
    // three.js est volontairement isolé dans son propre fichier (import dynamique dans main.js)
    chunkSizeWarningLimit: 800,
    // deux pages, même structure : le français à la racine, l'anglais dans en/
    rollupOptions: {
      input: { fr: page('./index.html'), en: page('./en/index.html') },
    },
  },
});
