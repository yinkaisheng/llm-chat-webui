<template>
  <div class="app-container" :style="{ '--chat-font-size': pageFontSize + 'px' }">
    <Sidebar
      :sessions="sessions"
      :currentSessionId="currentSessionId"
      :sidebarOpen="sidebarOpen"
      :generatingSessions="generatingSessionIds"
      @new-chat="startNewChat"
      @select-session="loadSession"
      @delete-session="deleteChatSession"
      @clear-all="clearAll"
    />

    <main class="main-content" :class="{ 'full-width-mode': isFullWidth }" ref="mainContentRef">
      <header class="top-nav">
        <div class="nav-left">
          <button class="mobile-menu-btn" @click="sidebarOpen = !sidebarOpen">☰</button>
          <h2>{{ currentTitle }}</h2>
        </div>
        <div class="nav-right">
          <!-- Stream Toggle -->
          <label class="toggle-switch" title="切换流式输出">
            <span class="switch-label">流式</span>
            <div class="switch-box">
              <input type="checkbox" v-model="useStream" />
              <span class="slider"></span>
            </div>
          </label>
          <!-- Full Width Toggle -->
          <label class="toggle-switch" title="切换全宽模式">
            <span class="switch-label">全宽</span>
            <div class="switch-box">
              <input type="checkbox" v-model="isFullWidth" @change="saveWidth" />
              <span class="slider"></span>
            </div>
          </label>
          <button class="btn-icon" @click="toggleTheme" title="切换主题">{{ theme === 'dark' ? '☀️' : '🌙' }}</button>
          <button class="btn-icon" @click="togglePageSettingsDrawer" title="页面配置">🛠 页面配置</button>
          <button class="btn-icon" @click="toggleSettingsDrawer" title="模型配置">⚙️ LLM 配置</button>
        </div>

        <SettingsDrawer
          v-model:show="showSettingsDrawer"
          :configForm="configForm"
          @save="saveConfigToLocal"
          @reset="resetConfigToDefault"
        />

        <PageSettingsDrawer
          v-model:show="showPageSettingsDrawer"
          :fontSize="pageFontSize"
          @save="savePageFontSize"
          @reset="resetPageFontSize"
          @preview="previewPageFontSize"
        />
      </header>

      <div class="chat-area">
        <div v-if="messages.length === 0" class="empty-state">
          <h1>{{ configForm.model_name || 'LLM Chat' }}</h1>
          <p>今天我能帮您什么？</p>
        </div>

        <ChatMessage
          v-for="(msg, index) in messages"
          :key="index"
          :message="msg"
          @edit="editMessage(index, $event)"
          @update:collapse="msg.isCollapsed = $event"
          @preview-image="openImagePreview"
        />

        <ChatMessage
          v-if="activeStreams[currentSessionId]?.isGenerating"
          :message="{
            role: 'assistant',
            time: activeStreams[currentSessionId].currentResponseTime,
            content: activeStreams[currentSessionId].currentResponse,
            reasoning_content: activeStreams[currentSessionId].currentReasoning,
            isCollapsed: activeStreams[currentSessionId].isCurrentReasoningCollapsed,
            meta: activeStreams[currentSessionId].currentMeta
          }"
          @update:collapse="activeStreams[currentSessionId].isCurrentReasoningCollapsed = $event"
          @preview-image="openImagePreview"
        />
      </div>

      <ChatInput
        ref="chatInputRef"
        v-model="inputForm"
        :isGenerating="!!activeStreams[currentSessionId]?.isGenerating"
        :canStopAndComplete="!!activeStreams[currentSessionId]?.currentResponse || !!activeStreams[currentSessionId]?.currentReasoning"
        :isEditing="editingIndex !== null"
        :canRegenerate="messages.length > 0 && !activeStreams[currentSessionId]?.isGenerating && messages[messages.length-1].role === 'assistant'"
        @send="sendMessage"
        @cancel-edit="cancelEdit"
        @regenerate="regenerateLast"
      />
    </main>
    <ImageViewer v-model:show="showImageViewer" :src="previewImageUrl" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { fetchConfig, listSessions, getSession, saveSession, deleteSession, clearAllSessions } from './utils/api';
