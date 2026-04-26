// 记录管理系统
export const recordManager = {
  // 保存记录到localStorage
  saveRecord(category, recordName, data) {
    const records = this.getRecords(category);
    const timestamp = new Date().toISOString();
    records[recordName] = {
      ...data,
      name: recordName,
      timestamp,
      updatedAt: timestamp
    };
    localStorage.setItem(`records_${category}`, JSON.stringify(records));
    return records[recordName];
  },

  // 获取某类别的所有记录
  getRecords(category) {
    const stored = localStorage.getItem(`records_${category}`);
    return stored ? JSON.parse(stored) : {};
  },

  // 获取单个记录
  getRecord(category, recordName) {
    const records = this.getRecords(category);
    return records[recordName] || null;
  },

  // 更新记录
  updateRecord(category, recordName, data) {
    const records = this.getRecords(category);
    if (records[recordName]) {
      records[recordName] = {
        ...records[recordName],
        ...data,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(`records_${category}`, JSON.stringify(records));
      return records[recordName];
    }
    return null;
  },

  // 重命名记录
  renameRecord(category, oldName, newName) {
    const records = this.getRecords(category);
    if (records[oldName]) {
      const record = records[oldName];
      record.name = newName;
      records[newName] = record;
      delete records[oldName];
      localStorage.setItem(`records_${category}`, JSON.stringify(records));
      return record;
    }
    return null;
  },

  // 删除单个记录
  deleteRecord(category, recordName) {
    const records = this.getRecords(category);
    delete records[recordName];
    localStorage.setItem(`records_${category}`, JSON.stringify(records));
  },

  // 删除所有记录
  deleteAllRecords(category) {
    localStorage.removeItem(`records_${category}`);
  },

  // 删除所有类别的记录
  deleteAllCategoriesRecords() {
    localStorage.removeItem('records_scoreboard');
    localStorage.removeItem('records_quiz');
    localStorage.removeItem('records_vote');
    localStorage.removeItem('records_picker');
  },

  // 获取所有记录（所有类别）
  getAllRecords() {
    const categories = ['scoreboard', 'quiz', 'vote', 'picker'];
    const allRecords = {};
    categories.forEach(category => {
      allRecords[category] = this.getRecords(category);
    });
    return allRecords;
  }
};
