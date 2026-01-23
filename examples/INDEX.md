# 示例总览

本文档提供 `examples/` 目录下所有示例的概述。

## 目录

1. [示例服务器](#示例服务器)
2. [Next.js 集成](#nextjs-集成)
3. [Nuxt 集成](#nuxt-集成)
4. [通用功能](#通用功能)
5. [快速开始](#快速开始)
6. [环境变量](#环境变量)

---

## 示例服务器

**目录**：`./demo/`

**技术栈**：Hono + Tailwind CSS + TypeScript

**功能**：
- ✅ 完整支付流程演示
- ✅ 交互式 Web 界面
- ✅ 实时二维码生成
- ✅ 订单管理（创建、查询、关闭）
- ✅ 退款管理
- ✅ Webhook 处理
- ✅ 轮询自动更新状态

**快速启动**：
```bash
cd examples/demo
cp .env.example .env
# 编辑 .env 配置凭证
npm install
npm run dev
```

**文档**：
- [快速启动指南](./demo/QUICKSTART.md)
- [完整文档](./demo/README.md)
- [测试指南](./demo/TESTING_GUIDE.md)

---

## Next.js 集成

**目录**：`./nextjs/`

**技术栈**：Next.js 15 + App Router + TypeScript

**功能**：
- ✅ Route Handlers API 端点
- ✅ 环境变量管理
- ✅ 服务端 WeChat Pay 客户端初始化
- ✅ 单例模式
- ✅ React 组件示例
- ✅ 完整 TypeScript 类型

**项目结构**：
```
nextjs/
├── app/
│   └── api/
│       └── wechatpay/
│           ├── create/route.ts       # POST /api/wechatpay/create
│           ├── webhook/route.ts      # POST /api/wechatpay/webhook
│           └── query/[id]/route.ts  # GET /api/wechatpay/query/:id
├── lib/
│   └── wechatpay.ts                # WeChatPay 客户端单例
├── package.json
├── tsconfig.json
└── .env.example
```

**快速启动**：
```bash
cd nextjs
npm install
cp .env.example .env
# 编辑 .env 配置凭证
npm run dev
```

**API 端点**：
- `POST /api/wechatpay/create` - 创建支付
- `GET /api/wechatpay/query/:id` - 查询订单
- `POST /api/wechatpay/webhook` - 处理 Webhook

**文档**：[Next.js 示例文档](./nextjs/README.md)

---

## Nuxt 集成

**目录**：`./nuxt/`

**技术栈**：Nuxt 3 + TypeScript

**功能**：
- ✅ Server API 路由
- ✅ 运行时配置
- ✅ WeChat Pay 客户端工具函数
- ✅ 环境变量管理（私有和公共）
- ✅ Vue 组件示例
- ✅ TypeScript 类型安全

**项目结构**：
```
nuxt/
├── server/
│   ├── api/
│   │   └── wechatpay/
│   │       ├── create.post.ts        # POST /api/wechatpay/create
│   │       ├── webhook.post.ts       # POST /api/wechatpay/webhook
│   │       └── query/[id].get.ts    # GET /api/wechatpay/query/:id
│   └── utils/
│       └── wechatpay.ts             # WeChatPay 客户端工具
├── nuxt.config.ts
├── package.json
├── tsconfig.json
└── .env.example
```

**快速启动**：
```bash
cd nuxt
npm install
cp .env.example .env
# 编辑 .env 配置凭证
npm run dev
```

**API 端点**：
- `POST /api/wechatpay/create` - 创建支付
- `GET /api/wechatpay/query/:id` - 查询订单
- `POST /api/wechatpay/webhook` - 处理 Webhook

**文档**：[Nuxt 示例文档](./nuxt/README.md)

---

## 通用功能

所有示例都演示相同的核心功能：

### 1. 创建支付

```bash
POST /api/wechatpay/create
{
  "out_trade_no": "order_1234567890",
  "description": "会员订阅",
  "amount": 0.01,
  "currency": "CNY",
  "payer_client_ip": "127.0.0.1"
}
```

### 2. 查询订单

```bash
GET /api/wechatpay/query/order_1234567890?mchid=your_mchid
```

### 3. 处理 Webhook

微信支付会在支付完成后自动 POST 到 webhook 端点。

**请求头**：
- `Wechatpay-Signature`: 验签签名
- `Wechatpay-Timestamp`: 请求时间戳
- `Wechatpay-Nonce`: 随机字符串
- `Wechatpay-Serial`: 证书序列号

### 4. 错误处理

所有示例都包含：
- 完善的错误处理
- 有意义的错误消息
- 适当的 HTTP 状态码
- 调试日志

---

## 快速开始

### 前提条件

- Node.js 18+
- 微信支付商户账号
- Base64 编码的证书

### 选择示例

#### 用于测试和开发
使用 **示例服务器** - 有完整的 UI，配置最简单。

```bash
npm run dev  # 从项目根目录启动
```

#### 用于 Next.js 项目
使用 **Next.js 示例** - 集成到现有 Next.js 应用。

```bash
cd examples/nextjs
npm install
npm run dev
```

#### 用于 Nuxt 项目
使用 **Nuxt 示例** - 集成到现有 Nuxt 应用。

```bash
cd examples/nuxt
npm install
npm run dev
```

---

## 环境变量

所有示例需要相同的微信支付凭证。复制 `.env.example` 到 `.env` 并配置：

### 必需变量

```env
WECHAT_PAY_APP_ID=wxYourAppID
WECHAT_PAY_MCH_ID=1234567890
WECHAT_PAY_API_KEY=your_32_character_api_key
WECHAT_PAY_PRIVATE_KEY=MIIEvQIBADANBgkq...
WECHAT_PAY_PUBLIC_KEY=MIID8zCCAtugAwIB...
```

### 可选变量

```env
# 微信支付公钥（推荐）
WECHAT_PAY_PAYMENT_PUBLIC_KEY=MIIEvgIBADAN...
WECHAT_PAY_PUBLIC_KEY_ID=serial_number

# Webhook URL
WECHAT_PAY_NOTIFY_URL=http://localhost:3000/api/wechatpay/webhook

# 调试模式
WECHAT_PAY_DEBUG=true
```

### 如何获取这些值

1. **AppID 和 MchID**：登录 [微信支付商户平台](https://pay.weixin.qq.com/)，在「账户中心」查看
2. **API 密钥**：「账户中心」→「API 安全」→「API 密钥」（32 字符）
3. **证书**：「账户中心」→「API 安全」→「商户 API 证书」下载
4. **微信支付公钥**：「账户中心」→「API 安全」→「微信支付公钥」获取

### 证书转换为 Base64

```bash
# macOS/Linux
base64 -i apiclient_key.pem | tr -d '\n'

# 使用 openssl
openssl base64 -in apiclient_key.pem | tr -d '\n'
```

---

## 对比

| 功能 | 示例服务器 | Next.js | Nuxt |
|-----|-----------|---------|------|
| **UI** | ✅ 有（Hono + Tailwind） | ❌ 需自定义 | ❌ 需自定义 |
| **TypeScript** | ✅ | ✅ | ✅ |
| **生产就绪** | ⚠️ 仅用于演示 | ✅ 是 | ✅ 是 |
| **配置难度** | 简单 | 中等 | 中等 |
| **可定制性** | 有限 | 高 | 高 |
| **框架集成** | 独立 | Next.js App Router | Nuxt 3 |
| **最适合** | 快速测试、演示 | React 项目 | Vue 项目 |

---

## 生产环境清单

部署到生产环境前，确保：

- [ ] Webhook URL 使用 HTTPS
- [ ] 凭证安全存储（不在 .env 文件中）
- [ ] 实现适当的身份验证
- [ ] 添加速率限制
- [ ] 设置数据库存储订单
- [ ] 配置适当的日志
- [ ] 启用错误监控
- [ ] 使用真实支付测试（小金额）
- [ ] 设置 Webhook 重试处理
- [ ] 每次请求都验证 Webhook 签名

---

## 故障排除

### 常见问题

**1. 证书加载失败**
- 确保 Base64 编码正确（无换行）
- 验证证书文件是有效的 PEM 格式
- 检查私钥和证书是否匹配

**2. Webhook 未收到**
- 确保 Webhook URL 可公开访问
- 检查防火墙/安全组设置
- 本地测试使用 ngrok：`ngrok http 3000`

**3. 签名验证失败**
- 检查 API 密钥是否正确（32 字符）
- 验证系统时间是否准确
- 确保证书未过期

**4. 端口已被占用**
- 在 `.env` 文件中更改端口：`PORT=8080`
- 或终止进程：`lsof -ti:3000 | xargs kill -9`

---

## 相关资源

- [Better WeChat Pay SDK README](../README.md)
- [微信支付 API 文档](https://pay.weixin.qq.com/wiki/doc/apiv3/index.shtml)
- [Next.js 文档](https://nextjs.org/docs)
- [Nuxt 文档](https://nuxt.com/docs)

---

## 贡献

想要添加新示例？欢迎贡献！

1. 在 `examples/` 下创建新目录
2. 遵循现有结构
3. 添加包含设置说明的 `README.md`
4. 包含 `.env.example` 配置文件
5. 更新本文档

---

**祝编码愉快！** 🚀
