---
layout: page
title: "🇨🇳 中文"
permalink: /zh-CN/
lang: zh-CN
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

一个免费的客户端、基于浏览器的视频编辑器。

一个 **100% 客户端视频微型编辑器**，完全在你的浏览器中运行。  
你可以：
- **裁剪时间范围**
- **矩形裁切**
- **导出片段**

不需要服务器。
所有处理都通过 **HTML5 Video + Canvas + MediaRecorder** 完成。

---

### 步骤

1. 选择一个视频文件。
2. 设置 **crop**：
   - 将光标移到视频预览上。
   - 点击并拖拽以绘制一个矩形（裁切区域）。
   - 在预览区域内双击可重置裁切。
3. 调整 **trim range**：
   - 在滑块上移动 Start/End，_或者_
   - 播放视频并点击：
     - **Use current time as Start**
     - **Use current time as End**
4. 点击 **Export**。
5. 等待导出完成：

---

### 🔒 隐私

- 文件绝不会上传到服务器。
- 所有处理都在你的浏览器标签页中本地完成。
- 适用于私人录制、屏幕录制等场景，安全可靠。

---

## 🚀 快速开始

### 1. 前置条件
- [Docker Compose](https://docs.docker.com/compose/)

### 2. 构建并启动所有服务：

```bash

# Build the image
docker compose build

# Run the container
docker compose up

```

### 3. 测试：
```bash
docker compose \
-f docker-compose.test.yml up \
--build --exit-code-from \
frontend_test
```

---

## 技术概览

### 1. 技术栈

- **Frontend:** React + TypeScript + Vite  
- **Styling:** Plain CSS (`src/style.css`)
- **Tests:** Jest + ts‑jest  
- **Container:** 用于可复现开发和测试的 Docker / Docker Compose

### 2. 数据流

1. **文件输入**
   - 用户选择/拖放文件 -> 作为 `File` 存储在 React state 中。

2. **元数据和 dimensions**
   - `onLoadedMetadata` 读取：
     - `video.duration`
     - `video.videoWidth`, `video.videoHeight`
   - 这些值用于：
     - 裁剪滑块范围（0 → duration）
     - 将裁切坐标从 CSS space → video pixel space。

3. **裁剪时间范围**
   - 两个 numeric states：
     - `trimStart: number`
     - `trimEnd: number`
   - 滑块和 numeric inputs 会保持同步。
   - constraints：
     - `0 ≤ trimStart ≤ trimEnd ≤ duration`

4. **裁切矩形**
   - `<video>` 上的 pointer events：
     - `pointerdown`: 开始裁切
     - `pointermove`: 拖拽过程中更新裁切
     - `pointerup` / `pointerleave`: finalize 裁切
   - coordinates 会基于视频的 bounding box 进行 normalize，并 scale 到 native resolution：

5. **导出**
   - `canvas.width / height` = 裁切 width/height（或完整 video size）。
   - `canvas.captureStream(fps)` 获取一个 `MediaStream`。
   - 使用 `requestAnimationFrame` 绘制 Frames，直到：
     - `now >= endTime` 或 `video.currentTime >= trimEnd`
   - 完成后：
     - `MediaRecorder.stop()`
     - Chunks 会合并为一个 `Blob` 并下载。

---

# 许可证
- Apache License 2.0
