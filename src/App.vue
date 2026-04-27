<template>
  <div class="app" :key="appKey">
    <!-- 首頁 -->
    <Transition name="fade">
      <div v-if="showHome" class="home-page">
        <!-- 星空背景 -->
        <canvas ref="starsRef" class="stars-background"></canvas>
        <div ref="vantaRef" class="vanta-background"></div>
        <div class="home-content">
          <h1 class="home-title">{{ i18n.t('appTitle') }}</h1>
          <p class="home-subtitle">{{ i18n.t('appSubtitle') }}</p>
          
          <div class="features">
            <div class="feature">{{ i18n.t('feature1') }}</div>
            <div class="feature">{{ i18n.t('feature2') }}</div>
            <div class="feature">{{ i18n.t('feature3') }}</div>
            <div class="feature">{{ i18n.t('feature4') }}</div>
            <div class="feature">{{ i18n.t('feature5') }}</div>
          </div>

          <button @click="handleStart" class="btn-start">{{ i18n.t('startBtn') }}</button>
        </div>
      </div>
    </Transition>

    <!-- 主應用 -->
    <Transition name="fade">
      <div v-if="!showHome" class="main-app">
        <!-- 固定頭部 -->
        <header class="app-header">
          <div class="header-title">
            <h1>{{ i18n.t('appTitle') }}</h1>
          </div>
          <div class="header-buttons">
            <button @click="toggleNavbar" class="btn-toggle-nav" :title="navbarVisible ? '收起' : '展開'">
              {{ navbarVisible ? '▲' : '▼' }}
            </button>
            <button @click="showSettings = true" class="btn-settings">⚙️</button>
          <button @click="showHome = true" class="btn-home">{{ isEn ? 'Home' : i18n.t('homePage') }}</button>
          </div>
        </header>

        <!-- 導航欄 -->
        <nav v-show="navbarVisible" class="navbar">
          <button 
            v-for="item in tools" 
            :key="item.key"
            @click="page = item.key"
            :class="['nav-btn', page === item.key ? 'active' : '', item.color]"
          >
            {{ item.icon }} {{ item.name }}
          </button>
        </nav>

        <!-- 主容器 -->
        <div class="main-container">
        <button v-if="!historyVisible" @click="historyVisible = true" class="btn-show-history">
          {{ isEn ? 'Show History' : '展開紀錄' }}
        </button>
          <!-- 左側歷史記錄區域 -->
        <aside v-show="historyVisible" class="history-panel">
          <div class="history-header">
            <h3>{{ isEn ? 'History' : '操作紀錄' }}</h3>
            <button @click="historyVisible = false" class="btn-close-history">✕</button>
          </div>
          <div class="history-content">
            <div v-if="currentHistories.length === 0" class="empty-history">
              <p>{{ isEn ? 'No records' : '暫無記錄' }}</p>
            </div>
            <div v-else class="history-list">
              <div v-for="(item, idx) in currentHistories" :key="idx" class="history-item" @click="selectHistory(item)">
                <div class="history-info">
                  <div class="history-name">{{ item.name }}</div>
                  <div class="history-time">{{ item.timestamp }}</div>
                </div>
                <div class="history-actions">
                  <button @click.stop="renameHistory(item)" class="btn-history-action">{{ isEn ? 'Rename' : i18n.t('rename') }}</button>
                  <button @click.stop="deleteHistory(item)" class="btn-history-delete">{{ isEn ? 'Delete' : i18n.t('delete') }}</button>
                </div>
              </div>
            </div>
          </div>
        </aside>

          <!-- 內容區域 -->
          <div class="content-area">
            <Transition name="fade" mode="out-in">
            <component :is="currentComponent" :key="page" :selected-record="selectedRecord" />
            </Transition>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 設定面板 -->
    <Settings v-if="showSettings" :visible="showSettings" @close="showSettings = false" />

    <!-- 重新命名對話框 -->
    <Transition name="fade">
      <div v-if="renamingItem" class="rename-dialog">
        <div class="rename-overlay" @click="renamingItem = null"></div>
        <div class="rename-box">
        <h3>{{ isEn ? 'Rename' : '重新命名' }}</h3>
        <input v-model="renameValue" @keyup.enter="confirmRename" :placeholder="isEn ? 'Enter new name' : '輸入新名稱'">
          <div class="rename-buttons">
          <button @click="confirmRename" class="btn-confirm">{{ isEn ? 'Confirm' : i18n.t('confirm') }}</button>
          <button @click="renamingItem = null" class="btn-cancel">{{ isEn ? 'Cancel' : i18n.t('cancel') }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount, nextTick } from 'vue'
