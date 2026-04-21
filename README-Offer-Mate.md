# Offer-Mate 后端服务器

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18+-blue)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-orange)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-ISC-yellow)](LICENSE)

Offer-Mate（择途）是一个针对大学生职业规划和志愿填报的智能平台后端服务。本项目是从 Warm-Mate（暖愈心伴）心理健康平台修改而来，实现了独立的数据库和服务架构，可与 Warm-Mate 并行部署在同一服务器上。

---

## 🎯 项目特性

- ✅ **独立数据库** - 使用独立的 `offer_mate` 数据库，与 Warm-Mate 完全隔离
- ✅ **独立端口** - 运行在端口 7002，与 Warm-Mate 的 7001 不冲突
- ✅ **独立 API 前缀** - API 路由前缀为 `/offer-mate/v1`
- ✅ **完整的用户认证** - JWT 令牌认证系统
- ✅ **问卷管理** - 支持多种心理评估问卷（PHQ-9, GAD-7 等）
- ✅ **消息系统** - 用户间的消息和通知功能
- ✅ **咨询预约** - 心理咨询预约管理

---

## 📋 快速开始

### 环境要求

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **MySQL** >= 8.0 或 MariaDB >= 10.6

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制 `.env.example` 为 `.env`，并填入实际的配置值：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
NODE_ENV=development
PORT=7002
API_PREFIX=/offer-mate/v1

DB_HOST=localhost
DB_PORT=3306
DB_USER=offermate
DB_PASSWORD=offermate123@
DB_NAME=offer_mate

JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
```

### 初始化数据库

#### 方式一：自动初始化（推荐）

**Windows 用户：**
```bash
setup-database.bat
```

**Linux/Mac 用户：**
```bash
bash setup-database.sh
```

#### 方式二：手动初始化

```bash
# 1. 创建数据库和用户（使用 root 或管理员账户）
mysql -u root -p << EOF
CREATE DATABASE IF NOT EXISTS offer_mate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'offermate'@'localhost' IDENTIFIED BY 'offermate123@';
CREATE USER IF NOT EXISTS 'offermate'@'%' IDENTIFIED BY 'offermate123@';
GRANT ALL PRIVILEGES ON offer_mate.* TO 'offermate'@'localhost';
GRANT ALL PRIVILEGES ON offer_mate.* TO 'offermate'@'%';
FLUSH PRIVILEGES;
EOF

# 2. 初始化表
mysql -h localhost -u offermate -p'offermate123@' offer_mate < sql/init.sql
mysql -h localhost -u offermate -p'offermate123@' offer_mate < sql/add_conversations_table.sql
```

### 启动服务

```bash
# 开发环境（带热重载）
npm run dev

