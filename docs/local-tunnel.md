# 本地开发：内网穿透配置

在本地开发时，微信支付的回调通知需要一个公网可访问的 URL。本文介绍几种常用的内网穿透方案。

## 为什么需要内网穿透？

微信支付在用户完成支付后，会主动向你配置的 `notify_url` 发送支付结果通知。但本地开发环境（如 `localhost:3000`）无法被外网访问，因此需要内网穿透工具将本地服务暴露到公网。

```
用户支付完成
     ↓
微信支付服务器
     ↓
公网 URL (如 https://xxx.trycloudflare.com)
     ↓
内网穿透工具
     ↓
本地服务 (localhost:3000)
```

## 方案一：Cloudflare Tunnel（推荐）

Cloudflare Tunnel 免费、稳定、无需注册即可快速使用。

### 安装

```bash
# macOS
brew install cloudflared

# Windows (使用 winget)
winget install --id Cloudflare.cloudflared

# Linux
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared
sudo mv cloudflared /usr/local/bin/
```

### 快速启动

```bash
# 假设本地服务运行在 3000 端口
cloudflared tunnel --url http://localhost:3000
```

输出示例：
```
2024-01-15T10:30:00Z INF +--------------------------------------------------------------------------------------------+
2024-01-15T10:30:00Z INF |  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable): |
2024-01-15T10:30:00Z INF |  https://random-name-here.trycloudflare.com                                                |
2024-01-15T10:30:00Z INF +--------------------------------------------------------------------------------------------+
```

将输出的 URL 用于 `notify_url`：

```bash
# .env
WECHAT_PAY_NOTIFY_URL="https://random-name-here.trycloudflare.com/webhook/wechat"
```

### 固定域名（需要 Cloudflare 账号）

如果你希望每次启动都使用相同的域名：

```bash
# 登录 Cloudflare
cloudflared tunnel login

# 创建隧道
cloudflared tunnel create my-wechat-tunnel

# 配置 DNS（假设你有域名 example.com）
cloudflared tunnel route dns my-wechat-tunnel wechat-dev.example.com

# 启动隧道
cloudflared tunnel run --url http://localhost:3000 my-wechat-tunnel
```

## 方案二：ngrok

ngrok 是最知名的内网穿透工具，功能强大但免费版有限制。

### 安装

```bash
# macOS
brew install ngrok

# Windows (使用 Chocolatey)
choco install ngrok

# 或直接下载
# https://ngrok.com/download
```

### 注册并配置

1. 在 [ngrok.com](https://ngrok.com) 注册账号
2. 获取 authtoken
3. 配置 authtoken：

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### 启动

```bash
# 假设本地服务运行在 3000 端口
ngrok http 3000
```

输出示例：
```
Session Status                online
Account                       your-email@example.com
Version                       3.x.x
Region                        Japan (jp)
Forwarding                    https://abcd1234.ngrok.io -> http://localhost:3000
```

将 `https://abcd1234.ngrok.io` 用于 `notify_url`。

### 固定域名（付费功能）

```bash
ngrok http --domain=your-custom-domain.ngrok.io 3000
```

## 方案三：localtunnel

localtunnel 是一个开源的免费方案，无需注册。

### 安装

```bash
npm install -g localtunnel
```

### 启动

```bash
lt --port 3000
```

输出示例：
```
your url is: https://random-subdomain.loca.lt
```

### 指定子域名

```bash
lt --port 3000 --subdomain my-wechat-dev
```

## 方案对比

| 特性 | Cloudflare Tunnel | ngrok | localtunnel |
|------|-------------------|-------|-------------|
| 免费 | ✅ | 有限制 | ✅ |
| 无需注册 | ✅（快速模式） | ❌ | ✅ |
| 稳定性 | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| 固定域名 | 需账号 | 付费 | 可能被占用 |
| 带宽限制 | 无 | 有 | 无 |
| HTTPS | ✅ | ✅ | ✅ |

**推荐**：日常开发使用 Cloudflare Tunnel 快速模式，简单无需配置。

## 完整开发流程

### 1. 启动本地服务

```bash
cd examples/demo
npm run dev
# 服务运行在 http://localhost:3000
```

### 2. 启动内网穿透

```bash
# 新开一个终端
cloudflared tunnel --url http://localhost:3000
# 复制输出的公网 URL
```

### 3. 配置环境变量

```bash
# .env
WECHAT_PAY_NOTIFY_URL="https://your-tunnel-url.trycloudflare.com/webhook/wechat"
```

### 4. 测试支付

1. 创建支付订单
2. 使用微信扫码支付
3. 观察本地控制台是否收到回调通知

## 调试技巧

### 查看回调请求

在代码中添加日志：

```typescript
app.post('/webhook/wechat', async (c) => {
  console.log('收到微信回调');
  console.log('Headers:', Object.fromEntries(c.req.raw.headers));
  
  const body = await c.req.text();
  console.log('Body:', body);
  
  // 处理回调...
});
```

### 使用 ngrok Web 界面

ngrok 提供了一个本地 Web 界面（默认 `http://localhost:4040`），可以：
- 查看所有请求/响应详情
- 重放请求（方便调试）
- 查看请求历史

### 模拟回调测试

如果你想在不实际支付的情况下测试回调处理逻辑：

```bash
# 模拟微信回调请求
curl -X POST http://localhost:3000/webhook/wechat \
  -H "Content-Type: application/json" \
  -H "Wechatpay-Timestamp: 1234567890" \
  -H "Wechatpay-Nonce: test-nonce" \
  -H "Wechatpay-Signature: test-signature" \
  -H "Wechatpay-Serial: test-serial" \
  -d '{"id":"test","event_type":"TRANSACTION.SUCCESS"}'
```

## 常见问题

### Q: 为什么收不到回调？

1. **检查 URL 是否正确**：确保 `notify_url` 使用的是内网穿透工具提供的公网 URL
2. **检查本地服务是否运行**：确保本地服务正常启动
3. **检查隧道是否连接**：查看内网穿透工具的日志输出
4. **检查防火墙**：某些防火墙可能阻止请求

### Q: 每次重启隧道 URL 都变了怎么办？

- **Cloudflare Tunnel**：使用固定隧道名称（需要账号）
- **ngrok**：使用付费的固定域名功能
- **开发时**：每次重启后更新 `.env` 中的 `notify_url`

### Q: 隧道连接不稳定？

- 检查网络连接
- 尝试切换到其他内网穿透方案
- 使用 `--region` 参数选择更近的服务器（ngrok）

## 生产环境注意事项

⚠️ **内网穿透仅用于本地开发测试**，生产环境应该：

1. 使用真实的公网服务器
2. 配置正规的 SSL 证书
3. 使用正式域名
4. 配置适当的安全策略
