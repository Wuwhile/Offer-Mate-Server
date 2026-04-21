@echo off
REM ============================================
REM Offer-Mate 数据库初始化脚本 (Windows)
REM ============================================
REM 用法: setup-database.bat

setlocal enabledelayedexpansion

echo.
echo ================================================
echo    Offer-Mate 数据库初始化脚本 (Windows)
echo ================================================
echo.

REM 检查 mysql 是否安装
where mysql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] mysql 命令未找到
    echo.
    echo 请先安装 MySQL 或将 MySQL bin 目录添加到 PATH 环境变量
    echo.
    echo MySQL 官方下载: https://dev.mysql.com/downloads/mysql/
    pause
    exit /b 1
)

REM 请求输入
set "DB_HOST=localhost"
set "DB_PORT=3306"
set "ADMIN_USER=root"
set "DB_USER=offermate"
set "DB_PASSWORD=offermate123@"
set "DB_NAME=offer_mate"

echo [INFO] 使用默认配置或按 Ctrl+C 退出并手动编辑脚本
echo.

set /p DB_HOST="请输入 MySQL 服务器地址 [localhost]: "
if "!DB_HOST!"=="" set "DB_HOST=localhost"

set /p DB_PORT="请输入 MySQL 端口 [3306]: "
if "!DB_PORT!"=="" set "DB_PORT=3306"

set /p ADMIN_USER="请输入 MySQL root 用户名 [root]: "
if "!ADMIN_USER!"=="" set "ADMIN_USER=root"

set /p ADMIN_PASSWORD="请输入 MySQL root 密码: "

set /p DB_USER="请输入 Offer-Mate 数据库用户名 [offermate]: "
if "!DB_USER!"=="" set "DB_USER=offermate"

set /p DB_PASSWORD="请输入 Offer-Mate 数据库密码 [offermate123@]: "
if "!DB_PASSWORD!"=="" set "DB_PASSWORD=offermate123@"

set /p DB_NAME="请输入 Offer-Mate 数据库名 [offer_mate]: "
if "!DB_NAME!"=="" set "DB_NAME=offer_mate"

echo.
echo [INFO] 确认以下配置:
echo   MySQL 服务器: !DB_HOST!:!DB_PORT!
echo   Admin 用户: !ADMIN_USER!
echo   数据库名: !DB_NAME!
echo   数据库用户: !DB_USER!
echo.

set /p CONFIRM="继续吗? (y/n) [y]: "
if "!CONFIRM!"=="" set "CONFIRM=y"

if not "!CONFIRM!"=="y" (
    if not "!CONFIRM!"=="Y" (
        echo [INFO] 取消操作
        pause
        exit /b 0
    )
)

REM 创建临时 SQL 文件
echo [INFO] 正在创建数据库和用户...

set "TEMP_SQL=%TEMP%\offer_mate_setup.sql"

(
    echo CREATE DATABASE IF NOT EXISTS !DB_NAME! CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    echo CREATE USER IF NOT EXISTS '!DB_USER!'@'localhost' IDENTIFIED BY '!DB_PASSWORD!';
    echo CREATE USER IF NOT EXISTS '!DB_USER!'@'%%' IDENTIFIED BY '!DB_PASSWORD!';
    echo GRANT ALL PRIVILEGES ON !DB_NAME!.* TO '!DB_USER!'@'localhost';
    echo GRANT ALL PRIVILEGES ON !DB_NAME!.* TO '!DB_USER!'@'%%';
    echo FLUSH PRIVILEGES;
) > "!TEMP_SQL!"

REM 执行 SQL
mysql -h !DB_HOST! -P !DB_PORT! -u !ADMIN_USER! -p!ADMIN_PASSWORD! < "!TEMP_SQL!"

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] 数据库和用户创建成功
) else (
    echo [ERROR] 数据库创建失败
    del "!TEMP_SQL!"
    pause
    exit /b 1
)

REM 初始化表
echo [INFO] 正在初始化数据库表...

if exist "sql\init.sql" (
    mysql -h !DB_HOST! -P !DB_PORT! -u !DB_USER! -p!DB_PASSWORD! !DB_NAME! < sql\init.sql
    
    if %ERRORLEVEL% EQU 0 (
        echo [SUCCESS] 数据库表初始化成功
    ) else (
        echo [ERROR] 数据库表初始化失败
        del "!TEMP_SQL!"
        pause
        exit /b 1
    )
) else (
    echo [WARNING] sql\init.sql 文件不存在
)

REM 应用迁移
if exist "sql\add_conversations_table.sql" (
    echo [INFO] 正在应用数据库迁移...
    
    mysql -h !DB_HOST! -P !DB_PORT! -u !DB_USER! -p!DB_PASSWORD! !DB_NAME! < sql\add_conversations_table.sql
    
    if %ERRORLEVEL% EQU 0 (
        echo [SUCCESS] 数据库迁移成功
    ) else (
        echo [ERROR] 数据库迁移失败
    )
)

REM 创建 .env 文件
echo [INFO] 正在创建 .env 文件...

if exist ".env" (
    echo [WARNING] .env 文件已存在，跳过创建
) else (
    (
        echo # Offer-Mate 服务器环境变量配置
        echo NODE_ENV=development
        echo PORT=7002
        echo API_PREFIX=/offer-mate/v1
        echo.
        echo # 数据库配置
        echo DB_HOST=!DB_HOST!
        echo DB_PORT=!DB_PORT!
        echo DB_USER=!DB_USER!
        echo DB_PASSWORD=!DB_PASSWORD!
        echo DB_NAME=!DB_NAME!
        echo.
        echo # JWT认证配置
        echo JWT_SECRET=offer_mate_secret_key_change_in_production_12345
        echo JWT_EXPIRES_IN=7d
    ) > .env
    
    echo [SUCCESS] .env 文件创建成功
)

REM 清理临时文件
del "!TEMP_SQL!"

echo.
echo ================================================
echo    Offer-Mate 数据库初始化完成！
echo ================================================
echo.
echo [INFO] 后续步骤:
echo 1. 修改 .env 文件中的敏感配置（如 JWT_SECRET）
echo 2. 执行 'npm install' 安装依赖
echo 3. 执行 'npm run dev' 启动开发服务器或 'npm start' 启动生产服务器
echo.
echo [INFO] 数据库连接信息:
echo   主机: !DB_HOST!:!DB_PORT!
echo   数据库: !DB_NAME!
echo   用户: !DB_USER!
echo.

pause