# 生产环境
npm start
```

服务启动成功后，您将看到：

```
🚀 Offer-Mate 服务器运行在 http://localhost:7002
📍 API前缀: /offer-mate/v1
🌐 环境: development
✅ 数据库连接成功
```

---

## 🔌 API 端点

### 健康检查

```bash
GET /health
```

响应：
```json
{
  "code": 200,
  "message": "服务器运行正常",
  "timestamp": "2026-03-25T10:30:00.000Z"
}
```

### 认证接口

完整的 API 文档请查看 [API.md](API.md)

---

## 📊 数据库架构

### 核心表

- **users** - 用户基本信息
- **questionnaire_results** - 问卷结果
- **messages** - 消息记录
- **conversations** - 对话会话
- **appointments** - 咨询预约

详细的数据库结构请查看 [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)

---

## ⚙️ 配置说明

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `NODE_ENV` | 运行环境 (development/production) | development |
| `PORT` | 应用端口 | 7002 |
| `API_PREFIX` | API 路由前缀 | /offer-mate/v1 |
| `DB_HOST` | 数据库服务器地址 | localhost |
| `DB_PORT` | 数据库端口 | 3306 |
| `DB_USER` | 数据库用户 | offermate |
| `DB_PASSWORD` | 数据库密码 | offermate123@ |
| `DB_NAME` | 数据库名称 | offer_mate |
| `JWT_SECRET` | JWT 签名密钥 | - |
| `JWT_EXPIRES_IN` | Token 过期时间 | 7d |

更详细的配置说明请查看 [ENV_CONFIG.md](ENV_CONFIG.md)

---

## 📦 依赖包

- **express** - Web 框架
- **mysql2** - MySQL 数据库驱动
- **jsonwebtoken** - JWT 认证
- **bcryptjs** - 密码加密
- **cors** - 跨域资源共享
- **dotenv** - 环境变量管理
- **axios** - HTTP 请求库
- **multer** - 文件上传处理

---

## 🚀 部署指南

### 与 Warm-Mate 并行部署

如需在同一服务器上部署 Offer-Mate 和 Warm-Mate，请参考：

- [PARALLEL_DEPLOYMENT.md](PARALLEL_DEPLOYMENT.md) - 详细的并行部署指南
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - 快速参考和配置对比

### 到阿里云 ECS

详细步骤请查看 [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 📝 项目结构

```
├── app.js                       # 应用入口
├── config/
│   └── database.js             # 数据库连接配置
├── routes/                     # API 路由
│   ├── auth.js                 # 认证相关
│   ├── questionnaire.js        # 问卷相关
│   ├── appointment.js          # 预约相关
│   ├── message.js              # 消息相关
│   └── conversation.js         # 对话相关
├── controllers/                # 业务逻辑控制
├── models/                     # 数据模型
├── services/                   # 业务服务
├── middleware/                 # 中间件
├── sql/                        # SQL 初始化脚本
│   ├── init.sql               # 初始化表
│   └── add_conversations_table.sql  # 迁移脚本
├── .env.example               # 环境变量模板
├── package.json               # 项目依赖
└── README.md                  # 项目说明
```

---

## 🔐 安全建议

1. **修改默认密码**
   ```env
   DB_PASSWORD=change_to_strong_password
   JWT_SECRET=change_to_strong_secret
   ```

2. **环境变量管理**
   - 不要将 `.env` 提交到 Git
   - 在生产环境使用密钥管理服务（如 AWS Secrets Manager）

3. **数据库权限**
   - 仅授予必要的权限
   - 定期轮换密码

4. **定期备份**
   ```bash
   mysqldump -h localhost -u offermate -p'offermate123@' offer_mate > backup.sql
   ```

---

## 🐛 故障排除

### 数据库连接错误

```
❌ 数据库连接失败: Error: getaddrinfo ENOTFOUND localhost
```

**解决方案：**
1. 确保 MySQL 服务正在运行
2. 检查 `DB_HOST` 和 `DB_PORT` 配置
3. 验证数据库用户名和密码

### 端口占用

```
Error: listen EADDRINUSE: address already in use :::7002
```

**解决方案：**
1. 修改 `.env` 中的 `PORT`
2. 或关闭占用该端口的其他进程

### JWT 认证失败

**解决方案：**
1. 确保 JWT_SECRET 已配置
2. 检查 Token 是否过期（查看 JWT_EXPIRES_IN）

---

## 📞 支持和问题反馈

如有问题，请：

1. 查看 [QUICK_REFERENCE.md](QUICK_REFERENCE.md) 快速参考
2. 查看 [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) 开发指南
3. 检查 [API.md](API.md) API 文档

---

## 📄 相关文档

- [API.md](API.md) - 完整 API 文档
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - 数据库模式
- [ENV_CONFIG.md](ENV_CONFIG.md) - 环境变量配置
- [DEPLOYMENT.md](DEPLOYMENT.md) - 部署指南
- [PARALLEL_DEPLOYMENT.md](PARALLEL_DEPLOYMENT.md) - 并行部署指南
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - 快速参考
- [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) - 开发指南

---

## 📜 许可证

ISC

---

## 🤝 项目历史

本项目是基于 Warm-Mate（暖愈心伴）心理健康平台修改而来，为 Offer-Mate（择途）职业规划平台提供后端服务支撑。

**主要修改：**
- ✅ 更改项目名称和标识
- ✅ 独立数据库配置
- ✅ 不同的 API 前缀和端口
- ✅ 独立的 JWT 密钥
- ✅ 新增并行部署文档

---

**开发于**: 2026 年  
**最后更新**: 2026 年 3 月 25 日
