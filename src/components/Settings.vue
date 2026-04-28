<template>
  <div class="settings-container">
    <div class="settings-overlay" @click="closeSettings"></div>
    
    <div class="settings-panel">
      <div class="settings-header">
        <h2>{{ isEn ? 'Settings' : '設定' }}</h2>
        <button class="btn-close" @click="closeSettings">✕</button>
      </div>

      <div class="settings-content">
        <!-- 語言設定 -->
        <div class="setting-item">
          <h3>{{ isEn ? 'Language' : '語言設定' }}</h3>
          <div class="language-buttons">
            <button 
              v-for="locale in i18n.locales"
              :key="locale"
              @click="setLanguage(locale)"
              :class="['lang-btn', i18n.locale.value === locale && 'active']"
            >
              {{ getLanguageName(locale) }}
            </button>
          </div>
        </div>

        <!-- 顏色主題 -->
        <div class="setting-item">
          <h3>{{ isEn ? 'Theme' : '顏色主題' }}</h3>
          <div class="theme-grid">
            <button 
              v-for="t in themes"
              :key="t.id"
              @click="theme.setTheme(t.id)"
              :class="['theme-btn', theme.currentTheme.value === t.id && 'active']"
              :style="{ borderTopColor: t.accent }"
            >
              <div class="theme-preview">
                <div class="color-square" :style="{ backgroundColor: t.primary }"></div>
                <div class="color-square" :style="{ backgroundColor: t.accent }"></div>
              </div>
              <div class="theme-name">{{ getThemeName(t.name) }}</div>
            </button>
          </div>
        </div>

        <!-- 刪除記錄 -->
        <div class="setting-item">
          <h3>{{ isEn ? 'Clear Data' : '清除數據' }}</h3>
          <button @click="showDeleteConfirm = true" class="btn-danger">{{ isEn ? 'Delete All Records' : '刪除所有記錄' }}</button>
        </div>
      </div>
    </div>

    <!-- 刪除確認對話框 -->
    <Transition name="fade">
      <div v-if="showDeleteConfirm" class="confirm-dialog">
        <div class="confirm-overlay" @click="showDeleteConfirm = false"></div>
        <div class="confirm-box">
          <p class="confirm-message">{{ isEn ? 'All records will be cleared. Continue?' : '按下後將會清除過往紀錄，是否清除?' }}</p>
          
          <label class="remind-checkbox">
            <input v-model="dontRemindAgain" type="checkbox">
            <span>{{ isEn ? 'Do not remind again' : '以後不再提醒' }}</span>
          </label>

          <div class="confirm-buttons">
            <button @click="handleDeleteConfirm" class="btn-confirm">{{ isEn ? 'Confirm' : '確認' }}</button>
            <button @click="showDeleteConfirm = false" class="btn-cancel">{{ isEn ? 'Cancel' : '取消' }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from '../composables/useI18n'
import { useTheme } from '../composables/useTheme'
import { useHistory } from '../composables/useHistory'

const props = defineProps({
  visible: Boolean
})

const emit = defineEmits(['close'])
const i18n = useI18n()
const history = useHistory()
const theme = useTheme()

const isEn = computed(() => i18n.locale.value === 'en')

const showDeleteConfirm = ref(false)
const dontRemindAgain = ref(localStorage.getItem('dontRemindDeleteAll') === 'true')

// 獲取主題列表，過濾掉明亮主題，確保符合暗色背景
const themes = computed(() => theme.getThemes().filter(t => t.name !== '明亮主題' && !t.id?.includes('light')))

const closeSettings = () => {
  emit('close')
}

const setLanguage = (locale) => {
  i18n.setLocale(locale)
  localStorage.setItem('lang', locale)
  localStorage.setItem('appLocale', locale)
  // 強制觸發全局更新
  window.dispatchEvent(new CustomEvent('language-changed', { detail: locale }))
}

const getLanguageName = (locale) => {
  const names = {
    'zh': '中文',
    'zh-TW': '繁體中文',
    'zh-tw': '繁體中文',
    'en': 'English',
    'ja': '日本語'
  }
  return names[locale] || locale
}

const getThemeName = (name) => {
  if (!isEn.value) return name
  const dict = {
    '預設暗色': 'Dark Default',
    '深海藍': 'Ocean Blue',
    '森林綠': 'Forest Green',
    '皇家紫': 'Royal Purple'
  }
  return dict[name] || name
}

const handleDeleteConfirm = () => {
  if (dontRemindAgain.value) {
    localStorage.setItem('dontRemindDeleteAll', 'true')
  } else {
    localStorage.removeItem('dontRemindDeleteAll')
  }
  history.clearAllHistories()
  window.dispatchEvent(new Event('history-updated'))
  showDeleteConfirm.value = false
  emit('close')
}
</script>

<style scoped>
.settings-container {
  position: fixed;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  z-index: 200;
}

.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 200;
}

