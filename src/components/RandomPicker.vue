<template>
  <div class="picker-container">
    <h2>🎲 {{ isEn ? 'Random Picker' : '隨機抽籤機' }}</h2>

    <!-- 配置面板 -->
    <Transition name="fade">
      <div v-if="!isActive" class="config-panel">
        <h3>{{ isEn ? 'Setup Items' : '設定抽籤項目' }}</h3>
        
        <label>{{ isEn ? 'Enter list (one per line):' : '請輸入名單（每行一個）：' }}</label>
        <textarea 
          v-model="inputList"
          class="textarea-list"
          :placeholder="isEn ? 'John\nJane\nDoe' : '例如：張三\n李四\n王五\n...'"
        ></textarea>

        <select v-if="savedLists.length > 0" v-model="selectedList" @change="loadList" class="select-list">
          <option value="">-- {{ isEn ? 'Select a saved list' : '選擇已建立名單' }} --</option>
          <option v-for="list in savedLists" :key="list.id" :value="list.id">
            {{ list.name }} ({{ list.members.length }} {{ isEn ? 'members' : '人' }})
          </option>
        </select>

        <div class="hint">💡 {{ isEn ? 'Paste or type list, one name per line' : '粘貼或輸入學生名單，每行一個名字' }}</div>

        <div class="button-group">
          <button 
            v-if="listArray.length > 0"
            @click="startPicking"
            class="btn-primary"
          >
            {{ isEn ? 'Start' : '開始抽籤' }} ✨
          </button>
          <button 
            v-else
            disabled
            class="btn-disabled"
          >
            {{ isEn ? 'Enter list first' : '請先輸入名單' }}
          </button>
          <button 
            @click="inputList = ''"
            class="btn-secondary"
          >
            {{ isEn ? 'Clear' : '清除' }}
          </button>
        </div>

        <div class="item-count">
          {{ isEn ? 'Total' : '共' }} <strong>{{ listArray.length }}</strong> {{ isEn ? 'items' : '個項目' }}
        </div>
      </div>
    </Transition>

    <!-- 抽籤進行中 -->
    <Transition name="fade">
      <div v-if="isActive" class="active-panel">
        <div class="item-list">
          <div class="item-list-title">{{ isEn ? 'Remaining:' : '剩餘項目：' }} {{ activeList.length }}</div>
          <div class="item-tags">
            <span 
              v-for="(item, idx) in activeList" 
              :key="idx"
              class="tag"
              :style="{ backgroundColor: getRandomColor(idx) }"
            >
              {{ item }}
            </span>
          </div>
        </div>

        <div class="wheel-container">
          <div class="pointer"></div>
          <div 
            class="wheel" 
            :style="{ 
              transform: `rotate(${currentRotation}deg)`, 
              transition: `transform ${spinDuration}s cubic-bezier(0.2, 0.8, 0.2, 1)` 
            }"
          >
            <svg viewBox="0 0 300 300" width="100%" height="100%">
              <g v-for="(item, idx) in activeList" :key="idx">
                <path :d="getSlicePath(idx, activeList.length)" :fill="getRandomColor(idx)" stroke="#1f2937" stroke-width="2"/>
                <text
                  :transform="getTextTransform(idx, activeList.length)"
                  x="280"
                  y="150"
                  text-anchor="end"
                  alignment-baseline="middle"
                  fill="#fff"
                  font-weight="bold"
                  font-size="14"
                >
                  {{ truncateText(item, 10) }}
                </text>
              </g>
              <circle cx="150" cy="150" r="15" fill="#3b82f6" stroke="#fff" stroke-width="3" />
            </svg>
          </div>
        </div>

        <div v-if="result" class="result-section">
          <h3>🎉 {{ isEn ? 'Result:' : '抽中了：' }}</h3>
          <div class="result-display">{{ result }}</div>
          
          <div class="button-group">
            <button @click="pickAgain" class="btn-primary">
              {{ isEn ? 'Pick Again' : '再抽一次' }}
            </button>
            <button 
              v-if="activeList.length > 0"
              @click="excludeResult"
              class="btn-tertiary"
            >
              {{ isEn ? 'Exclude Item' : '排除此項目' }}
            </button>
            <button @click="reset" class="btn-secondary">
              {{ isEn ? 'Reset' : '重新設定' }}
            </button>
          </div>
        </div>

        <div v-else class="button-group" style="margin-top: 30px;">
          <button 
            @click="performPick" 
            class="btn-primary btn-large"
            :disabled="isSpinning"
          >
            {{ isSpinning ? (isEn ? 'Spinning...' : '抽籤中...') : (isEn ? 'Click to Spin' : '點擊開始抽籤') }}
          </button>
          <button @click="isActive = false" class="btn-secondary">
            {{ isEn ? 'Back' : '返回設定' }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useHistory } from '../composables/useHistory'
import { useI18n } from '../composables/useI18n'

const props = defineProps(['selectedRecord'])

const inputList = ref('')
const isActive = ref(false)
const result = ref('')
const activeList = ref([])

const currentRotation = ref(0)
const spinDuration = ref(0)
const isSpinning = ref(false)
const savedLists = ref(JSON.parse(localStorage.getItem('memberLists')) || [])
const selectedList = ref('')

const i18n = useI18n()
const isEn = computed(() => i18n.locale.value === 'en')
const history = useHistory()
const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#06b6d4']

const listArray = computed(() => {
  return inputList.value
    .split('\n')
    .map(i => i.trim())
    .filter(i => i && i.length > 0)
})

const loadList = () => {
  if (selectedList.value) {
    const list = savedLists.value.find(l => l.id === selectedList.value)
    if (list) {
      inputList.value = list.members.join('\n')
    }
  }
}

