'use client';

export default function OrdersPage() {
  return null;
}

/*

import { useEffect, useMemo, useState } from 'react';
import { FiRefreshCw, FiEye, FiFileText } from 'react-icons/fi';
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

interface OrderItem {
  _id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface Order {
  _id: string;
  orderNumber?: string;
  orderId?: string;
  customerId: string;
  items: OrderItem[];
  total: number;
  orderStatus: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: string;
  createdAt: string;
  updatedAt?: string;
  subtotal?: number;
  tax?: number;
  shipping?: number;
  notes?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
  };
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
    lineItems?: Array<{
      name: string;
      quantity: number;
      unitPrice: number;
      amount: number;
    }>;
  };
  statusHistory?: Array<{
    _id?: string;
    status: string;
    note?: string;
    visibility?: string;
    actor?: string;
    createdAt: string;
  }>;
  paymentHistory?: Array<{
    _id?: string;
    status: string;
    note?: string;
    createdAt: string;
  }>;
  trackingUpdates?: Array<{
    _id?: string;
    message: string;
    location?: string;
    visibility?: 'customer' | 'internal';
    createdAt: string;
  }>;
}

const STATUS_OPTIONS: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'returned',
];
const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = ['pending', 'paid', 'failed', 'refunded', 'cod_pending'];

const titleize = (value: string) =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'processing':
      return 'bg-indigo-100 text-indigo-700';
    case 'packed':
      return 'bg-cyan-100 text-cyan-700';
    case 'confirmed':
      return 'bg-blue-100 text-blue-700';
    case 'shipped':
      return 'bg-purple-100 text-purple-700';
    case 'out_for_delivery':
      return 'bg-orange-100 text-orange-700';
    case 'delivered':
      return 'bg-green-100 text-green-700';
    case 'cancelled':
      return 'bg-red-100 text-red-700';
    case 'returned':
      return 'bg-rose-100 text-rose-700';
    default:
      return 'bg-amber-100 text-amber-700';
  }
};

const getPaymentBadge = (status: string) => {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-700';
    case 'failed':
      return 'bg-red-100 text-red-700';
    case 'refunded':
      return 'bg-gray-200 text-gray-700';
    case 'cod_pending':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-yellow-100 text-yellow-700';
  }
};

export default function OrdersPage() {
  const { adminToken } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [isSavingDetail, setIsSavingDetail] = useState(false);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    orderStatus: 'pending' as OrderStatus,
    paymentStatus: 'pending' as PaymentStatus,
    courierName: '',
    trackingNumber: '',
    trackingUrl: '',
    estimatedDelivery: '',
    customerUpdate: '',
    internalNote: '',
    statusNote: '',
    paymentNote: '',
  });

  const totalRevenue = useMemo(
    () => orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0),
    [orders]
  );

  const statusSummary = useMemo(() => {
    return {
      pending: orders.filter((o) => o.orderStatus === 'pending').length,
      processing: orders.filter((o) => ['processing', 'packed', 'confirmed'].includes(o.orderStatus)).length,
      shipped: orders.filter((o) => ['shipped', 'out_for_delivery'].includes(o.orderStatus)).length,
      delivered: orders.filter((o) => o.orderStatus === 'delivered').length,
    };
  }, [orders]);

  const fetchOrders = async (showRefreshLoader = false) => {
    if (!adminToken) return;

    if (showRefreshLoader) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      setError('');
      const response = await fetch(buildApiUrl('/api/orders'), {
        headers: getApiHeaders(adminToken),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to load orders');
      }

      setOrders(payload.data || []);
        const loadOrderDetails = async (orderId: string) => {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setIsLoading(false);
            setDetailLoading(true);
            setDetailError('');
            setSelectedOrderId(orderId);

            const response = await fetch(buildApiUrl(`/api/orders/${orderId}`), {
              headers: getApiHeaders(adminToken),
            });

            const payload = await response.json();
            if (!response.ok || !payload.success) {
              throw new Error(payload.message || 'Failed to load order details');
            }

            const order: Order = payload.data;
            setSelectedOrder(order);
            setUpdateForm({
              orderStatus: (order.orderStatus || 'pending') as OrderStatus,
              paymentStatus: (order.paymentStatus || 'pending') as PaymentStatus,
              courierName: order.tracking?.courierName || '',
              trackingNumber: order.tracking?.trackingNumber || '',
              trackingUrl: order.tracking?.trackingUrl || '',
              estimatedDelivery: order.tracking?.estimatedDelivery
                ? String(order.tracking.estimatedDelivery).slice(0, 10)
                : '',
              customerUpdate: '',
              internalNote: '',
              statusNote: '',
              paymentNote: '',
            });
          } catch (err) {
            setDetailError(err instanceof Error ? err.message : 'Failed to load order details');
            setSelectedOrder(null);
          } finally {
            setDetailLoading(false);
          }
        };

        const handleSaveDetails = async () => {
          if (!adminToken || !selectedOrderId) return;

          try {
            setIsSavingDetail(true);
            setDetailError('');

    }
  };

              body: JSON.stringify({
                orderStatus: updateForm.orderStatus,
                paymentStatus: updateForm.paymentStatus,
                courierName: updateForm.courierName || null,
                trackingNumber: updateForm.trackingNumber || null,
                trackingUrl: updateForm.trackingUrl || null,
                estimatedDelivery: updateForm.estimatedDelivery || null,
                customerUpdate: updateForm.customerUpdate || undefined,
                internalNote: updateForm.internalNote || undefined,
                statusNote: updateForm.statusNote || undefined,
                paymentNote: updateForm.paymentNote || undefined,
                actor: 'store_admin',
              }),
    fetchOrders();
  }, [adminToken]);

  const handleStatusUpdate = async (orderId: string, orderStatus: OrderStatus) => {
              throw new Error(payload.message || 'Failed to update order details');

    try {
            await fetchOrders(true);
            await loadOrderDetails(selectedOrderId);
            setUpdateForm((prev) => ({
              ...prev,
              customerUpdate: '',
              internalNote: '',
              statusNote: '',
              paymentNote: '',
            }));
          } catch (err) {
            setDetailError(err instanceof Error ? err.message : 'Failed to update order details');
          } finally {
            setIsSavingDetail(false);
          }
        };

        const handleGenerateInvoice = async () => {
          if (!adminToken || !selectedOrderId) return;

          try {
            setIsGeneratingInvoice(true);
            setDetailError('');

            const response = await fetch(buildApiUrl(`/api/orders/${selectedOrderId}/invoice`), {
              method: 'POST',
              headers: getApiHeaders(adminToken),
            });

            const payload = await response.json();
            if (!response.ok || !payload.success) {
              throw new Error(payload.message || 'Failed to generate invoice');
            }

            await fetchOrders(true);
            await loadOrderDetails(selectedOrderId);
          } catch (err) {
            setDetailError(err instanceof Error ? err.message : 'Failed to generate invoice');
          } finally {
            setIsGeneratingInvoice(false);
          }
        };

        const handlePrintInvoice = () => {
          if (!selectedOrder?.invoice?.generated) return;

          const invoice = selectedOrder.invoice;
          const orderCode = selectedOrder.orderNumber || selectedOrder.orderId || selectedOrder._id;
          const rows = (invoice.lineItems || [])
            .map(
              (item) =>
                `<tr>
                  <td style="padding:8px;border:1px solid #ddd;">${item.name}</td>
                  <td style="padding:8px;border:1px solid #ddd;text-align:center;">${item.quantity}</td>
                  <td style="padding:8px;border:1px solid #ddd;text-align:right;">₹${Number(item.unitPrice || 0).toFixed(2)}</td>
                  <td style="padding:8px;border:1px solid #ddd;text-align:right;">₹${Number(item.amount || 0).toFixed(2)}</td>
                </tr>`
            )
            .join('');

          const popup = window.open('', '_blank', 'width=900,height=700');
          if (!popup) return;

          popup.document.write(`
            <html>
              <head><title>Invoice ${invoice.invoiceNumber || ''}</title></head>
              <body style="font-family:Arial,sans-serif;padding:24px;color:#111;">
                <h2>Invoice ${invoice.invoiceNumber || ''}</h2>
                <p><strong>Order:</strong> ${orderCode}</p>
                <p><strong>Generated:</strong> ${invoice.generatedAt ? new Date(invoice.generatedAt).toLocaleString() : '-'}</p>
                <table style="width:100%;border-collapse:collapse;margin-top:12px;">
                  <thead>
                    <tr>
                      <th style="padding:8px;border:1px solid #ddd;text-align:left;">Item</th>
                      <th style="padding:8px;border:1px solid #ddd;text-align:center;">Qty</th>
                      <th style="padding:8px;border:1px solid #ddd;text-align:right;">Unit Price</th>
                      <th style="padding:8px;border:1px solid #ddd;text-align:right;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>${rows}</tbody>
                </table>
                <div style="margin-top:16px;max-width:320px;margin-left:auto;">
                  <p style="display:flex;justify-content:space-between;"><span>Subtotal</span><span>₹${Number(invoice.subtotal || 0).toFixed(2)}</span></p>
                  <p style="display:flex;justify-content:space-between;"><span>Tax</span><span>₹${Number(invoice.tax || 0).toFixed(2)}</span></p>
                  <p style="display:flex;justify-content:space-between;"><span>Shipping</span><span>₹${Number(invoice.shipping || 0).toFixed(2)}</span></p>
                  <p style="display:flex;justify-content:space-between;font-weight:bold;"><span>Total</span><span>₹${Number(invoice.total || 0).toFixed(2)}</span></p>
                </div>
                <script>window.print();</script>
              </body>
            </html>
          `);
          popup.document.close();
        };

        const closeDetails = () => {
          setSelectedOrderId(null);
          setSelectedOrder(null);
          setDetailError('');
        };

        const orderId = selectedOrderId;

        return (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                
                <p className="text-sm text-gray-600 mt-1">Track, fulfill, update customer status and generate invoices</p>
              </div>
              <button
                onClick={() => fetchOrders(true)}
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                <FiRefreshCw className={isRefreshing ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs uppercase text-gray-500 font-semibold tracking-wide">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{orders.length}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs uppercase text-gray-500 font-semibold tracking-wide">Pending</p>
                <p className="text-2xl font-bold text-amber-700 mt-2">{statusSummary.pending}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs uppercase text-gray-500 font-semibold tracking-wide">In Fulfillment</p>
                <p className="text-2xl font-bold text-indigo-700 mt-2">{statusSummary.processing}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs uppercase text-gray-500 font-semibold tracking-wide">In Transit</p>
                <p className="text-2xl font-bold text-purple-700 mt-2">{statusSummary.shipped}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs uppercase text-gray-500 font-semibold tracking-wide">Revenue</p>
                <p className="text-2xl font-bold text-green-700 mt-2">₹{totalRevenue.toFixed(2)}</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {isLoading ? (
                <div className="p-12 text-center text-gray-600">Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="p-12 text-center text-gray-600">No orders found yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">Order ID</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">Customer</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">Items</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">Total</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">Order Status</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">Payment</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">Placed On</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => {
                        const orderCode = order.orderNumber || order.orderId || order._id;
                        const normalizedStatus = order.orderStatus || 'pending';
                        const itemsCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

                        return (
                          <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-5 py-4 text-sm font-semibold text-gray-900">{orderCode}</td>
                            <td className="px-5 py-4 text-sm text-gray-700">{order.customerId || 'N/A'}</td>
                            <td className="px-5 py-4 text-sm text-gray-700">{itemsCount}</td>
                            <td className="px-5 py-4 text-sm font-semibold text-gray-900">₹{Number(order.total || 0).toFixed(2)}</td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(normalizedStatus)}`}>
                                {titleize(normalizedStatus)}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${getPaymentBadge(order.paymentStatus || 'pending')}`}>
                                {titleize(order.paymentStatus || 'pending')}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-sm text-gray-700">
                              {order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}
                            </td>
                            <td className="px-5 py-4">
                              <button
                                onClick={() => loadOrderDetails(order._id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-gray-300 text-xs text-gray-700 hover:bg-gray-100"
                              >
                                <FiEye size={13} />
                                Details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {orderId && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Fulfillment: {selectedOrder?.orderNumber || selectedOrder?.orderId || orderId}
                    </h2>
                    <p className="text-sm text-gray-600">Update status, tracking and customer-visible progress</p>
                  </div>
                  <button
                    onClick={closeDetails}
                    className="px-3 py-1.5 rounded border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>

                {detailError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                    {detailError}
                  </div>
                )}

                {detailLoading || !selectedOrder ? (
                  <div className="text-gray-600">Loading order details...</div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase text-gray-600">Order Status</label>
                        <select
                          value={updateForm.orderStatus}
                          onChange={(e) => setUpdateForm((p) => ({ ...p, orderStatus: e.target.value as OrderStatus }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {titleize(status)}
                            </option>
                          ))}
                        </select>
                        <input
                          value={updateForm.statusNote}
                          onChange={(e) => setUpdateForm((p) => ({ ...p, statusNote: e.target.value }))}
                          placeholder="Status note (shown to customer if status changes)"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase text-gray-600">Payment Status</label>
                        <select
                          value={updateForm.paymentStatus}
                          onChange={(e) => setUpdateForm((p) => ({ ...p, paymentStatus: e.target.value as PaymentStatus }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        >
                          {PAYMENT_STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {titleize(status)}
                            </option>
                          ))}
                        </select>
                        <input
                          value={updateForm.paymentNote}
                          onChange={(e) => setUpdateForm((p) => ({ ...p, paymentNote: e.target.value }))}
                          placeholder="Payment note"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        value={updateForm.courierName}
                        onChange={(e) => setUpdateForm((p) => ({ ...p, courierName: e.target.value }))}
                        placeholder="Courier name (e.g. Delhivery)"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                      <input
                        value={updateForm.trackingNumber}
                        onChange={(e) => setUpdateForm((p) => ({ ...p, trackingNumber: e.target.value }))}
                        placeholder="Tracking number"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                      <input
                        value={updateForm.trackingUrl}
                        onChange={(e) => setUpdateForm((p) => ({ ...p, trackingUrl: e.target.value }))}
                        placeholder="Tracking URL"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                      <input
                        type="date"
                        value={updateForm.estimatedDelivery}
                        onChange={(e) => setUpdateForm((p) => ({ ...p, estimatedDelivery: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <textarea
                        value={updateForm.customerUpdate}
                        onChange={(e) => setUpdateForm((p) => ({ ...p, customerUpdate: e.target.value }))}
                        placeholder="Customer update (visible in customer order details)"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[90px]"
                      />
                      <textarea
                        value={updateForm.internalNote}
                        onChange={(e) => setUpdateForm((p) => ({ ...p, internalNote: e.target.value }))}
                        placeholder="Internal team note"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[90px]"
                      />
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={handleSaveDetails}
                        disabled={isSavingDetail}
                        className="px-4 py-2 rounded-lg bg-black text-white text-sm hover:bg-gray-800 disabled:opacity-60"
                      >
                        {isSavingDetail ? 'Saving...' : 'Save Updates'}
                      </button>
                      <button
                        onClick={handleGenerateInvoice}
                        disabled={isGeneratingInvoice}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                      >
                        <FiFileText size={14} />
                        {isGeneratingInvoice ? 'Generating...' : 'Generate Invoice'}
                      </button>
                      {selectedOrder.invoice?.generated && (
                        <button
                          onClick={handlePrintInvoice}
                          className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Print Invoice
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
                        <div className="space-y-3">
                          {(selectedOrder.items || []).map((item) => (
                            <div key={item._id} className="flex justify-between text-sm border-b border-gray-100 pb-2">
                              <span className="text-gray-800">{item.name} × {item.quantity}</span>
                              <span className="font-semibold text-gray-900">₹{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Totals</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>₹{Number(selectedOrder.subtotal || 0).toFixed(2)}</span></div>
                          <div className="flex justify-between"><span className="text-gray-600">Tax</span><span>₹{Number(selectedOrder.tax || 0).toFixed(2)}</span></div>
                          <div className="flex justify-between"><span className="text-gray-600">Shipping</span><span>₹{Number(selectedOrder.shipping || 0).toFixed(2)}</span></div>
                          <div className="flex justify-between font-semibold border-t border-gray-200 pt-2"><span>Total</span><span>₹{Number(selectedOrder.total || 0).toFixed(2)}</span></div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Status Timeline</h3>
                        <div className="space-y-3 max-h-72 overflow-auto pr-1">
                          {(selectedOrder.statusHistory || []).slice().reverse().map((event, idx) => (
                            <div key={`${event._id || idx}`} className="border border-gray-100 rounded-md p-3">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(event.status)}`}>
                                  {titleize(event.status)}
                                </span>
                                <span className="text-xs text-gray-500">{new Date(event.createdAt).toLocaleString()}</span>
                              </div>
                              {event.note && <p className="text-sm text-gray-700">{event.note}</p>}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Tracking & Update Log</h3>
                        <div className="space-y-3 max-h-72 overflow-auto pr-1">
                          {(selectedOrder.trackingUpdates || []).length === 0 ? (
                            <p className="text-sm text-gray-500">No updates added yet.</p>
                          ) : (
                            (selectedOrder.trackingUpdates || []).slice().reverse().map((event, idx) => (
                              <div key={`${event._id || idx}`} className="border border-gray-100 rounded-md p-3">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${event.visibility === 'internal' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {event.visibility === 'internal' ? 'Internal' : 'Customer'}
                                  </span>
                                  <span className="text-xs text-gray-500">{new Date(event.createdAt).toLocaleString()}</span>
                                </div>
                                <p className="text-sm text-gray-700">{event.message}</p>
                                {event.location && <p className="text-xs text-gray-500 mt-1">{event.location}</p>}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        );
      */
