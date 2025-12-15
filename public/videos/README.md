# Vidéo d'Introduction

## Comment ajouter votre vidéo d'intro

1. **Préparez votre vidéo** :
   - Format recommandé : MP4 (H.264)
   - Résolution recommandée : 1920x1080 (Full HD) ou 1280x720 (HD)
   - Durée recommandée : 5-15 secondes
   - Taille de fichier : Moins de 10 MB pour un chargement rapide

2. **Nommez votre fichier** :
   - Renommez votre vidéo en `intro.mp4`

3. **Placez la vidéo** :
   - Copiez votre fichier `intro.mp4` dans ce dossier (`public/videos/`)

4. **Formats supportés** :
   - MP4 (recommandé)
   - WebM (optionnel, pour meilleure compatibilité)

## Conseils pour une bonne vidéo d'intro

- **Court et percutant** : 5-10 secondes maximum
- **Logo animé** : Montrez votre logo Tomobilty
- **Musique** : Ajoutez une musique de fond courte (attention aux droits)
- **Qualité** : Utilisez une bonne résolution mais optimisez la taille
- **Message** : Affichez votre slogan ou message clé

## Outils pour créer votre vidéo

- **Canva** : Modèles de vidéos d'intro gratuits
- **Adobe After Effects** : Pour des animations professionnelles
- **DaVinci Resolve** : Gratuit et puissant
- **Online Video Editor** : Outils en ligne simples

## Désactiver la vidéo d'intro

Si vous voulez désactiver temporairement la vidéo d'intro :
- Supprimez ou renommez le fichier `intro.mp4`
- Ou modifiez le fichier `app/page.tsx` et changez `setShowIntro(true)` en `setShowIntro(false)`
