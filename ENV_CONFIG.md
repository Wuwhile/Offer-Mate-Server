# 环境变量配置指南

本文档详细说明所有环境变量的配置方法。

---

## 复制模板

1. 复制 `.env.example` 到 `.env`：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，填入你的实际值

---

## 🗂️ 所有环境变量

### 📦 基础配置

#### `NODE_ENV`
- **类型**: string
- **值**: `development` | `production` | `test`
- **默认**: `development`
- **说明**: 应用运行环境
- **示例**: `NODE_ENV=production`

#### `PORT`
- **类型**: number
- **值**: 1024-65535
- **默认**: `7001`
- **说明**: 应用监听端口
- **示例**: `PORT=7001`

#### `API_PREFIX`
- **类型**: string
- **值**: 任意路径
- **默认**: `/alibaba-ai/v1`
- **说明**: API路由前缀
- **示例**: `API_PREFIX=/api/v1`

---

### 🗄️ 数据库配置

#### `DB_HOST`
- **类型**: string
- **默认**: `localhost`
- **说明**: MySQL服务器地址
- **示例**: 
  - 本地：`DB_HOST=localhost`
  - 云服务器：`DB_HOST=rm-xxx.mysql.rds.aliyuncs.com`

#### `DB_PORT`
- **类型**: number
- **默认**: `3306`
- **说明**: MySQL端口
- **示例**: `DB_PORT=3306`

#### `DB_USER`
- **类型**: string
- **默认**: `warmmate`
- **说明**: MySQL用户名
- **示例**: `DB_USER=warmmate`

#### `DB_PASSWORD`
- **类型**: string
- **默认**: `warmmate123@`
- **说明**: MySQL用户密码
- **⚠️ 重要**: 生产环境必须更改！
- **示例**: `DB_PASSWORD=your_secure_password`

#### `DB_NAME`
- **类型**: string
- **默认**: `warm_mate`
- **说明**: 数据库名称
- **示例**: `DB_NAME=warm_mate`

---

### 🔐 JWT认证配置

#### `JWT_SECRET`
- **类型**: string
- **默认**: `your_secret_key_here`
- **说明**: JWT签名密钥
- **⚠️ 推荐**: 使用至少32位的随机字符串
- **示例**: `JWT_SECRET=abcdef1234567890ABCDEF1234567890`
- **生成命令**: 
  ```bash
  # Linux/Mac
  openssl rand -base64 32
  
  # PowerShell (Windows)
  [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((Get-Random -Maximum 999999)))
  ```

#### `JWT_EXPIRES_IN`
- **类型**: string
- **默认**: `7d` (7天)
- **说明**: 令牌有效期
- **格式**: `30s` | `2d` | `7d` | `30d`
- **示例**: `JWT_EXPIRES_IN=7d`

---

### 🤖 阿里云千问AI配置

#### `QIANWEN_API_KEY`
- **类型**: string
- **说明**: 千问AI API密钥
- **获取步骤**:
  1. 登录 https://bailian.console.aliyun.com/
  2. 进入 API 密钥管理
  3. 创建或复制 API Key
- **示例**: `QIANWEN_API_KEY=sk-xxx`

#### `QIANWEN_MODEL`
- **类型**: string
- **默认**: `qwen-plus`
- **说明**: 千问模型名称
- **可选值**:
  - `qwen-turbo` - 更快
  - `qwen-plus` - 推荐（平衡）
  - `qwen-max` - 更智能
  - `qwen-max-latest` - 最新
- **示例**: `QIANWEN_MODEL=qwen-plus`

---

### 📱 阿里云短信服务（DYPNS）配置

#### `ALIBABA_CLOUD_ACCESS_KEY_ID`
- **类型**: string
- **说明**: 阿里云访问密钥ID
- **获取步骤**:
  1. 登录 https://ram.console.aliyun.com/
  2. 创建RAM用户或使用主账号
  3. 获取 Access Key ID
- **示例**: `ALIBABA_CLOUD_ACCESS_KEY_ID=LTAI5G...`

#### `ALIBABA_CLOUD_ACCESS_KEY_SECRET`
- **类型**: string
- **说明**: 阿里云访问密钥Secret
- **⚠️ 重要**: 妥善保管，勿泄露！
- **示例**: `ALIBABA_CLOUD_ACCESS_KEY_SECRET=xxx...`

#### `SMS_SIGN_NAME`
- **类型**: string
- **说明**: 短信签名（需在阿里云控制台申请并通过审核）
- **示例**: `SMS_SIGN_NAME=Warm-Mate`

