# Warm-Mate 后端服务器

完整的Node.js + Express + MySQL后端解决方案，提供用户认证、AI交流、心理预约等功能。

## 项目结构

```
warm-mate-server/
├── app.js                      # Express主应用
├── package.json               # 项目依赖配置
├── .env.example               # 环境变量示例
├── config/
│   ├── database.js            # 数据库连接配置
│   └── env.js                 # 环境变量管理
├── models/
│   ├── User.js                # 用户数据模型
│   ├── LoginLog.js            # 登录日志数据模型
│   ├── Conversation.js        # AI对话数据模型
│   ├── Message.js             # 聊天消息数据模型
│   └── Appointment.js         # 心理预约数据模型
├── controllers/
│   ├── userController.js      # 用户业务逻辑
│   ├── messageController.js   # 消息和AI交流逻辑
│   ├── conversationController.js  # 对话管理逻辑
│   └── appointmentController.js   # 预约管理逻辑
├── routes/
│   ├── auth.js                # 认证相关路由
│   ├── message.js             # 消息和AI相关路由
│   ├── conversation.js        # 对话管理路由
│   └── appointment.js         # 预约管理路由
├── middleware/
│   └── auth.js                # JWT认证中间件
├── services/
│   └── aiService.js           # 千问AI服务集成
├── sql/
│   ├── init.sql               # 数据库初始化脚本
│   └── migrations/            # 数据库迁移脚本
│       └── 005_add_user_id_to_appointments.sql
└── README.md                  # 项目文档
```

## 快速开始（本地开发）

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
```bash
cp .env.example .env
```

编辑 `.env` 文件，配置数据库和AI API信息：
```
DB_HOST=localhost
DB_USER=warmmate
DB_PASSWORD=warmmate123@
DB_NAME=warm_mate
PORT=7001
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d

# 千问AI配置
QIANWEN_API_KEY=your_api_key_here
QIANWEN_MODEL=qwen-plus
```

### 3. 初始化数据库
```bash
mysql -u root -p < sql/init.sql
```

### 4. 启动开发服务器
```bash
npm run dev
```

服务器将运行在 `http://localhost:7001`

## API 端点

### 基础URL
```
http://localhost:7001/alibaba-ai/v1
```

### 用户认证接口

#### 注册
```
POST /register
Content-Type: application/json

{
  "username": "张三",
  "password": "password123",
  "phone": "13800138000",
  "email": "zhangsan@example.com"
}

成功响应 (201):
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "id": 1,
    "username": "张三",
    "phone": "13800138000",
    "email": "zhangsan@example.com"
  }
}
```

#### 登录
```
POST /login
Content-Type: application/json

{
  "username": "张三",
  "password": "password123"
}

成功响应 (200):
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "id": 1,
    "uid": 100000001,
    "username": "张三",
    "phone": "13800138000",
    "email": "zhangsan@example.com",
    "created_at": "2024-03-21T10:30:00Z",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### AI交流接口（需要认证）

#### 发送消息 / 获取AI回复
```
POST /message
Authorization: Bearer <token>
Content-Type: application/json

{
  "msgContent": "我最近感到很焦虑，该怎么办？",
  "msgType": "text",
  "conversationId": 1
}

成功响应 (200):
{
  "code": 200,
  "message": "消息发送成功",
  "data": {
    "userMessage": {
      "id": 1,
      "msgContent": "我最近感到很焦虑，该怎么办？",
      "msgType": "text",
      "fromUserId": 1,
      "time": "2026-03-25T10:30:00Z"
    },
    "aiMessage": {
      "id": 2,
      "msgContent": "焦虑是很正常的感受...",
      "msgType": "text",
      "fromUserId": 0,
      "time": "2026-03-25T10:30:05Z"
    }
  }
}
```

#### 获取消息历史
```
GET /message?conversationId=1&current=1&size=20
Authorization: Bearer <token>

成功响应 (200):
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "records": [
      {
        "id": 1,
        "conversationId": 1,
        "msgContent": "你好",
        "msgType": "text",
        "fromUserId": 1,
        "time": "2026-03-25T10:30:00Z"
      },
      ...
    ],
    "total": 100,
    "pages": 5,
    "current": 1,
    "size": 20
  }
}
```

### 对话管理接口（需要认证）

#### 创建新对话
```
POST /conversation
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "焦虑症咨询"
}

成功响应 (200):
{
  "code": 200,
  "message": "对话创建成功",
  "data": {
    "id": 1,
    "userId": 1,
    "title": "焦虑症咨询",
    "createdAt": "2026-03-25T10:30:00Z",
    "updatedAt": "2026-03-25T10:30:00Z"
  }
}
```

#### 获取对话列表
```
GET /conversation?current=1&size=20
Authorization: Bearer <token>

成功响应 (200):
{
  "code": 200,
  "message": "获取对话列表成功",
  "data": {
    "records": [
      {
        "id": 1,
        "title": "焦虑症咨询",
        "lastMessage": "你可以尝试深呼吸...",
        "messageCount": 15,
        "updatedAt": "2026-03-25T10:30:00Z"
      },
      ...
    ],
    "total": 10,
    "pages": 1,
    "current": 1,
    "size": 20
  }
}
```

#### 自动生成对话标题
```
POST /conversation/:id/generate-title
Authorization: Bearer <token>

