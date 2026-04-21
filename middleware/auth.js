const jwt = require('jsonwebtoken');

/**
 * JWT认证中间件
 * 检查请求头中的Authorization token
 */
const authenticateToken = (req, res, next) => {
  // 尝试从 Access-Token 请求头获取token
  let token = req.headers['access-token'];
  
  // 如果没有，尝试从 Authorization 请求头获取（格式：Bearer token）
  if (!token) {
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      const parts = authHeader.split(' ');
      token = parts.length === 2 && parts[0].toLowerCase() === 'bearer' ? parts[1] : null;
    }
  }

  if (!token) {
    return res.status(401).json({
      code: 401,
      message: '访问令牌缺失，请先登录'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key', (err, user) => {
    if (err) {
      return res.status(403).json({
        code: 403,
        message: '访问令牌无效或已过期'
      });
    }
    req.user = user;
    next();
  });
};

module.exports = { authenticateToken };
