#!/bin/bash

# ============================================
# Offer-Mate 数据库初始化脚本
# ============================================
# 用法: bash ./setup-database.sh

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}================================================${NC}"
echo -e "${YELLOW}   Offer-Mate 数据库初始化脚本${NC}"
echo -e "${YELLOW}================================================${NC}"

# 检查 mysql 是否安装
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}❌ 错误: mysql-client 未安装${NC}"
    echo "请先安装 MySQL 客户端:"
    echo "  Ubuntu/Debian: sudo apt-get install mysql-client"
    echo "  CentOS/RHEL: sudo yum install mysql"
    exit 1
fi

# 请求输入
read -p "请输入 MySQL 服务器地址 [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "请输入 MySQL 端口 [3306]: " DB_PORT
DB_PORT=${DB_PORT:-3306}

read -p "请输入 MySQL root 用户名 [root]: " ADMIN_USER
ADMIN_USER=${ADMIN_USER:-root}

read -sp "请输入 MySQL root 密码: " ADMIN_PASSWORD
echo ""

read -p "请输入 Offer-Mate 数据库用户名 [offermate]: " DB_USER
DB_USER=${DB_USER:-offermate}

read -sp "请输入 Offer-Mate 数据库密码 [offermate123@]: " DB_PASSWORD
echo ""
DB_PASSWORD=${DB_PASSWORD:-offermate123@}

read -p "请输入 Offer-Mate 数据库名 [offer_mate]: " DB_NAME
DB_NAME=${DB_NAME:-offer_mate}

echo ""
echo -e "${YELLOW}确认以下配置:${NC}"
echo "  MySQL 服务器: $DB_HOST:$DB_PORT"
echo "  Admin 用户: $ADMIN_USER"
echo "  数据库名: $DB_NAME"
echo "  数据库用户: $DB_USER"
echo ""

read -p "继续吗? (y/n) [y]: " CONFIRM
CONFIRM=${CONFIRM:-y}

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo -e "${YELLOW}取消操作${NC}"
    exit 0
fi

# 创建数据库和用户的 SQL 命令
SQL_COMMANDS="
-- 创建 Offer-Mate 数据库
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建 Offer-Mate 数据库用户（本地）
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';

-- 创建 Offer-Mate 数据库用户（远程）
CREATE USER IF NOT EXISTS '$DB_USER'@'%' IDENTIFIED BY '$DB_PASSWORD';

-- 授予权限
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'%';

-- 刷新权限
FLUSH PRIVILEGES;
"

# 执行数据库创建和用户创建
echo -e "${YELLOW}正在创建数据库和用户...${NC}"

mysql -h "$DB_HOST" -P "$DB_PORT" -u "$ADMIN_USER" -p"$ADMIN_PASSWORD" << EOF
$SQL_COMMANDS
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 数据库和用户创建成功${NC}"
else
    echo -e "${RED}❌ 数据库创建失败${NC}"
    exit 1
fi

# 初始化表
echo -e "${YELLOW}正在初始化数据库表...${NC}"

mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < sql/init.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 数据库表初始化成功${NC}"
else
    echo -e "${RED}❌ 数据库表初始化失败${NC}"
    exit 1
fi

# 应用迁移
if [ -f "sql/add_conversations_table.sql" ]; then
    echo -e "${YELLOW}正在应用数据库迁移...${NC}"
    
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < sql/add_conversations_table.sql
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 数据库迁移成功${NC}"
    else
        echo -e "${RED}❌ 数据库迁移失败${NC}"
        exit 1
    fi
fi

# 创建 .env 文件
echo -e "${YELLOW}正在创建 .env 文件...${NC}"

if [ -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env 文件已存在，跳过创建${NC}"
else
    cat > .env << ENVFILE
# Offer-Mate 服务器环境变量配置
NODE_ENV=development
PORT=7002
API_PREFIX=/offer-mate/v1

# 数据库配置
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME

# JWT认证配置
JWT_SECRET=offer_mate_secret_key_change_in_production_12345
JWT_EXPIRES_IN=7d
ENVFILE
    
    echo -e "${GREEN}✅ .env 文件创建成功${NC}"
fi

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}   Offer-Mate 数据库初始化完成！${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${YELLOW}后续步骤:${NC}"
echo "1. 修改 .env 文件中的敏感配置（如 JWT_SECRET）"
echo "2. 执行 'npm install' 安装依赖"
echo "3. 执行 'npm run dev' 启动开发服务器或 'npm start' 启动生产服务器"
echo ""
echo -e "${YELLOW}数据库连接信息:${NC}"
echo "  主机: $DB_HOST:$DB_PORT"
echo "  数据库: $DB_NAME"
echo "  用户: $DB_USER"
echo ""
