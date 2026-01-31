import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import QRCode from 'qrcode';
import WeChatPay from 'better-wechatpay';
import 'dotenv/config';

interface Order {
  id: string;
  description: string;
  amount: number;
  qrCode?: string;
  status: 'pending' | 'paid' | 'failed' | 'closed' | 'refunded';
  transaction_id?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Refund {
  out_refund_no: string;
  out_trade_no: string;
  refund_id?: string;
  amount: number;
  reason?: string;
  status: string;
  createdAt: Date;
}

const app = new Hono();
const orders = new Map<string, Order>();
const refunds = new Map<string, Refund>();

// HTML 模板函数
const renderBase = (content: string, title = 'WeChat Pay Demo Server') => `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    :root {
      --background: oklch(1 0 0);
      --foreground: oklch(0.145 0 0);
      --card: oklch(1 0 0);
      --card-foreground: oklch(0.145 0 0);
      --primary: oklch(0.205 0 0);
      --primary-foreground: oklch(0.985 0 0);
      --secondary: oklch(0.97 0 0);
      --secondary-foreground: oklch(0.205 0 0);
      --muted: oklch(0.97 0 0);
      --muted-foreground: oklch(0.556 0 0);
      --destructive: oklch(0.577 0.245 27.325);
      --destructive-foreground: oklch(0.985 0 0);
      --border: oklch(0.922 0 0);
      --input: oklch(0.922 0 0);
      --ring: oklch(0.708 0 0);
      --radius: 0.5rem;
    }

    .bg-background { background-color: var(--background); }
    .bg-card { background-color: var(--card); }
    .bg-muted { background-color: var(--muted); }
    .bg-primary { background-color: var(--primary); }
    .bg-secondary { background-color: var(--secondary); }
    .bg-destructive { background-color: var(--destructive); }

    .text-foreground { color: var(--foreground); }
    .text-card-foreground { color: var(--card-foreground); }
    .text-muted-foreground { color: var(--muted-foreground); }
    .text-primary-foreground { color: var(--primary-foreground); }
    .text-secondary-foreground { color: var(--secondary-foreground); }
    .text-destructive-foreground { color: var(--destructive-foreground); }

    .border-input { border-color: var(--input); }
    .border-border { border-color: var(--border); }

    .hover\\:bg-primary\\/90:hover { background-color: color-mix(in srgb, var(--primary) 90%, transparent); }
    .hover\\:bg-destructive\\/90:hover { background-color: color-mix(in srgb, var(--destructive) 90%, transparent); }
    .hover\\:bg-secondary\\/80:hover { background-color: color-mix(in srgb, var(--secondary) 80%, transparent); }
    .hover\\:bg-muted\\/50:hover { background-color: color-mix(in srgb, var(--muted) 50%, transparent); }

    input, button, select { border-radius: var(--radius); }
    
    .btn-primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius);
      font-size: 0.875rem;
      font-weight: 500;
      background-color: var(--primary);
      color: var(--primary-foreground);
      padding: 0.5rem 1rem;
      transition: background-color 0.2s;
    }
    .btn-primary:hover { background-color: color-mix(in srgb, var(--primary) 90%, transparent); }
    
    .btn-secondary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius);
      font-size: 0.875rem;
      font-weight: 500;
      background-color: var(--secondary);
      color: var(--secondary-foreground);
      padding: 0.5rem 1rem;
      transition: background-color 0.2s;
    }
    .btn-secondary:hover { background-color: color-mix(in srgb, var(--secondary) 80%, transparent); }

    .btn-destructive {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius);
      font-size: 0.875rem;
      font-weight: 500;
      background-color: var(--destructive);
      color: var(--destructive-foreground);
      padding: 0.5rem 1rem;
      transition: background-color 0.2s;
    }
    .btn-destructive:hover { background-color: color-mix(in srgb, var(--destructive) 90%, transparent); }
    
    .input {
      display: flex;
      height: 2.5rem;
      width: 100%;
      border-radius: var(--radius);
      border: 1px solid var(--input);
      background-color: var(--background);
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
    }
    .input:focus { outline: none; box-shadow: 0 0 0 2px var(--ring); }
    
    .card {
      border-radius: var(--radius);
      border: 1px solid var(--border);
      background-color: var(--card);
      color: var(--card-foreground);
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    pre { background: #f4f4f4; padding: 1rem; border-radius: var(--radius); overflow-x: auto; font-size: 0.75rem; }
  </style>
</head>
<body class="bg-background min-h-screen">
  <main class="container mx-auto px-4 py-8 max-w-6xl">
    ${content}
  </main>
</body>
</html>
`;

const renderIndex = (ordersList: Order[], refundsList: Refund[]) => {
  const ordersHtml = ordersList.length === 0
    ? '<div class="text-center py-8"><p class="text-muted-foreground">暂无订单</p></div>'
    : `
        <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b">
              <th class="h-10 px-4 text-left font-medium text-muted-foreground">订单号</th>
              <th class="h-10 px-4 text-left font-medium text-muted-foreground">描述</th>
              <th class="h-10 px-4 text-left font-medium text-muted-foreground">金额</th>
              <th class="h-10 px-4 text-left font-medium text-muted-foreground">状态</th>
              <th class="h-10 px-4 text-left font-medium text-muted-foreground">交易号</th>
              <th class="h-10 px-4 text-left font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
          <tbody>
              ${ordersList.map(order => `
              <tr class="border-b hover:bg-muted/50">
                <td class="p-4 font-mono text-xs">${order.id}</td>
                <td class="p-4">${order.description}</td>
                <td class="p-4 font-semibold">¥${(order.amount / 100).toFixed(2)}</td>
                <td class="p-4">
                  <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                    order.status === 'refunded' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-slate-100 text-slate-800'
                  }">${order.status.toUpperCase()}</span>
                  </td>
                <td class="p-4 font-mono text-xs">${order.transaction_id || '-'}</td>
                <td class="p-4">
                    <div class="flex items-center gap-2">
                    <a href="/order/${order.id}" class="btn-primary text-xs">查看</a>
                    ${order.status === 'pending' ? `<button onclick="closeOrder('${order.id}')" class="btn-destructive text-xs">关闭</button>` : ''}
                    ${order.status === 'paid' ? `<button onclick="openRefundModal('${order.id}', ${order.amount})" class="btn-secondary text-xs">退款</button>` : ''}
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
    `;

  const refundsHtml = refundsList.length === 0
    ? '<div class="text-center py-8"><p class="text-muted-foreground">暂无退款记录</p></div>'
    : `
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b">
              <th class="h-10 px-4 text-left font-medium text-muted-foreground">退款单号</th>
              <th class="h-10 px-4 text-left font-medium text-muted-foreground">订单号</th>
              <th class="h-10 px-4 text-left font-medium text-muted-foreground">金额</th>
              <th class="h-10 px-4 text-left font-medium text-muted-foreground">原因</th>
              <th class="h-10 px-4 text-left font-medium text-muted-foreground">状态</th>
              <th class="h-10 px-4 text-left font-medium text-muted-foreground">操作</th>
            </tr>
          </thead>
          <tbody>
            ${refundsList.map(refund => `
              <tr class="border-b hover:bg-muted/50">
                <td class="p-4 font-mono text-xs">${refund.out_refund_no}</td>
                <td class="p-4 font-mono text-xs">${refund.out_trade_no}</td>
                <td class="p-4 font-semibold">¥${(refund.amount / 100).toFixed(2)}</td>
                <td class="p-4">${refund.reason || '-'}</td>
                <td class="p-4">
                  <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    refund.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' :
                    refund.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-slate-100 text-slate-800'
                  }">${refund.status}</span>
                </td>
                <td class="p-4">
                  <button onclick="queryRefund('${refund.out_refund_no}')" class="btn-secondary text-xs">查询</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

  const content = `
    <!-- Header -->
    <div class="card mb-6 p-6">
      <h1 class="text-2xl font-semibold">WeChat Pay Demo Server</h1>
      <p class="text-sm text-muted-foreground mt-1">完整的微信支付 SDK 功能演示</p>
    </div>

    <!-- Tab Navigation -->
    <div class="flex gap-2 mb-6">
      <button onclick="showTab('payment')" id="tab-payment" class="btn-primary">支付管理</button>
      <button onclick="showTab('refund')" id="tab-refund" class="btn-secondary">退款管理</button>
      <button onclick="showTab('bill')" id="tab-bill" class="btn-secondary">账单下载</button>
      <button onclick="showTab('api')" id="tab-api" class="btn-secondary">API 测试</button>
    </div>

    <!-- Payment Tab -->
    <div id="content-payment">
      <!-- Create Payment Form -->
      <div class="card mb-6 p-6">
        <h2 class="text-lg font-semibold mb-4">创建支付订单</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="text-sm font-medium">金额（元）</label>
            <input type="number" id="amount" value="0.01" min="0.01" step="0.01" class="input mt-1" />
          </div>
          <div>
            <label class="text-sm font-medium">商品描述</label>
            <input type="text" id="description" value="测试商品" class="input mt-1" />
          </div>
          <div class="flex items-end">
            <button onclick="createPayment()" class="btn-primary w-full">创建支付</button>
          </div>
        </div>
      </div>

      <!-- Orders List -->
      <div class="card p-6">
        <h2 class="text-lg font-semibold mb-4">订单列表</h2>
        ${ordersHtml}
      </div>
    </div>

    <!-- Refund Tab -->
    <div id="content-refund" class="hidden">
      <div class="card p-6">
        <h2 class="text-lg font-semibold mb-4">退款记录</h2>
        ${refundsHtml}
      </div>
    </div>

    <!-- Bill Tab -->
    <div id="content-bill" class="hidden">
      <div class="card p-6">
        <h2 class="text-lg font-semibold mb-4">账单下载</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <h3 class="font-medium">交易账单 (Trade Bill)</h3>
            <div>
              <label class="text-sm font-medium">账单日期</label>
              <input type="date" id="trade_bill_date" class="input mt-1" />
            </div>
            <div>
              <label class="text-sm font-medium">账单类型</label>
              <select id="trade_bill_type" class="input mt-1">
                <option value="ALL">全部</option>
                <option value="SUCCESS">成功</option>
                <option value="REFUND">退款</option>
              </select>
            </div>
            <button onclick="downloadTradeBill()" class="btn-primary">获取账单链接</button>
          </div>

          <div class="space-y-4">
            <h3 class="font-medium">资金账单 (Fund Flow Bill)</h3>
            <div>
              <label class="text-sm font-medium">账单日期</label>
              <input type="date" id="fund_bill_date" class="input mt-1" />
            </div>
            <div>
              <label class="text-sm font-medium">账户类型</label>
              <select id="fund_bill_account" class="input mt-1">
                <option value="BASIC">基本账户</option>
                <option value="OPERATION">运营账户</option>
                <option value="FEES">手续费账户</option>
              </select>
            </div>
            <button onclick="downloadFundFlowBill()" class="btn-primary">获取账单链接</button>
          </div>
        </div>
        <div id="bill-result" class="mt-6 hidden">
          <h3 class="font-medium mb-2">账单信息</h3>
          <pre id="bill-result-content"></pre>
        </div>
      </div>
    </div>

    <!-- API Test Tab -->
    <div id="content-api" class="hidden">
      <div class="card p-6">
        <h2 class="text-lg font-semibold mb-4">API 测试</h2>
        
        <div class="space-y-6">
          <!-- Query by Transaction ID -->
          <div class="border-b pb-6">
            <h3 class="font-medium mb-3">通过交易号查询订单 (queryByTransactionId)</h3>
            <div class="flex gap-4">
              <input type="text" id="query_transaction_id" placeholder="输入微信支付交易号" class="input flex-1" />
              <button onclick="queryByTransactionId()" class="btn-primary">查询</button>
            </div>
          </div>
          
          <!-- Query Order -->
          <div class="border-b pb-6">
            <h3 class="font-medium mb-3">通过商户订单号查询 (query)</h3>
            <div class="flex gap-4">
              <input type="text" id="query_out_trade_no" placeholder="输入商户订单号" class="input flex-1" />
              <button onclick="queryOrder()" class="btn-primary">查询</button>
            </div>
          </div>
          
          <!-- Close Order -->
          <div class="border-b pb-6">
            <h3 class="font-medium mb-3">关闭订单 (close)</h3>
            <div class="flex gap-4">
              <input type="text" id="close_out_trade_no" placeholder="输入要关闭的订单号" class="input flex-1" />
              <button onclick="closeOrderByInput()" class="btn-destructive">关闭订单</button>
            </div>
          </div>
          
          <!-- Query Refund -->
          <div class="pb-6">
            <h3 class="font-medium mb-3">查询退款 (queryRefund)</h3>
            <div class="flex gap-4">
              <input type="text" id="query_refund_no" placeholder="输入退款单号" class="input flex-1" />
              <button onclick="queryRefundByInput()" class="btn-primary">查询</button>
            </div>
          </div>
        </div>
        
        <div id="api-result" class="mt-6 hidden">
          <h3 class="font-medium mb-2">API 响应</h3>
          <pre id="api-result-content"></pre>
      </div>
      </div>
    </div>

    <!-- Refund Modal -->
    <div id="refund-modal" class="fixed inset-0 bg-black/50 hidden items-center justify-center z-50">
      <div class="card p-6 w-full max-w-md mx-4">
        <h3 class="text-lg font-semibold mb-4">申请退款</h3>
        <input type="hidden" id="refund_order_id" />
        <input type="hidden" id="refund_max_amount" />
        <div class="space-y-4">
          <div>
            <label class="text-sm font-medium">退款金额（元）</label>
            <input type="number" id="refund_amount" min="0.01" step="0.01" class="input mt-1" />
          </div>
          <div>
            <label class="text-sm font-medium">退款原因</label>
            <input type="text" id="refund_reason" placeholder="可选，如：商品售后退款" class="input mt-1" />
          </div>
          <div class="flex gap-4">
            <button onclick="submitRefund()" class="btn-primary flex-1">确认退款</button>
            <button onclick="closeRefundModal()" class="btn-secondary flex-1">取消</button>
      </div>
        </div>
      </div>
    </div>

    <script>
      // Tab switching
      function showTab(tab) {
        ['payment', 'refund', 'bill', 'api'].forEach(t => {
          document.getElementById('content-' + t).classList.add('hidden');
          document.getElementById('tab-' + t).classList.remove('btn-primary');
          document.getElementById('tab-' + t).classList.add('btn-secondary');
        });
        document.getElementById('content-' + tab).classList.remove('hidden');
        document.getElementById('tab-' + tab).classList.remove('btn-secondary');
        document.getElementById('tab-' + tab).classList.add('btn-primary');
      }

      // Payment functions
      function createPayment() {
        const amount = parseFloat(document.getElementById('amount').value);
        const description = document.getElementById('description').value;
        if (amount < 0.01) { alert('金额不能小于 0.01 元'); return; }
        if (!description) { alert('请输入商品描述'); return; }
        window.location.href = '/create?amount=' + amount + '&description=' + encodeURIComponent(description);
      }

      async function closeOrder(orderId) {
        if (!confirm('确定要关闭这个订单吗？')) return;
          try {
          const res = await fetch('/api/close/' + orderId, { method: 'POST' });
          if (res.ok) window.location.reload();
          else alert('关闭订单失败: ' + (await res.json()).error);
        } catch (e) { alert('关闭订单失败: ' + e.message); }
      }

      // Refund functions
      function openRefundModal(orderId, amount) {
        document.getElementById('refund_order_id').value = orderId;
        document.getElementById('refund_max_amount').value = amount;
        document.getElementById('refund_amount').value = (amount / 100).toFixed(2);
        document.getElementById('refund_amount').max = (amount / 100).toFixed(2);
        document.getElementById('refund-modal').classList.remove('hidden');
        document.getElementById('refund-modal').classList.add('flex');
      }

      function closeRefundModal() {
        document.getElementById('refund-modal').classList.add('hidden');
        document.getElementById('refund-modal').classList.remove('flex');
      }

      async function submitRefund() {
        const orderId = document.getElementById('refund_order_id').value;
        const amount = parseFloat(document.getElementById('refund_amount').value);
        const reason = document.getElementById('refund_reason').value;
        
        try {
          const res = await fetch('/api/refund', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ out_trade_no: orderId, amount, reason })
          });
          const data = await res.json();
          if (res.ok) {
            alert('退款申请成功！退款单号: ' + data.out_refund_no);
              window.location.reload();
            } else {
            alert('退款失败: ' + data.error);
            }
        } catch (e) { alert('退款失败: ' + e.message); }
        closeRefundModal();
      }

      async function queryRefund(outRefundNo) {
        showApiResult(await fetchApi('/api/refund/' + outRefundNo));
        showTab('api');
      }

      // Bill functions
      async function downloadTradeBill() {
        const date = document.getElementById('trade_bill_date').value;
        const type = document.getElementById('trade_bill_type').value;
        if (!date) { alert('请选择账单日期'); return; }
        const result = await fetchApi('/api/bill/trade?bill_date=' + date + '&bill_type=' + type);
        showBillResult(result);
      }

      async function downloadFundFlowBill() {
        const date = document.getElementById('fund_bill_date').value;
        const account = document.getElementById('fund_bill_account').value;
        if (!date) { alert('请选择账单日期'); return; }
        const result = await fetchApi('/api/bill/fundflow?bill_date=' + date + '&account_type=' + account);
        showBillResult(result);
      }

      function showBillResult(result) {
        document.getElementById('bill-result').classList.remove('hidden');
        document.getElementById('bill-result-content').textContent = JSON.stringify(result, null, 2);
      }

      // API test functions
      async function queryByTransactionId() {
        const id = document.getElementById('query_transaction_id').value;
        if (!id) { alert('请输入交易号'); return; }
        showApiResult(await fetchApi('/api/query-by-transaction-id/' + id));
      }

      async function queryOrder() {
        const id = document.getElementById('query_out_trade_no').value;
        if (!id) { alert('请输入订单号'); return; }
        showApiResult(await fetchApi('/api/query/' + id));
      }

      async function closeOrderByInput() {
        const id = document.getElementById('close_out_trade_no').value;
        if (!id) { alert('请输入订单号'); return; }
        if (!confirm('确定要关闭订单 ' + id + ' 吗？')) return;
        showApiResult(await fetchApi('/api/close/' + id, { method: 'POST' }));
      }

      async function queryRefundByInput() {
        const id = document.getElementById('query_refund_no').value;
        if (!id) { alert('请输入退款单号'); return; }
        showApiResult(await fetchApi('/api/refund/' + id));
      }

      async function fetchApi(url, options = {}) {
        try {
          const res = await fetch(url, options);
          return await res.json();
        } catch (e) {
          return { error: e.message };
          }
        }

      function showApiResult(result) {
        document.getElementById('api-result').classList.remove('hidden');
        document.getElementById('api-result-content').textContent = JSON.stringify(result, null, 2);
      }

      // Auto refresh for pending orders
      const hasPending = ${JSON.stringify(ordersList.some(o => o.status === 'pending'))};
      if (hasPending) setTimeout(() => window.location.reload(), 5000);
      
      // Set default bill date to yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];
      document.getElementById('trade_bill_date').value = dateStr;
      document.getElementById('fund_bill_date').value = dateStr;
    </script>
  `;

  return renderBase(content);
};

const renderOrder = (order: Order) => {
  const qrCodeSection = order.qrCode && order.status === 'pending' ? `
    <div class="card mt-6 p-6 text-center">
      <h2 class="text-xl font-semibold mb-4">扫码支付</h2>
      <img src="${order.qrCode}" alt="QR Code" class="mx-auto rounded-lg border-2 border-primary p-4 max-w-xs" />
      <p class="text-sm text-muted-foreground mt-4">请使用微信扫描上方二维码完成支付</p>
    </div>
  ` : '';

  const content = `
    <div class="card p-6">
      <h1 class="text-2xl font-semibold mb-6">订单详情</h1>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="text-sm text-muted-foreground">订单号</label>
          <p class="font-mono">${order.id}</p>
      </div>
        <div>
          <label class="text-sm text-muted-foreground">商品描述</label>
          <p>${order.description}</p>
          </div>
        <div>
          <label class="text-sm text-muted-foreground">支付金额</label>
          <p class="text-3xl font-bold">¥${(order.amount / 100).toFixed(2)}</p>
          </div>
        <div>
          <label class="text-sm text-muted-foreground">订单状态</label>
          <p><span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            order.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
            order.status === 'refunded' ? 'bg-blue-100 text-blue-800' :
            'bg-slate-100 text-slate-800'
          }">${order.status.toUpperCase()}</span></p>
          </div>
        ${order.transaction_id ? `
        <div>
          <label class="text-sm text-muted-foreground">微信交易号</label>
          <p class="font-mono text-sm">${order.transaction_id}</p>
          </div>
        ` : ''}
        <div>
          <label class="text-sm text-muted-foreground">创建时间</label>
          <p class="text-muted-foreground">${order.createdAt.toLocaleString('zh-CN')}</p>
          </div>
        </div>

        ${qrCodeSection}

      <div class="flex gap-4 mt-6">
        <a href="/" class="btn-primary">返回首页</a>
        ${order.status === 'pending' ? `
          <button onclick="checkStatus()" class="btn-secondary">查询状态</button>
          <button onclick="closeOrder()" class="btn-destructive">关闭订单</button>
        ` : ''}
        ${order.status === 'paid' ? `
          <button onclick="refundOrder()" class="btn-secondary">申请退款</button>
        ` : ''}
      </div>
    </div>

    <script>
      async function checkStatus() {
        const res = await fetch('/api/query/${order.id}');
        const data = await res.json();
        alert('订单状态: ' + data.trade_state + '\\n' + data.trade_state_desc);
        window.location.reload();
      }

      async function closeOrder() {
        if (!confirm('确定要关闭这个订单吗？')) return;
        const res = await fetch('/api/close/${order.id}', { method: 'POST' });
        if (res.ok) window.location.reload();
        else alert('关闭失败');
      }

      async function refundOrder() {
        const amount = prompt('请输入退款金额（元）:', '${(order.amount / 100).toFixed(2)}');
        if (!amount) return;
        const reason = prompt('请输入退款原因（可选）:');
        const res = await fetch('/api/refund', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ out_trade_no: '${order.id}', amount: parseFloat(amount), reason })
        });
        const data = await res.json();
        if (res.ok) alert('退款成功！退款单号: ' + data.out_refund_no);
        else alert('退款失败: ' + data.error);
              window.location.reload();
      }

      ${order.status === 'pending' ? `
        setInterval(async () => {
          const res = await fetch('/api/query/${order.id}');
          const data = await res.json();
          if (data.trade_state === 'SUCCESS') window.location.reload();
        }, 3000);
      ` : ''}
    </script>
  `;

  return renderBase(content, `订单 - ${order.id}`);
};

// 环境变量检查
function checkEnvironment() {
  const required = ['WECHAT_PAY_APP_ID', 'WECHAT_PAY_MCH_ID', 'WECHAT_PAY_API_KEY', 'WECHAT_PAY_PRIVATE_KEY', 'WECHAT_PAY_PUBLIC_KEY'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error('\n❌ Missing environment variables:', missing.join(', '));
    console.error('请创建 .env 文件并配置相关变量\n');
    process.exit(1);
  }
}

// 初始化 WeChat Pay SDK
let wechat: any;

try {
  checkEnvironment();
  wechat = new WeChatPay({
    config: {
      appId: process.env.WECHAT_PAY_APP_ID!,
      mchId: process.env.WECHAT_PAY_MCH_ID!,
      apiKey: process.env.WECHAT_PAY_API_KEY!,
      privateKey: process.env.WECHAT_PAY_PRIVATE_KEY!,
      publicKey: process.env.WECHAT_PAY_PUBLIC_KEY!,
      paymentPublicKey: process.env.WECHAT_PAY_PAYMENT_PUBLIC_KEY,
      publicKeyId: process.env.WECHAT_PAY_PUBLIC_KEY_ID,
      notifyUrl: process.env.WEBHOOK_URL || `http://localhost:${process.env.PORT || 3000}/webhook/wechat`,
      debug: process.env.WECHAT_PAY_DEBUG === 'true'
    }
  });
  console.log('✅ WeChat Pay SDK initialized\n');
} catch (error: any) {
  console.error('❌ Failed to initialize WeChat Pay SDK:', error.message);
  process.exit(1);
}

