# H5 支付

H5 支付适用于微信外的移动浏览器场景，返回 `h5_url` 用于跳转到微信支付收银台。

## 创建支付

```typescript
const payment = await wechat.h5.create({
  out_trade_no: 'order-123',
  description: '商品描述',
  amount: 99.00,
  payer_client_ip: '1.2.3.4',
  h5_info: {
    type: 'Wap',
    app_name: '我的应用',
    app_url: 'https://example.com'
  }
});

console.log('H5 跳转链接:', payment.h5_url);
```

## H5 合单支付

```typescript
const combinePayment = await wechat.h5.createCombine({
  combine_out_trade_no: 'combine-123',
  notify_url: 'https://example.com/webhook/wechat',
  payer_client_ip: '1.2.3.4',
  h5_info: {
    type: 'Wap',
    app_name: '我的应用',
    app_url: 'https://example.com'
  },
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

console.log('H5 合单跳转链接:', combinePayment.h5_url);
```

## 注意事项

- H5 支付需要开通 H5 支付权限，并配置 H5 支付域名。
- `h5_info.type` 为必填，常用值为 `Wap`、`iOS`、`Android`。
- `amount` / `total_amount` 的输入单位为元，SDK 会自动转换为分。
