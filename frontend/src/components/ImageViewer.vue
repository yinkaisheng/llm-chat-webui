<template>
  <div v-if="show" class="image-viewer-overlay" @click.self="close">
    <div class="viewer-toolbar">
      <span class="zoom-info">{{ zoomInfoText }}</span>
      <button class="btn-tool" @click="zoomIn" :title="t('zoomIn')">🔍+</button>
      <button class="btn-tool" @click="zoomOut" :title="t('zoomOut')">🔍-</button>
      <button class="btn-tool" @click="reset1to1">{{ t('actualSize') }}</button>
      <button class="btn-tool" @click="fitScreen">{{ t('fitScreen') }}</button>
      <button class="btn-close" @click="close">✕</button>
    </div>
    
    <div class="image-container" 
         @wheel.prevent="handleWheel"
         @mousedown="startDrag"
         @mousemove="onDrag"
         @mouseup="stopDrag"
         @mouseleave="stopDrag">
      <img :src="src" 
           class="viewer-img" 
           :style="{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})` }" 
           @dragstart.prevent v-if="src" ref="imgRef" @load="onImageLoad" />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
import { t } from '../utils/i18n';

const props = defineProps({
  show: Boolean,
  src: String
});

const emit = defineEmits(['update:show']);
const scale = ref(1);
const pos = ref({ x: 0, y: 0 });
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const imgRef = ref(null);
const naturalSize = ref({ w: 0, h: 0 });

const zoomInfoText = computed(() => {
  const percent = `${Math.round(scale.value * 100)}%`;
  if (!naturalSize.value.w || !naturalSize.value.h) {
    return percent;
  }
  const displayW = Math.max(1, Math.round(naturalSize.value.w * scale.value));
  const displayH = Math.max(1, Math.round(naturalSize.value.h * scale.value));
  return `${percent} ${displayW} x ${displayH}`;
});

const close = () => {
  emit('update:show', false);
};

const onImageLoad = (e) => {
  naturalSize.value = { w: e.target.naturalWidth, h: e.target.naturalHeight };
  fitScreen();
};

const fitScreen = () => {
  if (!imgRef.value) return;
  const padding = 40;
  const winW = window.innerWidth - padding * 2;
  const winH = window.innerHeight - padding * 2;
  
  if (naturalSize.value.w > winW || naturalSize.value.h > winH) {
    const scaleX = winW / naturalSize.value.w;
    const scaleY = winH / naturalSize.value.h;
    scale.value = Math.min(scaleX, scaleY);
  } else {
    // If image is smaller than window, display actual size
    scale.value = 1;
  }
  pos.value = { x: 0, y: 0 };
};

const reset1to1 = () => {
  scale.value = 1;
  pos.value = { x: 0, y: 0 };
};

const zoomIn = () => {
  scale.value = Math.min(scale.value + 0.25, 10);
};

const zoomOut = () => {
  scale.value = Math.max(scale.value - 0.25, 0.1);
};

const handleWheel = (e) => {
  if (e.deltaY < 0) {
    zoomIn();
  } else {
    zoomOut();
  }
};

const startDrag = (e) => {
  isDragging.value = true;
  dragStart.value = { x: e.clientX - pos.value.x, y: e.clientY - pos.value.y };
};

const onDrag = (e) => {
  if (!isDragging.value) return;
  pos.value = {
    x: e.clientX - dragStart.value.x,
    y: e.clientY - dragStart.value.y
  };
};

const stopDrag = () => {
  isDragging.value = false;
};

// Listen to Escape to close safely
const handleKeyDown = (e) => {
  if (e.key === 'Escape' && props.show) close();
};

onMounted(() => window.addEventListener('keydown', handleKeyDown));
onUnmounted(() => window.removeEventListener('keydown', handleKeyDown));

watch(() => props.show, (newVal) => {
  if (newVal) {
    setTimeout(() => {
      if (imgRef.value && imgRef.value.complete) fitScreen();
    }, 10);
  } else {
    scale.value = 1;
    pos.value = { x: 0, y: 0 };
  }
});
</script>

<style scoped>
.image-viewer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.85);
  z-index: 9999;
  display: flex;
  flex-direction: column;
}
.viewer-toolbar {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 12px;
  align-items: center;
  background: rgba(30, 30, 30, 0.8);
  padding: 8px 16px;
  border-radius: 8px;
  z-index: 10000;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
}
.zoom-info {
  color: white;
  font-family: monospace;
  font-size: 14px;
  min-width: 48px;
  text-align: right;
}
.btn-tool {
  background: none;
  border: 1px solid rgba(255,255,255,0.2);
  color: white;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
  transition: all 0.2s;
}
.btn-tool:hover {
  background: rgba(255,255,255,0.4);
}
.btn-close {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 18px;
  margin-left: 8px;
  padding: 0 4px;
  opacity: 0.8;
}
.btn-close:hover {
  opacity: 1;
  color: #ff4a4a;
}
.image-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: grab;
}
.image-container:active {
  cursor: grabbing;
}
.viewer-img {
  max-width: none;
  max-height: none;
  transition: transform 0.1s ease-out;
  transform-origin: center center;
  user-select: none;
}
</style>
