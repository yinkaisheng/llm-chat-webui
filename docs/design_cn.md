# LLM Chat Web App 技术设计文档

本文档详细说明了 LLM Chat Web App 的核心功能实现原理，旨在帮助开发者从源码层面理解各项特性的运作机制。

## 1. 核心架构设计

项目采用前后端分离架构：
- **后端 (Python/FastAPI)**：作为中转层，处理 LLM API 鉴权、流式代理、会话持久化及全局配置管理。
- **前端 (Vue3/Vite)**：负责交互逻辑、Markdown 渲染、多会动状态维护及实时流式解析。
- **数据持久化**：会话以 `.json` 文件形式存储在服务器 `sessions/` 目录下，前端通过 API 进行 CRUD 操作。

---

## 2. 流式传输与 UI 节流 (Streaming & Throttling)

### 后端实现 (`api.py`)
使用 `httpx.AsyncClient().stream()` 发起异步请求。后端持续读取来自大模型上游的字节流，并将其透明转发给前端。
- **关键逻辑**：在流式传输结束前，后端会计算 Telemetry 数据（如首字延迟、总时长），并以 `data: [TELEMETRY] {json}` 的形式发送最后一个数据包。

### 前端解析 (`App.vue`)
前端使用 `fetch` 结合 `ReadableStream` 读取响应体。
- **UI 节流**：为了防止高频更新（如模型输出极快时）导致浏览器 DOM 渲染压力过大，前端引入了 `UPDATE_INTERVAL_MS = 100` 的节流机制。只有在超过 100ms 或流式传输结束时，才会将缓冲区内容真正赋值给 Vue 的响应式变量。

---

## 3. 推理过程 (Reasoning) 支持

针对 DeepSeek-R1 等输出“思考过程”的模型：
- **解析机制**：系统会同时监听 `delta.content` 和 `delta.reasoning_content`。
- **自动折叠逻辑**：当检测到 `delta.content`（正式回答）开始出现，且之前已有 `reasoning_content` 时，前端会自动将 `isCurrentReasoningCollapsed` 设为 `true`。
- **UI 表现**：在 `ChatMessage.vue` 组件中，思考内容被包裹在一个带有切换开关的独立容器内。

---

## 4. 多会话并发与后台生成

### 状态维护
前端使用 `activeStreams` 对象，以 `sessionId` 为键存储每个会话的生成状态（包括 `AbortController`、缓冲区内容等）。
- **后台生成**：由于状态存储在 `activeStreams` 中而非单一全局变量，用户在当前会话生成时切换到其他会话，之前的生成进程依然会在后台继续接收数据并实时写入对应的缓冲区。
- **自动保存**：流式传输完成后，前端会调用 `/api/sessions/{id}` 接口将最终完整的消息列表同步到后端 JSON 文件。

---

## 5. 消息回溯、修改与分支 (Edit & Branching)

### 编辑逻辑
1. 点击 `✏️` 按钮时，记录当前消息的 `editingIndex`。
2. 用户修改后重新发送时，程序执行 `messages.value.slice(0, editingIndex)`。
3. 这一操作直接物理删除了该索引及之后的全部对话记录，确保新发起的对话基于干净的历史上下文，避免上下文污染。

---

## 6. 生成指标 (Telemetry) 计算

- **首字延迟 (TTFT)**：记录 `startTime = performance.now()`，当接收到第一个有效 `delta` 时记录 `firstTokenTime`。`TTFT = (firstTokenTime - startTime) / 1000`。
- **字符速度**：计算 `总长度 / (当前时间 - 开始时间)`，以 200ms 为周期动态刷新显示。
- **Token 速度**：若后端返回了 `usage` 统计，前端会优先使用 Token 数进行计算。

---

## 7. 主题切换与 UI 定制

### 动态主题
- **CSS 变量**：通过 `<html>` 上的 `data-theme` 属性和 CSS 变量实现基础色值切换。
- **代码高亮重载**：由于 `highlight.js` 的主题是静态 CSS，系统在 `App.vue` 中动态加载 `github.min.css` 或 `github-dark.min.css` 的字符串内容，并注入到 ID 为 `dynamic-hljs-theme` 的 `<style>` 标签中。

### 页面配置
- **字体大小**：通过 CSS 变量 `--chat-font-size` 实时控制聊天区域的文字大小。

---

## 8. 通用 HTTP 代理 API (`/api/request`)

后端提供了一个安全的通用 HTTP 代理接口：
- **安全性**：可配置 `HTTP_REQUEST_BLOCK_LOCAL_IP` 防范 SSRF 攻击，拦截对内网 IP（如 `127.0.0.1`, `192.168.x.x`）的访问。
- **功能**：允许前端避开浏览器同源策略（CORS）与特定的 API 进行交互，支持自定义 Header 和 Timeout。
