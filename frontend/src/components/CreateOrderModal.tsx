'use client';

import React, { useState, useEffect } from 'react';
import { FiX, FiPlus, FiTrash2, FiSearch } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl, fetchWithStore } from '@/lib/storeConfig';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
}

interface Product {
  _id: string;
  name: string;
  finalPrice: number;
  stock: number;
}

interface CartItem extends Product {
  quantity: number;
  overridePrice: number;
}

export default function CreateOrderModal({ isOpen, onClose, onOrderCreated }: CreateOrderModalProps) {
  const { adminToken } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Customer Data
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India'
    }
  });

  // Product Data
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customDiscount, setCustomDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('cod');

  useEffect(() => {
    if (isOpen) {
      // Reset form
      setStep(1);
      setCart([]);
      setCustomDiscount(0);
      setCustomerInfo({
        firstName: '', lastName: '', email: '', phone: '',
        address: { street: '', city: '', state: '', zipCode: '', country: 'India' }
      });
      setSelectedCustomerId('');
      setProductSearch('');
      setCustomerSearch('');
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (customerSearch.length > 2) {
      searchCustomers();
    } else {
      setCustomers([]);
    }
  }, [customerSearch]);

  useEffect(() => {
    if (productSearch.length > 2) {
      searchProducts();
    } else {
      setSearchResults([]);
    }
  }, [productSearch]);

  const searchCustomers = async () => {
    try {
      const res = await fetchWithStore(buildApiUrl('/api/customers'), {
        token: adminToken || undefined
      });
      if (res.ok) {
        const data = await res.json();
        const filtered = data.data.filter((c: any) => 
          c.email?.toLowerCase().includes(customerSearch.toLowerCase()) || 
          c.phone?.includes(customerSearch) ||
          c.firstName?.toLowerCase().includes(customerSearch.toLowerCase())
        );
        setCustomers(filtered.slice(0, 5));
      }
    } catch (err) {}
  };

  const searchProducts = async () => {
    try {
      const res = await fetchWithStore(buildApiUrl(`/api/products?search=${productSearch}`), {
        token: adminToken || undefined
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults((data.data || []).slice(0, 5));
      }
    } catch (err) {}
  };

  const addToCart = (product: Product) => {
    if (cart.find(item => item._id === product._id)) return;
    setCart([...cart, { ...product, quantity: 1, overridePrice: product.finalPrice }]);
    setProductSearch('');
    setSearchResults([]);
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item._id !== id));
  };

  const updateCartItem = (id: string, field: 'quantity' | 'overridePrice', value: number) => {
    setCart(cart.map(item => {
      if (item._id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.overridePrice * item.quantity), 0);
    const afterDiscount = Math.max(0, subtotal - customDiscount);
    const tax = afterDiscount * 0.18; // assuming 18% for display
    const shipping = afterDiscount >= 60 ? 0 : 50;
    return subtotal - customDiscount + tax + shipping; // approximate total
  };

  const handleSubmit = async () => {
    if (cart.length === 0) {
      setError('Please add at least one product.');
      return;
    }
    if (!isExistingCustomer && (!customerInfo.firstName || !customerInfo.phone || !customerInfo.email)) {
      setError('Please fill all required customer details.');
      return;
    }
    if (isExistingCustomer && !selectedCustomerId) {
      setError('Please select an existing customer.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        customerId: isExistingCustomer ? selectedCustomerId : undefined,
        customerInfo: !isExistingCustomer ? customerInfo : undefined,
        items: cart.map(item => ({
          productId: item._id,
          name: item.name,
          quantity: item.quantity,
          price: item.overridePrice
        })),
        paymentMethod,
        customDiscount
      };

      const res = await fetchWithStore(buildApiUrl('/api/orders/manual'), {
        method: 'POST',
        token: adminToken || undefined,
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        onOrderCreated();
        onClose();
      } else {
        throw new Error(data.message || 'Failed to create order');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Create Manual Order</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition">
            <FiX size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Customer & Payment */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Customer Details</h3>
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input type="radio" checked={!isExistingCustomer} onChange={() => setIsExistingCustomer(false)} className="text-green-600 focus:ring-green-500" />
                    New Customer (Walk-in)
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input type="radio" checked={isExistingCustomer} onChange={() => setIsExistingCustomer(true)} className="text-green-600 focus:ring-green-500" />
                    Existing Customer
                  </label>
                </div>

                {isExistingCustomer ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Search Customer</label>
                      <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search by email or phone..."
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      {customers.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                          {customers.map(c => (
                            <button
                              key={c._id}
                              onClick={() => { setSelectedCustomerId(c._id); setCustomerSearch(c.email); setCustomers([]); }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0"
                            >
                              <p className="font-semibold">{c.firstName} {c.lastName}</p>
                              <p className="text-gray-500 text-xs">{c.email} • {c.phone}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                        <input type="text" value={customerInfo.firstName} onChange={e => setCustomerInfo({...customerInfo, firstName: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                        <input type="text" value={customerInfo.lastName} onChange={e => setCustomerInfo({...customerInfo, lastName: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input type="email" value={customerInfo.email} onChange={e => setCustomerInfo({...customerInfo, email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                        <input type="text" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                      <input type="text" value={customerInfo.address.street} onChange={e => setCustomerInfo({...customerInfo, address: {...customerInfo.address, street: e.target.value}})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Order Options</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                      <option value="cod">Cash on Delivery</option>
                      <option value="card">Card / UPI</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custom Discount (₹)</label>
                    <input type="number" min="0" value={customDiscount} onChange={e => setCustomDiscount(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Cart */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Products</h3>
              
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products to add..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                    {searchResults.map(p => (
                      <button
                        key={p._id}
                        onClick={() => addToCart(p)}
                        className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                      >
                        <span className="text-sm font-medium">{p.name}</span>
                        <span className="text-sm font-bold text-green-600">₹{p.finalPrice}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-700">
                    <tr>
                      <th className="px-4 py-2 font-medium">Product</th>
                      <th className="px-4 py-2 font-medium">Qty</th>
                      <th className="px-4 py-2 font-medium">Selling Price</th>
                      <th className="px-4 py-2 font-medium text-right">Total</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map(item => (
                      <tr key={item._id} className="border-b border-gray-100 last:border-0">
                        <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateCartItem(item._id, 'quantity', Number(e.target.value))}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <span className="mr-1 text-gray-500">₹</span>
                            <input
                              type="number"
                              min="0"
                              value={item.overridePrice}
                              onChange={(e) => updateCartItem(item._id, 'overridePrice', Number(e.target.value))}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-right text-green-700 font-semibold"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          ₹{(item.quantity * item.overridePrice).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => removeFromCart(item._id)} className="text-red-500 hover:text-red-700 p-1">
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {cart.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          No products added to cart
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {cart.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">₹{cart.reduce((sum, item) => sum + (item.overridePrice * item.quantity), 0).toFixed(2)}</span>
                  </div>
                  {customDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 mb-1">
                      <span>Discount</span>
                      <span>-₹{customDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold mt-2 pt-2 border-t border-gray-300 text-gray-900">
                    <span>Approx Total</span>
                    <span>₹{calculateTotal().toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-gray-500 text-right mt-1">* Final total may vary slightly due to exact tax calculation.</p>
                </div>
              )}

            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading} className="px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-2">
            {loading ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span> : <FiPlus />}
            {loading ? 'Creating...' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
