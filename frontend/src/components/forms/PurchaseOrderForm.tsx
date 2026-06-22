import React, { useState, useEffect } from 'react';
import { FiX, FiSave, FiPlus, FiTrash2 } from 'react-icons/fi';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';
import { useAuth } from '@/contexts/AuthContext';

interface PurchaseOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  poToEdit: any | null;
}

export default function PurchaseOrderForm({ isOpen, onClose, onSave, poToEdit }: PurchaseOrderFormProps) {
  const { adminToken } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    supplier: '',
    expectedDate: '',
    warehouse: 'Central Warehouse',
    paymentTerms: 'Net 30',
    reference: '',
    products: [] as any[],
    financials: {
      subtotal: 0,
      gstAmount: 0,
      transportFee: 0,
      grandTotal: 0
    }
  });

  useEffect(() => {
    if (isOpen && adminToken) {
      fetchSuppliersAndProducts();
    }
  }, [isOpen, adminToken]);

  const fetchSuppliersAndProducts = async () => {
    try {
      const [suppRes, prodRes] = await Promise.all([
        fetch(buildApiUrl('/api/suppliers'), { headers: getApiHeaders(adminToken || undefined) }),
        fetch(buildApiUrl('/api/products?limit=1000'), { headers: getApiHeaders(adminToken || undefined) }) // Fetching all for dropdown
      ]);
      if (suppRes.ok) {
        const suppJson = await suppRes.json();
        setSuppliers(suppJson.data || []);
      }
      if (prodRes.ok) {
        const prodJson = await prodRes.json();
        setProducts(prodJson.data?.products || []);
      }
    } catch (e) {
      console.error('Failed to load form data', e);
    }
  };

  useEffect(() => {
    if (poToEdit) {
      setFormData({
        supplier: poToEdit.supplier?._id || poToEdit.supplier,
        expectedDate: poToEdit.expectedDate ? poToEdit.expectedDate.split('T')[0] : '',
        warehouse: poToEdit.warehouse || 'Central Warehouse',
        paymentTerms: poToEdit.paymentTerms || 'Net 30',
        reference: poToEdit.reference || '',
        products: poToEdit.products.map((p: any) => ({
          product: p.product._id || p.product,
          orderedQty: p.orderedQty,
          costPrice: p.costPrice,
          gstPercent: p.gstPercent,
          total: p.total
        })),
        financials: poToEdit.financials || { subtotal: 0, gstAmount: 0, transportFee: 0, grandTotal: 0 }
      });
    } else {
      setFormData({
        supplier: '',
        expectedDate: '',
        warehouse: 'Central Warehouse',
        paymentTerms: 'Net 30',
        reference: '',
        products: [],
        financials: { subtotal: 0, gstAmount: 0, transportFee: 0, grandTotal: 0 }
      });
    }
  }, [poToEdit, isOpen]);

  const handleAddProduct = () => {
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, { product: '', orderedQty: 1, costPrice: 0, gstPercent: 18, total: 0 }]
    }));
  };

  const handleRemoveProduct = (index: number) => {
    const newProducts = [...formData.products];
    newProducts.splice(index, 1);
    recalculateFinancials(newProducts, formData.financials.transportFee);
  };

  const handleProductChange = (index: number, field: string, value: any) => {
    const newProducts = [...formData.products];
    newProducts[index][field] = value;
    
    // Auto calculate total
    if (['orderedQty', 'costPrice'].includes(field)) {
      const qty = Number(newProducts[index].orderedQty) || 0;
      const cost = Number(newProducts[index].costPrice) || 0;
      newProducts[index].total = qty * cost;
    }
    
    recalculateFinancials(newProducts, formData.financials.transportFee);
  };

  const handleTransportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value) || 0;
    recalculateFinancials(formData.products, val);
  };

  const recalculateFinancials = (prods: any[], transport: number) => {
    let subtotal = 0;
    let gstAmount = 0;
    
    prods.forEach(p => {
      subtotal += (p.total || 0);
      gstAmount += ((p.total || 0) * (p.gstPercent || 0)) / 100;
    });

    const grandTotal = subtotal + gstAmount + transport;
    
    setFormData(prev => ({
      ...prev,
      products: prods,
      financials: { subtotal, gstAmount, transportFee: transport, grandTotal }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplier) return alert('Select a supplier');
    if (formData.products.length === 0) return alert('Add at least one product');
    if (formData.products.some((p:any) => !p.product)) return alert('Select a product for all rows');

    setIsSaving(true);
    try {
      const method = poToEdit ? 'PUT' : 'POST';
      const url = poToEdit ? `/api/purchase-orders/${poToEdit._id}` : '/api/purchase-orders';
      
      const response = await fetch(buildApiUrl(url), {
        method,
        headers: { 'Content-Type': 'application/json', ...getApiHeaders(adminToken || undefined) },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        onSave();
        onClose();
      } else {
        const error = await response.json();
        alert(`Failed: ${error.error}`);
      }
    } catch (e) {
      console.error('PO save error', e);
      alert('Error saving PO');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900">{poToEdit ? 'Edit Purchase Order' : 'Create Purchase Order'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition"><FiX size={24} /></button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <form id="po-form" onSubmit={handleSubmit} className="space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
                <select required value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500">
                  <option value="">Select Supplier</option>
                  {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery Date</label>
                <input type="date" value={formData.expectedDate} onChange={e => setFormData({...formData, expectedDate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                <select value={formData.paymentTerms} onChange={e => setFormData({...formData, paymentTerms: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500">
                  <option value="Advance">Advance</option>
                  <option value="On Delivery">On Delivery</option>
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference No.</label>
                <input type="text" value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})} placeholder="Quote # or Indent #" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination Warehouse</label>
                <input type="text" disabled value={formData.warehouse} className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-500" />
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="px-4 py-3 w-1/3">Product *</th>
                    <th className="px-4 py-3 w-24">Qty *</th>
                    <th className="px-4 py-3 w-32">Cost Price *</th>
                    <th className="px-4 py-3 w-24">GST %</th>
                    <th className="px-4 py-3 w-32">Total</th>
                    <th className="px-4 py-3 w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.products.map((p, index) => (
                    <tr key={index} className="border-t border-gray-200">
                      <td className="px-4 py-2">
                        <select required value={p.product} onChange={e => handleProductChange(index, 'product', e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-blue-500">
                          <option value="">Select Product...</option>
                          {products.map(prod => <option key={prod._id} value={prod._id}>{prod.name} ({prod.sku || 'No SKU'})</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input type="number" required min="1" value={p.orderedQty} onChange={e => handleProductChange(index, 'orderedQty', e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded" />
                      </td>
                      <td className="px-4 py-2">
                        <input type="number" required min="0" step="0.01" value={p.costPrice} onChange={e => handleProductChange(index, 'costPrice', e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded" />
                      </td>
                      <td className="px-4 py-2">
                        <input type="number" min="0" max="100" value={p.gstPercent} onChange={e => handleProductChange(index, 'gstPercent', e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded" />
                      </td>
                      <td className="px-4 py-2 font-medium">₹{p.total.toFixed(2)}</td>
                      <td className="px-4 py-2 text-center">
                        <button type="button" onClick={() => handleRemoveProduct(index)} className="text-red-500 hover:bg-red-50 p-1.5 rounded"><FiTrash2 /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="bg-gray-50 p-3 border-t border-gray-200">
                <button type="button" onClick={handleAddProduct} className="flex items-center gap-2 text-sm text-blue-600 font-medium hover:text-blue-700">
                  <FiPlus /> Add Line Item
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <div className="w-full md:w-1/3 space-y-3 text-sm">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">₹{formData.financials.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Total GST Amount</span>
                  <span className="font-medium text-gray-900">₹{formData.financials.gstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600 border-b border-gray-200 pb-3">
                  <span>Transport & Packaging Fee</span>
                  <div className="w-32">
                    <input type="number" min="0" value={formData.financials.transportFee || ''} onChange={handleTransportChange} placeholder="0.00" className="w-full px-2 py-1 border border-gray-300 rounded text-right focus:ring-blue-500" />
                  </div>
                </div>
                <div className="flex justify-between items-center text-lg font-bold text-gray-900">
                  <span>Grand Total</span>
                  <span className="text-blue-600">₹{formData.financials.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

          </form>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium">Cancel</button>
          <button form="po-form" type="submit" disabled={isSaving} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
            {isSaving ? 'Saving...' : <><FiSave size={18} /> {poToEdit ? 'Update PO' : 'Create PO'}</>}
          </button>
        </div>
      </div>
    </div>
  );
}
