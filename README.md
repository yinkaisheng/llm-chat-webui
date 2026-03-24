# LLM Chat Web App

## 📝 Project Introduction
This is a chat web application based on a locally deployed Large Language Model (LLM), designed to provide a simple and practical conversational interface.

**Core Architecture**:
- **Backend**: Built with **FastAPI** asynchronous framework, responsible for LLM API proxy, configuration management, and session persistence. The entry point is `llm_chat_server.py`.
- **Frontend**: Developed with **Vue3** (Composition API), implementing real-time streaming dialogue rendering and rich interactive features.

---

## ✨ Main Features

### 1. Core Chat Functions
* **SSE Streaming Output**: Supports Server-Sent Events for real-time typewriter-style output.
* **Reasoning Process Display**: Compatible with models featuring "Reasoning Content," supporting independent expansion and collapse of thought blocks.
* **Multi-session Management**: Supports parallel generation in the background; you can switch between sessions while the model is generating.
* **Session Persistence**: Chat history is automatically saved as JSON files in the local `sessions/` directory.
* **Automatic Session Naming**: The system automatically calls the model to generate a concise session title after the first prompt.
* **Message Backtracking & Editing**: Supports clicking `✏️` to edit historical prompts and resubmit, automatically pruning downstream stale branches.
* **Generation Control**: Supports real-time interruption of generation using `AbortController`.

### 2. UI & Interaction Design
* **Responsive Layout Toggle**: Switch between "Full Width (100%)" and "Standard Reading Mode (80%)" with one click.
* **Multi-theme Support**: Built-in Light and Dark modes, with code syntax highlighting switching synchronously.
* **Performance Telemetry**: Displays Time to First Token (TTFT), total generation time, character count, and generation speed under each response.
* **Adaptive Input Box**: The input box height automatically expands with content; supports image attachments (multimodal chat).
* **Independent Settings Panel**: A drawer-style configuration panel for hot-reloading Base URL, API Key, Model Name, and System Prompt.
* **Local Multi-LLM Profiles**: Supports creating, copying, renaming, and deleting multiple local LLM profiles in frontend `localStorage` for quick switching.
* **Session-Profile Binding**: Each session stores `config_name`, and the corresponding profile is restored automatically when reopening historical sessions.

### 3. Backend Utilities
* **HTTP Request Proxy**: Built-in `/api/request` endpoint allowing the frontend to perform cross-origin HTTP requests.
* **Standardized Logging**: Provides color-coded backend logs for monitoring model invocation details.

---

## 📁 Directory Structure

```text
llm-chat/
├── frontend/               # Vue3 + Vite frontend source code
├── static/                 # Frontend production build, hosted by FastAPI
├── sessions/               # Chat history storage directory (JSON)
├── docs/                   # Documentation and API references
├── logs/                   # Backend execution logs
├── config.yaml             # Backend global configuration (Base URL, API Key, etc.)
├── app.py                  # FastAPI app initialization and middleware
├── api.py                  # Business API logic (streaming proxy, session management, etc.)
├── models.py               # Pydantic data models
├── llm_chat_server.py      # Backend entry point
├── fastapi_util.py         # FastAPI utility wrappers
├── log_util.py             # Terminal color logging utility
├── sys_util.py             # System path and platform utilities
├── process_util.py         # Process management and control utilities
└── time_util.py            # Time processing utilities
```

---

## 🚀 Quick Start

### 1. Start Backend
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Start the service:
   ```bash
   python llm_chat_server.py --host 0.0.0.0 --port 9949
   ```

### 2. Start Frontend
1. Enter the directory and install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```
   Then copy the generated `dist/` files to the backend `static/` directory for deployment.

---

## 🛡️ Security Considerations
* **HTTP Proxy API**: The `/api/request` endpoint is a powerful tool for proxying requests. By default, it blocks access to local/private IP addresses (`HTTP_REQUEST_BLOCK_LOCAL_IP = True` is recommended for public deployment).
* **CORS Policy**: The current configuration allows all origins (`*`). For production, please restrict this to your specific domain.
* **Clipboard vs access URL**: `navigator.clipboard` is only available in a **secure context** (HTTPS, or exceptions like `localhost`). If you open the app as `http://<LAN-IP>`, copy buttons use a legacy fallback automatically; prefer **HTTPS** for production.

---

## 📚 Documentation (更多文档)
- [Frontend Development Guide](docs/frontend_guide.md) / [前端开发指南](docs/frontend_guide_cn.md)
- [API Documentation (API 接口文档)](docs/api.md)
- [Design Specification (设计规范)](docs/design.md)
