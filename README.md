# Portfolio · Yann Siaka

Portfolio de Yann Siaka, développeur full-stack à Montréal. Le hero met en scène des symboles de code en 3D, et le reste du site raconte le parcours au fil du défilement.

**Stack** : [Vite](https://vite.dev) · [three.js](https://threejs.org) · [GSAP](https://gsap.com) + ScrollTrigger · [Lenis](https://lenis.darkroom.engineering) · Web Audio · polices auto-hébergées ([Fontsource](https://fontsource.org)).
Aucun framework : HTML, CSS et JavaScript en modules.

## Démarrer

Prérequis : Node.js 20.19+ ou 22.12+ (exigence de Vite 8).

```bash
npm install
npm run dev       # serveur de développement sur http://localhost:5173
npm run build     # build de production dans dist/
npm run preview   # sert dist/ pour vérifier le build
```

## Structure

```
index.html                 contenu de toutes les sections, balises de partage
public/favicon.svg
src/
├── main.js                point d'entrée : styles, polices, interface, puis scène 3D chargée à part
├── app.js                 assemble l'interface dans le bon ordre
├── core/
│   ├── env.js             préférences de l'appareil (souris, tactile, mouvement réduit) et utilitaires DOM
│   ├── state.js           état partagé entre l'interface et la scène 3D
│   ├── gsap.js            GSAP + ScrollTrigger enregistrés une seule fois
│   ├── scroll.js          défilement doux Lenis synchronisé avec ScrollTrigger
│   ├── audio.js           sons synthétisés (aucun fichier audio)
│   └── text.js            découpe de texte et effet de brouillage « terminal »
├── ui/
│   ├── loader.js          préchargement (journal de build, compteur, ouverture en bandes)
│   ├── nav.js             barre « yann@siaka:~/section$ », menu, ancres, bouton son
│   ├── cursor.js          curseur personnalisé et boutons magnétiques
│   └── clocks.js          horloges Montréal et Douala
├── sections/              un fichier par section (hero, révélations, bandeau, projets, expertise…)
├── hero/
│   ├── scene.js           scène three.js : rendu, interactions, boucle d'animation
│   ├── formations.js      les 7 symboles, décrits panneau par panneau
│   └── helpers.js         géométrie arrondie, courbes d'animation, textures
└── styles/                tokens, base, habillage, hero, sections, responsive (importés dans cet ordre)
```

## Le hero 3D

Les mêmes panneaux de verre se recomposent en sept symboles, environ toutes les 7 secondes :

| Fig. | Symbole | Idée |
| --- | --- | --- |
| 01 | `</>` | interfaces |
| 02 | `{ }` | logique métier |
| 03 | `>_` | outillage (terminal avec curseur clignotant) |
| 04 | `GET /` | API REST (nœud central et branches) |
| 05 | `⇄` | intégrations (réseau de services) |
| 06 | `[■]` | modules (cube et noyau) |
| 07 | `≡` | full-stack (pile interface → API → données) |

**Interactions**

- **Survol** : le symbole s'incline vers le curseur et le panneau survolé s'illumine.
- **Clic court** : symbole suivant.
- **Clic long** (appui long au doigt) : la page tremble, le symbole explose (« casser la prod »), puis se reconstruit au relâchement (« rollback »).
- **Pistes du circuit** : les survoler, ou les toucher sur mobile, lance des étincelles et envoie des paquets de données vers le symbole.
- **Son** : coupé par défaut, activable avec le bouton « Son » de la barre de navigation.

**Ajouter un symbole** : dans `src/hero/formations.js`, écrire une fonction qui renvoie une liste de panneaux (avec `bar`, `splitBar`, `cube` ou `slab`), puis l'ajouter au tableau `FORMS` avec son libellé. Le nombre de panneaux s'adapte tout seul au plus grand symbole.

## Sections

| Section | Animation | Fichier |
| --- | --- | --- |
| Préchargement | journal de build, compteur à rouleaux, ouverture en 10 bandes | `ui/loader.js` |
| Hero | titre qui sort du flou lettre par lettre, scène 3D | `sections/hero.js`, `hero/` |
| À propos | le paragraphe s'éclaire mot par mot au défilement | `sections/reveals.js` |
| Bandeau | défilement infini qui accélère avec le scroll | `sections/marquee.js` |
| Repères | compteurs à rouleaux, horloges Montréal / Douala | `sections/reveals.js`, `ui/clocks.js` |
| Projets | défilement horizontal épinglé (> 900 px), maquettes en parallaxe | `sections/work.js` |
| Expertise | pile qui s'écarte et s'allume couche par couche (> 900 px) | `sections/stack.js` |
| Méthode | graphe `git log` avec une branche, tracé au défilement | `sections/method.js` |
| Contact | la requête JSON s'écrit pendant la saisie, validation côté client | `sections/contact.js` |
| Pied de page | signature à graisse variable, une note par lettre | `sections/footer.js` |

## Projets présentés

Les cartes de la section Projets sont dans `index.html`.

- **Projets en ligne** (Precious, Glorious Hall, EasyTravel) : vraies captures dans `src/assets/projects/`, sur ordinateur (1440 × 900) dans un cadre de navigateur et sur mobile (390 × 844) dans un téléphone.
- **Projets pas encore en ligne** (Easy Life, ERP de l'IUT) : maquettes dessinées en CSS (classes `v-em` et `v-erp` dans `src/styles/sections.css`).

Pour rafraîchir une capture : construire le site depuis son dépôt (`npm run build`, puis `npm run preview`), capturer la page d'accueil aux deux formats, puis convertir en WebP : 720 et 1200 px de large pour l'ordinateur, 360 px pour le mobile. Garder les mêmes noms de fichiers.

| Projet | Nature | Lien |
| --- | --- | --- |
| Easy Life | produit en construction | pas encore en ligne |
| Precious | site client | [precious-jus.com](https://precious-jus.com/) |
| Glorious Hall | site client | [glorioushall.com](https://www.glorioushall.com/) |
| EasyTravel | projet académique | [site](https://easytravel-front-wine.vercel.app/) · [front](https://github.com/yannsiaka1/easytravel-front) · [API](https://github.com/yannsiaka1/easytravel-back) |
| ERP de l'IUT de Douala | projet tutoré | [front](https://github.com/yannsiaka1/projet-tutore-front) · [API](https://github.com/yannsiaka1/projet-tutore-back) |

## Accessibilité et performance

- **Mouvement réduit** (réglage système) : pas de préchargement, pas de défilement doux ni d'épinglage, contenu visible immédiatement.
- **Sans WebGL 2** : un symbole `</>` en contour remplace la scène, le reste du site fonctionne.
- **Mobile** : matériau métal à la place du verre réfractif, résolution limitée, interactions au toucher.
- three.js (≈ 140 ko gzip) est chargé à part : le premier fichier JS pèse ≈ 58 ko gzip.
- Le rendu 3D se met en pause quand le hero sort de l'écran ou que l'onglet est caché.
- Le menu rend la page inerte tant qu'il est ouvert ; Échap le referme.

## À remplacer avant la mise en ligne

- **Courriel** `bonjour@yannsiaka.dev` (section Contact, menu) : adresse provisoire.
- **Lien LinkedIn** (menu et pied de page) : pointe vers la page d'accueil de LinkedIn.
- **Démo de l'ERP de l'IUT** : le projet Vercel n'a pas encore de déploiement de production ; la carte renvoie au code sur GitHub en attendant.
- **Formulaire de contact** : aucun envoi réel pour l'instant (`src/sections/contact.js`), à brancher sur un endpoint (Laravel, Formspree…).
- **Versions du changelog** (section Parcours) : à ajuster à ton vrai parcours.
- **Image de partage** (`og:image`) : à créer, pour un bel aperçu sur LinkedIn.

## Déploiement

Le build utilise des chemins relatifs (`base: './'`) : `dist/` fonctionne à la racine d'un domaine comme dans un sous-dossier.

- **Vercel / Netlify** : commande `npm run build`, dossier `dist`.
- **GitHub Pages** : publier le contenu de `dist/`.

## Contribuer

1. Créer une branche depuis `main` (`feat/…`, `fix/…`, `docs/…`).
2. Ouvrir une pull request vers `main`.
3. Relecture, corrections, validation, puis fusion. Pas de push direct sur `main`.
