import { defineConfig } from 'vite';

export default defineConfig({
  // chemins relatifs : le build fonctionne à la racine d'un domaine comme dans un sous-dossier (GitHub Pages)
  base: './',
  build: {
    target: 'es2020',
    // three.js est volontairement isolé dans son propre fichier (import dynamique dans main.js)
    chunkSizeWarningLimit: 800,
  },
});
