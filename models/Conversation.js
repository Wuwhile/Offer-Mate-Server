const db = require('../config/database');

class Conversation {
  /**
   * 创建对话会话
   */
  static async create(conversationData) {
    try {
      const { userId, title } = conversationData;
      const sql = `
        INSERT INTO conversations (user_id, title, created_at, updated_at)
        VALUES (?, ?, NOW(), NOW())
      `;
      
      const [result] = await db.execute(sql, [userId, title || '新对话']);
      
      return {
        id: result.insertId,
        userId,
        title: title || '新对话',
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('创建对话会话错误:', error);
      throw error;
    }
  }

  /**
   * 获取用户的所有对话会话（分页）
   */
  static async findByUserId(userId, current = 1, size = 20) {
    try {
      const offset = (current - 1) * size;
      
      // 获取总数
      const [countResult] = await db.execute(
        'SELECT COUNT(*) as total FROM conversations WHERE user_id = ?',
        [userId]
      );
      const total = countResult[0].total;

      // 获取分页数据
      const sql = `
        SELECT id, user_id, title, created_at as createdAt, updated_at as updatedAt
        FROM conversations
        WHERE user_id = ?
        ORDER BY updated_at DESC
        LIMIT ?, ?
      `;
      
      const [records] = await db.execute(sql, [userId, offset, size]);
      
      const pages = Math.ceil(total / size);
      
      return {
        records,
        total,
        size,
        current,
        pages
      };
    } catch (error) {
      console.error('获取对话会话列表错误:', error);
      throw error;
    }
  }

  /**
   * 获取对话详情
   */
  static async findById(conversationId) {
    try {
      const sql = `
        SELECT id, user_id, title, created_at as createdAt, updated_at as updatedAt
        FROM conversations
        WHERE id = ?
        LIMIT 1
      `;
      
      const [results] = await db.execute(sql, [conversationId]);
      return results[0] || null;
    } catch (error) {
      console.error('获取对话详情错误:', error);
      throw error;
    }
  }

  /**
   * 删除对话
   */
  static async deleteById(conversationId) {
    try {
      const sql = 'DELETE FROM conversations WHERE id = ?';
      const [result] = await db.execute(sql, [conversationId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('删除对话错误:', error);
      throw error;
    }
  }

  /**
   * 更新对话标题
   */
  static async updateTitle(conversationId, title) {
    try {
      const sql = 'UPDATE conversations SET title = ?, updated_at = NOW() WHERE id = ?';
      const [result] = await db.execute(sql, [title, conversationId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('更新对话标题错误:', error);
      throw error;
    }
  }
}

module.exports = Conversation;
