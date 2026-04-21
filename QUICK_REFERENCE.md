# 快速参考：Offer-Mate vs Warm-Mate 配置

## 关键差异对比

### 1️⃣ 端口和 API 路由

```
Warm-Mate:
  端口: 7001
  API 前缀: /alibaba-ai/v1
  示例: http://localhost:7001/alibaba-ai/v1/user/login

Offer-Mate:
  端口: 7002
  API 前缀: /offer-mate/v1
  示例: http://localhost:7002/offer-mate/v1/user/login
```

### 2️⃣ 数据库配置

```
Warm-Mate:
  数据库名: warm_mate
  用户名: warmmate
  密码: warmmate123@
  主机: localhost
  端口: 3306

Offer-Mate:
  数据库名: offer_mate
  用户名: offermate
  密码: offermate123@
  主机: localhost
  端口: 3306
```

### 3️⃣ JWT 认证密钥

```
Warm-Mate:
  JWT_SECRET: [生产环境应修改]
  JWT_EXPIRES_IN: 7d

Offer-Mate:
  JWT_SECRET: offer_mate_secret_key_change_in_production_12345
  JWT_EXPIRES_IN: 7d

⚠️ 注意: 每个项目应使用不同的 JWT_SECRET，以确保 token 完全独立
```

### 4️⃣ 项目标识

```
package.json name:
  Warm-Mate: "warm-mate-server"
  Offer-Mate: "offer-mate-server"

启动消息:
  Warm-Mate: "🚀 Warm-Mate 服务器运行在 http://localhost:7001"
  Offer-Mate: "🚀 Offer-Mate 服务器运行在 http://localhost:7002"
```

---

## 🚀 快速启动

### 开发环境

```bash
# 终端 1 - 启动 Warm-Mate
cd Offer-Mate-Server
npm install
npm run dev

# 终端 2 - 启动 Offer-Mate
cd Offer-Mate-Server
npm install
npm run dev
```

### 生产环境（使用 PM2）

```bash
# 启动两个服务
pm2 start Offer-Mate-Server/app.js --name "offer-mate" --env production
pm2 start Warm-Mate-Server/app.js --name "warm-mate" --env production

# 查看状态
pm2 status

# 查看日志
pm2 logs
```

---

## 🔄 环境变量检查列表

启动服务前，确保 `.env` 文件包含：

- [ ] `NODE_ENV` - 设置为 `production` 或 `development`
- [ ] `PORT` - Offer-Mate 应为 `7002`
- [ ] `API_PREFIX` - Offer-Mate 应为 `/offer-mate/v1`
- [ ] `DB_HOST` - 数据库服务器地址
- [ ] `DB_PORT` - 数据库端口（默认 3306）
- [ ] `DB_USER` - Offer-Mate 应为 `offermate`
- [ ] `DB_PASSWORD` - 数据库密码
- [ ] `DB_NAME` - Offer-Mate 应为 `offer_mate`
- [ ] `JWT_SECRET` - 更改为安全的值
- [ ] `JWT_EXPIRES_IN` - Token 过期时间

---

## 📋 数据库初始化

初始化 Offer-Mate 数据库：

```bash
# 连接到数据库
mysql -h localhost -u offermate -p'offermate123@'

# 在 MySQL 客户端中
source sql/init.sql;
source sql/add_conversations_table.sql;

# 或使用命令行
mysql -h localhost -u offermate -p'offermate123@' offer_mate < sql/init.sql
mysql -h localhost -u offermate -p'offermate123@' offer_mate < sql/add_conversations_table.sql
```

---

## ✅ 验证检查

启动服务后，验证以下内容：

```bash
# 健康检查
curl http://localhost:7002/health
# 应返回: {"code":200,"message":"服务器运行正常",...}

# 检查数据库连接
curl http://localhost:7002/offer-mate/v1/user/login
# 应返回相关的响应（具体取决于实现）

# 查看日志确保没有错误
npm run dev  # 开发环境可看到详细输出
```

---

## 🔐 生产环境检查表

- [ ] 修改 `JWT_SECRET` 为强密码（至少 32 个字符）
- [ ] 修改所有数据库密码
- [ ] 设置 `NODE_ENV=production`
- [ ] 配置 Nginx 反向代理（可选）
- [ ] 配置 SSL/TLS 证书
- [ ] 启用数据库备份
- [ ] 配置日志收集和监控
- [ ] 设置自动重启（PM2, systemd, 等）
- [ ] 定期检查日志和错误

