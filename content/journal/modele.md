---
# Modèle d'un article : un sujet développé, avec des parties. Pour quelques lignes : modele-note.md ;
# pour une vidéo ou une page à voir : modele-ressource.md. Les lignes qui commencent par # sont ignorées.
type: article
title: Le titre de la note
date: 2026-11-06
summary: Une ou deux phrases qui donnent envie de lire. Elles s'affichent dans les listes et dans les aperçus de partage.
tags: [veille, laravel]
draft: true
---

Le premier paragraphe pose le sujet : ce que tu as essayé, appris ou pensé, et pourquoi c'est utile à quelqu'un d'autre.

## Une partie

Du texte, avec un mot en **gras**, un mot en *italique* et un [lien vers la documentation](https://laravel.com/docs).
Un nom de commande ou de fichier s'écrit entre accents graves : `php artisan migrate`.

- une liste à puces
- un deuxième point

### Une sous-partie

```php
Route::get('/notes', [NoteController::class, 'index']);
```

> Une citation, ou une remarque à mettre en avant.

![Ce que montre l'image, pour qui ne la voit pas](../images/nom-de-l-image.webp "Légende facultative, affichée sous l'image")

Un lien vers une autre note du journal : [titre de l'autre note](autre-note.md).