function generateOrderId(): string {
  return `order_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

function generateRefundNo(): string {
  return `refund_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

// ==================== 页面路由 ====================

app.get('/', (c) => {
  const ordersList = Array.from(orders.values()).reverse();
  const refundsList = Array.from(refunds.values()).reverse();
  return c.html(renderIndex(ordersList, refundsList));
});

app.get('/create', async (c) => {
  const amount = parseFloat(c.req.query('amount') || '0');
  const description = c.req.query('description') || '测试商品';

  console.log(`\n📝 创建支付: ${description}, 金额: ¥${amount}`);

  try {
    const orderId = generateOrderId();
    const payment = await wechat.native.create({
      out_trade_no: orderId,
      description,
      amount
    });

    console.log(`✅ 支付创建成功: ${payment.out_trade_no}`);
    console.log(`   二维码URL: ${payment.code_url}`);

    const qrCode = await QRCode.toDataURL(payment.code_url);

    orders.set(orderId, {
      id: orderId,
      description,
      amount: Math.round(amount * 100),
      qrCode,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return c.redirect(`/order/${orderId}`);
  } catch (error: any) {
    console.error('❌ 创建支付失败:', error.message);
    return c.redirect(`/?error=${encodeURIComponent(error.message)}`);
  }
});

app.get('/order/:id', (c) => {
  const order = orders.get(c.req.param('id'));
  if (!order) {
    return c.html(renderBase(`<div class="card p-6"><h1 class="text-xl text-destructive">订单不存在</h1><a href="/" class="btn-primary mt-4 inline-block">返回首页</a></div>`, '订单不存在'));
  }
  return c.html(renderOrder(order));
});

// ==================== API 路由 ====================

// 查询订单 (by out_trade_no)
app.get('/api/query/:id', async (c) => {
  const orderId = c.req.param('id');
  console.log(`\n🔍 查询订单: ${orderId}`);

  try {
    const result = await wechat.native.query({ out_trade_no: orderId });
    console.log(`✅ 订单状态: ${result.trade_state}`);

    // 更新本地订单状态
    const order = orders.get(orderId);
    if (order) {
      if (result.trade_state === 'SUCCESS') {
        order.status = 'paid';
        order.transaction_id = result.transaction_id;
      } else if (result.trade_state === 'CLOSED') {
        order.status = 'closed';
      } else if (result.trade_state === 'PAYERROR') {
        order.status = 'failed';
      }
      order.updatedAt = new Date();
    }

    return c.json(result);
  } catch (error: any) {
    console.error('❌ 查询订单失败:', error.message);
    return c.json({ error: error.message }, 500);
  }
});

// 查询订单 (by transaction_id)
app.get('/api/query-by-transaction-id/:id', async (c) => {
  const transactionId = c.req.param('id');
  console.log(`\n🔍 通过交易号查询: ${transactionId}`);

  try {
    const result = await wechat.native.queryByTransactionId({ transaction_id: transactionId });
    console.log(`✅ 订单状态: ${result.trade_state}`);
    return c.json(result);
  } catch (error: any) {
    console.error('❌ 查询失败:', error.message);
    return c.json({ error: error.message }, 500);
  }
});

// 关闭订单
app.post('/api/close/:id', async (c) => {
  const orderId = c.req.param('id');
  console.log(`\n❌ 关闭订单: ${orderId}`);

  try {
    await wechat.native.close(orderId);

    const order = orders.get(orderId);
    if (order) {
      order.status = 'closed';
      order.updatedAt = new Date();
    }

    console.log(`✅ 订单已关闭: ${orderId}`);
    return c.json({ success: true });
  } catch (error: any) {
    console.error('❌ 关闭订单失败:', error.message);
    return c.json({ error: error.message }, 500);
  }
});

// 申请退款
app.post('/api/refund', async (c) => {
  const body = await c.req.json();
  const { out_trade_no, amount, reason } = body;

  console.log(`\n💸 申请退款: 订单 ${out_trade_no}, 金额 ¥${amount}`);

  try {
    const order = orders.get(out_trade_no);
    if (!order) {
      return c.json({ error: '订单不存在' }, 404);
    }

    const out_refund_no = generateRefundNo();
    const result = await wechat.native.refund({
      out_trade_no,
      out_refund_no,
      refund: amount,
      total: order.amount / 100,  // 转换回元
      reason: reason || undefined  // 空字符串转为 undefined，避免微信 API 报错
    });

    console.log(`✅ 退款申请成功: ${result.out_refund_no}`);

    // 保存退款记录
    refunds.set(out_refund_no, {
      out_refund_no: result.out_refund_no,
      out_trade_no,
      refund_id: result.refund_id,
      amount: Math.round(amount * 100),
      reason,
      status: result.status,
      createdAt: new Date()
    });

    // 更新订单状态
    if (result.status === 'SUCCESS') {
      order.status = 'refunded';
      order.updatedAt = new Date();
    }

    return c.json(result);
  } catch (error: any) {
    console.error('❌ 退款失败:', error.message);
    return c.json({ error: error.message }, 500);
  }
});

// 查询退款
app.get('/api/refund/:id', async (c) => {
  const outRefundNo = c.req.param('id');
  console.log(`\n🔍 查询退款: ${outRefundNo}`);

  try {
    const result = await wechat.native.queryRefund({ out_refund_no: outRefundNo });
    console.log(`✅ 退款状态: ${result.status}`);

    // 更新本地退款状态
    const refund = refunds.get(outRefundNo);
    if (refund) {
      refund.status = result.status;
    }

    return c.json(result);
  } catch (error: any) {
    console.error('❌ 查询退款失败:', error.message);
    return c.json({ error: error.message }, 500);
  }
});

// 获取交易账单
app.get('/api/bill/trade', async (c) => {
  const bill_date = c.req.query('bill_date');
  const bill_type = c.req.query('bill_type') as any;

  console.log(`\n📄 获取交易账单: ${bill_date}, 类型: ${bill_type}`);

  try {
    const result = await wechat.native.applyTradeBill({ bill_date: bill_date!, bill_type });
    console.log(`✅ 账单链接获取成功`);
    return c.json(result);
  } catch (error: any) {
    console.error('❌ 获取账单失败:', error.message);
    return c.json({ error: error.message }, 500);
  }
});

// 获取资金账单
app.get('/api/bill/fundflow', async (c) => {
  const bill_date = c.req.query('bill_date');
  const account_type = c.req.query('account_type') as any;

  console.log(`\n📄 获取资金账单: ${bill_date}, 账户: ${account_type}`);

  try {
    const result = await wechat.native.applyFundFlowBill({ bill_date: bill_date!, account_type });
    console.log(`✅ 账单链接获取成功`);
    return c.json(result);
  } catch (error: any) {
    console.error('❌ 获取账单失败:', error.message);
    return c.json({ error: error.message }, 500);
  }
});

// Webhook 处理
app.post('/webhook/wechat', async (c) => {
  console.log('\n📨 收到 Webhook');

  try {
    const body = await c.req.text();
    const result = await wechat.webhook.verify({
      headers: c.req.header(),
      body
    });

    if (result.success) {
      console.log(`✅ Webhook 验证成功: ${result.eventType}`);

      if (result.eventType === 'TRANSACTION.SUCCESS') {
        const data = result.decryptedData;
        console.log(`💰 支付成功: 订单 ${data.out_trade_no}, 金额 ¥${(data.amount.total / 100).toFixed(2)}`);

        const order = orders.get(data.out_trade_no);
        if (order) {
          order.status = 'paid';
          order.transaction_id = data.transaction_id;
          order.updatedAt = new Date();
        }
      } else if (result.eventType === 'REFUND.SUCCESS') {
        const data = result.decryptedData;
        console.log(`💸 退款成功: ${data.out_refund_no}`);

        const refund = refunds.get(data.out_refund_no);
        if (refund) {
          refund.status = 'SUCCESS';
        }
      }

      return c.text('OK');
    } else {
      console.error('❌ Webhook 验证失败');
      return c.text('Invalid signature', 400);
    }
  } catch (error: any) {
    console.error('❌ Webhook 处理失败:', error.message);
    return c.text('Internal Server Error', 500);
  }
});

// 启动服务器
const PORT = parseInt(process.env.PORT || '3000');

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║         WeChat Pay Demo Server - Ready!                   ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log(`\n🌐 访问地址: http://localhost:${PORT}`);
console.log(`📱 Webhook: http://localhost:${PORT}/webhook/wechat`);
console.log(`🔧 调试模式: ${process.env.WECHAT_PAY_DEBUG === 'true' ? '开启' : '关闭'}`);
console.log('\n已实现的 API:');
console.log('  POST /create              - 创建支付');
console.log('  GET  /api/query/:id       - 查询订单 (by out_trade_no)');
console.log('  GET  /api/query-by-transaction-id/:id - 查询订单 (by transaction_id)');
console.log('  POST /api/close/:id       - 关闭订单');
console.log('  POST /api/refund          - 申请退款');
console.log('  GET  /api/refund/:id      - 查询退款');
console.log('  GET  /api/bill/trade      - 获取交易账单');
console.log('  GET  /api/bill/fundflow   - 获取资金账单');
console.log('  POST /webhook/wechat      - Webhook 处理\n');

serve({ fetch: app.fetch, port: PORT });
