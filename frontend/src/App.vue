<template>
  <div class="app-container" :style="{ '--chat-font-size': pageFontSize + 'px' }">
    <div 
      v-if="sidebarOpen" 
      class="sidebar-overlay" 
      @click="sidebarOpen = false"
    ></div>
    <Sidebar
      :sessions="sessions"
      :currentSessionId="currentSessionId"
      :sidebarOpen="sidebarOpen"
      :generatingSessions="generatingSessionIds"
      @new-chat="startNewChat"
      @select-session="handleLoadSession"
      @delete-session="deleteChatSession"
      @clear-all="handleClearAll"
    />

    <main class="main-content" :class="{ 'full-width-mode': isFullWidth }" ref="mainContentRef" @scroll="handleScroll">
      <div class="header-container">
        <TopNav
          v-model:sidebarOpen="sidebarOpen"
          v-model:isFullWidth="isFullWidth"
          :currentTitle="currentTitle"
          :theme="theme"
          @toggle-theme="toggleTheme"
          @toggle-page-settings="togglePageSettingsDrawer"
          @toggle-settings="toggleSettingsDrawer"
        />

        <LlmSettingsDrawer
          v-model:show="showSettingsDrawer"
          v-model:useStream="useStream"
          :configForm="configForm"
          @save="updateConfig"
          @reset="resetConfigToDefault"
        />

        <PageSettingsDrawer
          v-model:show="showPageSettingsDrawer"
          :fontSize="pageFontSize"
          @save="savePageFontSize"
          @reset="resetPageFontSize"
          @preview="previewPageFontSize"
        />
      </div>

      <div class="chat-area">
        <div v-if="messages.length === 0" class="empty-state">
          <h1>{{ configForm.model_name || 'LLM Chat' }}</h1>
          <p>{{ t('howCanIHelp') }}</p>
        </div>

        <ChatMessage
          v-for="(msg, index) in messages"
          :key="index"
          :message="msg"
          @edit="handleEditMessage(index, $event)"
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
        @send="handleSendMessage"
        @cancel-edit="cancelEdit(chatInputRef)"
        @regenerate="regenerateLast(useStream, scrollToBottom)"
      />

    </main>
    
    <!-- Scroll navigation buttons -->
    <Transition name="fade">
      <div v-if="hasScrollableContent" class="scroll-nav-buttons">
        <button 
          v-if="!isAtTop" 
          class="btn-scroll-nav btn-scroll-top" 
          @click="scrollToTop"
          title="Scroll to top"
        >
          ↑
        </button>
        <button 
          v-if="!autoScrollEnabled" 
          class="btn-scroll-nav btn-scroll-bottom" 
          @click="scrollToBottom(true)"
          title="Scroll to bottom"
        >
          ↓
        </button>
      </div>
    </Transition>

    <ImageViewer v-model:show="showImageViewer" :src="previewImageUrl" />
</div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { getSession } from './utils/api';
import { t } from './utils/i18n';

// Components
import Sidebar from './components/Sidebar.vue';
import LlmSettingsDrawer from './components/LlmSettingsDrawer.vue';
import PageSettingsDrawer from './components/PageSettingsDrawer.vue';
import ImageViewer from './components/ImageViewer.vue';
import ChatMessage from './components/ChatMessage.vue';
import ChatInput from './components/ChatInput.vue';
import TopNav from './components/TopNav.vue';

// Composables
import { useTheme } from './composables/useTheme';
import { useConfig } from './composables/useConfig';
import { useSessions } from './composables/useSessions';
import { useFontSize } from './composables/useFontSize';
import { useLayout } from './composables/useLayout';
import { useChat } from './composables/useChat';

// State
const sidebarOpen = ref(false);
const showSettingsDrawer = ref(false);
const showPageSettingsDrawer = ref(false);
const showImageViewer = ref(false);
const previewImageUrl = ref('');
const useStream = ref(localStorage.getItem('useStream') !== 'false');
const isAtTop = ref(true);
const hasScrollableContent = ref(false);

// Refs for UI
const chatInputRef = ref(null);
const mainContentRef = ref(null);

// Initialize Composables
const { theme, toggleTheme, initTheme } = useTheme();
const { configForm, loadSettings, resetConfigToDefault, updateConfig } = useConfig();
const { 
  sessions, currentSessionId, currentTitle, 
  fetchSessions, deleteChatSession, clearAll 
} = useSessions();
const { 
  pageFontSize, savePageFontSize, previewPageFontSize, resetPageFontSize 
} = useFontSize();
const { isFullWidth } = useLayout();

