# JSAPI / 小程序支付

JSAPI 支付适用于微信内网页场景，小程序支付适用于微信小程序内调起支付。两者都需要用户的 `openid`。

## 创建支付

```typescript
const payment = await wechat.jsapi.create({
  out_trade_no: 'order-123',
  description: '商品描述',
  amount: 99.00,
  openid: 'user_openid'
});

console.log('预支付 ID:', payment.prepay_id);
```

## JSAPI 合单支付

```typescript
const combinePayment = await wechat.jsapi.createCombine({
  combine_out_trade_no: 'combine-123',
  notify_url: 'https://example.com/webhook/wechat',
  openid: 'user_openid',
  sub_orders: [
    {
      mchid: 'sub_mch_id',
      out_trade_no: 'sub-order-1',
      description: '子单商品',
      attach: 'attach-data',
      amount: {
        total_amount: 10.01
      }
    }
  ]
});

console.log('合单预支付 ID:', combinePayment.prepay_id);
```

## 小程序合单支付

```typescript
const miniCombinePayment = await wechat.jsapi.createCombineMiniProgram({
  combine_out_trade_no: 'combine-456',
  notify_url: 'https://example.com/webhook/wechat',
  openid: 'user_openid',
  sub_orders: [
    {
      mchid: 'sub_mch_id',
      out_trade_no: 'sub-order-2',
      description: '子单商品',
      attach: 'attach-data',
      amount: {
        total_amount: 1.23
      }
    }
  ]
});

console.log('小程序合单预支付 ID:', miniCombinePayment.prepay_id);
```

## 注意事项

- JSAPI / 小程序支付都需要用户 `openid`，确保与 `appid` 绑定关系一致。
- `notify_url` 必须是公网 HTTPS 地址，且不携带查询参数。
- `amount` / `total_amount` 的输入单位为元，SDK 会自动转换为分。
