# Offer-Mate 与 Warm-Mate 并行部署指南

本文档说明如何在同一台服务器上并行部署 Offer-Mate 和 Warm-Mate 后端服务，且相互独立。

---

## 📋 部署架构

```
┌─────────────────────────────────────────────┐
│         阿里云 ECS 服务器                     │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │       Nginx / 负载均衡器              │  │
│  │   :80 → /warm-mate → :7001          │  │
│  │   :80 → /offer-mate → :7002         │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Warm-Mate App   │  │ Offer-Mate App  │  │
│  │   :7001         │  │   :7002         │  │
│  └────────┬────────┘  └────────┬────────┘  │
│           │                    │           │
│  ┌────────▼─────────────────────▼────────┐ │
│  │      MySQL 数据库 (多库模式)           │ │
│  │                                       │ │
│  │  ┌────────────────┬─────────────────┐ │ │
│  │  │  warm_mate DB  │  offer_mate DB  │ │ │
│  │  │  (独立用户)    │  (独立用户)     │ │ │
│  │  └────────────────┴─────────────────┘ │ │
│  └───────────────────────────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🔧 配置说明

### 项目标识和端口

| 项目 | 端口 | API前缀 | 数据库 | 数据库用户 |
|------|------|--------|--------|-----------|
| **Warm-Mate** | 7001 | `/alibaba-ai/v1` | `warm_mate` | `warmmate` |
| **Offer-Mate** | 7002 | `/offer-mate/v1` | `offer_mate` | `offermate` |

---

## 📝 部署步骤

### 第一步：准备数据库

在 MySQL 服务器上执行以下命令（以 root 用户或具有创建数据库权限的用户）：

```sql
-- 创建 Offer-Mate 数据库
CREATE DATABASE IF NOT EXISTS offer_mate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建 Offer-Mate 数据库用户
CREATE USER IF NOT EXISTS 'offermate'@'localhost' IDENTIFIED BY 'offermate123@';
CREATE USER IF NOT EXISTS 'offermate'@'%' IDENTIFIED BY 'offermate123@';

-- 授予权限
GRANT ALL PRIVILEGES ON offer_mate.* TO 'offermate'@'localhost';
GRANT ALL PRIVILEGES ON offer_mate.* TO 'offermate'@'%';

-- 刷新权限
FLUSH PRIVILEGES;
```

**注意**：如果已有 Warm-Mate 数据库和用户，则无需重复创建。

### 第二步：初始化 Offer-Mate 数据库表

在 Offer-Mate 服务器目录中：

```bash
# 使用 MySQL 客户端导入初始化脚本
mysql -h localhost -u offermate -p'offermate123@' offer_mate < sql/init.sql

# 如果有迁移脚本，也需要执行
mysql -h localhost -u offermate -p'offermate123@' offer_mate < sql/add_conversations_table.sql
```

或者在 MySQL 命令行中：

```sql
USE offer_mate;
-- 然后粘贴 sql/init.sql 中的内容
```

### 第三步：配置 Offer-Mate 环境变量

编辑 Offer-Mate 项目根目录的 `.env` 文件：

```env
# 应用环境配置
NODE_ENV=production
PORT=7002
API_PREFIX=/offer-mate/v1

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=offermate
DB_PASSWORD=offermate123@
DB_NAME=offer_mate

# JWT认证配置
JWT_SECRET=<生成一个安全的密钥>
JWT_EXPIRES_IN=7d
```

**⚠️ 生产环境需要修改**：
- `JWT_SECRET` - 使用强密码，至少32个字符
- `DB_PASSWORD` - 修改为强密码
- 使用实际的服务器地址替换 `DB_HOST`

### 第四步：启动 Offer-Mate 服务

```bash
cd /path/to/Offer-Mate-Server

# 安装依赖
npm install

# 开发环境启动（带热重载）
npm run dev

# 生产环境启动
npm start
```

**输出示例**：
```
🚀 Offer-Mate 服务器运行在 http://localhost:7002
📍 API前缀: /offer-mate/v1
🌐 环境: production
✅ 数据库连接成功
```

### 第五步：配置 Warm-Mate（已有项目）

确保 Warm-Mate 的 `.env` 配置为：

```env
NODE_ENV=production
PORT=7001
API_PREFIX=/alibaba-ai/v1
DB_HOST=localhost
DB_PORT=3306
DB_USER=warmmate
DB_PASSWORD=warmmate123@
DB_NAME=warm_mate
```

### 第六步：配置 Nginx（可选但推荐）

如果使用 Nginx 作为反向代理：

```nginx
# /etc/nginx/conf.d/offer-mate.conf

