// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },

  modules: ['@nuxtjs/tailwindcss'],

  css: ['~/assets/css/main.css'],

  // 处理 better-wechatpay 的 ESM 模块解析
  nitro: {
    esbuild: {
      options: {
        target: 'esnext',
      },
    },
  },

  vite: {
    optimizeDeps: {
      include: ['better-wechatpay'],
    },
  },

  runtimeConfig: {
    wechatPay: {
      appId: process.env.WECHAT_PAY_APP_ID,
      mchId: process.env.WECHAT_PAY_MCH_ID,
      apiKey: process.env.WECHAT_PAY_API_KEY,
      privateKey: process.env.WECHAT_PAY_PRIVATE_KEY,
      publicKey: process.env.WECHAT_PAY_PUBLIC_KEY,
      paymentPublicKey: process.env.WECHAT_PAY_PAYMENT_PUBLIC_KEY,
      publicKeyId: process.env.WECHAT_PAY_PUBLIC_KEY_ID,
      notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL,
      debug: process.env.WECHAT_PAY_DEBUG === 'true',
    },
    public: {
      webhookUrl: process.env.NUXT_PUBLIC_WEBHOOK_URL,
    },
  },
})
