const pool = require('../config/database');

class LoginLog {
  /**
   * 记录登录日志
   */
  static async create(loginData) {
    const { user_id, ip_address, device_info, user_agent } = loginData;
    
    const conn = await pool.getConnection();
    try {
      const [result] = await conn.execute(
        'INSERT INTO login_logs (user_id, ip_address, device_info, user_agent) VALUES (?, ?, ?, ?)',
        [user_id, ip_address, device_info || 'Unknown', user_agent || '']
      );
      return { id: result.insertId, user_id, ip_address };
    } finally {
      conn.release();
    }
  }

  /**
   * 获取用户的登录历史（分页）
   */
  static async findByUserId(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute(
        'SELECT id, user_id, ip_address, device_info, user_agent, login_time FROM login_logs WHERE user_id = ? ORDER BY login_time DESC LIMIT ? OFFSET ?',
        [userId, limit, offset]
      );
      
      // 获取总数
      const [countResult] = await conn.execute(
        'SELECT COUNT(*) as total FROM login_logs WHERE user_id = ?',
        [userId]
      );
      
      return {
        data: rows,
        total: countResult[0].total,
        page,
        limit,
        pages: Math.ceil(countResult[0].total / limit)
      };
    } finally {
      conn.release();
    }
  }

  /**
   * 获取最近的登录记录
   */
  static async findLatest(userId, limit = 5) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute(
        'SELECT id, user_id, ip_address, device_info, user_agent, login_time FROM login_logs WHERE user_id = ? ORDER BY login_time DESC LIMIT ?',
        [userId, limit]
      );
      return rows;
    } finally {
      conn.release();
    }
  }

  /**
   * 删除指定的登录日志
   */
  static async deleteById(id, userId) {
    const conn = await pool.getConnection();
    try {
      const [result] = await conn.execute(
        'DELETE FROM login_logs WHERE id = ? AND user_id = ?',
        [id, userId]
      );
      return result.affectedRows > 0;
    } finally {
      conn.release();
    }
  }

  /**
   * 删除用户所有登录日志
   */
  static async deleteByUserId(userId) {
    const conn = await pool.getConnection();
    try {
      const [result] = await conn.execute(
        'DELETE FROM login_logs WHERE user_id = ?',
        [userId]
      );
      return result.affectedRows;
    } finally {
      conn.release();
    }
  }
}

module.exports = LoginLog;
