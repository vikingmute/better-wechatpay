# 调试模式

调试模式帮助你在开发过程中诊断问题。

## 启用调试模式

### 方式一：配置选项

```typescript
const wechat = new WeChatPay({
  config: {
    appId: process.env.WECHAT_PAY_APP_ID!,
    mchId: process.env.WECHAT_PAY_MCH_ID!,
    // ...其他配置
    debug: true  // 启用调试模式
  }
});
```

### 方式二：环境变量

```bash
WECHAT_PAY_DEBUG=true node app.js
```

## 调试输出

启用调试模式后，你将看到以下信息：

### 请求信息

```
[WeChatPay] Creating native payment: {
  out_trade_no: 'order_123456',
  description: '测试商品',
  amount: 0.01
}
```

### API 请求详情

```
[WeChatPay] POST /v3/pay/transactions/native
[WeChatPay] Request headers: {
  'Content-Type': 'application/json',
  'Authorization': 'WECHATPAY2-SHA256-RSA2048 ...',
  'Accept': 'application/json'
}
[WeChatPay] Request body: {
  appid: 'wx...',
  mchid: '123...',
  description: '测试商品',
  out_trade_no: 'order_123456',
  notify_url: 'https://...',
  amount: { total: 1, currency: 'CNY' },
  ...
}
```

### 响应详情

```
[WeChatPay] Response status: 200 OK
[WeChatPay] Response headers: {
  'request-id': '...',
  'wechatpay-timestamp': '...',
  'wechatpay-nonce': '...',
  'wechatpay-signature': '...'
}
[WeChatPay] Response body: {
  code_url: 'weixin://wxpay/bizpayurl?pr=...'
}
```

### 错误信息

```
[WeChatPay] Request failed [POST] "https://api.mch.weixin.qq.com/v3/pay/transactions/native": 400 Bad Request
[WeChatPay] Error details: {
  status: 400,
  statusText: 'Bad Request',
  data: {
    code: 'PARAM_ERROR',
    message: '参数错误',
    detail: { location: 'body', value: null }
  }
}
```

## 调试技巧

### 1. 检查签名问题

如果遇到签名验证失败，查看调试输出中的签名信息：

```
[WeChatPay] Signature string: "POST\n/v3/pay/transactions/native\n1234567890\nnonce123\n{...}\n"
[WeChatPay] Generated signature: "xxxx..."
```

### 2. 验证请求参数

检查实际发送的请求参数是否正确：

```typescript
const wechat = new WeChatPay({ config: { ...config, debug: true } });

// 调试输出会显示完整的请求参数
await wechat.native.create({
  out_trade_no: 'test-123',
  description: '测试',
  amount: 0.01
});
```

### 3. 检查证书加载

调试模式会显示证书加载状态：

```
[WeChatPay] Loading certificates...
[WeChatPay] Private key loaded successfully
[WeChatPay] Public key loaded successfully
[WeChatPay] Payment public key loaded successfully
```

### 4. Webhook 调试

调试 Webhook 验证过程：

```typescript
const result = await wechat.webhook.verify({ headers, body });

// 调试输出：
// [WeChatPay] Verifying webhook signature...
// [WeChatPay] Timestamp: 1234567890
// [WeChatPay] Nonce: abc123
// [WeChatPay] Signature verified: true
// [WeChatPay] Decrypting resource...
// [WeChatPay] Decrypted data: {...}
```

## 自定义日志

如果需要自定义日志输出，可以设置自定义 logger：

```typescript
import WeChatPay from 'better-wechatpay';

// SDK 使用 console.log 输出调试信息
// 你可以通过重定向 console.log 来自定义

const originalLog = console.log;
console.log = (...args) => {
  if (args[0]?.includes('[WeChatPay]')) {
    // 自定义处理 WeChatPay 日志
    myLogger.debug(...args);
  } else {
    originalLog(...args);
  }
};
```

## 生产环境注意事项

⚠️ **警告**：在生产环境中应禁用调试模式！

调试模式会输出敏感信息，包括：
- API 密钥（部分）
- 请求签名
- 商户号和应用 ID
- 订单详情

```typescript
// 生产环境配置
const wechat = new WeChatPay({
  config: {
    ...config,
    debug: process.env.NODE_ENV !== 'production'  // 只在开发环境启用
  }
});
```

## 常见问题排查

### 签名错误

```
Error: SIGN_ERROR - 签名验证失败
```

检查：
1. API 密钥是否正确（32 位字符）
2. 私钥是否与证书匹配
3. 系统时间是否准确

### 证书错误

```
Error: Failed to load certificates
```

检查：
1. 证书格式是否正确（PEM 格式）
2. 证书是否过期
3. 私钥和公钥是否匹配

### 参数错误

```
Error: PARAM_ERROR - 参数错误
```

检查调试输出中的请求参数，确认：
1. 必填字段是否齐全
2. 字段格式是否正确
3. 金额是否为正整数（分）

## 相关链接

- [快速开始](getting-started.md)
- [安全指南](security.md)
- [错误码](error-codes.md)
