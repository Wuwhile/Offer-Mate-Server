const Dypnsapi20170525 = require('@alicloud/dypnsapi20170525');
const OpenApi = require('@alicloud/openapi-client');
const Util = require('@alicloud/tea-util');

async function sendVerificationCode(phoneNumber, verificationCode = null) {
  try {
    if (!/^1[3-9]\d{9}$/.test(phoneNumber)) {
      return {
        success: false,
        message: '手机号格式不正确',
        code: 400
      };
    }

    if (!verificationCode) {
      verificationCode = Math.floor(Math.random() * 900000 + 100000).toString();
    }

    const config = new OpenApi.Config({
      accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
    });
    config.endpoint = 'dypnsapi.aliyuncs.com';
    const client = new Dypnsapi20170525.default(config);

    const sendSmsVerifyCodeRequest = new Dypnsapi20170525.SendSmsVerifyCodeRequest({
      phoneNumber: phoneNumber,
      signName: process.env.SMS_SIGN_NAME || '速通互联验证服务',
      templateCode: process.env.SMS_TEMPLATE_CODE || '100003',
      templateParam: JSON.stringify({ code: verificationCode, min: '5' }),
    });

    const runtime = new Util.RuntimeOptions({});
    const resp = await client.sendSmsVerifyCodeWithOptions(sendSmsVerifyCodeRequest, runtime);

    console.log('阿里云响应:', resp.body?.code, '-', resp.body?.message);

    // 只要 code 是 OK 就认为成功，即使有 message 警告
    if (resp.body && resp.body.code === 'OK') {
      return {
        success: true,
        message: '验证码发送成功',
        code: 200,
        verificationCode: verificationCode,
        requestId: resp.body.model?.requestId
      };
    } else {
      return {
        success: false,
        message: `发送失败: ${resp.body?.message || '未知错误'}`,
        code: 500
      };
    }
  } catch (error) {
    console.error('短信发送错误:', error.message);
    return {
      success: false,
      message: `短信发送异常: ${error.message}`,
      code: 500
    };
  }
}

const verificationCodeCache = new Map();

function cacheVerificationCode(phoneNumber, code) {
  const key = `sms_code_${phoneNumber}`;
  const expiresAt = Date.now() + 5 * 60 * 1000;
  verificationCodeCache.set(key, {
    code,
    expiresAt,
    attempts: 0
  });
  console.log(`验证码已缓存: ${key}, 过期时间: 5分钟`);
}

function verifyCode(phoneNumber, code) {
  const key = `sms_code_${phoneNumber}`;
  const cached = verificationCodeCache.get(key);

  if (!cached) {
    return {
      success: false,
      message: '验证码已过期或不存在，请重新请求'
    };
  }

  if (Date.now() > cached.expiresAt) {
    verificationCodeCache.delete(key);
    return {
      success: false,
      message: '验证码已过期，请重新请求'
    };
  }

  if (cached.attempts >= 5) {
    verificationCodeCache.delete(key);
    return {
      success: false,
      message: '验证次数过多，请重新请求验证码'
    };
  }

  if (cached.code === code) {
    verificationCodeCache.delete(key);
    return {
      success: true,
      message: '验证码正确'
    };
  }

  cached.attempts++;
  return {
    success: false,
    message: '验证码错误'
  };
}

module.exports = {
  sendVerificationCode,
  cacheVerificationCode,
  verifyCode
};
