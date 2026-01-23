# Better WeChat Pay SDK - Demo Server Testing Guide

## 概览

本指南介绍如何使用 Demo Server进行完整的端到端支付测试。

## 文件说明

```
examples/
├── server.ts           # 测试服务器主文件
├── start.mjs          # 启动脚本
├── README.md          # 完整文档
├── QUICKSTART.md      # 快速开始（5分钟）
└── this file          # 本指南
```

## 核心功能

### 1. 测试服务器 (server.ts)

**功能：**
- 创建 Native 支付订单
- 查询订单状态
- 关闭未支付订单
- 处理 Webhook 回调
- 生成和显示二维码
- 管理订单状态

**架构：**
```
User Browser
    ↓
HTTP Server (Node.js)
    ↓
WeChat Pay SDK
    ↓
WeChat Pay API
    ↓
Webhook ← WeChat Pay Server
```

### 2. 启动脚本 (start.mjs)

**功能：**
- 启动 TypeScript 服务器
- 处理信号中断（Ctrl+C）
- 管理子进程

**使用：**
```bash
npm run dev           # 启动服务器
npm run dev:dev       # 开发模式（热重载）
```

## 测试流程

### 完整的支付流程

```
1. 用户访问测试页面
   ↓
2. 用户输入金额和描述
   ↓
3. 点击"创建支付"
   ↓
4. 服务器调用 wechat.native.create()
   ↓
5. 生成二维码并显示
   ↓
6. 用户扫码支付
   ↓
7. 微信支付服务器回调 Webhook
   ↓
8. 服务器验证签名并解密
   ↓
9. 更新订单状态为 PAID
   ↓
10. 页面自动刷新显示支付成功
```

### 详细步骤说明

#### 步骤 1: 创建订单

**前端请求：**
```javascript
GET /create?amount=0.01&description=测试商品
```

**服务器处理：**
```typescript
const orderId = generateOrderId();
const payment = await wechat.native.create({
  orderId,
  description,
  amount: Math.round(amount * 100)
});

const qrCode = await QRCode.toDataURL(payment.codeUrl);
```

**WeChat Pay API 请求：**
```
POST https://api.mch.weixin.qq.com/v3/pay/transactions/native

Headers:
  Authorization: WECHATPAY2-SHA256-RSA2048 ...
  Content-Type: application/json

Body:
{
  "appid": "wx1234567890",
  "mchid": "1234567890",
  "description": "测试商品",
  "out_trade_no": "order_1704489600000_abc123",
  "amount": { "total": 100, "currency": "CNY" },
  "scene_info": { "payer_client_ip": "127.0.0.1" }
}
```

**WeChat Pay API 响应：**
```json
{
  "code_url": "weixin://wxpay/bizpayurl?pr=XXXXX"
}
```

#### 步骤 2: 显示二维码

**生成二维码：**
```typescript
const qrCode = await QRCode.toDataURL(payment.codeUrl);
// 返回 Base64 编码的图片
```

**HTML 显示：**
```html
<img src="data:image/png;base64,iVBORw0KGgoAAAANS..." />
```

#### 步骤 3: 用户扫码支付

**微信支付流程：**
1. 用户扫描二维码
2. 微信识别 `weixin://` 协议
3. 打开支付页面
4. 用户输入密码
5. 微信调用商户 API 完成支付

#### 步骤 4: Webhook 回调

**微信支付请求：**
```http
POST /webhook/wechat HTTP/1.1
Host: your-domain.com
Content-Type: application/json
Wechatpay-Signature: sha256=...
Wechatpay-Timestamp: 1704489600
Wechatpay-Nonce: abc123
Wechatpay-Serial: serial123

{
  "id": "EV-20250105123456-1234567890",
  "create_time": "2025-01-05T14:30:00+08:00",
  "event_type": "TRANSACTION.SUCCESS",
  "resource_type": "encrypt-resource",
  "resource": {
    "algorithm": "AEAD_AES_256_GCM",
    "ciphertext": "...",
    "nonce": "...",
    "associated_data": "transaction"
  }
}
```

**服务器处理：**
```typescript
const result = await wechat.webhook.verify({
  headers: req.headers,
  body
});

if (result.success) {
  const data = result.decryptedData;
  // data.out_trade_no - 订单号
  // data.transaction_id - 交易号
  // data.amount.total - 金额
}
```

**验证过程：**
1. 验证签名（timestamp + nonce + body）
2. 解密 ciphertext（使用 API Key）
3. 解析订单信息
4. 更新本地订单状态

#### 步骤 5: 页面自动刷新

**轮询机制：**
```javascript
// 每 3 秒查询一次
setInterval(async () => {
  const response = await fetch('/query/${orderId}');
  const result = await response.json();
  if (result.tradeState === 'SUCCESS') {
    window.location.reload();
  }
}, 3000);
```

## API 详细说明

### 创建支付

**端点：** `GET /create`

**参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| amount | number | 是 | 金额（元）|
| description | string | 是 | 商品描述 |

**响应：** 302 重定向到 `/order/:id`

**示例：**
```bash
curl "http://localhost:3000/create?amount=0.01&description=测试商品"
```

### 查询订单

**端点：** `GET /query/:id`

**响应：**
```json
{
  "transactionId": "4200001234567890",
  "orderId": "order_1234567890_abc123",
  "tradeState": "SUCCESS",
  "tradeStateDesc": "支付成功",
  "bankType": "CMB",
  "successTime": "2025-01-05T14:30:00+08:00",
  "amount": {
    "total": 100,
    "currency": "CNY"
  }
}
```

