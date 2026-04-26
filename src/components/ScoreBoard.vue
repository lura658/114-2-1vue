<template>
  <div class="scoreboard-container">
    <h2>🏆 {{ isEn ? 'Scoreboard' : '小組競賽記分板' }}</h2>

    <!-- 配置面板 -->
    <Transition name="fade">
      <div v-if="!isActive" class="config-panel">
        <h3>{{ isEn ? 'Setup Teams' : '設定小組' }}</h3>

        <label>{{ isEn ? 'Event Name:' : '活動名稱：' }}</label>
        <input 
          v-model="eventName"
          type="text"
          :placeholder="isEn ? 'Enter Event Name' : '輸入活動名稱'"
        >

        <label>{{ isEn ? 'Number of Teams:' : '小組數量：' }}</label>
        <div class="input-group">
          <button @click="teamCount = Math.max(1, teamCount - 1)" class="btn-count">−</button>
          <input type="number" v-model.number="teamCount" min="1" max="12">
          <button @click="teamCount = Math.min(12, teamCount + 1)" class="btn-count">+</button>
        </div>

        <label>{{ isEn ? 'Team Names (one per line):' : '小組名稱（每行一個）：' }}</label>
        <textarea 
          v-model="teamNames"
          :placeholder="isEn ? 'e.g. Team 1\nTeam 2' : '例如：組別1\n組別2\n組別3'"
        ></textarea>

        <div class="hint">💡 {{ isEn ? 'Enter team names or use defaults' : '輸入小組名稱，或使用預設的組別編號' }}</div>

        <div class="button-group">
          <button @click="startGame" class="btn-primary">
            {{ isEn ? 'Start' : '開始計分' }} 🎯
          </button>
          <button @click="resetConfig" class="btn-secondary">
            {{ isEn ? 'Reset' : '重置' }}
          </button>
        </div>

        <div class="team-preview">
          <strong>{{ isEn ? 'Preview:' : '預覽：' }}</strong>
          <div class="preview-tags">
            <span 
              v-for="(name, idx) in previewTeams" 
              :key="idx"
              class="preview-tag"
              :style="{ backgroundColor: teamColors[idx % teamColors.length] }"
            >
              {{ name }} - 0
            </span>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 計分進行中 -->
    <Transition name="fade">
      <div v-if="isActive" class="active-panel">
        <div class="scoreboard">
          <div 
            v-for="(team, idx) in teams" 
            :key="team.id"
            class="team-card"
            :style="{ borderColor: team.color }"
            :class="{ 'is-leading': isLeading(team.id), 'is-animating': isAnimating(team.id) }"
          >
            <div class="team-rank">
              {{ getRank(team.id) }}
            </div>
            <div class="team-name">{{ team.name }}</div>
            <div class="team-score" :class="{ 'score-flash': isAnimating(team.id) }">{{ team.score }}</div>

            <!-- 浮動文字動畫 -->
            <div v-if="floatingTexts[team.id]" class="floating-text-container">
              <span 
                v-for="float in floatingTexts[team.id]"
                :key="float.id"
                class="floating-text"
                :style="{ color: float.color }"
              >
                {{ float.text }}
              </span>
            </div>

            <div class="button-group score-buttons">
              <button @click="updateScore(team.id, -5)" class="btn-small btn-secondary">−5</button>
              <button @click="updateScore(team.id, -1)" class="btn-small btn-secondary">−1</button>
              <button @click="updateScore(team.id, 1)" class="btn-small btn-primary">+1</button>
              <button @click="updateScore(team.id, 5)" class="btn-small btn-primary">+5</button>
            </div>

            <input 
              type="number" 
              v-model.number="team.score"
              class="score-input"
              @change="delayedSort"
            >
          </div>
        </div>

        <div class="button-group">
          <button @click="isActive = false" class="btn-secondary">
            {{ isEn ? 'Back to Setup' : '返回設定' }}
          </button>
          <button @click="resetScores" class="btn-tertiary">
            {{ isEn ? 'Clear Scores' : '清除分數' }}
          </button>
          <button @click="saveRecord" class="btn-primary">
            {{ isEn ? 'Save Record' : '儲存紀錄' }} 💾
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