import lightThemeCss from 'highlight.js/styles/github.min.css?raw';
import darkThemeCss from 'highlight.js/styles/github-dark.min.css?raw';

import Sidebar from './components/Sidebar.vue';
import SettingsDrawer from './components/SettingsDrawer.vue';
import PageSettingsDrawer from './components/PageSettingsDrawer.vue';
import ImageViewer from './components/ImageViewer.vue';
import ChatMessage from './components/ChatMessage.vue';
import ChatInput from './components/ChatInput.vue';

const theme = ref(localStorage.getItem('theme') || 'light');
const sidebarOpen = ref(false);
const showSettingsDrawer = ref(false);
const showPageSettingsDrawer = ref(false);
const showImageViewer = ref(false);
const previewImageUrl = ref('');

const openImagePreview = (url) => {
  previewImageUrl.value = url;
  showImageViewer.value = true;
};

const pageFontSize = ref(parseInt(localStorage.getItem('chatFontSize')) || 18);

const configForm = ref({
  base_url: '',
  model_name: '',
  api_key: '',
  system_prompt: '',
  extra_params: '{}'
});

const sessions = ref([]);
const currentSessionId = ref(null);
const currentTitle = ref('新对话');
const messages = ref([]);
const inputForm = ref('');
const chatInputRef = ref(null);
const mainContentRef = ref(null);

const useStream = ref(true);
const activeStreams = ref({});
const isFullWidth = ref(localStorage.getItem('isFullWidth') === 'true');

const generatingSessionIds = computed(() => {
  return Object.keys(activeStreams.value).filter(id => activeStreams.value[id].isGenerating);
});
const editingIndex = ref(null);

const formatTime = (dateObj = new Date()) => {
  const pad = (n, len=2) => String(n).padStart(len, '0');
  const yyyy = dateObj.getFullYear();
  const MM = pad(dateObj.getMonth() + 1);
  const dd = pad(dateObj.getDate());
  const HH = pad(dateObj.getHours());
  const mm = pad(dateObj.getMinutes());
  const ss = pad(dateObj.getSeconds());
  const SSS = pad(dateObj.getMilliseconds(), 3);
  return `${yyyy}-${MM}-${dd} ${HH}:${mm}:${ss}.${SSS}`;
};

const applyHljsTheme = (t) => {
  let styleEl = document.getElementById('dynamic-hljs-theme');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'dynamic-hljs-theme';
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = t === 'dark' ? darkThemeCss : lightThemeCss;
};

const toggleTheme = () => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', theme.value);
  document.documentElement.setAttribute('data-theme', theme.value);
  applyHljsTheme(theme.value);
};

const saveWidth = () => {
  localStorage.setItem('isFullWidth', isFullWidth.value.toString());
};

const toggleSettingsDrawer = () => {
  showSettingsDrawer.value = !showSettingsDrawer.value;
  if (showSettingsDrawer.value) showPageSettingsDrawer.value = false;
};

const togglePageSettingsDrawer = () => {
  showPageSettingsDrawer.value = !showPageSettingsDrawer.value;
  if (showPageSettingsDrawer.value) showSettingsDrawer.value = false;
};

const savePageFontSize = (size) => {
  pageFontSize.value = size;
  localStorage.setItem('chatFontSize', size);
  showPageSettingsDrawer.value = false;
};

const previewPageFontSize = (size) => {
  pageFontSize.value = size;
};

const resetPageFontSize = () => {
  pageFontSize.value = 18;
  localStorage.removeItem('chatFontSize');
};

const loadSettings = async () => {
  try {
    const cached = localStorage.getItem('llm_chat_config');
    if (cached) {
      configForm.value = JSON.parse(cached);
    } else {
      const backendConfig = await fetchConfig();
      configForm.value = {
        base_url: backendConfig.base_url || '',
        model_name: backendConfig.model_name || '',
        api_key: backendConfig.api_key || '',
        system_prompt: backendConfig.system_prompt || '',
        extra_params: backendConfig.extra_params ? JSON.stringify(backendConfig.extra_params, null, 2) : '{}'
      };
      localStorage.setItem('llm_chat_config', JSON.stringify(configForm.value));
    }
  } catch (err) {
    console.error("Failed to load default config", err);
  }
};

