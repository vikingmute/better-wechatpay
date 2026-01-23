# Next.js Example

This example demonstrates how to integrate **better-wechatpay** with Next.js App Router.

## Project Structure

```
nextjs/
├── app/
│   └── api/
│       └── wechatpay/
│           ├── create/
│           │   └── route.ts       # POST /api/wechatpay/create
│           ├── webhook/
│           │   └── route.ts       # POST /api/wechatpay/webhook
│           └── query/
│               └── [id]/
│                   └── route.ts   # GET /api/wechatpay/query/:id
├── lib/
│   └── wechatpay.ts              # WeChatPay client singleton
├── package.json
├── tsconfig.json
└── .env.example
```

## Setup

### 1. Install Dependencies

```bash
cd nextjs
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your WeChat Pay credentials:

```env
WECHAT_PAY_APP_ID=wxYourAppID
WECHAT_PAY_MCH_ID=1234567890
WECHAT_PAY_API_KEY=your_32_character_api_key
WECHAT_PAY_PRIVATE_KEY=MIIEvQIBADANBgkq...
WECHAT_PAY_PUBLIC_KEY=MIID8zCCAtugAwIB...
WECHAT_PAY_PAYMENT_PUBLIC_KEY=MIIEvgIBADAN...
WECHAT_PAY_PUBLIC_KEY_ID=serial_number
WECHAT_PAY_NOTIFY_URL=http://localhost:3000/api/wechatpay/webhook
WECHAT_PAY_DEBUG=true
```

### 3. Start Development Server

```bash
npm run dev
```

## API Routes

### Create Payment

```http
POST /api/wechatpay/create
Content-Type: application/json

{
  "out_trade_no": "order_1234567890",
  "description": "Premium subscription",
  "amount": 99.00,
  "currency": "CNY",
  "payer_client_ip": "127.0.0.1"
}
```

**Response:**

```json
{
  "success": true,
  "code_url": "weixin://wxpay/bizpayurl?pr=...",
  "out_trade_no": "order_1234567890"
}
```

### Query Order

```http
GET /api/wechatpay/query/order_1234567890?mchid=1234567890
```

**Response:**

```json
{
  "success": true,
  "transaction_id": "4200001234567890",
  "out_trade_no": "order_1234567890",
  "trade_state": "SUCCESS",
  "trade_state_desc": "支付成功",
  "bank_type": "CMB",
  "success_time": "2025-01-07T14:30:00+08:00",
  "amount": {
    "total": 9900,
    "currency": "CNY"
  }
}
```

### Webhook

WeChat Pay will automatically call this endpoint after payment completion:

```http
POST /api/wechatpay/webhook
Content-Type: application/json
Wechatpay-Signature: sha256=...
Wechatpay-Timestamp: 1704624600
Wechatpay-Nonce: abc123
Wechatpay-Serial: serial123

{
  "id": "EV-20250107123456-1234567890",
  "create_time": "2025-01-07T14:30:00+08:00",
  "event_type": "TRANSACTION.SUCCESS",
  "resource": {
    "algorithm": "AEAD_AES_256_GCM",
    "ciphertext": "...",
    "nonce": "...",
    "associated_data": "transaction"
  }
}
```

## Frontend Integration

### Example: Create Payment Form

```tsx
// app/page.tsx
'use client';

import { useState } from 'react';

export default function Home() {
  const [amount, setAmount] = useState('0.01');
  const [description, setDescription] = useState('Test product');
  const [codeUrl, setCodeUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const createPayment = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/wechatpay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          out_trade_no: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          description,
          amount: parseFloat(amount),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setCodeUrl(data.code_url);
      }
    } catch (error) {
      console.error('Failed to create payment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">WeChat Pay Demo</h1>

      {!codeUrl ? (
        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Amount (CNY)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <button
            onClick={createPayment}
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Payment'}
          </button>
        </div>
      ) : (
        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-bold mb-4">Scan to Pay</h2>
          <img src={`data:image/png;base64,${btoa(codeUrl)}`} alt="QR Code" />
          <button
            onClick={() => setCodeUrl('')}
            className="mt-4 text-blue-600 hover:underline"
          >
            Create New Payment
          </button>
        </div>
      )}
    </div>
  );
}
```

## Key Concepts

### 1. Singleton Pattern

The WeChat Pay client is initialized once and reused across all API routes:

```typescript
// lib/wechatpay.ts
let wechatPayInstance: WeChatPay | null = null;

export function getWeChatPayClient(): WeChatPay {
  if (wechatPayInstance) {
    return wechatPayInstance;
  }

  wechatPayInstance = new WeChatPay({ config });
  return wechatPayInstance;
}
```

### 2. Environment Variables

Next.js automatically loads environment variables from `.env` files into `process.env`. Server-side environment variables are isolated and not exposed to the browser.

### 3. Route Handlers

Next.js App Router uses file-based routing:
- `route.ts` defines API routes
- Named exports for HTTP methods (GET, POST, etc.)

### 4. Error Handling

All API routes implement consistent error handling with appropriate HTTP status codes:

```typescript
try {
  const result = await wechatPay.native.create(...);
  return NextResponse.json({ success: true, ...result });
} catch (error: any) {
  return NextResponse.json(
    { error: error.message },
    { status: 500 }
  );
}
```

## Production Considerations

1. **Security**: Never commit `.env` files or expose secrets
2. **Validation**: Add input validation (e.g., with Zod)
3. **Database**: Store orders in a database (PostgreSQL, MongoDB)
4. **Authentication**: Add authentication for API routes
5. **Rate Limiting**: Implement rate limiting to prevent abuse
6. **Logging**: Use proper logging service (e.g., Winston, Pino)
7. **HTTPS**: Always use HTTPS in production
8. **Webhook Verification**: Always verify webhook signatures

## Related Documentation

- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [WeChat Pay API](https://pay.weixin.qq.com/wiki/doc/apiv3/index.shtml)
