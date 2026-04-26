<template>
  <div class="memberlist-container">
    <h2>📋 {{ isEn ? 'Member Lists' : '建立名單' }}</h2>

    <!-- 配置面板 - 建立新名單 -->
    <Transition name="fade">
      <div v-if="!editingList" class="config-panel">
        <h3>{{ isEn ? 'Create New List' : '建立新名單' }}</h3>

        <label>{{ isEn ? 'List Name:' : '名單名稱：' }}</label>
        <input 
          v-model="newListName"
          type="text"
          :placeholder="isEn ? 'e.g. Class A' : '例如：A班學生'"
          class="input-name"
        >

        <label>{{ isEn ? 'Members (one per line):' : '成員名單（每行一個）：' }}</label>
        <textarea 
          v-model="newListMembers"
          :placeholder="isEn ? 'e.g. Alice\nBob\nCharlie' : '例如：Alice\nBob\nCharlie'"
          class="textarea-members"
        ></textarea>

        <div class="hint">💡 {{ isEn ? 'Members: ' : '成員數：' }}{{ newMembers.length }}</div>

        <div class="button-group">
          <button @click="createNewList" class="btn-primary" :disabled="!newListName.trim() || newMembers.length === 0">
            {{ isEn ? 'Create' : '建立' }} ➕
          </button>
          <button @click="resetForm" class="btn-secondary">
            {{ isEn ? 'Clear' : '清空' }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- 名單列表 -->
    <Transition name="fade">
      <div v-if="!editingList" class="lists-panel">
        <h3>{{ isEn ? 'Saved Lists' : '已儲存的名單' }}</h3>

        <div v-if="memberLists.length === 0" class="empty-state">
          <p>{{ isEn ? 'No lists created yet' : '還沒有建立名單' }}</p>
        </div>

        <div v-else class="lists-grid">
          <div 
            v-for="list in memberLists" 
            :key="list.id"
            class="list-card"
          >
            <div class="list-name">{{ list.name }}</div>
            <div class="list-count">
              👥 {{ list.members.length }} {{ isEn ? 'members' : '人' }}
            </div>
            <div class="list-preview">
              <div v-for="(member, idx) in list.members.slice(0, 3)" :key="idx" class="preview-member">
                {{ member }}
              </div>
              <div v-if="list.members.length > 3" class="preview-more">
                +{{ list.members.length - 3 }}
              </div>
            </div>
            <div class="list-actions">
              <button @click="editList(list)" class="btn-action btn-edit">{{ isEn ? 'Edit' : '編輯' }}</button>
              <button @click="deleteList(list.id)" class="btn-action btn-delete">{{ isEn ? 'Delete' : '刪除' }}</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 編輯名單面板 -->
    <Transition name="fade">
      <div v-if="editingList" class="edit-panel">
        <h3>{{ isEn ? 'Edit List' : '編輯名單' }}</h3>

        <label>{{ isEn ? 'List Name:' : '名單名稱：' }}</label>
        <input 
          v-model="editingList.name"
          type="text"
          class="input-name"
        >

        <label>{{ isEn ? 'Members (one per line):' : '成員名單（每行一個）：' }}</label>
        <textarea 
          v-model="editListMembers"
          class="textarea-members"
        ></textarea>

        <div class="hint">💡 {{ isEn ? 'Members: ' : '成員數：' }}{{ editMembers.length }}</div>

        <div class="button-group">
          <button @click="saveEditedList" class="btn-primary">
            {{ isEn ? 'Save' : '儲存' }} 💾
          </button>
          <button @click="cancelEdit" class="btn-secondary">
            {{ isEn ? 'Cancel' : '取消' }}
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

const newListName = ref('')
const newListMembers = ref('')
const editingList = ref(null)
const editListMembers = ref('')
const memberLists = ref(JSON.parse(localStorage.getItem('memberLists')) || [])

const history = useHistory()
const i18n = useI18n()
const isEn = computed(() => i18n.locale.value === 'en')

const newMembers = computed(() => {
  return newListMembers.value
    .split('\n')
    .map(m => m.trim())
    .filter(m => m)
})

const editMembers = computed(() => {
  return editListMembers.value
    .split('\n')
    .map(m => m.trim())
    .filter(m => m)
})

const createNewList = () => {
  if (!newListName.value.trim() || newMembers.value.length === 0) return

  const newList = {
    id: Date.now(),
    name: newListName.value,
    members: newMembers.value,
    createdAt: new Date().toLocaleString('zh-TW')
  }

  memberLists.value.push(newList)
  saveLists()
  resetForm()
}

const editList = (list) => {
  editingList.value = { ...list }
  editListMembers.value = list.members.join('\n')
}

const cancelEdit = () => {
  editingList.value = null
  editListMembers.value = ''
}

const saveEditedList = () => {
  if (!editingList.value || !editingList.value.name.trim() || editMembers.value.length === 0) return

  const index = memberLists.value.findIndex(l => l.id === editingList.value.id)
  if (index !== -1) {
    memberLists.value[index].name = editingList.value.name
    memberLists.value[index].members = editMembers.value
    memberLists.value[index].updatedAt = new Date().toLocaleString('zh-TW')
    saveLists()
  }

  editingList.value = null
  editListMembers.value = ''
}

const deleteList = (id) => {
  if (confirm(isEn.value ? 'Delete this list?' : '確定要刪除此名單嗎?')) {
    memberLists.value = memberLists.value.filter(l => l.id !== id)
    saveLists()
  }
}

const resetForm = () => {
  newListName.value = ''
  newListMembers.value = ''
}

const saveLists = () => {
  localStorage.setItem('memberLists', JSON.stringify(memberLists.value))
}

// 監聽語言變更，保存當前狀態
watch(() => i18n.locale.value, () => {
  // 確保language-changed時數據被保存
}, { flush: 'post' })
</script>

<style scoped>
.memberlist-container {
  max-width: 1200px;
  margin: 0 auto;
  background: var(--card-bg);
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border);
}

