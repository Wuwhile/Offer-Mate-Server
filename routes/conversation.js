const express = require('express');
const conversationController = require('../controllers/conversationController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 所有对话相关的路由都需要身份验证
router.use(authenticateToken);

/**
 * POST /conversation
 * 创建新对话
 */
router.post('/', conversationController.createConversation);

/**
 * GET /conversation
 * 获取用户的对话列表
 */
router.get('/', conversationController.getConversationList);

/**
 * GET /conversation/:id
 * 获取对话详情和消息
 */
router.get('/:id', conversationController.getConversationDetail);

/**
 * DELETE /conversation/:id
 * 删除对话
 */
router.delete('/:id', conversationController.deleteConversation);

/**
 * PUT /conversation/:id
 * 更新对话标题
 */
router.put('/:id', conversationController.updateConversation);

/**
 * POST /conversation/:id/generate-title
 * 根据对话内容生成标题
 */
router.post('/:id/generate-title', conversationController.generateTitle);

module.exports = router;
