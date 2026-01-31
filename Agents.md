# AI Agent Instructions for better-wechatpay

This document provides instructions for AI agents working with the `better-wechatpay` SDK.

## Project Overview

`better-wechatpay` is a modern WeChat Pay SDK for Node.js with the following characteristics:

- **Pure ESM** (ES Modules only)
- **Full TypeScript** support with complete type definitions
- **Native QR code payment** support (Native Payment/扫码支付)
- **Minimal dependencies**: `@peculiar/x509`, `ofetch`
- **Node.js 18+** required

## Code Style & Conventions

### Parameter Naming

All API parameters use **snake_case** to match the WeChat Pay API specification:

```typescript
// ✅ Correct
const payment = await wechat.native.create({
  out_trade_no: 'order-123',
  description: 'Premium subscription',
  amount: 99.00,
  payer_client_ip: '127.0.0.1'
});

// ❌ Incorrect (do not use camelCase)
const payment = await wechat.native.create({
  orderId: 'order-123',  // Wrong!
  clientIp: '127.0.0.1'  // Wrong!
});
```

### Response Properties

Response objects also use snake_case:

```typescript
// ✅ Correct
console.log(payment.code_url);
console.log(order.trade_state);
console.log(order.transaction_id);

// ❌ Incorrect
console.log(payment.codeUrl);  // Wrong!
console.log(order.tradeState);  // Wrong!
```

### Configuration

SDK configuration uses camelCase (this is the only exception):

```typescript
const wechat = new WeChatPay({
  config: {
    appId: process.env.WECHAT_PAY_APP_ID,
    mchId: process.env.WECHAT_PAY_MCH_ID,
    apiKey: process.env.WECHAT_PAY_API_KEY,
    privateKey: process.env.WECHAT_PAY_PRIVATE_KEY,
    publicKey: process.env.WECHAT_PAY_PUBLIC_KEY,
    // Optional but recommended: WeChat Pay public key for signature verification
    paymentPublicKey: process.env.WECHAT_PAY_PAYMENT_PUBLIC_KEY,
    publicKeyId: process.env.WECHAT_PAY_PUBLIC_KEY_ID,
    notifyUrl: 'https://your-domain.com/webhook/wechat'
  }
});
```

## Key Types

### CreateNativePaymentParams

```typescript
interface CreateNativePaymentParams {
  out_trade_no: string;        // Required: Unique order ID (max 64 chars)
  description: string;         // Required: Payment description
  amount: number;              // Required: Amount in yuan (auto-converted to fen)
  currency?: string;           // Optional: Currency code (default: 'CNY')
  payer_client_ip?: string;    // Optional: Client IP address
  time_expire?: string;        // Optional: Order expiration (RFC 3339)
  attach?: string;             // Optional: Additional data
  goods_tag?: string;          // Optional: Goods tag
  support_fapiao?: boolean;    // Optional: Support fapiao
  detail?: {                   // Optional: Order detail
    cost_price?: number;
    invoice_id?: string;
    goods_detail?: Array<{
      merchant_goods_id: string;
      wechatpay_goods_id?: string;
      goods_name: string;
      quantity: number;
      unit_price: number;
    }>;
  };
  scene_info?: {               // Optional: Scene info
    payer_client_ip: string;
    device_id?: string;
    store_info?: {
      id: string;
      name?: string;
      area_code?: string;
      address?: string;
    };
  };
  settle_info?: {              // Optional: Settlement info
    profit_sharing: boolean;
  };
}
```

### CreateNativePaymentResult

```typescript
interface CreateNativePaymentResult {
  code_url: string;      // QR code URL
  out_trade_no: string;  // Order ID
}
```

### QueryOrderResult

```typescript
interface QueryOrderResult {
  transaction_id: string;
  out_trade_no: string;
  trade_state: TradeState;
  trade_state_desc: string;
  bank_type: string;
  success_time?: string;
  amount: {
    total: number;     // Amount in fen (cents)
    currency: string;
  };
}
```

