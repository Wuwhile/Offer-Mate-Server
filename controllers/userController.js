const jwt = require('jsonwebtoken');
const User = require('../models/User');
const LoginLog = require('../models/LoginLog');

/**
 * 用户注册
 */
exports.register = async (req, res) => {
  try {
    const { username, password, phone, email } = req.body;

    // 参数验证
    if (!username || !password || !phone) {
      return res.status(400).json({
        code: 400,
        message: '用户名、密码和手机号为必填项'
      });
    }

    // 检查用户是否已存在
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(409).json({
        code: 409,
        message: '用户名已存在'
      });
    }
    // 检查手机号是否已被注册
    const existingPhone = await User.findByPhone(phone);
    if (existingPhone) {
      return res.status(200).json({
        code: 409,
        message: '该手机号已被注册'
      });
    }
    // 创建用户
    const newUser = await User.create({
      username,
      password,
      phone,
      email: email || null
    });

    return res.status(201).json({
      code: 200,
      message: '注册成功',
      data: newUser
    });
  } catch (error) {
    console.error('注册错误:', error);
    return res.status(500).json({
      code: 500,
      message: '注册失败: ' + error.message
    });
  }
};

/**
 * 用户登录
 */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 参数验证
    if (!username || !password) {
      return res.status(200).json({
        code: 400,
        message: '用户名和密码为必填项'
      });
    }

    // 查找用户（支持用户名或手机号）
    const user = await User.findByUsernameOrPhone(username);
    if (!user) {
      return res.status(200).json({
        code: 401,
        message: '用户名/手机号或密码错误'
      });
    }

    // 验证密码
    const isPasswordValid = await User.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(200).json({
        code: 401,
        message: '用户名/手机号或密码错误'
      });
    }

    // 生成JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, phone: user.phone },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '7d' }
    );

    // 记录登录日志
    try {
      const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
      const userAgent = req.headers['user-agent'] || '';
      const deviceInfo = extractDeviceInfo(userAgent);
      
      await LoginLog.create({
        user_id: user.id,
        ip_address: ipAddress,
        device_info: deviceInfo,
        user_agent: userAgent
      });
    } catch (logError) {
      console.warn('登录日志记录失败:', logError);
      // 不阻断登录流程
    }

    return res.json({
      code: 200,
      message: '登录成功',
      data: {
        id: user.id,
        uid: 100000000 + user.id,
        username: user.username,
        phone: user.phone,
        email: user.email,
        token: token
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    return res.status(500).json({
      code: 500,
      message: '登录失败: ' + error.message
    });
  }
};

/**
 * 获取用户信息
 */
exports.getUserInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    return res.json({
      code: 200,
      message: '获取成功',
      data: user
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    return res.status(500).json({
      code: 500,
      message: '获取用户信息失败: ' + error.message
    });
  }
};

/**
 * 更新用户信息
 */
exports.updateUserInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, phone, email } = req.body;

    // 只更新请求中实际提供的字段
    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        code: 400,
        message: '至少需要提供一个字段来更新'
      });
    }

    const updatedUser = await User.update(userId, updateData);

    return res.json({
      code: 200,
      message: '更新成功',
      data: updatedUser
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    return res.status(500).json({
      code: 500,
      message: '更新用户信息失败: ' + error.message
    });
  }
};

/**
 * 发送邮箱验证码
 */
exports.sendEmailCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        code: 400,
        message: '邮箱不能为空'
      });
    }

    // 简单验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        code: 400,
        message: '邮箱格式不正确'
      });
    }

    // 生成6位随机验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 这里应该调用邮件服务发送验证码
    // 为了演示，我们将验证码存储在内存中（实际应该用Redis）
    global.emailVerificationCode = {
      email,
      code,
      expires: Date.now() + 5 * 60 * 1000 // 5分钟过期
    };

    console.log(`发送邮箱验证码给 ${email}: ${code}`);

    return res.json({
      code: 200,
      message: '验证码已发送到邮箱'
    });
  } catch (error) {
    console.error('发送邮箱验证码错误:', error);
    return res.status(500).json({
      code: 500,
      message: '发送验证码失败: ' + error.message
    });
  }
};

/**
 * 更新邮箱
 */
