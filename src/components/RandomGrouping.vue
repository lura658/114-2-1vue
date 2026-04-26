<template>
  <div class="grouping-container">
    <h2>👥 {{ isEn ? 'Random Grouping' : '隨機分組' }}</h2>

    <!-- 配置面板 -->
    <Transition name="fade">
      <div v-if="!groupsCreated" class="config-panel">
        <h3>{{ isEn ? 'Setup' : '設定分組' }}</h3>

        <!-- 活動名稱 -->
        <label>{{ isEn ? 'Event Name (Optional):' : '活動名稱（選填）：' }}</label>
        <input 
          v-model="eventName"
          type="text"
          :placeholder="isEn ? 'e.g. Science Project' : '例如：自然科報告分組'"
          class="input-name"
        >

        <!-- 輸入名單 -->
        <label>{{ isEn ? 'Member List (one per line):' : '成員名單（每行一個）：' }}</label>
        <textarea 
          v-model="memberList"
          :placeholder="isEn ? 'e.g. Alice\nBob\nCharlie\nDiana' : '例如：Alice\nBob\nCharlie\nDiana'"
          class="textarea-members"
        ></textarea>

        <select v-if="savedLists.length > 0" v-model="selectedList" @change="loadList" class="select-list">
          <option value="">-- {{ isEn ? 'Select a saved list' : '選擇已建立名單' }} --</option>
          <option v-for="list in savedLists" :key="list.id" :value="list.id">
            {{ list.name }} ({{ list.members.length }} {{ isEn ? 'members' : '人' }})
          </option>
        </select>

        <div class="hint">💡 {{ isEn ? 'Total members: ' : '總人數：' }}{{ members.length }}</div>

        <!-- 設定每組人數 -->
        <label>{{ isEn ? 'Members per group:' : '每組人數：' }}</label>
        <div class="input-group">
          <button @click="membersPerGroup = Math.max(1, membersPerGroup - 1)" class="btn-count">−</button>
          <input type="number" v-model.number="membersPerGroup" min="1" max="50">
          <button @click="membersPerGroup = Math.min(members.length, membersPerGroup + 1)" class="btn-count">+</button>
        </div>

        <!-- 估算分組數 -->
        <div class="estimate" v-if="members.length > 0">
          <p>{{ isEn ? 'Estimated Groups: ' : '預期組數：' }}{{ Math.ceil(members.length / membersPerGroup) }}</p>
          
          <div v-if="cannotDivideEvenly" class="warning-box">
            <p class="warning">⚠️ {{ isEn ? 'Cannot divide evenly. Please choose how to distribute:' : '無法完全平均分組，請選擇分配方式：' }}</p>
            <div class="radio-options">
              <label class="radio-label" v-if="members.length >= membersPerGroup">
                <input type="radio" v-model="selectedOption" value="increase">
                <span class="radio-text">{{ isEn ? 'Increase some groups' : '部分組別人數加一' }}</span>
                <span class="calc-hint">({{ calculateIncreaseGroups() }})</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="selectedOption" value="decrease">
                <span class="radio-text">{{ isEn ? 'Decrease some groups' : '部分組別人數減一' }}</span>
                <span class="calc-hint">({{ calculateDecreaseGroups() }})</span>
              </label>
            </div>
          </div>
        </div>

        <div class="button-group">
          <button @click="performGrouping" class="btn-primary" :disabled="members.length === 0">
            {{ isEn ? 'Create Groups' : '建立分組' }} 👥
          </button>
          <button @click="resetConfig" class="btn-secondary">
            {{ isEn ? 'Clear' : '清空' }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- 分組結果 -->
    <Transition name="fade">
      <div v-if="groupsCreated" class="results-panel">
        <h3>{{ isEn ? 'Groups Created' : '分組結果' }}</h3>

        <div class="groups-grid">
          <div 
            v-for="(group, idx) in finalGroups" 
            :key="idx"
            class="group-card"
          >
            <div class="group-number">{{ isEn ? 'Group' : '第' }} {{ idx + 1 }}</div>
            <div class="group-members">
              <div v-for="(member, mIdx) in group" :key="mIdx" class="member-tag">
                {{ member }}
              </div>
            </div>
            <div class="group-count">{{ group.length }} {{ isEn ? 'members' : '人' }}</div>
          </div>
        </div>

        <div class="button-group">
          <button @click="resetGrouping" class="btn-secondary">
            {{ isEn ? 'Regroup' : '重新分組' }}
          </button>
          <button @click="saveGrouping" class="btn-primary">
            {{ isEn ? 'Save' : '儲存' }} 💾
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

const eventName = ref('')
const memberList = ref('')
const membersPerGroup = ref(2)
const groupsCreated = ref(false)
const selectedOption = ref(null)
const finalGroups = ref([])
const savedLists = ref(JSON.parse(localStorage.getItem('memberLists')) || [])
const selectedList = ref('')

const history = useHistory()
const i18n = useI18n()
const isEn = computed(() => i18n.locale.value === 'en')

const members = computed(() => {
  return memberList.value
    .split('\n')
    .map(m => m.trim())
    .filter(m => m)
})

const cannotDivideEvenly = computed(() => {
  return members.value.length > 0 && members.value.length % membersPerGroup.value !== 0
})

watch([members, membersPerGroup], () => {
  if (!cannotDivideEvenly.value) {
    selectedOption.value = null
  } else {
    if (selectedOption.value === 'increase' && members.value.length < membersPerGroup.value) {
      selectedOption.value = 'decrease'
    }
  }
})

const loadList = () => {
  if (selectedList.value) {
    const list = savedLists.value.find(l => l.id === selectedList.value)
    if (list) {
      memberList.value = list.members.join('\n')
    }
  }
}

const formatDistribution = (countBase, baseSize, countPlus) => {
  let res = ''
  if (countBase > 0) {
    res += isEn.value ? `${countBase} group(s) of ${baseSize}` : `${countBase} 組 ${baseSize} 人`
  }
  if (countPlus > 0) {
    res += (res ? ' + ' : '') + (isEn.value ? `${countPlus} group(s) of ${baseSize + 1}` : `${countPlus} 組 ${baseSize + 1} 人`)
  }
  return res
}

const calculateIncreaseGroups = () => {
  if (members.value.length === 0) return ''
  const total = members.value.length
  const G = Math.floor(total / membersPerGroup.value)
  if (G === 0) return ''
  const baseSize = Math.floor(total / G)
  const countPlus = total % G
  const countBase = G - countPlus
  return formatDistribution(countBase, baseSize, countPlus)
}

const calculateDecreaseGroups = () => {
  if (members.value.length === 0) return ''
  const total = members.value.length
  const G = Math.ceil(total / membersPerGroup.value)
  if (G === 0) return ''
  const baseSize = Math.floor(total / G)
  const countPlus = total % G
  const countBase = G - countPlus
  return formatDistribution(countBase, baseSize, countPlus)
}

const performGrouping = () => {
  if (members.value.length === 0) return

  if (cannotDivideEvenly.value && !selectedOption.value) {
    alert(isEn.value ? 'Please select a distribution option below.' : '請在下方勾選分配方式')
    return
  }
  
  createGroups()
}

const createGroups = () => {
  const shuffled = [...members.value].sort(() => Math.random() - 0.5)
  const groups = []
  const total = shuffled.length

  let G = 0
  if (cannotDivideEvenly.value) {
    if (selectedOption.value === 'increase') {
      G = Math.floor(total / membersPerGroup.value)
    } else if (selectedOption.value === 'decrease') {
      G = Math.ceil(total / membersPerGroup.value)
    }
  } else {
    G = total / membersPerGroup.value
  }

  if (G === 0) G = 1 // fallback

  const baseSize = Math.floor(total / G)
  const countPlus = total % G
  const countBase = G - countPlus
  
  let index = 0
  for (let i = 0; i < G; i++) {
    const size = i < countBase ? baseSize : baseSize + 1
    groups.push(shuffled.slice(index, index + size))
    index += size
  }

  finalGroups.value = groups
  groupsCreated.value = true
}

const resetGrouping = () => {
  groupsCreated.value = false
  finalGroups.value = []
}

const resetConfig = () => {
  eventName.value = ''
  memberList.value = ''
  membersPerGroup.value = 2
  groupsCreated.value = false
  selectedOption.value = null
  finalGroups.value = []
}

const saveGrouping = () => {
  const defaultName = `${isEn.value ? 'Random Groups' : '隨機分組'} - ${new Date().toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`
  const groupName = eventName.value.trim() ? eventName.value.trim() : defaultName
  history.addHistory('grouping', groupName, {
    groups: finalGroups.value,
    totalMembers: members.value.length,
    membersPerGroup: membersPerGroup.value,
    eventName: eventName.value.trim()
  })
  alert(isEn.value ? `Groups saved as "${groupName}"` : `已儲存為 "${groupName}"`)
  resetConfig()
}
</script>

<style scoped>
.grouping-container {
  max-width: 1000px;
  margin: 0 auto;
  background: var(--card-bg);
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border);
}

