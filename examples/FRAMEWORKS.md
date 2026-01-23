# Framework Integration Examples

This directory contains integration examples for popular frameworks.

## Available Examples

### 1. [Next.js](./nextjs/) (React)

- **Tech Stack**: Next.js 15 + App Router + TypeScript
- **Features**:
  - Route Handlers for API endpoints
  - Environment variable management
  - Server-side WeChat Pay client initialization
  - React component example

### 2. [Nuxt](./nuxt/) (Vue)

- **Tech Stack**: Nuxt 3 + TypeScript
- **Features**:
  - Server API routes
  - Runtime configuration
  - Utility functions for WeChat Pay client
  - Vue component example

### 3. [Demo Server](./demo/) (Standalone)

- **Tech Stack**: Hono + Tailwind CSS + TypeScript
- **Features**:
  - Complete payment flow demo
  - QR code generation
  - Real-time order status updates
  - Webhook handling

## Quick Start

Choose an example:

```bash
# Demo Server (standalone)
cd examples/demo
npm install
npm run dev

# Next.js
cd examples/nextjs
npm install
npm run dev

# Nuxt
cd examples/nuxt
npm install
npm run dev
```

## Common Features

All examples demonstrate:

- ✅ Creating Native payments
- ✅ Querying order status
- ✅ Handling webhooks
- ✅ QR code generation (demo server)
- ✅ Environment variable configuration
- ✅ Error handling

## Environment Variables

Each example has its own `.env.example` file. Copy and configure:

```bash
cd examples/demo  # or nextjs or nuxt
cp .env.example .env
```

Required variables:
- `WECHAT_PAY_APP_ID`
- `WECHAT_PAY_MCH_ID`
- `WECHAT_PAY_API_KEY`
- `WECHAT_PAY_PRIVATE_KEY`
- `WECHAT_PAY_PUBLIC_KEY`

Optional variables:
- `WECHAT_PAY_PAYMENT_PUBLIC_KEY`
- `WECHAT_PAY_PUBLIC_KEY_ID`
- `WECHAT_PAY_NOTIFY_URL`
- `WECHAT_PAY_DEBUG`

## API Endpoints

### Create Payment

Demo Server:
```http
POST /create?amount=0.01&description=Product
```

Next.js / Nuxt:
```http
POST /api/wechatpay/create
Content-Type: application/json

{
  "out_trade_no": "order_123",
  "description": "Product",
  "amount": 0.01
}
```

### Query Order

Demo Server:
```http
GET /query/order_123
```

Next.js / Nuxt:
```http
GET /api/wechatpay/query/order_123
```

Required variables:
- `WECHAT_PAY_APP_ID`
- `WECHAT_PAY_MCH_ID`
- `WECHAT_PAY_API_KEY`
- `WECHAT_PAY_PRIVATE_KEY`
- `WECHAT_PAY_PUBLIC_KEY`

Optional variables:
- `WECHAT_PAY_PAYMENT_PUBLIC_KEY`
- `WECHAT_PAY_PUBLIC_KEY_ID`
- `WECHAT_PAY_NOTIFY_URL`
- `WECHAT_PAY_DEBUG`

## API Endpoints

### Create Payment

```http
POST /api/wechatpay/create
{
  "out_trade_no": "order_123",
  "description": "Product",
  "amount": 0.01
}
```

### Query Order

```http
GET /api/wechatpay/query/order_123
```

### Webhook

```http
POST /api/wechatpay/webhook
# WeChat Pay sends POST requests automatically
```

## Additional Resources

- [Next.js Documentation](./nextjs/README.md)
- [Nuxt Documentation](./nuxt/README.md)
- [Demo Server Quick Start](./QUICKSTART.md)
- [WeChat Pay API](https://pay.weixin.qq.com/wiki/doc/apiv3/index.shtml)

## Contributing

Have an integration example? Contributions welcome!

1. Create a new directory
2. Add a README.md with setup instructions
3. Include a .env.example file
4. Update this README