成功响应 (200):
{
  "code": 200,
  "message": "生成标题成功",
  "data": {
    "title": "焦虑症管理方案"
  }
}
```

#### 删除对话
```
DELETE /conversation/:id
Authorization: Bearer <token>

成功响应 (200):
{
  "code": 200,
  "message": "对话删除成功"
}
```

### 预约管理接口（需要认证）

#### 创建预约
```
POST /appointment/saveAppointment
Authorization: Bearer <token>
Content-Type: application/json

{
  "doctorId": 1,
  "doctorName": "陈医生",
  "patientName": "张三",
  "patientAge": 28,
  "patientGender": "男",
  "patientPhone": "13800138000",
  "consultationContent": "焦虑症治疗咨询",
  "urgency": "较急",
  "timePreference": "周末下午"
}

成功响应 (201):
{
  "code": 200,
  "message": "预约申请已提交",
  "data": {
    "id": 1
  }
}
```

#### 获取当前用户的预约列表
```
GET /appointment/list
Authorization: Bearer <token>

成功响应 (200):
{
  "code": 200,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "userId": 1,
      "doctorId": 1,
      "doctorName": "陈医生",
      "patientName": "张三",
      "patientAge": 28,
      "patientGender": "男",
      "patientPhone": "13800138000",
      "consultationContent": "焦虑症治疗咨询",
      "urgency": "较急",
      "timePreference": "周末下午",
      "status": "待处理",
      "createTime": "2026-03-25T10:30:00Z"
    },
    ...
  ]
}
```

#### 获取预约详情
```
GET /appointment/:id
Authorization: Bearer <token>

成功响应 (200):
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 1,
    "userId": 1,
    "doctorId": 1,
    "doctorName": "陈医生",
    ...
  }
}
```

#### 更新预约
```
PUT /appointment/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "已确认",
  "notes": "确认时间为周六下午2点"
}

成功响应 (200):
{
  "code": 200,
  "message": "预约更新成功"
}
```

#### 删除预约
```
DELETE /appointment/:id
Authorization: Bearer <token>

成功响应 (200):
{
  "code": 200,
  "message": "预约删除成功"
}
```

## 安全特性

### 数据隔离
- 用户预约数据通过 `user_id` 外键关联，确保用户只能访问自己的预约
- 对话和消息通过 userId 隔离，用户无法访问他人数据

### 认证与授权
- JWT令牌认证，默认有效期7天
- 令牌包含用户 id、username、phone 信息
- 所有受保护的接口都需要有效的Authorization header

### 请求验证
- 参数验证和格式检查
- 手机号格式验证（11位数字）
- 敏感操作的权限检查

### 用户管理接口（需要认证）

#### 获取登录日志
```
GET /user/login-logs?page=1&limit=10
Authorization: Bearer <token>

查询参数:
- page: 页码（默认1）
- limit: 每页数量（默认10，最大100）

