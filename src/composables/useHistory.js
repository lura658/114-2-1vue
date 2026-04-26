import { ref, computed } from 'vue'

export function useHistory() {
  // 載入歷史記錄
  const histories = ref(JSON.parse(localStorage.getItem('appHistories')) || {})
  
  // 用來觸發UI更新的計數器
  const updateTrigger = ref(0)
  
  // 記錄類型: picker, score, quiz, vote
  const addHistory = (type, name, data) => {
    if (!histories.value[type]) {
      histories.value[type] = []
    }
    histories.value[type].push({
      id: Date.now(),
      name,
      data,
      timestamp: new Date().toLocaleString('zh-TW')
    })
    saveHistories()
    // 強制觸發UI更新
    updateTrigger.value++
    window.dispatchEvent(new CustomEvent('history-updated', { detail: type }))
  }

  const deleteHistory = (type, id) => {
    if (histories.value[type]) {
      histories.value[type] = histories.value[type].filter(h => h.id !== id)
      saveHistories()
      // 強制觸發UI更新
      updateTrigger.value++
      window.dispatchEvent(new CustomEvent('history-updated', { detail: type }))
    }
  }

  const renameHistory = (type, id, newName) => {
    if (histories.value[type]) {
      const history = histories.value[type].find(h => h.id === id)
      if (history) {
        history.name = newName
        saveHistories()
        // 強制觸發UI更新
        updateTrigger.value++
        window.dispatchEvent(new CustomEvent('history-updated', { detail: type }))
      }
    }
  }

  const clearAllHistories = () => {
    histories.value = {}
    localStorage.removeItem('appHistories')
    // 強制觸發UI更新
    updateTrigger.value++
    window.dispatchEvent(new CustomEvent('history-updated'))
  }

  const saveHistories = () => {
    localStorage.setItem('appHistories', JSON.stringify(histories.value))
  }

  const getHistoriesByType = (type) => {
    return computed(() => {
      updateTrigger.value // 建立響應式依賴
      return histories.value[type] || []
    })
  }

  return {
    histories,
    updateTrigger,
    addHistory,
    deleteHistory,
    renameHistory,
    clearAllHistories,
    getHistoriesByType
  }
}
