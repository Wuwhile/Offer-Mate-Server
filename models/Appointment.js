const pool = require('../config/database');

class Appointment {
  /**
   * 保存预约申请
   */
  static async create(data) {
    const {
      userId,
      doctorId,
      doctorName,
      patientName,
      patientAge,
      patientGender,
      patientPhone,
      consultationContent,
      urgency,
      timePreference
    } = data;

    const sql = `
      INSERT INTO appointments 
      (user_id, doctor_id, doctor_name, patient_name, patient_age, patient_gender, patient_phone, consultation_content, urgency, time_preference)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const [result] = await pool.execute(sql, [
        userId,
        doctorId,
        doctorName,
        patientName,
        patientAge,
        patientGender,
        patientPhone,
        consultationContent,
        urgency,
        timePreference
      ]);
      return result.insertId;
    } catch (error) {
      console.error('保存预约申请失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有预约列表
   */
  static async findAll() {
    const sql = `
      SELECT 
        id,
        doctor_id as doctorId,
        doctor_name as doctorName,
        patient_name as patientName,
        patient_age as patientAge,
        patient_gender as patientGender,
        patient_phone as patientPhone,
        consultation_content as consultationContent,
        urgency,
        time_preference as timePreference,
        status,
        created_at as createTime
      FROM appointments
      ORDER BY created_at DESC
    `;

    try {
      const [rows] = await pool.execute(sql);
      return rows;
    } catch (error) {
      console.error('查询预约列表失败:', error);
      throw error;
    }
  }

  /**
   * 根据医生 ID 获取预约列表
   */
  static async findByDoctorId(doctorId) {
    const sql = `
      SELECT 
        id,
        doctor_id as doctorId,
        doctor_name as doctorName,
        patient_name as patientName,
        patient_age as patientAge,
        patient_gender as patientGender,
        patient_phone as patientPhone,
        consultation_content as consultationContent,
        urgency,
        time_preference as timePreference,
        status,
        created_at as createTime
      FROM appointments
      WHERE doctor_id = ?
      ORDER BY created_at DESC
    `;

    try {
      const [rows] = await pool.execute(sql, [doctorId]);
      return rows;
    } catch (error) {
      console.error('查询医生预约列表失败:', error);
      throw error;
    }
  }

  /**
   * 根据患者电话获取预约列表
   */
  static async findByPatientPhone(patientPhone) {
    const sql = `
      SELECT 
        id,
        doctor_id as doctorId,
        doctor_name as doctorName,
        patient_name as patientName,
        patient_age as patientAge,
        patient_gender as patientGender,
        patient_phone as patientPhone,
        consultation_content as consultationContent,
        urgency,
        time_preference as timePreference,
        status,
        created_at as createTime
      FROM appointments
      WHERE patient_phone = ?
      ORDER BY created_at DESC
    `;

    try {
      const [rows] = await pool.execute(sql, [patientPhone]);
      return rows;
    } catch (error) {
      console.error('查询患者预约列表失败:', error);
      throw error;
    }
  }

  /**
   * 根据用户 ID 获取预约列表
   */
  static async findByUserId(userId) {
    const sql = `
      SELECT 
        id,
        user_id as userId,
        doctor_id as doctorId,
        doctor_name as doctorName,
        patient_name as patientName,
        patient_age as patientAge,
        patient_gender as patientGender,
        patient_phone as patientPhone,
        consultation_content as consultationContent,
        urgency,
        time_preference as timePreference,
        status,
        created_at as createTime
      FROM appointments
      WHERE user_id = ?
      ORDER BY created_at DESC
    `;

    try {
      const [rows] = await pool.execute(sql, [userId]);
      return rows;
    } catch (error) {
      console.error('查询用户预约列表失败:', error);
      throw error;
    }
  }

  /**
   * 根据 ID 获取预约详情
   */
  static async findById(id) {
    const sql = `
      SELECT 
        id,
        user_id as userId,
        doctor_id as doctorId,
        doctor_name as doctorName,
        patient_name as patientName,
        patient_age as patientAge,
        patient_gender as patientGender,
        patient_phone as patientPhone,
        consultation_content as consultationContent,
        urgency,
        time_preference as timePreference,
        status,
        notes,
        created_at as createTime
      FROM appointments
      WHERE id = ?
    `;

    try {
      const [rows] = await pool.execute(sql, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('查询预约详情失败:', error);
      throw error;
    }
  }

  /**
   * 更新预约申请
   */
  static async update(id, data) {
    const {
      status,
      notes,
      timePreference
    } = data;

    const sql = `
      UPDATE appointments 
      SET status = ?, notes = ?, time_preference = ?
      WHERE id = ?
    `;

    try {
      const [result] = await pool.execute(sql, [status, notes, timePreference, id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('更新预约申请失败:', error);
      throw error;
    }
  }

  /**
   * 删除预约申请
   */
  static async deleteById(id) {
    const sql = 'DELETE FROM appointments WHERE id = ?';

    try {
      const [result] = await pool.execute(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('删除预约申请失败:', error);
      throw error;
    }
  }

  /**
   * 获取预约统计
   */
  static async count(filters = {}) {
    let sql = 'SELECT COUNT(*) as count FROM appointments WHERE 1=1';
    const params = [];

    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.doctorId) {
      sql += ' AND doctor_id = ?';
      params.push(filters.doctorId);
    }

    try {
      const [rows] = await pool.execute(sql, params);
      return rows[0].count;
    } catch (error) {
      console.error('统计预约数失败:', error);
      throw error;
    }
  }
}

module.exports = Appointment;
