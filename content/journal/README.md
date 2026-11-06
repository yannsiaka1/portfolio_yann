# Journal

Chaque fichier Markdown de `fr/` ou de `en/` devient une page du site. Pas de base de données ni d'interface d'administration : une note est un fichier, et la publier, c'est faire un commit.

| Fichier | Page en ligne |
| --- | --- |
| `fr/mon-avis-sur-laravel-12.md` | `/journal/mon-avis-sur-laravel-12/` |
| `en/my-take-on-laravel-12.md` | `/en/journal/my-take-on-laravel-12/` |

## Écrire une note

1. **Copier `modele.md`** dans `fr/`, ou dans `en/` pour une note en anglais.
2. **Le renommer** : le nom du fichier devient l'adresse de la page. Minuscules, chiffres et tirets seulement, sans accents (`retour-sur-github-foundations.md`).
3. **Remplir l'en-tête**, entre les deux lignes `---` :

   | Clé | Obligatoire | Rôle |
   | --- | --- | --- |
   | `title` | oui | le titre de la note |
   | `date` | oui | la date de publication, au format `AAAA-MM-JJ` ; les notes sont classées de la plus récente à la plus ancienne |
   | `summary` | oui | une ou deux phrases, montrées dans les listes, sur l'accueil et dans les aperçus de partage (LinkedIn) |
   | `tags` | non | les sujets, entre crochets : `[veille, laravel]` |
   | `draft` | non | `true` tant que la note n'est pas prête ; la ligne peut être supprimée une fois publiée |

   Une valeur s'écrit telle quelle, même avec un deux-points ou une apostrophe (`title: L'IA : mode d'emploi`). Des guillemets droits autour sont retirés ; dans `tags`, ils permettent un sujet qui contient une virgule (`["Laravel, Livewire", veille]`).

4. **Écrire le texte** en Markdown, sous l'en-tête. Le titre de la note est déjà affiché par la page : commencer les parties par `##`, les sous-parties par `###`. `modele.md` montre le reste : gras, italique, liens, listes, code, citations, images.
5. **Relire** : `npm run dev`, puis ouvrir `http://localhost:5173/journal/`. Les brouillons y sont visibles, avec la mention « Brouillon ». La page se recharge à chaque enregistrement du fichier.
6. **Publier** : passer `draft` à `false` (ou supprimer la ligne), faire un commit et le pousser sur `main`. Vercel reconstruit le site, et la note apparaît sur l'accueil et dans le journal en une ou deux minutes.

## Depuis GitHub, sans ordinateur

Sur github.com, ouvrir le dossier `content/journal/fr/` du dépôt, puis **Add file › Create new file**. Nommer le fichier, coller le contenu de `modele.md`, écrire la note, puis **Commit changes** :

- **sur une nouvelle branche** avec une pull request : Vercel construit un aperçu de la branche, où les brouillons sont visibles. C'est la façon de relire la note sur le vrai site avant de la publier. Fusionner la pull request publie la note ;
- **directement sur `main`** : la note est en ligne dès la fin du build, si `draft` vaut `false`.

## Images

Déposer l'image dans `images/`, de préférence en WebP, 1200 px de large au plus (une capture d'écran pèse alors 30 à 100 ko). Puis, dans la note :

```markdown
![Ce que montre l'image, pour qui ne la voit pas](../images/capture-du-tableau-de-bord.webp "Légende facultative")
```

La description entre crochets est lue par les lecteurs d'écran et s'affiche si l'image ne charge pas : toujours la remplir. Le chemin part de la note, comme sur GitHub : l'image s'affiche aussi dans l'aperçu Markdown de GitHub. Au build, Vite l'optimise et lui donne un nom unique. Une image introuvable arrête le build, avec son chemin.

## Liens

- **Vers une autre note** : son fichier, `[titre](autre-note.md)`, ou `[title](../en/other-note.md)` pour une note de l'autre langue. Le lien marche aussi dans l'aperçu de GitHub, et le build vérifie que la note existe.
- **Vers une page du site** : depuis la page de la note, `[mes projets](../../#projets)`.
- **Vers un fichier** (PDF…) : le ranger dans `public/`, puis le viser depuis la page de la note : `[mon CV](../../cv/yann-siaka-cv.pdf)`. Le build vérifie qu'il existe.
- **Vers un autre site** : l'adresse complète, `https://…`. Le lien s'ouvre dans un nouvel onglet, et les lecteurs d'écran l'annoncent.

## Langues

- **Écrire dans une seule langue suffit.** Une note en français apparaît aussi sur la version anglaise du site, avec la mention « In French », et inversement avec « En anglais ».
- **Traduire une note** : créer dans `en/` un fichier du **même nom** que la note de `fr/` (ou l'inverse). Les deux versions se relient alors entre elles (« Read this note in English »), et chaque version du site montre la sienne.
- **Traducteurs automatiques** : les noms propres et outils au nom de mot courant (Vite, Render, Railway, Easy Life, Precious…) sont protégés automatiquement, comme sur l'accueil. Pour en protéger un autre : `<span translate="no">Nom</span>`. Le code (entre accents graves ou en bloc) n'est jamais traduit.

## Ce que le site fait tout seul

- **Accueil** : la section Journal montre les trois dernières notes, avec un lien vers toutes les autres. Elle n'existe pas, son lien du menu non plus, tant qu'aucune note n'est publiée.
- **Chaque note** : date en toutes lettres, durée de lecture, sujets, lien vers sa traduction s'il y en a une, retour au journal et lien de contact.
- **Typographie** : apostrophes typographiques, espace insécable avant le deux-points et dans les guillemets français, comme sur le reste du site.
- **Flux Atom** (`/journal/feed.xml`) : les lecteurs de flux reçoivent les nouvelles notes. Les brouillons n'y entrent jamais.
- **Brouillons** : visibles avec `npm run dev` et sur les aperçus Vercel des branches, jamais sur le site en ligne. Pour les voir dans un build local : `JOURNAL_DRAFTS=1 npm run build`.

## Si le build échoue

Une note mal écrite arrête le build, sur Vercel comme sur l'ordinateur, avec un message qui dit quoi corriger :

```text
content/journal/fr/ma-note.md : la date s'écrit AAAA-MM-JJ, par exemple « date: 2026-11-06 » (reçu : « 6 nov »).
```

Le site en ligne reste alors sur sa version précédente : corriger le fichier, faire un nouveau commit, et le build repart. Avec `npm run dev`, la note fautive est simplement mise de côté, avec le même message dans le terminal.

Le fonctionnement complet est décrit en tête de `scripts/journal.mjs`.
