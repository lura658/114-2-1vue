<template>
  <div class="card timer-container">
    <h2>⏱️ {{ isEn ? 'Timer' : '小組報告計時器' }}</h2>

    <!-- 配置面板 -->
    <Transition name="fade">
      <div v-if="!isRunning" class="config-panel">
        <h3>{{ isEn ? 'Set Time' : '設定計時時間' }}</h3>

        <label>{{ isEn ? 'Select Time:' : '選擇時間：' }}</label>
        <div class="preset-buttons">
          <button 
            v-for="preset in presets"
            :key="preset.value"
            @click="customTime = preset.value; selectedPreset = preset.value"
            :class="['preset-btn', selectedPreset === preset.value ? 'active' : '']"
          >
            {{ preset.label }}
          </button>
        </div>

        <label style="margin-top: 20px;">{{ isEn ? 'Custom Time (seconds):' : '自訂時間（秒）：' }}</label>
        <div class="custom-input">
          <input 
            v-model.number="customTime"
            type="number"
            min="1"
            max="3600"
            @input="selectedPreset = null"
          >
          <span class="hint">1 - 3600 {{ isEn ? 'sec' : '秒' }}</span>
        </div>

        <label style="margin-top: 20px;">
          <input type="checkbox" v-model="enableSound"> {{ isEn ? 'Enable Sound' : '啟用計時提示音' }}
        </label>

        <div class="time-display">
          <div class="display-label">{{ isEn ? 'Timer Length' : '計時時間' }}</div>
          <div class="time-value">{{ formatTime(customTime) }}</div>
        </div>

        <div class="button-group">
          <button @click="startTimer" class="btn-primary btn-large">
            {{ isEn ? 'Start' : '開始計時' }} ▶️
          </button>
          <button @click="resetConfig" class="btn-secondary">
            {{ isEn ? 'Reset' : '重置' }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- 計時進行中 -->
    <Transition name="fade">
      <div v-if="isRunning" class="active-panel">
        <div :class="['timer-display', { warning: remainTime < 10 && remainTime > 0, finished: remainTime <= 0 }]">
          {{ formatTime(remainTime) }}
        </div>

        <div class="progress-bar">
          <div class="progress" :style="{ width: getProgressPercent() + '%' }"></div>
        </div>

        <div class="status-text">
          <span v-if="remainTime > 0" class="status-running">{{ isEn ? 'Running...' : '計時進行中...' }}</span>
          <span v-else class="status-finished">⏰ {{ isEn ? 'Time is up!' : '時間到！' }}</span>
        </div>

        <div class="button-group">
          <button 
            v-if="!isPaused && remainTime > 0"
            @click="pauseTimer"
            class="btn-secondary"
          >
            {{ isEn ? 'Pause' : '暫停' }}
          </button>
          <button 
            v-if="isPaused"
            @click="resumeTimer"
            class="btn-primary"
          >
            {{ isEn ? 'Resume' : '繼續' }}
          </button>
          <button @click="stopTimer" class="btn-tertiary">
            {{ isEn ? 'Stop' : '停止' }}
          </button>
        </div>

        <div v-if="remainTime <= 0" class="celebration">
          <span class="icon">🎉</span>
          <span class="icon">⭐</span>
          <span class="icon">🎊</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from '../composables/useI18n'

const props = defineProps(['selectedRecord'])

const isRunning = ref(false)
const isPaused = ref(false)
const remainTime = ref(0)
const customTime = ref(300) // 預設5分
const selectedPreset = ref(300)
const enableSound = ref(true)
let timerInterval = null

const i18n = useI18n()
const isEn = computed(() => i18n.locale.value === 'en')

const presets = computed(() => [
  { value: 180, label: isEn.value ? '3 Min' : '3 分' },
  { value: 300, label: isEn.value ? '5 Min' : '5 分' },
  { value: 600, label: isEn.value ? '10 Min' : '10 分' }
])

const formatTime = (seconds) => {
  if (seconds < 0) seconds = 0
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

const getProgressPercent = () => {
  return (remainTime.value / customTime.value) * 100
}

const startTimer = () => {
  if (customTime.value <= 0) {
    alert('請輸入有效的時間')
    return
  }
  remainTime.value = customTime.value
  isRunning.value = true
  isPaused.value = false
  runTimer()
}

const runTimer = () => {
  clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    remainTime.value--

    // 最後10秒時播放警告
    if (remainTime.value === 10 && enableSound.value) {
      playSound('warning')
    }

    // 時間到時
    if (remainTime.value <= 0) {
      clearInterval(timerInterval)
      if (enableSound.value) {
        playSound('finish')
      }
    }
  }, 1000)
}

