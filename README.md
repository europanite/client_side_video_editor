# [Client Side Video Editor](https://github.com/europanite/client_side_video_editor "Client Side Video Editor")

[![CI](https://github.com/europanite/client_side_video_editor/actions/workflows/ci.yml/badge.svg)](https://github.com/europanite/client_side_video_editor/actions/workflows/ci.yml)
[![docker](https://github.com/europanite/client_side_video_editor/actions/workflows/docker.yml/badge.svg)](https://github.com/europanite/client_side_video_editor/actions/workflows/docker.yml)
[![pages](https://github.com/europanite/client_side_video_editor/actions/workflows/pages.yml/badge.svg)](https://github.com/europanite/client_side_video_editor/actions/workflows/pages.yml)

!["web_ui"](./assets/images/web_ui.png)

 [PlayGround](https://europanite.github.io/client_side_video_editor/)

A Client-Side Browser-Based Video Editor for Free.

A **100% client‑side video micro editor** that runs entirely in your browser.  
You can:
- **Trim a time range**
- **rectangle crop**
- **Export the clip**

No server is required.
Everything is done with **HTML5 Video + Canvas + MediaRecorder**.

---

### Steps

1. Choose a video file.
2. Set the **crop**:
   - Move the cursor over the video preview.
   - Click & drag to draw a rectangle (crop area).
   - Double‑click inside the preview to reset the crop.
3. Adjust the **trim range**:
   - Move Start/End on the slider, _or_
   - Play the video and click:
     - **Use current time as Start**
     - **Use current time as End**
4. Click **Export**.
5. Wait until export finishes:

---

### 🔒 Privacy

- No file is ever uploaded to a server.
- All processing is done locally in your browser tab.
- Safe for private recordings, screen captures, etc.

---

## 🚀 Getting Started

### 1. Prerequisites
- [Docker Compose](https://docs.docker.com/compose/)

### 2. Build and start all services:

```bash

# Build the image
docker compose build

# Run the container
docker compose up

```

### 3. Test:
```bash
docker compose \
-f docker-compose.test.yml up \
--build --exit-code-from \
frontend_test
```

---

## Technical Overview

### 1. Tech Stack

- **Frontend:** React + TypeScript + Vite  
- **Styling:** Plain CSS (`src/style.css`)
- **Tests:** Jest + ts‑jest  
- **Container:** Docker / Docker Compose for reproducible dev & tests

### 2. Data flow

1. **File input**
   - User selects/drops a file -> stored as `File` in React state.

2. **Metadata & dimensions**
   - `onLoadedMetadata` reads:
     - `video.duration`
     - `video.videoWidth`, `video.videoHeight`
   - These are used for:
     - Trim slider range (0 → duration)
     - Converting crop coordinates from CSS space → video pixel space.

3. **Trim range**
   - Two numeric states:
     - `trimStart: number`
     - `trimEnd: number`
   - Slider & numeric inputs are kept in sync.
   - Constraints:
     - `0 ≤ trimStart ≤ trimEnd ≤ duration`

4. **Crop rectangle**
   - Pointer events on `<video>`:
     - `pointerdown`: begin crop
     - `pointermove`: update crop during drag
     - `pointerup` / `pointerleave`: finalize crop
   - Coordinates are normalized by the video’s bounding box and scaled to the native resolution:

5. **Export**
   - `canvas.width / height` = crop width/height (or full video size).
   - `canvas.captureStream(fps)` obtains a `MediaStream`.
   - Frames are drawn with `requestAnimationFrame` until:
     - `now >= endTime` or `video.currentTime >= trimEnd`
   - When finished:
     - `MediaRecorder.stop()`
     - Chunks are combined into a `Blob` and downloaded.

---

# License
- Apache License 2.0