<template>
  <div class="settings-drawer" :class="{'drawer-open': show}">
    <div class="drawer-header">
      <h3>页面配置</h3>
      <button class="btn-close-drawer" @click="$emit('update:show', false)">✕</button>
    </div>
    <div class="drawer-content">
      <div class="form-row">
        <div class="form-group flex-1">
          <label>正文字体大小 (px)</label>
          <input type="number" min="16" max="22" step="1" v-model.number="localFontSize" @input="updatePreview" />
        </div>
      </div>
      <div class="drawer-actions">
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
  fontSize: {
    type: Number,
    default: 18
  }
});

const emit = defineEmits(['update:show', 'save', 'reset', 'preview']);

const localFontSize = ref(props.fontSize);
const configSuccess = ref(false);

watch(() => props.fontSize, (newVal) => {
  localFontSize.value = newVal;
});

const updatePreview = () => {
  emit('preview', parseInt(localFontSize.value));
};

const handleSave = () => {
  emit('save', parseInt(localFontSize.value));
  configSuccess.value = true;
  setTimeout(() => { configSuccess.value = false; }, 2000);
};

const handleReset = () => {
  localFontSize.value = 18;
  emit('reset');
  emit('preview', 18);
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
  background: none;
  border: none;
  cursor: pointer;
}
.btn-close-drawer:hover {
  color: #ef4444;
}
.form-row {
  display: flex;
  gap: 16px;
}
.flex-1 { flex: 1; }
.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  color: var(--text-primary);
}
.form-group input[type="number"] {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background-color: var(--bg-color);
  color: var(--text-primary);
  outline: none;
  font-family: inherit;
  font-size: 14px;
  margin-top: 4px;
}
.form-group input[type="number"]:focus {
  border-color: var(--primary-color);
}
.drawer-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
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
</style>
