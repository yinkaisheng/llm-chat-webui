<template>
  <div class="settings-drawer" :class="{'drawer-open': show}">
    <div class="drawer-header">
      <h3>模型配置</h3>
      <button class="btn-close-drawer" @click="$emit('update:show', false)">✕</button>
    </div>
    <div class="drawer-content">
      <div class="form-row">
        <div class="form-group flex-2">
          <label>Base URL</label>
          <input v-model="localConfig.base_url" type="text" placeholder="http://127.0.0.1:8000/v1" />
        </div>
        <div class="form-group flex-1">
          <label>Model Name</label>
          <input v-model="localConfig.model_name" type="text" placeholder="Model Name" />
        </div>
        <div class="form-group flex-1">
          <label>API Key</label>
          <input v-model="localConfig.api_key" type="password" placeholder="sk-..." />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group flex-1">
          <label>System Prompt</label>
          <textarea v-model="localConfig.system_prompt" class="config-textarea" placeholder="你是一个AI助手..."></textarea>
        </div>
        <div class="form-group flex-1">
          <label>Extra Params (JSON)</label>
          <textarea v-model="localConfig.extra_params" class="config-textarea font-mono" placeholder='{"temperature": 0.7, "top_p": 0.9}'></textarea>
        </div>
      </div>
      <div class="drawer-actions">
        <span class="error-msg" v-if="configError">{{ configError }}</span>
        <span class="success-msg" v-if="configSuccess">已保存！</span>
        <button class="btn-cancel" @click="handleReset">恢复默认</button>
        <button class="btn-save" @click="handleSave">保存配置</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  show: Boolean,
  configForm: Object
});

const emit = defineEmits(['update:show', 'save', 'reset']);

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
</style>
