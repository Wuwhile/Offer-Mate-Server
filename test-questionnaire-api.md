# 问卷API测试指南

本文档提供问卷相关API的详细测试步骤和示例。

> **推荐**: 先查看 [API.md](API.md) 了解完整的API参考

---

## 快速开始

### 前置条件

1. 服务器正在运行:
   ```bash
   npm run dev
   # 服务器运行在 http://localhost:7001
   ```

2. 已有账户（如果没有先注册）:
   ```bash
   curl -X POST http://localhost:7001/alibaba-ai/v1/register \
     -H "Content-Type: application/json" \
     -d '{
       "username": "testuser",
       "password": "test123",
       "phone": "13800138000"
     }'
   ```

---

## 🔑 获取认证Token

所有问卷接口都需要有效的JWT Token。

### 步骤1: 登录获取Token

```bash
curl -X POST http://localhost:7001/alibaba-ai/v1/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "test123"
  }'
```

**响应示例:**
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "id": 1,
    "username": "testuser",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MX0..."
  }
}
```

### 步骤2: 保存Token

复制返回的 `token` 值，后续请求中使用:
```bash
# 保存为环境变量（PowerShell）
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## PHQ-9 抑郁筛查问卷测试

PHQ-9是一个9条题目的抑郁症筛查量表。

### 题目说明

每题4个选项（0-3分）:
- 0分: 完全没有
- 1分: 好几天有
- 2分: 一半以上的日子有
- 3分: 几乎每天都有

**9道题目:**
1. 对事物的兴趣或乐趣丧失
2. 感到心情沉闷、沮丧或绝望
3. 难以入睡、易惊醒、或过度睡眠
4. 疲倦或乏力
5. 食欲不好或吃得过多
6. 对自己感到失败或让家人失望
7. 难以集中精力
8. 说话或动作缓慢、或相反（坐立不安）
9. 有想伤害自己的念头

### 测试API: 提交PHQ-9问卷

```bash
curl -X POST http://localhost:7001/alibaba-ai/v1/questionnaire/phq9 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $token" \
  -d '{
    "questionnaireName": "PHQ-9抑郁筛查量表",
    "questionnaireType": "phq9",
    "answers": [0, 1, 2, 1, 0, 1, 2, 1, 0],
    "score": 12,
    "depressionLevel": "轻度抑郁",
    "levelDescription": "您可能有轻度的抑郁症状，建议咨询心理医生"
  }'
```

**参数说明:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| questionnaireName | string | 是 | 问卷名称 |
| questionnaireType | string | 是 | 问卷类型（phq9） |
| answers | array[int] | 是 | 9道题目的答案（0-3） |
| score | int | 是 | 总得分（0-27） |
| depressionLevel | string | 是 | 严重等级 |
| levelDescription | text | 是 | 等级描述 |

**得分对照:**

| 总分 | 等级 | 描述 |
|------|------|------|
| 0-4 | 无 | 无抑郁症状 |
| 5-9 | 轻度 | 轻度抑郁 |
| 10-14 | 中度 | 中等程度抑郁 |
| 15-19 | 中重度 | 中重度抑郁 |
| 20-27 | 重度 | 重度抑郁 |

**成功响应 (201):**
```json
{
  "code": 200,
  "message": "问卷提交成功",
  "data": {
    "id": 1,
    "userId": 1,
    "questionnaireName": "PHQ-9抑郁筛查量表",
    "questionnaire_type": "phq9",
    "score": 12,
    "depressionLevel": "轻度抑郁",
    "createdAt": "2026-03-25T10:30:00Z"
  }
}
```

**失败响应示例:**
```json
{
  "code": 400,
  "message": "答案数量不正确，PHQ-9应该有9道题目"
}
```

---

## 📊 测试场景

### 场景1: 无抑郁症状

```bash
# 所有答案都是0
curl -X POST http://localhost:7001/alibaba-ai/v1/questionnaire/phq9 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $token" \
  -d '{
    "questionnaireName": "PHQ-9抑郁筛查量表",
    "questionnaireType": "phq9",
    "answers": [0, 0, 0, 0, 0, 0, 0, 0, 0],
    "score": 0,
    "depressionLevel": "无",
    "levelDescription": "您没有明显的抑郁症状，保持目前的生活方式。"
  }'
```

### 场景2: 中度抑郁

