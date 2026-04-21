# 👨‍💻 开发者指南

如何在 Warm-Mate 项目上进行开发、扩展、以及贡献代码。

---

## 📁 项目架构

```
warm-mate-server/
├── app.js                 # Express应用入口
├── package.json          # 依赖配置
├── .env.example          # 环境变量示例
│
├── config/               # 配置层
│   └── database.js       # 数据库连接池
│
├── models/               # 数据层 (MVC-M)
│   ├── User.js           # 用户数据操作
│   ├── LoginLog.js       # 登录日志操作
│   ├── Conversation.js   # 对话数据操作
│   ├── Message.js        # 消息数据操作
│   ├── Appointment.js    # 预约数据操作
│   └── QuestionnaireResult.js # 问卷操作
│
├── controllers/          # 控制层 (MVC-C)
│   ├── userController.js        # 用户业务逻辑
│   ├── messageController.js     # 消息/AI业务
│   ├── conversationController.js # 对话业务
│   ├── appointmentController.js  # 预约业务
│   └── questionnaireController.js # 问卷业务
│
├── routes/               # 路由层 (MVC-V)
│   ├── auth.js          # 认证路由（register, login等）
│   ├── message.js       # 消息路由（/message）
│   ├── conversation.js  # 对话路由（/conversation）
│   ├── appointment.js   # 预约路由（/appointment）
│   └── questionnaire.js # 问卷路由（/questionnaire）
│
├── middleware/           # 中间件
│   └── auth.js          # JWT验证中间件
│
├── services/            # 业务服务层
│   ├── aiService.js     # 千问AI服务
│   └── smsService.js    # 短信服务
│
└── sql/                 # 数据库文件
    ├── init.sql         # 初始化脚本
    └── migrations/      # 迁移脚本
```

---

## 请求流程

```
请求 →  路由 (routes/) 
    →  中间件 (middleware/auth.js) 验证token
    →  控制层 (controllers/) 处理业务逻辑
    →  模型层 (models/) 查询/修改数据
    →  数据库 (MySQL)
    →  返回响应
```

---

## 📌 开发流程

### 如何添加新的API接口

**需求**: 添加一个「获取用户个人简介」的接口

#### 第1步: 数据库（可选）

如果需要新字段，修改 `sql/migrations/` 中添加迁移:

```sql
-- sql/migrations/006_add_bio_to_users.sql
ALTER TABLE users ADD COLUMN bio TEXT COMMENT '个人简介';
```

执行迁移:
```bash
mysql -u warmmate -p'warmmate123@' warm_mate < sql/migrations/006_add_bio_to_users.sql
```

#### 第2步: 模型（Model）

在 `models/User.js` 添加查询方法:

```javascript
// 获取用户简介
static async getBio(userId) {
  const [rows] = await pool.query(
    'SELECT bio FROM users WHERE id = ?',
    [userId]
  );
  return rows[0] ? rows[0].bio : null;
}
```

#### 第3步: 控制层（Controller）

在 `controllers/userController.js` 添加处理方法:

```javascript
exports.getUserBio = async (req, res) => {
  try {
    const userId = req.user.id; // 从JWT获取用户ID
    const bio = await User.getBio(userId);
    
    return res.status(200).json({
      code: 200,
      message: '获取成功',
      data: { bio }
    });
  } catch (error) {
    console.error('获取简介错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
  }
};
```

#### 第4步: 路由（Route）

在 `routes/auth.js` 添加路由:

```javascript
/**
 * 获取用户简介（需要认证）
 * GET /user/bio
 * Authorization: Bearer <token>
 */
router.get('/user/bio', authenticateToken, userController.getUserBio);
```

#### 第5步: 测试

```bash
# 先获取token
curl -X POST http://localhost:7001/alibaba-ai/v1/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "test123"}'

# 使用token调用新接口
curl -X GET http://localhost:7001/alibaba-ai/v1/user/bio \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 第6步: 文档

在 [API.md](API.md) 中添加接口文档:

```markdown
### 获取用户简介

GET /user/bio
Authorization: Bearer <token>

响应 (200):
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "bio": "我是一个心理学爱好者"
  }
}
```

---

## 🛠️ 常见开发任务

### 任务1: 添加新的AI功能

**目标**: 添加「AI提供心理建议」功能

1. **修改** `services/aiService.js`:
```javascript
// 添加新方法
async getAdvice(userMessage, context = []) {
  const messages = [
    { role: 'system', content: '你是一位资深心理咨询师...' },
    ...context,
    { role: 'user', content: userMessage }
  ];
  
  return await callQianwenAPI(messages);
}
```

2. **修改** `controllers/messageController.js`:
```javascript
// 调用新的AI服务
const advice = await aiService.getAdvice(userMessage, conversationHistory);
```

3. **测试** 修改后的功能

### 任务2: 添加新的数据模型

**目标**: 添加「用户反馈」功能

1. **创建** `models/Feedback.js`:
```javascript
const pool = require('../config/database');

class Feedback {
  static async create(userId, content, rating) {
    const [result] = await pool.query(
      'INSERT INTO feedbacks (user_id, content, rating) VALUES (?, ?, ?)',
      [userId, content, rating]
    );
    return result.insertId;
  }
}

module.exports = Feedback;
```

2. **创建** `controllers/feedbackController.js`:
```javascript
const Feedback = require('../models/Feedback');

