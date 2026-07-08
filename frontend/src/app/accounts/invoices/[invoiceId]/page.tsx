'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { FiArrowLeft, FiPrinter, FiDownload } from 'react-icons/fi';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';
import { useAuth } from '@/contexts/AuthContext';
import { numberToWords } from '@/utils/numberToWords';

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

  const billDate = new Date(invoice.createdAt || invoice.generatedAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).toUpperCase().replace(/ /g, ' - ');

  const netTotal = Number(invoice.total || 0);
  const paymentDateStr = invoice.paymentDate ? new Date(invoice.paymentDate).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  }).toUpperCase().replace(/ /g, ' - ') : 'PENDING';
  const storeNameStr = invoice.storeName || 'PLANTS IN GARDEN';

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

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}} />

      <div className="bg-white border border-gray-300 p-8 print:p-2 print:border-none font-sans max-w-[800px] mx-auto text-black print:w-full print:max-w-none">
        {/* Header */}
        <div className="border-b-2 border-green-700 pb-2 mb-2 text-center text-gray-800">
          <h1 className="text-3xl text-[#7cb342] uppercase mb-1 font-bold tracking-widest" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
            {storeNameStr}
          </h1>
          <p className="text-xs font-semibold text-gray-800">Nursery :- Near Add.: Masoba Phata, Khatate Wasti, Peth Gaon Road, Sortapwadi, Pune Solapur Highway, Maharashtra 412110 India</p>
          <p className="text-xs text-gray-800">Website – Plantingarden.com</p>
          <div className="flex justify-between mt-2 text-xs font-bold px-4">
            <p>Mob No. : +91 7840996890</p>
            <p>Email : <a href="mailto:plantnpot887@gmail.com" className="text-blue-600 underline">plantnpot887@gmail.com</a></p>
          </div>
        </div>

        {/* Info Section */}
        <div className="flex border border-gray-400 mb-3 text-sm">
          <div className="w-1/2 p-2 border-r border-gray-400">
            <h3 className="font-bold mb-1">Buyer</h3>
            <p className="font-semibold">{invoice.customerName || 'Customer'}</p>
            {invoice.customerEmail && <p>{invoice.customerEmail}</p>}
            <p>{invoice.shippingAddress?.address || 'Address Not Provided'}</p>
            <p>{[invoice.shippingAddress?.city, invoice.shippingAddress?.state, invoice.shippingAddress?.postalCode].filter(Boolean).join(', ')}</p>
          </div>
          <div className="w-1/2 p-2">
            <h2 className="text-xl font-bold text-red-600 mb-1 text-center">BILL OF SUPPLY</h2>
            <table className="w-full text-xs">
              <tbody>
                <tr>
                  <td className="font-bold py-1">Sub Bill No :</td>
                  <td>{invoice.invoiceNumber}</td>
                </tr>
                <tr>
                  <td className="font-bold py-1">Date :</td>
                  <td>{billDate}</td>
                </tr>
                <tr>
                  <td className="font-bold py-1">GSTIN No :</td>
                  <td>27AFFPN3601Q1Z5</td>
                </tr>
                <tr>
                  <td className="font-bold py-1">PAN :</td>
                  <td>AFFPN3601Q</td>
                </tr>
                <tr>
                  <td className="font-bold py-1">Payment Date :</td>
                  <td>{paymentDateStr}</td>
                </tr>
                <tr>
                  <td className="font-bold py-1">Dispatching Center :</td>
                  <td>{invoice.dispatchingCenter || 'AKOT, DIST. AKOLA'}</td>
                </tr>
                <tr>
                  <td className="font-bold py-1">Shipping Details :</td>
                  <td>{invoice.shippingDetail || ''}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Table */}
        <table className="w-full border-collapse border border-gray-400 text-sm mb-3">
          <thead>
            <tr className="border-b border-gray-400">
              <th className="border-r border-gray-400 p-1 px-2 text-left">Plant</th>
              <th className="border-r border-gray-400 p-1 px-2 text-left">Variety</th>
              <th className="border-r border-gray-400 p-1 px-2 text-center w-24">Quantity</th>
              <th className="border-r border-gray-400 p-1 px-2 text-right w-32">Rate/Unit (₹)</th>
              <th className="p-1 px-2 text-right w-32">Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.lineItems || []).map((item: any, idx: number) => (
              <React.Fragment key={idx}>
                <tr className="border-b border-gray-400">
                  <td className="border-r border-gray-400 p-1 px-2">{item.name || item.description || 'Product'}</td>
                  <td className="border-r border-gray-400 p-1 px-2">{item.variety || ''}</td>
                  <td className="border-r border-gray-400 p-1 px-2 text-center">{item.quantity || 1}</td>
                  <td className="border-r border-gray-400 p-1 px-2 text-right">{Number(item.unitPrice || item.rate || item.price || 0).toFixed(2)}</td>
                  <td className="p-1 px-2 text-right">{Number(item.amount || ((item.quantity||1) * (item.unitPrice||item.price||item.rate||0))).toFixed(2)}</td>
                </tr>
                {item.extraDescription && (
                  <tr className="border-b border-gray-400">
                    <td colSpan={5} className="p-1 px-2 text-gray-800 text-xs italic">
                      {item.extraDescription}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            <tr className="border-b border-gray-400">
              <td colSpan={3} className="border-r border-gray-400 p-1 px-2 text-right font-bold">Gross Total (₹)</td>
              <td className="p-1 px-2 text-right font-bold">{Number(invoice.subtotal || 0).toFixed(2)}</td>
            </tr>
            {Number(invoice.shipping || 0) > 0 && (
              <tr className="border-b border-gray-400">
                <td colSpan={3} className="border-r border-gray-400 p-1 px-2 text-right">Shipping (₹)</td>
                <td className="p-1 px-2 text-right">{Number(invoice.shipping || 0).toFixed(2)}</td>
              </tr>
            )}
            <tr className="border-b border-gray-400">
              <td colSpan={3} className="border-r border-gray-400 p-1 px-2 text-right">Discount</td>
              <td className="p-1 px-2 text-right">{Number(invoice.discount || 0).toFixed(2)}</td>
            </tr>
            <tr className="border-b border-gray-400 bg-gray-50">
              <td colSpan={3} className="border-r border-gray-400 p-1 px-2 text-right font-bold text-base">Net Total (₹)</td>
              <td className="p-1 px-2 text-right font-bold text-base">{netTotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan={4} className="p-1 px-2 font-bold uppercase text-xs">
                IN WORD : RUPEES {numberToWords(Math.round(netTotal))} ONLY
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footer */}
        <div className="mt-12 flex justify-end items-end mb-2 px-4">
          <span className="font-bold text-sm whitespace-nowrap">Authorised Signatory</span>
        </div>
      </div>
    </div>
  );
}