```bash
# 混合答案，总分13
curl -X POST http://localhost:7001/alibaba-ai/v1/questionnaire/phq9 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $token" \
  -d '{
    "questionnaireName": "PHQ-9抑郁筛查量表",
    "questionnaireType": "phq9",
    "answers": [2, 2, 2, 2, 1, 2, 1, 0, 1],
    "score": 13,
    "depressionLevel": "中度",
    "levelDescription": "您可能有中等程度的抑郁症状，强烈建议咨询专业心理医生。"
  }'
```

### 场景3: 重度抑郁

```bash
# 严重症状，总分24
curl -X POST http://localhost:7001/alibaba-ai/v1/questionnaire/phq9 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $token" \
  -d '{
    "questionnaireName": "PHQ-9抑郁筛查量表",
    "questionnaireType": "phq9",
    "answers": [3, 3, 3, 3, 3, 3, 2, 2, 1],
    "score": 24,
    "depressionLevel": "重度",
    "levelDescription": "您有严重的抑郁症状，请立即寻求专业心理医生的帮助。可能需要药物治疗。"
  }'
```

---

## 📈 查询问卷结果

### 获取用户的所有问卷记录

```bash
curl -X GET "http://localhost:7001/alibaba-ai/v1/questionnaire/results?current=1&size=20" \
  -H "Authorization: Bearer $token"
```

**查询参数:**
- `current`: 页码（默认1）
- `size`: 每页记录数（默认20）

**成功响应 (200):**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "records": [
      {
        "id": 1,
        "userId": 1,
        "questionnaireName": "PHQ-9抑郁筛查量表",
        "questionnaire_type": "phq9",
        "score": 12,
        "depressionLevel": "轻度抑郁",
        "levelDescription": "您可能有轻度的抑郁症状...",
        "createdAt": "2026-03-25T10:30:00Z"
      },
      {
        "id": 2,
        "userId": 1,
        "questionnaireName": "PHQ-9抑郁筛查量表",
        "questionnaire_type": "phq9",
        "score": 8,
        "depressionLevel": "轻度",
        "levelDescription": "症状有所改善...",
        "createdAt": "2026-03-24T14:15:00Z"
      }
    ],
    "total": 2,
    "pages": 1,
    "current": 1,
    "size": 20
  }
}
```

---

## ❌ 常见错误

### 错误1: Token无效或过期

```bash
# 请求
curl -X POST http://localhost:7001/alibaba-ai/v1/questionnaire/phq9 \
  -H "Authorization: Bearer invalid_token" \
  ...

# 响应
{
  "code": 401,
  "message": "Token已过期，请重新登录"
}
```

**解决**: 重新登录获取新Token

### 错误2: 答案数量错误

```json
{
  "code": 400,
  "message": "答案数量不正确，PHQ-9应该有9道题目"
}
```

**解决**: 确保提交9道题目的答案

### 错误3: 得分不匹配

```json
{
  "code": 400,
  "message": "提交的score与answers计算结果不匹配"
}
```

**解决**: 验证得分计算是否正确（sum(answers)）

### 错误4: 答案值超出范围

```json
{
  "code": 400,
  "message": "答案值必须在0-3之间"
}
```

**解决**: 检查每个答案是否都是0, 1, 2, 或3

---

## 🧪 使用Postman测试

### 导入请求

1. 打开 Postman
2. 创建新请求：`POST /questionnaire/phq9`
3. 设置Headers:
   ```
   Content-Type: application/json
   Authorization: Bearer {{token}}
   ```
4. 粘贴请求体（如上面的示例）

### 保存Token为环境变量

1. 登录响应中，右键点击 `token` 值
2. 选择 「Set as Variable」→ 「token」
3. 后续请求可以使用 `{{token}}`

---

## 📊 数据分析建议

### 如何使用问卷数据

1. **跟踪进度**: 定期提交PHQ-9，对比得分变化
2. **制定计划**: 根据结果等级制定心理干预方案
3. **就医指引**: 
   - 中度以上推荐就医
   - 重度需要立即求助

### 问卷频率建议

- **初次诊断**: 1次
- **治疗监测**: 每周或每两周1次
- **康复评估**: 每月1次

---

## 完整工作流示例

```bash
# 1. 注册账户
curl -X POST http://localhost:7001/alibaba-ai/v1/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "patient1",
    "password": "secure123",
    "phone": "13900000000"
  }'

# 2. 登录获取token
TOKEN=$(curl -X POST http://localhost:7001/alibaba-ai/v1/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "patient1",
    "password": "secure123"
  }' | jq -r '.data.token')

