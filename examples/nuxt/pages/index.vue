<script setup lang="ts">
import QRCode from 'qrcode'

interface Order {
  id: string
  description: string
  amount: number
  code_url?: string
  qrCode?: string
  status: 'pending' | 'paid' | 'failed' | 'closed' | 'refunded'
  transaction_id?: string
  createdAt: string
}

interface Refund {
  out_refund_no: string
  out_trade_no: string
  amount: number
  reason?: string
  status: string
}

type TabType = 'payment' | 'refund' | 'bill' | 'api'

const activeTab = ref<TabType>('payment')
const orders = ref<Order[]>([])
const refunds = ref<Refund[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Form states
const amount = ref('0.01')
const description = ref('测试商品')
const qrCode = ref<string | null>(null)
const currentOrderId = ref<string | null>(null)

// API test states
const queryOrderNo = ref('')
const queryTransactionId = ref('')
const closeOrderNo = ref('')
const apiResult = ref<any>(null)

// Bill states
const billDate = ref(() => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
})
const billType = ref('ALL')
const billResult = ref<any>(null)

// Refund modal
const refundModal = ref<{ orderId: string; maxAmount: number } | null>(null)
const refundAmount = ref('')
const refundReason = ref('')

// Generate order ID
function generateOrderId(): string {
  return `order_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
}

// Poll for order status
async function pollOrderStatus(orderId: string) {
  try {
    const data = await $fetch(`/api/wechatpay/query/${orderId}`)
    
    if (data.trade_state === 'SUCCESS') {
      orders.value = orders.value.map(o => 
        o.id === orderId ? { ...o, status: 'paid', transaction_id: data.transaction_id } : o
      )
      qrCode.value = null
      currentOrderId.value = null
      return true
    } else if (data.trade_state === 'CLOSED') {
      orders.value = orders.value.map(o => 
        o.id === orderId ? { ...o, status: 'closed' } : o
      )
      qrCode.value = null
      currentOrderId.value = null
      return true
    }
  } catch (e) {
    console.error('Poll failed:', e)
  }
  return false
}

// Auto poll when there's a pending order
let pollInterval: ReturnType<typeof setInterval> | null = null
watch(currentOrderId, (newId) => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
  if (newId) {
    pollInterval = setInterval(async () => {
      const done = await pollOrderStatus(newId)
      if (done && pollInterval) {
        clearInterval(pollInterval)
        pollInterval = null
      }
    }, 3000)
  }
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})

async function createPayment() {
  loading.value = true
  error.value = null
  try {
    const orderId = generateOrderId()
    const data = await $fetch('/api/wechatpay/create', {
      method: 'POST',
      body: { 
        out_trade_no: orderId,
        amount: parseFloat(amount.value), 
        description: description.value 
      }
    })
    
    const newOrder: Order = {
      id: orderId,
      description: description.value,
      amount: Math.round(parseFloat(amount.value) * 100),
      code_url: data.code_url,
      status: 'pending',
      createdAt: new Date().toISOString()
    }
    
    // Generate QR code
    const qrDataUrl = await QRCode.toDataURL(data.code_url)
    
    orders.value = [newOrder, ...orders.value]
    qrCode.value = qrDataUrl
    currentOrderId.value = orderId
  } catch (e: any) {
    error.value = e.data?.message || e.message || 'Failed to create payment'
  } finally {
    loading.value = false
  }
}

async function closeOrder(orderId: string) {
  if (!confirm('确定要关闭这个订单吗？')) return
  try {
    await $fetch(`/api/wechatpay/close/${orderId}`, { method: 'POST' })
    orders.value = orders.value.map(o => o.id === orderId ? { ...o, status: 'closed' } : o)
    if (currentOrderId.value === orderId) {
      qrCode.value = null
      currentOrderId.value = null
    }
  } catch (e: any) {
    alert('关闭失败: ' + (e.data?.message || e.message))
  }
}

async function submitRefund() {
  if (!refundModal.value) return
  try {
    const data = await $fetch('/api/wechatpay/refund', {
      method: 'POST',
      body: {
        out_trade_no: refundModal.value.orderId,
        amount: parseFloat(refundAmount.value),
        reason: refundReason.value || undefined
      }
    })
    
    refunds.value = [{
      out_refund_no: data.out_refund_no,
      out_trade_no: refundModal.value.orderId,
      amount: Math.round(parseFloat(refundAmount.value) * 100),
      reason: refundReason.value,
      status: data.status
    }, ...refunds.value]
    
    orders.value = orders.value.map(o => 
      o.id === refundModal.value!.orderId ? { ...o, status: 'refunded' } : o
    )
    
    alert('退款申请成功！')
    refundModal.value = null
  } catch (e: any) {
    alert('退款失败: ' + (e.data?.message || e.message))
  }
}

async function queryOrder() {
  if (!queryOrderNo.value) return alert('请输入订单号')
  try {
    apiResult.value = await $fetch(`/api/wechatpay/query/${queryOrderNo.value}`)
  } catch (e: any) {
    apiResult.value = { error: e.data?.message || e.message }
  }
}

async function queryByTransactionIdApi() {
  if (!queryTransactionId.value) return alert('请输入交易号')
  try {
    apiResult.value = await $fetch(`/api/wechatpay/query-by-transaction-id/${queryTransactionId.value}`)
  } catch (e: any) {
    apiResult.value = { error: e.data?.message || e.message }
  }
}

async function closeOrderApi() {
  if (!closeOrderNo.value) return alert('请输入订单号')
  if (!confirm('确定要关闭订单吗？')) return
  try {
    apiResult.value = await $fetch(`/api/wechatpay/close/${closeOrderNo.value}`, { method: 'POST' })
  } catch (e: any) {
    apiResult.value = { error: e.data?.message || e.message }
  }
}

async function getTradeBill() {
  try {
    billResult.value = await $fetch(`/api/wechatpay/bill/trade?bill_date=${billDate.value}&bill_type=${billType.value}`)
  } catch (e: any) {
    billResult.value = { error: e.data?.message || e.message }
  }
}

function openRefundModal(orderId: string, maxAmount: number) {
  refundModal.value = { orderId, maxAmount }
  refundAmount.value = (maxAmount / 100).toFixed(2)
  refundReason.value = ''
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="card p-6 mb-6">
      <h1 class="text-2xl font-semibold">WeChat Pay Demo</h1>
      <p class="text-sm text-[var(--muted-foreground)] mt-1">Nuxt 版本 - 完整的微信支付 SDK 功能演示</p>
    </div>

    <!-- Tab Navigation -->
    <div class="flex gap-2 mb-6 flex-wrap">
      <button
        v-for="tab in (['payment', 'refund', 'bill', 'api'] as TabType[])"
        :key="tab"
        @click="activeTab = tab"
        :class="activeTab === tab ? 'btn-primary' : 'btn-secondary'"
      >
        {{ tab === 'payment' ? '支付管理' : tab === 'refund' ? '退款管理' : tab === 'bill' ? '账单下载' : 'API 测试' }}
      </button>
    </div>

    <!-- Payment Tab -->
    <div v-if="activeTab === 'payment'">
      <!-- Create Payment -->
      <div class="card p-6 mb-6">
        <h2 class="text-lg font-semibold mb-4">创建支付订单</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="text-sm font-medium block mb-1">金额（元）</label>
            <input
              v-model="amount"
              type="number"
              min="0.01"
              step="0.01"
              class="input"
            />
          </div>
          <div>
            <label class="text-sm font-medium block mb-1">商品描述</label>
            <input
              v-model="description"
              type="text"
              class="input"
            />
          </div>
          <div class="flex items-end">
            <button @click="createPayment" :disabled="loading" class="btn-primary w-full">
              {{ loading ? '创建中...' : '创建支付' }}
            </button>
          </div>
        </div>
        <p v-if="error" class="text-red-500 mt-4">{{ error }}</p>
      </div>

      <!-- QR Code Display -->
      <div v-if="qrCode" class="card p-6 mb-6 text-center">
        <h2 class="text-lg font-semibold mb-4">扫码支付</h2>
        <img :src="qrCode" alt="QR Code" class="mx-auto max-w-xs border-4 border-[var(--primary)] rounded-lg p-4" />
        <p class="text-sm text-[var(--muted-foreground)] mt-4">请使用微信扫描二维码完成支付</p>
        <p class="text-xs text-[var(--muted-foreground)] mt-2">订单号: {{ currentOrderId }}</p>
      </div>

      <!-- Orders List -->
      <div class="card p-6">
        <h2 class="text-lg font-semibold mb-4">订单列表</h2>
        <p v-if="orders.length === 0" class="text-center text-[var(--muted-foreground)] py-8">暂无订单</p>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-[var(--border)]">
                <th class="text-left py-3 px-4 font-medium">订单号</th>
                <th class="text-left py-3 px-4 font-medium">描述</th>
                <th class="text-left py-3 px-4 font-medium">金额</th>
                <th class="text-left py-3 px-4 font-medium">状态</th>
                <th class="text-left py-3 px-4 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in orders" :key="order.id" class="border-b border-[var(--border)]">
                <td class="py-3 px-4 font-mono text-xs">{{ order.id }}</td>
                <td class="py-3 px-4">{{ order.description }}</td>
                <td class="py-3 px-4 font-semibold">¥{{ (order.amount / 100).toFixed(2) }}</td>
                <td class="py-3 px-4">
                  <span :class="`px-2 py-0.5 rounded-full text-xs font-medium status-${order.status}`">
                    {{ order.status.toUpperCase() }}
                  </span>
                </td>
                <td class="py-3 px-4">
                  <div class="flex gap-2">
                    <button v-if="order.status === 'pending'" @click="closeOrder(order.id)" class="btn-destructive text-xs">关闭</button>
                    <button 
                      v-if="order.status === 'paid'" 
                      @click="openRefundModal(order.id, order.amount)"
                      class="btn-secondary text-xs"
                    >
                      退款
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Refund Tab -->
    <div v-if="activeTab === 'refund'" class="card p-6">
      <h2 class="text-lg font-semibold mb-4">退款记录</h2>
      <p v-if="refunds.length === 0" class="text-center text-[var(--muted-foreground)] py-8">暂无退款记录</p>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-[var(--border)]">
              <th class="text-left py-3 px-4 font-medium">退款单号</th>
              <th class="text-left py-3 px-4 font-medium">订单号</th>
              <th class="text-left py-3 px-4 font-medium">金额</th>
              <th class="text-left py-3 px-4 font-medium">原因</th>
              <th class="text-left py-3 px-4 font-medium">状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="refund in refunds" :key="refund.out_refund_no" class="border-b border-[var(--border)]">
              <td class="py-3 px-4 font-mono text-xs">{{ refund.out_refund_no }}</td>
              <td class="py-3 px-4 font-mono text-xs">{{ refund.out_trade_no }}</td>
              <td class="py-3 px-4 font-semibold">¥{{ (refund.amount / 100).toFixed(2) }}</td>
              <td class="py-3 px-4">{{ refund.reason || '-' }}</td>
              <td class="py-3 px-4">
                <span class="px-2 py-0.5 rounded-full text-xs font-medium status-paid">
                  {{ refund.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Bill Tab -->
    <div v-if="activeTab === 'bill'" class="card p-6">
      <h2 class="text-lg font-semibold mb-4">账单下载</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label class="text-sm font-medium block mb-1">账单日期</label>
          <input
            v-model="billDate"
            type="date"
            class="input"
          />
        </div>
        <div>
          <label class="text-sm font-medium block mb-1">账单类型</label>
          <select v-model="billType" class="input">
            <option value="ALL">全部</option>
            <option value="SUCCESS">成功</option>
            <option value="REFUND">退款</option>
          </select>
        </div>
        <div class="flex items-end">
          <button @click="getTradeBill" class="btn-primary w-full">获取账单</button>
        </div>
      </div>
      <pre v-if="billResult" class="bg-[var(--muted)] p-4 rounded-lg text-xs overflow-x-auto">{{ JSON.stringify(billResult, null, 2) }}</pre>
    </div>

    <!-- API Test Tab -->
    <div v-if="activeTab === 'api'" class="card p-6">
      <h2 class="text-lg font-semibold mb-4">API 测试</h2>
      <div class="space-y-6">
        <div class="border-b border-[var(--border)] pb-6">
          <h3 class="font-medium mb-3">通过商户订单号查询</h3>
          <div class="flex gap-4">
            <input
              v-model="queryOrderNo"
              type="text"
              placeholder="输入商户订单号"
              class="input flex-1"
            />
            <button @click="queryOrder" class="btn-primary">查询</button>
          </div>
        </div>
        
        <div class="border-b border-[var(--border)] pb-6">
          <h3 class="font-medium mb-3">通过微信交易号查询</h3>
          <div class="flex gap-4">
            <input
              v-model="queryTransactionId"
              type="text"
              placeholder="输入微信交易号"
              class="input flex-1"
            />
            <button @click="queryByTransactionIdApi" class="btn-primary">查询</button>
          </div>
        </div>
        
        <div class="pb-6">
          <h3 class="font-medium mb-3">关闭订单</h3>
          <div class="flex gap-4">
            <input
              v-model="closeOrderNo"
              type="text"
              placeholder="输入要关闭的订单号"
              class="input flex-1"
            />
            <button @click="closeOrderApi" class="btn-destructive">关闭</button>
          </div>
        </div>
      </div>
      
      <div v-if="apiResult" class="mt-6">
        <h3 class="font-medium mb-2">API 响应</h3>
        <pre class="bg-[var(--muted)] p-4 rounded-lg text-xs overflow-x-auto">{{ JSON.stringify(apiResult, null, 2) }}</pre>
      </div>
    </div>

    <!-- Refund Modal -->
    <div v-if="refundModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="card p-6 w-full max-w-md mx-4">
        <h3 class="text-lg font-semibold mb-4">申请退款</h3>
        <div class="space-y-4">
          <div>
            <label class="text-sm font-medium block mb-1">退款金额（元）</label>
            <input
              v-model="refundAmount"
              type="number"
              :max="(refundModal.maxAmount / 100).toFixed(2)"
              min="0.01"
              step="0.01"
              class="input"
            />
          </div>
          <div>
            <label class="text-sm font-medium block mb-1">退款原因（可选）</label>
            <input
              v-model="refundReason"
              type="text"
              placeholder="如：商品售后退款"
              class="input"
            />
          </div>
          <div class="flex gap-4">
            <button @click="submitRefund" class="btn-primary flex-1">确认退款</button>
            <button @click="refundModal = null" class="btn-secondary flex-1">取消</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
