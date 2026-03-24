<template>
  <div class="message-row" :class="message.role">
    <div class="message-bubble animate-fade-in" :class="message.role">
      <div class="message-role">
        <span class="role-left">
          {{ message.role === 'user' ? (locale === 'zh' ? '你' : 'You') : (locale === 'zh' ? '助手' : 'Assistant') }}
          <span class="message-time" v-if="message.time">{{ message.time }}</span>
        </span>
        <div class="role-right">
          <button class="btn-icon-sm" v-if="message.role === 'user'" @click="$emit('edit', message.content)" :title="t('edit')">✏️</button>
          <button class="btn-icon-sm btn-copy-msg" @click="copyText(message.content)" :title="t('copy')">📋</button>
        </div>
      </div>
      <details class="reasoning-details" v-if="message.reasoning_content" :open="!message.isCollapsed" @toggle="toggleCollapse">
        <summary class="reasoning-summary">
          <span class="collapse-icon">▶</span>
          <span>🤔 {{ t('reasoning') }}</span>
          <button class="btn-icon-sm btn-copy-reasoning" @click.stop.prevent="copyText(message.reasoning_content)" :title="t('copy')">📋</button>
        </summary>
        <div class="message-content markdown-body reasoning-content" v-html="renderMarkdown(message.reasoning_content)" @click="handleCodeCopy"></div>
      </details>
      <div v-if="Array.isArray(message.content)" class="message-content message-multimodal">
        <template v-for="(part, idx) in message.content" :key="idx">
          <img v-if="part.type === 'image_url'" :src="part.image_url.url" class="chat-attached-image" @click.stop="$emit('preview-image', part.image_url.url)" />
          <div v-else-if="part.type === 'text'" class="markdown-body" v-html="renderMarkdown(part.text)" @click="handleCodeCopy"></div>
        </template>
      </div>
      <div v-else class="message-content markdown-body" v-html="renderMarkdown(message.content)" @click="handleCodeCopy"></div>
      <div class="message-meta" v-if="message.meta">
        <span v-if="message.meta.ttft !== undefined && message.meta.ttft !== null">{{ t('firstToken') }}: {{ message.meta.ttft.toFixed(3) }}s</span>
        <span v-if="message.meta.total_time !== undefined && message.meta.total_time !== null">{{ t('totalTime') }}: {{ message.meta.total_time.toFixed(1) }}s</span>
        <span v-if="message.meta.total_chars !== undefined && message.meta.total_chars !== null">{{ t('outputChars') }}: {{ message.meta.total_chars }}</span>
        <span v-if="message.meta.speed_chars !== undefined && message.meta.speed_chars !== null">{{ t('speed') }}: {{ message.meta.speed_chars.toFixed(1) }} {{ t('charsUnit') }}/s</span>
        <template v-if="showLlamaTimingsMeta">
          <span v-if="message.meta.predicted_n != null">{{ t('outputTokens') }}: {{ message.meta.predicted_n }}</span>
          <span v-if="message.meta.predicted_per_second != null">{{ t('speed') }}: {{ message.meta.predicted_per_second.toFixed(2) }} {{ t('tokens') }}/s</span>
        </template>
        <template v-else>
          <span v-if="message.meta.total_tokens !== undefined && message.meta.total_tokens !== null">{{ t('outputTokens') }}: {{ message.meta.total_tokens }}</span>
          <span v-if="message.meta.speed_tokens !== undefined && message.meta.speed_tokens !== null">{{ t('speed') }}: {{ message.meta.speed_tokens.toFixed(2) }} {{ t('tokens') }}/s</span>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { parseMarkdown } from '../utils/markdown';
import { copyToClipboard } from '../utils/clipboard';
import { t, locale } from '../utils/i18n';

const props = defineProps({
  message: {
    type: Object,
    required: true
  }
});

/** llama-server SSE: timings.predicted_n / predicted_per_second (timings_per_token) */
const showLlamaTimingsMeta = computed(() => {
  const m = props.message.meta;
  if (!m) return false;
  return m.predicted_n != null || m.predicted_per_second != null;
});

const emit = defineEmits(['edit', 'update:collapse', 'preview-image']);

const toggleCollapse = (event) => {
  emit('update:collapse', !event.target.open);
};

const renderMarkdown = (text) => {
  return parseMarkdown(text || '');
};

