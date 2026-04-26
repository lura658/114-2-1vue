// 主题和语言管理系统
export const themeManager = {
  themes: {
    dark: {
      name: '深色',
      bg: 'linear-gradient(135deg, #0f1419 0%, #1a2d4d 100%)',
      darkBg: '#0f1419',
      cardBg: '#1f2d42',
      textColor: '#e0e0e0',
      textLight: '#9ca3af',
      primary: '#3b82f6',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      border: '#4a6fa5'
    },
    light: {
      name: '亮色',
      bg: 'linear-gradient(135deg, #f0f4f8 0%, #d9e8f5 100%)',
      darkBg: '#ffffff',
      cardBg: '#f8fafc',
      textColor: '#1f2937',
      textLight: '#6b7280',
      primary: '#2563eb',
      success: '#059669',
      warning: '#d97706',
      danger: '#dc2626',
      border: '#cbd5e1'
    },
    ocean: {
      name: '海洋',
      bg: 'linear-gradient(135deg, #0c2340 0%, #1a4d6d 100%)',
      darkBg: '#0c2340',
      cardBg: '#1a3a52',
      textColor: '#e0f2fe',
      textLight: '#7dd3fc',
      primary: '#06b6d4',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      border: '#0891b2'
    },
    sunset: {
      name: '夕阳',
      bg: 'linear-gradient(135deg, #2d1b1a 0%, #4d2a1f 100%)',
      darkBg: '#2d1b1a',
      cardBg: '#3d2723',
      textColor: '#fde8dc',
      textLight: '#d7ccc8',
      primary: '#ff7043',
      success: '#f57c00',
      warning: '#ffb74d',
      danger: '#d32f2f',
      border: '#bf360c'
    }
  },

  getCurrentTheme() {
    const saved = localStorage.getItem('theme');
    return saved || 'dark';
  },

  setTheme(themeName) {
    localStorage.setItem('theme', themeName);
    this.applyTheme(themeName);
  },

  applyTheme(themeName) {
    const theme = this.themes[themeName];
    if (!theme) return;

    const root = document.documentElement;
    root.style.setProperty('--bg-gradient', theme.bg);
    root.style.setProperty('--dark-bg', theme.darkBg);
    root.style.setProperty('--card-bg', theme.cardBg);
    root.style.setProperty('--text-color', theme.textColor);
    root.style.setProperty('--text-light', theme.textLight);
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--success', theme.success);
    root.style.setProperty('--warning', theme.warning);
    root.style.setProperty('--danger', theme.danger);
    root.style.setProperty('--border', theme.border);
  },

  initTheme() {
    const current = this.getCurrentTheme();
    this.applyTheme(current);
  }
};

export const i18n = {
  languages: {
    'zh-TW': {
      name: '繁體中文',
      home: '首頁',
      picker: '抽籤機',
      scoreboard: '記分板',
      timer: '計時器',
      quiz: '測驗卷',
      vote: '投票區',
      settings: '設定',
      startQuiz: '開始測驗',
      saveName: '儲存姓名',
      generateQR: '產生QRcode',
      startVote: '開始投票',
      endVote: '結束投票',
      save: '儲存',
      delete: '刪除',
      rename: '重新命名',
      reset: '重置',
      confirm: '確認',
      cancel: '取消',
      clearRecords: '清除紀錄',
      clearRecordsWarning: '按下後將會清除過往紀錄，是否清除?',
      doNotAskAgain: '以後不再提醒',
      collapseNav: '收起',
      expandNav: '展開'
    },
    'en': {
      name: 'English',
      home: 'Home',
      picker: 'Picker',
      scoreboard: 'Scoreboard',
      timer: 'Timer',
      quiz: 'Quiz',
      vote: 'Vote',
      settings: 'Settings',
      startQuiz: 'Start Quiz',
      saveName: 'Save Name',
      generateQR: 'Generate QR',
      startVote: 'Start Vote',
      endVote: 'End Vote',
      save: 'Save',
      delete: 'Delete',
      rename: 'Rename',
      reset: 'Reset',
      confirm: 'Confirm',
      cancel: 'Cancel',
      clearRecords: 'Clear Records',
      clearRecordsWarning: 'Clearing records is irreversible. Continue?',
      doNotAskAgain: 'Don\'t ask again',
      collapseNav: 'Collapse',
      expandNav: 'Expand'
    },
  },

  getCurrentLanguage() {
    const saved = localStorage.getItem('language');
    return saved || 'zh-TW';
  },

  setLanguage(lang) {
    if (this.languages[lang]) {
      localStorage.setItem('language', lang);
      // 觸發全局更新事件
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
    }
  },

  t(key, lang = null) {
    const currentLang = lang || this.getCurrentLanguage();
    return this.languages[currentLang]?.[key] || key;
  }
};