const resetConfigToDefault = async () => {
  try {
    localStorage.removeItem('llm_chat_config');
    const backendConfig = await fetchConfig();
    configForm.value = {
      base_url: backendConfig.base_url || '',
      model_name: backendConfig.model_name || '',
      api_key: backendConfig.api_key || '',
      system_prompt: backendConfig.system_prompt || '',
      extra_params: backendConfig.extra_params ? JSON.stringify(backendConfig.extra_params, null, 2) : '{}'
    };
    localStorage.setItem('llm_chat_config', JSON.stringify(configForm.value));
  } catch (err) {
    console.error("Failed to fetch backend configuration.");
  }
};

const saveConfigToLocal = (newConfig) => {
  configForm.value = { ...newConfig };
  localStorage.setItem('llm_chat_config', JSON.stringify(configForm.value));
};

const scrollToBottom = () => {
  nextTick(() => {
    if (mainContentRef.value) {
      mainContentRef.value.scrollTop = mainContentRef.value.scrollHeight;
    }
  });
};

const fetchSessions = async () => {
  try {
    sessions.value = await listSessions();
  } catch (e) {
    console.error(e);
  }
};

const startNewChat = () => {
  currentSessionId.value = null;
  currentTitle.value = '新对话';
  messages.value = [];
  editingIndex.value = null;
  inputForm.value = '';
  chatInputRef.value?.clearAttachments();
  nextTick(() => chatInputRef.value?.focus());
};

const loadSession = async (id) => {
  try {
    const data = await getSession(id);
    currentSessionId.value = id;
    currentTitle.value = data.title || '新对话';
    messages.value = (data.messages || []).map(m => ({
      ...m,
      // 历史记录默认折叠思考过程
      isCollapsed: m.reasoning_content ? true : false
    }));
    editingIndex.value = null;
    inputForm.value = '';
    scrollToBottom();
  } catch (e) {
    console.error(e);
  }
};

const deleteChatSession = async (id) => {
  if (confirm('确定要删除此对话吗？')) {
    await deleteSession(id);
    if (currentSessionId.value === id) startNewChat();
    await fetchSessions();
  }
};

const clearAll = async () => {
  if (confirm('确定要清空所有对话记录吗？此操作无法撤销。')) {
    await clearAllSessions();
    startNewChat();
    await fetchSessions();
  }
};

const saveCurrentSession = async () => {
  if (!currentSessionId.value) {
    currentSessionId.value = Date.now().toString() + Math.floor(Math.random() * 1000).toString();
  }
  // 过滤掉纯UI状态，减小保存的 JSON 体积
  const msgsToSave = messages.value.map(({ isCollapsed, ...rest }) => rest);
  await saveSession(currentSessionId.value, {
    title: currentTitle.value,
    messages: msgsToSave
  });
  await fetchSessions();
};

const buildApiPayload = (messagesArray, isStream) => {
  let parsedExtraParams = {};
  if (configForm.value.extra_params && configForm.value.extra_params.trim() !== '') {
    try { parsedExtraParams = JSON.parse(configForm.value.extra_params); } catch(e){}
  }
  return {
    base_url: configForm.value.base_url,
    model_name: configForm.value.model_name,
    api_key: configForm.value.api_key,
    system_prompt: configForm.value.system_prompt,
    extra_params: parsedExtraParams,
    messages: messagesArray,
    stream: isStream
  };
};