exports.updateEmail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { email, code } = req.body;

    if (!email) {
      return res.status(400).json({
        code: 400,
        message: '邮箱不能为空'
      });
    }

    // 如果提供了验证码，则验证
    if (code) {
      if (!global.emailVerificationCode || 
          global.emailVerificationCode.email !== email ||
          global.emailVerificationCode.code !== code ||
          global.emailVerificationCode.expires < Date.now()) {
        return res.status(400).json({
          code: 400,
          message: '验证码无效或已过期'
        });
      }
      delete global.emailVerificationCode;
    }

    const updatedUser = await User.update(userId, {
      email: email
    });

    return res.json({
      code: 200,
      message: '邮箱更新成功',
      data: updatedUser
    });
  } catch (error) {
    console.error('更新邮箱错误:', error);
    return res.status(500).json({
      code: 500,
      message: '更新邮箱失败: ' + error.message
    });
  }
};

/**
 * 发送手机验证码
 */
exports.sendPhoneCode = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        code: 400,
        message: '手机号不能为空'
      });
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        code: 400,
        message: '手机号格式不正确'
      });
    }

    // 生成6位随机验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 这里应该调用短信服务发送验证码
    // 为了演示，我们将验证码存储在内存中
    global.phoneVerificationCode = {
      phone,
      code,
      expires: Date.now() + 5 * 60 * 1000 // 5分钟过期
    };

    console.log(`发送手机验证码给 ${phone}: ${code}`);

    return res.json({
      code: 200,
      message: '验证码已发送到手机'
    });
  } catch (error) {
    console.error('发送手机验证码错误:', error);
    return res.status(500).json({
      code: 500,
      message: '发送验证码失败: ' + error.message
    });
  }
};

/**
 * 更新手机号
 */
exports.updatePhone = async (req, res) => {
  try {
    const userId = req.user.id;
    const { phone, code } = req.body;

    if (!phone) {
      return res.status(400).json({
        code: 400,
        message: '手机号不能为空'
      });
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        code: 400,
        message: '手机号格式不正确'
      });
    }

    // 验证验证码
    if (!code || !global.phoneVerificationCode ||
        global.phoneVerificationCode.phone !== phone ||
        global.phoneVerificationCode.code !== code ||
        global.phoneVerificationCode.expires < Date.now()) {
      return res.status(400).json({
        code: 400,
        message: '验证码无效或已过期'
      });
    }

    delete global.phoneVerificationCode;

    const updatedUser = await User.update(userId, {
      phone: phone
    });

    return res.json({
      code: 200,
      message: '手机号更新成功',
      data: updatedUser
    });
  } catch (error) {
    console.error('更新手机号错误:', error);
    return res.status(500).json({
      code: 500,
      message: '更新手机号失败: ' + error.message
    });
  }
};

/**
 * 获取用户登录日志（已认证）
 */
exports.getLoginLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;

    if (page < 1 || limit < 1) {
      return res.status(400).json({
        code: 400,
        message: '分页参数无效'
      });
    }

    const result = await LoginLog.findByUserId(userId, page, limit);

    return res.json({
      code: 200,
      message: '获取成功',
      data: {
        logs: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          pages: result.pages
        }
      }
    });
  } catch (error) {
    console.error('获取登录日志错误:', error);
    return res.status(500).json({
      code: 500,
      message: '获取登录日志失败: ' + error.message
    });
  }
};

/**
 * 获取最近的登录记录
 */
exports.getLatestLoginLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = req.query.limit ? parseInt(req.query.limit) : 5;

    if (limit < 1) {
      return res.status(400).json({
        code: 400,
        message: '参数无效'
      });
    }

    const logs = await LoginLog.findLatest(userId, limit);

    return res.json({
      code: 200,
      message: '获取成功',
      data: logs
    });
  } catch (error) {
    console.error('获取最近登录记录错误:', error);
    return res.status(500).json({
      code: 500,
      message: '获取最近登录记录失败: ' + error.message
    });
  }
};

/**
 * 删除指定的登录日志
 */
