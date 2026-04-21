# 🗄️ 数据库模式文档

Warm-Mate 数据库完整模式说明。

---

## 📊 数据库概览

- **数据库名**: `warm_mate`
- **字符集**: `utf8mb4` (支持emoji和所有Unicode字符)
- **表数量**: 6张
- **关键特性**: 外键约束、事务支持、自动时间戳

---

## 所有表的描述

### 1. users 用户表

存储所有注册用户的基本信息。

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100),
  avatar_url LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_phone (phone),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**字段说明**:

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `id` | INT | 用户ID（主键）| 1, 2, 3... |
| `username` | VARCHAR(50) | 用户名（唯一）| "张三" |
| `password` | VARCHAR(255) | 密码（bcrypt加密）| $2b$10$... |
| `phone` | VARCHAR(20) | 手机号 | 13800138000 |
| `email` | VARCHAR(100) | 邮箱（可选）| user@example.com |
| `avatar_url` | LONGTEXT | 头像Base64编码 | data:image/png;base64,... |
| `created_at` | TIMESTAMP | 创建时间 | 2026-03-25 10:30:00 |
| `updated_at` | TIMESTAMP | 更新时间 | 2026-03-25 11:00:00 |

**索引**:
- `idx_username`: 按用户名快速查询
- `idx_phone`: 按手机号快速查询
- `idx_created_at`: 按时间排序

**关键约束**:
- username 和 phone 都是 UNIQUE（唯一）

---

### 2. login_logs 登录日志表

记录每次用户登录信息，用于安全审计。

```sql
CREATE TABLE login_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  ip_address VARCHAR(45),
  device_info VARCHAR(255),
  user_agent TEXT,
  login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_login_time (login_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**字段说明**:

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `id` | INT | 日志ID（主键）| 1 |
| `user_id` | INT | 用户ID（外键）| 1 |
| `ip_address` | VARCHAR(45) | 登录IP（IPv4/IPv6）| 192.168.1.100 |
| `device_info` | VARCHAR(255) | 设备信息 | "iPhone 14 - Safari" |
| `user_agent` | TEXT | User Agent字符串 | "Mozilla/5.0..." |
| `login_time` | TIMESTAMP | 登录时间 | 2026-03-25 10:30:00 |

**关系**:
- 外键 `user_id` 关联 `users(id)`
- 用户删除时自动删除其所有登录日志（ON DELETE CASCADE）

---

### 3. conversations AI对话表

存储用户与AI的对话记录。

```sql
CREATE TABLE conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**字段说明**:

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `id` | INT | 对话ID（主键）| 1 |
| `user_id` | INT | 用户ID（外键）| 1 |
| `title` | VARCHAR(255) | 对话标题 | "焦虑症咨询" |
| `created_at` | TIMESTAMP | 创建时间 | 2026-03-25 10:30:00 |
| `updated_at` | TIMESTAMP | 最后更新时间 | 2026-03-25 11:00:00 |

**关系**:
- 每个对话属于一个用户
- 用户删除时对话和相关消息都被删除

---

### 4. messages 对话消息表

存储对话中的所有消息（用户消息和AI回复）。

```sql
CREATE TABLE messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  conversation_id INT NOT NULL,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_conversation_id (conversation_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**字段说明**:

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `id` | INT | 消息ID（主键）| 1 |
| `user_id` | INT | 用户ID（外键）| 1 |
| `conversation_id` | INT | 对话ID（外键）| 1 |
| `content` | TEXT | 消息内容 | "我最近感到很焦虑..." |
| `message_type` | VARCHAR(20) | 消息类型 | "text" (当前仅支持) |
| `created_at` | TIMESTAMP | 创建时间 | 2026-03-25 10:30:00 |

**备注**:
- `user_id = 0` 时表示AI消息
- `user_id > 0` 时表示用户消息

**关系**:
- 关联 conversations 表（ON DELETE CASCADE）
- 用户删除时消息也被删除

---

### 5. appointments 心理预约表

存储用户的心理咨询预约信息。

```sql
CREATE TABLE appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  doctor_id INT,
  doctor_name VARCHAR(100),
  patient_name VARCHAR(100),
  patient_age INT,
  patient_gender VARCHAR(10),
  patient_phone VARCHAR(20),
  consultation_content TEXT,
  urgency VARCHAR(50),
  time_preference VARCHAR(255),
  status VARCHAR(50) DEFAULT '待处理',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**字段说明**:

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `id` | INT | 预约ID（主键）| 1 |
| `user_id` | INT | 用户ID（外键）| 1 |
| `doctor_id` | INT | 医生ID | 1 |
| `doctor_name` | VARCHAR(100) | 医生名称 | "陈医生" |
| `patient_name` | VARCHAR(100) | 患者名称 | "张三" |
| `patient_age` | INT | 患者年龄 | 28 |
| `patient_gender` | VARCHAR(10) | 性别 | "男" / "女" |
| `patient_phone` | VARCHAR(20) | 联系电话 | 13800138000 |
| `consultation_content` | TEXT | 咨询内容 | "焦虑症治疗" |
| `urgency` | VARCHAR(50) | 紧急程度 | "较急" / "普通" |
| `time_preference` | VARCHAR(255) | 时间偏好 | "周末下午" |
| `status` | VARCHAR(50) | 预约状态 | "待处理" / "已确认" / "已完成" / "已取消" |
| `notes` | TEXT | 备注 | "需要特殊关照" |
| `created_at` | TIMESTAMP | 创建时间 | 2026-03-25 10:30:00 |
| `updated_at` | TIMESTAMP | 更新时间 | 2026-03-25 11:00:00 |

