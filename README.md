# Portfolio de Yann Siaka

Portfolio de Yann Siaka, développeur full-stack à Montréal. Une seule page, pensée pour se lire vite : qui il est, ses projets en ligne, son parcours et comment le joindre. Un symbole de code en 3D accueille le visiteur dans le hero ; le reste se lit comme une bonne documentation.

**Stack** : [Vite](https://vite.dev) · [three.js](https://threejs.org) · police Archivo auto-hébergée ([Fontsource](https://fontsource.org)).
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
├── main.js                point d'entrée : police, styles, navigation, copie, puis scène 3D chargée à part
├── core/
│   ├── env.js             préférences de l'appareil (tactile, mouvement réduit) et utilitaires DOM
│   └── state.js           signale à la page que la scène 3D est prête, ou indisponible
├── ui/
│   ├── nav.js             barre collante, menu mobile, section en cours
│   └── copy.js            bouton « Copier l'adresse » et son message
├── hero/
│   ├── scene.js           scène three.js : rendu, interactions, boucle d'animation
│   ├── formations.js      les 7 symboles, décrits panneau par panneau
│   └── helpers.js         géométrie arrondie, courbes d'animation
└── styles/                importés dans cet ordre par index.css
    ├── tokens.css         la seule source des couleurs, tailles, espacements et rayons
    ├── base.css           remise à zéro, titres, focus, utilitaires
    ├── layout.css         conteneur, barre de navigation, sections, pied de page
    ├── components.css     bouton, lien, statut, liste d'outils, élément à filet
    ├── hero.css           hero et scène 3D
    └── sections.css       projets, à propos, contact
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

- **Typographie** : Archivo seule. Chasse 125 % pour le nom, 112 % pour les titres, normale pour le texte. Six tailles : 15, 18, 21, 28, 32 ou 40 px (titres de section), et le nom, de 52 à 112 px. Texte courant en 18 px, interligne 1,6, 62 caractères au plus par ligne.
- **Espacement** : base 8 px (8, 16, 24, 32, 48, 64, 96). Toute cible cliquable fait 48 px de haut.
- **Composants** (`components.css`) : `.btn` (`--primary`, `--secondary`), `.link` (`--standalone` hors d'une phrase, `.ext` pour un lien externe), `.status` (`--live`, `--progress`, neutre), `.tools`, `.items` et `.item` (élément à filet).
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
- **Pause** : le bouton placé à côté de l'indice fige l'animation, puis la relance.

**Placement** : la boîte `.hero__stage` (CSS) décide où se pose le symbole : à droite du nom sur ordinateur, au-dessus sur mobile. Déplacer cette boîte suffit, la scène suit.

**Ajouter un symbole** : dans `src/hero/formations.js`, écrire une fonction qui renvoie une liste de panneaux (avec `bar`, `splitBar`, `cube` ou `slab`), puis l'ajouter au tableau `FORMS`. Le nombre de panneaux s'adapte tout seul au plus grand symbole.

## Sections

| Section | Contenu |
| --- | --- |
| Hero | nom, rôle, phrase d'accroche, « Voir les projets », GitHub, disponibilité, symbole 3D |
| Projets | trois projets en ligne avec captures (même gabarit), puis Easy Life et l'ERP de l'IUT |
| À propos | présentation, compétences (interface, API, données, mise en ligne), méthode en quatre étapes |
| Parcours | formation et certifications, avec liens de vérification |
| Contact | courriel, bouton de copie, lien d'envoi, GitHub |

## Projets présentés

- **Projets en ligne** (Precious, Glorious Hall, EasyTravel) : vraies captures dans `src/assets/projects/`, sur ordinateur (1440 × 900) et sur mobile (390 × 844).
- **Projets pas encore en ligne** (Easy Life, ERP de l'IUT) : présentés en texte seulement, sans maquette inventée.

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
- **Mouvement réduit** (réglage système) : symbole immobile, pas de passage automatique, pas d'éclatement, défilement sans animation.
- **Sans WebGL 2** : un symbole `</>` dessiné en SVG remplace la scène, le reste du site fonctionne.
- **Mobile** : matériau métal à la place du verre réfractif, résolution limitée, interactions au toucher.
- three.js (≈ 138 ko gzip) est chargé à part : le premier fichier JS pèse ≈ 2 ko gzip et la feuille de style ≈ 4 ko.
- Le rendu 3D s'arrête quand le hero sort de l'écran ou que l'onglet est caché.

## À remplacer avant la mise en ligne

- **Courriel** `bonjour@yannsiaka.dev` (section Contact) : adresse provisoire.
- **LinkedIn** : pas affiché tant qu'il n'y a pas d'adresse de profil ; à ajouter dans Contact et le pied de page.
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
