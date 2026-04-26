'use client';

import { useEffect, useMemo, useState } from 'react';
import { FiEye, FiFileText, FiRefreshCw } from 'react-icons/fi';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';
import { useAuth } from '@/contexts/AuthContext';

type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned';

type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'cod_pending';

interface Order {
  _id: string;
  orderNumber?: string;
  orderId?: string;
  customerId: string;
  items: Array<{ _id: string; name: string; quantity: number; price: number }>;
  total: number;
  orderStatus: OrderStatus;
  paymentStatus?: PaymentStatus;
  createdAt: string;
  subtotal?: number;
  tax?: number;
  shipping?: number;
  tracking?: {
    courierName?: string | null;
    trackingNumber?: string | null;
    trackingUrl?: string | null;
    estimatedDelivery?: string | null;
  };
  invoice?: {
    generated?: boolean;
    invoiceNumber?: string | null;
    generatedAt?: string | null;
    subtotal?: number;
    tax?: number;
    shipping?: number;
    total?: number;
    lineItems?: Array<{ name: string; quantity: number; unitPrice: number; amount: number }>;
  };
  statusHistory?: Array<{ _id?: string; status: string; note?: string; createdAt: string }>;
  trackingUpdates?: Array<{ _id?: string; message: string; location?: string; visibility?: 'customer' | 'internal'; createdAt: string }>;
}

const ORDER_STATUS_OPTIONS: OrderStatus[] = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];
const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = ['pending', 'paid', 'failed', 'refunded', 'cod_pending'];

const titleize = (value: string) => String(value || '').replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'processing': return 'bg-indigo-100 text-indigo-700';
    case 'packed': return 'bg-cyan-100 text-cyan-700';
    case 'confirmed': return 'bg-blue-100 text-blue-700';
    case 'shipped': return 'bg-purple-100 text-purple-700';
    case 'out_for_delivery': return 'bg-orange-100 text-orange-700';
    case 'delivered': return 'bg-green-100 text-green-700';
    case 'cancelled': return 'bg-red-100 text-red-700';
    case 'returned': return 'bg-rose-100 text-rose-700';
    default: return 'bg-amber-100 text-amber-700';
  }
};

const getPaymentBadge = (status: string) => {
  switch (status) {
    case 'paid': return 'bg-green-100 text-green-700';
    case 'failed': return 'bg-red-100 text-red-700';
    case 'refunded': return 'bg-gray-200 text-gray-700';
    case 'cod_pending': return 'bg-amber-100 text-amber-700';
    default: return 'bg-yellow-100 text-yellow-700';
  }
};

