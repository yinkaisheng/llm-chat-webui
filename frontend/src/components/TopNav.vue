<template>
  <header class="top-nav">
    <div class="nav-left">
      <button class="mobile-menu-btn" @click="$emit('update:sidebarOpen', !sidebarOpen)">☰</button>
      <h2>{{ currentTitle === '___NEW_CHAT___' ? t('newChat') : currentTitle }}</h2>
    </div>
    <div class="nav-right">
      <!-- Full Width Toggle -->
      <label class="toggle-switch toggle-fullwidth" :title="t('fullWidth')">
        <span class="switch-label">{{ t('fullWidth') }}</span>
        <div class="switch-box">
          <input type="checkbox" :checked="isFullWidth" @change="$emit('update:isFullWidth', $event.target.checked)" />
          <span class="slider"></span>
        </div>
      </label>
      <button class="btn-icon" @click="$emit('toggle-theme')" :title="theme === 'dark' ? '☀️' : '🌙'">{{ theme === 'dark' ? '☀️' : '🌙' }}</button>
      <button class="btn-icon" @click="$emit('toggle-page-settings')" :title="t('pageSettings')">🛠 <span class="btn-text">{{ t('pageSettings') }}</span></button>
      <button class="btn-icon" @click="$emit('toggle-settings')" :title="t('llmConfig')">⚙️ <span class="btn-text">{{ t('llmConfig') }}</span></button>

      <!-- Language Switcher -->
      <div class="lang-switcher">
        <button 
          class="btn-lang" 
          :class="{ active: locale === 'zh' }" 
          @click="setLocale('zh')"
        >简</button>
        <button 
          class="btn-lang" 
          :class="{ active: locale === 'en' }" 
          @click="setLocale('en')"
        >EN</button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { t, locale, setLocale } from '../utils/i18n';

defineProps({
  currentTitle: String,
  isFullWidth: Boolean,
  theme: String,
  sidebarOpen: Boolean
});

defineEmits(['update:sidebarOpen', 'update:isFullWidth', 'toggle-theme', 'toggle-page-settings', 'toggle-settings']);
</script>

<style scoped>
.top-nav {
  height: 60px;
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--sidebar-bg);
  position: relative;
  z-index: 20;
}
.nav-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.nav-left h2 {
  margin: 0;
  font-size: 1.2rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 400px;
}
.mobile-menu-btn {
  display: none;
  font-size: 20px;
  background: none;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
}
@media (max-width: 768px) {
  .mobile-menu-btn {
    display: block;
  }
}
.nav-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* Language Switcher */
.lang-switcher {
  display: flex;
  background-color: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
  height: 28px;
}
.btn-lang {
  padding: 0 8px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-lang.active {
  background-color: var(--primary-color);
  color: white;
}
.btn-lang:hover:not(.active) {
  background-color: var(--border-color);
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
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-icon:hover {
  border-color: var(--primary-color);
}

@media (max-width: 768px) {
  .top-nav {
    padding: 0 12px;
  }
  .nav-right {
    gap: 8px;
  }
  .nav-left h2 {
    max-width: 150px;
    font-size: 1rem;
  }
  .toggle-fullwidth, .btn-text {
    display: none;
  }
  .lang-switcher {
    display: none; /* Hide language switcher on very narrow screens if needed, or just keep it small */
  }
}
@media (max-width: 480px) {
  .lang-switcher {
    display: none;
  }
  .nav-left h2 {
    max-width: 100px;
  }
}
</style>