import RandomPicker from './components/RandomPicker.vue'
import ScoreBoard from './components/ScoreBoard.vue'
import Timer from './components/Timer.vue'
import QuizSystem from './components/QuizSystem.vue'
import RealtimeVote from './components/RealtimeVote.vue'
import RandomGrouping from './components/RandomGrouping.vue'
import MemberList from './components/MemberList.vue'
import Settings from './components/Settings.vue'
import { useI18n } from './composables/useI18n'
import { useTheme } from './composables/useTheme'
import { useHistory } from './composables/useHistory'
import * as THREE from 'three'
import NET from 'vanta/src/vanta.net'

// 確保 Vanta 能夠取得全局的 THREE 實例，避免 PerspectiveCamera 等找不到方法的錯誤
window.THREE = THREE

const page = ref('picker')
const showHome = ref(true)
const showSettings = ref(false)
const navbarVisible = ref(true)
const historyVisible = ref(true)
const selectedRecord = ref(null)
const vantaRef = ref(null)
const vantaEffect = ref(null)
const starsRef = ref(null)
let animationFrameId = null
let resizeHandler = null

const i18n = useI18n()
const theme = useTheme()
const history = useHistory()
const appKey = ref(0)

const isEn = computed(() => i18n.locale.value === 'en')

const renamingItem = ref(null)
const renameValue = ref('')

const tools = computed(() => [
  { key: 'picker', name: isEn.value ? 'Picker' : '抽籤機', icon: '🎲', color: 'blue' },
  { key: 'grouping', name: isEn.value ? 'Grouping' : '隨機分組', icon: '👥', color: 'indigo' },
  { key: 'memberlist', name: isEn.value ? 'Lists' : '名單', icon: '📋', color: 'purple' },
  { key: 'scoreboard', name: isEn.value ? 'Scoreboard' : '記分板', icon: '🏆', color: 'green' },
  { key: 'timer', name: isEn.value ? 'Timer' : '計時器', icon: '⏱️', color: 'purple' },
  { key: 'quiz', name: isEn.value ? 'Quiz' : '測驗卷', icon: '📝', color: 'blue' },
  { key: 'vote', name: isEn.value ? 'Vote' : '投票區', icon: '📊', color: 'green' }
])

watch(page, () => {
  selectedRecord.value = null
})

const selectHistory = (item) => {
  selectedRecord.value = item
}

const currentComponent = computed(() => {
  switch (page.value) {
    case 'picker': return RandomPicker
    case 'grouping': return RandomGrouping
    case 'memberlist': return MemberList
    case 'scoreboard': return ScoreBoard
    case 'timer': return Timer
    case 'quiz': return QuizSystem
    case 'vote': return RealtimeVote
  }
})

// 用來觸發強制更新 Computed 
const historyUpdateTrigger = ref(0)
const forceUpdate = () => {
  historyUpdateTrigger.value++
}

const currentHistories = computed(() => {
  historyUpdateTrigger.value // 建立響應式依賴
  history.updateTrigger.value // 建立對history的響應式依賴
  let type = page.value === 'score' ? 'scoreboard' : page.value
  const list = (history.histories && history.histories.value && history.histories.value[type]) || []
  return [...list].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
})

const toggleNavbar = () => {
  navbarVisible.value = !navbarVisible.value
}

const renameHistory = (item) => {
  renamingItem.value = item
  renameValue.value = item.name
}

const confirmRename = () => {
  if (renameValue.value.trim() && renamingItem.value) {
    const type = page.value === 'score' ? 'scoreboard' : page.value
    if (history.renameHistory) {
      history.renameHistory(type, renamingItem.value.id, renameValue.value)
    }
    forceUpdate()
  }
  renamingItem.value = null
}

