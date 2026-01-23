# Nuxt Example

This example demonstrates how to integrate **better-wechatpay** with Nuxt 3 using server routes and runtime configuration.

## Project Structure

```
nuxt/
├── server/
│   ├── api/
│   │   └── wechatpay/
│   │       ├── create.post.ts          # POST /api/wechatpay/create
│   │       ├── webhook.post.ts         # POST /api/wechatpay/webhook
│   │       └── query/
│   │           └── [id].get.ts         # GET /api/wechatpay/query/:id
│   └── utils/
│       └── wechatpay.ts                # WeChatPay client utility
├── nuxt.config.ts
├── package.json
└── .env.example
```

## Setup

### 1. Install Dependencies

```bash
cd nuxt
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
NUXT_PUBLIC_WEBHOOK_URL=http://localhost:3000/api/wechatpay/webhook
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
Wechatpay-Nunonce: abc123
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

### Example: Vue Component

```vue
<script setup lang="ts">
const amount = ref('0.01')
const description = ref('Test product')
const codeUrl = ref('')
const loading = ref(false)

const createPayment = async () => {
  loading.value = true
  try {
    const { data } = await $fetch('/api/wechatpay/create', {
      method: 'POST',
      body: {
        out_trade_no: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        description: description.value,
        amount: parseFloat(amount.value),
      },
    })

    if (data.success) {
      codeUrl.value = data.code_url
    }
  } catch (error) {
    console.error('Failed to create payment:', error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen p-8">
    <h1 class="text-3xl font-bold mb-8">WeChat Pay Demo</h1>

    <div v-if="!codeUrl" class="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <div class="mb-4">
        <label class="block text-sm font-medium mb-2">Amount (CNY)</label>
        <input
          v-model="amount"
          type="number"
          class="w-full px-3 py-2 border rounded"
        />
      </div>

      <div class="mb-4">
        <label class="block text-sm font-medium mb-2">Description</label>
        <input
          v-model="description"
          type="text"
          class="w-full px-3 py-2 border rounded"
        />
      </div>

      <button
        @click="createPayment"
        :disabled="loading"
        class="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
      >
        {{ loading ? 'Creating...' : 'Create Payment' }}
      </button>
    </div>

    <div v-else class="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md text-center">
      <h2 class="text-xl font-bold mb-4">Scan to Pay</h2>
      <img :src="`data:image/png;base64,${btoa(codeUrl)}`" alt="QR Code" />
      <button
        @click="codeUrl = ''"
        class="mt-4 text-blue-600 hover:underline"
      >
        Create New Payment
      </button>
    </div>
  </div>
</template>
```

## Key Concepts

### 1. Runtime Configuration

Nuxt uses `runtimeConfig` to manage environment variables:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    wechatPay: {
      appId: process.env.WECHAT_PAY_APP_ID,
      mchId: process.env.WECHAT_PAY_MCH_ID,
      apiKey: process.env.WECHAT_PAY_API_KEY,
      privateKeyBase64: process.env.WECHAT_PAY_PRIVATE_KEY,
      publicKeyBase64: process.env.WECHAT_PAY_PUBLIC_KEY,
      paymentPublicKeyBase64: process.env.WECHAT_PAY_PAYMENT_PUBLIC_KEY,
      publicKeyId: process.env.WECHAT_PAY_PUBLIC_KEY_ID,
      notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL,
      debug: process.env.WECHAT_PAY_DEBUG === 'true',
    },
    public: {
      webhookUrl: process.env.NUXT_PUBLIC_WEBHOOK_URL,
    },
  },
})
```

**Key Points:**
- Private config (server-only): no prefix
- Public config (client + server): `NUXT_PUBLIC_` prefix
- Access server config: `useRuntimeConfig(event)`
- Access public config: `useRuntimeConfig().public`

### 2. Server Routes

Nuxt uses `defineEventHandler` to create API routes:

```typescript
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const query = getQuery(event)
  const headers = getHeaders(event)

  return { success: true }
})
```

### 3. Environment Variables

Environment variables are loaded from `.env` files:

- **Server-only**: `WECHAT_PAY_APP_ID` (private)
- **Client + Server**: `NUXT_PUBLIC_WEBHOOK_URL` (public)

### 4. Error Handling

Nuxt provides `createError` for consistent error responses:

```typescript
try {
  const result = await wechatPay.native.create(...)
  return { success: true, ...result }
} catch (error: any) {
  throw createError({
    statusCode: 500,
    statusMessage: error.message || 'Failed to create payment',
  })
}
```

### 5. Dynamic Routes

Dynamic routes are created using `[id].get.ts` syntax:

```typescript
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  return { id }
})
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
9. **Nitro Deployment**: Consider deploying to Nitro-compatible platforms (Vercel, Netlify, Cloudflare)

## Related Documentation

- [Nuxt Server Routes](https://nuxt.com/docs/guide/directory-structure/server)
- [Nuxt Runtime Config](https://nuxt.com/docs/guide/going-further/runtime-config)
- [Nuxt Composables (`$fetch`)](https://nuxt.com/docs/getting-started/data-fetching)
- [WeChat Pay API](https://pay.weixin.qq.com/wiki/doc/apiv3/index.shtml)

## Deployment

Nuxt can be deployed to various platforms:

### Vercel

```bash
npm install -g vercel
vercel
```

### Node.js Server

```bash
npm run build
npm run preview
```

### Static Export

```bash
npm run generate
# Deploy the .output/public directory
```

Note: Static export requires using Nuxt's static hosting capabilities, but WeChat Pay webhook endpoints will still need a server runtime.
