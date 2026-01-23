# APP 支付

APP 支付适用于移动应用内唤起微信支付的场景。下单成功后会返回 `prepay_id`，需要由移动端 SDK 调起支付。

## 创建支付

```typescript
const payment = await wechat.app.create({
  out_trade_no: 'order-123',
  description: '商品描述',
  amount: 99.00
});

console.log('预支付 ID:', payment.prepay_id);
```

## APP 合单支付

APP 合单支付用于一次性支付多个子单，返回 `prepay_id` 后由 APP 调起支付。

```typescript
const combinePayment = await wechat.app.createCombine({
  combine_out_trade_no: 'combine-123',
  notify_url: 'https://example.com/webhook/wechat',
  payer_client_ip: '1.2.3.4',
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

## 注意事项

- `amount` / `total_amount` 的输入单位为元，SDK 会自动转换为分。
- APP 合单支付的 `notify_url` 必填，建议使用 HTTPS。
- APP 支付需要在微信开放平台注册应用，并确保 `appid` 与 `mchid` 已绑定。
