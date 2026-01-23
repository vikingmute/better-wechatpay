# 快速开始

本指南将帮助你在项目中设置和使用 Better WeChat Pay SDK。

## 前提条件

- Node.js 18+
- 微信支付商户账号
- 微信支付 API 凭证

## 安装

```bash
npm install better-wechatpay
```

## 第一步：获取微信支付凭证

1. 登录 [微信支付商户平台](https://pay.weixin.qq.com/)
2. 进入：账户中心 > API 安全
3. 获取以下信息：

   - **AppID**：你的应用 ID
   - **MchID**：你的商户号
   - **API 密钥**：API v3 密钥（32 位字符）

4. 获取证书：
   - **商户 API 证书**：从 API 安全页面下载
   - **商户 API 私钥**：与证书一起生成
   - **微信支付公钥**（可选但推荐）：从 API 安全页面获取

## 第二步：准备证书

将 PEM 证书转换为单行格式：

```bash
# 将私钥转换为单行
awk '{printf "%s\\n", $0}' apiclient_key.pem

# 将公钥（商户证书）转换为单行
awk '{printf "%s\\n", $0}' apiclient_cert.pem

# 将微信支付公钥转换为单行（如果使用新验证方式）
awk '{printf "%s\\n", $0}' wechatpay_pub_key.pem
```

## 第三步：设置环境变量

创建 `.env` 文件（不要提交此文件！）：

```bash
# 基本配置
WECHAT_PAY_APP_ID="wx1234567890abcdef"
WECHAT_PAY_MCH_ID="1234567890"
WECHAT_PAY_API_KEY="your32characterapikey123456789"

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

WECHAT_PAY_PUBLIC_KEY_ID="serial_number_from_wechat"

# 调试模式（可选）
WECHAT_PAY_DEBUG="true"
```

## 第四步：初始化 SDK

```typescript
import WeChatPay from 'better-wechatpay';

const wechat = new WeChatPay({
  config: {
    appId: process.env.WECHAT_PAY_APP_ID!,
    mchId: process.env.WECHAT_PAY_MCH_ID!,
    apiKey: process.env.WECHAT_PAY_API_KEY!,
    privateKey: process.env.WECHAT_PAY_PRIVATE_KEY!,
    publicKey: process.env.WECHAT_PAY_PUBLIC_KEY!,
    notifyUrl: 'https://your-domain.com/webhook/wechat',
    debug: process.env.WECHAT_PAY_DEBUG === 'true'
  }
});
```

## 第五步：创建你的第一笔支付

```typescript
async function createPayment() {
  try {
    const payment = await wechat.native.create({
      out_trade_no: `order-${Date.now()}`,
      description: '会员订阅',
      amount: 99.00
    });

    console.log('支付创建成功！');
    console.log('二维码链接:', payment.code_url);
    console.log('订单号:', payment.out_trade_no);

    return payment;
  } catch (error) {
    console.error('支付创建失败:', error);
    throw error;
  }
}
```

## 第六步：设置 Webhook 处理器

创建一个 webhook 端点来接收支付通知：

```typescript
import { createServer } from 'http';

const server = createServer(async (req, res) => {
  if (req.url === '/webhook/wechat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const result = await wechat.webhook.verify({
          headers: req.headers as any,
          body
        });

        if (result.success && result.eventType === 'TRANSACTION.SUCCESS') {
          const data = result.decryptedData;
          console.log('支付成功！');
          console.log('订单号:', data.out_trade_no);
          console.log('微信订单号:', data.transaction_id);
          console.log('金额:', data.amount.total);

          res.writeHead(200);
          res.end('OK');
        } else {
          res.writeHead(400);
          res.end('Invalid signature');
        }
      } catch (error) {
        console.error('Webhook 处理失败:', error);
        res.writeHead(500);
        res.end('Internal Server Error');
      }
    });
  }
});

server.listen(3000, () => {
  console.log('Webhook 服务器监听端口 3000');
});
```

## 第七步：查询订单状态

```typescript
async function checkOrderStatus(out_trade_no: string) {
  const order = await wechat.native.query({ out_trade_no });
  
  console.log('订单状态:', order.trade_state);
  console.log('微信订单号:', order.transaction_id);
  
  if (order.trade_state === 'SUCCESS') {
    console.log('支付完成！');
  } else if (order.trade_state === 'NOTPAY') {
    console.log('等待支付...');
  } else {
    console.log('支付失败或已取消');
  }
}
```

## 第八步：关闭未支付订单

```typescript
async function closeUnpaidOrder(out_trade_no: string) {
  await wechat.native.close(out_trade_no);
  console.log('订单已关闭:', out_trade_no);
}
```

## 常用模式

### 重试支付创建

```typescript
async function retryPayment(out_trade_no: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const payment = await wechat.native.create({
        out_trade_no,
        description: '会员订阅',
        amount: 99.00
      });
      return payment;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### 轮询订单状态

```typescript
async function pollOrder(out_trade_no: string, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const order = await wechat.native.query({ out_trade_no });
    
    if (order.trade_state === 'SUCCESS') return order;
    if (order.trade_state !== 'NOTPAY' && order.trade_state !== 'USERPAYING') {
      throw new Error(`支付失败: ${order.trade_state}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  throw new Error('支付超时');
}
```

## 最佳实践

1. **始终验证 Webhook 签名** - 不要处理未验证的 Webhook
2. **使用唯一的订单号** - 防止重复支付
3. **实现正确的错误处理** - 优雅处理网络错误
4. **设置监控** - 跟踪支付成功率
5. **先在沙箱测试** - 使用测试凭证后再上生产
6. **保护 Webhook 端点** - 使用 HTTPS 和身份验证
7. **记录所有支付事件** - 保持审计日志

## 下一步

- [Native 支付指南](native-payment.md) - 了解更多 Native 支付
- [API 参考](api-reference.md) - 完整 API 文档
- [安全指南](security.md) - 安全最佳实践
- [调试模式](debug-mode.md) - 调试技巧

## 故障排除

### 证书加载错误

```
Error: Failed to load certificates
```

**解决方案**：验证你的 PEM 证书是否正确：
- 没有多余的空白字符
- 正确的证书类型（私钥 vs 公钥）
- 证书未过期

### 签名验证失败

```
Invalid webhook signature
```

**解决方案**：
- 检查 API 密钥是否与微信支付平台匹配
- 验证时间戳在 5 分钟内
- 确保请求体未被修改

### 连接错误

```
Failed to connect to WeChat Pay API
```

**解决方案**：
- 检查网络连接
- 验证防火墙允许访问 `api.mch.weixin.qq.com`
- 检查微信支付 API 是否正常运行

详见 [错误码](error-codes.md) 获取更多故障排除信息。
