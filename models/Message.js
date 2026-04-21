const db = require('../config/database');

class Message {
  /**
   * 创建消息
   */
  static async create(messageData) {
    try {
      const { userId, conversationId, content, messageType = 'text', fromUserId = 0 } = messageData;
      const sql = `
        INSERT INTO messages (user_id, conversation_id, from_user_id, content, message_type, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
      `;
      
      const [result] = await db.execute(sql, [userId, conversationId, fromUserId, content, messageType]);
      
      return {
        id: result.insertId,
        userId,
        conversationId,
        content,
        messageType,
        fromUserId,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('创建消息错误:', error);
      throw error;
    }
  }

  /**
   * 根据用户 ID 获取消息列表（分页）
   * 只查询属于此用户的消息（包括用户发送和AI回复）
   */
  static async findByUserId(userId, current = 1, size = 20) {
    try {
      const offset = (current - 1) * size;
      
      // 获取此用户的消息总数
      const [countResult] = await db.execute(
        'SELECT COUNT(*) as total FROM messages WHERE user_id = ?',
        [userId]
      );
      const total = countResult[0].total;

      // 获取此用户的分页消息数据（按创建时间降序）
      const sql = `
        SELECT id, user_id, from_user_id as fromUserId, content as msgContent, message_type as msgType, read_status, created_at as time
        FROM messages
        WHERE user_id = ?
        ORDER BY created_at DESC
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
      console.error('获取消息列表错误:', error);
      throw error;
    }
  }

  /**
   * 根据消息 ID 获取消息详情
   */
  static async findById(messageId) {
    try {
      const sql = `
        SELECT id, user_id, from_user_id as fromUserId, content as msgContent, message_type as msgType, read_status, created_at as time
        FROM messages
        WHERE id = ?
        LIMIT 1
      `;
      
      const [results] = await db.execute(sql, [messageId]);
      return results[0] || null;
    } catch (error) {
      console.error('获取消息详情错误:', error);
      throw error;
    }
  }

  /**
   * 删除消息
   */
  static async deleteById(messageId) {
    try {
      const sql = 'DELETE FROM messages WHERE id = ?';
      const [result] = await db.execute(sql, [messageId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('删除消息错误:', error);
      throw error;
    }
  }

  /**
   * 批量删除消息
   */
  static async deleteByIds(messageIds) {
    try {
      if (!Array.isArray(messageIds) || messageIds.length === 0) {
        return false;
      }

      const placeholders = messageIds.map(() => '?').join(',');
      const sql = `DELETE FROM messages WHERE id IN (${placeholders})`;
      const [result] = await db.execute(sql, messageIds);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('批量删除消息错误:', error);
      throw error;
    }
  }

  /**
   * 清空用户的所有消息
   */
  static async clearByUserId(userId) {
    try {
      const sql = 'DELETE FROM messages WHERE user_id = ?';
      const [result] = await db.execute(sql, [userId]);
      return result.affectedRows;
    } catch (error) {
      console.error('清空消息错误:', error);
      throw error;
    }
  }

  /**
   * 根据对话ID获取消息列表（分页）
   */
  static async findByConversationId(conversationId, current = 1, size = 20) {
    try {
      const offset = (current - 1) * size;
      
      // 获取总数
      const [countResult] = await db.execute(
        'SELECT COUNT(*) as total FROM messages WHERE conversation_id = ?',
        [conversationId]
      );
      const total = countResult[0].total;

      // 获取分页数据
      const sql = `
        SELECT id, user_id, conversation_id, from_user_id as fromUserId, content as msgContent, message_type as msgType, read_status, created_at as time
        FROM messages
        WHERE conversation_id = ?
        ORDER BY created_at DESC
        LIMIT ?, ?
      `;
      
      const [records] = await db.execute(sql, [conversationId, offset, size]);
      
      const pages = Math.ceil(total / size);
      
      return {
        records,
        total,
        size,
        current,
        pages
      };
    } catch (error) {
      console.error('获取对话消息列表错误:', error);
      throw error;
    }
  }
}

module.exports = Message;
