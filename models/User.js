const bcrypt = require('bcryptjs');
const pool = require('../config/database');

class User {
  /**
   * 创建用户
   */
  static async create(userData) {
    const { username, password, phone, email } = userData;
    
    // 密码哈希处理
    const hashedPassword = await bcrypt.hash(password, 10);

    const conn = await pool.getConnection();
    try {
      const [result] = await conn.execute(
        'INSERT INTO users (username, password, phone, email) VALUES (?, ?, ?, ?)',
        [username, hashedPassword, phone, email]
      );
      return { id: result.insertId, username, phone, email };
    } finally {
      conn.release();
    }
  }

  /**
   * 根据用户名查找用户
   */
  static async findByUsername(username) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );
      return rows.length > 0 ? rows[0] : null;
    } finally {
      conn.release();
    }
  }

  /**
   * 根据手机号查找用户
   */
  static async findByPhone(phone) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute(
        'SELECT * FROM users WHERE phone = ?',
        [phone]
      );
      return rows.length > 0 ? rows[0] : null;
    } finally {
      conn.release();
    }
  }

  /**
   * 根据用户名或手机号查找用户
   */
  static async findByUsernameOrPhone(usernameOrPhone) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute(
        'SELECT * FROM users WHERE username = ? OR phone = ?',
        [usernameOrPhone, usernameOrPhone]
      );
      return rows.length > 0 ? rows[0] : null;
    } finally {
      conn.release();
    }
  }

  /**
   * 根据ID查找用户
   */
  static async findById(id) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute(
        'SELECT id, username, phone, email, avatar_url, created_at FROM users WHERE id = ?',
        [id]
      );
      if (rows.length > 0) {
        const user = rows[0];
        user.uid = 100000000 + user.id;
        return user;
      }
      return null;
    } finally {
      conn.release();
    }
  }

  /**
   * 验证密码
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * 更新用户信息
   */
  static async update(id, userData) {
    const conn = await pool.getConnection();
    try {
      // 动态构建UPDATE语句，只更新提供的字段
      const fields = [];
      const values = [];
      
      if (userData.username !== undefined) {
        fields.push('username = ?');
        values.push(userData.username);
      }
      if (userData.phone !== undefined) {
        fields.push('phone = ?');
        values.push(userData.phone);
      }
      if (userData.email !== undefined) {
        fields.push('email = ?');
        values.push(userData.email);
      }
      if (userData.avatar_url !== undefined) {
        fields.push('avatar_url = ?');
        values.push(userData.avatar_url);
      }

      if (fields.length === 0) {
        return await this.findById(id);
      }

      values.push(id);
      const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
      
      await conn.execute(sql, values);
      return await this.findById(id);
    } finally {
      conn.release();
    }
  }

  /**
   * 删除用户
   */
  static async delete(id) {
    const conn = await pool.getConnection();
    try {
      await conn.execute('DELETE FROM users WHERE id = ?', [id]);
      return true;
    } finally {
      conn.release();
    }
  }

  /**
   * 修改密码
   */
  static async changePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const conn = await pool.getConnection();
    try {
      const [result] = await conn.execute(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, id]
      );
      return result.affectedRows > 0;
    } finally {
      conn.release();
    }
  }

  /**
   * 更新头像URL
   */
  static async updateAvatar(id, avatarUrl) {
    const conn = await pool.getConnection();
    try {
      const [result] = await conn.execute(
        'UPDATE users SET avatar_url = ? WHERE id = ?',
        [avatarUrl, id]
      );
      return result.affectedRows > 0;
    } finally {
      conn.release();
    }
  }
}

module.exports = User;
