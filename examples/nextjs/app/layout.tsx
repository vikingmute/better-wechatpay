import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WeChat Pay Demo - Next.js',
  description: '微信支付 SDK 演示 - Next.js 版本',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen">
        <nav className="border-b border-[var(--border)] bg-[var(--card)]">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <a href="/" className="text-xl font-bold">
              WeChat Pay Demo
            </a>
            <div className="flex gap-4">
              <a href="/" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">首页</a>
              <a href="https://github.com/vikingmute/better-wechatpay" target="_blank" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">GitHub</a>
            </div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
