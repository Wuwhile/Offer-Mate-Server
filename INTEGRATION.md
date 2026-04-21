# 📱 前后端集成指南

这份文档说明如何将部署的后端服务与你的Warm-Mate前端应用集成。

---

## 第一步：更新前端API配置

### 1.1 修改服务器地址

编辑你的前端项目文件：**Warm-Mate/common/config/env.js**

```javascript
// prod-生产 dev-开发 local-本地
const env = "local"  // 改为你要使用的环境

// 用你的ECS服务器IP替换 112.125.123.4
const prod = {
    baseUrl: 'http://你的ECS公网IP:7001/alibaba-ai/v1'  // 生产环境
}

const dev = {
    baseUrl: 'http://你的ECS公网IP:7001/alibaba-ai/v1'  // 开发环境
}

const local = {
    baseUrl: 'http://你的ECS公网IP:7001/alibaba-ai/v1'  // 本地环境
}

const config = {
    dev,
    prod,
    local,
}

export default config[env]
```

**例如，如果ECS IP是 `1.2.3.4`**：
```javascript
const prod = {
    baseUrl: 'http://1.2.3.4:7001/alibaba-ai/v1'
}
```

### 1.2 验证HTTP请求配置

检查 **Warm-Mate/common/http/request.js** 中的拦截器是否正确读取token：

```javascript
// 这部分应该已经在你的代码中
if(config?.custom?.auth) {
    config.header['Access-Token'] = uni.getStorageSync("Access-Token")
}
```

---

## 第二步：前端登录/注册流程

### 2.1 注册流程

```javascript
// 在登录/注册页面中
async handleRegister(username, password, phone, email) {
    try {
        const response = await uni.$u.http.post("/register", {
            username,
            password,
            phone,
            email
        }, {
            custom: { auth: false }  // 注册不需要token
        });

        if (response.code === 200) {
            uni.$u.toast('注册成功');
            // 跳转到登录页面
            uni.navigateTo({ url: '/pages/login/login' });
        }
    } catch (error) {
        uni.$u.toast('注册失败: ' + error.message);
    }
}
```

### 2.2 登录流程

```javascript
// 在登录页面中
async handleLogin(username, password) {
    try {
        const response = await uni.$u.http.post("/login", {
            username,
            password
        }, {
            custom: { auth: false }  // 登录不需要token
        });

        if (response.code === 200) {
            const { token, id, uid, username: name } = response.data;
            
            // 保存token和用户信息到本地存储
            uni.setStorageSync("Access-Token", token);
            uni.setStorageSync("userId", id);
            uni.setStorageSync("uid", uid);  // uid = 100000000 + id
            uni.setStorageSync("username", name);
            
            uni.$u.toast('登录成功');
            
            // 跳转到首页
            uni.navigateTo({ 
                url: '/pages/index/index',
                animationType: 'fade-in'
            });
        }
    } catch (error) {
        uni.$u.toast('登录失败: ' + error.message);
    }
}
```

### 2.3 获取用户信息（已认证）

```javascript
// 调用需要认证的API
async getUserInfo() {
    try {
        // 自动从localStorage读取token，无需手动添加
        const response = await uni.$u.http.get("/user/info", {
            custom: { auth: true }  // 需要token认证
        });

        if (response.code === 200) {
            const userInfo = response.data;
            uni.setStorageSync("userInfo", userInfo);
            console.log('用户信息:', userInfo);
        }
    } catch (error) {
        console.error('获取用户信息失败:', error);
    }
}
```

### 2.4 更新用户信息（已认证 - 支持单字段更新）

```javascript
// 更新用户信息（支持更新单个字段或多个字段）
async updateUserInfo(updateData) {
    try {
        // updateData 可以包含: username, phone, email 中的任意组合
        // 示例1：仅更新邮箱
        // const updateData = { email: 'new@example.com' };
        // 示例2：仅更新电话
        // const updateData = { phone: '13900000000' };
        // 示例3：同时更新多个字段
        // const updateData = { username: 'newname', email: 'new@example.com' };
        
        const response = await uni.$u.http.put("/user/info", updateData, {
            custom: { auth: true }  // 需要token认证
        });

        if (response.code === 200) {
            uni.$u.toast('信息更新成功');
            // 返回的数据包含完整的用户信息
            const userInfo = response.data;
            console.log('更新后的用户ID:', userInfo.uid);  // uid字段
            uni.setStorageSync("userInfo", userInfo);
        }
    } catch (error) {
        uni.$u.toast('更新失败: ' + error.message);
    }
}

// 使用示例：仅更新邮箱
// await updateUserInfo({ email: 'newemail@example.com' });
```

