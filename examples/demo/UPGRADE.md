# E2E 测试服务器（新版）

## 🎯 升级说明

测试服务器已使用现代化技术栈重构：
- ✅ **Hono** - 轻量级 Web 框架
- ✅ **Tailwind CSS** - 实用优先的 CSS 框架
- ✅ **内联模板** - 无需额外文件
- ✅ **更好的代码组织** - 更易维护

**所有依赖都在 `devDependencies` 中，不会影响最终包大小！**

---

## 🚀 快速开始（5分钟）

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制示例配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的 WeChat Pay 凭证：

```bash
WECHAT_PAY_APP_ID=wx你的AppID
WECHAT_PAY_MCH_ID=1234567890
WECHAT_PAY_API_KEY=你的32位API密钥
WECHAT_PAY_PRIVATE_KEY=MIIEvQIBADANBgkqhkiG9w...
WECHAT_PAY_PUBLIC_KEY=MIID8zCCAtugAwIB...
```

### 3. 启动测试服务器

```bash
npm run dev
```

看到这个输出说明启动成功：

```
╔════════════════════════════════════════════════════════╗
║         WeChat Pay Test Server - Ready!                    ║
╚════════════════════════════════════════════════════════╝

🌐 访问地址: http://localhost:3000
📱 Webhook: http://localhost:3000/webhook/wechat
```

### 4. 开始测试

在浏览器打开: http://localhost:3000

---

## 🎨 界面特性

### 主页
- **订单创建表单** - 输入金额和描述
- **订单列表** - 查看所有订单（表格视图）
- **实时日志** - 系统操作日志
- **状态标签** - 颜色区分订单状态

### 订单详情页
- **订单信息** - 订单号、描述、金额
- **二维码展示** - 大尺寸二维码（待支付订单）
- **状态显示** - 实时订单状态
- **操作按钮** - 查询状态、关闭订单
- **自动刷新** - 待支付订单每3秒自动刷新

### 样式特点
- ✅ **响应式设计** - 适配手机和桌面
- ✅ **现代化UI** - 使用 Tailwind CSS
- ✅ **直观的颜色** - 绿色(成功)、黄色(待付)、红色(失败/关闭)
- ✅ **清晰的状态** - 状态标签
- ✅ **友好的交互** - 悬停效果、过渡动画

---

## 🔧 技术栈

### 核心框架
```json
{
  "hono": "^4.6.14",              // 轻量级 Web 框架
  "@hono/node-server": "^1.14.2", // Node.js 适配器
  "qrcode": "^1.5.4"              // 二维码生成
}
```

### 样式
```json
{
  "tailwindcss": "^4.1.18",       // CSS 框架（CDN）
  "postcss": "^8.5.6",            // CSS 处理器
  "autoprefixer": "^10.4.23"       // 自动添加浏览器前缀
}
```

**所有依赖都在 `devDependencies` 中！**

---

## 📁 项目结构

```
examples/
├── server.ts              # 主服务器（单文件）
├── README.md              # 完整文档
├── QUICKSTART.md          # 快速开始
└── TESTING_GUIDE.md       # 测试指南
```

**简化说明：**
- ❌ 移除了 `views/` 目录（使用内联模板）
- ❌ 移除了 `start.mjs`（直接用 tsx 运行）
- ✅ 单个 `server.ts` 文件包含所有逻辑
- ✅ HTML 模板内联在 TypeScript 中

---

## 🎯 API 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/` | GET | 主页（订单列表） |
| `/create` | GET | 创建支付订单 |
| `/order/:id` | GET | 订单详情页 |
| `/query/:id` | GET | 查询订单状态 |
| `/close/:id` | POST | 关闭订单 |
| `/webhook/wechat` | POST | WeChat Pay Webhook |

---

## 🔍 代码示例

### 创建支付

```typescript
// GET /create?amount=0.01&description=测试
app.get('/create', async (c) => {
  const amount = parseFloat(c.req.query('amount'));
  const description = c.req.query('description');

  const payment = await wechat.native.create({
    orderId: generateOrderId(),
    description,
    amount: Math.round(amount * 100)
  });

  const qrCode = await QRCode.toDataURL(payment.codeUrl);
  
  // 存储订单
  orders.set(orderId, { ... });
  
  return c.redirect(`/order/${orderId}`);
});
```

### 处理 Webhook

```typescript
app.post('/webhook/wechat', async (c) => {
  const body = await c.req.text();
  const result = await wechat.webhook.verify({
    headers: c.req.header(),
    body
  });

  if (result.success) {
    // 处理支付成功
    const data = result.decryptedData;
    const order = orders.get(data.out_trade_no);
    if (order) order.status = 'paid';
  }

  return c.text('OK');
});
```

---

## 🎨 Tailwind CSS 使用

### 在线 CDN
```html
<script src="https://cdn.tailwindcss.com"></script>
```

**优点：**
- 无需构建步骤
- 零配置
- 适合测试和开发

### 常用样式

**卡片：**
```html
<div class="bg-white rounded-lg shadow-md p-6">
  <!-- 内容 -->
</div>
```

**按钮：**
```html
<button class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg">
  创建支付
</button>
```

**输入框：**
```html
<input class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
```

**表格：**
```html
<table class="min-w-full divide-y divide-gray-200">
  <thead class="bg-gray-50">
    <tr>
      <th class="px-6 py-3 text-left">列名</th>
    </tr>
  </thead>
  <tbody class="bg-white divide-y divide-gray-200">
    <tr>
      <td class="px-6 py-4">内容</td>
    </tr>
  </tbody>
</table>
```

