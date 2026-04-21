const express = require('express');
const router = express.Router();
const questionnaireController = require('../controllers/questionnaireController');
const { authenticateToken } = require('../middleware/auth');

/**
 * 保存问卷结果
 * POST /alibaba-ai/v1/questionnaireResults/savePhq9Result
 */
router.post('/questionnaireResults/savePhq9Result', authenticateToken, questionnaireController.saveQuestionnaireResult);

/**
 * 获取用户问卷结果列表
 * GET /alibaba-ai/v1/questionnaireResults/listByUserId/:userId
 */
router.get('/questionnaireResults/listByUserId/:userId', authenticateToken, questionnaireController.getUserResults);

/**
 * 获取用户最新问卷结果
 * GET /alibaba-ai/v1/questionnaireResults/latestByUserId/:userId
 */
router.get('/questionnaireResults/latestByUserId/:userId', authenticateToken, questionnaireController.getLatestResult);

/**
 * 获取问卷结果详情
 * GET /alibaba-ai/v1/questionnaireResults/:id
 */
router.get('/questionnaireResults/:id', authenticateToken, questionnaireController.getResultDetail);

/**
 * 删除问卷结果
 * DELETE /alibaba-ai/v1/questionnaireResults/:id
 */
router.delete('/questionnaireResults/:id', authenticateToken, questionnaireController.deleteResult);

/**
 * 批量删除问卷结果
 * DELETE /alibaba-ai/v1/questionnaireResults/batch
 */
router.delete('/questionnaireResults/batch', authenticateToken, questionnaireController.deleteMultipleResults);

/**
 * 获取问卷结果统计
 * GET /alibaba-ai/v1/questionnaireResults/count
 */
router.get('/questionnaireResults/count', authenticateToken, questionnaireController.getResultCount);

module.exports = router;
