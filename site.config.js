// Adresse publique du site : le seul endroit où elle est écrite.
// Elle sert aux adresses complètes que lisent les moteurs de recherche et les réseaux : adresse canonique de chaque
// page, versions française et anglaise reliées, plan du site, robots.txt, image de partage et flux du journal.
// Dans les pages, elle s'écrit __SITE_URL__ et se remplace au build (scripts/site.mjs).
// Changer de domaine : modifier cette ligne, puis reconstruire le site.
export const SITE_URL = 'https://portfolioyann-wine.vercel.app';