#### `SMS_TEMPLATE_CODE`
- **类型**: string
- **说明**: 短信模板代码
- **获取步骤**:
  1. 登录阿里云短信控制台
  2. 创建短信模板
  3. 获取模板Code
- **示例**: `SMS_TEMPLATE_CODE=SMS_100003`

---

## 📋 配置示例

### 本地开发环境 (.env)

```bash
# 基础配置
NODE_ENV=development
PORT=7001
API_PREFIX=/alibaba-ai/v1

# 数据库配置（本地MySQL）
DB_HOST=localhost
DB_PORT=3306
DB_USER=warmmate
DB_PASSWORD=warmmate123@
DB_NAME=warm_mate

# JWT认证（开发用随机值即可）
JWT_SECRET=dev-secret-key-not-secure-for-production
JWT_EXPIRES_IN=7d

# 千问AI（可选，未配置时某些功能受限）
QIANWEN_API_KEY=sk-your-dashscope-api-key
QIANWEN_MODEL=qwen-plus

# SMS短信（可选，未配置时密码重置功能不可用）
ALIBABA_CLOUD_ACCESS_KEY_ID=your-access-key-id
ALIBABA_CLOUD_ACCESS_KEY_SECRET=your-access-key-secret
SMS_SIGN_NAME=your-sign-name
SMS_TEMPLATE_CODE=your-template-code
```

### 生产环境 (.env)

```bash
# 基础配置
NODE_ENV=production
PORT=7001
API_PREFIX=/alibaba-ai/v1

# 数据库配置（云服务器）
DB_HOST=rm-abc123.mysql.rds.aliyuncs.com
DB_PORT=3306
DB_USER=warmmate
DB_PASSWORD=SuperSecurePassword123!@#
DB_NAME=warm_mate

# JWT认证（生成复杂密钥）
JWT_SECRET=3413c47df5e69fb46c1427775a049098fe7d0639571c5cbbecf77c7b2fdf6030
JWT_EXPIRES_IN=7d

# 千问AI（必须配置）
QIANWEN_API_KEY=sk-abc123def456...
QIANWEN_MODEL=qwen-plus

# SMS短信（必须配置）
ALIBABA_CLOUD_ACCESS_KEY_ID=LTAI5GxxxXxxx
ALIBABA_CLOUD_ACCESS_KEY_SECRET=xxx...
SMS_SIGN_NAME=Warm-Mate
SMS_TEMPLATE_CODE=SMS_100003
```

---

## ✅ 配置检查清单

在启动应用前，验证以下项：

- [ ] `.env` 文件已创建
- [ ] 数据库连接信息正确
- [ ] JWT_SECRET 已设置（生产环境应为复杂值）
- [ ] 数据库已初始化（运行 `sql/init.sql`）
- [ ] （可选）千问API Key已配置
- [ ] （可选）短信服务已配置

---

## 🔧 常见问题

### Q: 如何生成安全的JWT_SECRET？

```bash
# Linux/Mac
openssl rand -base64 32

# PowerShell (Windows)
$bytes = [System.Text.Encoding]::UTF8.GetBytes((1..32 | ForEach-Object { [char](Get-Random -Minimum 33 -Maximum 126) }) -join '')
[Convert]::ToBase64String($bytes)
```

### Q: 生产环境密码遗漏了怎么办？

密码错误会导致数据库连接失败。检查logs查看错误信息：
```
Error: ER_ACCESS_DENIED_FOR_USER 'warmmate'@'xxx' (using password: YES)
```

### Q: 千问API Key如何获取？

1. 访问 https://bailian.console.aliyun.com/
2. 创建API Key（需实名认证、充值）
3. 复制Key ID和Secret

### Q: 短信模板如何创建？

在阿里云短信控制台创建，示例：
```
您的验证码是：##code##，有效期为5分钟，请勿泄露。
```

---

## 🔒 安全建议

1. **绝不提交 .env 到Git**
   ```bash
   # 已在 .gitignore 中
   .env
   ```

2. **生产环境密钥管理**
   - 使用密钥管理服务（如阿里云KMS）
   - 定期轮换密钥
   - 限制访问权限

3. **数据库密码**
   - 生产环境使用强密码
   - 定期修改
   - 不同环境使用不同密码

4. **API Key保管**
   - 定期检查使用情况
   - 及时撤销无用密钥
   - 监控异常请求

---

## 📞 获取帮助

- 环境变量错误导致启动失败？查看 `console` 输出的错误信息
- API连接失败？检查 `DB_HOST`, `DB_USER`, `DB_PASSWORD`
- 功能不完整？确认相关环境变量已配置
