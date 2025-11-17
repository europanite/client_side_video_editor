# [Client Side Video Editor](https://github.com/europanite/client_side_video_editor "Client Side Video Editor")

A Client Side Video Editor.

---

##  🚀 PlayGround
 [Client Side Video Editor](https://europanite.github.io/client_side_video_editor/)

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

# License
- Apache License 2.0