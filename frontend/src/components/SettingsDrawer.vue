<template>
  <div class="settings-drawer" :class="{'drawer-open': show}">
    <div class="drawer-header">
      <h3>{{ t('settingsTitle') }}</h3>
      <button class="btn-close-drawer" @click="$emit('update:show', false)">✕</button>
    </div>
    <div class="drawer-content">
      <div class="form-row">
        <div class="form-group flex-2">
          <label>{{ t('baseUrl') }}</label>
          <input v-model="localConfig.base_url" type="text" placeholder="http://127.0.0.1:8000/v1" />
        </div>
        <div class="form-group flex-1">
          <label>{{ t('modelName') }}</label>
          <input v-model="localConfig.model_name" type="text" placeholder="gpt-4o" />
        </div>
        <div class="form-group flex-1 api-stream-group">
          <div class="flex-1">
            <label>{{ t('apiKey') }}</label>
            <input v-model="localConfig.api_key" type="password" placeholder="sk-..." />
          </div>
          <div class="stream-toggle-wrapper">
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

      <div class="form-row">
        <div class="form-group flex-1">
          <label>{{ t('systemPrompt') }}</label>
          <textarea v-model="localConfig.system_prompt" class="config-textarea" :placeholder="t('systemPrompt')"></textarea>
        </div>
        <div class="form-group flex-1">
          <label>{{ t('extraParams') }}</label>
          <textarea v-model="localConfig.extra_params" class="config-textarea font-mono" placeholder='{"temperature": 0.7}'></textarea>
        </div>
      </div>
      <div class="drawer-actions">
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
  configForm: Object,
  useStream: Boolean
});

const emit = defineEmits(['update:show', 'update:useStream', 'save', 'reset']);

const localConfig = ref({ ...props.configForm });
const configError = ref('');
const configSuccess = ref(false);

watch(() => props.configForm, (newVal) => {
  localConfig.value = { ...newVal };
}, { deep: true });

const handleSave = () => {
  configError.value = '';
  configSuccess.value = false;

  if (!localConfig.value.base_url || !localConfig.value.model_name) {
    configError.value = "Base URL and Model Name are required.";
    return;
  }
  try {
    if (localConfig.value.extra_params && localConfig.value.extra_params.trim() !== '') {
      JSON.parse(localConfig.value.extra_params);
    }
  } catch (e) {
    configError.value = "Extra Params must be a valid JSON string.";
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
</script>

<style scoped>
.settings-drawer {
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
.settings-drawer.drawer-open {
  max-height: calc(100vh - 100px); 
  padding: 16px;
  overflow-y: auto;
}
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.drawer-header h3 {
  margin: 0;
  font-size: 16px;
}
.btn-close-drawer {
  font-size: 18px;
  color: var(--text-secondary);
  transition: color 0.2s;
}
.btn-close-drawer:hover {
  color: #ef4444;
}
.form-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.api-stream-group {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  min-width: 250px;
}
.stream-toggle-wrapper {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 8px;
}
.stream-toggle-wrapper label:first-child {
  margin-bottom: 0;
}
.flex-1 { flex: 1; }
.flex-2 { flex: 2; }
.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}
.form-group input, .form-group textarea {
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
.form-group textarea.font-mono {
  font-family: 'Courier New', Courier, monospace;
}
.config-textarea {
  height: 140px !important;
  resize: vertical;
}
.form-group input:focus, .form-group textarea:focus {
  border-color: var(--primary-color);
}
.drawer-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
}
.error-msg {
  color: #ef4444;
  font-size: 13px;
}
.success-msg {
  color: #10b981;
  font-size: 13px;
  animation: fadeIn 0.3s ease-out;
}
.btn-save {
  padding: 8px 16px;
  border-radius: 6px;
  background-color: var(--primary-color);
  color: white;
  font-weight: 500;
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
  transition: all 0.2s;
}
.btn-cancel:hover {
  border-color: var(--text-secondary);
}

/* Toggle Switch Styles (Copied from App.vue or shared) */
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
  .form-row {
    flex-direction: column;
    gap: 0;
  }
  .api-stream-group {
    width: 100%;
    flex-direction: row;
    align-items: flex-end;
  }
  .flex-2 { flex: 1; }
}
</style>
