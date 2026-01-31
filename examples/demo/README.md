# WeChat Pay Demo Server

## 环境配置

创建 `.env` 文件（已添加到 `.gitignore`）：

```bash
# WeChat Pay 配置
WECHAT_PAY_APP_ID=wx1234567890abcdef
WECHAT_PAY_MCH_ID=1234567890
WECHAT_PAY_API_KEY=your_32_character_api_key_here

# 证书（PEM 格式，多行/单行均可）
WECHAT_PAY_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQ...
-----END PRIVATE KEY-----

WECHAT_PAY_PUBLIC_KEY=-----BEGIN CERTIFICATE-----
MIID8zCCAtugAwIBAgIQ...
-----END CERTIFICATE-----

# WeChat Pay 公钥（推荐使用，新的验证方式）
WECHAT_PAY_PAYMENT_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----
MIIEvgIBADAN...
-----END PUBLIC KEY-----

WECHAT_PAY_PUBLIC_KEY_ID=serial_number_here

# 服务器配置
PORT=3000
WEBHOOK_URL=http://localhost:3000/webhook/wechat

# 调试模式
WECHAT_PAY_DEBUG=true
```

## 证书转换（可选）

如果你的环境变量**不支持多行**，可以使用提供的脚本将 PEM 证书转换为单行格式：

```bash
# 转换私钥和证书
./convert-pem.sh apiclient_key.pem apiclient_cert.pem

# 转换私钥、证书和支付公钥
./convert-pem.sh apiclient_key.pem apiclient_cert.pem wechatpay_pub_key.pem
```

或者手动转换（使用 awk）：

```bash
# 转换私钥为单行
awk '{printf "%s\\n", $0}' apiclient_key.pem

# 转换商户公钥为单行
awk '{printf "%s\\n", $0}' apiclient_cert.pem

# 转换微信支付公钥为单行
awk '{printf "%s\\n", $0}' wechatpay_pub_key.pem
```

然后复制输出的内容到 `.env` 文件对应的变量中。

如果你的环境变量支持多行（例如本地 `.env`），可以直接拷贝证书内容，无需转换。

## 启动服务器

### 方法 1: 使用 start 脚本（推荐）

```bash
npm npm run dev
```

### 方法 2: 直接运行

```bash
npx tsx examples/server.ts
```

### 方法 3: 开发模式（支持热重载）

```bash
npx tsx watch tests/e2e/server.ts
```

## 使用流程

### 1. 启动服务器

```bash
npm npm run dev
```

服务器会启动在 `http://localhost:3000`

### 2. 访问测试页面

在浏览器打开: `http://localhost:3000`

### 3. 创建测试订单

- 输入测试金额（例如：0.01 元）
- 输入商品描述
- 点击"创建支付"

### 4. 扫码支付

- 使用微信扫描生成的二维码
- 在微信中完成支付
- 等待页面自动刷新

### 5. 查看支付结果

- 订单状态会更新为 "PAID"
- 可以看到支付金额、交易时间等信息

## 功能特性

### ✅ 已实现

- **创建支付**: 生成 Native 二维码支付链接
- **查询订单**: 实时查询订单状态
- **关闭订单**: 关闭未支付的订单
- **Webhook 处理**: 自动接收并处理支付结果通知
- **订单管理**: 内存存储，展示所有订单
- **状态轮询**: 自动刷新支付结果
- **日志记录**: 详细的控制台日志

### 🎯 测试场景

1. **正常支付流程**
   - 创建订单 → 扫码支付 → 支付成功

2. **订单查询**
   - 创建订单后查询状态
   - 支付后查询结果

3. **关闭订单**
   - 创建订单后关闭
   - 关闭后再支付（应该失败）

4. **Webhook 验证**
   - 接收微信支付通知
   - 验证签名
   - 解密数据

## API 端点

### 前端页面

| 端点 | 方法 | 描述 |
|------|------|------|
| `/` | GET | 主页（订单列表） |
| `/order/:id` | GET | 订单详情页 |

### API 接口