**重要说明：**
- API 支持更新单个字段或多个字段的灵活组合
- 只需传递想要更新的字段，不需要一次传递所有字段
- 响应数据包含 `uid` 字段（uid = 100000000 + user_id）

---

## 关于用户ID和UID字段

### UID说明

从 **v1.0.2** 版本开始，API 响应中包含 `uid` 字段（用户唯一标识符）：

**计算公式**: `uid = 100000000 + id`

**示例**：
- 如果数据库中 user.id = 5，则 uid = 100000005
- 如果数据库中 user.id = 100，则 uid = 100000100
- 如果数据库中 user.id = 9999，则 uid = 100009999

**包含uid字段的API响应**：
- `/login` - 登录接口返回 uid
- `/register` - 注册接口返回 uid
- `/user/info` - 获取用户信息接口返回 uid

**前端使用**：
```javascript
// 从任何API响应中获取uid
const userInfo = uni.getStorageSync("userInfo");
console.log('当前用户UID:', userInfo.uid);  // 格式: 100000XXX

// 在需要显示用户唯一标识的场景使用uid，而不是id
// 例如：显示在个人中心、分享标识等
```

---

## 第三步：处理token过期

在前端的HTTP拦截器中已经处理过token过期：

```javascript
// 这已经在 common/http/request.js 中
if(401 == data.code){
    uni.removeStorageSync("Access-Token")
    setTimeout(()=>{
        uni.$u.route('/pages/login/login');
    },1000)
}
```

---

## 第四步：完整的登录页面示例

创建或更新你的登录页面 **pages/login/login.vue**：

```vue
<template>
    <view class="login-container">
        <view class="title">
            <text>Warm-Mate</text>
            <text class="subtitle">心理健康助手</text>
        </view>

        <view class="form">
            <!-- 用户名输入 -->
            <uni-easyinput
                v-model="formData.username"
                placeholder="请输入用户名"
                prefixIcon="person"
                clearable
                @blur="checkUsername"
            />

            <!-- 密码输入 -->
            <uni-easyinput
                v-model="formData.password"
                type="password"
                placeholder="请输入密码"
                prefixIcon="lock"
                clearable
                @blur="checkPassword"
            />

            <!-- 登录/注册按钮 -->
            <button 
                @click="handleLogin" 
                :loading="loading"
                class="submit-btn"
            >
                登录
            </button>

            <!-- 切换到注册 -->
            <view class="toggle-auth">
                <text @click="showRegister = true">还没有账号？点击注册</text>
            </view>
        </view>

        <!-- 注册弹层 -->
        <uni-popup ref="registerPopup" type="center" background-color="#fff">
            <view class="register-form" style="width: 90vw; padding: 20px;">
                <text style="font-size: 18px; font-weight: bold;">注册新账号</text>

                <uni-easyinput
                    v-model="registerData.username"
                    placeholder="用户名"
                    style="margin-top: 15px;"
                />

                <uni-easyinput
                    v-model="registerData.password"
                    type="password"  
                    placeholder="密码"
                    style="margin-top: 10px;"
                />

                <uni-easyinput
                    v-model="registerData.phone"
                    placeholder="手机号"
                    type="tel"
                    style="margin-top: 10px;"
                />

                <uni-easyinput
                    v-model="registerData.email"
                    placeholder="邮箱（可选）"
                    type="email"
                    style="margin-top: 10px;"
                />

                <button 
                    @click="handleRegister"
                    style="margin-top: 20px;"
                    :loading="registering"
                >
                    确认注册
                </button>

                <button 
                    @click="closeRegister"
                    style="margin-top: 10px;"
                    type="default"
                >
                    取消
                </button>
            </view>
        </uni-popup>
    </view>
</template>

<script>
export default {
    data() {
        return {
            formData: {
                username: '',
                password: ''
            },
            registerData: {
                username: '',
                password: '',
                phone: '',
                email: ''
            },
            loading: false,
            registering: false,
            showRegister: false
        }
    },
    methods: {
        checkUsername() {
            if (!this.formData.username) {
                this.$u.toast('请输入用户名');
                return false;
            }
            return true;
        },
        checkPassword() {
            if (!this.formData.password) {
                this.$u.toast('请输入密码');
                return false;
            }
            return true;
        },
        async handleLogin() {
            if (!this.checkUsername() || !this.checkPassword()) {
                return;
            }

            this.loading = true;
            try {
                const response = await this.$u.http.post("/login", 
                    this.formData,
                    { custom: { auth: false } }
                );

                if (response.code === 200) {
                    const { token, id, username } = response.data;
                    
                    // 保存用户信息
                    uni.setStorageSync("Access-Token", token);
                    uni.setStorageSync("userId", id);
                    uni.setStorageSync("username", username);
                    
                    this.$u.toast('登录成功');
                    
                    // 跳转到首页
                    setTimeout(() => {
                        uni.navigateTo({ url: '/pages/index/index' });
                    }, 500);
                }
            } catch (error) {
                this.$u.toast('登录失败，请检查用户名和密码');
            } finally {
                this.loading = false;
            }
        },
        async handleRegister() {
            if (!this.registerData.username) {
                this.$u.toast('请输入用户名');
                return;
            }
            if (!this.registerData.password) {
                this.$u.toast('请输入密码');
                return;
            }
            if (!this.registerData.phone) {
                this.$u.toast('请输入手机号');
                return;
            }

            this.registering = true;
            try {
                const response = await this.$u.http.post("/register",
                    this.registerData,
                    { custom: { auth: false } }
                );

                if (response.code === 200) {
                    this.$u.toast('注册成功，请登录');
                    this.closeRegister();
                    // 填充用户名以便登录
                    this.formData.username = this.registerData.username;
                    this.formData.password = this.registerData.password;
                }
            } catch (error) {
                this.$u.toast('注册失败: ' + error.message);
            } finally {
                this.registering = false;
            }
        },
        closeRegister() {
            this.$refs.registerPopup.close();
            this.registerData = {
                username: '',
                password: '',
                phone: '',
                email: ''
            };
        }
    },
    watch: {
        showRegister(val) {
            if (val) {
                this.$refs.registerPopup.open();
            }
        }
    }
}
</script>

<style scoped lang="scss">
.login-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    justify-content: center;
    align-items: center;
    padding: 30px 20px;

    .title {
        text-align: center;
        color: white;
        margin-bottom: 50px;

        text {
            display: block;
            font-size: 32px;
            font-weight: bold;
        }

        .subtitle {
            font-size: 14px;
            margin-top: 10px;
            opacity: 0.9;
        }
    }

    .form {
        width: 100%;
        max-width: 300px;
        
        :deep(.uni-easyinput) {
            margin-bottom: 15px;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 8px;
        }

        .submit-btn {
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 8px;
            height: 45px;
            line-height: 45px;
            margin-top: 10px;
        }

        .toggle-auth {
            text-align: center;
            margin-top: 15px;

            text {
                color: white;
                font-size: 12px;
            }
        }
    }
}
</style>
```