const { 
  messages, inputForm, editingIndex, activeStreams, autoScrollEnabled,
  sendMessage, regenerateLast, editMessage, cancelEdit, saveCurrentSession
} = useChat(currentSessionId, currentTitle, configForm, fetchSessions);

// Computed
const generatingSessionIds = computed(() => {
  return Object.keys(activeStreams.value).filter(id => activeStreams.value[id].isGenerating);
});

// Watchers
watch(useStream, (newVal) => {
  localStorage.setItem('useStream', newVal.toString());
});

// Methods
const openImagePreview = (url) => {
  previewImageUrl.value = url;
  showImageViewer.value = true;
};

const toggleSettingsDrawer = () => {
  showSettingsDrawer.value = !showSettingsDrawer.value;
  if (showSettingsDrawer.value) showPageSettingsDrawer.value = false;
};

const togglePageSettingsDrawer = () => {
  showPageSettingsDrawer.value = !showPageSettingsDrawer.value;
  if (showPageSettingsDrawer.value) showSettingsDrawer.value = false;
};

const handleScroll = (e) => {
  const { scrollTop, scrollHeight, clientHeight } = e.target;
  const atBottom = scrollTop + clientHeight >= scrollHeight - 50;
  autoScrollEnabled.value = atBottom;
  
  isAtTop.value = scrollTop < 50;
  hasScrollableContent.value = scrollHeight > clientHeight + 100;
};

const scrollToBottom = (force = false) => {
  if (!force && !autoScrollEnabled.value) return;
  nextTick(() => {
    if (mainContentRef.value) {
      mainContentRef.value.scrollTo({
        top: mainContentRef.value.scrollHeight,
        behavior: 'smooth'
      });
      autoScrollEnabled.value = true;
    }
  });
};

const scrollToTop = () => {
  nextTick(() => {
    if (mainContentRef.value) {
      mainContentRef.value.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  });
};

const startNewChat = () => {
  currentSessionId.value = null;
  currentTitle.value = '___NEW_CHAT___';
  messages.value = [];
  editingIndex.value = null;
  chatInputRef.value?.clearAttachments();
  nextTick(() => chatInputRef.value?.focus());
  if (window.innerWidth <= 768) sidebarOpen.value = false;
};

const handleLoadSession = async (id) => {
  try {
    const data = await getSession(id);
    currentSessionId.value = id;
    currentTitle.value = data.title || '___NEW_CHAT___';
    messages.value = (data.messages || []).map(m => ({
      ...m,
      isCollapsed: m.reasoning_content ? true : false
    }));
    editingIndex.value = null;
    scrollToBottom(true);
    if (window.innerWidth <= 768) sidebarOpen.value = false;
  } catch (e) {
    console.error(e);
  }
};

const handleClearAll = () => clearAll(startNewChat);

const handleEditMessage = (index, content) => editMessage(index, content, chatInputRef);

const handleSendMessage = async (attachments = []) => {
  const result = await sendMessage(attachments, useStream.value, chatInputRef, scrollToBottom);
  if (result === 'CONFIG_NEEDED') {
    if (!configForm.value.base_url) showSettingsDrawer.value = true;
  }
};

// Lifecycle
onMounted(async () => {
  initTheme();
  loadSettings();
  await fetchSessions();
  
  const savedSessionId = localStorage.getItem('lastSessionId');
  if (savedSessionId) {
    handleLoadSession(savedSessionId);
  } else {
    nextTick(() => chatInputRef.value?.focus());
  }
});
</script>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: relative;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  min-width: 0;
  overflow-y: auto;
}

.header-container {
  position: sticky;
  top: 0;
  z-index: 30;
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
  .sidebar-overlay {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(2px);
    z-index: 40;
  }
}

/* Scroll navigation buttons */
.scroll-nav-buttons {
  position: absolute;
  bottom: 120px;
  right: 40px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 20;
}
.btn-scroll-nav {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  border: none;
  box-shadow: var(--shadow-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  opacity: 0.8;
  transition: opacity 0.2s, transform 0.2s;
}
.btn-scroll-nav:hover {
  opacity: 1;
  transform: translateY(-2px);
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
