'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiMapPin,
  FiPackage,
  FiTruck,
} from 'react-icons/fi';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';
import { useAuth } from '@/contexts/AuthContext';
import GenerateInvoiceModal from '@/components/GenerateInvoiceModal';

interface OrderItem {
  productId?: string;
  name?: string;
  quantity: number;
  price: number;
  image?: string;
  variant?: {
    size?: string;
    color?: string;
  };
}

interface OrderData {
  _id: string;
  orderNumber?: string;
  orderId?: string;
  customerId: string;
  customerEmail?: string;
  customerName?: string;
  items: OrderItem[];
  total: number;
  subtotal?: number;
  shipping?: number;
  shippingCost?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  orderStatus?: string;
  createdAt?: string;
  paymentDate?: string;
  shippingAddress?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
  tracking?: {
    courierName?: string;
    carrier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    estimatedDelivery?: string;
    estimatedDeliveryDate?: string;
  };
  invoice?: {
    generated?: boolean;
    invoiceNumber?: string;
    generatedAt?: string;
  };
  statusHistory?: Array<{ status: string; note?: string; createdAt?: string }>;
  trackingUpdates?: Array<{ message?: string; title?: string; description?: string; location?: string; createdAt?: string }>;
}

const ORDER_STATUS_OPTIONS = [
  'pending',
  'confirmed',
  'processing',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'returned',
] as const;

const PAYMENT_STATUS_OPTIONS = ['pending', 'paid', 'failed', 'refunded', 'cod_pending'] as const;

const titleize = (value: string) =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());

const getStepIcon = (status: string) => {
  if (status === 'delivered') return <FiCheckCircle className="text-green-600" />;
  if (['shipped', 'out_for_delivery'].includes(status)) return <FiTruck className="text-purple-600" />;
  if (['processing', 'packed'].includes(status)) return <FiPackage className="text-blue-600" />;
  return <FiClock className="text-gray-500" />;
};

