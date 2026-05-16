---
layout: page
title: "🇧🇷 PT-BR"
permalink: /pt-BR/
lang: pt-BR
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

Um editor de vídeo gratuito, client-side e baseado no navegador.

Um **microeditor de vídeo 100% client-side** que roda inteiramente no seu navegador.  
Você pode:
- **Cortar um intervalo de tempo**
- **Fazer crop retangular**
- **Exportar o clipe**

Nenhum servidor é necessário.
Tudo é feito com **HTML5 Video + Canvas + MediaRecorder**.

---

### Etapas

1. Escolha um arquivo de vídeo.
2. Defina o **crop**:
   - Mova o cursor sobre a prévia do vídeo.
   - Clique e arraste para desenhar um retângulo (área de crop).
   - Clique duas vezes dentro da prévia para redefinir o crop.
3. Ajuste o **trim range**:
   - Mova Start/End no controle deslizante, _ou_
   - Reproduza o vídeo e clique em:
     - **Use current time as Start**
     - **Use current time as End**
4. Clique em **Export**.
5. Aguarde até a exportação terminar:

---

### 🔒 Privacidade

- Nenhum arquivo é enviado para um servidor.
- Todo o processamento é feito localmente na aba do seu navegador.
- Seguro para gravações privadas, capturas de tela etc.

---

## 🚀 Começando

### 1. Pré-requisitos
- [Docker Compose](https://docs.docker.com/compose/)

### 2. Compile e inicie todos os serviços:

```bash

# Build the image
docker compose build

# Run the container
docker compose up

```

### 3. Teste:
```bash
docker compose \
-f docker-compose.test.yml up \
--build --exit-code-from \
frontend_test
```

---

## Visão técnica

### 1. Stack técnica

- **Frontend:** React + TypeScript + Vite  
- **Styling:** Plain CSS (`src/style.css`)
- **Tests:** Jest + ts‑jest  
- **Container:** Docker / Docker Compose para desenvolvimento e testes reproduzíveis

### 2. Fluxo de dados

1. **Entrada de arquivo**
   - O usuário seleciona/solta um arquivo -> armazenado como `File` no estado do React.

2. **Metadados e dimensions**
   - `onLoadedMetadata` lê:
     - `video.duration`
     - `video.videoWidth`, `video.videoHeight`
   - Esses dados são usados para:
     - Faixa do controle deslizante de corte (0 → duration)
     - Converter coordenadas de crop de CSS space → video pixel space.

3. **Intervalo de corte**
   - Dois numeric states:
     - `trimStart: number`
     - `trimEnd: number`
   - O controle deslizante e os numeric inputs são mantidos sincronizados.
   - constraints:
     - `0 ≤ trimStart ≤ trimEnd ≤ duration`

4. **Retângulo de crop**
   - Pointer events em `<video>`:
     - `pointerdown`: iniciar crop
     - `pointermove`: atualizar o crop durante o arrasto
     - `pointerup` / `pointerleave`: finalize crop
   - As coordinates são normalizadas pelo bounding box do vídeo e escaladas para a native resolution:

5. **Exportação**
   - `canvas.width / height` = width/height do crop (ou video size completo).
   - `canvas.captureStream(fps)` obtém um `MediaStream`.
   - Os Frames são desenhados com `requestAnimationFrame` até:
     - `now >= endTime` ou `video.currentTime >= trimEnd`
   - Quando terminar:
     - `MediaRecorder.stop()`
     - Os Chunks são combinados em um `Blob` e baixados.

---

# Licença
- Apache License 2.0
