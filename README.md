# Portfolio de Yann Siaka

Portfolio de Yann Siaka, développeur full-stack à Montréal. Une seule page : qui il est, ses projets en ligne, ce qu'il sait faire, sa méthode, son parcours et comment le joindre. Le motion design s'inspire de [trionn.com](https://trionn.com/) (intro, symbole 3D, révélations au défilement, bandeau, curseur, projets qui défilent un par un) et reprend les codes de la première version du site (titres avec mots d'accent en italique, cartes de projet avec maquettes, grain), sur une hiérarchie et une typographie pensées pour rester lisibles.

**Stack** : [Vite](https://vite.dev) · [three.js](https://threejs.org) · [GSAP](https://gsap.com) + ScrollTrigger · [Lenis](https://lenis.darkroom.engineering) · polices auto-hébergées ([Fontsource](https://fontsource.org)) : Archivo pour le texte, Newsreader en italique pour les mots d'accent, JetBrains Mono pour le code et les petites étiquettes techniques.
Aucun framework : HTML, CSS et JavaScript en modules.

## Démarrer

Prérequis : Node.js 20.19+ ou 22.12+ (exigence de Vite 8).

```bash
npm install
npm run dev       # serveur de développement sur http://localhost:5173
npm run build     # build de production dans dist/
npm run preview   # sert dist/ pour vérifier le build
npm run check:i18n  # vérifie que les pages française et anglaise gardent la même structure
```

## Structure

```
index.html                 tout le contenu de la page en français, balises de partage
en/index.html              la même page en anglais : même balisage, texte traduit à la main
scripts/check-i18n.mjs     compare la structure des deux pages (npm run check:i18n)
public/favicon.svg
public/proofs/             pièces justificatives agrandissables : extrait du rapport WES, attestation D-CLIC (720 et 1200 px)
public/cv/yann-siaka-cv.pdf CV à télécharger (hero, Contact, pied de page), sans numéro de téléphone ; pour le mettre à jour, remplacer ce fichier en gardant son nom
src/
├── main.js                point d'entrée : polices, styles, interface, puis scène 3D chargée à part
├── app.js                 assemble l'interface dans le bon ordre
├── core/
│   ├── env.js             préférences de l'appareil (souris, tactile, mouvement réduit), jetons, utilitaires DOM
│   ├── state.js           état partagé avec la scène 3D, pause globale des animations
│   ├── i18n.js            langue de la page, pour les textes écrits par les scripts : t({ fr, en })
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
├── sections/              hero, pense-bête du hero, révélations, bandeau, projets (épinglés ou empilés, vidéo de l'ERP), compétences (six couches parcourues au défilement), méthode, contact, pied de page
├── hero/
│   ├── scene.js           scène three.js : rendu, interactions, boucle d'animation
│   ├── formations.js      les 7 symboles, décrits panneau par panneau
│   └── helpers.js         géométrie arrondie, courbes d'animation
└── styles/                importés dans cet ordre par index.css
    ├── tokens.css         la seule source des couleurs, tailles, espacements et rayons
    ├── base.css           remise à zéro, titres, focus, utilitaires
    ├── layout.css         conteneur, barre de navigation, sections, pied de page
    ├── components.css     bouton, lien, statut, outils, sur-titre, compteur, élément à filet, code, progression au défilement, formulaire, progression
    ├── chrome.css         intro, curseur et grain
    ├── hero.css           hero et scène 3D
    └── sections.css       bandeau, projets, à propos, compétences, méthode, parcours, contact, signature
```

## Deux langues

- **Deux pages, une structure** : le français à la racine (`index.html`), l'anglais dans `en/` (`en/index.html`). Mêmes balises, mêmes identifiants, mêmes classes ; seuls changent le texte, les attributs lisibles (`alt`, `aria-label`, `title`, valeurs des choix), la langue (`lang="fr-CA"` ou `lang="en-CA"`) et les chemins (`../` dans `en/`).
- **Traduction faite à la main**, pas par un traducteur automatique : termes métier et techniques vérifiés (récit utilisateur, idempotence, jalons, projet tutoré traduit par *capstone project*), orthographe canadienne (*colour*, *modelling*, *traveller*). Les visiteurs anglophones lisent ainsi un texte juste au lieu d'une traduction automatique de la page française.
- **Textes des scripts** (menu mobile, bouton pause, vidéos, formulaire, indications du symbole 3D, horloges) : ils suivent la langue de la page par `src/core/i18n.js`, écrits sous la forme `t({ fr: '…', en: '…' })`.
- **Passer d'une langue à l'autre** : un bouton toujours visible dans la barre, sur ordinateur comme sur mobile, avec un globe à l'accent : « English » ou « Français » dès 1280 px, « EN » ou « FR » en dessous (le mot entier reste lu par les lecteurs d'écran). Aussi « English version » ou « Version française » dans le pied de page. Attributs `hreflang` et `lang` sur ces liens. Pour que la barre tienne sur une ligne à toutes les largeurs, l'invite se raccourcit dans les sections sur petit écran (« yann:~/section$ », puis « ~/section$ ») ; à l'accueil, elle reste « yann@siaka:~$ ».
- **Traducteurs automatiques** : `translate="no"` protège ce qui ne doit jamais être traduit. Il est posé sur les blocs (noms des projets, listes d'outils, extraits de code, invite de commande, adresses des maquettes, courriel, signature) et, dans le texte courant, sur chaque nom propre ou outil au nom de mot ordinaire, par un `<span translate="no">` (Precious, Glorious Hall, EasyTravel, Easy Life, Mobile Money, Vite, Render, Railway, Resend, Postman, Payhip, Flask, Laravel Sail, Search Console, GitHub Projects, IncH Class, World Education Services, le nom, les adresses de courriel). Une page traduite par Chrome ou Google Traduction dans une autre langue garde ces termes intacts. Limite : un texte alternatif (`alt`) ne peut pas être protégé en partie, un nom propre peut donc y être traduit.
- **Modifier le contenu** : faire le même changement dans `index.html` et dans `en/index.html`, en protégeant les nouveaux noms propres de la même façon, puis lancer `npm run check:i18n`. Le script signale toute balise qui diffère et tout chemin de la page anglaise qui ne remonte pas d'un dossier (`../`).
- **CV** : le fichier téléchargeable est en français. La page anglaise le dit (« Download my CV (French) »).

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
| `--surface-2`, `--chrome`, `--bezel` | `#201F1C`, `#1D1C19`, `#23252C` | visuel d'un projet, barre du navigateur et contour du téléphone des maquettes |
| `--tint-*` | une par projet | lueur du visuel, dans la couleur de la marque du projet |
| `--paper` / `--on-paper` | `#EFDC96` / `#17130A` | papier et encre du pense-bête du hero (13,5:1 ; tâches faites à 7,6:1) |

- **Typographie** : Archivo pour le texte (chasse 125 % pour le nom, 112 % pour les titres de niveau 3, normale ailleurs) ; Newsreader en italique fin pour les mots d'accent des titres et de la phrase d'À propos ; JetBrains Mono pour le code et les petites étiquettes techniques (sur-titres, outils, compteurs), jamais en capitales. Tailles de lecture : 15, 18, 21 ou 28 px ; tailles d'affichage fluides pour le nom, les titres de section (40 à 100 px, comme la première version), le nom des projets, la phrase d'À propos, les chiffres, le bandeau et la signature. Texte courant en 18 px, interligne 1,6, 62 caractères au plus par ligne. Aucun texte lisible sous 15 px (le texte dessiné dans une maquette fait partie de l'illustration).
- **Espacement** : base 8 px (8, 16, 24, 32, 48, 64, 96, 128). Toute cible cliquable fait 48 px de haut.
- **Composants** (`components.css`) : `.btn` (`--primary`, `--secondary`, `--icon`), `.link` (`--standalone` hors d'une phrase, `.ext` pour un lien externe), `.status` (`--live`, `--progress`, neutre), `.tools` (une étiquette par outil), `.eyebrow` (sur-titre d'une section), `.count` (nombre d'éléments en exposant d'un titre), `.items` et `.item` (élément à filet), `.checks`, `.code`, `.tabs`, `.field` et `.chip`, `.progress`. Dans `sections.css` : `.card` (carte de projet : `.card__visual` avec `.browser` et `.device`, puis `.card__body`).
- **Règles** : un seul bouton principal par vue ; un statut a toujours un texte, jamais la couleur seule ; un lien externe ouvre un nouvel onglet et le dit aux lecteurs d'écran ; casse de phrase partout, sans capitales ; chaque section s'ouvre sur son nom dans le menu (sur-titre, qui nomme aussi la section pour les lecteurs d'écran), puis un titre dont la fin est en italique.
- **Titres** : un seul `h1` (le nom et le rôle), un `h2` par section, `h3` pour un projet ou une sous-section, `h4` pour un élément de liste.

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
- **Pause** : le bouton placé sous le symbole fige tout ce qui bouge seul (scène, bandeau, curseur de l'invite, horloges, grain, vidéos des prototypes, vague de la signature), puis le relance.

**Placement** : la boîte `.hero__stage` (CSS) décide où se pose le symbole : à droite du nom sur ordinateur, au-dessus sur mobile. Déplacer cette boîte suffit, la scène suit.

**Ajouter un symbole** : dans `src/hero/formations.js`, écrire une fonction qui renvoie une liste de panneaux (avec `bar`, `splitBar`, `cube` ou `slab`), puis l'ajouter au tableau `FORMS`. Le nombre de panneaux s'adapte tout seul au plus grand symbole.

## Sections

| Section | Contenu | Animation |
| --- | --- | --- |
| Intro | journal de build, compteur | ouverture en huit bandes, une fois par visite |
| Hero | nom, rôle, accroche, « Voir les projets », CV à télécharger, GitHub, disponibilité, symbole 3D | lettres qui sortent du flou, symbole qui s'assemble |
| Pense-bête (dans le hero) | « À faire » : parcourir les projets, vérifier les diplômes, écrire un mot ; chaque tâche mène à sa section. À droite du nom dès 1280 px, sous le texte en dessous | il se colle à la fin de l'intro, sans rien bloquer ; une tâche se coche après un peu plus d'une seconde passée dans sa section (la traverser en défilant ne compte pas), ou en préparant un courriel, en écrivant directement ou en copiant l'adresse ; la coche se trace quand le pense-bête revient à l'écran. « OK » le décolle pour le reste de la visite |
| Bandeau | verbes et outils | défilement infini qui suit la vitesse du scroll |
| Projets | cinq cartes : Precious, Glorious Hall, EasyTravel, Easy Life (prototype, schéma, jalons), l'ERP de l'IUT (vidéo du prototype) | grand écran : section épinglée, chaque projet arrive par la droite pendant que le précédent bascule à gauche ; ailleurs, cartes empilées qui arrivent par la droite et repartent à gauche |
| À propos | titre, phrase d'accroche avec mots d'accent, présentation, langues, quatre repères en cartes | phrase éclairée mot par mot (du gris au blanc, lisible à plus de 7:1 à chaque instant), compteurs à rouleaux |
| Compétences | six couches, de l'analyse du besoin et de la modélisation à la mise en ligne : ce que je sais faire, outils, extrait de code | on parcourt les couches au défilement, une par hauteur d'écran ; sur grand écran, la pile et la progression restent à l'écran et s'allument sur la couche lue, puis la page passe à la suite ; un clic sur la pile mène à sa couche |
| Méthode | sept étapes, du besoin à la maintenance, lues comme un historique Git (le design et le prototypage avant le développement) | graphe tracé au défilement |
| Parcours | journal des versions (diplômes, stages, équivalence WES), équivalence avec un extrait du rapport, attestation D-CLIC avec qui contacter pour la faire confirmer, certifications | blocs qui montent |
| Contact | formulaire qui prépare un courriel, aperçu JSON, courriel direct, LinkedIn, GitHub, CV à télécharger | aperçu mis à jour à la saisie |
| Pied de page | signature, horloges Montréal et Douala | une vague gonfle les lettres de la signature, en boucle, tant qu'elle est à l'écran ; à la souris, graisse et chasse suivent le curseur. Le nom tient sur une ou deux lignes selon la largeur, choisi une fois en rejouant la vague hors écran : l'animation ne le fait jamais changer de ligne (la page ne saute plus) |

## Projets présentés

- **Projets en ligne** (Precious, Glorious Hall, EasyTravel) : vraies captures dans `src/assets/projects/`, sur ordinateur (1440 × 900) et sur mobile (390 × 844).
- **Easy Life** : deux boucles de 11 s du prototype mobile (Figma), les mêmes écrans en thème clair et en thème sombre (`easylife-clair.mp4`, `easylife-sombre.mp4`), devant un schéma de six tables tirées de son modèle de données (le dépôt est privé). Elles viennent d'un enregistrement d'écran : bouton flottant d'iOS effacé avec un modèle mesuré sur deux fonds connus, écrans choisis et alignés d'un thème à l'autre.
- **ERP de l'IUT** : vidéo du prototype Figma de l'espace étudiant (`erp-prototype.mp4`, 15 s, sans son, avec son affiche WebP). Elle vient d'un enregistrement d'écran sur téléphone : recadrée sur le prototype, bandes noires remplacées par le prolongement de l'écran, bouton flottant d'iOS retiré (la zone du tableau de bord vient d'une capture propre), coupée avant que le bouton ne s'allume et que le centre de contrôle s'ouvre, dernière image prolongée deux secondes pour boucler calmement.

Pour rafraîchir une capture : construire le site depuis son dépôt (`npm run build`, puis `npm run preview`), capturer la page d'accueil aux deux formats, puis convertir en WebP : 720 et 1200 px de large pour l'ordinateur, 360 px pour le mobile. Garder les mêmes noms de fichiers.

| Projet | Nature | Lien |
| --- | --- | --- |
| Precious | site client | [precious-jus.com](https://precious-jus.com/) |
| Glorious Hall | site client | [glorious-hall-4wah.vercel.app](https://glorious-hall-4wah.vercel.app/) (le domaine principal, glorioushall.com, est momentanément indisponible) |
| EasyTravel | projet d'études | [site](https://easytravel-front-wine.vercel.app/) · [interface](https://github.com/yannsiaka1/easytravel-front) · [API](https://github.com/yannsiaka1/easytravel-back) |
| Easy Life | produit en construction | pas de lien public (dépôt privé ; le prototype est montré en vidéo) |
| ERP de l'IUT de Douala | projet tutoré | [site](https://projet-tutore-front.vercel.app/) · [prototype Figma](https://www.figma.com/proto/7nfi85vIzlb9tWb1Ba9PSs?node-id=26-330&starting-point-node-id=8%3A2) · [interface](https://github.com/yannsiaka1/projet-tutore-front) · [API](https://github.com/yannsiaka1/projet-tutore-back) |

## Accessibilité et performance

- **Objectif WCAG 2.1 AA** : texte à 7:1 au moins, focus visible sur toute cible, navigation complète au clavier, lien d'évitement, cibles de 48 px, page lisible à 320 px de large sans défilement horizontal.
- **Mouvement réduit** (réglage système, suivi aussi s'il change pendant la visite) : pas d'intro, pas de défilement doux, contenu visible tout de suite, symbole immobile, projets empilés, vidéos, grain et signature à l'arrêt.
- **Pause** : un bouton fige tout ce qui bouge seul (WCAG 2.2.2).
- **Clavier** : les blocs pas encore révélés restent focalisables ; un élément qui reçoit le focus du clavier est amené à l'écran sous la barre (un clic de souris ne fait jamais défiler la page) ; dans les projets épinglés, sa carte est amenée au repos.
- **Projets** : épinglés seulement sur un écran d'au moins 1024 × 640 px où chaque carte tient en entier (mesuré au chargement et à chaque redimensionnement : c'est le cas sur les ordinateurs portables courants, jusqu'à une fenêtre de 1280 × 640) ; sinon les cartes s'empilent, et rien n'est jamais coupé. Aux flèches du clavier, un pas suffit pour passer à la carte suivante. La vidéo de l'ERP ne joue que visible, a son propre bouton lecture et pause, et ne se lance jamais seule avec « réduire les animations ».
- **Compétences** : les six couches sont toutes dans la page, chacune avec son titre de niveau 3 ; la pile isométrique est décorative. Sur grand écran, elle reste à l'écran par une simple position collante, sans épinglage : rien n'est coupé, quelle que soit la hauteur de l'écran.
- **Pense-bête** : une liste de liens nommée « À faire » (une liste, pas un repère de page) ; une tâche faite est annoncée « (fait) » aux lecteurs d'écran ; sur le papier, l'anneau de focus prend la couleur de l'encre. « OK » au clavier rend le focus à « Voir les projets ». Il se colle et se décolle par une animation CSS, fluide même pendant le chargement de la scène 3D sur téléphone ; avec « réduire les animations », il apparaît et part sans bouger. Sans JavaScript, il reste une simple liste de liens, sans bouton OK.
- **Code** : les lignes trop longues passent à la ligne, aucune zone ne défile à l'horizontale.
- **Sans WebGL 2** : un symbole `</>` dessiné en SVG remplace la scène, le reste du site fonctionne.
- **Mobile** : matériau métal à la place du verre réfractif, résolution limitée, interactions au toucher. Le nom du hero apparaît sans flou (un filtre animé sur chaque lettre saccade sur un téléphone), et la scène 3D ne démarre qu'après cette entrée, pour ne pas la ralentir.
- **Vidéos des prototypes** : lecture automatique, muettes, dès qu'elles arrivent à l'écran, sur ordinateur comme sur mobile ; arrêt hors de l'écran. Si un téléphone refuse la lecture automatique (mode économie d'énergie, données limitées), la vidéo repart au premier toucher. Jamais de lecture automatique avec « réduire les animations » : le bouton de lecture reste là.
- three.js (≈ 138 ko gzip) est chargé à part : la page est utilisable avant lui.
- Le rendu 3D s'arrête quand le hero sort de l'écran ou que l'onglet est caché.

## À remplacer avant la mise en ligne

- **Formulaire de contact** : il ouvre le logiciel de courriel du visiteur (lien mailto:). Pour un envoi direct depuis le site, le brancher sur un service (Formspree, Resend…).
- **Glorious Hall** : remettre `glorioushall.com` (lien et barre de la maquette) quand le domaine principal sera rétabli.
- **Prototype Figma de l'ERP** : le lien « Voir le prototype » ne s'ouvre pour les visiteurs que si le fichier est partagé en lecture à toute personne qui a le lien.
- **Badge WES** : si WES propose un badge numérique (Credly) pour cette évaluation, ajouter son lien de vérification à côté de l'extrait du rapport.
- **Années du parcours** : la section Parcours n'affiche pas de dates ; à ajouter si souhaité.
- **Image de partage** (`og:image`) : à créer, pour un bel aperçu sur LinkedIn.
- **Domaine** : une fois l'adresse du site connue, ajouter dans les deux pages `canonical`, `og:url` et les liens `hreflang` (fr-CA, en-CA, x-default) avec des adresses complètes, comme le demande Google.
- **CV en anglais** : à déposer dans `public/cv/` et à relier depuis la page anglaise, si souhaité.

## Déploiement

Le build utilise des chemins relatifs (`base: './'`) : `dist/` fonctionne à la racine d'un domaine comme dans un sous-dossier. Il produit deux pages, `dist/index.html` (français) et `dist/en/index.html` (anglais), qui partagent les mêmes fichiers de `dist/assets/`.

- **Vercel / Netlify** : commande `npm run build`, dossier `dist`.
- **GitHub Pages** : publier le contenu de `dist/`.

## Contribuer

1. Créer une branche depuis `main` (`feat/…`, `fix/…`, `docs/…`).
2. Ouvrir une pull request vers `main`.
3. Relecture, corrections, validation, puis fusion. Pas de push direct sur `main`.