| 端点 | 方法 | 描述 |
|------|------|------|
| `/create` | GET | 创建支付订单 |
| `/query/:id` | GET | 查询订单状态 |
| `/close/:id` | POST | 关闭订单 |
| `/webhook/wechat` | POST | WeChat Pay Webhook |

### 响应格式

**创建支付** - 重定向到订单详情页

**查询订单**
```json
{
  "transaction_id": "4200001234567890",
  "out_trade_no": "order_1234567890_abc123",
  "trade_state": "SUCCESS",
  "trade_state_desc": "支付成功",
  "bank_type": "CMB",
  "success_time": "2025-01-05T14:30:00+08:00",
  "amount": {
    "total": 100,
    "currency": "CNY"
  }
}
```

**关闭订单**
```json
{
  "success": true
}
```

## 调试

### 启用调试模式

```bash
# 在 .env 文件中
WECHAT_PAY_DEBUG=true
```

调试模式会输出：
- 请求详情（URL、方法、头部、请求体）
- 响应详情（状态码、头部、响应体）
- 签名验证结果
- 错误详情

### 查看日志

所有操作都会输出到控制台：

```
📝 创建支付: 测试商品, 金额: ¥0.01
✅ 支付创建成功: order_1704489600000_abc123
   二维码URL: weixin://wxpay/bizpayurl?pr=...

📨 收到 Webhook
✅ Webhook 验证成功: TRANSACTION.SUCCESS
💰 支付成功:
   订单号: order_1704489600000_abc123
   交易号: 4200001234567890
   金额: ¥0.01
✅ 订单状态已更新: order_1704489600000_abc123 → paid
```

## 常见问题

### Q1: 如何获取测试证书？

A: 
1. 登录 [微信支付商户平台](https://pay.weixin.qq.com/)
2. 进入"账户中心" → "API安全"
3. 下载商户 API 证书
4. 在"API安全"中获取微信支付公钥
5. 在"API安全"中获取微信支付公钥 ID

### Q2: 为什么支付后页面不刷新？

A: 
1. 检查 Webhook URL 是否可从外网访问
2. 确认防火墙/安全组规则
3. 查看控制台是否收到 Webhook

### Q3: 如何测试支付而不真实扣费？

A: 使用微信支付沙箱环境：

```bash
# 在 .env 中修改 baseUrl
WECHAT_PAY_BASE_URL=https://api.mch.weixin.qq.com/sandboxnew
```

### Q4: 证书加载失败怎么办？

A: 
1. 确认 PEM 格式正确（包含 BEGIN/END 标记）
2. 确保证书内容完整（多行/单行均可；如果平台不支持多行再转换）
3. 检查证书是否过期
4. 验证私钥和证书是否匹配

### Q5: 端口被占用怎么办？

A: 修改 .env 文件中的端口号：

```bash
PORT=8080
```

## 注意事项

⚠️ **安全提示**:
- 不要将 `.env` 文件提交到版本控制
- 测试服务器仅用于开发测试，不要在生产环境使用
- 不要暴露测试服务器到公网（除非你有安全措施）
- 定期更换测试证书和密钥

⚠️ **限制**:
- 订单数据存储在内存中，服务器重启后会丢失
- 单用户测试，无并发控制
- 无持久化存储
- 无用户认证

## 扩展建议

如果想将测试服务器升级为生产环境：

1. **添加数据库**
   - 使用 PostgreSQL/MySQL 存储订单
   - 实现订单持久化

2. **添加用户认证**
   - 实现登录/注册
   - JWT Token 验证

3. **添加更多支付方式**
   - JSAPI 支付
   - H5 支付
   - 小程序支付

4. **添加退款功能**
   - 退款接口
   - 退款查询

5. **添加管理后台**
   - 订单管理
   - 数据统计
   - 财务对账

## 相关文档

- [Getting Started](../../docs/getting-started.md)
- [Native Payment](../../docs/native-payment.md)
- [API Reference](../../docs/api-reference.md)
- [Debug Mode](../../docs/debug-mode.md)
- [Security](../../docs/security.md)
