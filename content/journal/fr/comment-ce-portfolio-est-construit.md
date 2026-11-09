---
title: Comment j'ai construit ce portfolio
date: 2026-11-09
summary: Vite, GSAP, three.js et deux langues écrites à la main : les choix techniques que j'ai faits pour ce site, et ce que chacun apporte au visiteur.
tags: [portfolio, vite, accessibilité]
draft: false
---

Pour moi, un portfolio de développeur est déjà une démonstration. Plutôt que de partir d'un modèle tout fait, je l'ai écrit à la main : du HTML, du CSS et du JavaScript sans framework, assemblés par Vite. Voici les choix qui le structurent.

![La page d'accueil : mon nom, l'accroche et le symbole 3D à droite](../images/portfolio-accueil.webp "La page d'accueil, avec le symbole « </> » en 3D")

## Un établi plutôt qu'une vitrine

J'ai voulu que le site ressemble à mon quotidien de développeur. L'invite de commande, en haut de la page, suit la section que vous lisez (`yann@siaka:~/projets$`). Ma méthode se lit comme un historique Git, et mon parcours comme un fichier CHANGELOG. L'idée : montrer ma façon de travailler autant que ce que j'ai livré.

## Mes outils

- **Vite** construit le site : un serveur de développement instantané, et un build qui produit plusieurs pages, le français à la racine, l'anglais dans `en/`, et maintenant ce journal.
- **GSAP et ScrollTrigger** animent les révélations au défilement, les projets épinglés et les couches des compétences.
- **Lenis** adoucit le défilement, sauf quand l'appareil demande moins d'animations.
- **three.js** dessine le symbole 3D. Je le charge après la page : le hero se lit sans l'attendre, et sur téléphone, il n'arrive qu'au premier geste du visiteur.

## L'accessibilité d'abord

Je tiens à ce qu'une page animée reste utilisable par tout le monde :

- avec le réglage « réduire les animations », il n'y a ni défilement doux ni animation d'entrée, et tout le contenu s'affiche tout de suite ;
- un bouton pause fige tout ce qui bouge seul ;
- le texte garde un contraste d'au moins 7:1 ;
- tout se fait au clavier, avec un focus toujours visible.

## Deux langues, sans traduction automatique

J'ai traduit la version anglaise moi-même, en gardant la même structure que la page française. Pour qu'un traducteur automatique ne transforme pas les noms propres en mots ordinaires, je les protège un par un :

```html
<p>Construit avec <span translate="no">Vite</span>, déployé sur Vercel.</p>
```

Sans cette protection, un traducteur automatique risque de lire « Vite » comme l'adverbe français et de le traduire par *quickly*.

## Et ce journal?

J'écris chaque note dans un fichier Markdown, rangé dans le dépôt. Au build, Vite en fait une page, met à jour la section Journal de l'accueil et le flux Atom. Publier une note, c'est donc faire un commit, comme pour le reste du code.
