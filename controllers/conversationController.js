const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

/**
 * 创建新对话
 */
exports.createConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title } = req.body;

    const conversation = await Conversation.create({
      userId,
      title: title || '新对话'
    });

    return res.json({
      code: 200,
      message: '对话创建成功',
      data: conversation
    });
  } catch (error) {
    console.error('创建对话错误:', error);
    return res.status(500).json({
      code: 500,
      message: '创建对话失败: ' + error.message
    });
  }
};

/**
 * 获取用户的对话列表
 */
exports.getConversationList = async (req, res) => {
  try {
    const userId = req.user.id;
    const current = parseInt(req.query.current) || 1;
    const size = parseInt(req.query.size) || 20;

    if (current < 1 || size < 1) {
      return res.status(400).json({
        code: 400,
        message: '分页参数无效'
      });
    }

    // 获取对话列表
    const result = await Conversation.findByUserId(userId, current, size);

    // 为每个对话添加最后一条消息的预览，并过滤掉没有消息的对话
    const conversations = [];
    for (const conv of result.records) {
      const messages = await Message.findByConversationId(conv.id, 1, 1);
      
      // 只添加有消息的对话到列表
      if (messages.total > 0) {
        const lastMessage = messages.records[0];
        conversations.push({
          ...conv,
          lastMessage: lastMessage ? lastMessage.msgContent : '',
          messageCount: messages.total
        });
      }
    }

    return res.json({
      code: 200,
      message: '获取对话列表成功',
      data: {
        records: conversations,
        total: conversations.length,
        size: size,
        current: current,
        pages: Math.ceil(conversations.length / size)
      }
    });
  } catch (error) {
    console.error('获取对话列表错误:', error);
    return res.status(500).json({
      code: 500,
      message: '获取对话列表失败: ' + error.message
    });
  }
};

/**
 * 获取对话详情和消息
 */
exports.getConversationDetail = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;
    const current = parseInt(req.query.current) || 1;
    const size = parseInt(req.query.size) || 20;

    // 验证对话所有者
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || conversation.user_id !== userId) {
      return res.status(403).json({
        code: 403,
        message: '无权访问此对话'
      });
    }

    // 获取对话的消息列表
    const result = await Message.findByConversationId(conversationId, current, size);

    return res.json({
      code: 200,
      message: '获取对话详情成功',
      data: {
        conversation,
        messages: result
      }
    });
  } catch (error) {
    console.error('获取对话详情错误:', error);
    return res.status(500).json({
      code: 500,
      message: '获取对话详情失败: ' + error.message
    });
  }
};

/**
 * 删除对话
 */
exports.deleteConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;

    // 验证对话所有者
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || conversation.user_id !== userId) {
      return res.status(403).json({
        code: 403,
        message: '无权删除此对话'
      });
    }

    // 删除对话（会级联删除所有消息）
    await Conversation.deleteById(conversationId);

    return res.json({
      code: 200,
      message: '对话删除成功'
    });
  } catch (error) {
    console.error('删除对话错误:', error);
    return res.status(500).json({
      code: 500,
      message: '删除对话失败: ' + error.message
    });
  }
};

/**
 * 更新对话标题
 */
exports.updateConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({
        code: 400,
        message: '标题不能为空'
      });
    }

    // 验证对话所有者
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || conversation.user_id !== userId) {
      return res.status(403).json({
        code: 403,
        message: '无权修改此对话'
      });
    }

    // 更新对话标题
    await Conversation.updateTitle(conversationId, title);

    return res.json({
      code: 200,
      message: '对话标题更新成功'
    });
  } catch (error) {
    console.error('更新对话标题错误:', error);
    return res.status(500).json({
      code: 500,
      message: '更新对话标题失败: ' + error.message
    });
  }
};

/**
 * 根据对话内容生成标题
 */
exports.generateTitle = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;
    const aiService = require('../services/aiService');

    // 验证对话所有者
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || conversation.user_id !== userId) {
      return res.status(403).json({
        code: 403,
        message: '无权访问此对话'
      });
    }

    // 获取对话的前几条消息
    const messages = await Message.findByConversationId(conversationId, 1, 50);
    
    if (!messages.records || messages.records.length === 0) {
      return res.json({
        code: 200,
        message: '生成标题成功',
        data: { title: '新对话' }
      });
    }

    // 收集用户消息和前两条消息用于生成标题
    const relevantMessages = messages.records.slice(0, 4); // 前4条消息
    let conversationPreview = '';
    for (const msg of relevantMessages) {
      conversationPreview += (msg.fromUserId === 0 ? 'AI' : '用户') + ': ' + msg.msgContent + '\n';
    }

    // 调用 AI 生成标题
    let generatedTitle = '';
    try {
      for await (const chunk of aiService.chatStream([
        {
          role: 'system',
          content: '你是一个标题生成助手。根据用户提供的对话内容，生成一个简洁、准确的对话标题，长度不超过20个字符。只返回标题，不要有其他内容。'
        },
        {
          role: 'user',
          content: '请根据以下对话内容生成一个标题：\n' + conversationPreview
        }
      ], {
        temperature: 0.5,
        max_tokens: 50
      })) {
        if (chunk.type === 'content') {
          generatedTitle += chunk.content;
        }
      }

      generatedTitle = generatedTitle.trim().substring(0, 20); // 确保长度不超过20字符
      if (!generatedTitle) {
        generatedTitle = '新对话';
      }

      // 更新对话标题
      await Conversation.updateTitle(conversationId, generatedTitle);

      return res.json({
        code: 200,
        message: '生成标题成功',
        data: { title: generatedTitle }
      });
    } catch (aiError) {
      console.error('AI 生成标题失败:', aiError);
      // 如果 AI 失败，返回默认标题
      return res.json({
        code: 200,
        message: '使用默认标题',
        data: { title: '新对话' }
      });
    }

  } catch (error) {
    console.error('生成标题错误:', error);
    return res.status(500).json({
      code: 500,
      message: '生成标题失败: ' + error.message
    });
  }
};
