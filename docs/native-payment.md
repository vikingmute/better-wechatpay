# Native 支付（扫码支付）

Native 支付是指商户系统生成支付二维码，用户使用微信"扫一扫"完成支付的模式。

## 适用场景

- PC 网站支付
- 线下收银台
- 自助终端机
- 任何需要扫码支付的场景

## 支付流程

```
1. 商户系统调用下单 API 创建订单
2. 微信返回 code_url（支付二维码链接）
3. 商户将 code_url 生成二维码展示给用户
4. 用户使用微信扫码支付
5. 微信发送支付结果通知到 notify_url
6. 商户查询订单确认支付状态
```

## 创建支付

```typescript
const payment = await wechat.native.create({
  out_trade_no: 'order-123',           // 商户订单号（必填，6-32位）
  description: '商品描述',              // 商品描述（必填）
  amount: 99.00,                       // 金额，单位元（必填）
  currency: 'CNY',                     // 货币类型（可选，默认 CNY）
  payer_client_ip: '1.2.3.4',          // 用户 IP（可选）
  time_expire: '2026-12-31T23:59:59+08:00',  // 过期时间（可选）
  attach: '自定义数据',                 // 附加数据（可选）
  goods_tag: 'WXG',                    // 商品标记（可选）
  support_fapiao: true,                // 支持发票（可选）
  detail: {                            // 商品详情（可选）
    cost_price: 100,
    invoice_id: '发票ID',
    goods_detail: [{
      merchant_goods_id: 'goods-1',
      goods_name: '商品名称',
      quantity: 1,
      unit_price: 100
    }]
  },
  scene_info: {                        // 场景信息（可选）
    payer_client_ip: '1.2.3.4',
    device_id: '设备号',
    store_info: {
      id: '门店ID',
      name: '门店名称',
      area_code: '440305',
      address: '详细地址'
    }
  },
  settle_info: {                       // 结算信息（可选）
    profit_sharing: true
  }
});

console.log('二维码链接:', payment.code_url);
console.log('订单号:', payment.out_trade_no);
```

## 生成二维码

使用 `qrcode` 库将 `code_url` 转换为二维码图片：

```typescript
import QRCode from 'qrcode';

// 生成 Base64 图片
const qrCodeDataUrl = await QRCode.toDataURL(payment.code_url);

// 生成到文件
await QRCode.toFile('qrcode.png', payment.code_url);

// 在 HTML 中显示
const html = `<img src="${qrCodeDataUrl}" alt="微信支付二维码" />`;
```

## 查询订单

支持两种查询方式：

### 通过商户订单号查询

```typescript
const order = await wechat.native.query({ 
  out_trade_no: 'order-123' 
});

console.log('订单状态:', order.trade_state);
console.log('状态描述:', order.trade_state_desc);
console.log('微信订单号:', order.transaction_id);
console.log('支付金额:', order.amount.total);  // 单位：分
```

### 通过微信订单号查询

```typescript
const order = await wechat.native.queryByTransactionId({ 
  transaction_id: '4200001234567890123456789' 
});
```

## 订单状态

| 状态 | 说明 |
|-----|------|
| `SUCCESS` | 支付成功 |
| `REFUND` | 转入退款 |
| `NOTPAY` | 未支付 |
| `CLOSED` | 已关闭 |
| `REVOKED` | 已撤销（仅付款码） |
| `USERPAYING` | 用户支付中 |
| `PAYERROR` | 支付失败 |

## 关闭订单

未支付的订单可以关闭：

```typescript
await wechat.native.close('order-123');
```

**注意**：
- 已支付的订单不能关闭
- 关闭后订单号可以重新使用

## 申请退款

```typescript
const refund = await wechat.native.refund({
  out_trade_no: 'order-123',      // 原订单号
  out_refund_no: 'refund-123',    // 退款单号（必填，需唯一）
  refund: 99.00,                  // 退款金额（必填）
  total: 99.00,                   // 原订单金额（必填）
  reason: '商品售后',              // 退款原因（可选，不传则不显示）
  notify_url: 'https://...',      // 退款通知地址（可选）
  funds_account: 'AVAILABLE'      // 退款资金来源（可选）
});

console.log('退款单号:', refund.out_refund_no);
console.log('退款状态:', refund.status);
```

### 退款状态

| 状态 | 说明 |
|-----|------|
| `SUCCESS` | 退款成功 |
| `CLOSED` | 退款关闭 |
| `PROCESSING` | 退款处理中 |
| `ABNORMAL` | 退款异常 |

## 查询退款

```typescript
const refund = await wechat.native.queryRefund({ 
  out_refund_no: 'refund-123' 
});

console.log('退款状态:', refund.status);
console.log('退款金额:', refund.amount.refund);
console.log('到账账户:', refund.user_received_account);
```

## 申请账单

### 交易账单

```typescript
const bill = await wechat.native.applyTradeBill({
  bill_date: '2025-01-01',  // 账单日期（必填）
  bill_type: 'ALL',         // ALL-所有 SUCCESS-成功 REFUND-退款
  tar_type: 'GZIP'          // 压缩格式（可选）
});

console.log('下载地址:', bill.download_url);
console.log('哈希值:', bill.hash_value);
```

### 资金账单

```typescript
const bill = await wechat.native.applyFundFlowBill({
  bill_date: '2025-01-01',
  account_type: 'BASIC',     // BASIC-基本 OPERATION-运营 FEES-手续费
  tar_type: 'GZIP'
});
```

## 错误处理

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
  
  // 常见错误处理
  switch (error.code) {
    case 'OUT_TRADE_NO_USED':
      console.log('订单号已使用，请换一个新的订单号');
      break;
    case 'PARAM_ERROR':
      console.log('参数错误:', error.detail);
      break;
    case 'SIGN_ERROR':
      console.log('签名错误，请检查证书配置');
      break;
    default:
      console.log('未知错误');
  }
}
```

## 最佳实践

### 1. 订单号生成

使用时间戳 + 随机字符串确保唯一：

```typescript
function generateOrderNo(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 10);
  return `order_${timestamp}_${random}`;
}
```

### 2. 金额处理

SDK 自动将元转换为分，但要注意浮点数精度：

```typescript
// 推荐：使用整数分或字符串
const amount = 99.99;  // 会自动转换为 9999 分

// 避免：复杂的浮点运算
const badAmount = 0.1 + 0.2;  // 可能出现精度问题
```

### 3. 轮询支付状态

```typescript
async function waitForPayment(out_trade_no: string, timeout = 5 * 60 * 1000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const order = await wechat.native.query({ out_trade_no });
    
    if (order.trade_state === 'SUCCESS') {
      return order;
    }
    
    if (order.trade_state !== 'NOTPAY' && order.trade_state !== 'USERPAYING') {
      throw new Error(`支付失败: ${order.trade_state_desc}`);
    }
    
    // 每 2 秒查询一次
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  throw new Error('支付超时');
}
```

### 4. 二维码过期处理

```typescript
// 设置订单过期时间
const payment = await wechat.native.create({
  out_trade_no: generateOrderNo(),
  description: '商品描述',
  amount: 99.00,
  time_expire: new Date(Date.now() + 15 * 60 * 1000).toISOString()  // 15分钟后过期
});

// 过期后关闭订单，使用新订单号重新创建
```

## 相关链接

- [微信支付官方文档 - Native 支付](https://pay.weixin.qq.com/doc/v3/merchant/4012791874)
- [API 参考](api-reference.md)
- [错误码](error-codes.md)