const getRandomColor = (idx) => {
  return colors[idx % colors.length]
}

const truncateText = (text, len) => {
  return text.length > len ? text.substring(0, len) + '...' : text
}

const getCoordinatesForPercent = (percent) => {
  const x = Math.cos(2 * Math.PI * percent) * 150
  const y = Math.sin(2 * Math.PI * percent) * 150
  return [x + 150, y + 150]
}

const getSlicePath = (index, total) => {
  if (total === 1) return "M 150 0 A 150 150 0 1 1 149.99 0 Z"
  
  // 調整 -0.25 讓第一塊扇形的起始點在正上方 (12點鐘方向)
  const startPercent = index / total - 0.25
  const endPercent = (index + 1) / total - 0.25
  
  const [startX, startY] = getCoordinatesForPercent(startPercent)
  const [endX, endY] = getCoordinatesForPercent(endPercent)
  
  const largeArcFlag = (1 / total) > 0.5 ? 1 : 0
  
  return `M 150 150 L ${startX} ${startY} A 150 150 0 ${largeArcFlag} 1 ${endX} ${endY} Z`
}

const getTextTransform = (index, total) => {
  const angle = (index + 0.5) * (360 / total) - 90
  return `rotate(${angle}, 150, 150)`
}

const startPicking = () => {
  activeList.value = [...listArray.value]
  isActive.value = true
  result.value = ''
  currentRotation.value = 0
  spinDuration.value = 0 // 無動畫重置
}

const performPick = () => {
  if (isSpinning.value || activeList.value.length === 0) return
  
  isSpinning.value = true
  result.value = ''
  spinDuration.value = 3 // 設定轉盤動畫時間 3 秒
  
  const total = activeList.value.length
  const winIndex = Math.floor(Math.random() * total)
  const sliceAngle = 360 / total
  
  // 隨機偏移量 (確保指針落在扇形區間 10% ~ 90% 的位置，避免指到線)
  const offset = sliceAngle * (0.1 + Math.random() * 0.8)
  const targetAngle = 360 - (winIndex * sliceAngle + offset)
  
  // 多轉 4~6 圈，增加動畫感
  const spins = (4 + Math.floor(Math.random() * 3)) * 360
  const currentMod = currentRotation.value % 360
  let delta = targetAngle - currentMod
  if (delta < 0) delta += 360
  
  currentRotation.value += delta + spins

  // 動畫結束後觸發
  setTimeout(() => {
    isSpinning.value = false
    result.value = activeList.value[winIndex]
    
    history.addHistory('picker', result.value, {
      list: activeList.value,
      selected: result.value
    })
    window.dispatchEvent(new Event('history-updated'))
  }, spinDuration.value * 1000 + 100) // 稍微多 100ms 緩衝
}

const pickAgain = () => {
  result.value = ''
  performPick()
}

const excludeResult = () => {
  activeList.value = activeList.value.filter(item => item !== result.value)
  result.value = ''
}

const reset = () => {
  inputList.value = ''
  isActive.value = false
  result.value = ''
  activeList.value = []
  currentRotation.value = 0
  spinDuration.value = 0
}

watch(() => props.selectedRecord, (newVal) => {
  if (newVal && newVal.data) {
    activeList.value = newVal.data.list || []
    result.value = newVal.data.selected || ''
    isActive.value = true
  }
})
</script>

<style scoped>
.picker-container {
  max-width: 700px;
  margin: 0 auto;
  background: var(--card-bg);
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border);
}

.picker-container h2 {
  color: #fff;
  margin-top: 0;
}

.config-panel, .active-panel {
  animation: fadeIn 0.3s ease;
}

.textarea-list {
  width: 100%;
  min-height: 150px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: #1a2332;
  color: #fff;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  resize: vertical;
  margin-bottom: 10px;
}

.select-list {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: #1a2332;
  color: #fff;
  font-size: 14px;
  margin-bottom: 10px;
  cursor: pointer;
}

.textarea-list:focus, .select-list:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
}

.button-group {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-disabled {
  background: #4a6fa5 !important;
  cursor: not-allowed !important;
  opacity: 0.6;
}

.item-count {
  margin-top: 15px;
  padding: 10px;
  background: linear-gradient(135deg, rgba(58, 130, 246, 0.1), rgba(16, 185, 129, 0.1));
  border-radius: 8px;
  color: #9ca3af;
  font-size: 14px;
}

.item-list {
  background: linear-gradient(135deg, rgba(58, 130, 246, 0.1), rgba(16, 185, 129, 0.1));
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.item-list-title {
  font-weight: 600;
  color: #e0e0e0;
  margin-bottom: 10px;
}

.item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  max-height: 150px;
  overflow-y: auto;
}

.tag {
  display: inline-block;
  padding: 8px 12px;
  border-radius: 20px;
  color: white;
  font-weight: 600;
  font-size: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.wheel-container {
  position: relative;
  width: 320px;
  height: 320px;
  margin: 40px auto 20px;
}

.pointer {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 20px solid transparent;
  border-right: 20px solid transparent;
  border-top: 40px solid #ef4444;
  z-index: 10;
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));
}

.wheel {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 0 25px rgba(0, 0, 0, 0.5);
  will-change: transform;
}

.result-section {
  animation: slideDown 0.4s ease;
  margin-top: 30px;
}

.result-display {
  font-size: 3em;
  font-weight: 700;
  background: linear-gradient(135deg, #3b82f6, #10b981);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 20px 0;
  padding: 20px;
  border-radius: 8px;
  border: 2px solid #3b82f6;
}

.btn-large {
  padding: 15px 40px !important;
  font-size: 18px !important;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