.grouping-container h2 {
  color: #fff;
  margin-top: 0;
}

.config-panel, .options-panel, .results-panel {
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.input-name {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: #1a2332;
  color: #fff;
  font-size: 14px;
  margin-bottom: 15px;
}

.input-name:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
}

.textarea-members {
  width: 100%;
  min-height: 200px;
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

.textarea-members:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
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

.select-list:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
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
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: #1a2332;
  color: #fff;
}

.btn-count {
  width: 40px;
  height: 40px;
  padding: 0 !important;
  font-size: 18px !important;
  background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
  border-radius: 50% !important;
}

.hint {
  color: #9ca3af;
  font-size: 14px;
  margin-bottom: 15px;
}

.estimate {
  background: rgba(58, 130, 246, 0.1);
  border-left: 4px solid #3b82f6;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 15px;
  color: #e0e0e0;
}

.estimate p {
  margin: 5px 0;
  font-size: 14px;
}

.estimate .warning {
  color: #fbbf24;
}

.options-panel {
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.5), rgba(31, 41, 55, 0.5));
  border: 2px solid #f59e0b;
  border-radius: 12px;
  padding: 25px;
}

.options-panel h3 {
  color: #fbbf24;
  margin-top: 0;
}

.message {
  color: #e0e0e0;
  font-size: 15px;
  margin: 15px 0;
  line-height: 1.5;
}

