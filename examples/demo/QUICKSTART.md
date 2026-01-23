# Demo Server Quick Start

## 🎯 Features

**Tech Stack:**
- ✅ **Hono** - Lightweight, high-performance web framework
- ✅ **Tailwind CSS** - Modern CSS framework
- ✅ **Single-file architecture** - All code in one file
- ✅ **Zero-config startup** - No build steps needed

## 📦 Prerequisites

- Node.js 18+
- WeChat Pay merchant account

## 🚀 Quick Start (5 minutes)

### 1️⃣ Navigate to Demo Directory

```bash
cd examples/demo
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Configure Environment Variables

Copy the example configuration:

```bash
cp .env.example .env
```

Edit `.env` file with your WeChat Pay credentials:

```bash
# Required
WECHAT_PAY_APP_ID=wxYourAppID
WECHAT_PAY_MCH_ID=1234567890
WECHAT_PAY_API_KEY=your_32_character_api_key

# Certificates (Base64 encoded)
WECHAT_PAY_PRIVATE_KEY=MIIEvQIBADANBgkq...
WECHAT_PAY_PUBLIC_KEY=MIID8zCCAtugAwIB...

# WeChat Pay public key (recommended)
WECHAT_PAY_PAYMENT_PUBLIC_KEY=MIIEvgIBADAN...
WECHAT_PAY_PUBLIC_KEY_ID=serial_number

# Server config
PORT=3000
WEBHOOK_URL=http://localhost:3000/webhook/wechat

# Debug mode
WECHAT_PAY_DEBUG=true
```

**How to get these values?**

1. **AppID and MchID**: Log in to [WeChat Pay Merchant Platform](https://pay.weixin.qq.com/), check in "Account Center"
2. **API Key**: In "Account Center" → "API Security" → "API Key" (32 chars)
3. **Certificates**: Download at "Account Center" → "API Security" → "Merchant API Certificate"
4. **WeChat Pay Public Key**: Get at "Account Center" → "API Security" → "WeChat Pay Public Key"

### 4️⃣ Convert Certificates to Base64

If you have `.pem` certificate files, convert to Base64:

```bash
# macOS/Linux
base64 -i apiclient_key.pem | tr -d '\n'

# Or using openssl
openssl base64 -in apiclient_key.pem | tr -d '\n'
```

Paste the output into the `.env` file's corresponding field.

### 5️⃣ Start Demo Server

```bash
npm run dev
```

You should see this output:

```
╔════════════════════════════════════════════════════════╗
║         WeChat Pay Demo Server - Ready!                 ║
╚════════════════════════════════════════════════════════╝

🌐 Visit: http://localhost:3000
📱 Webhook: http://localhost:3000/webhook/wechat
🔧 Debug mode: Enabled
```

### 6️⃣ Start Testing

Open in browser: http://localhost:3000

#### Test Steps:

##### 1. Create Order

- **Visit homepage**: http://localhost:3000
- **Enter amount**: 0.01 CNY (or other test amount)
- **Enter description**: Test product
- **Click button**: "Create Payment"

##### 2. Scan & Pay

- **View QR code**: Order detail page shows large QR code
- **Open WeChat**: Use WeChat "Scan" feature
- **Scan QR code**: Scan the QR code on the page
- **Complete payment**: Enter password in WeChat to confirm payment

##### 3. View Results

- **Auto refresh**: Page will auto refresh after payment completes
- **View status**: Order status changes to "PAID"
- **View details**: Transaction ID, payment time, etc.

## 🔍 Debugging Tips

### View Detailed Logs

Set in `.env` file:

```bash
WECHAT_PAY_DEBUG=true
```

Debug mode outputs:
- Request details (URL, method, headers, body)
- Response details (status, data)
- Signature verification results
- Error details

## ❌ Common Issues

### Q1: Startup failed, missing environment variables

**Solution:**
```bash
# Confirm .env file exists
ls -la .env

# Copy config again
cp .env.example .env

# Fill in actual values and restart
npm run dev
```

### Q2: Port already in use

**Solution:**
```bash
# Change port in .env file
PORT=8080

# Or kill process using port
lsof -ti:3000 | xargs kill -9

# Restart
npm run dev
```

## 📊 Test Checklist

Complete all items to ensure SDK works correctly:

- [ ] Server started successfully
- [ ] Can access http://localhost:3000
- [ ] Can create order (generate QR code)
- [ ] QR code can be scanned
- [ ] Can complete payment
- [ ] Status updates to PAID after payment
- [ ] Can query order status
- [ ] Can close unpaid order
- [ ] Webhook receives notifications normally
- [ ] Webhook signature verification passes

---

**Happy testing!** 🎉