const pauseTimer = () => {
  clearInterval(timerInterval)
  isPaused.value = true
}

const resumeTimer = () => {
  isPaused.value = false
  runTimer()
}

const stopTimer = () => {
  clearInterval(timerInterval)
  isRunning.value = false
  isPaused.value = false
  remainTime.value = 0
}

const resetConfig = () => {
  customTime.value = 300
  selectedPreset.value = 300
}

const playSound = (type) => {
  // 使用 Web Audio API 生成簡單的聲音
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  const now = audioContext.currentTime
  const oscillator = audioContext.createOscillator()
  const gain = audioContext.createGain()

  oscillator.connect(gain)
  gain.connect(audioContext.destination)

  if (type === 'warning') {
    oscillator.frequency.value = 800
    gain.gain.setValueAtTime(0.1, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1)
    oscillator.start(now)
    oscillator.stop(now + 0.1)
  } else if (type === 'finish') {
    oscillator.frequency.value = 1000
    gain.gain.setValueAtTime(0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)
    oscillator.start(now)
    oscillator.stop(now + 0.3)
  }
}
</script>

<style scoped>
.timer-container {
  max-width: 700px;
  margin: 0 auto;
  background: var(--card-bg);
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border);
}

.timer-container h2 {
  color: #fff;
  margin-top: 0;
}

.preset-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin: 15px 0;
  flex-wrap: wrap;
}

.preset-btn {
  padding: 10px 20px !important;
  background: linear-gradient(135deg, #1f2937, #374151) !important;
  color: #e0e0e0 !important;
  border: 2px solid #3b82f6 !important;
  border-radius: 8px !important;
  transition: all 0.3s ease;
}

.preset-btn.active {
  background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
  color: white !important;
  border-color: #3b82f6 !important;
  transform: scale(1.05);
}

.custom-input {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.custom-input input {
  width: 100px;
  padding: 10px !important;
  font-size: 16px;
  text-align: center;
}

.time-display {
  background: linear-gradient(135deg, #1f2937, #374151);
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  text-align: center;
  border: 1px solid #3b82f6;
}

.display-label {
  color: #9ca3af;
  font-weight: 600;
  margin-bottom: 10px;
}

.time-value {
  font-size: 2.5em;
  font-weight: 700;
  background: linear-gradient(135deg, #3b82f6, #10b981);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.btn-large {
  padding: 15px 40px !important;
  font-size: 16px !important;
}

.timer-display {
  font-size: 4em;
  font-weight: 700;
  color: #fff;
  text-align: center;
  padding: 40px 20px;
  background: linear-gradient(135deg, #1f2937, #374151);
  border-radius: 12px;
  margin: 30px 0;
  font-family: 'Courier New', monospace;
  border: 3px solid #3b82f6;
  transition: all 0.3s ease;
}

.timer-display.warning {
  color: #ef4444;
  animation: warningFlash 0.4s ease-in-out infinite;
  border-color: #ef4444;
  text-shadow: 0 0 20px rgba(239, 68, 68, 0.8);
}

.timer-display.finished {
  color: #ef4444;
  animation: finishFlash 0.3s ease-in-out infinite;
  border-color: #ef4444;
  text-shadow: 0 0 30px rgba(239, 68, 68, 1);
}

@keyframes warningFlash {
  0%, 100% { 
    transform: scale(1);
    opacity: 1;
  }
  50% { 
    transform: scale(1.05);
    opacity: 0.7;
  }
}

@keyframes finishFlash {
  0%, 100% { 
    transform: scale(1);
    opacity: 1;
  }
  50% { 
    transform: scale(1.08);
    opacity: 0.6;
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.progress-bar {
  width: 100%;
  height: 10px;
  background: #374151;
  border-radius: 10px;
  overflow: hidden;
  margin: 20px 0;
}

.progress {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #10b981);
  transition: width 1s linear;
}

.status-text {
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  margin: 15px 0;
}

.status-running {
  color: #9ca3af;
}

.status-finished {
  color: #ef4444;
}

.celebration {
  display: flex;
  justify-content: center;
  gap: 20px;
  font-size: 2em;
  margin: 20px 0;
  animation: bounce 0.6s infinite;
}

.celebration .icon {
  display: inline-block;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

label {
  display: block;
  margin-top: 15px;
  font-weight: 600;
}

input[type="checkbox"] {
  margin-right: 8px;
  cursor: pointer;
}
</style>
