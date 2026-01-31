# 微信支付原理详解

本文介绍微信支付 API v3 的核心概念和工作原理，帮助你理解 SDK 背后的机制。

## 核心流程概览

微信支付主要分为两大部分：

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            微信支付核心流程                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐                                      ┌─────────────┐      │
│   │             │  ① 发送请求（签名）                   │             │      │
│   │   商户服务器  │ ────────────────────────────────→  │  微信支付平台  │      │
│   │             │                                      │             │      │
│   │             │  ② 接收回调（验签 + 解密）            │             │      │
│   │             │ ←────────────────────────────────   │             │      │
│   └─────────────┘                                      └─────────────┘      │
│                                                                             │
│   使用【商户私钥】签名                          使用【平台证书/公钥】验签        │
│                                               使用【APIv3密钥】解密           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**官方流程图**：[微信支付业务流程图](https://pay.weixin.qq.com/doc/v3/merchant/4012365342)

## 证书和密钥体系

微信支付涉及多种证书和密钥，初学者容易混淆。以下是详细说明：

### 1. 商户 API 证书和私钥

> 📚 官方文档：[什么是商户API证书？如何获取？](https://pay.weixin.qq.com/doc/v3/merchant/4013053053)

**商户 API 证书**（`apiclient_cert.pem`）是用来证实商户身份的。证书中包含：
- 商户号
- 证书序列号
- 证书有效期
- 公钥信息

由证书授权机构（CA）签发，以防证书被伪造或篡改。

**商户 API 私钥**（`apiclient_key.pem`）在申请商户 API 证书时一起生成。用于对 API 请求进行签名，证明请求是由你发送的。

```
┌─────────────────────────────────────────────────────┐
│              商户 API 证书 + 私钥                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│   apiclient_cert.pem (证书/公钥)                    │
│   ├── 商户号                                        │
│   ├── 证书序列号                                     │
│   └── 有效期：5年                                    │
│                                                     │
│   apiclient_key.pem (私钥)                          │
│   └── 用于签名请求                                   │
│                                                     │
│   🔑 这两个是配对的，到期后需要重新申请               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

在 SDK 中的配置：
```typescript
const wechat = new WeChatPay({
  config: {
    privateKey: process.env.WECHAT_PAY_PRIVATE_KEY,  // 商户私钥
    publicKey: process.env.WECHAT_PAY_PUBLIC_KEY,    // 商户证书
  }
});
```

### 2. 证书序列号

每个证书都有一个由 CA 颁发的唯一编号，即证书序列号。

**获取方式**：账户中心 → API安全 → 商户API证书 → 管理证书

在 SDK 中，我们通过 `getSerialNumber()` 方法从证书中自动提取，**无需手动配置**。

### 3. APIv3 密钥

> 📚 官方文档：[什么是APIv3密钥？如何设置？](https://pay.weixin.qq.com/doc/v3/merchant/4013053267)

APIv3 密钥是一个 32 字符的密钥，用于**解密回调通知中的敏感数据**。

```
┌─────────────────────────────────────────────────────┐
│                    APIv3 密钥                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│   长度：32 个字符                                    │
│   字符：支持数字和大小写字母组合                       │
│   用途：解密回调报文（AES-256-GCM）                   │
│                                                     │
│   设置位置：商户平台 → API安全 → 设置APIv3密钥        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

在 SDK 中的配置：
```typescript
const wechat = new WeChatPay({
  config: {
    apiKey: process.env.WECHAT_PAY_API_KEY,  // APIv3密钥（32位）
  }
});
```

## 发送请求：签名流程

当你调用微信支付 API 时，SDK 会自动使用**商户私钥**对请求进行签名。

### 签名算法

```
签名串 = HTTP方法 + "\n"
       + URL路径 + "\n"
       + 时间戳 + "\n"
       + 随机字符串 + "\n"
       + 请求体 + "\n"

签名 = SHA256withRSA(签名串, 商户私钥)
```

### SDK 内部实现

```typescript
// SDK 自动完成以下步骤：
// 1. 构建签名串
const signMessage = `${method}\n${url}\n${timestamp}\n${nonce}\n${body}\n`;

// 2. 使用商户私钥签名
const signature = crypto.sign('sha256', Buffer.from(signMessage), privateKey);

// 3. 添加到请求头
headers['Authorization'] = `WECHATPAY2-SHA256-RSA2048 mchid="...",nonce_str="...",signature="...",timestamp="...",serial_no="..."`;
```

## 接收回调：验签流程

微信支付在用户完成支付后，会向你的 `notify_url` 发送回调通知。SDK 需要：
1. **验证签名**：确认通知确实来自微信支付
2. **解密数据**：获取支付结果详情

### 验签方式

有两种验签方式：

#### 方式一：平台证书验签（传统方式）

> 📚 官方文档：[通过平台证书验签](https://pay.weixin.qq.com/doc/v3/merchant/4013053420)

```
┌─────────────────────────────────────────────────────┐
│               平台证书验签流程                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│   1. 调用 API 下载平台证书                           │
│      GET /v3/certificates                           │
│                                                     │
│   2. 使用 APIv3 密钥解密证书内容                     │
│                                                     │
│   3. 使用证书中的公钥验证回调签名                     │
│                                                     │
│   ⚠️ 平台证书有 5 年有效期，需要定期更新              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

SDK 会自动通过 `fetchPlatformCertificates()` 方法下载并缓存平台证书。

#### 方式二：微信支付公钥验签（推荐）

> 📚 官方文档：[通过微信支付公钥验签](https://pay.weixin.qq.com/doc/v3/merchant/4013053249)

```
┌─────────────────────────────────────────────────────┐
│             微信支付公钥验签流程（推荐）               │
├─────────────────────────────────────────────────────┤
│                                                     │
│   1. 从商户平台下载微信支付公钥                       │
│      位置：账户中心 → API安全 → 微信支付公钥           │
│                                                     │
│   2. 同时获取公钥 ID（点击下载后可看到）              │
│      格式如：PUB_KEY_ID_0000000000000024101100397...  │
│                                                     │
│   3. 配置到环境变量（公钥 + 公钥ID 必须配对使用）      │
│                                                     │
│   ✅ 无有效期限制，官方推荐方式                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**获取步骤**：

1. 登录[商户平台](https://pay.weixin.qq.com/) → 账户中心 → API安全
2. 找到「微信支付公钥」入口，点击「申请公钥」
3. 下载公钥文件（PEM 格式）
4. **重要**：下载页面会显示「公钥 ID」，格式如 `PUB_KEY_ID_0000000000000024101100397200000006`
5. 将公钥内容和公钥 ID **都配置到环境变量**

> ⚠️ **注意**：公钥 ID 不能从公钥内容计算出来，必须从商户平台单独获取！

在 SDK 中的配置：
```typescript
const wechat = new WeChatPay({
  config: {
    // 可选但推荐：微信支付公钥（两个必须同时配置）
    paymentPublicKey: process.env.WECHAT_PAY_PAYMENT_PUBLIC_KEY,
    publicKeyId: process.env.WECHAT_PAY_PUBLIC_KEY_ID,  // 从商户平台获取
  }
});
```

### 两种方式对比

| 特性 | 平台证书 | 微信支付公钥 |
|------|---------|-------------|
| 有效期 | 5年 | 无限期 |
| 获取方式 | API 自动下载 | 手动从商户平台下载 |
| 配置复杂度 | 自动 | 需配置环境变量 |
| 官方推荐 | 传统方式 | ✅ 推荐 |

**建议**：优先使用微信支付公钥验签，避免证书过期问题。

### 解密回调报文

> 📚 官方文档：[解密回调报文](https://pay.weixin.qq.com/doc/v3/partner/4012082320)

回调通知中的敏感数据（如支付金额、订单详情）使用 **AES-256-GCM** 加密。

```
┌─────────────────────────────────────────────────────┐
│                  解密流程                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│   加密数据结构：                                     │
│   {                                                 │
│     "resource": {                                   │
│       "algorithm": "AEAD_AES_256_GCM",              │
│       "ciphertext": "加密后的数据",                  │
│       "nonce": "随机串",                            │
│       "associated_data": "附加数据"                  │
│     }                                               │
│   }                                                 │
│                                                     │
│   解密公式：                                         │
│   明文 = AES-256-GCM-Decrypt(                       │
│     key = APIv3密钥,                                │
│     nonce = resource.nonce,                         │
│     aad = resource.associated_data,                 │
│     ciphertext = Base64Decode(resource.ciphertext)  │
│   )                                                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

SDK 中的 `decryptWebhookData()` 方法自动完成解密：

```typescript
// SDK 内部实现
const decipher = crypto.createDecipheriv(
  'aes-256-gcm',
  this.apiKey,  // APIv3密钥
  nonce
);
decipher.setAuthTag(authTag);
decipher.setAAD(Buffer.from(associatedData));
const decrypted = decipher.update(ciphertext) + decipher.final('utf8');
```

## 完整配置总结

```typescript
const wechat = new WeChatPay({
  config: {
    // === 必填 ===
    appId: 'wx...',                    // 公众号/小程序 AppID
    mchId: '1234567890',               // 商户号
    apiKey: '32位APIv3密钥',            // 用于解密回调
    privateKey: '商户私钥PEM',          // 用于签名请求
    publicKey: '商户证书PEM',           // 包含证书序列号

    // === 可选但推荐 ===
    paymentPublicKey: '微信支付公钥PEM', // 用于验签（新方式）
    publicKeyId: '公钥ID',              // 微信支付公钥的序列号

    // === 可选 ===
    notifyUrl: 'https://...',          // 默认回调地址
    debug: true,                       // 调试模式
  }
});
```

## 环境变量配置

```bash
# 基本配置
WECHAT_PAY_APP_ID="wx1234567890abcdef"
WECHAT_PAY_MCH_ID="1234567890"
WECHAT_PAY_API_KEY="your32characterapikey123456789"  # APIv3密钥

# 商户证书（配对，5年有效期）
WECHAT_PAY_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----"

WECHAT_PAY_PUBLIC_KEY="-----BEGIN CERTIFICATE-----
...
-----END CERTIFICATE-----"

# 微信支付公钥（推荐，无有效期）
# 获取位置：商户平台 → 账户中心 → API安全 → 微信支付公钥
WECHAT_PAY_PAYMENT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
...
-----END PUBLIC KEY-----"

# 公钥 ID（下载公钥时显示，必须与公钥配对使用！）
# 格式如：PUB_KEY_ID_0000000000000024101100397200000006
WECHAT_PAY_PUBLIC_KEY_ID="PUB_KEY_ID_xxxx"
```

## SDK 自动处理

使用 `better-wechatpay` SDK，以下复杂操作都是自动完成的：

| 操作 | 手动实现 | SDK |
|------|---------|-----|
| 构建签名串 | 需要 | ✅ 自动 |
| RSA 签名 | 需要 | ✅ 自动 |
| 提取证书序列号 | 需要 | ✅ 自动 |
| 下载平台证书 | 需要 | ✅ 自动 |
| 验证回调签名 | 需要 | ✅ 自动 |
| AES-GCM 解密 | 需要 | ✅ 自动 |
| 证书缓存 | 需要 | ✅ 自动 |

## 相关链接

- [微信支付 API v3 接口规则](https://pay.weixin.qq.com/doc/v3/merchant/4012365342)
- [商户 API 证书](https://pay.weixin.qq.com/doc/v3/merchant/4013053053)
- [APIv3 密钥](https://pay.weixin.qq.com/doc/v3/merchant/4013053267)
- [平台证书验签](https://pay.weixin.qq.com/doc/v3/merchant/4013053420)
- [微信支付公钥验签](https://pay.weixin.qq.com/doc/v3/merchant/4013053249)
- [下载平台证书 API](https://pay.weixin.qq.com/doc/v3/merchant/4012551764)
- [解密回调报文](https://pay.weixin.qq.com/doc/v3/partner/4012082320)
