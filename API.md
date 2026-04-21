# Warm-Mate API完整文档

**基础URL**: `http://localhost:7001/alibaba-ai/v1`

**最后更新**: 2026年3月25日

---

## API响应格式

所有API响应都遵循统一的JSON格式：

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    // 具体数据内容
  }
}
```

**状态码对照表**:
| 代码 | 含义 |
|------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（缺少token） |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 409 | 冲突（如用户已存在） |
| 500 | 服务器错误 |

---

## 👤 用户认证相关接口

### 1. 用户注册

```http
POST /register
Content-Type: application/json
```

**请求示例:**
```json
{
  "username": "张三",
  "password": "password123",
  "phone": "13800138000",
  "email": "zhangsan@example.com"
}
```

**响应 (201)**:
```json
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "id": 1,
    "username": "张三",
    "phone": "13800138000",
    "email": "zhangsan@example.com",
    "created_at": "2026-03-25T10:30:00Z"
  }
}
```

**说明**:
- username: 3-20个字符
- password: 6-16个字符，支持字母、数字、符号
- phone: 11位手机号
- email: 可选

---

### 2. 用户登录

```http
POST /login
Content-Type: application/json
```

**请求示例:**
```json
{
  "username": "张三",
  "password": "password123"
}
```

**响应 (200)**:
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "id": 1,
    "uid": 100000001,
    "username": "张三",
    "phone": "13800138000",
    "email": "zhangsan@example.com",
    "avatar_url": null,
    "created_at": "2026-03-25T10:30:00Z",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**说明**:
- token: JWT令牌，后续请求在 Authorization Header 中使用
- uid: 系统生成的唯一用户ID（100000001+）

---

### 3. 获取用户信息

```http
GET /user/info
Authorization: Bearer <token>
```

**响应 (200)**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 1,
    "username": "张三",
    "phone": "13800138000",
    "email": "zhangsan@example.com",
    "avatar_url": "base64编码的头像...",
    "created_at": "2026-03-25T10:30:00Z",
    "updated_at": "2026-03-25T11:00:00Z"
  }
}
```

---

### 4. 更新用户信息

```http
PUT /user/info
Authorization: Bearer <token>
Content-Type: application/json
```

**请求示例** (至少更新一个字段):
```json
{
  "username": "新用户名",
  "email": "newemail@example.com",
  "avatar_url": "data:image/png;base64,iVBORw0KGgo..."
}
```

**响应 (200)**:
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": 1,
    "username": "新用户名",
    "email": "newemail@example.com"
  }
}
```

**说明**:
- avatar_url: 可接收 Base64 编码的图片（推荐大小: 100x100px，<100KB）

---

### 5. 修改密码

```http
POST /user/password/change
Authorization: Bearer <token>
Content-Type: application/json
```

**请求示例:**
```json
{
  "oldPassword": "oldpass123",
  "newPassword": "newpass456"
}
```

**响应 (200)**:
```json
{
  "code": 200,
  "message": "密码修改成功，请重新登录"
}
```

**密码要求**:
- 长度: 6-16 字符
- 允许: 字母、数字、符号

---

### 6. 请求密码重置验证码

```http
POST /user/password/reset-code
Content-Type: application/json
```

**请求示例:**
```json
{
  "phone": "13800138000"
}
```

**响应 (200)**:
```json
{
  "code": 200,
  "message": "验证码已发送"
}
```

**说明**:
- 仅向注册的手机号发送验证码
- 验证码有效期: 5分钟
- 详见 [SMS_PASSWORD_RESET.md](SMS_PASSWORD_RESET.md)

---

### 7. 验证码重置密码

```http
POST /user/password/reset
Content-Type: application/json
```

**请求示例:**
```json
{
  "phone": "13800138000",
  "code": "123456",
  "newPassword": "newpass789"
}
```

**响应 (200)**:
```json
{
  "code": 200,
  "message": "密码重置成功"
}
```

---

## 登录日志接口

### 1. 获取登录日志列表 (认证)

```http
GET /user/login-logs?page=1&limit=10
Authorization: Bearer <token>
```

**查询参数**:
- page: 页码（默认1）
- limit: 每页数量（默认10，最大100）

**响应 (200)**:
```json
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
        "login_time": "2026-03-25T15:30:45Z"
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

---

## AI聊天与消息接口

### 1. 创建对话

```http
POST /conversation
Authorization: Bearer <token>
Content-Type: application/json
```

**请求示例:**
```json
{
  "title": "焦虑症咨询"
}
```

**响应 (200)**:
```json
{
  "code": 200,
  "message": "对话创建成功",
  "data": {
    "id": 1,
    "userId": 1,
    "title": "焦虑症咨询",
    "createdAt": "2026-03-25T10:30:00Z"
  }
}
```

---

### 2. 获取对话列表

```http
GET /conversation?current=1&size=20
Authorization: Bearer <token>
```

**查询参数**:
- current: 当前页码（默认1）
- size: 每页记录数（默认20）

**响应 (200)**:
```json
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
      }
    ],
    "total": 100,
    "pages": 5,
    "current": 1,
    "size": 20
  }
}
```

---

### 3. 发送消息 / 获取AI回复

```http
POST /message
Authorization: Bearer <token>
Content-Type: application/json
```

**请求示例:**
```json
{
  "msgContent": "我最近感到很焦虑，该怎么办？",
  "msgType": "text",
  "conversationId": 1
}
```

**响应 (200)**:
```json
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
      "msgContent": "焦虑是很正常的感受。我可以帮助你...",
      "msgType": "text",
      "fromUserId": 0,
      "time": "2026-03-25T10:30:05Z"
    }
  }
}
```