.settings-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 400px;
  height: 100vh;
  background: #1f2937; /* 固定為暗色背景 */
  border-left: 2px solid var(--blue);
  z-index: 201;
  display: flex;
  flex-direction: column;
  animation: slideInRight 0.3s ease;
  overflow-y: auto;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  background: var(--darker-bg);
}

.settings-header h2 {
  margin: 0;
  color: #e0e0e0; /* 固定為淺色文字 */
  font-size: 1.5em;
}

.btn-close {
  background: none !important;
  border: none;
  font-size: 24px;
  color: #e0e0e0; /* 固定為淺色文字 */
  cursor: pointer;
  padding: 0 !important;
  box-shadow: none !important;
}

.btn-close:hover {
  color: var(--blue) !important;
  transform: none !important;
}

.settings-content {
  padding: 20px;
  flex: 1;
}

.setting-item {
  margin-bottom: 30px;
}

.setting-item h3 {
  color: #e0e0e0; /* 固定為淺色文字 */
  margin: 0 0 15px 0;
  font-size: 1.1em;
}

.language-buttons {
  display: flex;
  gap: 10px;
}

.lang-btn {
  flex: 1;
  padding: 10px !important;
  background: #2a3f5f !important; /* 固定為暗色卡片背景 */
  color: #fff;
  border: 2px solid transparent;
  border-radius: 6px;
  font-size: 13px !important;
  transition: all 0.3s ease;
}

.lang-btn:hover {
  border-color: var(--blue) !important;
}

.lang-btn.active {
  background: #3b82f6 !important; /* 固定為藍色 */
  border-color: var(--blue) !important;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.theme-btn {
  padding: 15px !important;
  background: #1f2937 !important;
  border: 3px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.theme-btn:hover {
  border-color: var(--blue) !important;
}

.theme-btn.active {
  border-color: var(--blue) !important;
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.5) !important;
}

.theme-preview {
  display: flex;
  gap: 8px;
  width: 100%;
}

.color-square {
  flex: 1;
  height: 40px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.theme-name {
  font-size: 13px;
  color: #e0e0e0;
  width: 100%;
  text-align: center;
}

.btn-danger {
  width: 100%;
  background: linear-gradient(135deg, #ef4444, #dc2626) !important;
}

/* 確認對話框 */
.confirm-dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 202;
}

.confirm-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
}

.confirm-box {
  position: relative;
  z-index: 203; /* 確保在最上層 */
  background: #1f2937; /* 固定為暗色背景 */
  border: 2px solid var(--blue);
  border-radius: 12px;
  padding: 30px;
  max-width: 400px;
  animation: scaleIn 0.3s ease;
}

@keyframes scaleIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.confirm-message {
  color: #e0e0e0; /* 固定為淺色文字 */
  font-size: 16px;
  margin: 0 0 20px 0;
  text-align: center;
}

.remind-checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  cursor: pointer;
  color: #9ca3af; /* 固定為淺灰色文字 */
  font-size: 13px;
}

.remind-checkbox input {
  cursor: pointer;
  width: 16px;
  height: 16px;
  accent-color: #3b82f6; /* 固定為藍色 */
}

.confirm-buttons {
  display: flex;
  gap: 10px;
}

@media (max-width: 480px) {
  .settings-panel {
    width: 100%;
  }
  
}
</style>