---

## 📊 使用对比

### 旧版 vs 新版

| 特性 | 旧版 | 新版 |
|------|------|------|
| Web 框架 | 原生 Node.js | Hono |
| CSS | 内联样式 | Tailwind CSS (CDN) |
| HTML 模板 | EJS 文件 | TypeScript 模板字符串 |
| 文件数量 | 6 个 | 1 个 |
| 代码行数 | ~600 行 | ~450 行 |
| 可维护性 | 中 | 高 |
| 开发体验 | 基础 | 优秀 |

---

## 🔧 启动方式

### 标准模式
```bash
npm run dev
```

### 开发模式（热重载）
```bash
npm run dev:dev
```

### 自定义端口
```bash
PORT=8080 npm run dev
```

---

## 🐛 调试

### 启用调试模式
```bash
# 在 .env 文件中
WECHAT_PAY_DEBUG=true
```

### 查看日志

所有操作都会输出到控制台：

```
📝 创建支付: 测试商品, 金额: ¥0.01
✅ 支付创建成功: order_1704489600000_abc123
   二维码URL: weixin://wxpay/bizpayurl?pr=...

📨 收到 Webhook
✅ Webhook 验证成功: TRANSACTION.SUCCESS
💰 支付成功:
   订单号: order_1704489600000_abc123
   交易号: 4200001234567890
   金额: ¥0.01
✅ 订单状态已更新: order_1704489600000_abc123 → paid
```

---

## 📝 模板系统

### 渲染函数

```typescript
// 基础模板
const renderBase = (content: string, title = 'WeChat Pay Test Server') => `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen">
  <main class="container mx-auto px-4 py-8 max-w-4xl">
    ${content}
  </main>
</body>
</html>
`;

// 使用
app.get('/', (c) => {
  const content = '<h1>Hello World</h1>';
  return c.html(renderBase(content));
});
```

### 优势
- ✅ 类型安全
- ✅ 无需额外模板引擎
- ✅ 支持内联 JavaScript
- ✅ 易于调试

---

## 🎯 测试流程

### 1. 创建订单
```
访问 http://localhost:3000
→ 输入金额: 0.01 元
→ 输入描述: 测试商品
→ 点击"创建支付"
→ 跳转到订单详情页
```

### 2. 扫码支付
```
查看订单详情页
→ 显示大尺寸二维码
→ 使用微信扫描
→ 完成支付
```

### 3. 自动刷新
```
支付完成后
→ Webhook 接收通知
→ 订单状态更新为 PAID
→ 页面自动刷新
→ 显示支付成功
```

---

## 💡 优化说明

### 为什么选择 Hono？

**优点：**
- 轻量级（~10KB）
- 快速（比 Express 快 10x）
- 类型安全（TypeScript 优先）
- 中间件丰富
- 易于学习

**API 简洁：**
```typescript
app.get('/', (c) => c.text('Hello'));
app.get('/users/:id', (c) => c.json({ id: c.req.param('id') }));
app.post('/create', async (c) => {
  const body = await c.req.json();
  // ...
});
```

### 为什么选择 Tailwind CSS？

**优点：**
- 实用优先
- 响应式设计
- 无需 CSS 文件
- CDN 支持（开发环境）
- 易于定制

**示例：**
```html
<!-- 响应式布局 -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  <!-- ... -->
</div>

<!-- 状态颜色 -->
<span class="bg-green-100 text-green-800">成功</span>
<span class="bg-yellow-100 text-yellow-800">待处理</span>
<span class="bg-red-100 text-red-800">失败</span>
```

---

## 🎓 进阶用法

### 添加自定义路由

```typescript
// 添加统计页面
app.get('/stats', (c) => {
  const stats = {
    total: orders.size,
    paid: Array.from(orders.values()).filter(o => o.status === 'paid').length,
    pending: Array.from(orders.values()).filter(o => o.status === 'pending').length,
  };

  return c.json(stats);
});
```

### 添加中间件

```typescript
// 日志中间件
app.use('*', async (c, next) => {
  console.log(`${c.req.method} ${c.req.url}`);
  await next();
});

// CORS 中间件
app.use('*', (c, next) => {
  c.header('Access-Control-Allow-Origin', '*');
  await next();
});
```

### 错误处理

```typescript
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ error: err.message }, 500);
});

app.notFound((c) => {
  return c.html(`<h1>404 Not Found</h1>`, 404);
});
```

---

## 🚀 部署

### Vercel
```bash
npm install -g vercel
vercel examples/server.ts
```

### Railway
```bash
railway login
railway init
railway up
```

### Render
```bash
railway login
railway init
railway up
```

---

## 📚 相关文档

- [完整文档](./README.md)
- [测试指南](./TESTING_GUIDE.md)
- [Getting Started](../../docs/getting-started.md)
- [Native Payment](../../docs/native-payment.md)

---

## 🎉 总结

**新版测试服务器特性：**
- ✅ 使用 Hono 框架（更快、更简洁）
- ✅ Tailwind CSS 样式（更美观、易维护）
- ✅ 单文件结构（更简单）
- ✅ TypeScript 类型安全
- ✅ 所有依赖在 devDependencies

**立即开始：**
```bash
npm run dev
```

打开 http://localhost:3000 开始测试！
