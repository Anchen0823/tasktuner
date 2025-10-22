const sequelize = require('./src/config/database');

async function createNoteLikesTable() {
  try {
    // 创建 note_likes 表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS note_likes (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        userId INTEGER NOT NULL,
        noteId INTEGER NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_note (userId, noteId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    
    console.log('✅ note_likes 表创建成功');
    
    // 创建索引 (MySQL语法)
    try {
      await sequelize.query(`
        CREATE INDEX idx_note_likes_user_id ON note_likes(userId);
      `);
    } catch (error) {
      if (!error.message.includes('Duplicate key name')) {
        console.error('创建userId索引失败:', error.message);
      }
    }
    
    try {
      await sequelize.query(`
        CREATE INDEX idx_note_likes_note_id ON note_likes(noteId);
      `);
    } catch (error) {
      if (!error.message.includes('Duplicate key name')) {
        console.error('创建noteId索引失败:', error.message);
      }
    }
    
    console.log('✅ 索引创建成功');
    
  } catch (error) {
    console.error('❌ 创建表失败:', error);
  } finally {
    await sequelize.close();
  }
}

// 直接运行脚本时执行
if (require.main === module) {
  createNoteLikesTable();
}

module.exports = createNoteLikesTable; 