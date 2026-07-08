"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiEye } from 'react-icons/fi';

export default function AccountsInvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/accounts/invoices');
      const data = await res.json();
      if(data.success) {
        setInvoices(data.data);
      }
    } catch(err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading invoices...</div>
          ) : invoices.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No invoices found. Create one to get started.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((inv: any) => (
                  <tr key={inv._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(inv.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inv.store?.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inv.customerName || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">₹{inv.total?.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        inv.status === 'paid' ? 'bg-green-100 text-green-800' : 
                        inv.status === 'failed' ? 'bg-red-100 text-red-800' :
                        inv.status === 'refunded' ? 'bg-gray-200 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {inv.status ? String(inv.status).charAt(0).toUpperCase() + String(inv.status).slice(1).replace(/_/g, ' ') : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link 
                        href={`/accounts/invoices/${inv._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-gray-300 text-xs text-gray-700 hover:bg-gray-100"
                      >
                        <FiEye size={13} />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {invoices.length > 0 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Rows per page:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="border-gray-300 rounded-md text-sm py-1.5 pl-3 pr-8 focus:ring-blue-500 focus:border-blue-500"
                >
                  {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, invoices.length)} of {invoices.length}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(invoices.length / rowsPerPage), p + 1))}
                    disabled={currentPage === Math.ceil(invoices.length / rowsPerPage) || Math.ceil(invoices.length / rowsPerPage) === 0}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}
