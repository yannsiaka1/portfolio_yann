# Portfolio de Yann Siaka

Je suis développeur full-stack à Montréal, et voici mon portfolio. J'ai pensé la page d'accueil pour un recruteur : qui je suis et mes outils dès le premier écran, ce que je sais faire, mes projets en ligne, mon parcours, ma méthode, une présentation plus personnelle, puis comment me joindre. J'y tiens aussi un journal de ce que j'apprends, écrit en Markdown. Pour le motion design, je me suis inspiré de [trionn.com](https://trionn.com/) (symbole 3D, révélations au défilement, bandeau, curseur, projets qui défilent un par un) et j'ai repris les codes de la première version du site (titres avec mots d'accent en italique, cartes de projet avec maquettes, grain), sur une hiérarchie et une typographie pensées pour rester lisibles.

**Stack** : [Vite](https://vite.dev) · [marked](https://marked.js.org) (Markdown du journal, au build) · [three.js](https://threejs.org) · [GSAP](https://gsap.com) + ScrollTrigger · [Lenis](https://lenis.darkroom.engineering) · polices auto-hébergées ([Fontsource](https://fontsource.org)) : Archivo pour le texte, Newsreader en italique pour les mots d'accent, JetBrains Mono pour le code et les petites étiquettes techniques.
Aucun framework : HTML, CSS et JavaScript en modules.

## Démarrer

Prérequis : Node.js 20.19+ ou 22.12+ (exigence de Vite 8).

```bash
npm install
npm run dev       # serveur de développement sur http://localhost:5173
npm run build     # build de production dans dist/
npm run preview   # sert dist/ pour vérifier le build
npm run check:i18n  # vérifie que les pages française et anglaise gardent la même structure
npm run verify    # vérification complète, point par point : build, deux langues, référencement, liens, sécurité, navigateur
JOURNAL_DRAFTS=1 npm run build  # build avec les brouillons du journal (sinon visibles seulement en dev et sur les aperçus Vercel)
```

## Structure

```
index.html                 tout le contenu de la page en français, balises de partage
en/index.html              la même page en anglais : même balisage, texte traduit à la main
404.html                   page servie par Vercel à toute adresse inconnue, en français et en anglais
site.config.js             l'adresse publique du site, écrite à un seul endroit (canonique, plan du site, partage, flux)
scripts/check-i18n.mjs     compare la structure des deux pages (npm run check:i18n)
scripts/verify.mjs         vérification complète, point par point (npm run verify)
scripts/journal.mjs        journal : notes Markdown → pages, section de l'accueil, flux Atom (extension Vite)
scripts/site.mjs           adresse du site dans les pages, sitemap.xml, robots.txt, page 404 (extension Vite)
scripts/icons.mjs          génère public/icons.svg à partir de Simple Icons (mode d'emploi en tête du fichier)
scripts/og/og-image.html   source de l'image de partage public/og/yann-siaka.png
content/journal/           les notes du journal : fr/, en/, images/, trois modèles et le mode d'emploi (README.md)
journal/, en/journal/      pages du journal, générées à chaque lancement de Vite (ignorées par Git : ne pas modifier)
vercel.json                en-têtes de sécurité et de cache ; adresses toujours terminées par « / » (/en/, /journal/…)
public/favicon.svg
public/icons.svg           les logos des outils (hero et compétences), une seule couleur, générés par scripts/icons.mjs
public/og/                 image de partage (LinkedIn, messageries), 1200 × 630
public/posters/            affiches des vidéos de prototypes, posées à l'approche de leur carte (src/ui/posters.js)
public/proofs/             pièce justificative agrandissable : attestation D-CLIC (720 et 1200 px)
public/cv/yann-siaka-cv.pdf CV à télécharger (hero, Contact, pied de page), sans numéro de téléphone ; pour le mettre à jour, remplacer ce fichier en gardant son nom
src/
├── main.js                point d'entrée : polices, styles, interface, puis scène 3D chargée à part
├── journal.js             point d'entrée des pages du journal et de la page 404 : polices, styles, barre (sans 3D)
├── app.js                 assemble l'interface : le premier écran tout de suite, puis chaque section dans sa propre tâche
├── core/
│   ├── env.js             préférences de l'appareil (souris, tactile, mouvement réduit), jetons, utilitaires DOM
│   ├── state.js           état partagé avec la scène 3D, pause globale des animations
│   ├── i18n.js            langue de la page, pour les textes écrits par les scripts : t({ fr, en })
│   ├── gsap.js            GSAP + ScrollTrigger enregistrés une seule fois
│   ├── scroll.js          défilement doux Lenis, synchronisé avec ScrollTrigger et avec le focus clavier
│   └── text.js            découpe de texte et effet de brouillage « terminal »
├── ui/
│   ├── nav.js             invite « yann@siaka:~/section$ », section en cours, menu mobile, ancres
│   ├── cursor.js          curseur personnalisé et boutons magnétiques (souris seulement)
│   ├── pause.js           bouton pause de toutes les animations
│   ├── clocks.js          horloges Montréal et Douala, démarrées à l'approche de l'écran
│   ├── posters.js         affiches des vidéos de prototypes, posées à l'approche de leur carte
│   ├── video.js           vidéo d'une ressource du journal : le lecteur YouTube remplace le lien au clic
│   └── copy.js            bouton « Copier l'adresse » et son message
├── sections/              révélations, bandeau, projets (épinglés ou empilés, vidéo de l'ERP), compétences (six couches parcourues au défilement), méthode, contact, pied de page
├── hero/
│   ├── scene.js           scène three.js : rendu, interactions, boucle d'animation
│   ├── formations.js      les 7 symboles, décrits panneau par panneau
│   └── helpers.js         géométrie arrondie, courbes d'animation
└── styles/                importés dans cet ordre par index.css
    ├── tokens.css         la seule source des couleurs, tailles, espacements et rayons
    ├── base.css           remise à zéro, titres, focus, utilitaires
    ├── layout.css         conteneur, barre de navigation, sections, pied de page
    ├── components.css     bouton, lien, statut, outils, sur-titre, compteur, élément à filet, code, progression au défilement, formulaire, progression
    ├── chrome.css         curseur et grain
    ├── hero.css           hero (nom, outils, entrée en CSS) et scène 3D
    ├── sections.css       bandeau, projets, à propos, compétences, méthode, parcours, contact, signature
    ├── journal.css        liste des notes (accueil et journal) et page d'une note
    └── journal-page.css   styles des pages du journal : les communs du site, plus journal.css
```

## Deux langues

- **Deux pages, une structure** : le français à la racine (`index.html`), l'anglais dans `en/` (`en/index.html`). Mêmes balises, mêmes identifiants, mêmes classes ; seuls changent le texte, les attributs lisibles (`alt`, `aria-label`, `title`, valeurs des choix), la langue (`lang="fr-CA"` ou `lang="en-CA"`) et les chemins (`../` dans `en/`).
- **Traduction faite à la main** : je traduis moi-même, sans traducteur automatique, en vérifiant les termes métier et techniques (récit utilisateur, idempotence, jalons, projet tutoré traduit par *capstone project*) et en suivant l'orthographe canadienne (*colour*, *modelling*, *traveller*). Les visiteurs anglophones lisent ainsi un texte juste au lieu d'une traduction automatique de la page française.
- **Textes des scripts** (menu mobile, bouton pause, vidéos, formulaire, indications du symbole 3D, horloges) : ils suivent la langue de la page par `src/core/i18n.js`, écrits sous la forme `t({ fr: '…', en: '…' })`.
- **Passer d'une langue à l'autre** : un bouton toujours visible dans la barre, sur ordinateur comme sur mobile, avec un globe à l'accent : « English » ou « Français » dès 1280 px, « EN » ou « FR » en dessous (le mot entier reste lu par les lecteurs d'écran). Aussi « English version » ou « Version française » dans le pied de page. Attributs `hreflang` et `lang` sur ces liens. Pour que la barre tienne sur une ligne à toutes les largeurs, l'invite se raccourcit dans les sections : « ~/section$ » entre 1024 et 1279 px (les liens du menu y sont aussi resserrés), « yann:~/section$ » puis « ~/section$ » sur mobile ; à l'accueil, elle reste « yann@siaka:~$ » (« yann:~$ » entre 1024 et 1279 px).
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
| Barre | invite « yann@siaka:~/section$ » qui suit la section lue, six onglets (Compétences, Projets, Parcours, Méthode, Journal, À propos), langue, « Me contacter » plein à l'accent | dès 1280 px, onglets centrés sur l'écran ; survol et section lue à l'accent, avec un trait qui se dessine sous l'onglet |
| Hero | nom, rôle, quinze outils (logo d'une seule couleur et nom écrit, de l'analyse à la mise en ligne, puis les outils d'IA), une phrase et le slogan, « Voir les projets », CV, GitHub, disponibilité, symbole 3D | chaque ligne monte à sa place en CSS, sans jamais être cachée ; symbole qui s'assemble |
| Bandeau | les étapes, du problème à la maintenance | défilement infini qui suit la vitesse du scroll |
| Compétences | six couches, de l'analyse du besoin à la mise en ligne ; pour chacune : les outils d'abord, une phrase, trois puces, ce que l'IA y fait et ce que je vérifie, un extrait de code au plus ; l'introduction nomme les méthodes de travail | on parcourt les couches au défilement, une par hauteur d'écran ; sur grand écran, la pile et la progression restent à l'écran et s'allument sur la couche lue ; un clic sur la pile mène à sa couche |
| Projets | cinq cartes : Precious, Glorious Hall, EasyTravel, Easy Life (prototype, schéma, jalons), l'ERP de l'IUT (vidéo du prototype) | grand écran : section épinglée, chaque projet arrive par la droite pendant que le précédent bascule à gauche ; ailleurs, cartes empilées qui arrivent par la droite et repartent à gauche |
| Repères | quatre chiffres en cartes, dont les horloges Montréal et Douala ; ils prolongent les projets (l'onglet Projets reste allumé) | compteurs à rouleaux |
| Parcours | journal des versions (diplômes, stages ; l'équivalence canadienne en une ligne sous la licence), langues, attestation D-CLIC avec qui contacter pour la faire confirmer, certifications | blocs qui montent |
| Méthode | sept étapes, du besoin à la maintenance, lues comme un historique Git (le design et le prototypage avant le développement) | graphe tracé au défilement |
| Journal | « Ce que j'apprends, au jour le jour » : les trois dernières entrées (note courte lue en entier, article ou ressource) et le lien vers toutes ; absente, avec son lien du menu, tant qu'aucune note n'est publiée | blocs qui montent |
| À propos | titre, phrase d'accroche avec mots d'accent, présentation | phrase éclairée mot par mot (du gris au blanc, lisible à plus de 7:1 à chaque instant) |
| Contact | formulaire qui prépare un courriel, aperçu JSON, courriel direct, LinkedIn, GitHub, CV à télécharger | aperçu mis à jour à la saisie |
| Pied de page | signature, horloges Montréal et Douala | une vague gonfle les lettres de la signature, en boucle, tant qu'elle est à l'écran ; à la souris, graisse et chasse suivent le curseur. Le nom tient sur une ou deux lignes selon la largeur, choisi une fois en rejouant la vague hors écran : l'animation ne le fait jamais changer de ligne (la page ne saute plus) |

## Journal

Les notes sont des fichiers Markdown dans `content/journal/` : `fr/` pour le français, `en/` pour l'anglais, `images/` pour leurs images. Le mode d'emploi complet est dans [`content/journal/README.md`](content/journal/README.md), que GitHub affiche en ouvrant le dossier.

- **Trois formats** : la note courte (`type: note`, quelques lignes lues en entier dans la liste), l'article (par défaut) et la ressource (`type: ressource` et `lien:`, une vidéo ou une page à voir ; une vidéo YouTube se lit dans la note, chargée au clic seulement).
- **Publier une note** : copier le modèle du format dans `fr/`, le renommer (le nom devient l'adresse), remplir l'en-tête, écrire, puis faire un commit directement sur `main` (c'est du contenu, pas du code). Possible depuis github.com, même sur téléphone.
- **Ce que produit le build** (`scripts/journal.mjs`, branché dans `vite.config.js`) : une page par note (`/journal/<adresse>/`, `/en/journal/<adresse>/`), un index par langue, la section Journal de l'accueil (trois dernières notes) et le flux Atom `/journal/feed.xml`. Les pages reprennent la barre et le pied de page de `index.html` et `en/index.html`, liens recalculés : modifier l'accueil suffit.
- **Langues** : une note s'écrit dans une seule langue ; l'autre version du site l'affiche avec « In French » ou « En anglais ». Le même nom de fichier dans `fr/` et `en/` relie deux traductions.
- **Brouillons** (`draft: true`) : visibles avec `npm run dev` et sur les aperçus Vercel des branches, avec la mention « Brouillon » et `noindex` ; jamais sur le site en ligne, ni dans le flux, ni dans le plan du site.
- **Référencement** : chaque page publiée a son adresse canonique, est reliée à sa traduction, entre dans `sitemap.xml` et porte l'image de partage ; un article publié porte sa fiche schema.org.
- **Erreurs** : une note mal écrite arrête le build avec le fichier et ce qu'il faut corriger ; en développement, elle est mise de côté et le message s'affiche dans le terminal.
- **Texte** : noms propres protégés des traducteurs automatiques (même liste que l'accueil), apostrophes typographiques, espace insécable avant le deux-points ; le code n'est jamais traduit. `##` ouvre une partie : le titre de la note est le seul `h1`.

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

- **Objectif WCAG 2.2 AA** : texte à 7:1 au moins, focus visible sur toute cible, navigation complète au clavier, lien d'évitement, cibles de 48 px, page lisible de 320 à 2 560 px de large sans défilement horizontal ; le nom de chaque lien contient son texte visible. `npm run verify` le vérifie avec axe sur toutes les pages, contraste du texte à 7:1 compris.
- **Mouvement réduit** (réglage système, suivi aussi s'il change pendant la visite) : pas de défilement doux, contenu visible tout de suite, hero immobile, symbole immobile, projets empilés, vidéos, grain et signature à l'arrêt.
- **Pause** : un bouton fige tout ce qui bouge seul (WCAG 2.2.2).
- **Liens vers une section** (`/#contact`, onglets du journal, liens du CV) : la page s'ouvre directement sur la section, juste sous la barre, son contenu déjà affiché. Au démarrage, rien de ce qui est déjà à l'écran n'est masqué puis révélé.
- **Clavier** : les blocs pas encore révélés restent focalisables ; un élément qui reçoit le focus du clavier est amené à l'écran sous la barre (un clic de souris ne fait jamais défiler la page) ; dans les projets épinglés, sa carte est amenée au repos.
- **Projets** : épinglés seulement sur un écran d'au moins 1024 × 640 px où chaque carte tient en entier (mesuré au chargement et à chaque redimensionnement : c'est le cas sur les ordinateurs portables courants, jusqu'à une fenêtre de 1280 × 640) ; sinon les cartes s'empilent, et rien n'est jamais coupé. Aux flèches du clavier, un pas suffit pour passer à la carte suivante. La vidéo de l'ERP ne joue que visible, a son propre bouton lecture et pause, et ne se lance jamais seule avec « réduire les animations ».
- **Compétences** : les six couches sont toutes dans la page, chacune avec son titre de niveau 3 ; la pile isométrique est décorative. Sur grand écran, elle reste à l'écran par une simple position collante, sans épinglage : rien n'est coupé, quelle que soit la hauteur de l'écran.
- **Code** : les lignes trop longues passent à la ligne, aucune zone ne défile à l'horizontale.
- **Sans WebGL 2** : un symbole `</>` dessiné en SVG remplace la scène, le reste du site fonctionne. Même repli sans accélération graphique (rendu par le processeur), ou si les premières images de la scène arrivent trop lentement : elle s'arrête alors pour de bon et rend la mémoire de la carte graphique.
- **Mobile** : matériau métal à la place du verre réfractif, résolution limitée, interactions au toucher. La scène 3D ne se charge qu'au premier geste du visiteur (toucher, défilement), jamais avec l'économiseur de données ; le symbole dessiné tient sa place en attendant.
- **Vidéos des prototypes** : lecture automatique, muettes, dès qu'elles arrivent à l'écran, sur ordinateur comme sur mobile ; arrêt hors de l'écran. Si un téléphone refuse la lecture automatique (mode économie d'énergie, données limitées), la vidéo repart au premier toucher. Jamais de lecture automatique avec « réduire les animations » : le bouton de lecture reste là.
- three.js (≈ 140 ko gzip) arrive après la page : à la souris quand le navigateur est libre, au premier geste sur écran tactile.
- **Ouverture** (Lighthouse, mobile, médiane de cinq passages) : performance 94 (de 92 à 99), accessibilité 100, bonnes pratiques 100, référencement 100 ; plus grand élément affiché vers 2,4 s ; sur ordinateur, 100 partout. Le texte du hero se lit dès la première image ; l'interface démarre après le premier affichage, chaque section dans sa propre tâche ; les révélations passent par IntersectionObserver et Web Animations ; affiches des vidéos, police des mots d'accent et horloges arrivent après le premier écran.
- **Sécurité** (`vercel.json`) : politique de sécurité du contenu stricte (rien ne se charge ni ne s'exécute hors du site, sauf le lecteur YouTube après un clic ; aucun style ni script en ligne, sauf une ligne autorisée par son empreinte, que `npm run verify` contrôle), pas d'intégration dans un cadre, référent limité, caméra, micro et géolocalisation coupés. Aucun service tiers ni témoin.
- Le rendu 3D s'arrête quand le hero sort de l'écran ou que l'onglet est caché.

## Ce qui reste à faire

- **Formulaire de contact** : il ouvre le logiciel de courriel du visiteur (lien mailto:). Pour un envoi direct depuis le site, le brancher sur un service (Formspree, Resend…).
- **Glorious Hall** : remettre `glorioushall.com` (lien et barre de la maquette) quand le domaine principal sera rétabli.
- **Prototype Figma de l'ERP** : le lien « Voir le prototype » ne s'ouvre pour les visiteurs que si le fichier est partagé en lecture à toute personne qui a le lien.
- **Domaine** : en cas de nouveau domaine, changer la ligne de `site.config.js` ; adresses canoniques, versions FR et EN, plan du site, image de partage et flux suivent au build.
- **CV en anglais** : à déposer dans `public/cv/` et à relier depuis la page anglaise, si souhaité.

## Déploiement

Le build utilise des chemins relatifs (`base: './'`) : `dist/` fonctionne à la racine d'un domaine comme dans un sous-dossier. Il produit deux pages, `dist/index.html` (français) et `dist/en/index.html` (anglais), qui partagent les mêmes fichiers de `dist/assets/`.

- **Vercel** : commande `npm run build`, dossier `dist` ; `vercel.json` ajoute les en-têtes de sécurité et de cache, et la page 404.
- **Netlify** : même build ; les en-têtes de `vercel.json` sont à reporter dans `netlify.toml`.
- **GitHub Pages** : publier le contenu de `dist/`.

## Contribuer

1. Créer une branche depuis `main` (`feat/…`, `fix/…`, `docs/…`).
2. Lancer `npm run verify` : tous les points doivent passer.
3. Ouvrir une pull request vers `main`.
4. Relecture, corrections, validation, puis fusion. Pas de push direct sur `main`, sauf pour une note du journal (du contenu, pas du code).