# 3. 提交问卷
curl -X POST http://localhost:7001/alibaba-ai/v1/questionnaire/phq9 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "questionnaireName": "PHQ-9抑郁筛查量表",
    "questionnaireType": "phq9",
    "answers": [1, 1, 1, 1, 1, 1, 1, 1, 1],
    "score": 9,
    "depressionLevel": "轻度",
    "levelDescription": "建议咨询心理医生"
  }'

# 4. 查询历史记录
curl -X GET "http://localhost:7001/alibaba-ai/v1/questionnaire/results" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📚 相关文档

- [API.md](API.md) - 完整API参考
- [README.md](README.md) - 项目概览
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - 数据库模式

---

**版本**: v1.0.3 | **更新**: 2026-03-25

```

**成功响应：**
```json
{
  "code": 200,
  "message": "问卷结果保存成功",
  "data": {
    "id": 123
  }
}
```

## 3. 获取用户问卷历史记录

**请求：**
```bash
curl -X GET http://47.94.217.78:7001/alibaba-ai/v1/questionnaireResults/listByUserId/1 \
  -H "Access-Token: YOUR_TOKEN_HERE"
```

**成功响应：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": [
    {
      "id": 123,
      "userId": 1,
      "questionnaireName": "PHQ-9抑郁筛查量表",
      "questionnaireType": "mood",
      "score": 12,
      "depressionLevel": "轻度抑郁",
      "levelDescription": "您可能有轻度的抑郁症状，建议咨询心理医生",
      "resultData": {...},
      "createTime": "2024-03-24T10:30:00.000Z"
    }
  ]
}
```

## 4. 获取最新问卷结果

**请求：**
```bash
curl -X GET http://47.94.217.78:7001/alibaba-ai/v1/questionnaireResults/latestByUserId/1 \
  -H "Access-Token: YOUR_TOKEN_HERE"
```

## 5. 获取问卷结果详情

**请求：**
```bash
curl -X GET http://47.94.217.78:7001/alibaba-ai/v1/questionnaireResults/123 \
  -H "Access-Token: YOUR_TOKEN_HERE"
```

## 6. 删除单个问卷结果

**请求：**
```bash
curl -X DELETE http://47.94.217.78:7001/alibaba-ai/v1/questionnaireResults/123 \
  -H "Access-Token: YOUR_TOKEN_HERE"
```

## 7. 批量删除问卷结果

**请求：**
```bash
curl -X DELETE http://47.94.217.78:7001/alibaba-ai/v1/questionnaireResults/batch \
  -H "Content-Type: application/json" \
  -H "Access-Token: YOUR_TOKEN_HERE" \
  -d '{
    "ids": [123, 124, 125]
  }'
```

## 8. 获取问卷统计

**请求：**
```bash
curl -X GET http://47.94.217.78:7001/alibaba-ai/v1/questionnaireResults/count \
  -H "Access-Token: YOUR_TOKEN_HERE"
```

**成功响应：**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "count": 5
  }
}
```

## 问卷类型和名称对应关系

| questionnaireName | questionnaireType | 说明 |
|---|---|---|
| PHQ-9抑郁筛查量表 | mood | 抑郁症筛查 |
| GAD-7焦虑筛查量表 | mood | 焦虑症筛查 |
| CPSS创伤后应激量表 | stress | 压力评估 |
| UCLA孤独感量表 | social | 社交和孤独感 |
| ITS人际信任量表 | social | 社交信任评估 |
| PSQI睡眠质量指数 | sleep | 睡眠质量评估 |
| SDS自评抑郁量表 | sleep | 睡眠相关抑郁 |

## 测试步骤

1. 使用有效的用户账号登录获取 Access-Token
2. 使用 POST /savePhq9Result 保存测试数据（3-5 条）
3. 使用 GET /listByUserId 验证数据已保存
4. 使用 GET /latestByUserId 验证最新记录
5. 使用 GET /:id 验证单条详情
6. 使用 DELETE /:id 验证删除功能
7. 前端页面 pages/phq7-test/history.vue 应该能加载历史记录

## 常见错误

| 错误码 | 含义 | 解决方案 |
|---|---|---|
| 400 | 参数缺失或无效 | 检查请求体中的必填字段 |
| 401 | 未认证 | 检查 Access-Token 是否正确和有效 |
| 403 | 禁止访问 | 用户无权访问这条记录 |
| 404 | 记录不存在 | 检查 ID 是否正确 |
| 500 | 服务器错误 | 检查服务器日志 |
