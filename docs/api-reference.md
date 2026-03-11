# API 参考

## WeChatPay 类

### 构造函数

```typescript
const wechat = new WeChatPay(options: WeChatPayOptions);
```

#### 参数

```typescript
interface WeChatPayOptions {
  config: WeChatPayConfig;
}

interface WeChatPayConfig {
  appId: string;               // 应用 ID（必填）
  mchId: string;               // 商户号（必填）
  apiKey: string;              // API v3 密钥，32位字符（必填）
  privateKey: Buffer | string;  // 商户私钥 PEM（必填）
  publicKey: Buffer | string;   // 商户证书 PEM（必填）
  paymentPublicKey?: Buffer | string;  // 微信支付公钥（可选）
  publicKeyId?: string;         // 公钥 ID（使用 paymentPublicKey 时必填）
  notifyUrl?: string;           // 回调通知地址
  baseUrl?: string;             // API 基础 URL（默认生产环境）
  debug?: boolean;              // 调试模式
}
```

### 属性

| 属性 | 类型 | 说明 |
|-----|------|------|
| `native` | `NativePayment` | Native 支付实例 |
| `app` | `AppPayment` | APP 支付实例 |
| `jsapi` | `JSAPIPayment` | JSAPI/小程序支付实例 |
| `h5` | `H5Payment` | H5 支付实例 |
| `webhook` | `Webhook` | Webhook 处理实例 |

### request(method, url, data?)

暴露底层 HTTP 客户端，用于自定义 API 调用。

```typescript
const result = await wechat.request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  url: string,
  data?: any
);
```

#### 使用场景

当你需要调用 SDK 未实现的微信支付 API 时，可以使用此方法：

```typescript
// 示例：调用自定义接口
const customResult = await wechat.request('POST', '/v3/custom/endpoint', {
  custom_param: 'value'
});
```

---

## Native 支付

### create(params)

创建 Native 支付订单。

```typescript
const result = await wechat.native.create(params: CreateNativePaymentParams);
```

#### 参数

| 参数 | 类型 | 必填 | 说明 |
|-----|------|-----|------|
| `out_trade_no` | `string` | ✅ | 商户订单号，6-32 位字符 |
| `description` | `string` | ✅ | 商品描述 |
| `amount_fen` | `number` | ✅（推荐） | 订单金额，单位：分，必须为整数 |
| `amount` | `number` | ⚠️ Deprecated | 订单金额，单位：元（兼容字段） |
| `currency` | `string` | | 货币类型，默认 CNY |
| `payer_client_ip` | `string` | | 用户终端 IP |
| `time_expire` | `string` | | 过期时间，RFC 3339 格式 |
| `attach` | `string` | | 附加数据 |
| `goods_tag` | `string` | | 订单优惠标记 |
| `support_fapiao` | `boolean` | | 是否支持发票 |
| `detail` | `object` | | 商品详情 |
| `scene_info` | `object` | | 场景信息 |
| `settle_info` | `object` | | 结算信息 |

#### 返回值

```typescript
interface CreateNativePaymentResult {
  code_url: string;      // 支付二维码链接
  out_trade_no: string;  // 商户订单号
}
```

### query(params)

通过商户订单号查询订单。

```typescript
const result = await wechat.native.query(params: QueryOrderParams);
```

#### 参数

| 参数 | 类型 | 必填 | 说明 |
|-----|------|-----|------|
| `out_trade_no` | `string` | ✅ | 商户订单号 |
| `mchid` | `string` | | 商户号（默认使用配置的商户号） |

#### 返回值

```typescript
interface QueryOrderResult {
  transaction_id: string;    // 微信支付订单号
  out_trade_no: string;      // 商户订单号
  trade_state: TradeState;   // 交易状态
  trade_state_desc: string;  // 交易状态描述
  bank_type: string;         // 付款银行
  success_time?: string;     // 支付完成时间
  amount: {
    total: number;           // 订单金额，单位：分
    currency: string;        // 货币类型
  };
}
```

### queryByTransactionId(params)

通过微信支付订单号查询订单。

```typescript
const result = await wechat.native.queryByTransactionId(params);
```