.memberlist-container h2 {
  color: #fff;
  margin-top: 0;
}

.memberlist-container h3 {
  color: #e0e0e0;
  margin-top: 0;
}

.config-panel, .edit-panel {
  background: rgba(58, 130, 246, 0.05);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 25px;
}

.input-name {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: #1a2332;
  color: #fff;
  font-size: 15px;
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

.hint {
  color: #9ca3af;
  font-size: 13px;
  margin-bottom: 15px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #9ca3af;
  font-size: 16px;
}

.lists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 15px;
  margin-bottom: 25px;
}

.list-card {
  background: linear-gradient(135deg, #2a3f5f, #1f2937);
  border: 2px solid #3b82f6;
  border-radius: 10px;
  padding: 15px;
  transition: all 0.3s ease;
}

.list-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
  border-color: #60a5fa;
}

.list-name {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8px;
  word-break: break-word;
}

.list-count {
  font-size: 13px;
  color: #9ca3af;
  margin-bottom: 10px;
}

.list-preview {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 12px;
  max-height: 150px;
  overflow-y: auto;
}

.preview-member {
  font-size: 12px;
  color: #d1d5db;
  padding: 4px 0;
  border-bottom: 1px solid rgba(75, 85, 99, 0.3);
}

.preview-member:last-child {
  border-bottom: none;
}

.preview-more {
  font-size: 12px;
  color: #3b82f6;
  padding: 4px 0;
  font-weight: 600;
}

.list-actions {
  display: flex;
  gap: 8px;
}

.btn-action {
  flex: 1;
  padding: 8px 10px !important;
  font-size: 12px !important;
  border-radius: 6px !important;
  transition: all 0.3s ease;
}

.btn-edit {
  background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
}

.btn-edit:hover {
  background: linear-gradient(135deg, #60a5fa, #3b82f6) !important;
}

.btn-delete {
  background: linear-gradient(135deg, #ef4444, #dc2626) !important;
}

.btn-delete:hover {
  background: linear-gradient(135deg, #f87171, #ef4444) !important;
}

.button-group {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
