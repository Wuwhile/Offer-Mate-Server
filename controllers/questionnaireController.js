const QuestionnaireResult = require('../models/QuestionnaireResult');

/**
 * 保存问卷结果
 */
exports.saveQuestionnaireResult = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      questionnaireName,
      questionnaireType,
      score,
      depressionLevel,
      levelDescription,
      resultData
    } = req.body;

    // 参数验证
    if (!questionnaireName || !questionnaireType || score === undefined) {
      return res.status(400).json({
        code: 400,
        message: '问卷名称、类型和分数为必填项'
      });
    }

    const resultId = await QuestionnaireResult.create({
      userId,
      questionnaireName,
      questionnaireType,
      score,
      depressionLevel: depressionLevel || '',
      levelDescription: levelDescription || '',
      resultData: resultData || {}
    });

    return res.status(201).json({
      code: 200,
      message: '问卷结果保存成功',
      data: {
        id: resultId
      }
    });
  } catch (error) {
    console.error('保存问卷结果错误:', error);
    return res.status(500).json({
      code: 500,
      message: '保存问卷结果失败'
    });
  }
};

/**
 * 获取用户问卷结果列表
 */
exports.getUserResults = async (req, res) => {
  try {
    const userId = req.params.userId;

    // 验证用户是否是请求者本人或管理员
    if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '无权查看他人记录'
      });
    }

    const results = await QuestionnaireResult.findByUserId(userId);

    return res.status(200).json({
      code: 200,
      message: '获取成功',
      data: results
    });
  } catch (error) {
    console.error('获取问卷结果列表错误:', error);
    return res.status(500).json({
      code: 500,
      message: '获取问卷结果列表失败'
    });
  }
};

/**
 * 获取最新问卷结果
 */
exports.getLatestResult = async (req, res) => {
  try {
    const userId = req.params.userId;

    // 验证用户是否是请求者本人或管理员
    if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '无权查看他人记录'
      });
    }

    const result = await QuestionnaireResult.findLatestByUserId(userId);

    return res.status(200).json({
      code: 200,
      message: '获取成功',
      data: result
    });
  } catch (error) {
    console.error('获取最新问卷结果错误:', error);
    return res.status(500).json({
      code: 500,
      message: '获取最新问卷结果失败'
    });
  }
};

/**
 * 获取问卷结果详情
 */
exports.getResultDetail = async (req, res) => {
  try {
    const resultId = req.params.id;
    const result = await QuestionnaireResult.findById(resultId);

    if (!result) {
      return res.status(404).json({
        code: 404,
        message: '记录不存在'
      });
    }

    // 验证用户是否是结果的拥有者或管理员
    if (req.user.id !== result.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '无权查看他人记录'
      });
    }

    return res.status(200).json({
      code: 200,
      message: '获取成功',
      data: result
    });
  } catch (error) {
    console.error('获取问卷结果详情错误:', error);
    return res.status(500).json({
      code: 500,
      message: '获取问卷结果详情失败'
    });
  }
};

/**
 * 删除问卷结果
 */
exports.deleteResult = async (req, res) => {
  try {
    const resultId = req.params.id;
    const result = await QuestionnaireResult.findById(resultId);

    if (!result) {
      return res.status(404).json({
        code: 404,
        message: '记录不存在'
      });
    }

    // 验证用户是否是结果的拥有者或管理员
    if (req.user.id !== result.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '无权删除他人记录'
      });
    }

    const success = await QuestionnaireResult.deleteById(resultId);

    if (success) {
      return res.status(200).json({
        code: 200,
        message: '删除成功'
      });
    } else {
      return res.status(500).json({
        code: 500,
        message: '删除失败'
      });
    }
  } catch (error) {
    console.error('删除问卷结果错误:', error);
    return res.status(500).json({
      code: 500,
      message: '删除问卷结果失败'
    });
  }
};

/**
 * 批量删除问卷结果
 */
exports.deleteMultipleResults = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        code: 400,
        message: 'ids 必须是非空数组'
      });
    }

    // 验证权限：检查所有记录是否都属于当前用户
    for (const resultId of ids) {
      const result = await QuestionnaireResult.findById(resultId);
      if (!result) {
        return res.status(404).json({
          code: 404,
          message: `记录 ${resultId} 不存在`
        });
      }
      if (req.user.id !== result.userId && req.user.role !== 'admin') {
        return res.status(403).json({
          code: 403,
          message: '无权删除他人记录'
        });
      }
    }

    const success = await QuestionnaireResult.deleteByIds(ids);

    if (success) {
      return res.status(200).json({
        code: 200,
        message: '删除成功'
      });
    } else {
      return res.status(500).json({
        code: 500,
        message: '删除失败'
      });
    }
  } catch (error) {
    console.error('批量删除问卷结果错误:', error);
    return res.status(500).json({
      code: 500,
      message: '批量删除问卷结果失败'
    });
  }
};

/**
 * 获取问卷结果统计
 */
exports.getResultCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await QuestionnaireResult.count(userId);

    return res.status(200).json({
      code: 200,
      message: '获取成功',
      data: {
        count
      }
    });
  } catch (error) {
    console.error('获取问卷结果统计错误:', error);
    return res.status(500).json({
      code: 500,
      message: '获取问卷结果统计失败'
    });
  }
};