const copyText = async (text) => {
  try {
    let contentToCopy = text;
    if (Array.isArray(text)) {
      contentToCopy = text.filter(p => p.type === 'text').map(p => p.text).join('\n');
    }
    const trimmedText = contentToCopy ? String(contentToCopy).trim() : '';
    const ok = await copyToClipboard(trimmedText);
    if (!ok) console.warn('Copy may have failed (non-secure context or blocked)');
  } catch (err) {
    console.error('Failed to copy', err);
  }
};

const handleCodeCopy = async (event) => {
  const target = event.target;
  if (target && target.classList.contains('code-copy-btn')) {
    const rawCode = target.getAttribute('data-code');
    if (rawCode) {
      try {
        const code = decodeURIComponent(rawCode);
        const ok = await copyToClipboard(code);
        if (ok) {
          const originalText = target.innerText;
          target.innerText = t('copied');
          setTimeout(() => { target.innerText = originalText; }, 2000);
        } else {
          console.warn('Code copy may have failed');
        }
      } catch (err) {
        console.error('Failed to copy code snippet', err);
      }
    }
  }
};
</script>

<style scoped>
.message-row {
  display: flex;
  width: 100%;
  justify-content: center;
}
.message-bubble {
  flex: 0 0 80%;
  max-width: 80%;
  min-width: 0;
  padding: 8px 12px;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  transition: flex 0.3s ease, max-width 0.3s ease;
}
.full-width-mode .message-bubble {
  flex: 0 0 100%;
  max-width: 100%;
}
.message-bubble.user {
  background-color: var(--user-msg-bg);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}
.message-bubble.assistant {
  background-color: var(--helper-msg-bg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
}
.message-role {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 4px;
  line-height: 1.2;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.role-left {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.role-right {
  display: flex;
  gap: 12px;
  align-items: center;
}
.btn-icon-sm {
  font-size: 14px;
  border: none;
  background: none;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.2s;
  padding: 0;
}
.btn-icon-sm:hover {
  opacity: 1;
}
.message-time {
  font-size: 11px;
  line-height: 1.2;
  font-weight: normal;
  color: var(--text-secondary);
  opacity: 0.8;
}
.message-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  line-height: 1.2;
  color: var(--text-secondary);
  margin-top: 6px;
  padding-top: 6px;
  padding-bottom: 2px;
  border-top: 1px solid var(--border-color);
}
.message-content {
  overflow-wrap: anywhere;
  word-break: break-word;
  min-width: 0;
  width: 100%;
  font-size: var(--chat-font-size, 15px);
}
.chat-attached-image {
  max-width: 100%;
  max-height: 400px;
  width: auto;
  height: auto;
  border-radius: 8px;
  margin-bottom: 12px;
  display: block;
  object-fit: scale-down;
  cursor: zoom-in;
  transition: transform 0.2s ease;
}
.chat-attached-image:hover {
  transform: scale(1.02);
}
.message-multimodal {
  display: flex;
  flex-direction: column;
}
.message-content :deep(p),
.message-content :deep(li),
.message-content :deep(a),
.message-content :deep(table) {
  font-size: var(--chat-font-size, 15px);
}

.reasoning-details {
  border-left: 3px solid var(--border-color);
  padding-left: 12px;
  margin-bottom: 12px;
  color: var(--text-secondary);
}
.reasoning-details summary {
  cursor: pointer;
  font-size: calc(var(--chat-font-size, 15px) - 2px);
  font-weight: 500;
  margin-bottom: 8px;
  user-select: none;
}
.reasoning-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  list-style: none; /* Hide default marker in standard browsers */
}
.reasoning-summary::-webkit-details-marker {
  display: none; /* Hide default marker in Safari/Chrome */
}
.collapse-icon {
  display: inline-block;
  font-size: 10px;
  color: var(--text-secondary);
  transition: transform 0.2s ease-in-out;
}
details[open] .collapse-icon {
  transform: rotate(90deg);
}
.btn-copy-reasoning {
  opacity: 0.6;
  padding: 2px 4px;
  background: transparent;
  border: none;
  cursor: pointer;
}
.btn-copy-reasoning:hover {
  opacity: 1;
}
.reasoning-content {
  font-size: calc(var(--chat-font-size, 15px) - 2px);
  opacity: 0.8;
}
.message-content.reasoning-content :deep(p),
.message-content.reasoning-content :deep(li),
.message-content.reasoning-content :deep(a),
.message-content.reasoning-content :deep(table) {
  font-size: calc(var(--chat-font-size, 15px) - 2px);
}

@media (max-width: 768px) {
  .message-bubble {
    flex: 0 0 100% !important;
    max-width: 100% !important;
  }
}
</style>