const isActive = ref(false)
const teamCount = ref(2)
const eventName = ref('')
const teamNames = ref('')
const teams = ref([])
const floatingTexts = ref({}) // 存储浮动文字动画
const animatingTeams = ref(new Set()) // 存储正在动画的队伍

const history = useHistory()
const i18n = useI18n()
const isEn = computed(() => i18n.locale.value === 'en')

const teamColors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#06b6d4', '#8b5cf6', '#0ea5e9', '#10b981', '#6366f1', '#8b5cf6']

const previewTeams = computed(() => {
  if (teamNames.value.trim()) {
    return teamNames.value
      .split('\n')
      .map(name => name.trim())
      .filter(name => name)
      .slice(0, teamCount.value)
  }
  return Array.from({ length: teamCount.value }, (_, i) => isEn.value ? `Team ${i + 1}` : `組別 ${i + 1}`)
})

const startGame = () => {
  const names = teamNames.value.trim()
    ? teamNames.value
        .split('\n')
        .map(name => name.trim())
        .filter(name => name)
    : Array.from({ length: teamCount.value }, (_, i) => isEn.value ? `Team ${i + 1}` : `組別 ${i + 1}`)

  const baseId = Date.now() * 1000 // 乘以1000確保id唯一且間距夠大
  teams.value = names.slice(0, teamCount.value).map((name, i) => ({
    id: baseId + i, // 加入唯一ID確保排序不出錯
    name,
    score: 0,
    color: teamColors[i % teamColors.length],
    originalIndex: i // 記錄原始索引
  }))

  isActive.value = true
  floatingTexts.value = {} // 清空浮動文字
  animatingTeams.value.clear() // 清空動畫狀態
  saveData()
}

const resetConfig = () => {
  teamCount.value = 2
  eventName.value = ''
  teamNames.value = ''
}

// 延遲排序機制：避免連續點擊加分時卡片亂跳導致誤觸
let sortTimeout = null
const delayedSort = () => {
  saveData()
  clearTimeout(sortTimeout)
  sortTimeout = setTimeout(() => {
    teams.value.sort((a, b) => b.score - a.score)
  }, 800) // 停止點擊後 0.8 秒才重新排序
}

const updateScore = (id, val) => {
  const team = teams.value.find(t => t.id === id)
  if (!team) return
  
  team.score = Math.max(0, team.score + val)
  
  // 添加动画效果
  animatingTeams.value.add(id)
  setTimeout(() => animatingTeams.value.delete(id), 600)
  
  // 添加浮动文字
  const textColor = val > 0 ? '#10b981' : '#ef4444'
  const textContent = (val > 0 ? '+' : '') + val
  if (!floatingTexts.value[id]) {
    floatingTexts.value[id] = []
  }
  const textId = Date.now() + Math.random()
  floatingTexts.value[id].push({ id: textId, text: textContent, color: textColor })
  setTimeout(() => {
    floatingTexts.value[id] = floatingTexts.value[id].filter(t => t.id !== textId)
  }, 1500)
  
  // 觸發延遲排序
  delayedSort()
}

const getRank = (id) => {
  const team = teams.value.find(t => t.id === id)
  if (!team) return ''
  const scores = teams.value.map(t => t.score)
  const rank = scores.filter(s => s > team.score).length + 1
  const rankIcons = ['🥇', '🥈', '🥉']
  return rankIcons[rank - 1] || `#${rank}`
}

const isLeading = (id) => {
  const team = teams.value.find(t => t.id === id)
  return team && teams.value[0].id === id && team.score > 0
}

const isAnimating = (id) => {
  return animatingTeams.value.has(id)
}

const resetScores = () => {
  teams.value.forEach(team => (team.score = 0))
  teams.value.sort((a, b) => b.score - a.score)
  saveData()
}