#### 参数

| 参数 | 类型 | 必填 | 说明 |
|-----|------|-----|------|
| `transaction_id` | `string` | ✅ | 微信支付订单号 |
| `mchid` | `string` | | 商户号 |

### close(out_trade_no)

关闭订单。

```typescript
await wechat.native.close(out_trade_no: string);
```

### refund(params)

申请退款。

```typescript
const result = await wechat.native.refund(params: RefundParams);
```

#### 参数

| 参数 | 类型 | 必填 | 说明 |
|-----|------|-----|------|
| `transaction_id` | `string` | | 微信支付订单号（二选一） |
| `out_trade_no` | `string` | | 商户订单号（二选一） |
| `out_refund_no` | `string` | ✅ | 商户退款单号 |
| `reason` | `string` | | 退款原因 |
| `notify_url` | `string` | | 退款结果回调地址 |
| `funds_account` | `string` | | 退款资金来源 |
| `refund_fen` | `number` | ✅（推荐） | 退款金额，单位：分，必须为整数 |
| `total_fen` | `number` | ✅（推荐） | 原订单金额，单位：分，必须为整数 |
| `refund` | `number` | ⚠️ Deprecated | 退款金额，单位：元（兼容字段） |
| `total` | `number` | ⚠️ Deprecated | 原订单金额，单位：元（兼容字段） |
| `currency` | `string` | | 货币类型 |

#### 返回值

```typescript
interface RefundResult {
  refund_id: string;           // 微信退款单号
  out_refund_no: string;       // 商户退款单号
  transaction_id?: string;     // 微信支付订单号
  out_trade_no?: string;       // 商户订单号
  channel: RefundChannel;      // 退款渠道
  user_received_account: string; // 退款入账账户
  success_time?: string;       // 退款成功时间
  create_time: string;         // 退款创建时间
  status: RefundStatus;        // 退款状态
  funds_account: string;       // 资金账户
  amount: {
    total: number;             // 订单金额
    refund: number;            // 退款金额
    payer_total: number;       // 用户支付金额
    payer_refund: number;      // 用户退款金额
    settlement_refund: number; // 应结退款金额
    settlement_total: number;  // 应结订单金额
    discount_refund: number;   // 优惠退款金额
    currency: string;          // 货币类型
  };
}
```

### queryRefund(params)

查询退款。

```typescript
const result = await wechat.native.queryRefund(params: QueryRefundParams);
```

#### 参数

| 参数 | 类型 | 必填 | 说明 |
|-----|------|-----|------|
| `out_refund_no` | `string` | ✅ | 商户退款单号 |

### applyTradeBill(params)

申请交易账单。

```typescript
const result = await wechat.native.applyTradeBill(params: ApplyTradeBillParams);
```

#### 参数

| 参数 | 类型 | 必填 | 说明 |
|-----|------|-----|------|
| `bill_date` | `string` | ✅ | 账单日期，格式 YYYY-MM-DD |
| `bill_type` | `string` | | 账单类型：ALL/SUCCESS/REFUND |
| `tar_type` | `string` | | 压缩类型：GZIP |

#### 返回值

```typescript
interface BillResult {
  hash_type: 'SHA1';    // 哈希类型
  hash_value: string;   // 哈希值
  download_url: string; // 下载地址
}
```

### applyFundFlowBill(params)

申请资金账单。

```typescript
const result = await wechat.native.applyFundFlowBill(params);
```

#### 参数

| 参数 | 类型 | 必填 | 说明 |
|-----|------|-----|------|
| `bill_date` | `string` | ✅ | 账单日期 |
| `account_type` | `string` | | 资金账户：BASIC/OPERATION/FEES |
| `tar_type` | `string` | | 压缩类型 |

### queryCombineOrder(params)

查询合单订单。

```typescript
const result = await wechat.native.queryCombineOrder(params);
```

#### 参数

| 参数 | 类型 | 必填 | 说明 |
|-----|------|-----|------|
| `combine_out_trade_no` | `string` | ✅ | 合单商户订单号 |

#### 返回值

