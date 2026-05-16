---
layout: page
title: "🇮🇳 हिन्दी"
permalink: /hi/
lang: hi
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

एक मुफ़्त क्लाइंट-साइड, ब्राउज़र-आधारित वीडियो एडिटर।

एक **100% क्लाइंट‑साइड वीडियो माइक्रो एडिटर** जो पूरी तरह आपके ब्राउज़र में चलता है।  
आप कर सकते हैं:
- **समय सीमा को ट्रिम करना**
- **आयताकार क्रॉप करना**
- **क्लिप एक्सपोर्ट करना**

किसी सर्वर की आवश्यकता नहीं है।
सब कुछ **HTML5 Video + Canvas + MediaRecorder** से किया जाता है।

---

### चरण

1. एक वीडियो फ़ाइल चुनें।
2. **crop** सेट करें:
   - वीडियो प्रीव्यू पर कर्सर ले जाएँ।
   - आयत (क्रॉप क्षेत्र) बनाने के लिए क्लिक करके ड्रैग करें।
   - क्रॉप रीसेट करने के लिए प्रीव्यू के अंदर डबल‑क्लिक करें।
3. **trim range** समायोजित करें:
   - स्लाइडर पर Start/End को खिसकाएँ, _या_
   - वीडियो चलाएँ और क्लिक करें:
     - **Use current time as Start**
     - **Use current time as End**
4. **Export** पर क्लिक करें।
5. एक्सपोर्ट पूरा होने तक प्रतीक्षा करें:

---

### 🔒 गोपनीयता

- कोई भी फ़ाइल कभी सर्वर पर अपलोड नहीं की जाती।
- सारी प्रोसेसिंग आपके ब्राउज़र टैब में स्थानीय रूप से होती है।
- निजी रिकॉर्डिंग, स्क्रीन कैप्चर आदि के लिए सुरक्षित।

---

## 🚀 शुरुआत करें

### 1. आवश्यकताएँ
- [Docker Compose](https://docs.docker.com/compose/)

### 2. सभी सेवाएँ बिल्ड और शुरू करें:

```bash

# Build the image
docker compose build

# Run the container
docker compose up

```

### 3. टेस्ट:
```bash
docker compose \
-f docker-compose.test.yml up \
--build --exit-code-from \
frontend_test
```

---

## तकनीकी अवलोकन

### 1. टेक स्टैक

- **Frontend:** React + TypeScript + Vite  
- **Styling:** Plain CSS (`src/style.css`)
- **Tests:** Jest + ts‑jest  
- **Container:** पुनरुत्पादनीय dev और tests के लिए Docker / Docker Compose

### 2. डेटा प्रवाह

1. **फ़ाइल इनपुट**
   - उपयोगकर्ता फ़ाइल चुनता/ड्रॉप करता है -> React state में `File` के रूप में संग्रहीत होती है।

2. **मेटाडेटा और dimensions**
   - `onLoadedMetadata` पढ़ता है:
     - `video.duration`
     - `video.videoWidth`, `video.videoHeight`
   - इनका उपयोग होता है:
     - ट्रिम स्लाइडर रेंज (0 → duration)
     - क्रॉप निर्देशांकों को CSS space → video pixel space में बदलने के लिए।

3. **ट्रिम रेंज**
   - दो numeric states:
     - `trimStart: number`
     - `trimEnd: number`
   - स्लाइडर और numeric inputs सिंक में रखे जाते हैं।
   - constraints:
     - `0 ≤ trimStart ≤ trimEnd ≤ duration`

4. **क्रॉप आयत**
   - `<video>` पर pointer events:
     - `pointerdown`: क्रॉप शुरू करें
     - `pointermove`: ड्रैग के दौरान क्रॉप अपडेट करें
     - `pointerup` / `pointerleave`: क्रॉप finalize करें
   - coordinates को वीडियो के bounding box से normalize किया जाता है और native resolution तक scale किया जाता है:

5. **एक्सपोर्ट**
   - `canvas.width / height` = क्रॉप width/height (या पूरा video size)।
   - `canvas.captureStream(fps)` एक `MediaStream` प्राप्त करता है।
   - Frames को `requestAnimationFrame` के साथ तब तक draw किया जाता है जब तक:
     - `now >= endTime` या `video.currentTime >= trimEnd`
   - पूरा होने पर:
     - `MediaRecorder.stop()`
     - Chunks को एक `Blob` में मिलाकर डाउनलोड किया जाता है।

---

# लाइसेंस
- Apache License 2.0