const saveRecord = () => {
  if (!eventName.value.trim()) {
    alert(isEn.value ? 'Please enter event name' : '請輸入活動名稱')
    return
  }
  
  history.addHistory('scoreboard', eventName.value, {
    teams: JSON.parse(JSON.stringify(teams.value))
  })
  
  alert(isEn.value ? `Saved record: "${eventName.value}"` : `已儲存 "${eventName.value}" 的紀錄`)
  localStorage.removeItem('scoreboard')
  
  // 觸發全局紀錄更新，且不強制離開進行中畫面
  window.dispatchEvent(new Event('history-updated'))
}

const saveData = () => {
  // 保存到本地存儲（临时)
  localStorage.setItem('scoreboard', JSON.stringify(teams.value))
}

watch(() => props.selectedRecord, (newVal) => {
  if (newVal && newVal.data) {
    teams.value = (newVal.data.teams || []).map((t, i) => ({
      ...t,
      id: t.id || Date.now() + i,
      color: t.color || teamColors[i % teamColors.length]
    }))
    eventName.value = newVal.name || ''
    isActive.value = true
  }
}, { immediate: true })

</script>

<style scoped>
.scoreboard-container {
  max-width: 1400px;
  margin: 0 auto;
  background: var(--card-bg);
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border);
}

.scoreboard-container h2 {
  color: #fff;
  margin-top: 0;
}

.team-preview {
  margin-top: 20px;
  padding: 15px;
  background: linear-gradient(135deg, rgba(58, 130, 246, 0.1), rgba(16, 185, 129, 0.1));
  border-radius: 8px;
}

.preview-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
  justify-content: center;
  max-height: 200px;
  overflow-y: auto;
}

.preview-tag {
  padding: 8px 12px;
  border-radius: 8px;
  color: white;
  font-size: 12px;
  font-weight: 600;
}

.input-group {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.input-group input {
  width: 80px;
  font-size: 18px;
  text-align: center;
}

.btn-count {
  width: 40px;
  height: 40px;
  padding: 0 !important;
  font-size: 18px !important;
  background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
  border-radius: 50% !important;
}

.scoreboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 15px;
  margin: 30px 0;
}

.team-card {
  background: linear-gradient(135deg, #2a3f5f, #1f2937);
  border: 2px solid;
  border-radius: 12px;
  padding: 15px;
  text-align: center;
  position: relative;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.team-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
}

.team-card.is-leading {
  transform: scale(1.05);
  box-shadow: 0 8px 30px rgba(59, 130, 246, 0.5);
}

.team-rank {
  position: absolute;
  top: 8px;
  right: 12px;
  font-size: 20px;
}

.team-name {
  font-size: 14px;
  font-weight: 700;
  color: #e0e0e0;
  margin-bottom: 8px;
  word-break: break-word;
}

.team-score {
  font-size: 2.5em;
  font-weight: 700;
  background: linear-gradient(135deg, #3b82f6, #10b981);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 10px 0;
  position: relative;
}

.team-score.score-flash {
  animation: scoreFlash 0.6s ease;
}

@keyframes scoreFlash {
  0%, 100% {
    color: #fff;
    transform: scale(1);
  }
  25% {
    color: #10b981;
    transform: scale(1.1);
  }
  50% {
    color: #fff;
    transform: scale(1.05);
  }
  75% {
    color: #10b981;
    transform: scale(1.1);
  }
}

.floating-text-container {
  position: absolute;
  top: 50%;
  right: 15%;
  pointer-events: none;
}

.floating-text {
  position: absolute;
  font-size: 1.2em;
  font-weight: 700;
  animation: floatUp 1.5s ease-out forwards;
  opacity: 1;
}

@keyframes floatUp {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-60px) scale(0.8);
  }
}

.score-buttons {
  margin: 10px 0;
  gap: 5px !important;
}

.btn-small {
  padding: 6px 10px !important;
  font-size: 11px !important;
  border-radius: 6px !important;
}

.score-input {
  width: 100%;
  font-size: 16px;
  text-align: center;
  padding: 8px !important;
  border: 2px solid #3b82f6 !important;
  border-radius: 6px !important;
}

@media (max-width: 768px) {
  .scoreboard {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 10px;
  }

  .team-card {
    padding: 12px;
  }

  .team-score {
    font-size: 2em;
  }

  .btn-small {
    padding: 5px 8px !important;
    font-size: 10px !important;
  }
}
</style>
