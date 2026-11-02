# Portfolio de Yann Siaka

Portfolio de Yann Siaka, développeur full-stack à Montréal. Une seule page : qui il est, ses projets en ligne, ce qu'il sait faire, sa méthode, son parcours et comment le joindre. Le motion design s'inspire de [trionn.com](https://trionn.com/) (intro, symbole 3D, révélations au défilement, bandeau, curseur), sur une hiérarchie et une typographie pensées pour rester lisibles.

**Stack** : [Vite](https://vite.dev) · [three.js](https://threejs.org) · [GSAP](https://gsap.com) + ScrollTrigger · [Lenis](https://lenis.darkroom.engineering) · polices auto-hébergées ([Fontsource](https://fontsource.org)) : Archivo pour le texte, JetBrains Mono pour le code.
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
index.html                 tout le contenu de la page, balises de partage
public/favicon.svg
src/
├── main.js                point d'entrée : polices, styles, interface, puis scène 3D chargée à part
├── app.js                 assemble l'interface dans le bon ordre
├── core/
│   ├── env.js             préférences de l'appareil (souris, tactile, mouvement réduit), jetons, utilitaires DOM
│   ├── state.js           état partagé avec la scène 3D, pause globale des animations
│   ├── gsap.js            GSAP + ScrollTrigger enregistrés une seule fois
│   ├── scroll.js          défilement doux Lenis, synchronisé avec ScrollTrigger et avec le focus clavier
│   └── text.js            découpe de texte et effet de brouillage « terminal »
├── ui/
│   ├── loader.js          intro (une fois par visite) : journal de build, compteur, ouverture en bandes
│   ├── nav.js             invite « yann@siaka:~/section$ », section en cours, menu mobile, ancres
│   ├── cursor.js          curseur personnalisé et boutons magnétiques (souris seulement)
│   ├── pause.js           bouton pause de toutes les animations
│   ├── clocks.js          horloges Montréal et Douala
│   └── copy.js            bouton « Copier l'adresse » et son message
├── sections/              hero, révélations, bandeau, compétences (onglets), méthode, contact, pied de page
├── hero/
│   ├── scene.js           scène three.js : rendu, interactions, boucle d'animation
│   ├── formations.js      les 7 symboles, décrits panneau par panneau
│   └── helpers.js         géométrie arrondie, courbes d'animation
└── styles/                importés dans cet ordre par index.css
    ├── tokens.css         la seule source des couleurs, tailles, espacements et rayons
    ├── base.css           remise à zéro, titres, focus, utilitaires
    ├── layout.css         conteneur, barre de navigation, sections, pied de page
    ├── components.css     bouton, lien, statut, outils, élément à filet, code, onglets, formulaire, progression
    ├── chrome.css         intro et curseur
    ├── hero.css           hero et scène 3D
    └── sections.css       bandeau, projets, à propos, compétences, méthode, parcours, contact, signature
```

## Système de design

Toutes les valeurs viennent de `src/styles/tokens.css` : aucune couleur, taille ou marge écrite en dur ailleurs.

| Jeton | Valeur | Usage |
| --- | --- | --- |
| `--bg` | `#121211` | fond de page, identique au fond de la scène 3D |
| `--surface` | `#1A1A18` | menu mobile, fond des captures pendant leur chargement |
| `--text` | `#EEECE6` | titres et texte courant (15,9:1 sur le fond) |
| `--text-2` | `#ABA79E` | texte secondaire (7,8:1) |
| `--accent` | `#F2B13A` | bouton principal, focus, lueur du symbole (9,9:1) |
| `--live` / `--neutral` | `#7CC48E` / `#8A867E` | pastilles de statut |

- **Typographie** : Archivo pour le texte (chasse 125 % pour le nom, 112 % pour les titres, normale pour le texte), JetBrains Mono pour le code seulement. Tailles de lecture : 15, 18, 21, 28, 32 ou 40 px ; tailles d'affichage fluides pour le nom, la phrase d'À propos, les chiffres, le bandeau et la signature. Texte courant en 18 px, interligne 1,6, 62 caractères au plus par ligne.
- **Espacement** : base 8 px (8, 16, 24, 32, 48, 64, 96, 128). Toute cible cliquable fait 48 px de haut.
- **Composants** (`components.css`) : `.btn` (`--primary`, `--secondary`, `--icon`), `.link` (`--standalone` hors d'une phrase, `.ext` pour un lien externe), `.status` (`--live`, `--progress`, neutre), `.tools`, `.items` et `.item` (élément à filet), `.checks`, `.code`, `.tabs`, `.field` et `.chip`, `.progress`.
- **Règles** : un seul bouton principal par vue ; un statut a toujours un texte, jamais la couleur seule ; un lien externe ouvre un nouvel onglet et le dit aux lecteurs d'écran ; casse de phrase partout, sans sur-titres ni capitales.
- **Titres** : un seul `h1` (le nom et le rôle), un `h2` par section, `h3` pour un projet principal ou une sous-section, `h4` pour un élément de liste.

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

- **Survol** (souris) : le symbole s'incline vers le curseur et le panneau survolé s'illumine.
- **Clic court** ou toucher : symbole suivant.
- **Clic maintenu** ou appui long : le symbole éclate, puis se reconstruit au relâchement.
- **Défilement** : les panneaux s'écartent pendant que la section Projets recouvre le hero.
- **Pistes du circuit** : les survoler, ou les toucher au doigt, lance des étincelles et envoie des paquets de données vers le symbole.
- **Pause** : le bouton placé sous le symbole fige toutes les animations (scène, bandeau, curseur de l'invite), puis les relance.

**Placement** : la boîte `.hero__stage` (CSS) décide où se pose le symbole : à droite du nom sur ordinateur, au-dessus sur mobile. Déplacer cette boîte suffit, la scène suit.

**Ajouter un symbole** : dans `src/hero/formations.js`, écrire une fonction qui renvoie une liste de panneaux (avec `bar`, `splitBar`, `cube` ou `slab`), puis l'ajouter au tableau `FORMS`. Le nombre de panneaux s'adapte tout seul au plus grand symbole.

## Sections

| Section | Contenu | Animation |
| --- | --- | --- |
| Intro | journal de build, compteur | ouverture en huit bandes, une fois par visite |
| Hero | nom, rôle, accroche, « Voir les projets », GitHub, disponibilité, symbole 3D | lettres qui sortent du flou, symbole qui s'assemble |
| Bandeau | verbes et outils | défilement infini qui suit la vitesse du scroll |
| Projets | trois projets en ligne avec captures, Easy Life (schéma, jalons), l'ERP de l'IUT | captures dévoilées, téléphone en parallaxe |
| À propos | phrase d'accroche, présentation, langues, quatre repères chiffrés | phrase éclairée mot par mot, compteurs à rouleaux |
| Compétences | quatre couches en onglets : ce que je sais faire, outils, extrait de code | pile isométrique qui s'écarte |
| Méthode | cinq étapes lues comme un historique Git | graphe tracé au défilement |
| Parcours | journal des versions (diplômes, stages, équivalence WES) et certifications | blocs qui montent |
| Contact | formulaire qui prépare un courriel, aperçu JSON, courriel direct | aperçu mis à jour à la saisie |
| Pied de page | signature, horloges Montréal et Douala | graisse et chasse qui suivent le curseur |

## Projets présentés

- **Projets en ligne** (Precious, Glorious Hall, EasyTravel) : vraies captures dans `src/assets/projects/`, sur ordinateur (1440 × 900) et sur mobile (390 × 844).
- **Easy Life** : un schéma de six tables tirées de son modèle de données remplace la capture (le dépôt est privé).
- **ERP de l'IUT** : présenté en texte, avec les liens vers le code.

Pour rafraîchir une capture : construire le site depuis son dépôt (`npm run build`, puis `npm run preview`), capturer la page d'accueil aux deux formats, puis convertir en WebP : 720 et 1200 px de large pour l'ordinateur, 360 px pour le mobile. Garder les mêmes noms de fichiers.

| Projet | Nature | Lien |
| --- | --- | --- |
| Precious | site client | [precious-jus.com](https://precious-jus.com/) |
| Glorious Hall | site client | [glorioushall.com](https://www.glorioushall.com/) |
| EasyTravel | projet d'études | [site](https://easytravel-front-wine.vercel.app/) · [interface](https://github.com/yannsiaka1/easytravel-front) · [API](https://github.com/yannsiaka1/easytravel-back) |
| Easy Life | produit en construction | pas encore en ligne |
| ERP de l'IUT de Douala | projet tutoré | [interface](https://github.com/yannsiaka1/projet-tutore-front) · [API](https://github.com/yannsiaka1/projet-tutore-back) |

## Accessibilité et performance

- **Objectif WCAG 2.1 AA** : texte à 7:1 au moins, focus visible sur toute cible, navigation complète au clavier, lien d'évitement, cibles de 48 px, page lisible à 320 px de large sans défilement horizontal.
- **Mouvement réduit** (réglage système) : pas d'intro, pas de défilement doux, contenu visible tout de suite, symbole immobile.
- **Pause** : un bouton fige tout ce qui bouge seul (WCAG 2.2.2).
- **Clavier** : les blocs pas encore révélés restent focalisables ; un élément qui reçoit le focus est amené à l'écran sous la barre.
- **Sans WebGL 2** : un symbole `</>` dessiné en SVG remplace la scène, le reste du site fonctionne.
- **Mobile** : matériau métal à la place du verre réfractif, résolution limitée, interactions au toucher.
- three.js (≈ 138 ko gzip) est chargé à part : la page est utilisable avant lui.
- Le rendu 3D s'arrête quand le hero sort de l'écran ou que l'onglet est caché.

## À remplacer avant la mise en ligne

- **LinkedIn** : pas affiché tant qu'il n'y a pas d'adresse de profil ; à ajouter dans Contact et le pied de page.
- **Formulaire de contact** : il ouvre le logiciel de courriel du visiteur (lien mailto:). Pour un envoi direct depuis le site, le brancher sur un service (Formspree, Resend…).
- **Démo de l'ERP de l'IUT** : le projet Vercel n'a pas encore de déploiement de production ; la page renvoie au code sur GitHub.
- **Années du parcours** : la section Parcours n'affiche pas de dates ; à ajouter si souhaité.
- **Image de partage** (`og:image`) : à créer, pour un bel aperçu sur LinkedIn.

## Déploiement

Le build utilise des chemins relatifs (`base: './'`) : `dist/` fonctionne à la racine d'un domaine comme dans un sous-dossier.

- **Vercel / Netlify** : commande `npm run build`, dossier `dist`.
- **GitHub Pages** : publier le contenu de `dist/`.

## Contribuer

1. Créer une branche depuis `main` (`feat/…`, `fix/…`, `docs/…`).
2. Ouvrir une pull request vers `main`.
3. Relecture, corrections, validation, puis fusion. Pas de push direct sur `main`.
