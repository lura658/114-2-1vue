import { ref } from 'vue'

const translations = {
  'zh-TW': {
    // 標題和導航
    appTitle: '📚 教學互動工具平台',
    appSubtitle: '一套完整的課堂互動解決方案',
    startBtn: '開始使用',
    homePage: '首頁',
    settings: '設定',
    
    // 工具名稱
    picker: '抽籤機',
    score: '記分板',
    timer: '計時器',
    quiz: '測驗卷',
    vote: '投票區',
    
    // 功能
    language: '語言',
    theme: '主題',
    deleteAll: '刪除記錄',
    
    // 提示
    deleteConfirm: '按下後將會清除過往紀錄，是否清除?',
    noRemind: '以後不再提醒',
    confirm: '確認',
    cancel: '取消',
    
    // 記錄
    history: '操作記錄',
    rename: '重新命名',
    delete: '刪除',
    save: '儲存',
    
    // 記分板
    eventName: '活動名稱',
    
    // 功能描述
    feature1: '🎲 隨機抽籤 • 智能點名',
    feature2: '🏆 實時記分 • 競賽管理',
    feature3: '⏱️ 計時工具 • 報告督導',
    feature4: '📝 數位測驗 • 自動批卷',
    feature5: '📊 即時投票 • 課堂互動'
  },
  'en': {
    // Title and Navigation
    appTitle: '📚 Interactive Teaching Platform',
    appSubtitle: 'A complete classroom interaction solution',
    startBtn: 'Get Started',
    homePage: 'Home',
    settings: 'Settings',
    
    // Tool Names
    picker: 'Picker',
    score: 'Scoreboard',
    timer: 'Timer',
    quiz: 'Quiz',
    vote: 'Voting',
    
    // Features
    language: 'Language',
    theme: 'Theme',
    deleteAll: 'Delete All',
    
    // Messages
    deleteConfirm: 'Deleting will clear all records. Continue?',
    noRemind: 'Do not remind again',
    confirm: 'Confirm',
    cancel: 'Cancel',
    
    // Records
    history: 'History',
    rename: 'Rename',
    delete: 'Delete',
    save: 'Save',
    
    // Scoreboard
    eventName: 'Event Name',
    
    // Features Description
    feature1: '🎲 Random Picker • Smart Roll Call',
    feature2: '🏆 Real-time Scoring • Competition',
    feature3: '⏱️ Timer • Time Management',
    feature4: '📝 Digital Quiz • Auto Grading',
    feature5: '📊 Voting • Live Polls'
  }
}

let i18nInstance = null

export function useI18n() {
  if (i18nInstance) {
    return i18nInstance
  }

  const locale = ref(localStorage.getItem('appLocale') || 'zh-TW')
  
  const t = (key) => {
    return translations[locale.value]?.[key] || translations['zh-TW'][key] || key
  }

  const setLocale = (newLocale) => {
    if (translations[newLocale]) {
      locale.value = newLocale
      localStorage.setItem('appLocale', newLocale)
      // 觸發全局更新事件
      window.dispatchEvent(new CustomEvent('localeChanged', { detail: newLocale }))
    }
  }

  const locales = ['zh-TW', 'en']

  i18nInstance = {
    locale,
    t,
    setLocale,
    locales
  }

  return i18nInstance
}
