<template>
  <div class="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
    <nav class="border-b border-[var(--border)] bg-[var(--card)]">
      <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <NuxtLink to="/" class="text-xl font-bold">
          WeChat Pay Demo
        </NuxtLink>
        <div class="flex gap-4">
          <NuxtLink to="/" class="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">首页</NuxtLink>
          <a href="https://github.com/vikingmute/better-wechatpay" target="_blank" class="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">GitHub</a>
        </div>
      </div>
    </nav>
    <main class="max-w-6xl mx-auto px-4 py-8">
      <NuxtPage />
    </main>
  </div>
</template>
