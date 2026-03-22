<template>
  <aside class="sidebar" :class="{ 'sidebar-open': sidebarOpen }">
    <div class="sidebar-header">
      <button class="btn-new-chat" @click="$emit('new-chat')">+ 新建对话</button>
    </div>
    <div class="session-list">
      <div
        v-for="s in sessions"
        :key="s.id"
        class="session-item"
        :class="{ active: currentSessionId === s.id }"
        @click="$emit('select-session', s.id)"
        :title="`创建时间: ${formatTipTime(s.create_time)}\n更新时间: ${formatTipTime(s.update_time)}`"
      >
        <span class="session-title">{{ s.title || '新对话' }}</span>
        <div class="session-actions">
          <span v-if="generatingSessions.includes(s.id)" class="generating-icon" title="后台正在生成...">
            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
          </span>
          <button class="btn-delete-session" @click.stop="$emit('delete-session', s.id)">✕</button>
        </div>
      </div>
    </div>
    <div class="sidebar-footer">
      <button class="btn-clear-all" @click="$emit('clear-all')">清空所有对话</button>
    </div>
  </aside>
</template>

<script setup>
defineProps({
  sessions: { type: Array, required: true },
  currentSessionId: { type: String, default: null },
  sidebarOpen: { type: Boolean, default: false },
  generatingSessions: { type: Array, default: () => [] }
});

defineEmits(['new-chat', 'select-session', 'delete-session', 'clear-all']);

const formatTipTime = (val) => {
  if (!val) return '未知';
  let dateObj;
  if (typeof val === 'number') {
    dateObj = new Date(val * 1000);
  } else if (typeof val === 'string') {
    return val.split('.')[0];
  } else {
    return '未知';
  }
  
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = dateObj.getFullYear();
  const MM = pad(dateObj.getMonth() + 1);
  const dd = pad(dateObj.getDate());
  const HH = pad(dateObj.getHours());
  const mm = pad(dateObj.getMinutes());
  const ss = pad(dateObj.getSeconds());
  return `${yyyy}-${MM}-${dd} ${HH}:${mm}:${ss}`;
};
</script>

<style scoped>
.sidebar {
  width: 260px;
  flex-shrink: 0;
  background-color: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease;
  z-index: 50;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}
.btn-new-chat {
  width: 100%;
  padding: 12px;
  background-color: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-weight: 600;
  transition: background-color 0.2s;
}
.btn-new-chat:hover {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.session-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.session-item:hover {
  background-color: var(--bg-color);
}
.session-item.active {
  background-color: var(--user-msg-bg);
}
.session-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
}
.session-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.generating-icon {
  display: flex;
  align-items: center;
  gap: 3px;
  margin-right: 4px;
}
.generating-icon .dot {
  width: 4px;
  height: 4px;
  background-color: var(--primary-color, #10a37f);
  border-radius: 50%;
  animation: pulse 1.4s infinite ease-in-out both;
}
.generating-icon .dot:nth-child(1) { animation-delay: -0.32s; }
.generating-icon .dot:nth-child(2) { animation-delay: -0.16s; }
@keyframes pulse {
  0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
  40% { transform: scale(1); opacity: 1; }
}

.btn-delete-session {
  opacity: 0;
  color: #ef4444;
}
.session-item:hover .btn-delete-session {
  opacity: 1;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid var(--border-color);
}
.btn-clear-all {
  width: 100%;
  padding: 8px;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
}

@media (max-width: 768px) {
  .sidebar {
    position: absolute;
    height: 100%;
    transform: translateX(-100%);
  }
  .sidebar.sidebar-open {
    transform: translateX(0);
  }
}
</style>
