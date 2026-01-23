# 错误码

本文档列出了微信支付 API 可能返回的错误码及解决方案。

## HTTP 状态码

| 状态码 | 说明 | 处理方式 |
|-------|------|---------|
| 200 | 成功 | 正常处理响应 |
| 400 | 请求参数错误 | 检查请求参数 |
| 401 | 认证失败 | 检查证书和签名 |
| 403 | 无权限 | 检查商户权限 |
| 404 | 资源不存在 | 检查请求路径和资源 ID |
| 429 | 请求频率超限 | 降低请求频率 |
| 500 | 服务器内部错误 | 稍后重试 |
| 502/503 | 服务不可用 | 稍后重试 |

## 业务错误码

### 通用错误

| 错误码 | 说明 | 解决方案 |
|-------|------|---------|
| `PARAM_ERROR` | 参数错误 | 根据错误详情检查参数 |
| `SIGN_ERROR` | 签名错误 | 检查签名算法和密钥 |
| `SYSTEM_ERROR` | 系统错误 | 稍后重试 |
| `FREQUENCY_LIMITED` | 频率限制 | 降低请求频率 |

### 下单错误

| 错误码 | 说明 | 解决方案 |
|-------|------|---------|
| `OUT_TRADE_NO_USED` | 商户订单号重复 | 使用新的订单号 |
| `APPID_MCHID_NOT_MATCH` | AppID 和商户号不匹配 | 检查 AppID 和商户号绑定关系 |
| `MCH_NOT_EXISTS` | 商户号不存在 | 检查商户号是否正确 |
| `INVALID_REQUEST` | 无效请求 | 检查请求格式 |
| `NO_AUTH` | 无权限 | 申请相关权限 |
| `NOTENOUGH` | 余额不足 | 检查商户账户余额 |

### 查询错误

| 错误码 | 说明 | 解决方案 |
|-------|------|---------|
| `ORDERNOTEXIST` | 订单不存在 | 检查订单号是否正确 |
| `ORDER_CLOSED` | 订单已关闭 | 使用新订单号重新下单 |
| `ORDER_PAID` | 订单已支付 | 不需要重复支付 |

### 退款错误

| 错误码 | 说明 | 解决方案 |
|-------|------|---------|
| `INVALID_TRANSACTIONID` | 无效的交易 ID | 检查交易 ID 是否正确 |
| `TRADE_OVERDUE` | 订单已过退款期限 | 联系微信支付客服 |
| `REFUND_EXCEED` | 退款金额超过原订单 | 检查退款金额 |
| `NOTENOUGH` | 商户余额不足 | 充值后重试 |
| `RESOURCE_ALREADY_EXISTS` | 退款单号重复 | 使用新的退款单号 |

## 错误处理示例

### 基础错误处理

```typescript
try {
  const payment = await wechat.native.create({
    out_trade_no: 'order-123',
    description: '商品描述',
    amount: 99.00
  });
} catch (error: any) {
  console.error('错误码:', error.code);
  console.error('错误信息:', error.message);
  console.error('错误详情:', error.detail);
  
  // 根据错误码处理
  handlePaymentError(error);
}
```

### 完整错误处理

```typescript
async function createPaymentWithRetry(params: any, maxRetries = 3) {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await wechat.native.create(params);
    } catch (error: any) {
      lastError = error;
      
      switch (error.code) {
        case 'OUT_TRADE_NO_USED':
          // 订单号重复，使用新订单号
          params.out_trade_no = generateNewOrderNo();
          continue;
          
        case 'SYSTEM_ERROR':
        case 'FREQUENCY_LIMITED':
          // 系统错误或频率限制，等待后重试
          await sleep(1000 * (i + 1));
          continue;
          
        case 'SIGN_ERROR':
        case 'PARAM_ERROR':
        case 'APPID_MCHID_NOT_MATCH':
          // 配置错误，不重试
          throw error;
          
        default:
          // 未知错误，记录后抛出
          console.error('未知错误:', error);
          throw error;
      }
    }
  }
  
  throw lastError;
}
```

### 退款错误处理

```typescript
async function safeRefund(params: RefundParams) {
  try {
    return await wechat.native.refund(params);
  } catch (error: any) {
    switch (error.code) {
      case 'RESOURCE_ALREADY_EXISTS':
        // 退款单已存在，查询退款状态
        return await wechat.native.queryRefund({ 
          out_refund_no: params.out_refund_no 
        });
        
      case 'INVALID_TRANSACTIONID':
        throw new Error('订单不存在或未支付');
        
      case 'TRADE_OVERDUE':
        throw new Error('订单已超过退款期限（1年）');
        
      case 'REFUND_EXCEED':
        throw new Error('退款金额超过可退金额');
        
      case 'NOTENOUGH':
        throw new Error('商户余额不足，请充值后重试');
        
      default:
        throw error;
    }
  }
}
```

## 日志和监控

### 记录错误日志

```typescript
function logPaymentError(error: any, context: any) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    code: error.code,
    message: error.message,
    detail: error.detail,
    context: {
      out_trade_no: context.out_trade_no,
      amount: context.amount
    }
  };
  
  // 发送到日志系统
  logger.error('支付错误', logEntry);
  
  // 发送告警（针对关键错误）
  if (['SIGN_ERROR', 'APPID_MCHID_NOT_MATCH'].includes(error.code)) {
    alertService.send('支付配置错误', logEntry);
  }
}
```

### 监控指标

建议监控以下指标：

1. **错误率**：各错误码的发生频率
2. **成功率**：支付成功/失败比例
3. **响应时间**：API 响应延迟
4. **重试率**：需要重试的请求比例

```typescript
// 使用 Prometheus 风格的指标
const paymentErrors = new Counter({
  name: 'wechatpay_errors_total',
  help: '微信支付错误计数',
  labelNames: ['code', 'operation']
});

// 记录错误
paymentErrors.inc({ code: error.code, operation: 'create' });
```

## 常见问题

### Q: 为什么总是返回 SIGN_ERROR？

检查以下几点：
1. API 密钥是否正确（32 位字符）
2. 私钥是否与证书匹配
3. 系统时间是否准确（误差不超过 5 分钟）
4. 请求体是否被修改

### Q: 订单号重复怎么办？

每次创建订单使用唯一的订单号：

```typescript
function generateOrderNo(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `order_${timestamp}_${random}`;
}
```

### Q: 频率限制如何处理？

1. 实现请求队列和限流
2. 使用指数退避重试
3. 缓存查询结果

```typescript
const rateLimiter = new RateLimiter({
  tokensPerInterval: 100,
  interval: 'second'
});

async function rateLimitedRequest(fn: () => Promise<any>) {
  await rateLimiter.removeTokens(1);
  return fn();
}
```

## 相关链接

- [微信支付错误码文档](https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter3_1_1.shtml)
- [API 参考](api-reference.md)
- [调试模式](debug-mode.md)