---

## 第五步：测试集成

### 5.1 本地测试

1. **确保后端运行**：
   ```bash
   pm2 status  # 查看进程状态
   ```

2. **编译前端**：
   ```bash
   npm run dev  # 或使用HBuilderX编译
   ```

3. **使用测试账号**：
   - 用户名：testuser
   - 密码：password123
   - 手机号：13800138000

### 5.2 检查网络请求

在HBuilderX或浏览器开发者工具中：
1. 打开 **network** 标签
2. 点击登录/注册按钮
3. 查看请求是否发送到正确的服务器IP
4. 验证响应状态码是否为200

### 5.3 验证token保存

在浏览器控制台执行：
```javascript
// 检查是否保存了token
console.log(uni.getStorageSync("Access-Token"));
console.log(uni.getStorageSync("userInfo"));
```

---

## 常见集成问题

### 问题1：前端无法连接后端

**症状**：请求超时或连接拒绝

**解决**：
- 确保ECS防火墙允许7001端口
- 检查前端配置的IP是否正确
- 确保后端服务正在运行：`pm2 status`

### 问题2：Token显示无效

**症状**：获取用户信息时返回401错误

**解决**：
- 检查token是否正确保存：`uni.getStorageSync("Access-Token")`
- 确保登录成功且获得了token
- 在HTTP请求头中验证token已发送

### 问题3：跨域问题

**症状**：浏览器报CORS错误

**解决**：
后端已配置CORS，如仍有问题，在 `app.js` 中修改：
```javascript
app.use(cors({
    origin: ['http://localhost:8001', '你的域名'],
    credentials: true
}));
```

---

## ✅ 集成检查清单

- [ ] 更新了前端的服务器IP地址
- [ ] 后端服务正在运行（pm2 status）
- [ ] 数据库已初始化且可连接
- [ ] 防火墙规则允许7001端口
- [ ] 测试了注册功能
- [ ] 测试了登录功能
- [ ] Token正确保存到本地
- [ ] 获取用户信息接口可用
- [ ] 网络请求拦截器正确添加了token

---

完成以上步骤后，你的Warm-Mate应用就可以使用云端服务器进行用户认证和信息存储了！
