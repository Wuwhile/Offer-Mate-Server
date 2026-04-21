-- 创建数据库
CREATE DATABASE IF NOT EXISTS warm_mate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE warm_mate;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
  username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
  password VARCHAR(255) NOT NULL COMMENT '密码（加密存储）',
  phone VARCHAR(20) NOT NULL COMMENT '手机号',
  email VARCHAR(100) COMMENT '邮箱',
  avatar_url LONGTEXT COMMENT '头像URL（Base64编码）',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_username (username),
  INDEX idx_phone (phone),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 问卷结果表
CREATE TABLE IF NOT EXISTS questionnaire_results (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '问卷结果ID',
  user_id INT NOT NULL COMMENT '用户ID',
  questionnaire_name VARCHAR(100) NOT NULL COMMENT '问卷名称（如PHQ-9）',
  questionnaire_type VARCHAR(50) NOT NULL COMMENT '问卷类型（phq9, gad7等）',
  score INT COMMENT '问卷总得分',
  depression_level VARCHAR(50) COMMENT '严重程度等级（无、轻度、中度、重度等）',
  level_description TEXT COMMENT '等级描述',
  result_data JSON COMMENT '问卷详细数据',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_type (questionnaire_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='问卷结果表';

-- 消息表
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '消息ID',
  user_id INT NOT NULL COMMENT '用户ID',
  content TEXT NOT NULL COMMENT '消息内容',
  message_type VARCHAR(20) DEFAULT 'text' COMMENT '消息类型',
  read_status INT DEFAULT 0 COMMENT '已读状态（0未读，1已读）',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息表';

-- 登录日志表
CREATE TABLE IF NOT EXISTS login_logs (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '登录日志ID',
  user_id INT NOT NULL COMMENT '用户ID',
  ip_address VARCHAR(45) COMMENT 'IP地址',
  device_info VARCHAR(255) COMMENT '设备信息',
  user_agent TEXT COMMENT 'User Agent信息',
  login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '登录时间',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_login_time (login_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='登录日志表';

-- 创建应用用户（用于应用连接）
CREATE USER IF NOT EXISTS 'warmmate'@'localhost' IDENTIFIED BY 'warmmate123@';
GRANT ALL PRIVILEGES ON warm_mate.* TO 'warmmate'@'localhost';
FLUSH PRIVILEGES;

-- 允许远程连接的用户（生产环境请修改IP和密码）
CREATE USER IF NOT EXISTS 'warmmate'@'%' IDENTIFIED BY 'warmmate123@';
GRANT ALL PRIVILEGES ON warm_mate.* TO 'warmmate'@'%';
FLUSH PRIVILEGES;
