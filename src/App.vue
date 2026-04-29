<template> 
  <div class="app" :key="appKey"> <!-- 移除 :class="{ 'light-theme': isLightTheme }" -->
    <!-- 學生測驗模式 (小網頁) -->
    <template v-if="isStudentMode">
      <div class="student-mode-container">
        <QuizSystem />
      </div>
    </template>

    <!-- 正常教師主應用 -->
    <template v-else>
      <!-- 首頁 -->
      <Transition name="fade">
        <div v-if="showHome" class="home-page">
          <MixedBackground>
            <div class="home-content">
              <h1 class="home-title">{{ i18n.t('appTitle') }}</h1>
              <p class="home-subtitle">{{ i18n.t('appSubtitle') }}</p>
              <button @click="handleStart" class="btn-start">{{ i18n.t('startBtn') }}</button>
            </div>
          </MixedBackground>
        </div>
      </Transition>

      <!-- 主介面 -->
      <Transition name="fade">
        <div v-if="!showHome" class="main-app">
          <!-- 固定頭部 -->
          <header class="app-header">
            <div class="header-title">
              <h1>{{ i18n.t('appTitle') }}</h1>
            </div>
            <div class="header-buttons">
              <!-- 桌面端按鈕 -->
              <button @click="toggleNavbar" class="btn-toggle-nav desktop-only" :title="navbarVisible ? '收起' : '展開'">
                {{ navbarVisible ? '▲' : '▼' }}
              </button>
              <button @click="showSettings = true" class="btn-settings desktop-only">⚙️</button>
              <button @click="handleHome" class="btn-home desktop-only">{{ isEn ? 'Home' : i18n.t('homePage') }}</button>
              
              <!-- 行動端漢堡菜單 -->
              <button @click="showHeaderMenu = !showHeaderMenu" class="btn-hamburger mobile-only">☰</button>
              
              <!-- 漢堡菜單下拉內容 -->
              <Transition name="slide-down">
                <div v-if="showHeaderMenu" class="header-menu-dropdown">
                  <button @click="toggleNavbar; showHeaderMenu = false" class="menu-item">
                    {{ navbarVisible ? '收起導航' : '展開導航' }}
                  </button>
                  <button @click="showSettings = true; showHeaderMenu = false" class="menu-item">
                    ⚙️ {{ isEn ? 'Settings' : '設定' }}
                  </button>
                  <button @click="handleHome; showHeaderMenu = false" class="menu-item">
                    {{ isEn ? 'Home' : '首頁' }}
                  </button>
                </div>
              </Transition>
            </div>
          </header>

          <!-- 導航欄 -->
          <nav v-show="navbarVisible" class="navbar">
            <button 
              v-for="item in tools" 
              :key="item.key"
              @click="selectPage(item.key)"
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
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import RandomPicker from './components/RandomPicker.vue'
import ScoreBoard from './components/ScoreBoard.vue'
import Timer from './components/Timer.vue'
import QuizSystem from './components/QuizSystem.vue'
import RealtimeVote from './components/RealtimeVote.vue'
import RandomGrouping from './components/RandomGrouping.vue'
import MemberList from './components/MemberList.vue'
import Settings from './components/Settings.vue'
import Whiteboard from './components/Whiteboard.vue' // 引入小白板組件
import MixedBackground from './components/MixedBackground.vue' // 引入混合背景組件
import { useI18n } from './composables/useI18n'
import { useHistory } from './composables/useHistory' // 補上 useHistory 導入
import { useTheme } from './composables/useTheme' // 補上 useTheme 導入

const page = ref('picker')
const showHome = ref(true)
const showSettings = ref(false)
const navbarVisible = ref(true)
const historyVisible = ref(true)
const selectedRecord = ref(null)
const showHeaderMenu = ref(false)

const i18n = useI18n()
const history = useHistory() // 這裡的 useHistory 現在會被正確導入
const theme = useTheme() // 初始化主題功能
const appKey = ref(0)

const isEn = computed(() => i18n.locale.value === 'en')

const renamingItem = ref(null)
const renameValue = ref('')

const isStudentMode = computed(() => {
  return new URLSearchParams(window.location.search).has('quiz')
})

watch(page, () => {
  selectedRecord.value = null
})

