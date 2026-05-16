---
layout: page
title: "🇫🇷 Français"
permalink: /fr/
lang: fr
---

# [Client Side Video Editor](https://github.com/europanite/client_side_video_editor "Client Side Video Editor")

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
![OS](https://img.shields.io/badge/OS-Linux%20%7C%20macOS%20%7C%20Windows-blue)
[![CI](https://github.com/europanite/client_side_video_editor/actions/workflows/ci.yml/badge.svg)](https://github.com/europanite/client_side_video_editor/actions/workflows/ci.yml)
[![docker](https://github.com/europanite/client_side_video_editor/actions/workflows/docker.yml/badge.svg)](https://github.com/europanite/client_side_video_editor/actions/workflows/docker.yml)
[![pages](https://github.com/europanite/client_side_video_editor/actions/workflows/pages.yml/badge.svg)](https://github.com/europanite/client_side_video_editor/actions/workflows/pages.yml)

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Jest](https://img.shields.io/badge/-jest-%23C21325?style=for-the-badge&logo=jest&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)

<p align="right">
  <a href="https://europanite.github.io/client_side_video_editor/">🇺🇸 English</a> |
  <a href="https://europanite.github.io/client_side_video_editor/hi/">🇮🇳 हिंदी</a> |
  <a href="https://europanite.github.io/client_side_video_editor/ja/">🇯🇵 日本語</a> |
  <a href="https://europanite.github.io/client_side_video_editor/zh-CN/">🇨🇳 简体中文</a> |
  <a href="https://europanite.github.io/client_side_video_editor/es/">🇪🇸 Español</a> |
  <a href="https://europanite.github.io/client_side_video_editor/pt-BR/">🇧🇷 Português (Brasil)</a> |
  <a href="https://europanite.github.io/client_side_video_editor/ko/">🇰🇷 한국어</a> |
  <a href="https://europanite.github.io/client_side_video_editor/de/">🇩🇪 Deutsch</a> |
  <a href="https://europanite.github.io/client_side_video_editor/fr/">🇫🇷 Français</a>
</p>

!["web_ui"](./assets/images/web_ui.png)

 [PlayGround](https://europanite.github.io/client_side_video_editor/)

Un éditeur vidéo gratuit, côté client et basé sur le navigateur.

Un **micro-éditeur vidéo 100% côté client** qui s’exécute entièrement dans votre navigateur.  
Vous pouvez :
- **Rogner une plage temporelle**
- **Faire un recadrage rectangulaire**
- **Exporter le clip**

Aucun serveur n’est requis.
Tout est fait avec **HTML5 Video + Canvas + MediaRecorder**.

---

### Étapes

1. Choisissez un fichier vidéo.
2. Définissez le **crop** :
   - Déplacez le curseur sur l’aperçu vidéo.
   - Cliquez et faites glisser pour dessiner un rectangle (zone de recadrage).
   - Double-cliquez dans l’aperçu pour réinitialiser le recadrage.
3. Ajustez le **trim range** :
   - Déplacez Start/End sur le curseur, _ou_
   - Lisez la vidéo et cliquez sur :
     - **Use current time as Start**
     - **Use current time as End**
4. Cliquez sur **Export**.
5. Attendez la fin de l’export :

---

### 🔒 Confidentialité

- Aucun fichier n’est jamais téléversé vers un serveur.
- Tout le traitement est effectué localement dans l’onglet de votre navigateur.
- Sûr pour les enregistrements privés, les captures d’écran, etc.

---

## 🚀 Bien démarrer

### 1. Prérequis
- [Docker Compose](https://docs.docker.com/compose/)

### 2. Construire et démarrer tous les services :

```bash

# Build the image
docker compose build

# Run the container
docker compose up

```

### 3. Test :
```bash
docker compose \
-f docker-compose.test.yml up \
--build --exit-code-from \
frontend_test
```

---

## Vue d’ensemble technique

### 1. Stack technique

- **Frontend:** React + TypeScript + Vite  
- **Styling:** Plain CSS (`src/style.css`)
- **Tests:** Jest + ts‑jest  
- **Container:** Docker / Docker Compose pour un développement et des tests reproductibles

### 2. Flux de données

1. **Entrée de fichier**
   - L’utilisateur sélectionne/dépose un fichier -> il est stocké comme `File` dans le state React.

2. **Métadonnées et dimensions**
   - `onLoadedMetadata` lit :
     - `video.duration`
     - `video.videoWidth`, `video.videoHeight`
   - Ces valeurs sont utilisées pour :
     - La plage du curseur de découpe (0 → duration)
     - Convertir les coordonnées de recadrage de CSS space → video pixel space.

3. **Plage de découpe**
   - Deux numeric states :
     - `trimStart: number`
     - `trimEnd: number`
   - Le curseur et les numeric inputs restent synchronisés.
   - constraints :
     - `0 ≤ trimStart ≤ trimEnd ≤ duration`

4. **Rectangle de recadrage**
   - Pointer events sur `<video>` :
     - `pointerdown`: commencer le recadrage
     - `pointermove`: mettre à jour le recadrage pendant le glissement
     - `pointerup` / `pointerleave`: finalize crop
   - Les coordinates sont normalize à partir de la bounding box de la vidéo et scale vers la native resolution :

5. **Export**
   - `canvas.width / height` = width/height du recadrage (ou video size complète).
   - `canvas.captureStream(fps)` obtient un `MediaStream`.
   - Les Frames sont dessinées avec `requestAnimationFrame` jusqu’à ce que :
     - `now >= endTime` ou `video.currentTime >= trimEnd`
   - Une fois terminé :
     - `MediaRecorder.stop()`
     - Les Chunks sont combinés dans un `Blob` et téléchargés.

---

# Licence
- Apache License 2.0