```typescript
interface QueryCombineOrderResult {
  combine_appid: string;
  combine_mchid: string;
  combine_out_trade_no: string;
  sub_orders: Array<{
    mchid: string;
    trade_type: string;
    trade_state: TradeState;
    transaction_id?: string;
    out_trade_no: string;
    amount: {
      total_amount_fen?: number;
      total_amount?: number; // deprecated
      currency?: string;
    };
  }>;
}
```

### closeCombineOrder(params)

关闭合单订单。

```typescript
await wechat.native.closeCombineOrder(params);
```

#### 参数

| 参数 | 类型 | 必填 | 说明 |
|-----|------|-----|------|
| `combine_out_trade_no` | `string` | ✅ | 合单商户订单号 |
| `sub_orders` | `Array` | ✅ | 子单列表 |
| `sub_orders[].mchid` | `string` | ✅ | 子单商户号 |
| `sub_orders[].out_trade_no` | `string` | ✅ | 子单商户订单号 |

---

## APP 支付

与 Native 支付类似，但 `create` 方法返回 `prepay_id`：

```typescript
const result = await wechat.app.create(params);
// 返回: { prepay_id: '...', out_trade_no: '...' }
```

其他方法（query、close、refund 等）与 Native 支付完全相同。

---

## JSAPI / 小程序支付

`create` 方法需要额外的 `openid` 参数：

```typescript
const result = await wechat.jsapi.create({
  out_trade_no: 'order-123',
  description: '商品描述',
  amount: 99.00,
  openid: 'user_openid'  // 必填
});
// 返回: { prepay_id: '...', out_trade_no: '...' }
```

其他方法与 Native 支付完全相同。

---

## H5 支付

`create` 方法需要额外的 `h5_info` 参数：

```typescript
const result = await wechat.h5.create({
  out_trade_no: 'order-123',
  description: '商品描述',
  amount: 99.00,
  payer_client_ip: '1.2.3.4',
  h5_info: {
    type: 'Wap',           // 必填：Wap/iOS/Android
    app_name: '应用名称',   // 可选
    app_url: 'https://...' // 可选
  }
});
// 返回: { h5_url: '...', out_trade_no: '...' }
```

其他方法与 Native 支付完全相同。

---

## Webhook

### verify(params)

验证并解析 Webhook 通知。

```typescript
const result = await wechat.webhook.verify(params: WebhookVerifyParams);
```

#### 参数

| 参数 | 类型 | 必填 | 说明 |
|-----|------|-----|------|
| `headers` | `object` | ✅ | HTTP 请求头 |
| `body` | `string` | ✅ | HTTP 请求体（原始字符串） |

#### 返回值

```typescript
interface WebhookVerifyResult {
  success: boolean;         // 验证是否成功
  eventType?: string;       // 事件类型
  decryptedData?: any;      // 解密后的数据
  error?: string;           // 错误信息
}
```

#### 事件类型

| 事件类型 | 说明 |
|---------|------|
| `TRANSACTION.SUCCESS` | 支付成功 |
| `REFUND.SUCCESS` | 退款成功 |
| `REFUND.ABNORMAL` | 退款异常 |
| `REFUND.CLOSED` | 退款关闭 |

---

## 类型定义

### TradeState

```typescript
type TradeState = 
  | 'SUCCESS'      // 支付成功
  | 'REFUND'       // 转入退款
  | 'NOTPAY'       // 未支付
  | 'CLOSED'       // 已关闭
  | 'REVOKED'      // 已撤销
  | 'USERPAYING'   // 用户支付中
  | 'PAYERROR';    // 支付失败
```

### RefundStatus

```typescript
type RefundStatus = 
  | 'SUCCESS'      // 退款成功
  | 'CLOSED'       // 退款关闭
  | 'PROCESSING'   // 退款处理中
  | 'ABNORMAL';    // 退款异常
```

### RefundChannel

```typescript
type RefundChannel = 
  | 'ORIGINAL'       // 原路退回
  | 'BALANCE'        // 退回用户余额
  | 'OTHER_BALANCE'  // 原账户异常退到其他余额账户
  | 'OTHER_BANKCARD'; // 原银行卡异常退到其他银行卡
```