const tools = computed(() => [
  { key: 'picker', name: isEn.value ? 'Picker' : '抽籤機', icon: '🎲', color: 'blue' },
  { key: 'grouping', name: isEn.value ? 'Grouping' : '隨機分組', icon: '👥', color: 'indigo' },
  { key: 'memberlist', name: isEn.value ? 'Lists' : '名單', icon: '📋', color: 'purple' },
  { key: 'scoreboard', name: isEn.value ? 'Scoreboard' : '記分板', icon: '🏆', color: 'green' },
  { key: 'timer', name: isEn.value ? 'Timer' : '計時器', icon: '⏱️', color: 'purple' },
  { key: 'quiz', name: isEn.value ? 'Quiz' : '測驗卷', icon: '📝', color: 'blue' },
  { key: 'vote', name: isEn.value ? 'Vote' : '投票區', icon: '📊', color: 'green' },
  { key: 'whiteboard', name: isEn.value ? 'Whiteboard' : '小白板', icon: '✏️', color: 'purple' }
])

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
    case 'whiteboard': return Whiteboard
    case 'vote': return RealtimeVote
  }
})

// 用來觸發強制更新
const historyUpdateTrigger = ref(0)
const forceUpdate = () => {
  historyUpdateTrigger.value++
}

const currentHistories = computed(() => {
  historyUpdateTrigger.value
  history.updateTrigger.value
  let type = page.value === 'score' ? 'scoreboard' : page.value
  const list = (history.histories && history.histories.value && history.histories.value[type]) || []
  return [...list].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
})

const toggleNavbar = () => {
  navbarVisible.value = !navbarVisible.value
}

const selectPage = (pageName) => {
  page.value = pageName
  savePage(pageName)
}

const handleStart = () => {
  showHome.value = false
  selectPage('picker')
}

const handleHome = () => {
  showHome.value = true
  savePage('home')
}

// 保存頁面狀態
const savePage = (pageName) => {
  localStorage.setItem('lastPage', pageName)
}

const restorePage = () => {
  const lastPage = localStorage.getItem('lastPage')
  if (lastPage && lastPage !== 'home') {
    showHome.value = false
    page.value = lastPage
  }
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
      selectedRecord.value = null
    }
    forceUpdate()
  }
}

onMounted(() => {
  // 初始化主題 (自動載入使用者選擇的顏色)
  theme.init()

  window.addEventListener('history-updated', forceUpdate)
  window.addEventListener('language-changed', (e) => {
    const newLang = e.detail || localStorage.getItem('appLocale') || 'zh-TW'
    i18n.setLocale(newLang)
  })
  window.addEventListener('localeChanged', () => {
    appKey.value++
  })

  // 恢復頁面狀態
  restorePage()
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
  background: radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.15), transparent 60%);
  pointer-events: none;
  z-index: 0;
}

.home-page, .main-app {
  position: relative;
  z-index: 1;
}