export default function OrdersManagementPage() {
  const { adminToken } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);

  const [form, setForm] = useState({
    orderStatus: 'pending' as OrderStatus,
    paymentStatus: 'pending' as PaymentStatus,
    courierName: '',
    trackingNumber: '',
    trackingUrl: '',
    estimatedDelivery: '',
    statusNote: '',
    paymentNote: '',
    customerUpdate: '',
    internalNote: '',
  });

  const totalRevenue = useMemo(() => orders.reduce((sum, o) => sum + Number(o.total || 0), 0), [orders]);
  const summary = useMemo(() => ({
    pending: orders.filter((o) => o.orderStatus === 'pending').length,
    fulfillment: orders.filter((o) => ['confirmed', 'processing', 'packed'].includes(o.orderStatus)).length,
    transit: orders.filter((o) => ['shipped', 'out_for_delivery'].includes(o.orderStatus)).length,
    delivered: orders.filter((o) => o.orderStatus === 'delivered').length,
  }), [orders]);

  const fetchOrders = async (refresh = false) => {
    if (!adminToken) return;
    if (refresh) setIsRefreshing(true); else setIsLoading(true);

    try {
      setError('');
      const res = await fetch(buildApiUrl('/api/orders'), { headers: getApiHeaders(adminToken) });
      const payload = await res.json();
      if (!res.ok || !payload.success) throw new Error(payload.message || 'Failed to load orders');
      setOrders(payload.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadOrderDetails = async (orderId: string) => {
    if (!adminToken) return;
    try {
      setDetailLoading(true);
      setDetailError('');
      setSelectedOrderId(orderId);
      const res = await fetch(buildApiUrl(`/api/orders/${orderId}`), { headers: getApiHeaders(adminToken) });
      const payload = await res.json();
      if (!res.ok || !payload.success) throw new Error(payload.message || 'Failed to load order details');
      const order: Order = payload.data;
      setSelectedOrder(order);
      setForm({
        orderStatus: (order.orderStatus || 'pending') as OrderStatus,
        paymentStatus: (order.paymentStatus || 'pending') as PaymentStatus,
        courierName: order.tracking?.courierName || '',
        trackingNumber: order.tracking?.trackingNumber || '',
        trackingUrl: order.tracking?.trackingUrl || '',
        estimatedDelivery: order.tracking?.estimatedDelivery ? String(order.tracking.estimatedDelivery).slice(0, 10) : '',
        statusNote: '', paymentNote: '', customerUpdate: '', internalNote: '',
      });
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'Failed to load order details');
      setSelectedOrder(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const saveOrderUpdates = async () => {
    if (!adminToken || !selectedOrderId) return;
    try {
      setIsSaving(true);
      setDetailError('');
      const res = await fetch(buildApiUrl(`/api/orders/${selectedOrderId}`), {
        method: 'PATCH',
        headers: getApiHeaders(adminToken),
        body: JSON.stringify({
          orderStatus: form.orderStatus,
          paymentStatus: form.paymentStatus,
          courierName: form.courierName || null,
          trackingNumber: form.trackingNumber || null,
          trackingUrl: form.trackingUrl || null,
          estimatedDelivery: form.estimatedDelivery || null,
          statusNote: form.statusNote || undefined,
          paymentNote: form.paymentNote || undefined,
          customerUpdate: form.customerUpdate || undefined,
          internalNote: form.internalNote || undefined,
          actor: 'store_admin',
        }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) throw new Error(payload.message || 'Failed to update order');
      await fetchOrders(true);
      await loadOrderDetails(selectedOrderId);
      setForm((prev) => ({ ...prev, statusNote: '', paymentNote: '', customerUpdate: '', internalNote: '' }));
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'Failed to update order');
    } finally {
      setIsSaving(false);
    }
  };

  const generateInvoice = async () => {
    if (!adminToken || !selectedOrderId) return;
    try {
      setIsGeneratingInvoice(true);
      setDetailError('');
      const res = await fetch(buildApiUrl(`/api/orders/${selectedOrderId}/invoice`), { method: 'POST', headers: getApiHeaders(adminToken) });
      const payload = await res.json();
      if (!res.ok || !payload.success) throw new Error(payload.message || 'Failed to generate invoice');
      await fetchOrders(true);
      await loadOrderDetails(selectedOrderId);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'Failed to generate invoice');
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const printInvoice = () => {
    if (!selectedOrder?.invoice?.generated) return;
    const invoice = selectedOrder.invoice;
    const orderCode = selectedOrder.orderNumber || selectedOrder.orderId || selectedOrder._id;
    const rows = (invoice.lineItems || []).map((item) => `<tr><td style="padding:8px;border:1px solid #ddd;">${item.name}</td><td style="padding:8px;border:1px solid #ddd;text-align:center;">${item.quantity}</td><td style="padding:8px;border:1px solid #ddd;text-align:right;">₹${Number(item.unitPrice || 0).toFixed(2)}</td><td style="padding:8px;border:1px solid #ddd;text-align:right;">₹${Number(item.amount || 0).toFixed(2)}</td></tr>`).join('');
    const popup = window.open('', '_blank', 'width=900,height=700');
    if (!popup) return;
    popup.document.write(`<html><head><title>Invoice ${invoice.invoiceNumber || ''}</title></head><body style="font-family:Arial,sans-serif;padding:24px;color:#111;"><h2>Invoice ${invoice.invoiceNumber || ''}</h2><p><strong>Order:</strong> ${orderCode}</p><p><strong>Generated:</strong> ${invoice.generatedAt ? new Date(invoice.generatedAt).toLocaleString() : '-'}</p><table style="width:100%;border-collapse:collapse;margin-top:12px;"><thead><tr><th style="padding:8px;border:1px solid #ddd;text-align:left;">Item</th><th style="padding:8px;border:1px solid #ddd;text-align:center;">Qty</th><th style="padding:8px;border:1px solid #ddd;text-align:right;">Unit Price</th><th style="padding:8px;border:1px solid #ddd;text-align:right;">Amount</th></tr></thead><tbody>${rows}</tbody></table><div style="margin-top:16px;max-width:320px;margin-left:auto;"><p style="display:flex;justify-content:space-between;"><span>Subtotal</span><span>₹${Number(invoice.subtotal || 0).toFixed(2)}</span></p><p style="display:flex;justify-content:space-between;"><span>Tax</span><span>₹${Number(invoice.tax || 0).toFixed(2)}</span></p><p style="display:flex;justify-content:space-between;"><span>Shipping</span><span>₹${Number(invoice.shipping || 0).toFixed(2)}</span></p><p style="display:flex;justify-content:space-between;font-weight:bold;"><span>Total</span><span>₹${Number(invoice.total || 0).toFixed(2)}</span></p></div><script>window.print();</script></body></html>`);
    popup.document.close();
  };

  useEffect(() => {
    fetchOrders();
  }, [adminToken]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-600 mt-1">Fulfill orders, update tracking and generate invoices</p>
        </div>
        <button onClick={() => fetchOrders(true)} disabled={isRefreshing} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
          <FiRefreshCw className={isRefreshing ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs uppercase text-gray-500 font-semibold">Total</p><p className="text-2xl font-bold mt-2">{orders.length}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs uppercase text-gray-500 font-semibold">Pending</p><p className="text-2xl font-bold text-amber-700 mt-2">{summary.pending}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs uppercase text-gray-500 font-semibold">Fulfillment</p><p className="text-2xl font-bold text-indigo-700 mt-2">{summary.fulfillment}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs uppercase text-gray-500 font-semibold">Transit</p><p className="text-2xl font-bold text-purple-700 mt-2">{summary.transit}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs uppercase text-gray-500 font-semibold">Revenue</p><p className="text-2xl font-bold text-green-700 mt-2">₹{totalRevenue.toFixed(2)}</p></div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? <div className="p-12 text-center text-gray-600">Loading orders...</div> : orders.length === 0 ? <div className="p-12 text-center text-gray-600">No orders found yet.</div> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-700">Order</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-700">Customer</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-700">Items</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-700">Total</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-700">Order Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-700">Payment</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-700">Placed On</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const code = order.orderNumber || order.orderId || order._id;
                  const itemsCount = (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
                  return (
                    <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-5 py-4 text-sm font-semibold text-gray-900">{code}</td>
                      <td className="px-5 py-4 text-sm text-gray-700">{order.customerId}</td>
                      <td className="px-5 py-4 text-sm text-gray-700">{itemsCount}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-gray-900">₹{Number(order.total || 0).toFixed(2)}</td>
                      <td className="px-5 py-4"><span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(order.orderStatus || 'pending')}`}>{titleize(order.orderStatus || 'pending')}</span></td>
                      <td className="px-5 py-4"><span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${getPaymentBadge(order.paymentStatus || 'pending')}`}>{titleize(order.paymentStatus || 'pending')}</span></td>
                      <td className="px-5 py-4 text-sm text-gray-700">{order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}</td>
                      <td className="px-5 py-4"><button onClick={() => loadOrderDetails(order._id)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-gray-300 text-xs text-gray-700 hover:bg-gray-100"><FiEye size={13} /> Details</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedOrderId && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Order Fulfillment Panel</h2>
            <button onClick={() => { setSelectedOrderId(null); setSelectedOrder(null); setDetailError(''); }} className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50">Close</button>
          </div>

          {detailError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{detailError}</div>}

          {detailLoading || !selectedOrder ? <div className="text-gray-600">Loading details...</div> : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-gray-600">Order Status</label>
                  <select value={form.orderStatus} onChange={(e) => setForm((p) => ({ ...p, orderStatus: e.target.value as OrderStatus }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">{ORDER_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{titleize(status)}</option>)}</select>
                  <input value={form.statusNote} onChange={(e) => setForm((p) => ({ ...p, statusNote: e.target.value }))} placeholder="Status note" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-gray-600">Payment Status</label>
                  <select value={form.paymentStatus} onChange={(e) => setForm((p) => ({ ...p, paymentStatus: e.target.value as PaymentStatus }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">{PAYMENT_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{titleize(status)}</option>)}</select>
                  <input value={form.paymentNote} onChange={(e) => setForm((p) => ({ ...p, paymentNote: e.target.value }))} placeholder="Payment note" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input value={form.courierName} onChange={(e) => setForm((p) => ({ ...p, courierName: e.target.value }))} placeholder="Courier" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                <input value={form.trackingNumber} onChange={(e) => setForm((p) => ({ ...p, trackingNumber: e.target.value }))} placeholder="Tracking number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                <input value={form.trackingUrl} onChange={(e) => setForm((p) => ({ ...p, trackingUrl: e.target.value }))} placeholder="Tracking URL" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                <input type="date" value={form.estimatedDelivery} onChange={(e) => setForm((p) => ({ ...p, estimatedDelivery: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <textarea value={form.customerUpdate} onChange={(e) => setForm((p) => ({ ...p, customerUpdate: e.target.value }))} placeholder="Customer update (visible to customer)" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[84px]" />
                <textarea value={form.internalNote} onChange={(e) => setForm((p) => ({ ...p, internalNote: e.target.value }))} placeholder="Internal update" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[84px]" />
              </div>

              <div className="flex flex-wrap gap-3">
                <button onClick={saveOrderUpdates} disabled={isSaving} className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 disabled:opacity-60">{isSaving ? 'Saving...' : 'Save Updates'}</button>
                <button onClick={generateInvoice} disabled={isGeneratingInvoice} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"><FiFileText size={14} /> {isGeneratingInvoice ? 'Generating...' : 'Generate Invoice'}</button>
                {selectedOrder.invoice?.generated && <button onClick={printInvoice} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Print Invoice</button>}
              </div>
            </>
            )}
          </div>
        )}
      </div>
    );
  }
