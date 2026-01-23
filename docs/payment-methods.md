# 支付方式

Better WeChat Pay SDK 支持微信支付的所有主要支付方式。

## 支付方式对比

| 支付方式 | 适用场景 | 返回值 | 特殊要求 |
|---------|---------|-------|---------|
| **Native** | PC 网站、线下扫码 | `code_url` | 无 |
| **APP** | 移动应用 | `prepay_id` | 需要 APP SDK 调起 |
| **JSAPI** | 微信内网页 | `prepay_id` | 需要用户 `openid` |
| **小程序** | 微信小程序 | `prepay_id` | 需要用户 `openid` |
| **H5** | 手机浏览器 | `h5_url` | 需要 `h5_info` |

## Native 支付

### 场景
用户扫描商户生成的二维码完成支付。

### 使用方法

```typescript
const payment = await wechat.native.create({
  out_trade_no: 'order-123',
  description: '商品描述',
  amount: 99.00
});

// 将 code_url 生成二维码展示给用户
console.log('二维码链接:', payment.code_url);
```

### 前端展示

```typescript
import QRCode from 'qrcode';

// 生成二维码图片
const qrCodeUrl = await QRCode.toDataURL(payment.code_url);
// 在页面中显示: <img src={qrCodeUrl} />
```

---

## APP 支付

### 场景
用户在移动应用中完成支付。

### 使用方法

```typescript
const payment = await wechat.app.create({
  out_trade_no: 'order-123',
  description: '商品描述',
  amount: 99.00
});

// 返回 prepay_id，需要在 APP 中调起支付
console.log('预支付 ID:', payment.prepay_id);
```

### 客户端调起

返回 `prepay_id` 后，需要在服务端生成调起支付所需的参数，然后传递给 APP：

```typescript
// 服务端生成调起参数
const appPayParams = {
  appid: config.appId,
  partnerid: config.mchId,
  prepayid: payment.prepay_id,
  package: 'Sign=WXPay',
  noncestr: generateNonce(),
  timestamp: Math.floor(Date.now() / 1000).toString()
};

// 生成签名
appPayParams.sign = generateSign(appPayParams);

// 返回给 APP 客户端调起支付
```

---

## JSAPI 支付

### 场景
用户在微信内置浏览器中完成支付。

### 使用方法

```typescript
const payment = await wechat.jsapi.create({
  out_trade_no: 'order-123',
  description: '商品描述',
  amount: 99.00,
  openid: 'user_openid'  // 必填：用户在该公众号/小程序下的唯一标识
});

console.log('预支付 ID:', payment.prepay_id);
```

### 获取用户 OpenID

在调用 JSAPI 支付前，需要先获取用户的 OpenID：

```typescript
// 1. 引导用户授权
const authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?` +
  `appid=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}` +
  `&response_type=code&scope=snsapi_base#wechat_redirect`;

// 2. 用户授权后，用 code 换取 openid
const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?` +
  `appid=${appId}&secret=${appSecret}&code=${code}&grant_type=authorization_code`;

const response = await fetch(tokenUrl);
const data = await response.json();
const openid = data.openid;
```

### 前端调起支付

```javascript
// 在微信内置浏览器中调起支付
WeixinJSBridge.invoke('getBrandWCPayRequest', {
  appId: appId,
  timeStamp: timestamp,
  nonceStr: nonceStr,
  package: `prepay_id=${prepayId}`,
  signType: 'RSA',
  paySign: paySign
}, function(res) {
  if (res.err_msg === 'get_brand_wcpay_request:ok') {
    // 支付成功
  }
});
```

---

## 小程序支付

### 场景
用户在微信小程序中完成支付。

### 使用方法

与 JSAPI 相同，使用 `wechat.jsapi.create()`：

```typescript
const payment = await wechat.jsapi.create({
  out_trade_no: 'order-123',
  description: '商品描述',
  amount: 99.00,
  openid: 'user_openid'  // 小程序用户的 openid
});
```

### 小程序端调起支付

```javascript
// 小程序端调用
wx.requestPayment({
  timeStamp: timestamp,
  nonceStr: nonceStr,
  package: `prepay_id=${prepayId}`,
  signType: 'RSA',
  paySign: paySign,
  success(res) {
    console.log('支付成功');
  },
  fail(err) {
    console.log('支付失败', err);
  }
});
```

---

## H5 支付

### 场景
用户在手机浏览器（非微信）中完成支付。

### 使用方法

```typescript
const payment = await wechat.h5.create({
  out_trade_no: 'order-123',
  description: '商品描述',
  amount: 99.00,
  payer_client_ip: '1.2.3.4',  // 用户真实 IP（必填）
  h5_info: {
    type: 'Wap',           // Wap / iOS / Android
    app_name: '我的网站',   // 应用名称
    app_url: 'https://example.com'  // 应用 URL
  }
});

// 返回 H5 支付链接
console.log('H5 支付链接:', payment.h5_url);
```

### 跳转支付

```typescript
// 直接跳转到 h5_url
window.location.href = payment.h5_url;

// 或者在新窗口打开（不推荐）
// window.open(payment.h5_url);
```

### H5 支付注意事项

1. **域名必须在商户平台配置**：需要在微信支付商户平台配置 H5 支付域名
2. **获取真实用户 IP**：必须传递用户的真实 IP 地址
3. **支付完成后回调**：支付完成后微信会自动跳回商户页面

```typescript
// 在 h5_url 后添加 redirect_url 参数
const redirectUrl = encodeURIComponent('https://example.com/payment/result');
const finalUrl = `${payment.h5_url}&redirect_url=${redirectUrl}`;
```

---

## 通用操作

所有支付方式都支持以下操作：

### 查询订单

```typescript
// 适用于所有支付方式
const order = await wechat.native.query({ out_trade_no: 'order-123' });
// 或
const order = await wechat.app.query({ out_trade_no: 'order-123' });
// 或
const order = await wechat.jsapi.query({ out_trade_no: 'order-123' });
// 或
const order = await wechat.h5.query({ out_trade_no: 'order-123' });
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
  total: 99.00
});
```

---

## 选择合适的支付方式

```
用户在哪里支付？
├── PC 网站 → Native 支付
├── 移动 APP → APP 支付
├── 微信内
│   ├── 公众号网页 → JSAPI 支付
│   └── 小程序 → 小程序支付
└── 手机浏览器（非微信）→ H5 支付
```

## 相关链接

- [Native 支付详解](native-payment.md)
- [API 参考](api-reference.md)
- [微信支付官方文档](https://pay.weixin.qq.com/wiki/doc/apiv3/index.shtml)
