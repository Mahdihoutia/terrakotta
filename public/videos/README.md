# Videos publiques

## audit-energetique-definition.mp4

**Source** : Freepik — [Ingénieur ouvrant porte du moulin à vent 4K](https://fr.freepik.com/video-gratuite/ingenieur-ouvrant-porte-du-moulin-a-vent-4k_1863693)

**Utilisée sur** : `/audit-energetique` — section "Qu'est-ce qu'un audit énergétique ?"

### Comment l'ajouter

1. Se connecter à Freepik (compte gratuit)
2. Télécharger la vidéo au format MP4
3. Renommer le fichier en `audit-energetique-definition.mp4`
4. Le placer dans `public/videos/`

### Licence & attribution

La licence gratuite Freepik exige une attribution. Vérifier les conditions
actuelles sur le lien source. L'attribution peut être ajoutée dans le footer
du site ou dans une page dédiée aux crédits.

### Optimisation recommandée

Avant commit, compresser la vidéo pour alléger le poids :

```bash
ffmpeg -i source.mp4 -vcodec libx264 -crf 28 -preset slow \
  -vf "scale=1280:-2" -an audit-energetique-definition.mp4
```

Cible : < 2 Mo pour une boucle de quelques secondes, sans audio (la balise
`muted` est active, inutile de conserver la piste audio).