server {
    listen 80;
    server_name your-domain.com;

    # Warm-Mate 路由
    location /alibaba-ai/v1/ {
        proxy_pass http://localhost:7001/alibaba-ai/v1/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Offer-Mate 路由
    location /offer-mate/v1/ {
        proxy_pass http://localhost:7002/offer-mate/v1/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 健康检查
    location /health/warm-mate {
        proxy_pass http://localhost:7001/health;
    }

    location /health/offer-mate {
        proxy_pass http://localhost:7002/health;
    }
}
```

然后重启 Nginx：
```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔍 验证部署

### 测试 Warm-Mate 服务

```bash
curl http://localhost:7001/health
# 或通过 Nginx
curl http://your-domain.com/alibaba-ai/v1/health
```

### 测试 Offer-Mate 服务

```bash
curl http://localhost:7002/health
# 或通过 Nginx
curl http://your-domain.com/offer-mate/v1/health
```

### 验证数据库独立性

```bash
# 连接 Offer-Mate 数据库
mysql -h localhost -u offermate -p'offermate123@' offer_mate

# 查看表
SHOW TABLES;

# 查看用户表
SELECT COUNT(*) FROM users;
```

---

## 📊 监控和日志

### 查看 Offer-Mate 日志

```bash
# 前台运行（方便查看日志）
npm run dev

# 后台运行（使用 PM2）
pm2 start app.js --name "offer-mate"
pm2 logs offer-mate
```

### 使用 PM2 管理进程

```bash
# 全局安装 PM2
npm install -g pm2

# 启动 Warm-Mate
cd /path/to/Warm-Mate-Server
pm2 start app.js --name "warm-mate" --env production

# 启动 Offer-Mate
cd /path/to/Offer-Mate-Server
pm2 start app.js --name "offer-mate" --env production

# 查看所有进程
pm2 list

# 重启特定服务
pm2 restart warm-mate
pm2 restart offer-mate

# 查看日志
pm2 logs warm-mate
pm2 logs offer-mate
```

---

## 🔐 安全建议

1. **数据库隔离**：
   - 使用不同的数据库用户
   - 为每个用户仅授予对应数据库的权限
   
2. **JWT 密钥**：
   - 为 Warm-Mate 和 Offer-Mate 使用不同的 JWT_SECRET
   - 定期轮换 JWT_SECRET（需要用户重新登录）

3. **密码管理**：
   - 生产环境修改所有默认密码
   - 使用密钥管理服务存储敏感信息

4. **防火墙**：
   - 只开放必要的端口（80, 443）
   - 限制数据库访问（仅允许本地或授权 IP）

5. **定期备份**：
   - 定期备份 `warm_mate` 和 `offer_mate` 数据库
   - 测试备份的恢复过程

---

## 🔄 数据迁移和备份

### 备份 Offer-Mate 数据库

```bash
mysqldump -h localhost -u offermate -p'offermate123@' offer_mate > offer_mate_backup.sql
```

### 恢复数据库

```bash
mysql -h localhost -u offermate -p'offermate123@' offer_mate < offer_mate_backup.sql
```

---

## ❓ 常见问题

### Q: 两个服务能同时运行吗？
**A**: 是的，可以。使用 PM2 或 systemd 管理两个独立的 Node.js 进程。

### Q: 数据是否完全隔离？
**A**: 是的。使用了不同的数据库、用户和 JWT_SECRET，数据完全隔离，互不影响。

### Q: 如何快速切换到不同的数据库？
**A**: 修改 `.env` 文件中的 `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`，然后重启应用。

### Q: 前端如何调用两个服务的接口？
**A**: 
- Warm-Mate: `/alibaba-ai/v1/...`
- Offer-Mate: `/offer-mate/v1/...`

可以在前端配置中分别设置两个服务器地址。

---

## 📞 支持和问题反馈

如有部署问题，请检查：
1. MySQL 是否正常运行
2. `.env` 配置是否正确
3. 数据库用户是否有正确的权限
4. 防火墙是否允许相应端口

