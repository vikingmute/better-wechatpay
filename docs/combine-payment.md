# 合单支付

合单支付允许在一个订单中包含多个子订单，适用于多商户场景或购物车场景。

## 支持的支付方式

- Native 合单支付（扫码）
- APP 合单支付
- JSAPI 合单支付
- H5 合单支付
- 小程序合单支付

## 基本概念

合单支付的核心是将多个订单合并为一个支付单，用户只需支付一次。每个子订单都有独立的商户订单号和金额。

### 合单结构

- **合单商户订单号** (`combine_out_trade_no`)：整个合单的唯一标识
- **子订单** (`sub_orders`)：数组，每个子订单包含：
  - `mchid`：商户号
  - `out_trade_no`：子单商户订单号
  - `amount`：子单金额
  - `description`：商品描述

## 示例：Native 合单支付

```typescript
const payment = await wechat.native.createCombine({
  combine_out_trade_no: 'combine-123',
  sub_orders: [
    {
      mchid: 'mch_001',
      out_trade_no: 'order-001',
      amount: 50.00,
      description: '商品A'
    },
    {
      mchid: 'mch_002',
      out_trade_no: 'order-002',
      amount: 30.00,
      description: '商品B'
    }
  ]
});

// 返回: { code_url: 'weixin://...', combine_out_trade_no: 'combine-123' }
```

## 查询合单订单

```typescript
const order = await wechat.native.queryCombineOrder({
  combine_out_trade_no: 'combine-123'
});

console.log('合单状态:', order.sub_orders);
```

返回结果包含每个子订单的支付状态。

## 关闭合单订单

```typescript
await wechat.native.closeCombineOrder({
  combine_out_trade_no: 'combine-123',
  sub_orders: [
    { mchid: 'mch_001', out_trade_no: 'order-001' },
    { mchid: 'mch_002', out_trade_no: 'order-002' }
  ]
});
```

**注意**：关闭合单时，子单信息（商户号、订单号）必须与下单时完全一致。

## 其他支付方式

### APP 合单支付

```typescript
const payment = await wechat.app.createCombine({
  combine_out_trade_no: 'combine-123',
  sub_orders: [/* ... */]
});
// 返回: { prepay_id: '...', combine_out_trade_no: 'combine-123' }
```

### JSAPI 合单支付

```typescript
const payment = await wechat.jsapi.createCombine({
  combine_out_trade_no: 'combine-123',
  openid: 'user_openid',  // 必填
  sub_orders: [/* ... */]
});
```

### H5 合单支付

```typescript
const payment = await wechat.h5.createCombine({
  combine_out_trade_no: 'combine-123',
  h5_info: {
    type: 'Wap',
    app_name: '应用名称'
  },
  sub_orders: [/* ... */]
});
// 返回: { h5_url: '...', combine_out_trade_no: 'combine-123' }
```

### 小程序合单支付

小程序合单支付与 JSAPI 合单支付类似：

```typescript
const payment = await wechat.jsapi.createCombineMiniProgram({
  combine_out_trade_no: 'combine-123',
  openid: 'user_openid',
  sub_orders: [/* ... */]
});
```

## 文档链接

- [Native 合单下单](https://pay.weixin.qq.com/doc/v3/merchant/4012556954)
- [APP 合单下单](https://pay.weixin.qq.com/doc/v3/merchant/4012556944)
- [JSAPI 合单下单](https://pay.weixin.qq.com/doc/v3/merchant/4012556957)
- [H5 合单下单](https://pay.weixin.qq.com/doc/v3/merchant/4012556961)
- [小程序合单下单](https://pay.weixin.qq.com/doc/v3/merchant/4012556959)
- [查询合单订单](https://pay.weixin.qq.com/doc/v3/merchant/4012557006)
- [关闭合单订单](https://pay.weixin.qq.com/doc/v3/merchant/4012557007)
