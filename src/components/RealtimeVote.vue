<template>
  <div class="card vote-container">
    <h2>📊 {{ isEn ? 'Realtime Vote' : '即時投票系統' }}</h2>

    <!-- 配置面板 -->
    <Transition name="fade">
      <div v-if="!isActive" class="config-panel">
        <h3>{{ isEn ? 'Setup Vote' : '設定投票' }}</h3>

        <label>{{ isEn ? 'Question/Topic:' : '問題/議題：' }}</label>
        <input 
          v-model="question"
          type="text"
          :placeholder="isEn ? 'e.g. Favorite color?' : '例如：你喜歡的顏色是？'"
        >

        <label>{{ isEn ? 'Options (one per line):' : '選項（每行一個）：' }}</label>
        <textarea 
          v-model="optionInput"
          :placeholder="isEn ? 'Red\nBlue\nGreen' : '例如：紅色\n藍色\n綠色\n黃色'"
        ></textarea>

        <div class="hint">💡 {{ isEn ? 'Enter at least 2 options' : '輸入至少 2 個選項' }}</div>

        <div class="option-preview">
          <strong>{{ isEn ? 'Preview:' : '選項預覽：' }}</strong>
          <div class="option-tags">
            <span 
              v-for="(option, idx) in optionArray"
              :key="idx"
              class="option-tag"
              :style="{ backgroundColor: getVoteColor(idx) }"
            >
              {{ option }}
            </span>
          </div>
        </div>

        <div class="button-group">
          <button 
            v-if="optionArray.length >= 2"
            @click="startVoting"
            class="btn-primary"
          >
            {{ isEn ? 'Start Vote' : '開始投票' }} 🗳️
          </button>
          <button 
            v-else
            disabled
            class="btn-disabled"
          >
            {{ isEn ? 'Enter at least 2 options' : '請至少輸入 2 個選項' }}
          </button>
          <button @click="resetConfig" class="btn-secondary">
            {{ isEn ? 'Clear' : '清除' }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- 投票進行中 -->
    <Transition name="fade">
      <div v-if="isActive" class="active-panel">
        <div class="question-display">
          <h3>{{ question || (isEn ? 'Voting...' : '投票中...') }}</h3>
        </div>

        <div class="voting-buttons">
          <button 
            v-for="(option, idx) in options"
            :key="idx"
            @click="vote(idx)"
            :style="{ backgroundColor: getVoteColor(idx) }"
            class="vote-btn"
          >
            <div class="option-name">{{ option }}</div>
            <div class="vote-count">{{ voteResults[idx] }} {{ isEn ? 'Votes' : '票' }}</div>
          </button>
        </div>

        <div class="chart-container">
          <div class="chart-title">{{ isEn ? 'Results' : '投票結果' }}</div>
          <div class="bars">
            <div 
              v-for="(option, idx) in options"
              :key="idx"
              class="bar-item"
            >
              <div class="bar-label">{{ option }}</div>
              <div class="bar-background">
                <div 
                  class="bar-fill"
                  :style="{ 
                    width: getBarWidth(idx) + '%',
                    backgroundColor: getVoteColor(idx)
                  }"
                ></div>
              </div>
              <div class="bar-text">{{ voteResults[idx] }} ({{ getPercentage(idx) }}%)</div>
            </div>
          </div>
        </div>

        <div class="stats">
          <div class="stat-item">
            <strong>{{ isEn ? 'Total Votes' : '總票數' }}</strong><br>{{ totalVotes }}
          </div>
          <div class="stat-item">
            <strong>{{ isEn ? 'Leading' : '領先選項' }}</strong><br>{{ getLeadingOption() }}
          </div>
        </div>

        <div class="button-group">
          <button @click="resetVotes" class="btn-tertiary">
            {{ isEn ? 'Clear Votes' : '清除投票' }}
          </button>
          <button @click="endVoting" class="btn-secondary">
            {{ isEn ? 'End Vote' : '結束投票' }}
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
const question = ref('')
const optionInput = ref('')
const options = ref([])
const voteResults = ref([])
const voteName = ref('')

const history = useHistory()
const i18n = useI18n()
const isEn = computed(() => i18n.locale.value === 'en')

const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#0ea5e9', '#ec4899']

const optionArray = computed(() => {
  return optionInput.value
    .split('\n')
    .map(opt => opt.trim())
    .filter(opt => opt && opt.length > 0)
})

const totalVotes = computed(() => {
  return voteResults.value.reduce((a, b) => a + b, 0)
})

const getVoteColor = (idx) => {
  return colors[idx % colors.length]
}

const vote = (idx) => {
  voteResults.value[idx]++
}

const getBarWidth = (idx) => {
  if (totalVotes.value === 0) return 0
  return (voteResults.value[idx] / totalVotes.value) * 100
}