### 关闭订单

**端点：** `POST /close/:id`

**响应：**
```json
{
  "success": true
}
```

### Webhook

**端点：** `POST /webhook/wechat`

**成功响应：**
```http
HTTP/1.1 200 OK
OK
```

**失败响应：**
```http
HTTP/1.1 400 Bad Request
Invalid signature
```

## 订单状态

| 状态 | 说明 | 可操作 |
|------|------|--------|
| pending | 待支付 | 查询、关闭 |
| paid | 已支付 | 仅查询 |
| failed | 支付失败 | 仅查询 |
| closed | 已关闭 | 仅查询 |

## 测试场景

### 场景 1: 正常支付

```bash
# 1. 创建订单
curl "http://localhost:3000/create?amount=0.01&description=测试"

# 2. 扫码支付
# （手动操作）

# 3. 查询订单
curl http://localhost:3000/query/order_1234567890_abc123

# 预期响应: tradeState = "SUCCESS"
```

### 场景 2: 订单超时

```bash
# 1. 创建订单
curl "http://localhost:3000/create?amount=0.01&description=测试"

# 2. 等待 2 小时不支付
# WeChat Pay 自动关闭订单

# 3. 查询订单
curl http://localhost:3000/query/order_1234567890_abc123

# 预期响应: tradeState = "CLOSED"
```

### 场景 3: 手动关闭订单

```bash
# 1. 创建订单
curl "http://localhost:3000/create?amount=0.01&description=测试"

# 2. 立即关闭订单
curl -X POST http://localhost:3000/close/order_1234567890_abc123

# 3. 尝试支付（应该失败）
# （手动扫码测试）
```

### 场景 4: 重复创建订单

```bash
# 1. 创建订单
curl "http://localhost:3000/create?amount=0.01&description=测试"

# 2. 使用相同订单号再次创建
# SDK 应该返回错误: ORDERPAID 或 OUT_TRADE_NO_USED
```

## 调试技巧

### 查看所有 HTTP 请求

启用调试模式：
```bash
WECHAT_PAY_DEBUG=true npm run dev
```

输出示例：
```
[WeChatPay] Request: {
  url: 'https://api.mch.weixin.qq.com/v3/pay/transactions/native',
  method: 'POST',
  headers: { ... },
  body: { ... }
}

[WeChatPay] Response: {
  status: 200,
  headers: { ... },
  body: { code_url: '...' }
}
```

### 查看 Webhook 详情

支付完成后查看控制台：
```
📨 收到 Webhook
✅ Webhook 验证成功: TRANSACTION.SUCCESS
💰 支付成功:
   订单号: order_1704489600000_abc123
   交易号: 4200001234567890
   金额: ¥0.01
✅ 订单状态已更新: order_1704489600000_abc123 → paid
```

### 使用浏览器开发工具

打开浏览器控制台（F12），查看网络请求：
- `/create` - 创建订单
- `/query/:id` - 查询订单
- `/close/:id` - 关闭订单
- `/webhook/wechat` - Webhook 回调

## 性能测试

### 并发创建订单

使用 Apache Bench：
```bash
ab -n 100 -c 10 "http://localhost:3000/create?amount=0.01&description=并发测试"
```

### 压力测试

使用 autocannon：
```bash
npm install -g autocannon
autocannon -c 10 -d 30 "http://localhost:3000/"
```

## 监控和日志

### 实时监控

查看所有日志：
```bash
npm run dev 2>&1 | tee server.log
```

### 筛选特定日志

```bash
# 只看支付成功
grep "支付成功" server.log

# 只看错误
grep "ERROR" server.log

# 只看 Webhook
grep "Webhook" server.log
```

## 故障排除

### 问题：Webhook 不触发

**检查清单：**
1. Webhook URL 可从外网访问
2. 防火墙/安全组开放端口
3. SSL 证书有效
4. 微信支付服务器可以访问

**测试 Webhook：**
```bash
curl -X POST http://your-domain.com/webhook/wechat \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### 问题：签名验证失败

**常见原因：**
1. API Key 不正确
2. 证书已过期
3. 系统时间不准确
4. 请求体被修改

**验证方法：**
```bash
# 检查系统时间
date

# 对比网络时间
ntpdate -q pool.ntp.org
```

### 问题：二维码无效

**检查步骤：**
1. 二维码 URL 格式正确（`weixin://wxpay/bizpayurl?pr=...`）
2. 商户号和 AppID 匹配
3. API 请求成功（返回 200）
4. 订单号唯一

## 扩展测试

### 添加自动化测试

使用 Playwright 或 Cypress：
```typescript
import { test, expect } from '@playwright/test';

test('complete payment flow', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  await page.fill('#amount', '0.01');
  await page.fill('#description', '自动化测试');
  await page.click('button:has-text("创建支付")');
  
  // 等待二维码生成
  await expect(page.locator('img[alt="QR Code"]')).toBeVisible();
  
  // 模拟支付完成（需要真实支付）
  // ...
});
```

### 集成 CI/CD

```yaml
name: E2E Tests

on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run dev &
      - run: npm run test:integration
```

## 最佳实践

1. **每次测试前清理订单**
2. **使用不同的订单号**
3. **保持测试金额小额**
4. **定期检查日志文件**
5. **使用版本控制**
6. **测试失败时记录详细信息**
7. **定期更新测试证书**

## 相关资源

- [WeChat Pay API 文档](https://pay.weixin.qq.com/doc/v3/merchant/4012365342)
- [SDK 文档](../../docs/)
- [快速开始](./QUICKSTART.md)