成功响应 (200):
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "records": [
      {
        "id": 1,
        "user_id": 1,
        "ip_address": "192.168.1.100",
        "device_info": "iPhone 14 - Safari",
        "user_agent": "Mozilla/5.0...",
        "login_time": "2026-03-22 15:30:45"
      },
      {
        "id": 2,
        "user_id": 1,
        "ip_address": "192.168.1.101",
        "device_info": "Android - Chrome",
        "user_agent": "Mozilla/5.0...",
        "login_time": "2026-03-22 10:20:30"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

#### 获取最近登录记录（需要认证）
```
GET /user/login-logs/latest?limit=5
Authorization: Bearer <token>

成功响应 (200):
{
  "code": 200,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "ip_address": "192.168.1.100",
      "device_info": "iPhone 14 - Safari",
      "user_agent": "Mozilla/5.0...",
      "login_time": "2026-03-22 15:30:45"
    }
  ]
}
```

#### 删除登录日志（需要认证）
```
POST /user/login-logs/delete
Authorization: Bearer <token>
Content-Type: application/json

{
  "logId": 1
}

成功响应 (200):
{
  "code": 200,
  "message": "删除成功"
}
```

#### 清空所有登录日志（需要认证）
```
POST /user/login-logs/clear
Authorization: Bearer <token>

成功响应 (200):
{
  "code": 200,
  "message": "清空成功"
}
```

#### 修改密码（需要认证）
```
POST /user/password/change
Authorization: Bearer <token>
Content-Type: application/json

{
  "oldPassword": "oldpass123",
  "newPassword": "newpass456"
}

密码要求：
- 长度：6-16 个字符
- 只能包含字母、数字或符号（!@#$%^&*()_+-=[]{}；'："\\|,.<>/?）
- 新密码不能与旧密码相同

成功响应 (200):
{
  "code": 200,
  "message": "密码修改成功，请重新登录"
}

失败响应 (400):
{
  "code": 400,
  "message": "当前密码不正确" // 或其他错误信息
}
```

#### 发送找回密码验证码（不需要认证）
```
POST /user/password/reset-code
Content-Type: application/json

{
  "phone": "17661577859"
}

成功响应 (200):
{
  "code": 200,
  "message": "验证码已发送到您的手机",
  "data": {
    "verificationCode": "123456"  // 仅开发环境返回
  }
}

失败响应：
- 404：该手机号未注册
- 400：手机号格式不正确
- 500：短信发送失败（可能是频率限制：check frequency failed）

说明：
- 每个手机号的验证码有效期为 5 分钟
- 阿里云 SMS 服务有频率限制，单个手机号过于频繁请求会返回 "check frequency failed" 错误
- 建议在 UI 上实现 60 秒倒计时防止用户频繁点击
```

#### 重置密码（不需要认证）
```
POST /user/password/reset
Content-Type: application/json

{
  "phone": "17661577859",
  "code": "123456",
  "newPassword": "newpass456"
}

密码要求：
- 长度：6-16 个字符
- 新密码与旧密码不能相同

成功响应 (200):
{
  "code": 200,
  "message": "密码重置成功，请重新登录"
}

失败响应：
- 400：验证码错误或已过期
- 404：用户不存在
- 500：重置密码失败

说明：
- 验证码必须与发送验证码接口返回的验证码一致
- 验证码有效期为 5 分钟
- 验证码验证失败最多允许 5 次尝试
```

## 安全特性

- 密码使用bcryptjs进行加密存储
- JWT token认证和授权
- CORS跨域资源共享
- SQL注入防护（使用参数化查询）
- 请求数据验证
- 用户信息更新使用动态SQL，仅更新请求中提供的字段（防止意外覆盖其他字段）

## 数据库表说明

### users 表
存储用户账户信息

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 用户ID |
| username | VARCHAR(50) | 用户名（唯一） |
| password | VARCHAR(255) | 加密密码 |
| phone | VARCHAR(20) | 手机号 |
| email | VARCHAR(100) | 邮箱 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 修改时间 |

**注意：** UID 是自动计算字段，不存储在数据库中，公式为：`uid = 100000000 + id`

例如：
- id = 1 → uid = 100000001
- id = 2 → uid = 100000002
- id = 3 → uid = 100000003

### login_logs 表
存储用户登录日志记录

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 日志ID |
| user_id | INT | 用户ID（外键） |
| ip_address | VARCHAR(45) | 登录IP地址 |
| device_info | VARCHAR(255) | 设备信息（如：iPhone 14 - Safari） |
| user_agent | TEXT | 浏览器User Agent信息 |
| login_time | TIMESTAMP | 登录时间 |

### questionnaire_results 表
存储问卷完成结果

### messages 表
存储用户消息

## 部署到云服务器

详见 [DEPLOYMENT.md](DEPLOYMENT.md) 或本目录下的部署指南。

## 环境变量说明

| 变量 | 默认值 | 说明 |
|------|--------|------|
| DB_HOST | localhost | 数据库主机 |
| DB_PORT | 3306 | 数据库端口 |
| DB_USER | root | 数据库用户 |
| DB_PASSWORD | | 数据库密码 |
| DB_NAME | warm_mate | 数据库名称 |
| PORT | 7001 | 服务器端口 |
| JWT_SECRET | | JWT签名密钥（必须修改） |
| NODE_ENV | development | 运行环境 |

## 版本更新记录

### v1.0.5 (2026-03-23)
- 优化修改密码功能
  - 密码长度要求改为 6-16 个字符（之前为 8-32）
  - 密码要求简化：只需包含字母、数字或符号，无需复杂的强度组合
  - 前端验证逻辑同步更新

### v1.0.4 (2026-03-22)
- 实现修改密码功能
  - 新增修改密码 API（/user/password/change）
  - 验证旧密码
  - 新密码强度验证（需要包含大小写字母、数字和特殊字符中的至少 3 种）
  - 防止新密码与旧密码相同
  - 修改成功后需要重新登录

### v1.0.3 (2026-03-22)
- 实现登录日志功能
  - 新增 login_logs 数据库表
  - 登录时自动记录 IP、设备信息、User Agent
  - 支持设备信息智能识别（iOS/Android/Windows/Mac等）
- 新增登录日志查询接口（分页和最近N条）
- 支持删除指定登录日志 
- 支持清空所有登录日志
- 前端账号管理中展示登录日志

### v1.0.2 (2026-03-22)
- 登录和用户信息接口添加 `uid` 字段（自动计算：`uid = 100000000 + id`）
- 用户信息更新API改用动态SQL，仅更新请求中提供的字段
- 防止部分字段更新时导致其他字段被意外设为null

### v1.0.1
- JWT认证系统实现
- 用户注册/登录功能

### v1.0.0
- 初始版本发布

## 前端配置

更新前端项目中的 `common/config/env.js`：

```javascript
const dev = {
  baseUrl: 'http://你的服务器IP:7001/alibaba-ai/v1'
}
```

登录时获取的token应存储到本地：
```javascript
// 登录成功后
uni.setStorageSync("Access-Token", response.data.data.token)
```

## 调试

启用详细日志输出：
```bash
NODE_ENV=development npm run dev
```

## 许可证

ISC
