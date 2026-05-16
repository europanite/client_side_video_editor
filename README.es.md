---
layout: page
title: "🇪🇸 Español"
permalink: /es/
lang: es
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

!["web_ui"](./assets/images/web_ui.png)

 [PlayGround](https://europanite.github.io/client_side_video_editor/)

Un editor de video gratuito, del lado del cliente y basado en el navegador.

Un **microeditor de video 100% del lado del cliente** que se ejecuta por completo en tu navegador.  
Puedes:
- **Recortar un rango de tiempo**
- **Hacer un recorte rectangular**
- **Exportar el clip**

No se requiere servidor.
Todo se hace con **HTML5 Video + Canvas + MediaRecorder**.

---

### Pasos

1. Elige un archivo de video.
2. Configura el **crop**:
   - Mueve el cursor sobre la vista previa del video.
   - Haz clic y arrastra para dibujar un rectángulo (área de recorte).
   - Haz doble clic dentro de la vista previa para restablecer el recorte.
3. Ajusta el **trim range**:
   - Mueve Start/End en el deslizador, _o_
   - Reproduce el video y haz clic en:
     - **Use current time as Start**
     - **Use current time as End**
4. Haz clic en **Export**.
5. Espera hasta que termine la exportación:

---

### 🔒 Privacidad

- Ningún archivo se sube jamás a un servidor.
- Todo el procesamiento se realiza localmente en la pestaña de tu navegador.
- Seguro para grabaciones privadas, capturas de pantalla, etc.

---

## 🚀 Primeros pasos

### 1. Requisitos previos
- [Docker Compose](https://docs.docker.com/compose/)

### 2. Compila e inicia todos los servicios:

```bash

# Build the image
docker compose build

# Run the container
docker compose up

```

### 3. Prueba:
```bash
docker compose \
-f docker-compose.test.yml up \
--build --exit-code-from \
frontend_test
```

---

## Descripción técnica

### 1. Stack tecnológico

- **Frontend:** React + TypeScript + Vite  
- **Styling:** Plain CSS (`src/style.css`)
- **Tests:** Jest + ts‑jest  
- **Container:** Docker / Docker Compose para desarrollo y pruebas reproducibles

### 2. Flujo de datos

1. **Entrada de archivo**
   - El usuario selecciona/suelta un archivo -> se almacena como `File` en el estado de React.

2. **Metadatos y dimensions**
   - `onLoadedMetadata` lee:
     - `video.duration`
     - `video.videoWidth`, `video.videoHeight`
   - Se usan para:
     - Rango del deslizador de recorte (0 → duration)
     - Convertir coordenadas de recorte de CSS space → video pixel space.

3. **Rango de recorte**
   - Dos numeric states:
     - `trimStart: number`
     - `trimEnd: number`
   - El deslizador y los numeric inputs se mantienen sincronizados.
   - constraints:
     - `0 ≤ trimStart ≤ trimEnd ≤ duration`

4. **Rectángulo de recorte**
   - Pointer events en `<video>`:
     - `pointerdown`: iniciar recorte
     - `pointermove`: actualizar el recorte durante el arrastre
     - `pointerup` / `pointerleave`: finalize crop
   - Las coordinates se normalizan con el bounding box del video y se escalan a la native resolution:

5. **Exportación**
   - `canvas.width / height` = width/height del recorte (o video size completo).
   - `canvas.captureStream(fps)` obtiene un `MediaStream`.
   - Los Frames se dibujan con `requestAnimationFrame` hasta que:
     - `now >= endTime` o `video.currentTime >= trimEnd`
   - Al finalizar:
     - `MediaRecorder.stop()`
     - Los Chunks se combinan en un `Blob` y se descargan.

---

# Licencia
- Apache License 2.0
