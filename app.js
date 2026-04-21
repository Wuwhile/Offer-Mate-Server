const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const questionnaireRoutes = require('./routes/questionnaire');
const appointmentRoutes = require('./routes/appointment');
const messageRoutes = require('./routes/message');
const conversationRoutes = require('./routes/conversation');

const app = express();
const PORT = process.env.PORT || 7001;

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// API路由
const apiPrefix = process.env.API_PREFIX || '/alibaba-ai/v1';
app.use(apiPrefix, authRoutes);
app.use(apiPrefix, questionnaireRoutes);
app.use(apiPrefix, appointmentRoutes);
app.use(apiPrefix, messageRoutes);
app.use(`${apiPrefix}/conversation`, conversationRoutes);

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    code: 200,
    message: '服务器运行正常',
    timestamp: new Date().toISOString()
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    code: 500,
    message: '服务器内部错误: ' + err.message
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Warm-Mate 服务器运行在 http://localhost:${PORT}`);
  console.log(`📍 API前缀: ${apiPrefix}`);
  console.log(`🌐 环境: ${process.env.NODE_ENV || 'development'}`);
});
