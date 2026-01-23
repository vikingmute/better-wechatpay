# 安全指南

本指南介绍使用 Better WeChatPay SDK 时的安全最佳实践。

## 证书安全

### 保护私钥

- ❌ **永远不要**将私钥提交到版本控制系统
- ❌ **永远不要**在客户端代码中包含私钥
- ❌ **永远不要**在日志中输出私钥内容
- ✅ 使用环境变量存储私钥
- ✅ 在生产环境使用密钥管理服务（如 AWS Secrets Manager、Azure Key Vault）

```bash
# .gitignore
*.pem
*.key
.env
.env.local
```

### 证书轮换

定期轮换证书以降低泄露风险：

1. 生成新证书
2. 在微信支付商户平台上传新证书
3. 更新应用配置
4. 撤销旧证书

## API 密钥安全

### 密钥管理

```typescript
// ✅ 正确：使用环境变量
const wechat = new WeChatPay({
  config: {
    apiKey: process.env.WECHAT_PAY_API_KEY!,
    // ...
  }
});

// ❌ 错误：硬编码密钥
const wechat = new WeChatPay({
  config: {
    apiKey: 'v3_api_key_12345678901234567890',  // 不要这样做！
    // ...
  }
});
```

### 权限控制

- 限制 API 密钥的访问权限
- 使用最小权限原则
- 定期审计密钥使用情况

## Webhook 安全

### 始终验证签名

```typescript
app.post('/webhook/wechat', async (req, res) => {
  const result = await wechat.webhook.verify({
    headers: req.headers,
    body: req.rawBody  // 使用原始请求体
  });

  if (!result.success) {
    console.error('Webhook 签名验证失败');
    return res.status(400).send('Invalid signature');
  }

  // 处理验证通过的 webhook...
});
```

### 防止重放攻击

检查 Webhook 时间戳，拒绝过旧的请求：

```typescript
const timestamp = parseInt(req.headers['wechatpay-timestamp'] as string);
const now = Math.floor(Date.now() / 1000);

// 拒绝超过 5 分钟的请求
if (Math.abs(now - timestamp) > 300) {
  console.error('Webhook 请求已过期');
  return res.status(400).send('Request expired');
}
```

### 幂等性处理

使用唯一标识符防止重复处理：

```typescript
app.post('/webhook/wechat', async (req, res) => {
  const result = await wechat.webhook.verify({ headers: req.headers, body: req.rawBody });
  
  if (result.success) {
    const { out_trade_no, transaction_id } = result.decryptedData;
    
    // 检查是否已处理
    const exists = await db.findPayment(transaction_id);
    if (exists) {
      console.log('订单已处理，跳过');
      return res.status(200).send('OK');
    }
    
    // 处理新订单...
    await db.savePayment(transaction_id, result.decryptedData);
  }
  
  res.status(200).send('OK');
});
```

## HTTPS 安全

### 强制使用 HTTPS

微信支付要求 Webhook URL 必须使用 HTTPS：

```typescript
const wechat = new WeChatPay({
  config: {
    // ...
    notifyUrl: 'https://your-domain.com/webhook/wechat'  // 必须是 HTTPS
  }
});
```

### SSL/TLS 配置

- 使用 TLS 1.2 或更高版本
- 使用强加密套件
- 定期更新 SSL 证书

## 输入验证

### 验证订单参数

```typescript
function validatePaymentParams(params: any) {
  // 验证订单号格式
  if (!/^[a-zA-Z0-9_-]{6,32}$/.test(params.out_trade_no)) {
    throw new Error('无效的订单号格式');
  }
  
  // 验证金额
  if (typeof params.amount !== 'number' || params.amount <= 0) {
    throw new Error('无效的金额');
  }
  
  // 验证金额精度（最多两位小数）
  if (Math.round(params.amount * 100) !== params.amount * 100) {
    throw new Error('金额精度不正确');
  }
  
  // 验证描述长度
  if (!params.description || params.description.length > 127) {
    throw new Error('商品描述无效或过长');
  }
}
```

### 防止 SQL 注入

使用参数化查询：

```typescript
// ✅ 正确：参数化查询
const order = await db.query(
  'SELECT * FROM orders WHERE out_trade_no = $1',
  [out_trade_no]
);

// ❌ 错误：字符串拼接
const order = await db.query(
  `SELECT * FROM orders WHERE out_trade_no = '${out_trade_no}'`  // 危险！
);
```

## 日志安全

### 敏感信息脱敏

```typescript
function sanitizeLog(data: any) {
  const sanitized = { ...data };
  
  // 脱敏敏感字段
  if (sanitized.openid) {
    sanitized.openid = sanitized.openid.slice(0, 4) + '****';
  }
  if (sanitized.transaction_id) {
    sanitized.transaction_id = sanitized.transaction_id.slice(0, 8) + '****';
  }
  
  return sanitized;
}

// 使用脱敏日志
console.log('支付成功:', sanitizeLog(result.decryptedData));
```

### 避免日志泄露

```typescript
// ❌ 错误：记录完整响应
console.log('API 响应:', JSON.stringify(response));

// ✅ 正确：只记录必要信息
console.log('支付创建成功:', {
  out_trade_no: response.out_trade_no,
  status: 'success'
});
```

## 错误处理

### 不要暴露敏感错误信息

```typescript
app.post('/api/pay', async (req, res) => {
  try {
    const payment = await wechat.native.create(req.body);
    res.json({ success: true, code_url: payment.code_url });
  } catch (error: any) {
    // 记录详细错误（内部使用）
    console.error('支付创建失败:', error);
    
    // 返回通用错误信息（给用户）
    res.status(500).json({ 
      success: false, 
      message: '支付创建失败，请稍后重试' 
    });
  }
});
```

## 生产环境清单

部署到生产环境前，确保：

- [ ] 所有证书和密钥通过环境变量或密钥管理服务配置
- [ ] 已禁用调试模式（`debug: false`）
- [ ] Webhook URL 使用 HTTPS
- [ ] 已实现 Webhook 签名验证
- [ ] 已实现幂等性处理
- [ ] 敏感信息已从日志中脱敏
- [ ] 已配置适当的错误处理
- [ ] 已设置速率限制
- [ ] 已配置监控和告警

## 相关链接

- [微信支付安全规范](https://pay.weixin.qq.com/wiki/doc/apiv3/wechatpay/wechatpay-security.shtml)
- [API 参考](api-reference.md)
- [错误码](error-codes.md)
