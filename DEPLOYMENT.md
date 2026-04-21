# Warm-Mate 服务器部署到阿里云ECS 完整指南

本指南将一步步教你如何把已生成的后端服务器部署到阿里云ECS实例上。

> **版本**: v1.0.2  
> **更新日期**: 2026年3月22日  
> **主要更新**: 添加UID字段支持、动态SQL安全性增强、账户管理API优化

---

## 部署清单

- [ ] 在阿里云购买并配置ECS实例
- [ ] SSH连接到ECS实例
- [ ] 安装运行环境（Node.js、MySQL）
- [ ] 上传项目代码
- [ ] 配置数据库
- [ ] 启动应用服务

---

## 第一步：购买和配置阿里云ECS

### 1.1 登录阿里云并购买ECS

1. 访问 https://www.aliyun.com
2. 登录账号或创建新账户
3. 前往 **ECS控制台** → **实例** → **创建实例**

### 1.2 推荐配置

| 配置项 | 推荐值 | 说明 |
|-------|--------|------|
| 地域 | 华东1（杭州）或最近的地域 | 选择离用户最近的 |
| 操作系统 | Ubuntu 20.04 LTS | 稳定且免费 |
| 实例规格 | ecs.t5.large（2核4GB） | 入门级足够 |
| 系统盘 | 40GB ESSD云盘 | 足够应用和数据 |
| 公网IP | 分配 | 需要访问外网 |
| 带宽 | 按流量计费 或 5Mbps固定 | 按需选择 |

### 1.3 配置安全组规则

**添加出站规则**（允许以下端口）：

| 协议 | 端口 | 来源/目的地 | 说明 |
|------|------|------------|------|
| TCP | 22 | 0.0.0.0/0 | SSH连接 |
| TCP | 80 | 0.0.0.0/0 | HTTP |
| TCP | 443 | 0.0.0.0/0 | HTTPS |
| TCP | 7001 | 0.0.0.0/0 | 应用服务器端口 |
| TCP | 3306 | 0.0.0.0/0 | MySQL数据库 |

### 1.4 创建密钥对（推荐）或设置密码

**推荐方式**：创建密钥对
- 在创建实例时，选择 **密钥对**
- 下载 `.pem` 文件并妥善保管
- 连接时使用密钥而不是密码更安全

---

## 第二步：连接到ECS实例

### 2.1 获取实例信息

1. 进入ECS控制台，找到你的实例
2. 记下：
   - **公网IP**: 例如 `1.2.3.4`
   - **用户名**: `ubuntu`（Ubuntu系统）

### 2.2 使用SSH连接

**Windows用户**（使用PowerShell或Git Bash）：
```bash
# 如果使用密钥对
ssh -i C:\path\to\key.pem ubuntu@公网IP

# 如果使用密码
ssh ubuntu@公网IP
```

**Mac/Linux用户**：
```bash
# 如果使用密钥对
chmod 400 ~/path/to/key.pem
ssh -i ~/path/to/key.pem ubuntu@公网IP

# 如果使用密码
ssh ubuntu@公网IP
```

**成功连接后会看到**：
```
ubuntu@iZj6c45z5w2z3Z:~$
```

---

## 第三步：在ECS上安装运行环境

### 3.1 更新系统包

```bash
sudo apt update
sudo apt upgrade -y
```

### 3.2 安装Node.js和npm

```bash
# 下载并运行Node.js官方安装脚本
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# 安装Node.js
sudo apt install -y nodejs

# 验证安装
node -v
npm -v
```

### 3.3 安装MySQL

```bash
# 安装MySQL服务器
sudo apt install -y mysql-server

# 启动MySQL服务
sudo systemctl start mysql
sudo systemctl enable mysql

# 验证MySQL运行
sudo systemctl status mysql
```

### 3.4 初始化MySQL

```bash
# 加固MySQL安装（按提示设置）
sudo mysql_secure_installation

# 连接到MySQL（初始密码为空或通过上面的脚本设置）
sudo mysql -u root
```

