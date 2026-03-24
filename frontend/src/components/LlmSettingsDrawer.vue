<template>
  <div class="llm-settings-drawer" :class="{'drawer-open': show}">
    <div class="llm-drawer-header">
      <div class="header-left">
        <h3>{{ t('llmSettingsTitle') }}</h3>
        <div class="config-selector-wrapper">
          <select
            :value="currentIndex"
            @change="handleSelectConfig"
            class="config-select"
          >
            <option v-for="(cfg, index) in configList" :key="cfg.name" :value="index">
              {{ cfg.name }} {{ cfg.isServer ? '(Server)' : '' }}
            </option>
          </select>
          <div class="config-actions">
            <button class="btn-icon" :title="t('copy')" @click="handleCopyConfig">📋</button>
            <button
              class="btn-icon"
              :title="t('rename')"
              @click="handleRenameConfig"
              :disabled="currentIndex === 0"
            >✏️</button>
            <button class="btn-icon" :title="t('new')" @click="handleNewConfig">➕</button>
            <button
              class="btn-icon btn-delete"
              :title="t('delete')"
              @click="handleDeleteConfig"
              :disabled="currentIndex === 0"
            >🗑️</button>
          </div>
        </div>
      </div>
      <button class="btn-close-llm-drawer" @click="handleCloseRequest">✕</button>
    </div>
    <div class="llm-drawer-content">
      <div class="llm-form-row">
        <div class="llm-form-group flex-2">
          <label>{{ t('baseUrl') }}</label>
          <input v-model="localConfig.base_url" type="text" placeholder="http://127.0.0.1:8000/v1" :disabled="currentIndex === 0" />
        </div>
        <div class="llm-form-group flex-1">
          <label>{{ t('modelName') }}</label>
          <input v-model="localConfig.model_name" type="text" placeholder="gpt-4o" :disabled="currentIndex === 0" />
        </div>
        <div class="llm-form-group flex-1 llm-api-stream-group">
          <div class="flex-1">
            <label>{{ t('apiKey') }}</label>
            <input v-model="localConfig.api_key" type="password" placeholder="sk-..." :disabled="currentIndex === 0" />
          </div>
          <div class="llm-stream-toggle-wrapper">
            <label>{{ t('stream') }}</label>
            <label class="toggle-switch" :title="t('stream')">
              <div class="switch-box">
                <input type="checkbox" :checked="useStream" @change="$emit('update:useStream', $event.target.checked)" />
                <span class="slider"></span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div class="llm-form-row">
        <div class="llm-form-group flex-1">
          <label>{{ t('systemPrompt') }}</label>
          <textarea v-model="localConfig.system_prompt" class="llm-config-textarea" :placeholder="t('systemPrompt')" :disabled="currentIndex === 0"></textarea>
        </div>
        <div class="llm-form-group flex-1">
          <label>{{ t('extraParams') }}</label>
          <textarea v-model="localConfig.extra_params" class="llm-config-textarea font-mono" placeholder='{"temperature": 0.7}' :disabled="currentIndex === 0"></textarea>
        </div>
      </div>
      <div class="llm-drawer-actions" v-if="currentIndex !== 0">
        <span class="error-msg" v-if="configError">{{ configError }}</span>
        <span class="success-msg" v-if="configSuccess">OK!</span>
        <button class="btn-cancel" @click="handleReset">{{ t('reset') }}</button>
        <button class="btn-save" @click="handleSave">{{ t('save') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { t } from '../utils/i18n';

const props = defineProps({
  show: Boolean,
  configList: Array,
  currentIndex: Number,
  configForm: Object,
  useStream: Boolean
});

const emit = defineEmits([
  'update:show', 'update:useStream', 'save', 'reset',
  'select-config', 'add-config', 'delete-config', 'rename-config'
]);

const localConfig = ref({ ...props.configForm });
const configError = ref('');
const configSuccess = ref(false);

watch(() => props.configForm, (newVal) => {
  localConfig.value = { ...newVal };
}, { deep: true });

const handleSelectConfig = (e) => {
  const index = parseInt(e.target.value);
  if (validate()) {
    emit('select-config', index);
  } else {
    // Reset the dropdown visually if validation fails
    e.target.value = props.currentIndex;
  }
};

const handleRenameConfig = () => {
  if (props.currentIndex === 0) return;
  const oldName = props.configList[props.currentIndex].name;
  const name = prompt(t('enterNewName') || 'Enter new name:', `${oldName}-New`);
  if (!name || name === oldName) return;

  if (props.configList.some(c => c.name === name)) {
    alert(t('nameExists') || 'Name already exists!');
    return;
  }

  emit('rename-config', props.currentIndex, name);
};

const handleCopyConfig = () => {
  const oldName = props.configList[props.currentIndex].name;
  const name = prompt(t('enterNewConfigName') || 'Enter new configuration name:', `${oldName}-Copy`);
  if (!name) return;

  if (props.configList.some(c => c.name === name)) {
    alert(t('nameExists') || 'Name already exists!');
    return;
  }

  emit('add-config', name, { ...localConfig.value });
};

const handleNewConfig = () => {
  const name = prompt(t('enterNewConfigName') || 'Enter new configuration name:');
  if (!name) return;

  if (props.configList.some(c => c.name === name)) {
    alert(t('nameExists') || 'Name already exists!');
    return;
  }

  emit('add-config', name);
};

const handleDeleteConfig = () => {
  if (props.currentIndex === 0) return;
  if (confirm(t('confirmDeleteConfig') || 'Are you sure you want to delete this configuration?')) {
    emit('delete-config', props.currentIndex);
  }
};

const handleSave = () => {
  configError.value = '';
  configSuccess.value = false;

  if (!localConfig.value.base_url || !localConfig.value.model_name) {
    configError.value = t('configRequired');
    return;
  }
  try {
    if (localConfig.value.extra_params && localConfig.value.extra_params.trim() !== '') {
      JSON.parse(localConfig.value.extra_params);
    }
  } catch (e) {
    configError.value = t('jsonError');
    return;
  }

  emit('save', { ...localConfig.value });
  configSuccess.value = true;
  setTimeout(() => { configSuccess.value = false; }, 2000);
};

const handleReset = () => {
  configError.value = '';
  emit('reset');
  configSuccess.value = true;
  setTimeout(() => { configSuccess.value = false; }, 2000);
};

const validate = () => {
  if (props.currentIndex === 0) return true;
  if (!localConfig.value.base_url || !localConfig.value.model_name) {
    configError.value = t('configRequired');
    return false;
  }
  return true;
};

const handleCloseRequest = () => {
  if (validate()) {
    emit('update:show', false);
  }
};

defineExpose({ validate });
</script>

<style scoped>
.llm-settings-drawer {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: var(--sidebar-bg);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-md);
  z-index: 20;

  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-in-out, padding 0.3s ease-in-out;
  padding: 0 16px;
}
.llm-settings-drawer.drawer-open {
  max-height: calc(100vh - 100px);
  padding: 16px;
  overflow-y: auto;
}
.llm-drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 16px;
  flex-wrap: wrap;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 300px;
}
.config-selector-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}
.config-select {
  flex: 1;
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background-color: var(--bg-color);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  cursor: pointer;
  max-width: 400px;
}
.config-actions {
  display: flex;
  gap: 4px;
}
.btn-icon {
  background: none;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-icon:hover:not(:disabled) {
  background-color: var(--bg-hover);
  border-color: var(--text-secondary);
}
.btn-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-delete:hover:not(:disabled) {
  color: #ef4444;
  border-color: #ef4444;
}
.llm-drawer-header h3 {
  margin: 0;
  font-size: 16px;
  white-space: nowrap;
}
.btn-close-llm-drawer {
  font-size: 18px;
  color: var(--text-secondary);
  transition: color 0.2s;
  background: none;
  border: none;
  cursor: pointer;
}
.btn-close-llm-drawer:hover {
  color: #ef4444;
}
.llm-form-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.llm-api-stream-group {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  min-width: 250px;
}
.llm-stream-toggle-wrapper {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 8px;
}
.llm-stream-toggle-wrapper label:first-child {
  margin-bottom: 0;
}
.flex-1 { flex: 1; }
.flex-2 { flex: 2; }
.llm-form-group {
  margin-bottom: 16px;
}
.llm-form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}
.llm-form-group input, .llm-form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background-color: var(--bg-color);
  color: var(--text-primary);
  outline: none;
  font-family: inherit;
  font-size: 14px;
}
.llm-form-group textarea.font-mono {
  font-family: 'Courier New', Courier, monospace;
}
.llm-config-textarea {
  height: 140px !important;
  resize: vertical;
}
.llm-form-group input:focus, .llm-form-group textarea:focus {
  border-color: var(--primary-color);
}
.llm-drawer-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
}
.error-msg {
  color: #ef4444;
  font-size: 13px;
  animation: shake 0.4s ease-in-out;
}
.success-msg {
  color: #10b981;
  font-size: 13px;
  animation: fadeIn 0.3s ease-out;
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}
.btn-save {
  padding: 8px 16px;
  border-radius: 6px;
  background-color: var(--primary-color);
  color: white;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn-save:hover {
  background-color: var(--primary-hover);
}
.btn-cancel {
  padding: 8px 16px;
  border-radius: 6px;
  background-color: var(--bg-color);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-cancel:hover {
  border-color: var(--text-secondary);
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

@media (max-width: 768px) {
  .llm-form-row {
    flex-direction: column;
    gap: 0;
  }
  .llm-api-stream-group {
    width: 100%;
    flex-direction: row;
    align-items: flex-end;
  }
  .flex-2 { flex: 1; }
}
</style>