**说明**:
- msgType: "text" （当前仅支持文本）
- fromUserId: 0 表示AI回复，>0 表示用户
- AI 回复基于千问模型，响应时间 2-10秒

---

### 4. 获取对话消息历史

```http
GET /message?conversationId=1&current=1&size=20
Authorization: Bearer <token>
```

**查询参数**:
- conversationId: 对话ID（必选）
- current: 页码（默认1）
- size: 每页数量（默认20）

**响应 (200)**:
```json
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
      {
        "id": 2,
        "conversationId": 1,
        "msgContent": "你好！我是你的心理健康助手...",
        "msgType": "text",
        "fromUserId": 0,
        "time": "2026-03-25T10:30:05Z"
      }
    ],
    "total": 100,
    "pages": 5,
    "current": 1,
    "size": 20
  }
}
```

---

### 5. 删除对话

```http
DELETE /conversation/:id
Authorization: Bearer <token>
```

**响应 (200)**:
```json
{
  "code": 200,
  "message": "对话删除成功"
}
```

---

## 📅 心理预约接口

### 1. 创建预约

```http
POST /appointment/create
Authorization: Bearer <token>
Content-Type: application/json
```

**请求示例:**
```json
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
```

**响应 (201)**:
```json
{
  "code": 200,
  "message": "预约申请已提交",
  "data": {
    "id": 1,
    "userId": 1,
    "status": "待处理",
    "createdAt": "2026-03-25T10:30:00Z"
  }
}
```

---

### 2. 获取我的预约列表

```http
GET /appointment/list
Authorization: Bearer <token>
```

**查询参数**:
- status: 可选，筛选状态（待处理/已确认/已完成/已取消）

**响应 (200)**:
```json
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
      "createdAt": "2026-03-25T10:30:00Z"
    }
  ]
}
```

---

### 3. 更新预约

```http
PUT /appointment/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**请求示例:**
```json
{
  "status": "已取消",
  "notes": "临时有事，需要改期"
}
```

**响应 (200)**:
```json
{
  "code": 200,
  "message": "预约更新成功"
}
```

---

### 4. 删除预约

```http
DELETE /appointment/:id
Authorization: Bearer <token>
```

**响应 (200)**:
```json
{
  "code": 200,
  "message": "预约删除成功"
}
```

---

## 问卷管理接口

### 1. 提交 PHQ-9 问卷

```http
POST /questionnaire/phq9
Authorization: Bearer <token>
Content-Type: application/json
```

**请求示例:**
```json
{
  "questionnaireName": "PHQ-9抑郁筛查量表",
  "questionnaireType": "phq9",
  "answers": [0, 1, 2, 1, 0, 1, 2, 1, 0],
  "score": 12,
  "depressionLevel": "轻度抑郁",
  "levelDescription": "您可能有轻度的抑郁症状，建议咨询心理医生"
}
```

**响应 (201)**:
```json
{
  "code": 200,
  "message": "问卷提交成功",
  "data": {
    "id": 1,
    "userId": 1,
    "questionnaireName": "PHQ-9抑郁筛查量表",
    "score": 12,
    "depressionLevel": "轻度抑郁",
    "createdAt": "2026-03-25T10:30:00Z"
  }
}
```

**评分说明**:
- PHQ-9 总分: 0-27分
- 无抑郁: 0-4
- 轻度: 5-9
- 中度: 10-14
- 中重度: 15-19
- 重度: 20-27

---

### 2. 获取问卷结果历史

```http
GET /questionnaire/results?userId=1&current=1&size=20
Authorization: Bearer <token>
```

**响应 (200)**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "records": [
      {
        "id": 1,
        "questionnaireName": "PHQ-9抑郁筛查量表",
        "questionnaire_type": "phq9",
        "score": 12,
        "depressionLevel": "轻度抑郁",
        "createdAt": "2026-03-25T10:30:00Z"
      }
    ],
    "total": 5,
    "pages": 1,
    "current": 1,
    "size": 20
  }
}
```

---

## 🔒 认证方式

### JWT Bearer Token

所有需要认证的接口都需在请求头中添加:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 获取Token

1. 用户登录 `/login` 接口
2. 从响应的 `data.token` 获取 JWT Token
3. 在后续请求头中使用此 Token

### Token有效期

- 默认有效期: **7天**
- Token过期后需重新登录

---

## 📌 常见错误响应

### 参数缺失

```json
{
  "code": 400,
  "message": "用户名、密码和手机号为必填项"
}
```

### 用户不存在

```json
{
  "code": 401,
  "message": "用户名或密码错误"
}
```

### Token过期

```json
{
  "code": 401,
  "message": "Token已过期，请重新登录"
}
```

### 资源不存在

```json
{
  "code": 404,
  "message": "对话不存在"
}
```

---

## 🧪 测试工具

推荐使用以下工具测试API:

- **Postman**: https://www.postman.com/
- **Thunder Client** (VS Code插件)
- **curl** 命令行

### curl 示例

```bash
# 注册
curl -X POST http://localhost:7001/alibaba-ai/v1/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "test123",
    "phone": "13800138000"
  }'

# 登录
curl -X POST http://localhost:7001/alibaba-ai/v1/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "test123"
  }'

# 获取用户信息（需要token）
curl -X GET http://localhost:7001/alibaba-ai/v1/user/info \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📚 相关文档

- [README.md](README.md) - 项目概览
- [QUICKSTART.md](QUICKSTART.md) - 快速部署指南
- [DEPLOYMENT.md](DEPLOYMENT.md) - 完整部署文档
- [INTEGRATION.md](INTEGRATION.md) - 前后端集成
- [SMS_PASSWORD_RESET.md](SMS_PASSWORD_RESET.md) - 短信验证功能