在MySQL命令行中执行：
```sql
-- 创建数据库用户
CREATE USER 'warmmate'@'localhost' IDENTIFIED BY 'warmmate123@';
CREATE USER 'warmmate'@'%' IDENTIFIED BY 'warmmate123@';

-- 授予权限
GRANT ALL PRIVILEGES ON *.* TO 'warmmate'@'localhost' WITH GRANT OPTION;
GRANT ALL PRIVILEGES ON *.* TO 'warmmate'@'%' WITH GRANT OPTION;

-- 刷新权限
FLUSH PRIVILEGES;
EXIT;
```

---

## 第四步：上传项目代码

### 4.1 方式一：使用scp命令（推荐新手）

在你的**本地Windows/Mac**上运行（不是在ECS上）：

```bash
# 从本地上传整个warm-mate-server目录到服务器
scp -r C:\Users\while\Desktop\warm-mate-server ubuntu@公网IP:/home/ubuntu/

# 如果使用密钥
scp -i C:\path\to\key.pem -r C:\Users\while\Desktop\warm-mate-server ubuntu@公网IP:/home/ubuntu/
```

### 4.2 方式二：使用Git（推荐）

在ECS上执行：
```bash
cd /home/ubuntu
git clone https://github.com/你的用户名/warm-mate-server.git
```

### 4.3 验证上传

SSH连接到ECS，检查文件：
```bash
ls -la /home/ubuntu/warm-mate-server
```

应该看到 `app.js`, `package.json` 等文件。

---

## 第五步：配置和启动应用

### 5.1 进入项目目录

```bash
cd /home/ubuntu/warm-mate-server
```

### 5.2 安装Node.js依赖

```bash
npm install
```

### 5.3 配置环境变量

```bash
# 复制.env示例文件
cp .env.example .env

# 编辑配置文件
nano .env
```

**修改以下配置**：
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=warmmate
DB_PASSWORD=warmmate123@
DB_NAME=warm_mate
PORT=7001
JWT_SECRET=生成一个强密钥_更改此项
NODE_ENV=production
```

**生成安全的JWT_SECRET的方法**：
```bash
# 在本地生成并复制
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

按 `Ctrl+X` → `Y` → `Enter` 保存并退出nano编辑器

### 5.4 初始化数据库

```bash
# 执行初始化SQL脚本
mysql -u warmmate -p warmmate123@ warm_mate < sql/init.sql

# 按提示输入密码（再次输入密码）
```

**验证数据库创建**：
```bash
mysql -u warmmate -p
# 输入密码：warmmate123@

# 在MySQL中执行
SHOW DATABASES;
USE warm_mate;
SHOW TABLES;
```

---

## 第六步：启动应用服务

### 6.1 使用PM2进程管理（推荐）

```bash
# 全局安装PM2
sudo npm install -g pm2

# 启动应用
pm2 start app.js --name "warm-mate"

# 设置开机自启
pm2 startup
pm2 save

# 查看运行状态
pm2 status
pm2 logs warm-mate
```

### 6.2 验证服务是否运行

```bash
# 检查进程
ps aux | grep node

# 检查端口是否监听
sudo netstat -tlnp | grep 7001
```

---

## 第七步：测试API

### 7.1 在ECS上使用curl测试

```bash
# 测试健康检查
curl http://localhost:7001/health

# 测试注册接口
curl -X POST http://localhost:7001/alibaba-ai/v1/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123",
    "phone": "13800138000",
    "email": "test@example.com"
  }'

# 测试登录接口
curl -X POST http://localhost:7001/alibaba-ai/v1/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

### 7.2 获取公网IP并从本地测试

```bash
# 在本地电脑（Windows/Mac）打开PowerShell或终端
curl http://ECS公网IP:7001/health
```

应该返回：
```json
{
  "code": 200,
  "message": "服务器运行正常",
  "timestamp": "2024-03-21T12:34:56.000Z"
}
```

---

## 第八步：更新前端配置

### 8.1 修改Warm-Mate前端项目

编辑 [common/config/env.js](../../common/config/env.js)：

```javascript
// prod-生产 dev-开发 local-本地
const env = "local"  // 或改成 "prod"