exports.deleteLoginLog = async (req, res) => {
  try {
    const userId = req.user.id;
    const { logId } = req.body;

    if (!logId) {
      return res.status(400).json({
        code: 400,
        message: '日志ID不能为空'
      });
    }

    const success = await LoginLog.deleteById(logId, userId);

    if (!success) {
      return res.status(404).json({
        code: 404,
        message: '登录日志不存在或无权限删除'
      });
    }

    return res.json({
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除登录日志错误:', error);
    return res.status(500).json({
      code: 500,
      message: '删除登录日志失败: ' + error.message
    });
  }
};

/**
 * 清空所有登录日志
 */
exports.clearLoginLogs = async (req, res) => {
  try {
    const userId = req.user.id;

    await LoginLog.deleteByUserId(userId);

    return res.json({
      code: 200,
      message: '清空成功'
    });
  } catch (error) {
    console.error('清空登录日志错误:', error);
    return res.status(500).json({
      code: 500,
      message: '清空登录日志失败: ' + error.message
    });
  }
};

/**
 * 修改密码（需要认证）
 */
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    // 参数验证
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        code: 400,
        message: '旧密码和新密码不能为空'
      });
    }

    // 新密码格式验证
    if (newPassword.length < 6 || newPassword.length > 16) {
      return res.status(400).json({
        code: 400,
        message: '新密码长度必须在 6-16 个字符之间'
      });
    }

    // 检查密码是否只包含字母、数字或符号
    const hasValidChars = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]+$/.test(newPassword);
    if (!hasValidChars) {
      return res.status(400).json({
        code: 400,
        message: '新密码只能包含字母、数字或符号'
      });
    }

    // 新密码不能与旧密码相同
    if (oldPassword === newPassword) {
      return res.status(400).json({
        code: 400,
        message: '新密码不能与现有密码相同'
      });
    }

    // 获取用户信息（直接查询包括密码字段）
    const pool = require('../config/database');
    const conn = await pool.getConnection();
    let userWithPassword;
    try {
      const [rows] = await conn.execute(
        'SELECT id, username, password FROM users WHERE id = ?',
        [userId]
      );
      userWithPassword = rows.length > 0 ? rows[0] : null;
    } finally {
      conn.release();
    }

    if (!userWithPassword) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    // 验证旧密码
    const isPasswordValid = await User.verifyPassword(oldPassword, userWithPassword.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        code: 400,
        message: '当前密码不正确'
      });
    }

    // 更新密码
    const success = await User.changePassword(userId, newPassword);
    if (!success) {
      return res.status(500).json({
        code: 500,
        message: '修改密码失败'
      });
    }

    return res.json({
      code: 200,
      message: '密码修改成功，请重新登录'
    });
  } catch (error) {
    console.error('修改密码错误:', error);
    return res.status(500).json({
      code: 500,
      message: '修改密码失败: ' + error.message
    });
  }
};

/**
 * 上传头像（需要认证）
 * 接收Base64编码的头像图片
 */
exports.uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    const { avatar } = req.body;

    // 参数验证
    if (!avatar) {
      return res.status(400).json({
        code: 400,
        message: '头像数据不能为空'
      });
    }

    // 验证是否为有效的Base64数据
    const base64Regex = /^data:image\/(png|jpg|jpeg|gif|webp);base64,/;
    if (!base64Regex.test(avatar)) {
      return res.status(400).json({
        code: 400,
        message: '无效的图片格式，需要是Base64编码的图片'
      });
    }

    // 头像大小限制（5MB）
    const base64Data = avatar.split(',')[1];
    const bufferSize = Buffer.byteLength(base64Data, 'base64');
    if (bufferSize > 5 * 1024 * 1024) {
      return res.status(400).json({
        code: 400,
        message: '头像文件过大，不超过5MB'
      });
    }

    // 保存头像URL到数据库
    const success = await User.updateAvatar(userId, avatar);
    if (!success) {
      return res.status(500).json({
        code: 500,
        message: '保存头像失败'
      });
    }

    return res.json({
      code: 200,
      message: '头像上传成功',
      data: {
        avatar_url: avatar
      }
    });
  } catch (error) {
    console.error('上传头像错误:', error);
    return res.status(500).json({
      code: 500,
      message: '上传头像失败: ' + error.message
    });
  }
};

/**
 * 上传头像文件（处理multipart/form-data）
 * 用于小程序/原生App环境
 */
exports.uploadAvatarFile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 检查是否上传了文件
    if (!req.file) {
      return res.status(400).json({
        code: 400,
        message: '未选择头像文件'
      });
    }

    // 验证文件类型
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        code: 400,
        message: '不支持的文件类型，仅支持PNG、JPG、GIF、WEBP'
      });
    }

    // 验证文件大小（5MB）
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        code: 400,
        message: '头像文件过大，不超过5MB'
      });
    }

    // 将文件转换为Base64
    const base64Data = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;
    const avatarDataUrl = `data:${mimeType};base64,${base64Data}`;

    // 保存头像URL到数据库
    const success = await User.updateAvatar(userId, avatarDataUrl);
    if (!success) {
      return res.status(500).json({
        code: 500,
        message: '保存头像失败'
      });
    }

    return res.json({
      code: 200,
      message: '头像上传成功',
      data: {
        avatar_url: avatarDataUrl
      }
    });
  } catch (error) {
    console.error('上传头像文件错误:', error);
    return res.status(500).json({
      code: 500,
      message: '上传头像失败: ' + error.message
    });
  }
};

