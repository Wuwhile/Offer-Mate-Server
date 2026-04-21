const pool = require('../config/database');

class QuestionnaireResult {
  /**
   * 保存问卷结果
   */
  static async create(data) {
    const {
      userId,
      questionnaireName,
      questionnaireType,
      score,
      depressionLevel,
      levelDescription,
      resultData
    } = data;

    const sql = `
      INSERT INTO questionnaire_results 
      (user_id, type, questionnaire_name, questionnaire_type, score, depression_level, level_description, result_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const [result] = await pool.execute(sql, [
        userId,
        questionnaireType,
        questionnaireName,
        questionnaireType,
        score,
        depressionLevel,
        levelDescription,
        JSON.stringify(resultData || {})
      ]);
      return result.insertId;
    } catch (error) {
      console.error('保存问卷结果失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户的问卷结果列表
   */
  static async findByUserId(userId) {
    const sql = `
      SELECT 
        id,
        user_id as userId,
        questionnaire_name as questionnaireName,
        questionnaire_type as questionnaireType,
        score,
        depression_level as depressionLevel,
        level_description as levelDescription,
        result_data as resultData,
        created_at as createTime
      FROM questionnaire_results
      WHERE user_id = ?
      ORDER BY created_at DESC
    `;

    try {
      const [rows] = await pool.execute(sql, [userId]);
      return rows.map(row => ({
        ...row,
        resultData: typeof row.resultData === 'string' ? JSON.parse(row.resultData) : row.resultData
      }));
    } catch (error) {
      console.error('查询用户问卷结果失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户最新的问卷结果
   */
  static async findLatestByUserId(userId) {
    const sql = `
      SELECT 
        id,
        user_id as userId,
        questionnaire_name as questionnaireName,
        questionnaire_type as questionnaireType,
        score,
        depression_level as depressionLevel,
        level_description as levelDescription,
        result_data as resultData,
        created_at as createTime
      FROM questionnaire_results
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `;

    try {
      const [rows] = await pool.execute(sql, [userId]);
      if (rows.length === 0) return null;
      const row = rows[0];
      return {
        ...row,
        resultData: typeof row.resultData === 'string' ? JSON.parse(row.resultData) : row.resultData
      };
    } catch (error) {
      console.error('查询最新问卷结果失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取问卷结果
   */
  static async findById(id) {
    const sql = `
      SELECT 
        id,
        user_id as userId,
        questionnaire_name as questionnaireName,
        questionnaire_type as questionnaireType,
        score,
        depression_level as depressionLevel,
        level_description as levelDescription,
        result_data as resultData,
        created_at as createTime
      FROM questionnaire_results
      WHERE id = ?
    `;

    try {
      const [rows] = await pool.execute(sql, [id]);
      if (rows.length === 0) return null;
      const row = rows[0];
      return {
        ...row,
        resultData: typeof row.resultData === 'string' ? JSON.parse(row.resultData) : row.resultData
      };
    } catch (error) {
      console.error('查询问卷结果失败:', error);
      throw error;
    }
  }

  /**
   * 删除问卷结果
   */
  static async deleteById(id) {
    const sql = 'DELETE FROM questionnaire_results WHERE id = ?';

    try {
      const [result] = await pool.execute(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('删除问卷结果失败:', error);
      throw error;
    }
  }

  /**
   * 批量删除问卷结果
   */
  static async deleteByIds(ids) {
    if (ids.length === 0) return false;

    const placeholders = ids.map(() => '?').join(',');
    const sql = `DELETE FROM questionnaire_results WHERE id IN (${placeholders})`;

    try {
      const [result] = await pool.execute(sql, ids);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('批量删除问卷结果失败:', error);
      throw error;
    }
  }

  /**
   * 统计问卷结果
   */
  static async count(userId = null) {
    let sql = 'SELECT COUNT(*) as count FROM questionnaire_results';
    const params = [];

    if (userId) {
      sql += ' WHERE user_id = ?';
      params.push(userId);
    }

    try {
      const [rows] = await pool.execute(sql, params);
      return rows[0].count;
    } catch (error) {
      console.error('统计问卷结果失败:', error);
      throw error;
    }
  }
}

module.exports = QuestionnaireResult;
