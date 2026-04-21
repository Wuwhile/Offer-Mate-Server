#!/bin/bash

# Warm-Mate 问卷功能部署脚本
# 在阿里云 workbench 中直接运行：bash deploy.sh

set -e

echo "🚀 开始部署 Warm-Mate 问卷功能..."

# 进入项目目录
cd /root/warm-mate-server

echo "📥 拉取最新代码..."
git pull origin main

echo "💾 执行数据库迁移..."
mysql -u warmmate -p'warmmate123@' warm_mate < /root/warm-mate-server/sql/migrations/003_update_questionnaire_results_table.sql

echo "✅ 验证数据库变更..."
mysql -u warmmate -p'warmmate123@' warm_mate -e "DESCRIBE questionnaire_results;"

echo "🔄 重启 PM2 服务..."
pm2 restart warm-mate

echo "⏳ 等待 3 秒让服务启动..."
sleep 3

echo "📋 查看服务状态..."
pm2 status

echo "📝 最近日志："
pm2 logs warm-mate --lines 10 --nostream

echo "✨ 部署完成！"
echo "🌐 您现在可以测试 API 了："
echo "   - 基础 URL: http://47.94.217.78:7001/alibaba-ai/v1"
echo "   - 文档: 参考 warm-mate-server 中的 test-questionnaire-api.md"