const prod = {
    baseUrl: 'http://ECS公网IP:7001/alibaba-ai/v1'
}
const dev = {
    baseUrl: 'http://ECS公网IP:7001/alibaba-ai/v1'
}
const local = {
    baseUrl: 'http://ECS公网IP:7001/alibaba-ai/v1'
}

const config = { dev, prod, local }
export default config[env]
```

### 8.2 前端登录后保存token

在前端代码中，登录成功后保存token：

```javascript
// 某个登录组件
const handleLogin = async (username, password) => {
    const response = await uni.$u.http.post(
        "/login",
        { username, password },
        { custom: { auth: false } }
    );
    
    if (response.code === 200) {
        // 保存token到本地存储
        uni.setStorageSync("Access-Token", response.data.token);
        // 保存用户信息
        uni.setStorageSync("userInfo", response.data);
        // 跳转到首页
        uni.navigateTo({ url: '/pages/index/index' });
    }
};
```

---

## 🔍 常见问题排查

### 问题1：无法连接数据库

```bash
# 检查MySQL是否运行
sudo systemctl status mysql

# 重启MySQL
sudo systemctl restart mysql

# 检查连接
mysql -u warmmate -p warmmate123@ warm_mate -e "SELECT 1"
```

### 问题2：端口被占用

```bash
# 检查谁占用了7001端口
sudo lsof -i :7001

# 如果已有进程，结束它
sudo kill -9 进程ID
```

### 问题3：应用无法启动

```bash
# 查看PM2日志
pm2 logs warm-mate

# 或手动启动查看错误
node app.js
```

### 问题4：安全组规则未生效

1. 进入阿里云ECS控制台
2. 找到实例 → 安全组 → 配置规则
3. 确认7001端口已添加入站规则

---

## 📊 性能优化建议

### 1. 启用Nginx反向代理（可选）

```bash
sudo apt install -y nginx

# 编辑nginx配置
sudo nano /etc/nginx/sites-available/default
```

添加以下内容：
```nginx
server {
    listen 80;
    server_name 你的IP或域名;

    location /alibaba-ai/v1 {
        proxy_pass http://localhost:7001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /health {
        proxy_pass http://localhost:7001;
    }
}
```

重启nginx：
```bash
sudo systemctl restart nginx
```

### 2. 配置MySQL性能参数

根据ECS规格修改 `/etc/mysql/mysql.conf.d/mysqld.cnf`：
- `max_connections`: 根据预期用户数调整
- `query_cache_size`: 缓存查询结果

### 3. 使用HTTPS（推荐生产）

使用Let's Encrypt免费证书：
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d 你的域名
```

---

## 安全加固

### 1. 更改默认SSH端口

```bash
sudo nano /etc/ssh/sshd_config

# 修改 Port 从22改为其他值（如2222）
# 然后重启SSH服务
sudo systemctl restart sshd
```

### 2. 配置防火墙

```bash
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 7001/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 3. 定期备份

```bash
# 定期备份MySQL数据库
mysqldump -u warmmate -p warmmate123@ warm_mate > /backup/warm_mate_backup.sql
```

---

## 🎯 监控和维护

### 1. 查看应用日志

```bash
pm2 logs warm-mate --lines 50
```

### 2. 监控资源使用

```bash
# 实时监控
pm2 monit

# 或使用系统命令
top
free -h
df -h
```

### 3. 自动重启失败的应用

```bash
pm2 start app.js --name "warm-mate" --watch --max-memory-restart 1G
```

---

## ✨ 完成！

祝贺！你已成功部署了Warm-Mate后端服务器。

### 下一步：
1. 测试所有API端点
2. 更新前端配置
3. 进行压力测试
4. 配置HTTPS（生产环境）
5. 设置自动备份

如有问题，查看日志是最有效的调试方式：
```bash
pm2 logs warm-mate
tail -f /var/log/mysql/error.log
```