const autoRenameSession = async (firstMessage, renameSessionId) => {
  if (!configForm.value.base_url) return;

  try {
    const msgs = [
      { role: 'system', content: 'You are a helpful assistant. Summarize the user\'s text into a short 2-4 word title. Do not output anything else but the title.' },
      { role: 'user', content: firstMessage }
    ];
    const payload = buildApiPayload(msgs, false);
    payload.system_prompt = msgs[0].content;
    if (payload.messages[0].role === 'system') {
      payload.messages[0].content = payload.system_prompt;
    }

    const res = await fetch('/api/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.choices && json.choices[0]) {
      const newTitle = json.choices[0].message.content.trim().replace(/^['"]|['"]$/g, '');
      if (currentSessionId.value === renameSessionId) {
         currentTitle.value = newTitle;
         await saveCurrentSession();
      } else {
         const data = await getSession(renameSessionId);
         if (data) {
           data.title = newTitle;
           await saveSession(renameSessionId, data);
           await fetchSessions();
         }
      }
    }
  } catch (e) {
    console.error("Auto rename failed", e);
  }
};

const editMessage = (index, content) => {
  if (Array.isArray(content)) {
    let text = '';
    const images = [];
    content.forEach(part => {
      if (part.type === 'text') text += part.text;
      else if (part.type === 'image_url') {
        images.push({ url: part.image_url.url, name: 'image.png' });
      }
    });
    inputForm.value = text;
    chatInputRef.value?.setAttachments(images);
  } else {
    inputForm.value = content;
    chatInputRef.value?.clearAttachments();
  }
  editingIndex.value = index;
  chatInputRef.value?.focus();
  nextTick(() => chatInputRef.value?.autoResize());
};

const cancelEdit = () => {
  if (editingIndex.value !== null) {
    inputForm.value = '';
    editingIndex.value = null;
    chatInputRef.value?.clearAttachments();
    nextTick(() => chatInputRef.value?.autoResize());
  }
};

const appendMessageToSession = async (sessionId, msg) => {
  if (currentSessionId.value === sessionId) {
    messages.value.push(msg);
    await saveCurrentSession();
  } else {
    try {
      const data = await getSession(sessionId);
      if (data && data.messages) {
        data.messages.push(msg);
        const msgsToSave = data.messages.map(({ isCollapsed, ...rest }) => rest);
        await saveSession(sessionId, { title: data.title, messages: msgsToSave });
      }
    } catch (e) {
      console.error("Failed to append background message", e);
    }
  }
};

const regenerateLast = () => {
  if (messages.value.length === 0) return;
  if (messages.value[messages.value.length-1].role === 'assistant') {
    messages.value.pop();
  }
  doSend();
};

const sendMessage = async (attachments = []) => {
  await saveCurrentSession(); // ensure we have an ID immediately

  const sessionId = currentSessionId.value;
  const streamState = activeStreams.value[sessionId];

  if (streamState && streamState.isGenerating) {
    if (streamState.abortController) streamState.abortController.abort();
    streamState.isGenerating = false;
    if (streamState.currentResponse || streamState.currentReasoning) {
      await appendMessageToSession(sessionId, {
        role: 'assistant',
        content: streamState.currentResponse,
        reasoning_content: streamState.currentReasoning,
        isCollapsed: streamState.isCurrentReasoningCollapsed,
        meta: streamState.currentMeta ? { ...streamState.currentMeta } : null,
        time: streamState.currentResponseTime
      });
    }
    streamState.currentResponse = '';
    streamState.currentReasoning = '';
    streamState.isCurrentReasoningCollapsed = false;
    return;
  }

  const text = inputForm.value.trim();
  if (!text && attachments.length === 0) {
    if (!configForm.value.base_url) showSettingsDrawer.value = true;
    return;
  }

  if (!configForm.value.base_url) {
    alert("请先在右侧【配置】中填写您的 API Base URL 和模型名等参数。");
    showSettingsDrawer.value = true;
    return;
  }

  if (editingIndex.value !== null) {
    messages.value = messages.value.slice(0, editingIndex.value);
    editingIndex.value = null;
  }

  const nowTime = formatTime();
  
  let contentPayload = text;
  if (attachments.length > 0) {
    contentPayload = [];
    if (text) {
      contentPayload.push({ type: 'text', text: text });
    }
    for (const img of attachments) {
      contentPayload.push({ type: 'image_url', image_url: { url: img.url } });
    }
  }

  messages.value.push({ role: 'user', content: contentPayload, time: nowTime });
  inputForm.value = '';
  
  chatInputRef.value?.clearAttachments();
  nextTick(() => chatInputRef.value?.autoResize());
  scrollToBottom();
  await saveCurrentSession();

  if (messages.value.length === 1) {
    autoRenameSession(text || '图片分析', sessionId);
  }

  doSend();
};

const doSend = async () => {
  const sessionId = currentSessionId.value;
  if (!activeStreams.value[sessionId]) {
    activeStreams.value[sessionId] = {
      isGenerating: false,
      currentResponse: '',
      currentReasoning: '',
      isCurrentReasoningCollapsed: false,
      currentResponseTime: '',
      currentMeta: null,
      abortController: null
    };
  }

  const streamState = activeStreams.value[sessionId];
  streamState.isGenerating = true;
  streamState.currentResponse = '';
  streamState.currentReasoning = '';
  streamState.isCurrentReasoningCollapsed = false;
  streamState.currentResponseTime = formatTime();
  streamState.currentMeta = null;
  streamState.abortController = new AbortController();

  const msgs = messages.value.map(m => ({ role: m.role, content: m.content }));
  const payload = buildApiPayload(msgs, useStream.value);

  const startTime = performance.now();
  let firstTokenTime = null;
  let lastMetaUpdateTime = 0;

  try {
    if (!useStream.value) {
      const res = await fetch('/api/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: streamState.abortController.signal
      });
      const data = await res.json();
      const endTime = performance.now();
      const ttftSec = (endTime - startTime) / 1000;
      if (data.error) throw new Error(data.error);
      const output = data.choices[0].message.content || '';
      const outputReasoning = data.choices[0].message.reasoning_content || data.choices[0].message.reasoning || '';

      let meta = null;
      if (data.usage?.total_time) {
        const genTokens = data.usage.completion_tokens || 0;
        meta = {
          ttft: ttftSec,
          total_time: data.usage.total_time,
          total_chars: output.length + outputReasoning.length,
          speed_chars: (output.length + outputReasoning.length) / data.usage.total_time,
          total_tokens: genTokens !== 0 ? genTokens : null,
          speed_tokens: genTokens ? (genTokens / data.usage.total_time) : null
        };
      } else {
        meta = {
          ttft: ttftSec,
          total_time: ttftSec,
          total_chars: output.length + outputReasoning.length,
          speed_chars: ttftSec > 0 ? (output.length + outputReasoning.length) / ttftSec : 0
        };
      }

      await appendMessageToSession(sessionId, { role: 'assistant', content: output, reasoning_content: outputReasoning, isCollapsed: outputReasoning ? true : false, meta, time: streamState.currentResponseTime });
      streamState.isGenerating = false;
      if (currentSessionId.value === sessionId) scrollToBottom();
    } else {
      const res = await fetch('/api/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: streamState.abortController.signal
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let responseBuffer = '';
      let reasoningBuffer = '';
      let lastRenderTime = performance.now();
      let hasUnrenderedContent = false;
      const UPDATE_INTERVAL_MS = 100;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });

        const lines = chunk.split('\n');
        for (let line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') continue;
            if (dataStr.startsWith('[TELEMETRY] ')) {
               const finalMeta = JSON.parse(dataStr.slice(12));
               const f_ttft = streamState.currentMeta ? streamState.currentMeta.ttft : (finalMeta.total_time || 0);
               streamState.currentMeta = {
                 ...finalMeta,
                 ttft: f_ttft,
                 total_time: finalMeta.total_time,
                 total_chars: responseBuffer.length + reasoningBuffer.length,
                 speed_chars: finalMeta.total_time > 0 ? (responseBuffer.length + reasoningBuffer.length) / finalMeta.total_time : 0,
                 total_tokens: finalMeta.total_tokens !== undefined ? finalMeta.total_tokens : null,
                 speed_tokens: finalMeta.total_tokens && finalMeta.total_time > 0 ? (finalMeta.total_tokens / finalMeta.total_time) : null
               };
               continue;
            }
            try {
              const data = JSON.parse(dataStr);
              if (data.error) {
                responseBuffer += "\n\n**Error:** " + data.error;
                hasUnrenderedContent = true;
                continue;
              }
              const deltaReasoning = data.choices[0].delta.reasoning_content || data.choices[0].delta.reasoning || '';
              const delta = data.choices[0].delta.content || '';

              if (deltaReasoning || delta) {
                if (!firstTokenTime) {
                  firstTokenTime = performance.now();
                  streamState.currentMeta = {
                    ttft: (firstTokenTime - startTime) / 1000,
                    total_time: null,
                    total_chars: 0,
                    speed_chars: 0,
                    total_tokens: null,
                    speed_tokens: null
                  };
                }
              }

              if (deltaReasoning) {
                reasoningBuffer += deltaReasoning;
                hasUnrenderedContent = true;
              }
              if (delta) {
                if (reasoningBuffer && !streamState.isCurrentReasoningCollapsed) {
                  streamState.isCurrentReasoningCollapsed = true;
                }
                responseBuffer += delta;
                hasUnrenderedContent = true;
              }

              const now = performance.now();
              if (hasUnrenderedContent && now - lastRenderTime > UPDATE_INTERVAL_MS) {
                streamState.currentReasoning = reasoningBuffer;
                streamState.currentResponse = responseBuffer;
                lastRenderTime = now;
                hasUnrenderedContent = false;
                if (currentSessionId.value === sessionId) scrollToBottom();
              }

              if (firstTokenTime && now - lastMetaUpdateTime > 200) {
                const totalChars = responseBuffer.length + reasoningBuffer.length;
                const elapsedSec = (now - firstTokenTime) / 1000;
                const totalElapsedSec = (now - startTime) / 1000;
                if (streamState.currentMeta) {
                  streamState.currentMeta.total_time = totalElapsedSec;
                  streamState.currentMeta.total_chars = totalChars;
                  streamState.currentMeta.speed_chars = elapsedSec > 0 ? totalChars / elapsedSec : 0;
                }
                lastMetaUpdateTime = now;
              }
            } catch (e) {
            }
          }
        }
      }

      if (hasUnrenderedContent) {
        streamState.currentReasoning = reasoningBuffer;
        streamState.currentResponse = responseBuffer;
      }

      await appendMessageToSession(sessionId, { role: 'assistant', content: streamState.currentResponse, reasoning_content: streamState.currentReasoning, isCollapsed: streamState.isCurrentReasoningCollapsed, meta: streamState.currentMeta ? { ...streamState.currentMeta } : null, time: streamState.currentResponseTime });
      streamState.currentResponse = '';
      streamState.currentReasoning = '';
      streamState.isCurrentReasoningCollapsed = false;
      streamState.isGenerating = false;
      if (currentSessionId.value === sessionId) scrollToBottom();
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log("Generation aborted for session", sessionId);
    } else {
      await appendMessageToSession(sessionId, { role: 'assistant', content: `**Error:** ${err.message}`, time: streamState.currentResponseTime });
    }
    streamState.isGenerating = false;
    streamState.currentResponse = '';
  }
};