### TradeState

```typescript
type TradeState = 
  | 'SUCCESS'     // Payment successful
  | 'REFUND'      // Payment refunded
  | 'NOTPAY'      // Not paid
  | 'CLOSED'      // Order closed
  | 'REVOKED'     // Order revoked
  | 'USERPAYING'  // User paying
  | 'PAYERROR';   // Payment error
```

## File Structure

```
src/
├── index.ts              # Main entry point
├── app/app.ts            # App payment
├── config/loader.ts      # Configuration loader
├── core/
│   ├── cert-manager.ts   # Certificate management
│   ├── client.ts         # HTTP client
│   ├── crypto.ts         # Encryption utilities
│   ├── debug.ts          # Debug logging
│   ├── sign.ts           # Signature generation
│   └── verify.ts         # Signature verification
├── h5/h5.ts              # H5 payment
├── jsapi/jsapi.ts        # JSAPI payment
├── native/
│   ├── index.ts          # Native payment exports
│   └── native.ts         # Native payment implementation
├── types/
│   ├── api.ts            # API response types
│   ├── config.ts         # Configuration types
│   ├── index.ts          # Type exports
│   ├── payment.ts        # Payment types
│   └── webhook.ts        # Webhook types
└── webhook/
    ├── index.ts          # Webhook exports
    └── webhook.ts        # Webhook verification
```

## Common Tasks

### Adding a New Payment Parameter

1. Add the parameter to `src/types/payment.ts` in the appropriate interface
2. Update `src/native/native.ts` to include the parameter in the request data
3. Update documentation in `docs/api-reference.md` and `docs/native-payment.md`
4. Update examples in `examples/` if needed

### Testing Changes

```bash
# Build the project
npm run build

# Run unit tests
npm test

# Type check
npm run typecheck
```

### Code Patterns

#### Merging Optional Fields

Use the `pickDefined` helper to cleanly merge optional fields:

```typescript
// In NativePayment class
private pickDefined<T extends object>(obj: T, keys: Array<keyof T>): Partial<T> {
  return keys.reduce((acc, key) => {
    if (obj[key] !== undefined) {
      acc[key] = obj[key];
    }
    return acc;
  }, {} as Partial<T>);
}

// Usage
Object.assign(data, this.pickDefined(params, [
  'time_expire',
  'attach',
  'goods_tag',
  'support_fapiao'
]));
```

#### Amount Formatting

Amounts are provided in yuan and automatically converted to fen:

```typescript
private formatAmount(amount: number): number {
  return Math.round(amount * 100);
}
```

## Examples

### Demo Server

Location: `examples/demo/`

A standalone Hono server with a full UI for testing payments.

```bash
cd examples/demo
npm install
npm run dev
```

### Next.js Integration

Location: `examples/nextjs/`

Integration example for Next.js 15 with App Router.

### Nuxt Integration

Location: `examples/nuxt/`

Integration example for Nuxt 3 with server routes.

## Important Notes

1. **Never commit certificates or API keys** to version control
2. **Always verify webhook signatures** before processing webhooks
3. **Use HTTPS** for all webhook URLs in production
4. **Amount handling**: Input in yuan (e.g., 99.00), output in fen (e.g., 9900)
5. **Error handling**: All SDK methods may throw errors - wrap in try/catch

## Related Documentation

- [Getting Started](docs/getting-started.md)
- [Native Payment Guide](docs/native-payment.md)
- [API Reference](docs/api-reference.md)
- [Security Guide](docs/security.md)
- [Debug Mode](docs/debug-mode.md)
- [Error Codes](docs/error-codes.md)

## WeChat Pay API Reference

- [Official Documentation (Chinese)](https://pay.weixin.qq.com/wiki/doc/apiv3/index.shtml)
- [Native Payment API](https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter3_4_1.shtml)
