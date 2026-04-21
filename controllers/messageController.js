const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const aiService = require('../services/aiService');

/**
 * 发送消息（非流式版本 - 返回完整内容）
 */
exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { msgContent, msgType = 'text', conversationId } = req.body;

    // 参数验证
    if (!msgContent) {
      return res.status(400).json({
        code: 400,
        message: '消息内容不能为空'
      });
    }

    if (!conversationId) {
      return res.status(400).json({
        code: 400,
        message: '缺少对话ID'
      });
    }

    // 验证对话所有者
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || conversation.user_id !== userId) {
      return res.status(403).json({
        code: 403,
        message: '无权访问此对话'
      });
    }

    // 保存用户消息
    const userMessage = await Message.create({
      userId,
      conversationId,
      content: msgContent,
      messageType: msgType,
      fromUserId: userId  // 用户发送，fromUserId为用户ID
    });

    if (!userMessage) {
      return res.status(500).json({
        code: 500,
        message: '保存消息失败'
      });
    }

    // 获取此对话的完整消息历史
    const conversationHistory = await Message.findByConversationId(conversationId, 1, 100);
    const recentMessages = conversationHistory.records || [];
    
    // 构建 ChatGPT 格式的消息历史（用于千问 API）
    const messages = [];
    
    // 添加系统消息
    messages.push({
      role: 'system',
      content: '你是一个友善、富有同理心的心理健康咨询助手。你的目标是帮助用户理解他们的感受，提供支持和建议。请用温暖、非评判性的语言回应。'
    });

    // 添加历史消息（最多取最近 10 条，避免上下文过长）
    const historyToUse = recentMessages.slice(0, 10).reverse();
    for (const msg of historyToUse) {
      if (msg.id !== userMessage.id) {  // 不包含当前正在发送的新消息
        messages.push({
          role: msg.fromUserId === 0 ? 'assistant' : 'user',
          content: msg.msgContent || msg.content
        });
      }
    }

    // 添加当前用户消息
    messages.push({
      role: 'user',
      content: msgContent
    });

    // 调用千问 API 获取完整 AI 回复
    let fullAIReply = '';
    try {
      for await (const chunk of aiService.chatStream(messages, {
        temperature: 0.7,
        max_tokens: 500
      })) {
        if (chunk.type === 'content') {
          fullAIReply += chunk.content;
        } else if (chunk.type === 'error') {
          throw new Error(chunk.content);
        }
      }

      if (!fullAIReply) {
        fullAIReply = '（无法生成回复）';
      }

      // 保存完整的AI消息
      const aiMessage = await Message.create({
        userId,
        conversationId,
        content: fullAIReply,
        messageType: msgType,
        fromUserId: 0  // AI 回复，fromUserId为0
      });

      // 更新对话的最后更新时间
      await Conversation.updateTitle(conversationId, conversation.title);

      // 返回成功响应
      return res.json({
        code: 200,
        message: '消息发送成功',
        data: {
          userMessage: {
            id: userMessage.id,
            msgContent: userMessage.content,
            msgType: userMessage.messageType,
            fromUserId: userMessage.fromUserId,
            time: userMessage.createdAt
          },
          aiMessage: {
            id: aiMessage.id,
            msgContent: aiMessage.content,
            msgType: aiMessage.messageType,
            fromUserId: aiMessage.fromUserId,
            time: aiMessage.createdAt
          }
        }
      });

    } catch (aiError) {
      console.error('AI 调用错误:', aiError);
      
      return res.status(500).json({
        code: 500,
        message: 'AI 服务错误: ' + aiError.message
      });
    }

  } catch (error) {
    console.error('发送消息错误:', error);
    
    return res.status(500).json({
      code: 500,
      message: '发送消息失败: ' + error.message
    });
  }
};

/**
 * 获取消息列表（分页）
 * 支持按对话ID查询或按用户ID查询
 */
exports.getMessageList = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.query.conversationId;
    const current = parseInt(req.query.current) || 1;
    const size = parseInt(req.query.size) || 20;

    if (current < 1 || size < 1) {
      return res.status(400).json({
        code: 400,
        message: '分页参数无效'
      });
    }

    let result;

    if (conversationId) {
      // 查询特定对话的消息
      const conversation = await Conversation.findById(conversationId);
      if (!conversation || conversation.user_id !== userId) {
        return res.status(403).json({
          code: 403,
          message: '无权访问此对话'
        });
      }
      result = await Message.findByConversationId(conversationId, current, size);
    } else {
      // 查询用户所有消息（不分对话）
      result = await Message.findByUserId(userId, current, size);
    }

    return res.json({
      code: 200,
      message: '获取消息成功',
      data: {
        records: result.records,
        total: result.total,
        size: result.size,
        current: result.current,
        pages: result.pages
      }
    });
  } catch (error) {
    console.error('获取消息列表错误:', error);
    return res.status(500).json({
      code: 500,
      message: '获取消息列表失败: ' + error.message
    });
  }
};