onMounted(() => {
  document.documentElement.setAttribute('data-theme', theme.value);
  applyHljsTheme(theme.value);
  loadSettings();
  fetchSessions();
  nextTick(() => chatInputRef.value?.focus());
});
</script>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  min-width: 0;
  overflow-y: auto;
}

.top-nav {
  height: 60px;
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--sidebar-bg);
  position: sticky;
  top: 0;
  z-index: 20;
}
.nav-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.mobile-menu-btn {
  display: none;
  font-size: 20px;
}
.nav-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* Toggle Switch Styles */
.toggle-switch {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  user-select: none;
}
.switch-box {
  position: relative;
  width: 36px;
  height: 20px;
}
.switch-box input {
  opacity: 0;
  width: 0;
  height: 0;
}
.switch-box .slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: var(--border-color);
  transition: .2s;
  border-radius: 20px;
}
.switch-box .slider:before {
  position: absolute;
  content: "";
  height: 14px;
  width: 14px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .2s;
  border-radius: 50%;
  box-shadow: var(--shadow-sm);
}
.switch-box input:checked + .slider {
  background-color: var(--primary-color);
}
.switch-box input:checked + .slider:before {
  transform: translateX(16px);
}

.btn-icon {
  font-size: 14px;
  background-color: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 4px 8px;
  transition: all 0.2s;
}
.btn-icon:hover {
  border-color: var(--primary-color);
}

/* Chat styles */
.chat-area {
  flex: 1;
  padding: 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.empty-state {
  margin: auto;
  text-align: center;
  color: var(--text-secondary);
}
.empty-state h1 {
  font-size: 28px;
  color: var(--text-primary);
  margin-bottom: 8px;
}

@media (max-width: 768px) {
  .mobile-menu-btn {
    display: block;
  }
}
</style>
