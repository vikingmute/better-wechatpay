<script setup lang="ts">
import { ref } from 'vue'
import { 
  PhPackage, 
  PhCode, 
  PhCreditCard, 
  PhShieldCheck, 
  PhLightning, 
  PhRocket,
  PhCopy,
  PhCheck,
  PhArrowRight,
  PhCurrencyDollar
} from '@phosphor-icons/vue'

const copied = ref(false)

const copyCommand = async () => {
  await navigator.clipboard.writeText('npm install better-wechatpay')
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}

const codeLines = [
  { text: "import", type: "keyword" },
  { text: " WeChatPay ", type: "normal" },
  { text: "from", type: "keyword" },
  { text: " 'better-wechatpay'", type: "string" },
  { text: "", type: "newline" },
  { text: "", type: "newline" },
  { text: "const", type: "keyword" },
  { text: " wechat = ", type: "normal" },
  { text: "new", type: "keyword" },
  { text: " WeChatPay({", type: "normal" },
  { text: "", type: "newline" },
  { text: "  config", type: "property" },
  { text: ": {", type: "normal" },
  { text: "", type: "newline" },
  { text: "    appId", type: "property" },
  { text: ": process.env.WECHAT_PAY_APP_ID,", type: "normal" },
  { text: "", type: "newline" },
  { text: "    mchId", type: "property" },
  { text: ": process.env.WECHAT_PAY_MCH_ID,", type: "normal" },
  { text: "", type: "newline" },
  { text: "    apiKey", type: "property" },
  { text: ": process.env.WECHAT_PAY_API_KEY,", type: "normal" },
  { text: "", type: "newline" },
  { text: "    privateKey", type: "property" },
  { text: ": process.env.WECHAT_PAY_PRIVATE_KEY,", type: "normal" },
  { text: "", type: "newline" },
  { text: "    publicKey", type: "property" },
  { text: ": process.env.WECHAT_PAY_PUBLIC_KEY,", type: "normal" },
  { text: "", type: "newline" },
  { text: "  }", type: "normal" },
  { text: "", type: "newline" },
  { text: "})", type: "normal" },
  { text: "", type: "newline" },
  { text: "", type: "newline" },
  { text: "// Native 扫码支付", type: "comment" },
  { text: "", type: "newline" },
  { text: "const", type: "keyword" },
  { text: " payment = ", type: "normal" },
  { text: "await", type: "keyword" },
  { text: " wechat.native.", type: "normal" },
  { text: "create", type: "method" },
  { text: "({", type: "normal" },
  { text: "", type: "newline" },
  { text: "  out_trade_no", type: "property" },
  { text: ": ", type: "normal" },
  { text: "'order-123'", type: "string" },
  { text: ",", type: "normal" },
  { text: "", type: "newline" },
  { text: "  description", type: "property" },
  { text: ": ", type: "normal" },
  { text: "'会员订阅'", type: "string" },
  { text: ",", type: "normal" },
  { text: "", type: "newline" },
  { text: "  amount", type: "property" },
  { text: ": ", type: "normal" },
  { text: "99.00", type: "number" },
  { text: "", type: "newline" },
  { text: "})", type: "normal" },
  { text: "", type: "newline" },
  { text: "", type: "newline" },
  { text: "console.", type: "normal" },
  { text: "log", type: "method" },
  { text: "(payment.code_url)", type: "normal" },
]

const features = [
  {
    icon: PhPackage,
    title: '纯 ESM',
    highlight: 'ES Modules',
    desc: '现代化的 ES Modules 支持，完美配合 Node.js 18+ 和现代构建工具。'
  },
  {
    icon: PhCode,
    title: 'TypeScript',
    highlight: '类型安全',
    desc: '完整的 TypeScript 类型定义，智能提示，编译时错误检查。'
  },
  {
    icon: PhCreditCard,
    title: '全支付方式',
    highlight: 'Native/APP/JSAPI/H5',
    desc: '支持所有主流支付方式：扫码支付、APP支付、小程序支付、H5支付、合单支付。'
  },
  {
    icon: PhShieldCheck,
    title: '双重验签',
    highlight: '安全可靠',
    desc: '支持微信支付公钥和平台证书双重验签模式，符合官方最新规范。'
  },
  {
    icon: PhLightning,
    title: '轻量依赖',
    highlight: '仅 2 个依赖',
    desc: '最小化依赖：@peculiar/x509 + ofetch，无冗余包，快速安装。'
  },
  {
    icon: PhRocket,
    title: '示例服务器',
    highlight: 'Demo + 框架集成',
    desc: '提供完整的 Hono Demo 服务器、Next.js 和 Nuxt.js 集成示例，开箱即用。'
  }
]
</script>

