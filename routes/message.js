const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/auth');

/**
 * 发送消息
 * POST /alibaba-ai/v1/message
 * 需要认证
 */
router.post('/message', authenticateToken, messageController.sendMessage);

/**
 * 获取消息列表（分页）
 * GET /alibaba-ai/v1/message?current=1&size=20
 * 需要认证
 */
router.get('/message', authenticateToken, messageController.getMessageList);

module.exports = router;
