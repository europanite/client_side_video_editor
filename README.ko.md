---
layout: page
title: "🇰🇷 한국어"
permalink: /ko/
lang: ko
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

무료 클라이언트 사이드 브라우저 기반 비디오 편집기입니다.

브라우저 안에서 완전히 실행되는 **100% 클라이언트 사이드 비디오 마이크로 에디터**입니다.  
할 수 있는 작업:
- **시간 범위 트리밍**
- **직사각형 크롭**
- **클립 내보내기**

서버가 필요하지 않습니다.
모든 처리는 **HTML5 Video + Canvas + MediaRecorder**로 수행됩니다.

---

### 단계

1. 비디오 파일을 선택합니다.
2. **crop**을 설정합니다:
   - 비디오 미리보기 위로 커서를 이동합니다.
   - 클릭하고 드래그하여 직사각형(크롭 영역)을 그립니다.
   - 크롭을 재설정하려면 미리보기 안에서 더블 클릭합니다.
3. **trim range**를 조정합니다:
   - 슬라이더에서 Start/End를 이동하거나, _또는_
   - 비디오를 재생한 뒤 다음을 클릭합니다:
     - **Use current time as Start**
     - **Use current time as End**
4. **Export**를 클릭합니다.
5. 내보내기가 완료될 때까지 기다립니다:

---

### 🔒 개인정보 보호

- 파일은 절대 서버에 업로드되지 않습니다.
- 모든 처리는 브라우저 탭 안에서 로컬로 수행됩니다.
- 개인 녹화, 화면 캡처 등에 안전합니다.

---

## 🚀 시작하기

### 1. 사전 요구 사항
- [Docker Compose](https://docs.docker.com/compose/)

### 2. 모든 서비스를 빌드하고 시작합니다:

```bash

# Build the image
docker compose build

# Run the container
docker compose up

```

### 3. 테스트:
```bash
docker compose \
-f docker-compose.test.yml up \
--build --exit-code-from \
frontend_test
```

---

## 기술 개요

### 1. 기술 스택

- **Frontend:** React + TypeScript + Vite  
- **Styling:** Plain CSS (`src/style.css`)
- **Tests:** Jest + ts‑jest  
- **Container:** 재현 가능한 개발 및 테스트를 위한 Docker / Docker Compose

### 2. 데이터 흐름

1. **파일 입력**
   - 사용자가 파일을 선택/드롭함 -> React state에 `File`로 저장됩니다.

2. **메타데이터 및 dimensions**
   - `onLoadedMetadata`가 다음을 읽습니다:
     - `video.duration`
     - `video.videoWidth`, `video.videoHeight`
   - 이 값들은 다음에 사용됩니다:
     - 트림 슬라이더 범위 (0 → duration)
     - 크롭 좌표를 CSS space → video pixel space로 변환.

3. **트림 범위**
   - 두 개의 numeric states:
     - `trimStart: number`
     - `trimEnd: number`
   - 슬라이더와 numeric inputs는 동기화 상태로 유지됩니다.
   - constraints:
     - `0 ≤ trimStart ≤ trimEnd ≤ duration`

4. **크롭 직사각형**
   - `<video>`의 pointer events:
     - `pointerdown`: 크롭 시작
     - `pointermove`: 드래그 중 크롭 업데이트
     - `pointerup` / `pointerleave`: finalize crop
   - coordinates는 비디오의 bounding box로 normalize되고 native resolution으로 scale됩니다:

5. **내보내기**
   - `canvas.width / height` = 크롭 width/height(또는 전체 video size).
   - `canvas.captureStream(fps)`가 `MediaStream`을 가져옵니다.
   - 다음 조건이 될 때까지 `requestAnimationFrame`으로 Frames를 그립니다:
     - `now >= endTime` 또는 `video.currentTime >= trimEnd`
   - 완료되면:
     - `MediaRecorder.stop()`
     - Chunks를 하나의 `Blob`으로 합쳐 다운로드합니다.

---

# 라이선스
- Apache License 2.0