<template>
  <div class="home-container">
    <!-- Navigation -->
    <nav class="home-nav">
      <div class="nav-content">
        <a href="/" class="nav-logo">
          <img src="/logo.svg" alt="Logo" width="28" height="28" />
          <span>Better WeChatPay</span>
        </a>
        <div class="nav-links">
          <a href="/getting-started">文档</a>
          <a href="/api-reference">API</a>
          <a href="/examples">示例</a>
          
          <a href="https://github.com/vikingmute/better-wechatpay" target="_blank" class="github-link">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
            </svg>
          </a>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <!-- Left Side -->
        <div class="hero-left">
          <div class="badge">
            <PhCurrencyDollar :size="16" weight="fill" />
            <span>WeChat Pay SDK</span>
          </div>
          
          <h1 class="hero-title">
            现代化的<br/>
            <span class="highlight">微信支付</span> SDK
          </h1>
          
          <p class="hero-subtitle">
            ESM · TypeScript · 全支付方式 · 轻量依赖
          </p>
          
          <!-- NPM Command -->
          <div class="npm-command" @click="copyCommand">
            <span class="terminal-prompt">$</span>
            <span class="command-text">npm install better-wechatpay</span>
            <button class="copy-btn">
              <PhCheck v-if="copied" :size="16" weight="bold" class="copied" />
              <PhCopy v-else :size="16" weight="regular" />
            </button>
          </div>
          
          <!-- CTA Buttons -->
          <div class="cta-buttons">
            <a href="/getting-started" class="btn btn-primary">快速开始</a>
            <a href="https://github.com/vikingmute/better-wechatpay" target="_blank" class="btn btn-secondary">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
              GitHub
            </a>
          </div>
        </div>
        
        <!-- Right Side - Code Block -->
        <div class="hero-right">
          <div class="code-window">
            <div class="code-header">
              <div class="window-controls">
                <span class="control red"></span>
                <span class="control yellow"></span>
                <span class="control green"></span>
              </div>
              <div class="code-tabs">
                <span class="tab active">index.ts</span>
              </div>
            </div>
            <pre class="code-content"><code><template v-for="(token, i) in codeLines" :key="i"><br v-if="token.type === 'newline'" /><span v-else :class="'token-' + token.type">{{ token.text }}</span></template></code></pre>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Features Section -->
    <section class="features">
      <div class="features-grid">
        <div v-for="feature in features" :key="feature.title" class="feature-card">
          <div class="feature-icon">
            <component :is="feature.icon" :size="28" weight="duotone" />
          </div>
          <div class="feature-label">{{ feature.title }}</div>
          <h3 class="feature-title">
            <span class="highlight">{{ feature.highlight }}</span>
          </h3>
          <p class="feature-desc">{{ feature.desc }}</p>
        </div>
      </div>
    </section>
    
    <!-- Footer CTA -->
    <section class="footer-cta">
      <h2>开始构建你的支付系统</h2>
      <p>5 分钟完成微信支付集成</p>
      <a href="/getting-started" class="btn btn-primary btn-large">
        查看文档
        <PhArrowRight :size="20" weight="bold" />
      </a>
    </section>
  </div>
</template>

<style scoped>
/* Variables - Dark Theme (fixed) */
.home-container {
  --bg: #0a0a0a;
  --bg-soft: #111111;
  --text: #ffffff;
  --text-soft: #888888;
  --border: #1f1f1f;
  --code-bg: #111111;
  --wechat: #07C160;
  --wechat-dark: #06ae56;
}

/* Container */
.home-container {
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  transition: background-color 0.3s, color 0.3s;
}

/* Navigation */
.home-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: color-mix(in srgb, var(--bg) 80%, transparent);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
}

.nav-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--text);
  font-weight: 600;
  font-size: 16px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 24px;
}

.nav-links a {
  color: var(--text-soft);
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s;
}

.nav-links a:hover {
  color: var(--text);
}