const deleteHistory = (item) => {
  if (confirm(isEn.value ? 'Delete this record?' : '確定要刪除此記錄嗎?')) {
    const type = page.value === 'score' ? 'scoreboard' : page.value
    if (history.deleteHistory) {
      history.deleteHistory(type, item.id)
    }
    if (selectedRecord.value && selectedRecord.value.id === item.id) {
      selectedRecord.value = null // 清除右側顯示中的已刪除紀錄
    }
    forceUpdate()
  }
}

// 初始化 Vanta 背景效果
const initVantaEffect = () => {
  // 銷毀舊效果
  if (vantaEffect.value) {
    try {
      if (vantaEffect.value && vantaEffect.value.destroy) {
        vantaEffect.value.destroy()
      }
    } catch (e) {
      console.warn('Error destroying vanta effect:', e)
    }
    vantaEffect.value = null
  }

  if (!vantaRef.value) return

  try {
    // 取得當前主題的accent顏色
    const accentHex = theme.currentThemeObj.value?.accent || '#3b82f6'
    const accentColor = parseInt(accentHex.replace('#', ''), 16)
    
    vantaEffect.value = NET({
      el: vantaRef.value,
      THREE: THREE,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200.0,
      minWidth: 200.0,
      scale: 1.0,
      scaleMobile: 1.0,
      color: accentColor,        // 線條與節點顏色跟隨主題
      backgroundColor: 0x050a15, // 配合 App 原本的深色背景
      backgroundAlpha: 0,        // 設置透明度為 0 讓底層星空顯示出來
      points: 12.0,              // 節點數量
      maxDistance: 20.0,         // 連線的觸發距離
      spacing: 18.0              // 節點間距
    })
  } catch (e) {
    console.error('Vanta initialization error:', e)
  }
}