/* 學生模式容器 (隱藏周遭元素，滿版置中顯示) */
.student-mode-container {
  min-height: 100vh;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 首頁樣式 */
.home-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100%;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.home-content {
  text-align: center;
  max-width: 600px;
  position: relative;
  z-index: 2;
}

.home-title {
  font-family: 'CustomFont', 'Segoe UI', sans-serif;
  font-size: clamp(2em, 8vw, 3em);
  color: #e0e0e0; /* 調整為更柔和的白色 */
  margin: 0 0 8px 0;
  text-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
}

.home-subtitle {
  font-size: clamp(0.9em, 2vw, 1.1em);
  color: #9ca3af;
  margin: 0 0 25px 0; /* 稍微縮小間距 */
}

.btn-start {
  padding: clamp(10px, 1.5vw, 12px) clamp(25px, 4vw, 35px) !important;
  font-size: clamp(14px, 2vw, 16px) !important;
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
  color: #e0e0e0;
  margin: 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

.header-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
  position: relative;
}

.desktop-only {
  display: flex;
}

.mobile-only {
  display: none;
}

.btn-hamburger {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed) !important;
  padding: 6px 10px !important;
  font-size: 18px !important;
  min-width: 36px;
  min-height: 36px;
  border-radius: 6px;
  border: none;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-hamburger:hover {
  transform: scale(1.05);
}

/* 漢堡菜單下拉 */
.header-menu-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: linear-gradient(135deg, #0f1419, #1a2332);
  border: 2px solid var(--blue);
  border-radius: 8px;
  min-width: 180px;
  z-index: 101;
  margin-top: 5px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.menu-item {
  display: block;
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  color: #e0e0e0;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  border-bottom: 1px solid var(--border);
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:hover {
  background: rgba(59, 130, 246, 0.2);
  padding-left: 20px;
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
  overflow-y: hidden;
  position: sticky;
  top: 60px;
  z-index: 99;
  flex-wrap: nowrap;
  scrollbar-width: thin;
  scrollbar-color: var(--blue) transparent;
  scroll-behavior: smooth;
}

.navbar::-webkit-scrollbar {
  height: 6px;
}

.navbar::-webkit-scrollbar-track {
  background: transparent;
}

.navbar::-webkit-scrollbar-thumb {
  background: var(--blue);
  border-radius: 3px;
}

.navbar::-webkit-scrollbar-thumb:hover {
  background: #2563eb;
}

.nav-btn {
  font-family: 'CustomFont', 'Segoe UI', sans-serif;
  font-size: 13px;
  font-weight: 600;
  border: none;
  border-radius: 8px; /* 稍微圓潤一點 */
  padding: 8px 14px;
  transition: all 0.3s ease;
  color: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
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
  min-height: 0;
}

/* 歷史記錄區域 */
.history-panel {
  width: clamp(200px, 25vw, 320px);
  background: var(--card-bg);
  border-radius: 12px;
  border: 1px solid var(--border);
  padding: 15px;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  flex-shrink: 0;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  transition: width 0.3s ease;
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
  color: #e0e0e0;
  margin: 0;
  font-size: 1em;
}

.btn-close-history {
  background: none;
  border: none;
  color: #e0e0e0;
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
  border-radius: 8px;
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
  color: #e0e0e0;
  font-weight: 600;
  font-size: 13px;
  word-break: break-all;
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
  overflow-x: hidden;
  min-width: 0;
  min-height: 0;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* 下拉菜單過渡動畫 */
.slide-down-enter-active, .slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
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
  color: #e0e0e0;
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

/* 響應式設計 */
@media (max-width: 1024px) {
  .history-panel {
    width: clamp(180px, 20vw, 280px);
  }
  
  .navbar {
    top: 60px;
  }
}

@media (max-width: 768px) {
  .desktop-only {
    display: none !important;
  }

  .mobile-only {
    display: flex !important;
  }

  .app-header {
    padding: 10px;
    gap: 8px;
  }

  .header-title h1 {
    font-size: 1.3em;
  }

  .header-buttons {
    position: relative;
  }

  .header-menu-dropdown {
    right: 0;
  }
  
  .navbar {
    gap: 5px;
    padding: 8px 10px;
    top: 60px;
    overflow-x: auto;
    flex-wrap: nowrap;
  }
  
  .nav-btn {
    padding: 6px 10px;
    font-size: 12px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .main-container {
    gap: 10px;
    padding: 10px;
    flex-direction: column;
  }

  .history-panel {
    width: 100%;
    max-height: 180px;
    margin-bottom: 10px;
    flex-shrink: 0;
  }

  .content-area {
    flex: 1;
    min-height: 0;
  }
}

@media (max-width: 480px) {
  .home-page {
    padding: 10px;
  }

  .home-content {
    max-width: 95%;
  }

  .btn-start {
    padding: 8px 20px !important;
    font-size: 14px !important;
  }

  .app-header {
    padding: 8px;
    gap: 5px;
  }

  .header-title h1 {
    font-size: 1.1em;
  }

  .header-buttons {
    flex: 1;
  }

  .navbar {
    gap: 4px;
    padding: 6px 8px;
    top: 60px;
  }

  .nav-btn {
    padding: 5px 8px;
    font-size: 11px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .main-container {
    padding: 8px;
  }

  .history-panel {
    max-height: 120px;
  }

  .header-menu-dropdown {
    min-width: 160px;
  }

  .menu-item {
    padding: 10px 12px;
    font-size: 13px;
  }
}

</style>