exports.submitFeedback = async (req, res) => {
  try {
    const { content, rating } = req.body;
    const userId = req.user.id;
    
    const feedbackId = await Feedback.create(userId, content, rating);
    
    return res.status(201).json({
      code: 200,
      message: '感谢你的反馈！',
      data: { id: feedbackId }
    });
  } catch (error) {
    console.error('提交反馈错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
  }
};
```

3. **创建** `routes/feedback.js` 并在 `app.js` 注册

### 任务3: 修改现有功能

**目标**: 修改消息发送逻辑，添加关键词过滤

1. **创建** `services/filterService.js`:
```javascript
// 关键词过滤
const bannedWords = ['敏感词1', '敏感词2'];

function filterContent(text) {
  let filtered = text;
  bannedWords.forEach(word => {
    filtered = filtered.replace(word, '***');
  });
  return filtered;
}

module.exports = { filterContent };
```

2. **修改** `controllers/messageController.js`:
```javascript
const { filterContent } = require('../services/filterService');

// 在发送消息前过滤
const filteredContent = filterContent(userMessage);
```

---

## 🧪 测试

### 单元测试（建议）

创建 `tests/` 目录:

```javascript
// tests/user.test.js
const User = require('../models/User');

describe('User Model', () => {
  test('should create a new user', async () => {
    const user = await User.create({
      username: 'testuser',
      password: 'test123',
      phone: '13800138000'
    });
    expect(user.id).toBeDefined();
  });
  
  test('should find user by username', async () => {
    const user = await User.findByUsername('testuser');
    expect(user.username).toBe('testuser');
  });
});
```

运行测试:
```bash
npm test
```

### 集成测试（推荐）

使用 Postman 或写集成测试脚本

---

## 🐛 调试技巧

### 1. 查看日志

已在各地方添加 `console.log()` 和 `console.error()`:

```javascript
console.log('接收到的消息:', msgContent);
console.error('AI API错误:', error);
```

运行时查看输出:
```bash
npm run dev
```

### 2. 使用Node调试器

```bash
node --inspect app.js
```

在Chrome DevTools中访问 `chrome://inspect`

### 3. 数据库查询调试

在 `models/` 中添加日志:

```javascript
console.log('执行查询:', query, 'with params:', params);
const [result] = await pool.query(query, params);
console.log('查询结果:', result);
```

---

## 📦 依赖管理

### 添加新的npm包

```bash
npm install package-name
```

### 更新依赖版本

```bash
npm update
npm outdated  # 查看过期的包
```

### 指定版本

在 `package.json` 中:
```json
{
  "dependencies": {
    "express": "^4.18.2",  // 兼容版本
    "mysql2": "^3.6.0"
  }
}
```

---

## 安全最佳实践

### 1. 参数验证

```javascript
// 检查必填参数
if (!username || !password) {
  return res.status(400).json({
    code: 400,
    message: '参数不完整'
  });
}
```

### 2. SQL注入防护

```javascript
// 正确：使用参数化查询
const [user] = await pool.query(
  'SELECT * FROM users WHERE username = ?',
  [username]
);

// 错误：字符串拼接
const user = await pool.query(
  `SELECT * FROM users WHERE username = '${username}'`
);
```

### 3. 密码加密

```javascript
const bcrypt = require('bcryptjs');

// 加密
const hashedPassword = await bcrypt.hash(password, 10);

// 验证
const isValid = await bcrypt.compare(inputPassword, hashedPassword);
```

### 4. 错误消息

```javascript
// 不要暴露敏感信息
res.json({ message: err.message });  // "database connection failed"

// 返回通用错误
res.json({ message: '服务器错误' });
```

---

## 代码规范

### 命名规范

```javascript
// 常量：全大写
const MAX_LOGIN_ATTEMPTS = 5;
const DEFAULT_PAGE_SIZE = 20;

// 函数/变量：驼峰式
const getUserInfo = async (userId) => {};
let currentUser = null;

// 类：PascalCase
class UserController {}
class Appointment {}

// 文件名：小写+下划线或驼峰
// 好: appointmentController.js 或 appointment-controller.js
// 坏: AppointmentController.js
```

### 注释规范

```javascript
/**
 * 获取用户个人信息
 * @param {number} userId - 用户ID
 * @returns {Promise<Object>} 用户对象
 * @throws {Error} 如果用户不存在
 */
static async getUserInfo(userId) {
  // 参数验证
  if (!userId) {
    throw new Error('userId不能为空');
  }
  
  // 查询数据库
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE id = ?',
    [userId]
  );
  
  return rows[0];
}
```

---

## 部署前检查清单

- [ ] 代码测试通过
- [ ] 没有 `console.log` 调试语句
- [ ] 密钥已从代码中移除（使用 .env）
- [ ] 错误处理完整
- [ ] 没有硬编码的IP/端口
- [ ] 数据库迁移已执行
- [ ] 新的API文档已添加到 [API.md](API.md)
- [ ] 没有生成 `node_modules` 在Git中

---

## 📞 获取帮助

- **问题**: 如何处理 async/await 的错误？
  **答案**: 使用 try/catch 块，见上面的代码示例

- **问题**: 如何测试 API？
  **答案**: 使用 [API.md](API.md) 中的 curl 示例或 Postman

- **问题**: 如何扩展现有功能？
  **答案**: 参考「如何添加新的API接口」部分

---

**版本**: v1.0.3 | **更新**: 2026-03-25