// 初始化 HTML Canvas 星空背景
const initStars = () => {
  const canvas = starsRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  
  resizeHandler = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  window.addEventListener('resize', resizeHandler)
  resizeHandler()

  // 產生 150 顆隨機星星
  const stars = Array.from({ length: 150 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2 + 1,       // 參考 p5: random(1, 3)
    speed: Math.random() * 0.8 + 0.2,  // 參考 p5: random(0.2, 1)
    opacity: Math.random() * 0.5 + 0.5 // 保留一點透明度變化讓星空更有層次
  }))

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    stars.forEach(star => {
      // 參考 p5 的 update()：y 軸往下掉落
      star.y += star.speed
      if (star.y > canvas.height) {
        star.y = 0
        star.x = Math.random() * canvas.width
      }
      
      // 參考 p5 的 draw()：畫出純白色的圓形 (對應 p.fill(255) 與 p.circle)
      ctx.beginPath()
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`
      ctx.fill()
    })
    animationFrameId = requestAnimationFrame(draw)
  }
  draw()
}

// 處理點擊開始按鈕，在 Vue 卸載 DOM 之前先手動銷毀 Vanta，避免 removeChild 報錯
const handleStart = () => {
  if (vantaEffect.value) {
    try { vantaEffect.value.destroy() } catch (e) {}
    vantaEffect.value = null
  }
  cleanupStars()
  showHome.value = false
}

// 監聽首頁顯示/隱藏
watch(showHome, (newVal) => {
  if (newVal) {
    // 顯示首頁時初始化效果
    nextTick(() => {
      initVantaEffect()
      initStars()
    })
  } else {
    // 離開首頁時銷毀效果，釋放資源
    if (vantaEffect.value) {
      try {
        if (vantaEffect.value && vantaEffect.value.destroy) {
          vantaEffect.value.destroy()
        }
      } catch (e) {
        console.warn('Error destroying vanta:', e)
      }
      vantaEffect.value = null
    }
    cleanupStars()
  }
})

// 清理星空動畫與監聽器
const cleanupStars = () => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
  }
  animationFrameId = null
}

// 監聽主題變化，重新初始化背景效果
watch(() => theme.currentTheme.value, () => {
  if (showHome.value) {
    initVantaEffect()
  }
})

onMounted(() => {
  // 初始化主題
  theme.init()
  window.addEventListener('history-updated', forceUpdate)
  window.addEventListener('language-changed', (e) => {
    const newLang = e.detail || localStorage.getItem('appLocale') || 'zh-TW'
    i18n.setLocale(newLang)
  })
  window.addEventListener('localeChanged', () => {
    appKey.value++
  })

  // 初始首頁時初始化 Vanta 效果
  if (showHome.value) {
    nextTick(() => {
      initVantaEffect()
      initStars()
    })
  }
})

onBeforeUnmount(() => {
  // 清理 Vanta 效果
  if (vantaEffect.value) {
    try {
      if (vantaEffect.value && vantaEffect.value.destroy) {
        vantaEffect.value.destroy()
      }
    } catch (e) {
      console.warn('Error destroying vanta on unmount:', e)
    }
    vantaEffect.value = null
  }
  cleanupStars()
})
</script>

<style scoped>
.app {
  min-height: 100vh;
  background: linear-gradient(135deg, #050a15 0%, #0a192f 40%, #112240 60%, #020c1b 100%);
  background-attachment: fixed;
  position: relative;
}

.app::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  /* 使用多個交錯的徑向漸層來模擬煙霧/星雲效果 */
  background: 
    radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.12) 0%, transparent 60%),
    radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 50% 90%, rgba(16, 185, 129, 0.08) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
  filter: blur(30px);
  animation: smoke-drift 15s infinite alternate ease-in-out;
}

@keyframes smoke-drift {
  0% {
    transform: scale(1) translate(0, 0);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.05) translate(2%, 3%);
    opacity: 1;
  }
}

.home-page, .main-app, .settings-container, .rename-dialog {
  position: relative;
  z-index: 1;
}

/* 首頁樣式 */
.home-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.stars-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

.vanta-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  min-height: 100vh;
  z-index: 0;
  display: block !important;
}

.home-content {
  text-align: center;
  max-width: 700px;
  position: relative;
  z-index: 1;
}

.home-title {
  font-family: 'CustomFont', 'Segoe UI', sans-serif;
  font-size: 3em;
  color: #fff;
  margin: 0 0 8px 0;
  text-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
}

.home-subtitle {
  font-size: 1.1em;
  color: #9ca3af;
  margin: 0 0 30px 0;
}

.features {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 30px;
  justify-content: center;
}

.feature {
  background: rgba(58, 130, 246, 0.1);
  border: 1px solid #3b82f6;
  border-radius: 6px;
  padding: 10px 15px;
  color: #e0e0e0;
  font-size: 0.95em;
  transition: all 0.3s ease;
}

.feature:hover {
  background: rgba(58, 130, 246, 0.2);
  transform: translateX(3px);
}

.btn-start {
  padding: 12px 35px !important;
  font-size: 16px !important;
  font-family: 'CustomFont', 'Segoe UI', sans-serif;
  background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
}

.btn-start:hover {
  transform: scale(1.05) translateY(-3px);
}

/* 主應用樣式 */
.main-app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: linear-gradient(135deg, #0f1419, #1a2332);
  border-bottom: 2px solid var(--blue);
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  height: 60px;
  z-index: 100;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  gap: 15px;
}

.header-title h1 {
  font-family: 'CustomFont', 'Segoe UI', sans-serif;
  font-size: 1.6em;
  color: #fff;
  margin: 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

.header-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn-toggle-nav {
  background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
  padding: 6px 10px !important;
  font-size: 16px !important;
  min-width: 36px;
  min-height: 36px;
}

.btn-settings {
  background: linear-gradient(135deg, #f59e0b, #d97706) !important;
  padding: 6px 10px !important;
  font-size: 16px !important;
  min-width: 36px;
  min-height: 36px;
}

.btn-home {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed) !important;
  padding: 6px 12px !important;
  font-size: 13px !important;
  font-family: 'CustomFont', 'Segoe UI', sans-serif;
  height: 36px;
  display: flex;
  align-items: center;
}

.navbar {
  display: flex;
  justify-content: flex-start;
  gap: 8px;
  padding: 10px 15px;
  background: #1a2332;
  border-bottom: 1px solid var(--border);
  overflow-x: auto;
  position: sticky;
  top: 60px;
  z-index: 99;
}

.nav-btn {
  font-family: 'CustomFont', 'Segoe UI', sans-serif;
  font-size: 13px;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  padding: 8px 14px;
  transition: all 0.3s ease;
  color: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
  flex-shrink: 0;
}

.nav-btn.blue {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.nav-btn.green {
  background: linear-gradient(135deg, #10b981, #059669);
}

.nav-btn.indigo {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
}

.nav-btn.purple {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}

.nav-btn:hover:not(.active) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
}

.nav-btn.active {
  transform: scale(1.08);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.5);
}

.main-container {
  display: flex;
  flex: 1;
  gap: 20px;
  padding: 20px;
  overflow: hidden;
}

/* 左側歷史記錄區域 */
.history-panel {
  width: 280px;
  background: var(--card-bg);
  border-radius: 8px;
  border: 1px solid var(--border);
  padding: 15px;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  flex-shrink: 0;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  flex-shrink: 0;
}

.history-header h3 {
  font-family: 'CustomFont', 'Segoe UI', sans-serif;
  color: #fff;
  margin: 0;
  font-size: 1em;
}

.btn-close-history {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  font-size: 16px;
}

.btn-show-history {
  position: fixed;
  left: 20px;
  top: 130px;
  z-index: 98;
  background: var(--blue);
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
}

.history-content {
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  padding-right: 5px;
}

.empty-history {
  text-align: center;
  color: #9ca3af;
  padding: 20px 0;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-item {
  background: linear-gradient(135deg, rgba(58, 130, 246, 0.1), rgba(16, 185, 129, 0.1));
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 12px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.history-item:hover {
  background: linear-gradient(135deg, rgba(58, 130, 246, 0.2), rgba(16, 185, 129, 0.2));
  transform: translateX(2px);
}

.history-info {
  margin-bottom: 8px;
}

.history-name {
  color: #fff;
  font-weight: 600;
  font-size: 13px;
  word-break: break-all;
  overflow-wrap: anywhere;
}

.history-time {
  color: #9ca3af;
  font-size: 11px;
  margin-top: 3px;
}

.history-actions {
  display: flex;
  gap: 5px;
}

.btn-history-action {
  flex: 1;
  padding: 4px 6px !important;
  font-size: 11px !important;
  background: var(--blue) !important;
  border-radius: 4px !important;
}

.btn-history-delete {
  flex: 1;
  padding: 4px 6px !important;
  font-size: 11px !important;
  background: #ef4444 !important;
  border-radius: 4px !important;
}

/* 內容區域 */
.content-area {
  flex: 1;
  overflow-y: auto;
  min-width: 0;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* 重新命名對話框 */
.rename-dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.rename-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
}

.rename-box {
  position: relative;
  z-index: 201;
  background: var(--darker-bg);
  border: 2px solid var(--blue);
  border-radius: 8px;
  padding: 20px;
  max-width: 300px;
}

.rename-box h3 {
  color: #fff;
  margin: 0 0 15px 0;
}

.rename-box input {
  width: 100%;
  margin-bottom: 15px;
}

.rename-buttons {
  display: flex;
  gap: 10px;
}

.btn-confirm {
  flex: 1;
  background: linear-gradient(135deg, var(--blue), #2563eb) !important;
}

.btn-cancel {
  flex: 1;
  background: var(--card-bg) !important;
  border: 2px solid var(--border) !important;
}

@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@media (max-width: 1024px) {
  .history-panel {
    width: 220px;
  }
}

@media (max-width: 768px) {
  .app-header {
    flex-wrap: wrap;
    padding: 10px;
    gap: 8px;
  }

  .header-title h1 {
    font-size: 1.3em;
    flex: 0 0 100%;
  }

  .header-buttons {
    flex: 1;
    justify-content: flex-end;
  }

  .main-container {
    flex-direction: column;
    gap: 15px;
    padding: 15px;
  }

  .history-panel {
    width: 100%;
    max-height: 250px;
  }

  .history-content {
    height: auto;
    max-height: 200px;
  }

  .navbar {
    gap: 6px;
    padding: 8px;
  }

  .nav-btn {
    padding: 6px 10px;
    font-size: 12px;
  }

  .home-title {
    font-size: 2em;
  }

  .features {
    gap: 8px;
  }

  .feature {
    padding: 8px 12px;
    font-size: 0.85em;
  }
}

@media (max-width: 480px) {
  .home-title {
    font-size: 1.5em;
  }

  .home-content {
    max-width: 100%;
  }

  .features {
    flex-direction: column;
  }

  .header-title h1 {
    font-size: 1.1em;
  }

  .btn-home {
    display: none;
  }
}
</style>
