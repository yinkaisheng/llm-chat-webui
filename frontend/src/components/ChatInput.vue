<template>
  <div class="input-area">
    <div class="input-wrapper">
      <div v-if="attachments.length > 0" class="attachments-preview">
        <div v-for="(img, idx) in attachments" :key="idx" class="thumbnail-wrapper">
          <img :src="img.url" class="thumbnail" />
          <button class="btn-remove-attachment" @click="removeAttachment(idx)">✕</button>
        </div>
      </div>

      <textarea
        v-model="internalValue"
        :placeholder="t('inputPlaceholder')"
        @keydown.enter.exact.prevent="emitSend"
        @paste="handlePaste"
        ref="inputRef"
        rows="1"
        @input="autoResize"
        @keydown.esc="$emit('cancel-edit')"
      ></textarea>

      <div class="input-actions">
        <button class="btn-icon btn-attach" @click="triggerFileInput" :title="t('attachImage')">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-image">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
        </button>
        <input type="file" ref="fileInputRef" accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/tiff" multiple class="hidden-file-input" @change="handleFileSelect" />

        <button class="btn-send" @click="emitSend" :disabled="isGenerating && !canStopAndComplete">
          {{ isGenerating ? '⏹ ' + t('stop') : (isEditing ? '➤ ' + t('update') : '➤ ' + t('send')) }}
        </button>
      </div>
    </div>
    <div class="input-meta">
      <template v-if="isEditing">
        <span class="edit-info">✏️ {{ t('edit') }}</span>
        <button class="btn-regenerate" style="color: #ef4444;" @click="$emit('cancel-edit')">✕ {{ t('close') }} (Esc)</button>
      </template>
      <template v-else-if="canRegenerate">
        <button class="btn-regenerate" @click="$emit('regenerate')">↻ {{ t('regenerate') }}</button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import { t } from '../utils/i18n';

const props = defineProps({
  modelValue: String,
  isGenerating: Boolean,
  canStopAndComplete: Boolean,
  isEditing: Boolean,
  canRegenerate: Boolean
});

const emit = defineEmits(['update:modelValue', 'send', 'cancel-edit', 'regenerate']);
const internalValue = ref(props.modelValue);
const inputRef = ref(null);
const fileInputRef = ref(null);
const attachments = ref([]);

watch(() => props.modelValue, (newVal) => {
  if (internalValue.value !== newVal) {
    internalValue.value = newVal;
    autoResize();
  }
});

watch(internalValue, (newVal) => {
  emit('update:modelValue', newVal);
});

const autoResize = () => {
  if (inputRef.value) {
    inputRef.value.style.height = 'auto';
    const maxH = window.innerHeight * 0.5;
    inputRef.value.style.height = Math.min(inputRef.value.scrollHeight, maxH) + 'px';
  }
};

const focus = () => {
  nextTick(() => {
    inputRef.value?.focus();
  });
};

const triggerFileInput = () => {
  fileInputRef.value?.click();
};

const readImageAsBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
};

const processFiles = async (files) => {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.type.startsWith('image/')) {
      const base64 = await readImageAsBase64(file);
      attachments.value.push({ url: base64, name: file.name });
    }
  }
  autoResize();
};

const handleFileSelect = async (e) => {
  const files = e.target.files;
  if (files) await processFiles(files);
  e.target.value = '';
};

const handlePaste = async (e) => {
  const items = e.clipboardData?.items;
  if (items) {
    const files = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') === 0) {
        files.push(items[i].getAsFile());
      }
    }
    if (files.length > 0) {
      await processFiles(files);
    }
  }
};

const removeAttachment = (idx) => {
  attachments.value.splice(idx, 1);
};

const clearAttachments = () => {
  attachments.value = [];
};

const setAttachments = (newAttachments) => {
  attachments.value = [...newAttachments];
};

const emitSend = () => {
  if (!props.isGenerating && !internalValue.value.trim() && attachments.value.length === 0) return;
  emit('send', attachments.value);
};

defineExpose({ focus, autoResize, clearAttachments, setAttachments });
</script>

<style scoped>
.input-area {
  flex-shrink: 0;
  padding: 16px 24px;
  background-color: var(--bg-color);
  border-top: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  position: sticky;
  bottom: 0;
  z-index: 10;
}
.input-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 80%;
  background-color: var(--sidebar-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
  padding: 12px;
  position: relative;
  transition: border-color 0.2s, max-width 0.3s ease;
}
.full-width-mode .input-wrapper {
  max-width: 100%;
}
.input-wrapper:focus-within {
  border-color: var(--primary-color);
}
.input-wrapper textarea {
  width: 100%;
  border: none;
  background: transparent;
  outline: none;
  color: var(--text-primary);
  font-family: inherit;
  font-size: var(--chat-font-size, 15px);
  resize: none;
  padding: 4px 0;
  overflow-y: auto;
  line-height: 1.5;
}
.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
  margin-bottom: -2px;
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
}
.btn-attach {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: all 0.2s;
  padding: 6px;
  border-radius: 6px;
}
.btn-attach:hover {
  background-color: var(--bg-color);
  color: var(--primary-color);
}
.btn-attach svg {
  width: 20px;
  height: 20px;
}
.hidden-file-input {
  display: none;
}
.attachments-preview {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}
.thumbnail-wrapper {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  overflow: hidden;
  background: #f0f0f0;
}
.thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.btn-remove-attachment {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0,0,0,0.6);
  color: white;
  border: none;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 12px;
  line-height: 18px;
  text-align: center;
  cursor: pointer;
}
.btn-remove-attachment:hover {
  background: #ef4444;
}

.btn-send {
  background-color: var(--primary-color);
  color: white;
  padding: 6px 16px;
  border-radius: 8px;
  font-weight: 600;
  transition: background-color 0.2s;
}
.btn-send:disabled {
  background-color: var(--text-secondary);
  cursor: not-allowed;
}
.input-meta {
  width: 100%;
  max-width: 80%;
  margin-top: 8px;
  display: flex;
  justify-content: center;
  transition: max-width 0.3s ease;
}
.full-width-mode .input-meta {
  max-width: 100%;
}
.btn-regenerate {
  font-size: 12px;
  color: var(--text-secondary);
  padding: 4px 8px;
  background: none;
  border: none;
}
.btn-regenerate:hover {
  text-decoration: underline;
  cursor: pointer;
}
.edit-info {
  margin-right: 12px;
  color: var(--primary-color);
  font-size: 13px;
}
@media (max-width: 768px) {
  .input-wrapper, .input-meta {
    max-width: 100% !important;
  }
}
</style>
