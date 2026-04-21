# 📱 SMS短信验证与密码重置功能

本文档说明如何配置和使用 Warm-Mate 的短信验证码和密码重置功能。

## 🔧 功能概述

该功能集成了**阿里云号码认证服务（DYPNS）**，提供：

1. **短信验证码发送** - 用户通过手机号请求验证码
2. **验证码验证** - 验证提交的验证码是否正确
3. **密码重置** - 用户在验证成功后可以重置密码

## 📋 系统需求

### 后端依赖
```json
{
  "@alicloud/dypnsapi20170525": "^2.0.0",
  "@alicloud/openapi-client": "^0.4.15",
  "@alicloud/tea-util": "^1.4.11",
  "@alicloud/credentials": "^2.4.4"
}
```

### 外部服务
- **阿里云 DYPNS（号码认证服务）** - 用于发送短信验证码
- **MySQL 数据库** - 用于存储用户和验证记录

## 🚀 配置步骤

### 第一步：获取阿里云 API 凭证

1. 登录 [阿里云控制台](https://www.aliyun.com)
2. 进入 **RAM 访问控制** → **用户**
3. 创建或选择一个用户，获取 AccessKeyId 和 AccessKeySecret
4. 确保该用户有 `dypns:SendSmsVerifyCode` 权限（参见"权限配置"章节）

### 第二步：配置环境变量

在 `.env` 文件中添加或更新：

```bash
# 阿里云短信配置（使用SDK标准环境变量名）
ALIBABA_CLOUD_ACCESS_KEY_ID=your_access_key_id_here
ALIBABA_CLOUD_ACCESS_KEY_SECRET=your_access_key_secret_here
SMS_SIGN_NAME=your_sms_sign_name
SMS_TEMPLATE_CODE=your_template_code
```

**参数说明**：
- `ALIBABA_CLOUD_ACCESS_KEY_ID`: 你的阿里云 AccessKey ID
- `ALIBABA_CLOUD_ACCESS_KEY_SECRET`: 你的阿里云 AccessKey Secret
- `SMS_SIGN_NAME`: 短信签名（需要在阿里云控制台审核通过）
- `SMS_TEMPLATE_CODE`: 短信模板代码（需要在阿里云控制台创建）

### 第三步：配置RAM权限

1. 登录 [RAM 控制台](https://ram.console.aliyun.com/)
2. 进入 **权限管理** → **权限策略** → **创建权限策略**
3. 创建如下策略：

```json
{
  "Version": "1",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "dypns:SendSmsVerifyCode",
      "Resource": "*"
    }
  ]
}
```

4. 将该策略附加到你的 RAM 用户

### 第四步：创建短信模板

1. 登录 [DYPNS 控制台](https://dyvpc.console.aliyun.com/)
2. 进入 **短信管理** → **短信模板**
3. 创建新模板，内容示例：
   ```
   您的验证码是：##code##，有效期为5分钟，请勿泄露。
   ```
4. 获取模板 CODE（如 100003），填入 `.env` 的 `SMS_TEMPLATE_CODE`

## 📡 API 接口

### 1. 发送验证码

**端点**: `POST /user/password/reset-code`  
**认证**: 不需要  
**Content-Type**: `application/json`

**请求**:
```json
{
  "phone": "17661577859"
}
```

**响应成功 (200)**:
```json
{
  "code": 200,
  "message": "验证码已发送到您的手机",
  "data": {
    "verificationCode": "123456"  // 仅开发环境返回
  }
}
```

**响应失败**:
```json
// 手机号未注册
{
  "code": 404,
  "message": "该手机号未注册"
}

// 手机号格式错误
{
  "code": 400,
  "message": "手机号格式不正确"
}

// 发送失败（可能是频率限制）
{
  "code": 500,
  "message": "短信发送异常: check frequency failed"
}
```

**说明**:
- 验证码有效期：**5 分钟**
- 同一手机号在 5 分钟内只能请求一次（阿里云频率限制）
- 开发环境会在响应中返回验证码，生产环境不会返回

### 2. 重置密码

**端点**: `POST /user/password/reset`  
**认证**: 不需要  
**Content-Type**: `application/json`

**请求**:
```json
{
  "phone": "17661577859",
  "code": "123456",
  "newPassword": "newpass@123"
}
```

**响应成功 (200)**:
```json
{
  "code": 200,
  "message": "密码重置成功，请重新登录"
}
```

**响应失败**:
```json
// 验证码错误或已过期
{
  "code": 400,
  "message": "验证码已过期或不存在，请重新请求"
}

// 用户不存在
{
  "code": 404,
  "message": "用户不存在"
}

// 密码不符合要求
{
  "code": 400,
  "message": "新密码长度必须在 6-16 个字符之间"
}
```

**密码要求**:
- 长度：6-16 个字符
- 不能与旧密码相同

## 🔐 安全特性

### 验证码安全

1. **有效期限制**: 验证码有效期为 5 分钟
2. **尝试限制**: 验证失败最多允许 5 次尝试
3. **单次使用**: 验证码验证成功后立即删除
4. **内存缓存**: 验证码缓存在内存中（仅开发/小规模使用）

### 密码安全

1. **格式验证**: 密码长度在 6-16 字符之间
2. **加密存储**: 密码使用 bcryptjs 加密存储
3. **防重复**: 新密码不能与旧密码相同

### API 安全

1. **频率限制**: 依赖阿里云 DYPNS 服务的频率限制
2. **参数验证**: 所有输入都进行格式检查
3. **错误信息**: 不透露敏感信息（如是否存在该用户）

## 🧪 测试

### 本地环境测试

1. **启动后端服务**:
   ```bash
   npm run dev
   ```

2. **发送验证码**:
   ```bash
   curl -X POST http://localhost:7001/alibaba-ai/v1/user/password/reset-code \
     -H "Content-Type: application/json" \
     -d '{"phone":"17661577859"}'
   ```

3. **检查响应中的验证码**（开发环境）

4. **重置密码**:
   ```bash
   curl -X POST http://localhost:7001/alibaba-ai/v1/user/password/reset \
     -H "Content-Type: application/json" \
     -d '{
       "phone":"17661577859",
       "code":"123456",
       "newPassword":"newpass@123"
     }'
   ```

### 生产环境测试

1. 确保手机号已在系统中注册
2. 使用真实手机接收短信
3. 将验证码提交到重置密码接口
4. 用新密码登录验证成功

## 🚨 常见问题

### Q: 当收到 "check frequency failed" 错误时怎么办？

**A**: 这是阿里云 DYPNS 的频率限制。同一手机号在短时间内频繁请求会触发此限制。
- **解决方案**: 建议在前端实现 60 秒倒计时，防止用户频繁点击发送按钮
- **重试时间**: 通常需要等待 60 秒或更长时间

### Q: 如何在生产环境中隐藏验证码？

**A**: 验证码返回是由 `NODE_ENV` 环境变量控制的：
```javascript
if (process.env.NODE_ENV === 'development') {
  // 返回验证码
}
```
确保生产环境设置 `NODE_ENV=production`

### Q: 验证码存储在哪里？

**A**: 当前实现验证码存储在 Node.js 内存中（通过 Map）。这适用于单个服务器实例。
- **生产环境改进**: 建议改为使用 Redis 存储，支持分布式部署

### Q: 如何修改验证码的有效期？

**A**: 在 `services/smsService.js` 中修改 `cacheVerificationCode` 函数：
```javascript
const expiresAt = Date.now() + 5 * 60 * 1000;  // 改为需要的毫秒数
```

## 📝 前端集成示例

### 发送验证码
```javascript
async function sendVerificationCode(phone) {
  try {
    const response = await fetch('http://localhost:7001/alibaba-ai/v1/user/password/reset-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    const data = await response.json();
    if (data.code === 200) {
      console.log('验证码已发送');
      // 返回给用户的验证码（仅开发环境）
      if (data.data?.verificationCode) {
        console.log('验证码:', data.data.verificationCode);
      }
    }
  } catch (error) {
    console.error('发送失败:', error);
  }
}
```

### 重置密码
```javascript
async function resetPassword(phone, code, newPassword) {
  try {
    const response = await fetch('http://localhost:7001/alibaba-ai/v1/user/password/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code, newPassword })
    });
    const data = await response.json();
    if (data.code === 200) {
      console.log('密码重置成功，请重新登录');
    }
  } catch (error) {
    console.error('重置失败:', error);
  }
}
```

## 📚 参考资源

- [阿里云 DYPNS 文档](https://help.aliyun.com/zh/dypns/)
- [Node.js SDK 文档](https://help.aliyun.com/zh/sdk/developer-reference/v2-nodejs-integrated-sdk)
- [API 调试工具](https://next.api.aliyun.com/api?product=Dypnsapi)

## 🔄 更新日志

### v1.0.3 (2026-03-24)
- ✨ 新增短信验证码发送功能
- ✨ 新增密码重置功能
- ✨ 集成阿里云 DYPNS 服务
- 🔒 完整的安全验证和错误处理
- 📱 前端友好的错误提示

---

**需要帮助?** 联系技术支持或查看完整的 API 文档。
