---
layout: page
title: "🇯🇵 日本語"
permalink: /ja/
lang: ja
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

無料で使える、クライアントサイドのブラウザベース動画エディター。

ブラウザ内だけで動作する **100% クライアントサイドの動画マイクロエディター** です。  
できること:
- **時間範囲のトリミング**
- **矩形クロップ**
- **クリップのエクスポート**

サーバーは不要です。
すべて **HTML5 Video + Canvas + MediaRecorder** で処理されます。

---

### 手順

1. 動画ファイルを選択します。
2. **crop** を設定します:
   - 動画プレビュー上にカーソルを移動します。
   - クリックしてドラッグし、矩形（クロップ範囲）を描画します。
   - クロップをリセットするには、プレビュー内をダブルクリックします。
3. **trim range** を調整します:
   - スライダーで Start/End を移動する、_または_
   - 動画を再生して次をクリックします:
     - **Use current time as Start**
     - **Use current time as End**
4. **Export** をクリックします。
5. エクスポートが完了するまで待ちます:

---

### 🔒 プライバシー

- ファイルがサーバーへアップロードされることはありません。
- すべての処理はブラウザータブ内でローカルに実行されます。
- 個人的な録画、画面キャプチャなどにも安全に使えます。

---

## 🚀 はじめに

### 1. 前提条件
- [Docker Compose](https://docs.docker.com/compose/)

### 2. すべてのサービスをビルドして起動します:

```bash

# Build the image
docker compose build

# Run the container
docker compose up

```

### 3. テスト:
```bash
docker compose \
-f docker-compose.test.yml up \
--build --exit-code-from \
frontend_test
```

---

## 技術概要

### 1. 技術スタック

- **Frontend:** React + TypeScript + Vite  
- **Styling:** Plain CSS (`src/style.css`)
- **Tests:** Jest + ts‑jest  
- **Container:** 再現可能な開発環境とテストのための Docker / Docker Compose

### 2. データフロー

1. **ファイル入力**
   - ユーザーがファイルを選択またはドロップする -> React state に `File` として保存されます。

2. **メタデータと dimensions**
   - `onLoadedMetadata` が次を読み取ります:
     - `video.duration`
     - `video.videoWidth`, `video.videoHeight`
   - これらは次に使われます:
     - トリムスライダーの範囲 (0 → duration)
     - クロップ座標を CSS space → video pixel space へ変換すること。

3. **トリム範囲**
   - 2つの numeric states:
     - `trimStart: number`
     - `trimEnd: number`
   - スライダーと numeric inputs は同期されます。
   - constraints:
     - `0 ≤ trimStart ≤ trimEnd ≤ duration`

4. **クロップ矩形**
   - `<video>` 上の pointer events:
     - `pointerdown`: クロップ開始
     - `pointermove`: ドラッグ中にクロップを更新
     - `pointerup` / `pointerleave`: クロップを finalize
   - coordinates は動画の bounding box で normalize され、native resolution に scale されます:

5. **エクスポート**
   - `canvas.width / height` = クロップ width/height（または動画全体の size）。
   - `canvas.captureStream(fps)` が `MediaStream` を取得します。
   - 次の条件になるまで、`requestAnimationFrame` で Frames を描画します:
     - `now >= endTime` または `video.currentTime >= trimEnd`
   - 完了したら:
     - `MediaRecorder.stop()`
     - Chunks を `Blob` にまとめてダウンロードします。

---

# ライセンス
- Apache License 2.0
