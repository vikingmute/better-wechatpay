# Better WeChatPay

现代化的微信支付 Node.js SDK - ESM、TypeScript、全支付方式支持

## 目录

- [特性](#特性)
- [安装](#安装)
- [快速开始](#快速开始)
- [环境变量](#环境变量)
- [支付方式](#支付方式)
  - [Native 支付（扫码支付）](#native-支付扫码支付)
  - [APP 支付](#app-支付)
  - [JSAPI / 小程序支付](#jsapi--小程序支付)
  - [H5 支付](#h5-支付)
  - [合单支付](#合单支付)
- [订单管理](#订单管理)
- [退款管理](#退款管理)
- [账单下载](#账单下载)
- [Webhook 处理](#webhook-处理)
- [自定义 API 调用](#自定义-api-调用)
- [调试模式](#调试模式)
- [示例服务器](#示例服务器)
- [框架集成](#框架集成)
- [文档](#文档)

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

# 证书（PEM 格式，单行）
WECHAT_PAY_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkq...
-----END PRIVATE KEY-----"

WECHAT_PAY_PUBLIC_KEY="-----BEGIN CERTIFICATE-----
MIID8zCCAtugAwIB...
-----END CERTIFICATE-----"

# 可选：微信支付公钥（推荐）
WECHAT_PAY_PAYMENT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
MIIEvgIBADAN...
-----END PUBLIC KEY-----"

WECHAT_PAY_PUBLIC_KEY_ID="public_key_id"
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

## 通用操作

所有支付方式都支持以下操作：

### 查询订单

```typescript
// 通过商户订单号查询
const order = await wechat.native.query({ out_trade_no: 'order-123' });

// 通过微信订单号查询
const order = await wechat.native.queryByTransactionId({ transaction_id: 'txn-123' });

console.log('订单状态:', order.trade_state);
console.log('微信订单号:', order.transaction_id);
console.log('金额:', order.amount.total);
```

### 关闭订单

```typescript
await wechat.native.close('order-123');
```

### 申请退款

```typescript
const refund = await wechat.native.refund({
  out_trade_no: 'order-123',
  out_refund_no: 'refund-123',
  refund: 99.00,
  total: 99.00,
  reason: '商品售后'
});
```

### 查询退款

```typescript
const refund = await wechat.native.queryRefund({ out_refund_no: 'refund-123' });
```

### 申请账单

```typescript
// 交易账单
const tradeBill = await wechat.native.applyTradeBill({
  bill_date: '2025-01-01',
  bill_type: 'ALL'
});

// 资金账单
const fundBill = await wechat.native.applyFundFlowBill({
  bill_date: '2025-01-01',
  account_type: 'BASIC'
});
```

## 自定义 API 调用

SDK 暴露了底层 HTTP 客户端，可用于调用未实现的微信支付 API：

```typescript
const result = await wechat.request<CustomResponse>(
  'POST',
  '/v3/custom/endpoint',
  { custom_param: 'value' }
);
```

这对于调用新推出的微信支付 API 或特殊业务场景非常有用。

## Webhook 处理

```typescript
import { createServer } from 'http';

const server = createServer(async (req, res) => {
  if (req.url === '/webhook/wechat') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      const result = await wechat.webhook.verify({
        headers: req.headers as any,
        body
      });

      if (result.success) {
        console.log('Webhook 验证成功:', result.eventType);
        console.log('解密数据:', result.decryptedData);
        res.writeHead(200);
        res.end('OK');
      } else {
        console.error('Webhook 签名无效');
        res.writeHead(400);
        res.end('Invalid signature');
      }
    });
  }
});

server.listen(3000);
```

## 调试模式

启用调试日志：

```typescript
const wechat = new WeChatPay({
  config: {
    /* ... 配置 ... */
    debug: true
  }
});

// 或通过环境变量
WECHAT_PAY_DEBUG=true node app.js
```

调试输出包含：
- 请求详情（URL、方法、请求头、请求体）
- 响应详情（状态码、响应头、响应体）
- 签名验证结果
- 错误详情

## 配置选项

```typescript
interface WeChatPayConfig {
  appId: string;              // 应用 ID
  mchId: string;              // 商户号
  apiKey: string;             // API 密钥（32位）
  privateKey: Buffer | string; // 商户私钥
  publicKey: Buffer | string;  // 商户证书
  paymentPublicKey?: Buffer | string;  // 微信支付公钥（可选，推荐）
  publicKeyId?: string;        // 公钥 ID（使用 paymentPublicKey 时必填）
  notifyUrl?: string;          // 回调通知地址
  baseUrl?: string;            // API 基础 URL（默认生产环境）
  debug?: boolean;             // 调试模式
}
```

## 安全注意事项

1. **永远不要将证书或密钥提交到版本控制**
2. **将敏感凭证存储在环境变量中**
3. **始终验证 Webhook 签名**
4. **Webhook URL 必须使用 HTTPS**
5. **定期轮换证书**

详见 [安全指南](docs/security.md)。

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
