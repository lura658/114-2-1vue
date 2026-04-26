<template>
  <div class="card quiz-container">
    <h2>📝 {{ isEn ? 'Digital Quiz' : '數位測驗系統' }}</h2>

    <!-- 配置面板 -->
    <Transition name="fade">
      <div v-if="!isActive" class="config-panel">
        <h3>{{ isEn ? 'Create Quiz' : '建立測驗' }}</h3>

        <div class="question-form">
          <label>{{ isEn ? 'Title:' : '標題：' }}</label>
          <input 
            v-model="quizTitle"
            type="text"
            :placeholder="isEn ? 'e.g. Science Final' : '例如：地球科學期末考'"
          >

          <label>{{ isEn ? 'Add Question:' : '添加題目：' }}</label>
          <div class="form-group">
            <label>{{ isEn ? 'Question:' : '題目文字：' }}</label>
            <input 
              v-model="newQuestion.text"
              type="text"
              :placeholder="isEn ? 'Enter question' : '請輸入題目'"
            >

            <label>{{ isEn ? 'Type:' : '題型：' }}</label>
            <select v-model="newQuestion.type">
              <option value="single">{{ isEn ? 'Single Choice' : '單選題' }}</option>
              <option value="multiple">{{ isEn ? 'Multiple Choice' : '複選題' }}</option>
              <option value="truefalse">{{ isEn ? 'True/False' : '是非題' }}</option>
            </select>

            <label>{{ isEn ? 'Options (one per line):' : '選項（每行一個）：' }}</label>
            <textarea 
              v-model="newQuestion.optionText"
              :placeholder="isEn ? 'Option A\nOption B' : 'A. 選項1\nB. 選項2\nC. 選項3'"
            ></textarea>

            <label v-if="newQuestion.type !== 'truefalse'">{{ isEn ? 'Correct Answer:' : '正確答案：' }}</label>
            <input 
              v-if="newQuestion.type !== 'truefalse'"
              v-model="newQuestion.answer"
              type="text"
              :placeholder="isEn ? 'e.g. A or A,B' : '例如：A 或 A,B（複選用逗號）'"
            >
            <select v-else v-model="newQuestion.answer">
              <option value="">{{ isEn ? 'Select' : '請選擇' }}</option>
              <option value="是">{{ isEn ? 'True' : '是' }}</option>
              <option value="否">{{ isEn ? 'False' : '否' }}</option>
            </select>

            <label>{{ isEn ? 'Explanation (Optional):' : '解析（非必填）：' }}</label>
            <textarea 
              v-model="newQuestion.explanation"
              :placeholder="isEn ? 'Enter explanation' : '輸入題目解析'"
            ></textarea>

            <button @click="addQuestion" class="btn-success">
              ➕ {{ isEn ? 'Add Question' : '添加此題' }}
            </button>
          </div>
        </div>

        <div v-if="questions.length > 0" class="question-list">
          <h4>{{ isEn ? `Added ${questions.length} questions` : `已添加 ${questions.length} 題` }}</h4>
          <div v-for="(q, idx) in questions" :key="idx" class="question-item">
            <span>{{ idx + 1 }}. {{ q.text.substring(0, 30) }}...</span>
            <button @click="deleteQuestion(idx)" class="btn-delete">✕</button>
          </div>
        </div>

        <div class="button-group">
          <button 
            v-if="questions.length > 0"
            @click="startQuiz"
            class="btn-primary btn-large"
          >
            {{ isEn ? 'Start Quiz' : '開始測驗' }} ✅
          </button>
          <button 
            v-else
            disabled
            class="btn-disabled"
          >
            {{ isEn ? 'Add at least 1 question' : '請至少添加 1 題' }}
          </button>
          <button @click="resetQuiz" class="btn-secondary">
            {{ isEn ? 'Clear All' : '清除所有' }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- 測驗前姓名輸入 -->
    <Transition name="fade">
      <div v-if="isActive && !showResult && currentQuestionIdx === -1" class="name-input-panel">
        <h3>{{ isEn ? 'Enter Participant Name' : '輸入測驗人姓名' }}</h3>
        <div class="form-group">
          <label>{{ isEn ? 'Name:' : '姓名：' }}</label>
          <input 
            v-model="participantName"
            type="text"
            :placeholder="isEn ? 'Enter your name' : '請輸入你的姓名'"
            @keyup.enter="startAnswering"
          >
        </div>

        <div class="button-group">
          <button @click="startAnswering" class="btn-primary btn-large">
            {{ isEn ? 'Start Answering' : '開始答題' }}
          </button>
          <button @click="isActive = false" class="btn-secondary">
            {{ isEn ? 'Back' : '返回' }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- 測驗進行中 -->
    <Transition name="fade">
      <div v-if="isActive && !showResult && currentQuestionIdx >= 0" class="active-panel">
        <div class="quiz-header">
          <h3 v-if="quizTitle">{{ quizTitle }}</h3>
          <div class="progress-info">
            {{ isEn ? `Question ${currentQuestionIdx + 1} / ${questions.length}` : `第 ${currentQuestionIdx + 1} / ${questions.length} 題` }}
            <div class="progress-bar">
              <div class="progress" :style="{ width: getProgress() + '%' }"></div>
            </div>
          </div>
        </div>

        <div class="question-box">
          <div class="question-number">{{ isEn ? 'Question' : '題目' }} {{ currentQuestionIdx + 1 }}</div>
          <h3 class="question-text">{{ currentQuestion.text }}</h3>

          <div :class="['options', currentQuestion.type]">
            <label 
              v-for="(option, idx) in currentQuestion.options"
              :key="idx"
              class="option"
            >
              <input 
                v-if="currentQuestion.type === 'single'"
                type="radio"
                :name="`q${currentQuestionIdx}`"
                :value="option"
                v-model="answers[currentQuestionIdx]"
              >
              <input 
                v-else
                type="checkbox"
                :value="option"
                @change="updateMultipleChoice(currentQuestionIdx, option)"
              >
              <span class="option-text">{{ option }}</span>
            </label>
          </div>
        </div>

        <div class="button-group">
          <button 
            @click="previousQuestion"
            :disabled="currentQuestionIdx === 0"
            class="btn-secondary"
          >
            ⬅️ {{ isEn ? 'Previous' : '上一題' }}
          </button>
          <button 
            v-if="currentQuestionIdx < questions.length - 1"
            @click="nextQuestion"
            class="btn-primary"
          >
            {{ isEn ? 'Next' : '下一題' }} ➡️
          </button>
          <button 
            v-else
            @click="submitQuiz"
            class="btn-success"
          >
            {{ isEn ? 'Submit' : '提交並批卷' }} ✅
          </button>
        </div>
      </div>
    </Transition>

    <!-- 結果頁面 -->
    <Transition name="fade">
      <div v-if="showResult" class="result-panel">
        <!-- 多人統計 -->
        <div v-if="allParticipants.length > 0" class="statistics-panel">
          <h3>{{ isEn ? 'Quiz Statistics' : '測驗統計' }}</h3>
          
          <!-- 分數分佈 -->
          <div class="distribution-section">
            <h4>{{ isEn ? 'Score Distribution' : '分數分佈' }}</h4>
            <div class="distribution-chart">
              <div v-for="(count, range) in scoreDistribution" :key="range" class="distribution-bar">
                <div class="bar-label">{{ range }}%</div>
                <div class="bar-container">
                  <div 
                    class="bar-fill" 
                    :style="{ 
                      width: (count / allParticipants.length) * 100 + '%',
                      backgroundColor: getScoreColor(parseInt(range))
                    }"
                  >
                    {{ count }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 各題答對率 -->
          <div class="correct-rate-section">
            <h4>{{ isEn ? 'Question Correct Rate' : '各題答對率' }}</h4>
            <div class="correct-rate-chart">
              <div v-for="qr in questionCorrectRates" :key="qr.questionNum" class="rate-item">
                <div class="rate-label">{{ isEn ? 'Q' : '題' }}{{ qr.questionNum }}</div>
                <div class="rate-bar">
                  <div 
                    class="rate-fill"
                    :style="{ width: qr.rate + '%' }"
                  ></div>
                </div>
                <div class="rate-text">{{ qr.correctCount }}/{{ qr.totalCount }} ({{ Math.round(qr.rate) }}%)</div>
              </div>
            </div>
          </div>

          <!-- 參與者列表 -->
          <div class="participants-section">
            <h4>{{ isEn ? 'Participants' : '參與者結果' }}</h4>
            <div class="participants-list">
              <div v-for="(p, idx) in allParticipants" :key="idx" class="participant-item">
                <div class="participant-name">{{ p.name }}</div>
                <div class="participant-score">
                  {{ Math.round((p.score / questions.length) * 100) }}% 
                  ({{ p.score }}/{{ questions.length }})
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 單人結果 -->
        <div v-else class="score-display">
          <div class="score-label">{{ isEn ? 'Quiz Result' : '測驗結果' }}</div>
          <div class="score-value">{{ Math.round((score / questions.length) * 100) }}%</div>
          <div class="score-detail">{{ score }} / {{ questions.length }} {{ isEn ? 'Correct' : '題正確' }}</div>
        </div>

        <div class="results-review">
          <h3>{{ isEn ? 'Details' : '答題詳情' }}</h3>
          <div 
            v-for="(q, idx) in questions"
            :key="idx"
            :class="['result-item', getAnswerStatus(idx)]"
          >
            <div class="result-header">
              <span class="result-icon">{{ getAnswerStatus(idx) === 'correct' ? '✅' : '❌' }}</span>
              <span class="result-number">{{ isEn ? 'Question' : '題目' }} {{ idx + 1 }}</span>
            </div>
            <p class="result-question">{{ q.text }}</p>
            <div class="result-info">
              <div><strong>{{ isEn ? 'Your Answer:' : '你的答案：' }}</strong> {{ answers[idx] || (isEn ? 'Not answered' : '未作答') }}</div>
              <div><strong>{{ isEn ? 'Correct Answer:' : '正確答案：' }}</strong> {{ q.answer }}</div>
            </div>
            <div v-if="q.explanation" class="result-explanation">
              <strong>{{ isEn ? 'Explanation:' : '解析：' }}</strong> {{ q.explanation }}
            </div>
          </div>
        </div>

        <div class="button-group">
          <button @click="saveQuizResult" class="btn-primary btn-large">
            {{ isEn ? 'Save Result' : '儲存結果' }} 💾
          </button>
          <button @click="retakeQuiz" class="btn-success">
            {{ isEn ? 'Another Participant' : '新參與者重新作答' }} ➕
          </button>
          <button @click="isActive = false" class="btn-secondary">
            {{ isEn ? 'Back to Edit' : '返回編輯' }}
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
const showResult = ref(false)
const quizTitle = ref('')
const questions = ref([])
const currentQuestionIdx = ref(-1)
const answers = ref({})
const score = ref(0)
const participantName = ref('')

const history = useHistory()
const i18n = useI18n()
const isEn = computed(() => i18n.locale.value === 'en')

const newQuestion = ref({
  text: '',
  type: 'single',
  optionText: '',
  answer: '',
  explanation: ''
})

const currentQuestion = computed(() => {
  return questions.value[currentQuestionIdx.value]
})

const addQuestion = () => {
  if (!newQuestion.value.text.trim()) {
    alert(isEn.value ? 'Enter question' : '請輸入題目')
    return
  }

  let options = []
  if (newQuestion.value.type !== 'truefalse') {
    options = newQuestion.value.optionText
      .split('\n')
      .map(opt => opt.trim())
      .filter(opt => opt)
  } else {
    options = isEn.value ? ['True', 'False'] : ['是', '否']
  }

  if (options.length === 0 && newQuestion.value.type !== 'truefalse') {
    alert(isEn.value ? 'Enter options' : '請輸入選項')
    return
  }

  if (!newQuestion.value.answer.trim()) {
    alert(isEn.value ? 'Enter correct answer' : '請輸入正確答案')
    return
  }

  questions.value.push({
    text: newQuestion.value.text,
    type: newQuestion.value.type,
    options: options,
    answer: newQuestion.value.answer,
    explanation: newQuestion.value.explanation
  })

  newQuestion.value = {
    text: '',
    type: 'single',
    optionText: '',
    answer: '',
    explanation: ''
  }
}

const deleteQuestion = (idx) => {
  questions.value.splice(idx, 1)
}

const startQuiz = () => {
  participantName.value = ''
  isActive.value = true
  showResult.value = false
}

const startAnswering = () => {
  if (!participantName.value.trim()) {
    alert(isEn.value ? 'Enter name' : '請輸入姓名')
    return
  }
  currentQuestionIdx.value = 0
  answers.value = {}
}

const nextQuestion = () => {
  if (currentQuestionIdx.value < questions.value.length - 1) {
    currentQuestionIdx.value++
  }
}

const previousQuestion = () => {
  if (currentQuestionIdx.value > 0) {
    currentQuestionIdx.value--
  }
}

const updateMultipleChoice = (qIdx, option) => {
  if (!answers.value[qIdx]) {
    answers.value[qIdx] = ''
  }
  const current = answers.value[qIdx].split(',').filter(a => a.trim())
  const idx = current.indexOf(option)
  if (idx > -1) {
    current.splice(idx, 1)
  } else {
    current.push(option)
  }
  answers.value[qIdx] = current.join(',')
}

const submitQuiz = () => {
  let correctCount = 0
  questions.value.forEach((q, idx) => {
    if (getAnswerStatus(idx) === 'correct') {
      correctCount++
    }
  })
  score.value = correctCount
  showResult.value = true
}

const saveQuizResult = () => {
  const quizKey = quizTitle.value || (isEn.value ? `Quiz` : `測驗`)
  
  // 首先檢查是否已有該測驗的記錄
  const existingQuizzes = history.histories.value?.quiz || []
  let quizRecord = existingQuizzes.find(r => r.data?.title === quizTitle.value)
  
  if (!quizRecord) {
    // 建立新的測驗記錄
    const recordData = {
      title: quizTitle.value,
      questions: questions.value,
      participants: [{
        name: participantName.value,
        score: score.value,
        answers: JSON.parse(JSON.stringify(answers.value))
      }],
      createdAt: new Date().toLocaleString('zh-TW')
    }
    
    history.addHistory('quiz', quizKey, recordData)
  } else {
    // 在現有測驗中添加新參與者
    const participant = {
      name: participantName.value,
      score: score.value,
      answers: JSON.parse(JSON.stringify(answers.value))
    }
    quizRecord.data.participants.push(participant)
    quizRecord.data.updatedAt = new Date().toLocaleString('zh-TW')
    
    // 手動保存到localStorage
    localStorage.setItem('appHistories', JSON.stringify(history.histories.value))
    
    // 觸發更新
    history.updateTrigger.value++
    window.dispatchEvent(new CustomEvent('history-updated', { detail: 'quiz' }))
  }
  
  alert(isEn.value ? `Results saved as "${quizKey}"` : `已儲存為 "${quizKey}"`)
}

const retakeQuiz = () => {
  // 再做一次：保持问题，重置答案、索引和参与者名称
  currentQuestionIdx.value = -1
  answers.value = {}
  showResult.value = false
  participantName.value = ''
}

const allParticipants = computed(() => {
  if (props.selectedRecord?.data?.participants) {
    return props.selectedRecord.data.participants
  }
  return []
})

const scoreDistribution = computed(() => {
  const distribution = {}
  allParticipants.value.forEach(p => {
    const scoreRange = Math.round((p.score / questions.value.length) * 100)
    const range = Math.floor(scoreRange / 10) * 10
    distribution[range] = (distribution[range] || 0) + 1
  })
  return distribution
})

const questionCorrectRates = computed(() => {
  if (allParticipants.value.length === 0) return []
  
  return questions.value.map((q, qIdx) => {
    let correctCount = 0
    allParticipants.value.forEach(p => {
      const userAnswer = (p.answers[qIdx] || '').trim()
      const correctAnswer = (q.answer || '').trim()
      if (userAnswer === correctAnswer) {
        correctCount++
      }
    })
    const rate = (correctCount / allParticipants.value.length) * 100
    return { questionNum: qIdx + 1, correctCount, totalCount: allParticipants.value.length, rate }
  })
})

const getScoreColor = (score) => {
  if (score >= 80) return '#10b981' // 綠色
  if (score >= 60) return '#f59e0b' // 黃色
  return '#ef4444' // 紅色
}

const getAnswerStatus = (idx) => {
  const q = questions.value[idx]
  const userAnswer = (answers.value[idx] || '').trim()
  const correctAnswer = (q.answer || '').trim()
  return userAnswer === correctAnswer ? 'correct' : 'incorrect'
}

const getProgress = () => {
  return ((currentQuestionIdx.value + 1) / questions.value.length) * 100
}

const resetQuiz = () => {
  isActive.value = false
  showResult.value = false
  currentQuestionIdx.value = -1
  answers.value = {}
  questions.value = []
  quizTitle.value = ''
}

watch(() => props.selectedRecord, (newVal) => {
  if (newVal && newVal.data) {
    quizTitle.value = newVal.data.title || newVal.name
    questions.value = newVal.data.questions || []
    
    // 檢查是否是多人測驗記錄
    if (newVal.data.participants && newVal.data.participants.length > 0) {
      // 顯示多人統計
      isActive.value = true
      showResult.value = true
      currentQuestionIdx.value = -1
    } else if (newVal.data.participant) {
      // 舊格式：單人記錄
      participantName.value = newVal.data.participant.name
      score.value = newVal.data.participant.score
      answers.value = newVal.data.participant.answers
      showResult.value = true
      isActive.value = true
    } else {
      showResult.value = false
      isActive.value = false
    }
  }
}, { immediate: true })

</script>

<style scoped>
.quiz-container {
  max-width: 900px;
  margin: 0 auto;
  background: var(--card-bg);
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border);
}

.quiz-container h2 {
  color: #fff;
  margin-top: 0;
}

.question-form {
  background: linear-gradient(135deg, #1f2937, #374151);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #3b82f6;
}

.form-group {
  background: #2a3f5f;
  border-radius: 8px;
  padding: 15px;
  margin: 15px 0;
}

.form-group label {
  display: block;
  margin-top: 10px;
  margin-bottom: 5px;
  font-weight: 600;
  color: #e0e0e0;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px !important;
  border: 2px solid #3b82f6 !important;
  border-radius: 6px !important;
  font-family: inherit;
  margin-bottom: 10px;
}

.form-group select {
  cursor: pointer;
}

.question-list {
  background: linear-gradient(135deg, rgba(58, 130, 246, 0.1), rgba(16, 185, 129, 0.1));
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.question-list h4 {
  margin: 0 0 15px 0;
  color: #e0e0e0;
}

.question-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #2a3f5f;
  padding: 10px 15px;
  border-radius: 6px;
  margin-bottom: 8px;
  font-size: 14px;
  color: #e0e0e0;
}

.btn-delete {
  padding: 5px 10px !important;
  background: #ef4444 !important;
  font-size: 12px !important;
  border-radius: 50% !important;
  width: 30px;
  height: 30px;
}

.quiz-header {
  background: linear-gradient(135deg, #1f2937, #374151);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #3b82f6;
}

.quiz-header h3 {
  margin: 0 0 15px 0;
  color: #e0e0e0;
}

.progress-info {
  font-size: 14px;
  color: #9ca3af;
  margin-bottom: 10px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #374151;
  border-radius: 10px;
  overflow: hidden;
  margin-top: 5px;
}

.progress {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #10b981);
  transition: width 0.3s ease;
}

.question-box {
  background: linear-gradient(135deg, #1f2937, #374151);
  border-radius: 8px;
  padding: 25px;
  margin-bottom: 20px;
  border: 1px solid #3b82f6;
}

.question-number {
  display: inline-block;
  background: #3b82f6;
  color: white;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 15px;
}

.question-text {
  color: #e0e0e0;
  margin: 0 0 20px 0;
  font-size: 1.2em;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  background: #2a3f5f;
  border: 2px solid #3b82f6;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.option:hover {
  background: #374151;
  border-color: #10b981;
}

.option input {
  margin-right: 10px;
  cursor: pointer;
}

.option-text {
  flex: 1;
  cursor: pointer;
  color: #e0e0e0;
}

.result-panel {
  animation: fadeIn 0.3s ease;
}

.score-display {
  background: linear-gradient(135deg, #1f2937, #374151);
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  margin-bottom: 30px;
  border: 1px solid #3b82f6;
}

.score-label {
  color: #9ca3af;
  font-weight: 600;
  margin-bottom: 10px;
}

.score-value {
  font-size: 3em;
  font-weight: 700;
  background: linear-gradient(135deg, #3b82f6, #10b981);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 10px;
}

.score-detail {
  color: #9ca3af;
  font-size: 14px;
}

.results-review {
  margin-bottom: 30px;
}

.results-review h3 {
  color: #e0e0e0;
  margin-bottom: 20px;
}

.result-item {
  background: #2a3f5f;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 15px;
  border-left: 5px solid;
}

.result-item.correct {
  border-left-color: #10b981;
  background: linear-gradient(to right, rgba(16, 185, 129, 0.1), #2a3f5f);
}

.result-item.incorrect {
  border-left-color: #ef4444;
  background: linear-gradient(to right, rgba(239, 68, 68, 0.1), #2a3f5f);
}

.result-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.result-icon {
  font-size: 20px;
}

.result-number {
  font-weight: 600;
  color: #e0e0e0;
}

.result-question {
  color: #e0e0e0;
  margin: 10px 0;
  font-weight: 600;
}

.result-info {
  font-size: 14px;
  color: #9ca3af;
  margin: 10px 0;
}

.result-info div {
  margin: 5px 0;
}

.result-explanation {
  background: #374151;
  padding: 12px;
  border-radius: 6px;
  margin-top: 10px;
  border-left: 3px solid #f59e0b;
  font-size: 13px;
  color: #e0e0e0;
}

.btn-large {
  padding: 15px 40px !important;
  font-size: 16px !important;
}

.name-input-panel {
  background: linear-gradient(135deg, #1f2937, #374151);
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  border: 1px solid #3b82f6;
}

.name-input-panel h3 {
  color: #e0e0e0;
  margin-bottom: 20px;
}

.name-input-panel input {
  width: 100%;
  max-width: 300px;
  padding: 12px !important;
  font-size: 16px;
  text-align: center;
  border: 2px solid #3b82f6 !important;
  border-radius: 6px !important;
}

.other-participants {
  background: linear-gradient(135deg, rgba(58, 130, 246, 0.1), rgba(16, 185, 129, 0.1));
  border-radius: 8px;
  padding: 20px;
  margin-top: 30px;
}

.other-participants h4 {
  color: #e0e0e0;
  margin: 0 0 15px 0;
}

.participants-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.participant-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #2a3f5f;
  padding: 12px 15px;
  border-radius: 6px;
  border-left: 3px solid #3b82f6;
}

.participant-name {
  color: #e0e0e0;
  font-weight: 600;
}

.participant-score {
  color: #9ca3af;
  font-size: 14px;
}

.statistics-panel {
  background: linear-gradient(135deg, #1f2937, #374151);
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 30px;
  border: 1px solid #10b981;
}

.statistics-panel h3 {
  color: #10b981;
  margin-top: 0;
  margin-bottom: 20px;
}

.statistics-panel h4 {
  color: #e0e0e0;
  margin: 20px 0 15px 0;
  font-size: 15px;
}

.distribution-section {
  margin-bottom: 25px;
}

.distribution-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.distribution-bar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bar-label {
  width: 50px;
  color: #9ca3af;
  font-size: 13px;
  font-weight: 600;
}

.bar-container {
  flex: 1;
  height: 30px;
  background: #1a2332;
  border-radius: 6px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 600;
  font-size: 12px;
  min-width: 25px;
}

.correct-rate-section {
  margin-bottom: 25px;
}

.correct-rate-chart {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rate-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rate-label {
  width: 40px;
  color: #9ca3af;
  font-size: 12px;
  font-weight: 600;
}

.rate-bar {
  flex: 1;
  height: 25px;
  background: #1a2332;
  border-radius: 6px;
  overflow: hidden;
}

.rate-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #10b981);
  border-radius: 6px;
}

.rate-text {
  width: 120px;
  color: #9ca3af;
  font-size: 12px;
  text-align: right;
}

.participants-section {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 15px;
}

.participants-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.participant-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #2a3f5f;
  border-radius: 6px;
  border-left: 3px solid #3b82f6;
}

.participant-name {
  color: #e0e0e0;
  font-weight: 600;
}

.participant-score {
  color: #9ca3af;
  font-size: 14px;
}
</style>