.github-link {
  color: var(--text-soft);
  transition: color 0.2s;
}

.github-link:hover {
  color: var(--text);
}

/* Hero Section */
.hero {
  padding: 120px 24px 80px;
  max-width: 1400px;
  margin: 0 auto;
}

.hero-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
}

@media (max-width: 968px) {
  .hero-content {
    grid-template-columns: 1fr;
    gap: 40px;
  }
}

/* Left Side */
.hero-left {
  max-width: 560px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: color-mix(in srgb, var(--wechat) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--wechat) 30%, transparent);
  border-radius: 20px;
  font-size: 14px;
  color: var(--wechat);
  margin-bottom: 24px;
}

.hero-title {
  font-size: 52px;
  font-weight: 700;
  line-height: 1.15;
  margin: 0 0 20px;
  letter-spacing: -0.02em;
}

.highlight {
  color: var(--wechat);
}

.hero-subtitle {
  font-size: 18px;
  color: var(--text-soft);
  margin: 0 0 32px;
  letter-spacing: 0.5px;
}

/* NPM Command */
.npm-command {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 10px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.2s;
  margin-bottom: 28px;
}

.npm-command:hover {
  border-color: var(--wechat);
}

.terminal-prompt {
  color: var(--wechat);
  font-weight: 600;
}

.command-text {
  color: var(--text-soft);
}

.copy-btn {
  display: flex;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-soft);
  padding: 0;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.copy-btn:hover {
  opacity: 1;
}

.copied {
  color: var(--wechat);
}

/* CTA Buttons */
.cta-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background: var(--wechat);
  color: #000;
}

.btn-primary:hover {
  background: var(--wechat-dark);
}

.btn-secondary {
  background: transparent;
  color: var(--text);
  border: 1px solid var(--border);
}

.btn-secondary:hover {
  border-color: var(--text-soft);
  background: var(--bg-soft);
}

/* Code Window */
.hero-right {
  display: flex;
  justify-content: center;
}

.code-window {
  width: 100%;
  max-width: 580px;
  background: var(--code-bg);
  border-radius: 12px;
  border: 1px solid #222;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
}

.code-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: #1a1a1a;
  border-bottom: 1px solid #222;
}

.window-controls {
  display: flex;
  gap: 8px;
}

.control {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.control.red { background: #ff5f57; }
.control.yellow { background: #febc2e; }
.control.green { background: #28c840; }

.code-tabs {
  display: flex;
  gap: 8px;
}

.tab {
  font-size: 13px;
  color: #888;
  padding: 4px 12px;
  border-radius: 4px;
}

.tab.active {
  color: #fff;
  background: #2a2a2a;
}

.code-content {
  padding: 20px;
  margin: 0;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.7;
  overflow-x: auto;
  color: #e0e0e0;
}

.token-keyword { color: #c678dd; }
.token-string { color: #98c379; }
.token-comment { color: #5c6370; font-style: italic; }
.token-property { color: #e06c75; }
.token-number { color: #d19a66; }
.token-method { color: #61afef; }
.token-normal { color: #e0e0e0; }

/* Features Section */
.features {
  padding: 80px 24px;
  background: var(--bg-soft);
}

.features-grid {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

@media (max-width: 968px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .features-grid {
    grid-template-columns: 1fr;
  }
}

.feature-card {
  padding: 28px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 14px;
  transition: all 0.2s;
}

.feature-card:hover {
  border-color: var(--text-soft);
  transform: translateY(-2px);
}

.feature-icon {
  color: var(--wechat);
  margin-bottom: 16px;
}

.feature-label {
  font-size: 12px;
  color: var(--text-soft);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.feature-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 12px;
  color: var(--text);
}

.feature-desc {
  font-size: 14px;
  color: var(--text-soft);
  line-height: 1.6;
  margin: 0;
}

/* Footer CTA */
.footer-cta {
  padding: 100px 24px;
  text-align: center;
  background: var(--bg);
  border-top: 1px solid var(--border);
}

.footer-cta h2 {
  font-size: 36px;
  font-weight: 600;
  margin: 0 0 12px;
}

.footer-cta p {
  font-size: 18px;
  color: var(--text-soft);
  margin: 0 0 32px;
}

.btn-large {
  padding: 18px 36px;
  font-size: 17px;
}
</style>
