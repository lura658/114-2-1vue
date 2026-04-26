import { ref, watch } from 'vue'

const themes = {
  'dark-blue': {
    name: '深藍黑',
    primary: '#0f1419',
    secondary: '#1a2332',
    accent: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    purple: '#8b5cf6',
    border: '#4a6fa5'
  },
  'purple-dark': {
    name: '紫色暗黑',
    primary: '#1a0f2e',
    secondary: '#2d1b4e',
    accent: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    purple: '#c084fc',
    border: '#6b3fa0'
  },
  'green-dark': {
    name: '綠色暗黑',
    primary: '#0f1f1a',
    secondary: '#1a3a2e',
    accent: '#10b981',
    success: '#059669',
    warning: '#f59e0b',
    danger: '#ef4444',
    purple: '#6ee7b7',
    border: '#047857'
  },
  'cyan-dark': {
    name: '青色暗黑',
    primary: '#0f2a2e',
    secondary: '#1a4a52',
    accent: '#06b6d4',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    purple: '#22d3ee',
    border: '#0891b2'
  },
  'red-dark': {
    name: '紅色暗黑',
    primary: '#2d0f0f',
    secondary: '#4a1a1a',
    accent: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#dc2626',
    purple: '#fca5a5',
    border: '#b91c1c'
  }
}

export function useTheme() {
  const currentTheme = ref(localStorage.getItem('appTheme') || 'dark-blue')
  
  const applyTheme = (themeName) => {
    if (!themes[themeName]) return
    
    const theme = themes[themeName]
    const root = document.documentElement
    
    root.style.setProperty('--dark-bg', theme.primary)
    root.style.setProperty('--darker-bg', theme.secondary)
    root.style.setProperty('--card-bg', theme.secondary)
    root.style.setProperty('--blue', theme.accent)
    root.style.setProperty('--green', theme.success)
    root.style.setProperty('--purple', theme.purple)
    root.style.setProperty('--border', theme.border)
    root.style.setProperty('--warning', theme.warning)
    root.style.setProperty('--danger', theme.danger)
    
    currentTheme.value = themeName
    localStorage.setItem('appTheme', themeName)
    
    // 更新body背景
    document.body.style.background = `linear-gradient(-45deg, ${theme.primary}, ${theme.secondary}, ${theme.primary}, ${theme.secondary})`
  }

  const setTheme = (themeName) => {
    applyTheme(themeName)
  }

  const getThemes = () => {
    return Object.entries(themes).map(([key, value]) => ({
      id: key,
      ...value
    }))
  }

  // 初始化主題
  const init = () => {
    applyTheme(currentTheme.value)
  }

  return {
    currentTheme,
    setTheme,
    getThemes,
    init
  }
}
