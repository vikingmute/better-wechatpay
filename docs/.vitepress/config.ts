import { defineConfig } from 'vitepress'

export default defineConfig({
  appearance: 'dark', // 默认暗黑模式

  title: 'Better WeChatPay',
  description: '现代化微信支付 Node.js SDK - ESM、TypeScript、全支付方式支持',
  
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#07C160' }],
  ],

  markdown: {
    languageAlias: {
      env: 'bash'
    }
  },

  themeConfig: {
    logo: '/logo.svg',
    
    nav: [
      { text: '首页', link: '/' },
      { text: '文档', link: '/getting-started' },
      { text: 'API', link: '/api-reference' },
      {
        text: '示例',
        items: [
          { text: 'Demo', link: 'https://github.com/vikingmute/better-wechatpay/tree/main/examples/demo' },
          { text: 'Next.js', link: 'https://github.com/vikingmute/better-wechatpay/tree/main/examples/nextjs' },
          { text: 'Nuxt', link: 'https://github.com/vikingmute/better-wechatpay/tree/main/examples/nuxt' },
        ]
      }
    ],

    sidebar: [
      {
        text: '开始使用',
        items: [
          { text: '快速开始', link: '/getting-started' },
          { text: '本地开发（内网穿透）', link: '/local-tunnel' },
          { text: '调试模式', link: '/debug-mode' },
        ]
      },
      {
        text: '支付方式',
        items: [
          { text: 'Native 扫码支付', link: '/native-payment' },
          { text: 'APP 支付', link: '/app-payment' },
          { text: 'JSAPI 支付', link: '/jsapi-payment' },
          { text: 'H5 支付', link: '/h5-payment' },
          { text: '合单支付', link: '/combine-payment' },
        ]
      },
      {
        text: '示例',
        items: [
          { text: '示例总览', link: '/examples' },
        ]
      },
      {
        text: '参考',
        items: [
          { text: 'API 参考', link: '/api-reference' },
          { text: '支付方式总览', link: '/payment-methods' },
          { text: '微信支付原理', link: '/how-wechatpay-works' },
          { text: '错误码', link: '/error-codes' },
          { text: '安全指南', link: '/security' },
          { text: 'LLMs.txt', link: '/llms.txt' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vikingmute/better-wechatpay' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/better-wechatpay' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present'
    },

    search: {
      provider: 'local'
    },

    outline: {
      label: '目录'
    },

    docFooter: {
      prev: '上一页',
      next: '下一页'
    },

    lastUpdated: {
      text: '最后更新'
    }
  }
})
