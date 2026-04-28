<template>
  <div class="whiteboard-container card">
    <h3>✏️ {{ isEn ? 'Whiteboard' : '小白板' }}</h3>
    <div class="canvas-wrapper">
      <canvas 
        ref="canvas" 
        @mousedown="startDrawing"
        @mousemove="draw"
        @mouseup="stopDrawing"
        @mouseleave="stopDrawing"
        @touchstart="startDrawing"
        @touchmove="draw"
        @touchend="stopDrawing"
        @touchcancel="stopDrawing"
      ></canvas>
    </div>
    <div class="controls">
      <div class="color-picker">
        <div 
          v-for="color in colors" 
          :key="color" 
          class="color-box" 
          :style="{ backgroundColor: color, border: currentColor === color ? '2px solid #fff' : 'none' }"
          @click="currentColor = color"
        ></div>
      </div>
      <div class="tool-picker">
        <button @click="setTool('pen')" :class="{ active: currentTool === 'pen' }">🖊️ {{ isEn ? 'Pen' : '畫筆' }}</button>
        <button @click="setTool('eraser')" :class="{ active: currentTool === 'eraser' }">🧽 {{ isEn ? 'Eraser' : '橡皮擦' }}</button>
        <input type="range" min="1" max="50" v-model="brushSize" class="brush-size-slider">
        <span>{{ brushSize }}px</span>
      </div>
      <button @click="clearCanvas" class="btn-secondary">🗑️ {{ isEn ? 'Clear' : '清空' }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useI18n } from '../composables/useI18n';

const canvas = ref(null);
let ctx = null;
let isDrawing = false;
let lastX = 0;
let lastY = 0;

const currentColor = ref('#FFFFFF'); // Default to white
const colors = ['#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#000000'];
const brushSize = ref(5);
const currentTool = ref('pen'); // 'pen' or 'eraser'

const i18n = useI18n();
const isEn = computed(() => i18n.locale.value === 'en');

onMounted(() => {
  ctx = canvas.value.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
});

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas);
});

const resizeCanvas = () => {
  const parent = canvas.value.parentElement;
  canvas.value.width = parent.clientWidth;
  canvas.value.height = parent.clientHeight;
  // When canvas resizes, its content is cleared, so we might need to redraw if we had state
  // For a simple whiteboard, clearing is acceptable.
  ctx.fillStyle = '#2a3f5f'; // Set initial background for the canvas
  ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);
};

const getCoords = (e) => {
  const rect = canvas.value.getBoundingClientRect();
  if (e.touches && e.touches.length > 0) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    };
  }
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
};

const startDrawing = (e) => {
  isDrawing = true;
  const { x, y } = getCoords(e);
  [lastX, lastY] = [x, y];
};

const draw = (e) => {
  if (!isDrawing) return;
  e.preventDefault(); // Prevent scrolling on touch devices

  const { x, y } = getCoords(e);

  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(x, y);
  ctx.strokeStyle = currentTool.value === 'pen' ? currentColor.value : '#2a3f5f'; // Eraser uses background color
  ctx.lineWidth = brushSize.value;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  [lastX, lastY] = [x, y];
};

const stopDrawing = () => {
  isDrawing = false;
};

const clearCanvas = () => {
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
  ctx.fillStyle = '#2a3f5f'; // Re-apply background
  ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);
};

const setTool = (tool) => {
  currentTool.value = tool;
};
</script>

<style scoped>
.whiteboard-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  min-height: 500px; /* Ensure it has some height */
}

.canvas-wrapper {
  flex-grow: 1;
  background-color: #2a3f5f; /* Canvas background */
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #3b82f6;
}

canvas {
  display: block; /* Remove extra space below canvas */
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  justify-content: center;
  align-items: center;
  padding: 10px;
  background: #1f2937;
  border-radius: 8px;
  border: 1px solid #3b82f6;
}

.color-picker {
  display: flex;
  gap: 8px;
}

.color-box {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s ease;
}

.color-box:hover {
  transform: scale(1.1);
}

.tool-picker {
  display: flex;
  gap: 8px;
  align-items: center;
}

.tool-picker button {
  padding: 8px 12px !important;
  background: #3b82f6 !important;
  color: white;
  border-radius: 6px !important;
  font-size: 14px !important;
}

.tool-picker button.active {
  background: #10b981 !important;
  border: 2px solid #fff !important;
}

.brush-size-slider {
  width: 100px;
  -webkit-appearance: none;
  height: 8px;
  background: #555;
  outline: none;
  opacity: 0.7;
  transition: opacity .2s;
  border-radius: 4px;
}

.brush-size-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
}

.brush-size-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
}

.controls span {
  color: #e0e0e0;
  font-size: 14px;
}

@media (max-width: 768px) {
  .controls {
    flex-direction: column;
  }
  .tool-picker {
    width: 100%;
    justify-content: center;
  }
}
</style>