<div align="center">

# Better WeChatPay

**现代化的微信支付 Node.js SDK**

ESM、TypeScript、全支付方式支持

[![npm version](https://img.shields.io/npm/v/better-wechatpay.svg)](https://www.npmjs.com/package/better-wechatpay)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Build Status](https://github.com/vikingmute/better-wechatpay/actions/workflows/ci.yml/badge.svg)

[**在线文档**](https://better-wechatpay.vikingz.me)

</div>

## 特性

- ✅ 纯 ESM（ES Modules）
- ✅ 完整的 TypeScript 类型支持
- ✅ 支持所有支付方式（Native/APP/JSAPI/小程序/H5）
- ✅ 双签名验证（新公钥 + 平台证书）
- ✅ 内置调试模式
- ✅ 最小依赖（@peculiar/x509、ofetch）
- ✅ 自动金额格式化（元转分）
- ✅ 完善的测试覆盖
- ✅ demo 服务 - 基于 hono 的轻量级 web 应用，用于本地测试和调试
- ✅ 框架集成 - 提供 Next.js 和 Nuxt.js 的使用示例

## 安装

```bash
npm install better-wechatpay
```

## 快速开始

```typescript
import WeChatPay from 'better-wechatpay';

const wechat = new WeChatPay({
  config: {
    appId: process.env.WECHAT_PAY_APP_ID,
    mchId: process.env.WECHAT_PAY_MCH_ID,
    apiKey: process.env.WECHAT_PAY_API_KEY,
    privateKey: process.env.WECHAT_PAY_PRIVATE_KEY,
    publicKey: process.env.WECHAT_PAY_PUBLIC_KEY,
    // 可选但推荐：微信支付公钥验签（无有效期限制）
    paymentPublicKey: process.env.WECHAT_PAY_PAYMENT_PUBLIC_KEY,
    publicKeyId: process.env.WECHAT_PAY_PUBLIC_KEY_ID,
    // 新商户仅使用微信支付公钥时可开启（默认 false）
    skipFetchPlatformCertificates: true,
    notifyUrl: 'https://your-domain.com/webhook/wechat'
  }
});

// 创建 Native 支付（扫码支付）
const payment = await wechat.native.create({
  out_trade_no: 'order-123',
  description: '会员订阅',
  amount: 99.00  // 自动转换为分（9900）
});

console.log('二维码链接:', payment.code_url);
```

## 环境变量

必需的环境变量：

```bash
# 微信支付凭证
WECHAT_PAY_APP_ID="your_app_id"
WECHAT_PAY_MCH_ID="your_mch_id"
WECHAT_PAY_API_KEY="32_character_api_key"

# 证书（PEM 格式，多行/单行均可）
WECHAT_PAY_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkq...
-----END PRIVATE KEY-----"

WECHAT_PAY_PUBLIC_KEY="-----BEGIN CERTIFICATE-----
MIID8zCCAtugAwIB...
-----END CERTIFICATE-----"

# 可选但推荐：微信支付公钥（用于验签，无有效期限制）
# 获取位置：商户平台 → 账户中心 → API安全 → 微信支付公钥
WECHAT_PAY_PAYMENT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
MIIEvgIBADAN...
-----END PUBLIC KEY-----"

# 公钥 ID（下载公钥时显示，必须与公钥配对使用）
# 获取位置：商户平台 → 账户中心 → API安全 → 微信支付公钥
# 格式如：PUB_KEY_ID_0000000000000024101100397200000006
WECHAT_PAY_PUBLIC_KEY_ID="PUB_KEY_ID_xxxx"
```

## 支付方式

### Native 支付（扫码支付）

```typescript
const payment = await wechat.native.create({
  out_trade_no: 'order-123',
  description: '会员订阅',
  amount: 99.00
});
// 返回: { code_url: 'weixin://...', out_trade_no: 'order-123' }
```

### APP 支付

```typescript
const payment = await wechat.app.create({
  out_trade_no: 'order-123',
  description: '会员订阅',
  amount: 99.00
});
// 返回: { prepay_id: '...', out_trade_no: 'order-123' }
```

### JSAPI / 小程序支付

```typescript
const payment = await wechat.jsapi.create({
  out_trade_no: 'order-123',
  description: '会员订阅',
  amount: 99.00,
  openid: 'user_openid'  // 必填
});
// 返回: { prepay_id: '...', out_trade_no: 'order-123' }
```

### H5 支付

```typescript
const payment = await wechat.h5.create({
  out_trade_no: 'order-123',
  description: '会员订阅',
  amount: 99.00,
  payer_client_ip: '1.2.3.4',
  h5_info: {
    type: 'Wap',
    app_name: '我的应用',
    app_url: 'https://example.com'
  }
});
// 返回: { h5_url: 'https://wx.tenpay.com/...', out_trade_no: 'order-123' }
```


## 文档

在线文档：[https://better-wechatpay.vikingz.me](https://better-wechatpay.vikingz.me)

### 快速入门
- [快速开始](docs/getting-started.md)
- [API 参考](docs/api-reference.md)
- [调试模式](docs/debug-mode.md)
- [安全指南](docs/security.md)
- [错误码](docs/error-codes.md)

### 支付方式
- [Native 支付（扫码支付）](docs/native-payment.md)
- [APP 支付](docs/app-payment.md)
- [JSAPI 支付](docs/jsapi-payment.md)
- [H5 支付](docs/h5-payment.md)
- [合单支付](docs/combine-payment.md)

### 本地预览文档

```bash
npm run docs:dev    # 开发模式
npm run docs:build  # 构建
npm run docs:preview # 预览构建结果
```

## 示例服务器

想要测试完整的支付流程？查看 [示例服务器](examples/demo/QUICKSTART.md) - 一个功能完整的测试服务器：

- ✅ 创建真实支付和二维码
- ✅ 使用微信扫码完成支付
- ✅ 处理真实的 Webhook
- ✅ 查询和管理订单
- ✅ 测试所有支付状态

**快速启动：**
```bash
# 1. 配置环境变量
cd examples/demo
cp .env.example .env
# 编辑 .env，填入你的微信支付凭证

# 2. 启动示例服务器
npm install
npm run dev

# 3. 打开 http://localhost:3000
# 创建支付，扫描二维码，完成支付！
```

详见 [示例服务器文档](examples/demo/QUICKSTART.md)。

## 框架集成

查看框架集成示例：

### [Next.js](examples/nextjs/)
现代 React 框架，支持 App Router

```bash
cd examples/nextjs
npm install
npm run dev
```

### [Nuxt](examples/nuxt/)
直观的 Vue 全栈开发框架

```bash
cd examples/nuxt
npm install
npm run dev
```

详见 [所有示例](examples/INDEX.md)。

## 开发

```bash
# 安装依赖
npm install

# 构建 TypeScript
npm run build

# 运行单元测试
npm test

# 运行示例服务器（需要微信支付凭证）
npm run dev

# 类型检查
npm run typecheck
```
