# 🎯 快速开始指南（5分钟本地开发 vs 1小时ECS部署）

选择你的场景开始：

> **版本**: v1.0.3 | **更新**: 2026年3月25日

---

## 🚀 场景一：本地开发（5分钟）

### 快速启动

```bash
# 1. 进入项目目录
cd C:\Users\while\Desktop\warm-mate-server

# 2. 安装依赖
npm install

# 3. 配置环境
cp .env.example .env
# 编辑 .env，配置本地数据库信息

# 4. 启动数据库初始化
mysql -u root -p < sql/init.sql

# 5. 启动开发服务器（支持热重载）
npm run dev
```

✅ 服务器运行在 `http://localhost:7001`

**下一步**: 
- 查看 [API.md](API.md) 测试所有接口
- 修改代码 → 自动重载
- 修改 `routes/` 或 `controllers/` 中的代码

---

## ☁️ 场景二：部署到阿里云ECS（1小时）

### ⏱️ 3步快速部署

**第一步**：购买ECS实例（20分钟）
- 登录 https://www.aliyun.com
- 购买 Ubuntu 20.04 LTS（2核4GB，40GB盘）
- 配置安全组开放:  22, 7001, 80, 443, 3306 端口
- 记下公网IP和用户名

**第二步**：配置服务器（20分钟）
```bash
# SSH连接到服务器
ssh ubuntu@你的ECS公网IP

# 一键安装（复制粘贴下面整个脚本）
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt update && sudo apt install -y nodejs mysql-server
sudo systemctl start mysql && sudo systemctl enable mysql

# 初始化MySQL
sudo mysql -u root << EOF
CREATE USER 'warmmate'@'%' IDENTIFIED BY 'warmmate123@';
GRANT ALL PRIVILEGES ON *.* TO 'warmmate'@'%';
FLUSH PRIVILEGES;
EOF
```

**第三步**：上传并启动应用（20分钟）
```bash
# 在本地电脑执行
scp -r C:\Users\while\Desktop\warm-mate-server ubuntu@你的ECS公网IP:/home/ubuntu/

# SSH到服务器
ssh ubuntu@你的ECS公网IP

# 启动应用
cd warm-mate-server
npm install
cat sql/init.sql | mysql -u warmmate -p'warmmate123@' -h localhost

# 启动应用（后台运行推荐使用PM2）
npm install -g pm2
pm2 start app.js --name "warm-mate"
pm2 startup
pm2 save
```

✅ 应用运行在 `http://你的ECS公网IP:7001`

### 📖 详细步骤

完整的部署文档在 [DEPLOYMENT.md](DEPLOYMENT.md)
```

**回到SSH连接，启动应用**：
```bash
# 进入项目
cd /home/ubuntu/warm-mate-server

# 复制环境配置
cp .env.example .env

# 编辑.env文件，修改以下内容
nano .env
```

**在nano中修改这些值**：
```
DB_HOST=localhost
DB_USER=warmmate
DB_PASSWORD=warmmate123@
DB_NAME=warm_mate
PORT=7001
JWT_SECRET=change_me_to_random_secret_123456
NODE_ENV=production
```

保存：按 `Ctrl+X` → `Y` → `Enter`

**继续启动**：
```bash
# 安装依赖
npm install

# 初始化数据库
mysql -u warmmate -p warmmate123@ warm_mate < sql/init.sql
# 输入密码：warmmate123@

# 安装PM2进程管理
sudo npm install -g pm2

# 启动应用
pm2 start app.js --name "warm-mate"

# 设置开机自启
pm2 startup
pm2 save

# 检查状态
pm2 status
```

---

## ✅ 验证部署成功

### 1️⃣ **服务器端验证**

在ECS上运行：
```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs warm-mate

# 测试API连接
curl http://localhost:7001/health
```

应该返回：
```json
{"code": 200, "message": "服务器运行正常", ...}
```

### 2️⃣ **从本地验证**

在你的Windows电脑PowerShell中：
```bash
curl http://ECS公网IP:7001/health
```

应该成功响应。

### 3️⃣ **测试用户注册**

```bash
curl -X POST http://ECS公网IP:7001/alibaba-ai/v1/register `
  -H "Content-Type: application/json" `
  -d '{
    "username": "testuser",
    "password": "password123",
    "phone": "13800138000",
    "email": "test@example.com"
  }'
```

