const pool = require('./config/database');

async function createTables() {
  try {
    const createAppointments = `
      CREATE TABLE IF NOT EXISTS appointments (
        id INT AUTO_INCREMENT PRIMARY KEY COMMENT '预约ID',
        user_id INT NOT NULL COMMENT '用户ID',
        doctor_id VARCHAR(50) COMMENT '医生或导师ID',
        doctor_name VARCHAR(100) COMMENT '医生或导师姓名',
        patient_name VARCHAR(100) NOT NULL COMMENT '预约人姓名',
        patient_age INT COMMENT '预约人年龄',
        patient_gender VARCHAR(20) COMMENT '预约人性别',
        patient_phone VARCHAR(20) NOT NULL COMMENT '联系电话',
        consultation_content TEXT COMMENT '咨询内容描述',
        urgency VARCHAR(20) COMMENT '紧急程度',
        time_preference VARCHAR(50) COMMENT '期望时间',
        status VARCHAR(20) DEFAULT 'pending' COMMENT '预约状态 (pending, confirmed, completed, cancelled)',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预约记录表';
    `;

    // 顺便补上 conversations 相关的如果没有的话
    const createConversations = `
      CREATE TABLE IF NOT EXISTS conversations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await pool.query(createAppointments);
    console.log('Appointments table created or already exists.');
    
    try {
      await pool.query(createConversations);
      console.log('Conversations table created or already exists.');
    } catch (e) {
      console.log('Error creating conversations: ', e.message);
    }
    
    // 如果之前的 messages 表缺少 conversation_id，我们需要补上：
    try {
        await pool.query("ALTER TABLE messages ADD COLUMN conversation_id INT AFTER user_id");
        console.log('Added conversation_id to messages.');
    } catch (e) {
        if(e.code === 'ER_DUP_FIELDNAME') {
            console.log('conversation_id already exists in messages.');
        } else {
            console.log('Error altering messages: ', e.message);
        }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

createTables();