**状态枚举**:
- `待处理` - 初始状态，医生未确认
- `已确认` - 医生已确认预约时间
- `已完成` - 咨询已完成
- `已取消` - 用户或医生取消预约

---

### 6. questionnaire_results 问卷结果表

存储用户的问卷评估结果。

```sql
CREATE TABLE questionnaire_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  questionnaire_name VARCHAR(100) NOT NULL,
  questionnaire_type VARCHAR(50) NOT NULL,
  score INT,
  depression_level VARCHAR(50),
  level_description TEXT,
  result_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_type (questionnaire_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**字段说明**:

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `id` | INT | 结果ID（主键）| 1 |
| `user_id` | INT | 用户ID（外键）| 1 |
| `questionnaire_name` | VARCHAR(100) | 问卷名称 | "PHQ-9抑郁筛查量表" |
| `questionnaire_type` | VARCHAR(50) | 问卷类型 | "phq9" |
| `score` | INT | 总得分 | 12 |
| `depression_level` | VARCHAR(50) | 评分等级 | "轻度抑郁" |
| `level_description` | TEXT | 等级描述 | "您可能有轻度的抑郁..." |
| `result_data` | JSON | 详细数据 | {"answers": [1,2,1...], "categories": {...}} |
| `created_at` | TIMESTAMP | 创建时间 | 2026-03-25 10:30:00 |

**PHQ-9 评分对照**:

| 总分数 | 等级 | 描述 |
|--------|------|------|
| 0-4 | 无 | 无抑郁症状 |
| 5-9 | 轻度 | 轻度抑郁症状 |
| 10-14 | 中度 | 中等程度抑郁症状 |
| 15-19 | 中重度 | 中重度抑郁症状 |
| 20-27 | 重度 | 重度抑郁症状 |

---

## 🔗 表之间的关系

```
users (1)
  ├─── (1:N) ──→ login_logs
  ├─── (1:N) ──→ conversations
  │           └─── (1:N) ──→ messages
  ├─── (1:N) ──→ appointments
  └─── (1:N) ──→ questionnaire_results
```

---

## 数据流示例

### 场景1: 用户登录
1. 用户提交用户名和密码 → `/login`
2. 系统查询 `users` 表验证密码
3. 密码正确：生成JWT Token，新增一条 `login_logs` 记录
4. 返回token和用户信息给前端

### 场景2: 用户发送消息给AI
1. 用户发送消息 → `/message`
2. 验证token和用户身份
3. 新增消息到 `messages` 表（user_id = 实际用户ID）
4. 调用千问API得到AI回复
5. 新增回复消息到 `messages` 表（user_id = 0）
6. 返回两条消息给前端

### 场景3: 用户提交问卷
1. 用户提交问卷答案 → `/questionnaire/phq9`
2. 计算score和等级
3. 新增记录到 `questionnaire_results` 表
4. 返回评分结果和建议给用户

---

## 📈 数据考虑

### 数据量估计
- 假设10万用户，平均100条消息 → 1000万条消息记录
- 每条消息约500字节 → 5GB存储

### 性能优化建议
1. **消息表分区**: 按月份分表降低查询时间
2. **归档**: 将半年以上的数据归档
3. **索引优化**: 定期ANALYZE和OPTIMIZE
4. **缓存层**: 使用Redis缓存最近消息

### 备份策略
- **日备份**: 每日凌晨备份
- **周备份**: 每周备份保留1个月
- **月备份**: 每月备份保留1年
- **异地备份**: 关键数据备份到其他地域

---

## 🔒 数据安全

### 访问控制
- 密码字段加密存储（bcryptjs）
- API验证用户权限（JWT）
- 用户只能访问自己的数据

### 敏感数据
- `user_agent`: 可能包含设备标识，定期清理
- `avatar_url`: Base64码的图片，可能很大，考虑外储
- `result_data`: JSON字段包含问卷答案，需加密

---

## 初始化和迁移

### 初始化脚本
见 [sql/init.sql](sql/init.sql)

### 迁移脚本
位置: `sql/migrations/`

已执行迁移:
- `001_add_avatar_to_users.sql`
- `002_change_avatar_url_to_longtext.sql`
- `003_update_questionnaire_results_table.sql`
- `004_create_appointments_table.sql`
- `005_add_user_id_to_appointments.sql`

---

## 常用SQL操作

### 查询用户及相关数据
```sql
-- 查询用户及其最后登录
SELECT 
  u.id, u.username, u.phone,
  COUNT(DISTINCT ll.id) as login_count,
  MAX(ll.login_time) as last_login
FROM users u
LEFT JOIN login_logs ll ON u.id = ll.user_id
GROUP BY u.id
ORDER BY last_login DESC;
```

### 查询对话和消息统计
```sql
-- 查询用户对话数和消息数
SELECT 
  u.id, u.username,
  COUNT(DISTINCT c.id) as conversation_count,
  COUNT(DISTINCT m.id) as message_count
FROM users u
LEFT JOIN conversations c ON u.id = c.user_id
LEFT JOIN messages m ON c.id = m.conversation_id
GROUP BY u.id;
```

### 清理旧登录日志
```sql
-- 删除30天前的登录日志
DELETE FROM login_logs 
WHERE login_time < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

---

**更新日期**: 2026-03-25
