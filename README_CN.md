# LLM Chat Web App

## 📝 项目简介 (Project Introduction)
本项目是一个基于本地部署大语言模型（LLM）的聊天 Web 应用，旨在提供一个简洁、实用的对话界面。

**核心架构**：
- **后端**：使用 **FastAPI** 异步框架，主要负责 LLM API 代理、配置管理及会话持久化。启动入口为 `llm_chat_server.py`。
- **前端**：采用 **Vue3** (Composition API) 开发，实现实时流式对话渲染及丰富的交互功能。

---

## ✨ 主要功能特性 (Features)

### 1. 核心对话功能
* **SSE 流式输出**：支持 Server-Sent Events 流式响应，提供实时打字机输出效果。
* **推理过程展示**：适配带有“思考过程 (Reasoning)”的模型，支持思考内容独立带标识的展开与折叠。
* **多会话管理**：支持后台并行生成，您可以在模型生成的过程中切换到其他会话。
* **会话持久化**：对话记录自动以 JSON 格式保存至本地 `sessions/` 目录。
* **自动会话命名**：首次提问后，系统会自动调用模型生成简短的对话标题。
* **消息回溯修改**：支持点击 `✏️` 编辑历史提问并重新提交，系统会自动移除下游过期分支。
* **生成控制**：支持实时停止生成，通过 `AbortController` 拦截当前请求。

### 2. 界面与交互设计
* **响应式布局切换**：支持“全宽模式 (100%)”与“标准阅读模式 (80%)”一键切换。
* **多色主题适配**：内置日间 (Light) 与夜间 (Dark) 模式，且代码高亮样式随主题同步切换。
* **性能监控可视化**：每条回复下方实时显示首字延迟 (TTFT)、总生成时间、输出字数及生成速度等。
* **自适应输入框**：输入框高度随内容自动扩展，支持图片附件上传（多模态对话）。
* **独立设置面板**：右侧抽屉式配置面板，支持热重载修改 Base URL、API Key、Model Name 及 System Prompt。
* **多模型配置本地保存**：支持在前端本地创建、复制、重命名、删除多个 LLM 配置档（保存于浏览器 `localStorage`），并可在会话间快速切换。
* **会话与模型配置关联**：每个会话会记录 `config_name`，切回历史会话时会自动恢复当时使用的模型配置。

### 3. 后端实用工具
* **HTTP 请求中转**：内置 `/api/request` 代理接口，支持前端执行跨域 HTTP 请求。
* **标准化日志**：提供带彩色显示的后台运行日志，方便开发者监控模型调用细节。

---

## 📁 目录结构 (Directory Structure)

```text
llm-chat/
├── frontend/               # Vue3 + Vite 前端源代码
├── static/                 # 前端打包后的静态文件，供 FastAPI 托管
├── sessions/               # 对话历史记录存储目录 (JSON)
├── docs/                   # 项目文档与 API 参考
├── logs/                   # 后端运行日志
├── config.yaml             # 后端全局配置文件 (Base URL, API Key 等)
├── app.py                  # FastAPI 应用初始化与中间件配置
├── api.py                  # 业务接口路由逻辑 (流式转发、会话管理等)
├── models.py               # Pydantic 数据模型定义
├── llm_chat_server.py      # 后端启动入口文件
├── fastapi_util.py         # FastAPI 工具类封装
├── log_util.py             # 终端彩色日志工具
├── sys_util.py             # 系统路径与平台相关工具
├── process_util.py         # 进程管理与控制工具
└── time_util.py            # 时间处理工具
```

---

## 🚀 快速运行 (Quick Start)

### 1. 启动后端 (Backend)
1. 安装依赖：
   ```bash
   pip install -r requirements.txt
   ```
2. 启动服务：
   ```bash
   python llm_chat_server.py --host 0.0.0.0 --port 9949
   ```

### 2. 启动前端 (Frontend)
1. 进入目录并安装依赖：
   ```bash
   cd frontend
   npm install
   ```
2. 启动开发服务器：
   ```bash
   npm run dev
   ```
3. 部署打包：
   ```bash
   npm run build
   ```
   随后将生成的 `dist/` 文件拷贝至后端 `static/` 目录下即可完成托管部署。

---

## 🛡️ 安全注意事项 (Security)
* **HTTP 代理接口**：`/api/request` 是一个强大的代理工具。默认情况下，它会根据配置拦截对本地/私有 IP 的访问（建议在公网部署时将 `HTTP_REQUEST_BLOCK_LOCAL_IP` 设为 `True`）。
* **跨域策略 (CORS)**：当前配置允许所有来源 (`*`)。在生产环境中，请务必将其限制为特定的域名。
* **剪贴板与访问方式**：浏览器仅在「安全上下文」下允许 `navigator.clipboard`（HTTPS，或 `localhost` 等例外）。若使用 `http://局域网IP` 打开页面，复制按钮会自动改用兼容方式；长期建议对站点启用 **HTTPS**。

---

## 📚 更多文档 (Documentation)
- [前端开发指南](docs/frontend_guide_cn.md) / [Frontend Development Guide](docs/frontend_guide.md)
- [API 接口文档 (API Documentation)](docs/api.md)
- [设计规范 (Design Specification)](docs/design_cn.md)
