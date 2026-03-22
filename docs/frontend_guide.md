# Frontend Development & Build Guide

This document is written for developers who are not familiar with the frontend ecosystem, explaining how to run the frontend in "**Development Mode**" locally and how to finally "**Build & Deploy**".

---

## 1. Concepts & Background
The frontend of this project uses the popular **Vue 3** framework combined with the extremely fast **Vite** build tool.

Since the frontend (Vue + Vite) and backend (FastAPI) are separate systems:
- **Development Mode**: Vite starts a real-time dev server on a separate port (e.g., `5173`) by default.
- **Backend Service**: FastAPI provides data APIs, running on port `9949`.

To ensure frontend requests reach the backend, a **Proxy** must be configured in `vite.config.js`.

> **Note**: The development environment proxy is already configured to forward `/api/...` requests to `http://127.0.0.1:9949`.

---

## 2. Local Development Mode
Use this mode if you need to modify and preview UI changes (colors, buttons, layout, etc.) in real-time.

**Steps**:
1. **Start Backend**:
   ```bash
   python llm_chat_server.py --host 0.0.0.0 --port 9949
   ```

2. **Start Frontend Dev Server**: Open a new terminal and enter the `frontend` directory:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Preview in Browser**:
   Access the URL from the command line (usually `http://localhost:5173/chat/`). The page will hot-reload automatically when you save changes.

---

## 3. Build & Deployment
When changes are complete and ready for deployment, the source code needs to be built into static assets.

**Steps**:
1. **Stop Dev Server**: `Ctrl + C`.
2. **Run Build**:
   ```bash
   npm run build
   ```
3. **Verify Deployment**:
   This project uses a directory link (Junction) named `static` pointing to `frontend/dist/`. Changes take effect immediately after the build.

   Access the backend URL to see the result:
   ```text
   http://127.0.0.1:9949/chat/
   ```
