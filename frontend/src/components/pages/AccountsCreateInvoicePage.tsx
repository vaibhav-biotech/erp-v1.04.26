"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AccountsCreateInvoicePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    invoiceNumber: `INV-${Date.now()}`,
    store: '',
    customerName: '',
    customerEmail: '',
    status: 'Draft'
  });
  const [items, setItems] = useState([{ description: '', quantity: 1, price: 0 }]);
  const [submitting, setSubmitting] = useState(false);

  const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
  const tax = subtotal * 0.18; // assuming 18% tax
  const total = subtotal + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/accounts/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items,
          subtotal,
          tax,
          total
        })
      });
      if(res.ok) {
        router.push('/inventory?page=accounts-invoices');
      } else {
        alert('Failed to create invoice');
      }
    } catch(err) {
      console.error(err);
      alert('Error creating invoice');
    }
    setSubmitting(false);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Create Manual Invoice</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
                <input required type="text" value={formData.invoiceNumber} onChange={e => setFormData({...formData, invoiceNumber: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Store ID (Temporary text input)</label>
                <input required type="text" value={formData.store} onChange={e => setFormData({...formData, store: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border" placeholder="Paste Store ObjectId" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                <input required type="text" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Customer Email</label>
                <input type="email" value={formData.customerEmail} onChange={e => setFormData({...formData, customerEmail: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border" />
              </div>
            </div>

            <hr className="my-6" />

            <h3 className="text-lg font-medium text-gray-900">Line Items</h3>
            {items.map((item, index) => (
              <div key={index} className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <input required type="text" value={item.description} onChange={e => {
                    const newItems = [...items];
                    newItems[index].description = e.target.value;
                    setItems(newItems);
                  }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border" />
                </div>
                <div className="w-24">
                  <label className="block text-sm font-medium text-gray-700">Qty</label>
                  <input required type="number" min="1" value={item.quantity} onChange={e => {
                    const newItems = [...items];
                    newItems[index].quantity = parseInt(e.target.value);
                    setItems(newItems);
                  }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border" />
                </div>
                <div className="w-32">
                  <label className="block text-sm font-medium text-gray-700">Price</label>
                  <input required type="number" min="0" step="0.01" value={item.price} onChange={e => {
                    const newItems = [...items];
                    newItems[index].price = parseFloat(e.target.value);
                    setItems(newItems);
                  }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border" />
                </div>
                <button type="button" onClick={() => setItems(items.filter((_, i) => i !== index))} className="mb-2 text-red-600 hover:text-red-800">Remove</button>
              </div>
            ))}
            <button type="button" onClick={() => setItems([...items, { description: '', quantity: 1, price: 0 }])} className="text-sm text-blue-600 hover:text-blue-800">+ Add Item</button>

            <hr className="my-6" />

            <div className="flex justify-end text-right">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-gray-600"><span>Subtotal:</span> <span>₹{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-gray-600"><span>Tax (18%):</span> <span>₹{tax.toFixed(2)}</span></div>
                <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2"><span>Total:</span> <span>₹{total.toFixed(2)}</span></div>
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                {submitting ? 'Creating...' : 'Create Invoice'}
              </button>
            </div>
          </form>
        </div>
    </div>
  );
}
