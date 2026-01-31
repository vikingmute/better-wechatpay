'use client';

import { useState, useEffect, useCallback } from 'react';

interface Order {
  id: string;
  description: string;
  amount: number;
  code_url?: string;
  status: 'pending' | 'paid' | 'failed' | 'closed' | 'refunded';
  transaction_id?: string;
  createdAt: string;
}

interface Refund {
  out_refund_no: string;
  out_trade_no: string;
  amount: number;
  reason?: string;
  status: string;
}

type TabType = 'payment' | 'refund' | 'bill' | 'api';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabType>('payment');
  const [orders, setOrders] = useState<Order[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [amount, setAmount] = useState('0.01');
  const [description, setDescription] = useState('测试商品');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  
  // API test states
  const [queryOrderNo, setQueryOrderNo] = useState('');
  const [queryTransactionId, setQueryTransactionId] = useState('');
  const [closeOrderNo, setCloseOrderNo] = useState('');
  const [apiResult, setApiResult] = useState<any>(null);

  // Bill states
  const [billDate, setBillDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  });
  const [billType, setBillType] = useState('ALL');
  const [billResult, setBillResult] = useState<any>(null);

  // Refund modal
  const [refundModal, setRefundModal] = useState<{ orderId: string; maxAmount: number } | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  // Poll for order status
  const pollOrderStatus = useCallback(async (orderId: string) => {
    try {
      const res = await fetch(`/api/wechatpay/query/${orderId}`);
      const data = await res.json();
      
      if (data.trade_state === 'SUCCESS') {
        setOrders(prev => prev.map(o => 
          o.id === orderId ? { ...o, status: 'paid', transaction_id: data.transaction_id } : o
        ));
        setQrCode(null);
        setCurrentOrderId(null);
        return true;
      } else if (data.trade_state === 'CLOSED') {
        setOrders(prev => prev.map(o => 
          o.id === orderId ? { ...o, status: 'closed' } : o
        ));
        setQrCode(null);
        setCurrentOrderId(null);
        return true;
      }
    } catch (e) {
      console.error('Poll failed:', e);
    }
    return false;
  }, []);

  useEffect(() => {
    if (!currentOrderId) return;
    
    const interval = setInterval(async () => {
      const done = await pollOrderStatus(currentOrderId);
      if (done) clearInterval(interval);
    }, 3000);

    return () => clearInterval(interval);
  }, [currentOrderId, pollOrderStatus]);

  const createPayment = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/wechatpay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(amount), description })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to create payment');
      
      const newOrder: Order = {
        id: data.out_trade_no,
        description,
        amount: Math.round(parseFloat(amount) * 100),
        code_url: data.code_url,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      setOrders(prev => [newOrder, ...prev]);
      setQrCode(data.qrCode);
      setCurrentOrderId(data.out_trade_no);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const closeOrder = async (orderId: string) => {
    if (!confirm('确定要关闭这个订单吗？')) return;
    try {
      const res = await fetch(`/api/wechatpay/close/${orderId}`, { method: 'POST' });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'closed' } : o));
        if (currentOrderId === orderId) {
          setQrCode(null);
          setCurrentOrderId(null);
        }
      }
    } catch (e: any) {
      alert('关闭失败: ' + e.message);
    }
  };

  const submitRefund = async () => {
    if (!refundModal) return;
    try {
      const res = await fetch('/api/wechatpay/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          out_trade_no: refundModal.orderId,
          amount: parseFloat(refundAmount),
          reason: refundReason || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setRefunds(prev => [{
        out_refund_no: data.out_refund_no,
        out_trade_no: refundModal.orderId,
        amount: Math.round(parseFloat(refundAmount) * 100),
        reason: refundReason,
        status: data.status
      }, ...prev]);
      
      setOrders(prev => prev.map(o => 
        o.id === refundModal.orderId ? { ...o, status: 'refunded' } : o
      ));
      
      alert('退款申请成功！');
      setRefundModal(null);
    } catch (e: any) {
      alert('退款失败: ' + e.message);
    }
  };

  const queryOrder = async () => {
    if (!queryOrderNo) return alert('请输入订单号');
    const res = await fetch(`/api/wechatpay/query/${queryOrderNo}`);
    setApiResult(await res.json());
  };

  const queryByTransactionIdApi = async () => {
    if (!queryTransactionId) return alert('请输入交易号');
    const res = await fetch(`/api/wechatpay/query-by-transaction-id/${queryTransactionId}`);
    setApiResult(await res.json());
  };

  const closeOrderApi = async () => {
    if (!closeOrderNo) return alert('请输入订单号');
    if (!confirm('确定要关闭订单吗？')) return;
    const res = await fetch(`/api/wechatpay/close/${closeOrderNo}`, { method: 'POST' });
    setApiResult(await res.json());
  };

  const getTradeBill = async () => {
    const res = await fetch(`/api/wechatpay/bill/trade?bill_date=${billDate}&bill_type=${billType}`);
    setBillResult(await res.json());
  };

  const renderTabs = () => (
    <div className="flex gap-2 mb-6 flex-wrap">
      {(['payment', 'refund', 'bill', 'api'] as TabType[]).map(tab => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={activeTab === tab ? 'btn-primary' : 'btn-secondary'}
        >
          {tab === 'payment' ? '支付管理' : tab === 'refund' ? '退款管理' : tab === 'bill' ? '账单下载' : 'API 测试'}
        </button>
      ))}
    </div>
  );

  const renderPaymentTab = () => (
    <div>
      {/* Create Payment */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">创建支付订单</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">金额（元）</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min="0.01"
              step="0.01"
              className="input"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">商品描述</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="input"
            />
          </div>
          <div className="flex items-end">
            <button onClick={createPayment} disabled={loading} className="btn-primary w-full">
              {loading ? '创建中...' : '创建支付'}
            </button>
          </div>
        </div>
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>

      {/* QR Code Display */}
      {qrCode && (
        <div className="card p-6 mb-6 text-center">
          <h2 className="text-lg font-semibold mb-4">扫码支付</h2>
          <img src={qrCode} alt="QR Code" className="mx-auto max-w-xs border-4 border-[var(--primary)] rounded-lg p-4" />
          <p className="text-sm text-[var(--muted-foreground)] mt-4">请使用微信扫描二维码完成支付</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-2">订单号: {currentOrderId}</p>
        </div>
      )}

      {/* Orders List */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">订单列表</h2>
        {orders.length === 0 ? (
          <p className="text-center text-[var(--muted-foreground)] py-8">暂无订单</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-3 px-4 font-medium">订单号</th>
                  <th className="text-left py-3 px-4 font-medium">描述</th>
                  <th className="text-left py-3 px-4 font-medium">金额</th>
                  <th className="text-left py-3 px-4 font-medium">状态</th>
                  <th className="text-left py-3 px-4 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className="border-b border-[var(--border)]">
                    <td className="py-3 px-4 font-mono text-xs">{order.id}</td>
                    <td className="py-3 px-4">{order.description}</td>
                    <td className="py-3 px-4 font-semibold">¥{(order.amount / 100).toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium status-${order.status}`}>
                        {order.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {order.status === 'pending' && (
                          <button onClick={() => closeOrder(order.id)} className="btn-destructive text-xs">关闭</button>
                        )}
                        {order.status === 'paid' && (
                          <button 
                            onClick={() => {
                              setRefundModal({ orderId: order.id, maxAmount: order.amount });
                              setRefundAmount((order.amount / 100).toFixed(2));
                            }} 
                            className="btn-secondary text-xs"
                          >
                            退款
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderRefundTab = () => (
    <div className="card p-6">
      <h2 className="text-lg font-semibold mb-4">退款记录</h2>
      {refunds.length === 0 ? (
        <p className="text-center text-[var(--muted-foreground)] py-8">暂无退款记录</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-3 px-4 font-medium">退款单号</th>
                <th className="text-left py-3 px-4 font-medium">订单号</th>
                <th className="text-left py-3 px-4 font-medium">金额</th>
                <th className="text-left py-3 px-4 font-medium">原因</th>
                <th className="text-left py-3 px-4 font-medium">状态</th>
              </tr>
            </thead>
            <tbody>
              {refunds.map(refund => (
                <tr key={refund.out_refund_no} className="border-b border-[var(--border)]">
                  <td className="py-3 px-4 font-mono text-xs">{refund.out_refund_no}</td>
                  <td className="py-3 px-4 font-mono text-xs">{refund.out_trade_no}</td>
                  <td className="py-3 px-4 font-semibold">¥{(refund.amount / 100).toFixed(2)}</td>
                  <td className="py-3 px-4">{refund.reason || '-'}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium status-paid">
                      {refund.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderBillTab = () => (
    <div className="card p-6">
      <h2 className="text-lg font-semibold mb-4">账单下载</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="text-sm font-medium block mb-1">账单日期</label>
          <input
            type="date"
            value={billDate}
            onChange={e => setBillDate(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">账单类型</label>
          <select value={billType} onChange={e => setBillType(e.target.value)} className="input">
            <option value="ALL">全部</option>
            <option value="SUCCESS">成功</option>
            <option value="REFUND">退款</option>
          </select>
        </div>
        <div className="flex items-end">
          <button onClick={getTradeBill} className="btn-primary w-full">获取账单</button>
        </div>
      </div>
      {billResult && (
        <pre className="bg-[var(--muted)] p-4 rounded-lg text-xs overflow-x-auto">
          {JSON.stringify(billResult, null, 2)}
        </pre>
      )}
    </div>
  );

  const renderApiTab = () => (
    <div className="card p-6">
      <h2 className="text-lg font-semibold mb-4">API 测试</h2>
      <div className="space-y-6">
        <div className="border-b border-[var(--border)] pb-6">
          <h3 className="font-medium mb-3">通过商户订单号查询</h3>
          <div className="flex gap-4">
            <input
              type="text"
              value={queryOrderNo}
              onChange={e => setQueryOrderNo(e.target.value)}
              placeholder="输入商户订单号"
              className="input flex-1"
            />
            <button onClick={queryOrder} className="btn-primary">查询</button>
          </div>
        </div>
        
        <div className="border-b border-[var(--border)] pb-6">
          <h3 className="font-medium mb-3">通过微信交易号查询</h3>
          <div className="flex gap-4">
            <input
              type="text"
              value={queryTransactionId}
              onChange={e => setQueryTransactionId(e.target.value)}
              placeholder="输入微信交易号"
              className="input flex-1"
            />
            <button onClick={queryByTransactionIdApi} className="btn-primary">查询</button>
          </div>
        </div>
        
        <div className="pb-6">
          <h3 className="font-medium mb-3">关闭订单</h3>
          <div className="flex gap-4">
            <input
              type="text"
              value={closeOrderNo}
              onChange={e => setCloseOrderNo(e.target.value)}
              placeholder="输入要关闭的订单号"
              className="input flex-1"
            />
            <button onClick={closeOrderApi} className="btn-destructive">关闭</button>
          </div>
        </div>
      </div>
      
      {apiResult && (
        <div className="mt-6">
          <h3 className="font-medium mb-2">API 响应</h3>
          <pre className="bg-[var(--muted)] p-4 rounded-lg text-xs overflow-x-auto">
            {JSON.stringify(apiResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div className="card p-6 mb-6">
        <h1 className="text-2xl font-semibold">WeChat Pay Demo</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">Next.js 版本 - 完整的微信支付 SDK 功能演示</p>
      </div>

      {renderTabs()}

      {activeTab === 'payment' && renderPaymentTab()}
      {activeTab === 'refund' && renderRefundTab()}
      {activeTab === 'bill' && renderBillTab()}
      {activeTab === 'api' && renderApiTab()}

      {/* Refund Modal */}
      {refundModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">申请退款</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">退款金额（元）</label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={e => setRefundAmount(e.target.value)}
                  max={(refundModal.maxAmount / 100).toFixed(2)}
                  min="0.01"
                  step="0.01"
                  className="input"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">退款原因（可选）</label>
                <input
                  type="text"
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  placeholder="如：商品售后退款"
                  className="input"
                />
              </div>
              <div className="flex gap-4">
                <button onClick={submitRefund} className="btn-primary flex-1">确认退款</button>
                <button onClick={() => setRefundModal(null)} className="btn-secondary flex-1">取消</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