/**
 * 发送找回密码验证码（不需要认证）
 */
exports.resetPasswordCode = async (req, res) => {
  try {
    const { phone } = req.body;

    // 参数验证
    if (!phone) {
      return res.status(400).json({
        code: 400,
        message: '手机号不能为空'
      });
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        code: 400,
        message: '手机号格式不正确'
      });
    }

    // 检查用户是否存在
    const user = await User.findByPhone(phone);
    if (!user) {
      return res.status(200).json({
        code: 404,
        message: '该手机号未注册'
      });
    }

    // 调用SMS服务发送验证码
    const smsService = require('../services/smsService');
    const result = await smsService.sendVerificationCode(phone);

    if (result.success) {
      // 缓存验证码
      smsService.cacheVerificationCode(phone, result.verificationCode);
      
      // 开发环境返回验证码，生产环境应移除
      if (process.env.NODE_ENV === 'development') {
        return res.json({
          code: 200,
          message: '验证码已发送',
          data: {
            verificationCode: result.verificationCode // 仅开发环境
          }
        });
      }
      
      return res.json({
        code: 200,
        message: '验证码已发送到您的手机'
      });
    } else {
      return res.status(500).json({
        code: 500,
        message: result.message || '发送验证码失败'
      });
    }
  } catch (error) {
    console.error('发送找回密码验证码错误:', error);
    return res.status(500).json({
      code: 500,
      message: '发送验证码失败: ' + error.message
    });
  }
};

/**
 * 重置密码（不需要认证）
 */
exports.resetPassword = async (req, res) => {
  try {
    const { phone, code, newPassword } = req.body;

    // 参数验证
    if (!phone || !code || !newPassword) {
      return res.status(400).json({
        code: 400,
        message: '手机号、验证码和新密码为必填项'
      });
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        code: 400,
        message: '手机号格式不正确'
      });
    }

    // 验证新密码格式
    if (newPassword.length < 6 || newPassword.length > 16) {
      return res.status(400).json({
        code: 400,
        message: '新密码长度必须在 6-16 个字符之间'
      });
    }

    // 验证验证码
    const smsService = require('../services/smsService');
    const verifyResult = smsService.verifyCode(phone, code);
    
    if (!verifyResult.success) {
      return res.status(400).json({
        code: 400,
        message: verifyResult.message
      });
    }

    // 查找用户
    const user = await User.findByPhone(phone);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    // 更新用户密码
    const success = await User.changePassword(user.id, newPassword);
    if (!success) {
      return res.status(500).json({
        code: 500,
        message: '重置密码失败'
      });
    }

    return res.json({
      code: 200,
      message: '密码重置成功，请重新登录'
    });
  } catch (error) {
    console.error('重置密码错误:', error);
    return res.status(500).json({
      code: 500,
      message: '重置密码失败: ' + error.message
    });
  }
};

/**
 * 提取设备信息的辅助函数
 */
function extractDeviceInfo(userAgent) {
  if (!userAgent) return 'Unknown Device';

  // 简单的设备识别逻辑
  let device = 'Unknown Device';
  let browser = 'Unknown Browser';

  // 识别设备类型
  if (/Mobile|Android|iPhone|iPad|iPod/.test(userAgent)) {
    if (/iPad/.test(userAgent)) {
      device = 'iPad';
    } else if (/iPhone/.test(userAgent)) {
      device = 'iPhone';
    } else if (/Android/.test(userAgent)) {
      device = 'Android Phone';
    } else {
      device = 'Mobile Device';
    }
  } else if (/Windows/.test(userAgent)) {
    device = 'Windows PC';
  } else if (/Mac/.test(userAgent)) {
    device = 'Mac';
  } else if (/Linux/.test(userAgent)) {
    device = 'Linux';
  }

  // 识别浏览器
  if (/Chrome/.test(userAgent) && !/Edge/.test(userAgent)) {
    browser = 'Chrome';
  } else if (/Firefox/.test(userAgent)) {
    browser = 'Firefox';
  } else if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) {
    browser = 'Safari';
  } else if (/Edge/.test(userAgent)) {
    browser = 'Edge';
  }

  return `${device} - ${browser}`;
}