const getPercentage = (idx) => {
  if (totalVotes.value === 0) return 0
  return Math.round((voteResults.value[idx] / totalVotes.value) * 100)
}

const getLeadingOption = () => {
  if (totalVotes.value === 0) return '-'
  const maxVotes = Math.max(...voteResults.value)
  const leadIdx = voteResults.value.indexOf(maxVotes)
  return options.value[leadIdx] || '-'
}

const startVoting = () => {
  if (optionArray.value.length < 2) {
    alert(isEn.value ? 'Enter at least 2 options' : '請至少輸入 2 個選項')
    return
  }

  if (!question.value.trim()) {
    voteName.value = (isEn.value ? 'Vote_' : '投票_') + new Date().toLocaleString()
  } else {
    voteName.value = question.value
  }
  
  options.value = optionArray.value
  voteResults.value = new Array(options.value.length).fill(0)
  isActive.value = true
}

const resetVotes = () => {
  voteResults.value = new Array(options.value.length).fill(0)
}

const endVoting = () => {
  // 自动保存投票记录
  saveVotingRecord()
  isActive.value = false
}

const saveVotingRecord = () => {
  if (!voteName.value) {
    voteName.value = question.value || ((isEn.value ? 'Vote_' : '投票_') + new Date().toLocaleString())
  }

  const record = {
    question: question.value,
    options: options.value,
    results: JSON.parse(JSON.stringify(voteResults.value)),
    totalVotes: totalVotes.value,
  }

  history.addHistory('vote', voteName.value, record)
  alert(isEn.value ? `Saved vote record: ${voteName.value}` : `已儲存投票紀錄：${voteName.value}`)
  window.dispatchEvent(new Event('history-updated'))
}

const resetConfig = () => {
  question.value = ''
  optionInput.value = ''
  voteName.value = ''
}

watch(() => props.selectedRecord, (newVal) => {
  if (newVal && newVal.data) {
    question.value = newVal.data.question || ''
    options.value = newVal.data.options || []
    voteResults.value = newVal.data.results || []
    voteName.value = newVal.name || ''
    isActive.value = true
  }
}, { immediate: true })

</script>

<style scoped>
.vote-container {
  max-width: 900px;
  margin: 0 auto;
  background: var(--card-bg);
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border);
}

.vote-container h2 {
  color: #fff;
  margin-top: 0;
}

.option-preview {
  margin-top: 20px;
  padding: 15px;
  background: linear-gradient(135deg, rgba(58, 130, 246, 0.1), rgba(16, 185, 129, 0.1));
  border-radius: 8px;
}

.option-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
  justify-content: center;
}

.option-tag {
  padding: 8px 12px;
  border-radius: 8px;
  color: white;
  font-size: 12px;
  font-weight: 600;
}

.question-display {
  background: linear-gradient(135deg, #1f2937, #374151);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  text-align: center;
  border: 1px solid #3b82f6;
}

.question-display h3 {
  color: #e0e0e0;
  font-size: 1.5em;
  margin: 0;
}

.voting-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 30px;
}

.vote-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 110px;
  border: none !important;
  border-radius: 8px !important;
  color: white !important;
  font-weight: 600 !important;
  transition: all 0.3s ease;
  cursor: pointer;
}

.vote-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4) !important;
}

.vote-btn:active {
  transform: scale(0.98);
}

.option-name {
  font-size: 14px;
  margin-bottom: 8px;
}

.vote-count {
  font-size: 20px;
  font-weight: 700;
}

.chart-container {
  background: linear-gradient(135deg, #1f2937, #374151);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #3b82f6;
}

.chart-title {
  font-weight: 700;
  color: #e0e0e0;
  margin-bottom: 20px;
  text-align: center;
}

.bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bar-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.bar-label {
  font-weight: 600;
  color: #9ca3af;
  font-size: 13px;
}

.bar-background {
  width: 100%;
  height: 25px;
  background: #374151;
  border-radius: 8px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 8px;
  transition: width 0.3s ease;
}

.bar-text {
  font-size: 12px;
  color: #6b7280;
}

.stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 20px;
}

.stat-item {
  background: linear-gradient(135deg, #1f2937, #374151);
  border-radius: 8px;
  padding: 15px;
  text-align: center;
  color: #e0e0e0;
  font-size: 14px;
  border: 1px solid #3b82f6;
}

.stat-item strong {
  display: block;
  margin-bottom: 5px;
  color: #3b82f6;
}

.qrcode-container {
  background: linear-gradient(135deg, rgba(58, 130, 246, 0.1), rgba(16, 185, 129, 0.1));
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  text-align: center;
  border: 1px dashed #3b82f6;
}

.qrcode-container h4 {
  color: #e0e0e0;
  margin: 0 0 15px 0;
}

.qrcode-img {
  max-width: 300px;
  width: 100%;
  border-radius: 8px;
  background: white;
  padding: 10px;
}
</style>
