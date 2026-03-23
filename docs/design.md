# LLM Chat Web App Technical Design Document

This document provides a detailed explanation of the core implementation principles of the LLM Chat Web App, aimed at helping developers understand the inner workings of various features from a source code perspective.

## 1. Architecture Overview

The project follows a decoupled Frontend-Backend architecture:
- **Backend (Python/FastAPI)**: Acts as a middleware layer handling LLM API authentication, streaming proxying, session persistence, and global configuration.
- **Frontend (Vue3/Vite)**: Manages interaction logic, Markdown rendering, multi-session state, and real-time stream parsing.
- **Data Persistence**: Sessions are stored as `.json` files in the server's `sessions/` directory, with CRUD operations performed via frontend API calls.

---

## 2. Streaming & UI Throttling

### Backend Implementation (`api.py`)
Uses `httpx.AsyncClient().stream()` for asynchronous requests. The backend continuously reads byte streams from the upstream LLM and transparently forwards them to the frontend.
- **Key Logic**: Before the stream terminates, the backend calculates Telemetry data (e.g., TTFT, total duration) and sends it as a final packet in the format `data: [TELEMETRY] {json}`.

### Frontend Parsing (`App.vue`)
The frontend uses the `fetch` API combined with `ReadableStream` to read the response body.
- **UI Throttling**: To prevent excessive DOM rendering pressure during high-frequency updates (e.g., when the model outputs extremely fast), a throttling mechanism with `UPDATE_INTERVAL_MS = 100` is implemented. Content in the buffer is only assigned to Vue's reactive variables every 100ms or when the stream ends.

---

## 3. Reasoning Process Support

For models like DeepSeek-R1 that output a "reasoning process":
- **Parsing Mechanism**: The system simultaneously listens for `delta.content` and `delta.reasoning_content`.
- **Auto-collapse Logic**: If `delta.content` (the formal answer) begins to appear and there is existing `reasoning_content`, the frontend automatically sets `isCurrentReasoningCollapsed` to `true`.
- **UI Presentation**: In the `ChatMessage.vue` component, the reasoning content is wrapped in a dedicated container with a toggle switch.

---

## 4. Multi-session Concurrency & Background Generation

### State Management
The frontend uses the `activeStreams` object, keyed by `sessionId`, to store the generation state of each session (including the `AbortController` and buffer content).
- **Background Generation**: Since the state is stored in `activeStreams` rather than a single global variable, a user can switch to another session while generation is ongoing in the current one. The background process will continue receiving data and updating the corresponding buffer in real-time.
- **Auto-sync**: Once streaming is complete, the frontend calls the `/api/sessions/{id}` endpoint to synchronize the final complete message list to the backend JSON file.

---

## 5. Message Backtracking, Editing & Branching

### Editing Logic
1. When the `✏️` button is clicked, the `editingIndex` of the current message is recorded.
2. When the user resubmits after editing, the application executes `messages.value.slice(0, editingIndex)`.
3. This operation physically removes all dialogue records from that index onwards, ensuring the new conversation is based on a clean historical context, avoiding context pollution.

---

## 6. Telemetry Calculation

- **Time to First Token (TTFT)**: Records `startTime = performance.now()` before the request. `firstTokenTime` is recorded upon receiving the first valid `delta`. `TTFT = (firstTokenTime - startTime) / 1000`.
- **Character Speed**: Calculates `Total Length / (Current Time - Start Time)`, dynamically refreshed every 200ms.
- **Token Speed**: If the backend provides `usage` statistics, the frontend prioritizes using the token count for speed calculations.

---

## 7. Theme Switching & UI Customization

### Dynamic Themes
- **CSS Variables**: Core color values are toggled via the `data-theme` attribute on the `<html>` element combined with CSS variables.
- **Syntax Highlighting Hot-reload**: Since `highlight.js` themes are static CSS, the system dynamically loads the string content of `github.min.css` or `github-dark.min.css` in `App.vue` and injects it into a `<style>` tag with the ID `dynamic-hljs-theme`.

### Page Configuration
- **Font Size**: Real-time control of text size in the chat area via the `--chat-font-size` CSS variable.

---

## 8. Multi-LLM Profiles & Session Binding

- **Profile Model**: The frontend uses `configList` to manage multiple LLM profiles (create/copy/rename/delete/select).
- **Local Persistence**: Profile list and selected index are stored in browser `localStorage` (`llm_chat_configs`, `llm_chat_config_index`).
- **Session Binding**: Session payload includes `config_name`; reopening a historical session restores the corresponding profile by name.
- **Fallback Strategy**: If local profile cache is corrupted, frontend falls back to server default config to keep the app usable.

---

## 9. Generic HTTP Proxy API (`/api/request`)

The backend provides a secure generic HTTP proxy interface:
- **Security**: Can be configured with `HTTP_REQUEST_BLOCK_LOCAL_IP` to prevent SSRF attacks by blocking access to internal IPs (e.g., `127.0.0.1`, `192.168.x.x`).
- **Functionality**: Allows the frontend to bypass browser Same-Origin Policy (CORS) to interact with specific APIs, supporting custom headers and timeouts.