---

## 🔌 更新前端配置

编辑你的Warm-Mate项目中的 **common/config/env.js**：

```javascript
const env = "local"

const prod = {
    baseUrl: 'http://你的ECS公网IP:7001/alibaba-ai/v1'
}
const dev = {
    baseUrl: 'http://你的ECS公网IP:7001/alibaba-ai/v1'
}
const local = {
    baseUrl: 'http://你的ECS公网IP:7001/alibaba-ai/v1'
}

const config = { dev, prod, local }
export default config[env]
```

---

## 📚 详细文档

本项目包含三份完整的参考文档：

1. **[DEPLOYMENT.md](DEPLOYMENT.md)** 
   - ⭐ 完整的部署步骤和troubleshooting
   - 阿里云ECS详细配置
   - PM2进程管理
   - 性能优化

2. **[INTEGRATION.md](INTEGRATION.md)**
   - ⭐ 前后端集成指南
   - 登录/注册流程
   - Token处理
   - 完整登录页面示例

3. **[README.md](README.md)**
   - ⭐ API文档和项目结构
   - 数据库Schema
   - 环境变量说明

---

## 🐛 快速排查

| 问题 | 解决方案 |
|------|---------|
| 无法连接数据库 | `sudo systemctl restart mysql` 并检查密码 |
| 端口被占用 | `sudo lsof -i :7001` 然后 `sudo kill -9 PID` |
| 无法SSH连接 | 检查安全组规则和IP地址 |
| 应用无法启动 | `pm2 logs warm-mate` 查看错误日志 |
| 无法从本地访问 | 检查ECS防火墙规则是否开放7001端口 |

---

## 📊 项目结构

```
warm-mate-server/
├── app.js                    # 主应用入口
├── package.json              # 依赖配置
├── .env.example              # 环境变量示例
├── config/
│   └── database.js           # 数据库连接
├── models/
│   └── User.js               # 用户模型 + 密码加密
├── controllers/
│   └── userController.js     # 业务逻辑
├── routes/
│   └── auth.js               # 用户认证路由
├── middleware/
│   └── auth.js               # JWT验证中间件
├── sql/
│   └── init.sql              # 数据库初始化SQL
├── README.md                 # API文档
├── DEPLOYMENT.md             # 完整部署指南
└── INTEGRATION.md            # 前后端集成指南
```

---

## 🔐 安全特性

✅ **已包含的安全措施**：
- 密码使用bcryptjs加密
- JWT token认证（7天过期）
- CORS防护
- SQL注入防护（参数化查询）
- 错误信息不泄露敏感数据

✅ **生产环境建议**：
- 修改所有默认密码
- 启用HTTPS/SSL证书
- 配置反向代理（Nginx）
- 设置防火墙规则
- 定期备份数据库

---

## 🎓 下一步学习

### 添加更多功能
- 添加问卷API（保存和查询）
- 添加消息系统
- 用户头像上传
- 心理评测模块

### 性能优化
- [ ] 启用Redis缓存
- [ ] 配置Nginx反向代理
- [ ] 数据库查询优化
- [ ] 添加日志系统

### 生产就绪
- [ ] 配置HTTPS
- [ ] 自动备份脚本
- [ ] 监控和告警
- [ ] 负载均衡

---

## 💬 需要帮助？

### 检查清单
- [ ] 是否成功创建了ECS实例？
- [ ] 是否能SSH连接到服务器？
- [ ] 是否安装了Node.js和MySQL？
- [ ] 是否成功初始化了数据库？
- [ ] 是否成功启动了应用（pm2 status）？
- [ ] 是否能从本地访问API（curl测试）？
- [ ] 是否更新了前端配置？

如有问题，查看详细文档中的troubleshooting部分。

---

## 🚀 完成时间表

| 任务 | 时间 | 完成 |
|------|------|------|
| 购买ECS实例 | 20分钟 | ⬜ |
| 安装运行环境 | 30分钟 | ⬜ |
| 上传和启动应用 | 20分钟 | ⬜ |
| 前端配置更新 | 5分钟 | ⬜ |
| 测试验证 | 10分钟 | ⬜ |
| **总计** | **85分钟** | ⬜ |

---

**祝部署顺利！🎉**

有任何问题，参考详细文档或查看pm2日志。
