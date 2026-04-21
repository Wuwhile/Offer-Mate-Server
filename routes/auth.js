const express = require('express');
const multer = require('multer');
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

// 配置 multer 用于内存存储（不保存到磁盘）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB 限制
});

const router = express.Router();

/**
 * 注册接口
 * POST /register
 * 请求体: { username, password, phone, email? }
 */
router.post('/register', userController.register);

/**
 * 登录接口
 * POST /login
 * 请求体: { username, password }
 */
router.post('/login', userController.login);

/**
 * 获取用户信息（需要认证）
 * GET /user/info
 * 请求头: Authorization: Bearer <token>
 */
router.get('/user/info', authenticateToken, userController.getUserInfo);

/**
 * 更新用户信息（需要认证）
 * PUT /user/info
 * 请求头: Authorization: Bearer <token>
 * 请求体: { username?, phone?, email? }
 */
router.put('/user/info', authenticateToken, userController.updateUserInfo);

/**
 * 获取登录日志（需要认证）
 * GET /user/login-logs?page=1&limit=10
 * 请求头: Authorization: Bearer <token>
 */
router.get('/user/login-logs', authenticateToken, userController.getLoginLogs);

/**
 * 获取最近的登录记录（需要认证）
 * GET /user/login-logs/latest?limit=5
 * 请求头: Authorization: Bearer <token>
 */
router.get('/user/login-logs/latest', authenticateToken, userController.getLatestLoginLogs);

/**
 * 删除指定登录日志（需要认证）
 * POST /user/login-logs/delete
 * 请求头: Authorization: Bearer <token>
 * 请求体: { logId }
 */
router.post('/user/login-logs/delete', authenticateToken, userController.deleteLoginLog);

/**
 * 清空所有登录日志（需要认证）
 * POST /user/login-logs/clear
 * 请求头: Authorization: Bearer <token>
 */
router.post('/user/login-logs/clear', authenticateToken, userController.clearLoginLogs);

/**
 * 修改密码（需要认证）
 * POST /user/password/change
 * 请求头: Authorization: Bearer <token>
 * 请求体: { oldPassword, newPassword }
 */
router.post('/user/password/change', authenticateToken, userController.changePassword);

/**
 * 发送邮箱验证码（需要认证）
 * POST /user/email/code
 * 请求头: Authorization: Bearer <token>
 * 请求体: { email }
 */
router.post('/user/email/code', authenticateToken, userController.sendEmailCode);

/**
 * 更新邮箱（需要认证）
 * PUT /user/email
 * 请求头: Authorization: Bearer <token>
 * 请求体: { email, code }
 */
router.put('/user/email', authenticateToken, userController.updateEmail);

/**
 * 发送手机验证码（需要认证）
 * POST /user/phone/code
 * 请求头: Authorization: Bearer <token>
 * 请求体: { phone }
 */
router.post('/user/phone/code', authenticateToken, userController.sendPhoneCode);

/**
 * 更新手机号（需要认证）
 * PUT /user/phone
 * 请求头: Authorization: Bearer <token>
 * 请求体: { phone, code }
 */
router.put('/user/phone', authenticateToken, userController.updatePhone);

/**
 * 获取账户信息（需要认证）
 * GET /user/account
 * 请求头: Authorization: Bearer <token>
 */
router.get('/user/account', authenticateToken, userController.getUserInfo);

/**
 * 上传头像（需要认证）
 * POST /user/avatar
 * 请求头: Authorization: Bearer <token>
 * 请求体: { avatar: "data:image/png;base64,..." }
 */
router.post('/user/avatar', authenticateToken, userController.uploadAvatar);

/**
 * 上传头像文件（需要认证）- 用于小程序/原生App
 * POST /user/avatar/file
 * 请求头: Authorization: Bearer <token>
 * 请求体: multipart/form-data，field name: avatar
 */
router.post('/user/avatar/file', authenticateToken, upload.single('avatar'), userController.uploadAvatarFile);

/**
 * 发送找回密码验证码（不需要认证）
 * POST /user/password/reset-code
 * 请求体: { phone }
 */
router.post('/user/password/reset-code', userController.resetPasswordCode);

/**
 * 重置密码（不需要认证）
 * POST /user/password/reset
 * 请求体: { phone, code, newPassword }
 */
router.post('/user/password/reset', userController.resetPassword);

module.exports = router;
