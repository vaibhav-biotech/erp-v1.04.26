'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FiArrowLeft, FiPrinter, FiDownload } from 'react-icons/fi';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';
import { useAuth } from '@/contexts/AuthContext';

export default function AccountsInvoiceViewPage() {
  const { adminToken } = useAuth();
  const params = useParams<{ invoiceId: string }>();
  const invoiceId = params?.invoiceId;

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!adminToken || !invoiceId) return;
    
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const res = await fetch(buildApiUrl(`/api/accounts/invoices/${invoiceId}`), {
          headers: getApiHeaders(adminToken)
        });
        const data = await res.json();
        
        if (data.success) {
          setInvoice(data.data);
        } else {
          setError(data.message || 'Invoice not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching invoice');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInvoice();
  }, [adminToken, invoiceId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-500">Loading invoice details...</div>;
  }

  if (error || !invoice) {
    return (
      <div className="p-8">
        <Link href="/accounts?page=accounts-invoices" className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 mb-6">
          <FiArrowLeft /> Back to Invoices
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error || 'Invoice not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex justify-between items-center mb-8 print:hidden">
        <Link href="/accounts?page=accounts-invoices" className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
          <FiArrowLeft /> Back to Invoices
        </Link>
        
        <div className="flex gap-3">
          <button 
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white"
          >
            <FiPrinter size={16} /> Print
          </button>
          <button 
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black"
          >
            <FiDownload size={16} /> Save as PDF
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-10 print:border-none print:shadow-none print:p-0">
        <div className="flex justify-between items-start border-b border-gray-100 pb-8 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">INVOICE</h1>
            <p className="text-gray-500 mt-2">#{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-gray-900">{invoice.store?.name || 'Company Name'}</h2>
            <p className="text-gray-500 mt-1 text-sm">Generated on {new Date(invoice.createdAt).toLocaleDateString()}</p>
            {invoice.status && (
              <div className="flex gap-2 justify-end mt-3">
                <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                  invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                  invoice.status === 'failed' ? 'bg-red-100 text-red-800' :
                  invoice.status === 'refunded' ? 'bg-gray-200 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  Pay: {String(invoice.status).replace(/_/g, ' ')}
                </span>
                {invoice.orderStatus && (
                  <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                    invoice.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                    invoice.orderStatus === 'shipped' ? 'bg-blue-100 text-blue-800' :
                    invoice.orderStatus === 'processing' ? 'bg-indigo-100 text-indigo-800' :
                    invoice.orderStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    Ord: {String(invoice.orderStatus).replace(/_/g, ' ')}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between mb-10">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Billed To</p>
            <p className="text-gray-900 font-medium">{invoice.customerName || 'N/A'}</p>
            {invoice.orderId && <p className="text-sm text-gray-500 mt-1">Order Ref: {invoice.orderId}</p>}
          </div>
        </div>

        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Item Description</th>
                <th className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Qty</th>
                <th className="py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Rate</th>
                <th className="py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(invoice.lineItems || []).map((item: any, idx: number) => (
                <tr key={idx}>
                  <td className="py-4 text-sm text-gray-900">{item.name || item.description || 'Item'}</td>
                  <td className="py-4 text-sm text-gray-700 text-center">{item.quantity || 1}</td>
                  <td className="py-4 text-sm text-gray-700 text-right">₹{Number(item.unitPrice || item.rate || 0).toFixed(2)}</td>
                  <td className="py-4 text-sm text-gray-900 font-medium text-right">₹{Number(item.amount || (item.quantity * item.rate) || 0).toFixed(2)}</td>
                </tr>
              ))}
              {(!invoice.lineItems || invoice.lineItems.length === 0) && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-sm text-gray-500">No line items detailed.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <div className="w-64 space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>₹{Number(invoice.subtotal || invoice.total || 0).toFixed(2)}</span>
            </div>
            {invoice.shipping > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Shipping</span>
                <span>₹{Number(invoice.shipping).toFixed(2)}</span>
              </div>
            )}
            {invoice.tax > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tax</span>
                <span>₹{Number(invoice.tax).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-200 pt-3 mt-3">
              <span>Total</span>
              <span>₹{Number(invoice.total || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-100 text-sm text-gray-500">
          <p>This is a computer generated invoice and does not require a physical signature.</p>
        </div>
      </div>
    </div>
  );
}