.option-details {
  background: rgba(0, 0, 0, 0.3);
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.detail {
  color: #d1d5db;
  font-size: 14px;
  margin: 8px 0;
}

.detail.warning {
  color: #fca5a5;
}

.options-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 15px;
}

.btn-option {
  background: linear-gradient(135deg, #374151, #1f2937);
  border: 2px solid #4b5563;
  border-radius: 10px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #fff;
}

.btn-option:hover {
  border-color: #3b82f6;
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
  background: linear-gradient(135deg, #2d3748, #1a202c);
}

.option-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
  color: #fff;
}

.option-desc {
  font-size: 13px;
  color: #9ca3af;
  margin-bottom: 10px;
}

.option-calc {
  font-size: 14px;
  color: #10b981;
  font-family: 'Courier New', monospace;
  font-weight: 600;
}

.results-panel {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(59, 130, 246, 0.1));
  border: 2px solid #10b981;
  border-radius: 12px;
  padding: 25px;
}

.results-panel h3 {
  color: #10b981;
  margin-top: 0;
}

.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.group-card {
  background: linear-gradient(135deg, #2a3f5f, #1f2937);
  border: 2px solid #10b981;
  border-radius: 10px;
  padding: 15px;
  text-align: center;
}

.group-number {
  font-size: 14px;
  color: #9ca3af;
  font-weight: 600;
  margin-bottom: 10px;
}

.group-members {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.member-tag {
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid #3b82f6;
  border-radius: 6px;
  padding: 8px;
  color: #e0e0e0;
  font-size: 13px;
  word-break: break-word;
}

.group-count {
  font-size: 12px;
  color: #10b981;
  font-weight: 600;
}

.button-group {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 20px;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