export default function AccountsOrderDetailsPage() {
  const { adminToken } = useAuth();
  const params = useParams<{ orderId: string }>();
  const orderId = params?.orderId;

  const [order, setOrder] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  const [isDatesModalOpen, setIsDatesModalOpen] = useState(false);
  const [modalPaymentDate, setModalPaymentDate] = useState('');
  const [modalOrderDate, setModalOrderDate] = useState('');

  const [orderStatus, setOrderStatus] = useState('pending');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState('');
  const [customerUpdate, setCustomerUpdate] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [shippingCharge, setShippingCharge] = useState('');
  const [discount, setDiscount] = useState('');

  const itemCount = useMemo(
    () => (order?.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [order]
  );

  const loadOrder = async () => {
    if (!adminToken || !orderId) return;

    try {
      setIsLoading(true);
      setError('');

      const response = await fetch(buildApiUrl(`/api/accounts/orders/${orderId}`), {
        headers: getApiHeaders(adminToken),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to fetch order details');
      }

      const nextOrder: OrderData = payload.data;
      setOrder(nextOrder);

      setOrderStatus(nextOrder.orderStatus || 'pending');
      setPaymentStatus(nextOrder.paymentStatus || 'pending');
      setCarrier(nextOrder.tracking?.courierName || nextOrder.tracking?.carrier || '');
      setTrackingNumber(nextOrder.tracking?.trackingNumber || '');
      setTrackingUrl(nextOrder.tracking?.trackingUrl || '');
      setEstimatedDeliveryDate(
        (nextOrder.tracking?.estimatedDelivery || nextOrder.tracking?.estimatedDeliveryDate)
          ? String(nextOrder.tracking?.estimatedDelivery || nextOrder.tracking?.estimatedDeliveryDate).slice(0, 10)
          : ''
      );
      setShippingCharge((nextOrder.shipping ?? nextOrder.shippingCost ?? 0).toString());
      setDiscount(((nextOrder as any).discount ?? 0).toString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch order details');
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [adminToken, orderId]);

  const handleUpdateClick = () => {
    if (paymentStatus === 'paid' && order?.paymentStatus !== 'paid') {
      setModalPaymentDate(order?.paymentDate ? new Date(order.paymentDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
      setModalOrderDate(order?.createdAt ? new Date(order.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
      setIsDatesModalOpen(true);
    } else {
      saveOrderUpdates();
    }
  };

  const saveOrderUpdates = async (overridePaymentDate?: string, overrideCreatedAt?: string) => {
    if (!adminToken || !orderId) return;

    try {
      setIsSaving(true);
      setMessage('');
      setError('');

      const body: Record<string, string> = {
        orderStatus,
        paymentStatus,
        courierName: carrier,
        trackingNumber,
        trackingUrl,
      };

      if (overridePaymentDate) body.paymentDate = overridePaymentDate;
      if (overrideCreatedAt) body.createdAt = overrideCreatedAt;

      if (estimatedDeliveryDate) body.estimatedDelivery = estimatedDeliveryDate;
      if (customerUpdate.trim()) body.customerUpdate = customerUpdate.trim();
      if (internalNote.trim()) body.internalNote = internalNote.trim();
      if (shippingCharge !== '') body.shipping = shippingCharge;
      if (discount !== '') body.discount = discount;

      const response = await fetch(buildApiUrl(`/api/accounts/orders/${orderId}`), {
        method: 'PATCH',
        headers: getApiHeaders(adminToken),
        body: JSON.stringify(body),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to update order');
      }
      setOrder(payload.data);
      setMessage('Order updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update order');
    } finally {
      setIsSaving(false);
    }
  };

  const printInvoice = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-600">
        <p>Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8">
        <Link
          href="/accounts?page=accounts-orders"
          className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
        >
          <FiArrowLeft /> Back to Orders
        </Link>
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error || 'Order not found'}
        </div>
      </div>
    );
  }

  const fullName =
    [order.shippingAddress?.firstName, order.shippingAddress?.lastName].filter(Boolean).join(' ') ||
    order.customerName ||
    'Customer';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/accounts?page=accounts-orders"
            className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
          >
            <FiArrowLeft /> Back to Orders
          </Link>
          
          <p className="text-sm text-gray-600 mt-1">Placed {order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsInvoiceModalOpen(true)}
            disabled={order.invoice?.generated}
            className={`px-4 py-2 rounded-lg border text-sm flex items-center gap-2 ${
              order.invoice?.generated
                ? 'bg-green-50 border-green-200 text-green-700 cursor-not-allowed'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {order.invoice?.generated ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Invoice Generated {order.invoice?.invoiceNumber ? `(${order.invoice.invoiceNumber})` : ''}
              </>
            ) : 'Generate Invoice Preview'}
          </button>
          <button
            onClick={printInvoice}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
          >
            Print
          </button>
          <button
            onClick={handleUpdateClick}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm hover:bg-black"
          >
            {isSaving ? 'Saving...' : 'Save Updates'}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}
      {message && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">{message}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipment Tracking</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Order Status</label>
                <select
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {ORDER_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {titleize(status)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {PAYMENT_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {titleize(status)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Courier</label>
                <input
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Delhivery / Blue Dart / DTDC"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Tracking Number</label>
                <input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="AWB / Tracking ID"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Tracking URL</label>
                <input
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Estimated Delivery</label>
                <input
                  type="date"
                  value={estimatedDeliveryDate}
                  onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Customer Update</label>
                <textarea
                  value={customerUpdate}
                  onChange={(e) => setCustomerUpdate(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Message visible to customer"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Internal Note</label>
                <textarea
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Private note for admins"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items ({itemCount})</h2>
            <div className="space-y-3">
              {(order.items || []).map((item, index) => (
                <div key={`${item.productId || index}-${index}`} className="flex items-start justify-between border border-gray-100 rounded-lg p-3">
                  <div>
                    <p className="font-medium text-gray-900">{item.name || item.productId || 'Product'}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Qty: {item.quantity} · Unit: ₹{Number(item.price || 0).toFixed(2)}
                    </p>
                    {(item.variant?.size || item.variant?.color) && (
                      <p className="text-xs text-gray-500 mt-1">
                        {item.variant?.size ? `Size: ${item.variant.size}` : ''}
                        {item.variant?.size && item.variant?.color ? ' · ' : ''}
                        {item.variant?.color ? `Color: ${item.variant.color}` : ''}
                      </p>
                    )}
                  </div>
                  <p className="font-semibold text-gray-900">₹{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
            <div className="space-y-3">
              {[...(order.statusHistory || [])]
                .slice()
                .reverse()
                .map((event, idx) => (
                  <div key={`${event.status}-${idx}`} className="flex gap-3">
                    <div className="mt-0.5">{getStepIcon(event.status)}</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{titleize(event.status)}</p>
                      {event.note ? <p className="text-sm text-gray-600">{event.note}</p> : null}
                      <p className="text-xs text-gray-500 mt-1">{event.createdAt ? new Date(event.createdAt).toLocaleString() : '-'}</p>
                    </div>
                  </div>
                ))}

              {(order.trackingUpdates || []).length > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Tracking Notes</p>
                  <div className="space-y-2">
                    {(order.trackingUpdates || [])
                      .slice()
                      .reverse()
                      .map((event, idx) => (
                        <div key={`${event.title || 'update'}-${idx}`} className="text-sm text-gray-700">
                          <p className="font-medium">{event.message || event.title || 'Update'}</p>
                          {event.location ? <p className="text-gray-600">{event.location}</p> : null}
                          {!event.location && event.description ? <p className="text-gray-600">{event.description}</p> : null}
                          <p className="text-xs text-gray-500 mt-0.5">{event.createdAt ? new Date(event.createdAt).toLocaleString() : '-'}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer</h2>
            <div className="space-y-2 text-sm text-gray-700">
              <p className="font-semibold text-gray-900">{fullName}</p>
              <p>{order.shippingAddress?.email || order.customerEmail || '-'}</p>
              <p>{order.shippingAddress?.phone || '-'}</p>
              <p className="text-xs text-gray-500">ID: {order.customerId}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiMapPin /> Shipping Address
            </h2>
            <div className="text-sm text-gray-700 space-y-1">
              <p>{order.shippingAddress?.address || '-'}</p>
              <p>
                {[order.shippingAddress?.city, order.shippingAddress?.state, order.shippingAddress?.postalCode]
                  .filter(Boolean)
                  .join(', ') || '-'}
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiFileText /> Billing
            </h2>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex justify-between items-center">
                <span>Subtotal</span>
                <span>₹{Number(order.subtotal || order.total || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Shipping</span>
                <div className="flex items-center gap-1">
                  <span>₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={shippingCharge}
                    onChange={(e) => setShippingCharge(e.target.value)}
                    className="w-20 border border-gray-300 rounded px-2 py-1 text-right text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Discount</span>
                <div className="flex items-center gap-1">
                  <span>₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-20 border border-gray-300 rounded px-2 py-1 text-right text-sm"
                  />
                </div>
              </div>
              <div className="border-t border-gray-100 pt-2 flex justify-between font-semibold text-gray-900">
                <span>Total</span>
                <span>₹{Number(order.total || 0).toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-500 pt-2">Payment Method: {titleize(order.paymentMethod || 'cod')}</p>
              <p className="text-xs text-gray-500">Payment Status: {titleize(order.paymentStatus || 'pending')}</p>
              {order.invoice?.generatedAt && (
                <p className="text-xs text-green-700 pt-1">
                  Invoice {order.invoice.invoiceNumber || ''} generated on{' '}
                  {new Date(order.invoice.generatedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <GenerateInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        onSuccess={(updatedOrder) => {
          setOrder(updatedOrder);
          setMessage('Invoice generated successfully!');
          setTimeout(() => setMessage(''), 3000);
        }}
        order={order}
        isAccountantMode={true}
      />

      {/* Dates Confirmation Modal */}
      {isDatesModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-playfair font-bold text-gray-900 mb-4">Confirm Dates</h2>
            <p className="text-sm text-gray-500 mb-4">Please confirm or update the payment and order dates before marking this order as paid.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Order Date</label>
                <input type="date" value={modalOrderDate} onChange={e => setModalOrderDate(e.target.value)} className="w-full border-gray-300 rounded-lg p-2 border focus:ring-black focus:border-black" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Date</label>
                <input type="date" value={modalPaymentDate} onChange={e => setModalPaymentDate(e.target.value)} className="w-full border-gray-300 rounded-lg p-2 border focus:ring-black focus:border-black" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setIsDatesModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200 shadow-sm transition-colors">Cancel</button>
              <button onClick={() => {
                setIsDatesModalOpen(false);
                saveOrderUpdates(modalPaymentDate, modalOrderDate);
              }} className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-sm transition-colors">Confirm & Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
