'use client';

import React, { useState, useEffect } from 'react';
import { FiX, FiPlus, FiTrash2, FiSearch, FiCalendar, FiUser, FiShoppingBag } from 'react-icons/fi';
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
  variety: string;
  extraDescription: string;
}

export default function CreateOrderModal({ isOpen, onClose, onOrderCreated }: CreateOrderModalProps) {
  const { adminToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Date & Store State
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentDate, setPaymentDate] = useState('');
  const [dispatchingCenter, setDispatchingCenter] = useState('AKOT, DIST. AKOLA');
  const [shippingDetail, setShippingDetail] = useState('');
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [customStoreName, setCustomStoreName] = useState('');

  // Customer Data
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [shippingAddress, setShippingAddress] = useState({
    street: '', city: '', state: '', zipCode: '', country: 'India'
  });

  // Product Data
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customDiscount, setCustomDiscount] = useState<number>(0);
  const [shippingCharge, setShippingCharge] = useState<number>(0);
  const [applyGst, setApplyGst] = useState<boolean>(true);
  const [paymentMethod, setPaymentMethod] = useState('cod');

  useEffect(() => {
    if (isOpen) {
      setCart([]);
      setCustomDiscount(0);
      setShippingCharge(0);
      setApplyGst(true);
      setOrderDate(new Date().toISOString().split('T')[0]);
      setPaymentDate('');
      setDispatchingCenter('AKOT, DIST. AKOLA');
      setShippingDetail('');
      setSelectedStoreId('');
      setCustomStoreName('');
      setCustomerInfo({
        firstName: '', lastName: '', email: '', phone: ''
      });
      setShippingAddress({
        street: '', city: '', state: '', zipCode: '', country: 'India'
      });
      setSelectedCustomerId('');
      setProductSearch('');
      setCustomerSearch('');
      setError('');
      fetchStores();
    }
  }, [isOpen]);

  const fetchStores = async () => {
    try {
      const res = await fetchWithStore(buildApiUrl('/api/accounts/stores'), { token: adminToken || undefined });
      if (res.ok) {
        const data = await res.json();
        setStores(data.data || []);
        if (data.data?.length > 0) {
          setSelectedStoreId(data.data[0]._id);
        }
      }
    } catch (err) {}
  };

  useEffect(() => {
    if (selectedCustomerId) return; // Prevent searching immediately after selecting
    if (customerSearch.length > 2) searchCustomers();
    else setCustomers([]);
  }, [customerSearch, selectedCustomerId]);

  useEffect(() => {
    if (productSearch.length > 2) searchProducts();
    else setSearchResults([]);
  }, [productSearch]);

  const searchCustomers = async () => {
    try {
      const res = await fetchWithStore(buildApiUrl('/api/customers'), { token: adminToken || undefined });
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
      const res = await fetchWithStore(buildApiUrl(`/api/products?search=${productSearch}`), { token: adminToken || undefined });
      if (res.ok) {
        const data = await res.json();
        setSearchResults((data.data || []).slice(0, 5));
      }
    } catch (err) {}
  };

  const addToCart = (product: Product) => {
    if (cart.find(item => item._id === product._id)) return;
    setCart([...cart, { ...product, quantity: 1, overridePrice: product.finalPrice, variety: '', extraDescription: '' }]);
    setProductSearch('');
    setSearchResults([]);
  };

  const removeFromCart = (id: string) => setCart(cart.filter(item => item._id !== id));
  const updateCartItem = (id: string, field: 'quantity' | 'overridePrice' | 'variety' | 'extraDescription', value: any) => {
    setCart(cart.map(item => item._id === id ? { ...item, [field]: value } : item));
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.overridePrice * item.quantity), 0);
    const afterDiscount = Math.max(0, subtotal - customDiscount);
    const tax = applyGst ? (afterDiscount * 0.18) : 0; // approx
    const shipping = shippingCharge;
    return afterDiscount + tax + shipping; 
  };

  const handleSubmit = async () => {
    if (cart.length === 0) return setError('Please add at least one product.');
    if (!isExistingCustomer && (!customerInfo.firstName || !customerInfo.phone || !customerInfo.email)) return setError('Please fill all required customer details.');
    if (isExistingCustomer && !selectedCustomerId) return setError('Please select an existing customer.');

    setLoading(true);
    setError('');

    try {
      const payload = {
        storeId: selectedStoreId === 'custom' ? undefined : selectedStoreId,
        customStoreName: selectedStoreId === 'custom' ? customStoreName : undefined,
        customerId: isExistingCustomer ? selectedCustomerId : undefined,
        customerInfo: !isExistingCustomer ? customerInfo : undefined,
        items: cart.map(item => ({ 
          productId: item._id, name: item.name, quantity: item.quantity, price: item.overridePrice,
          variety: item.variety, extraDescription: item.extraDescription 
        })),
        paymentMethod,
        customDiscount,
        shippingCharge,
        applyGst,
        source: 'Manual',
        orderDate: orderDate ? new Date(orderDate).toISOString() : undefined,
        paymentDate: paymentDate ? new Date(paymentDate).toISOString() : undefined,
        dispatchingCenter,
        shippingDetail,
        shippingAddress
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <FiShoppingBag size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Create Manual Order</h2>
              <p className="text-sm text-gray-500">Draft a new order and backdate if necessary.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
            <FiX size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          
          {/* Main Form Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Section 1: Customer & Date */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <FiUser className="text-blue-500" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">Order & Customer Details</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {stores.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Store</label>
                    <select
                      value={selectedStoreId}
                      onChange={(e) => setSelectedStoreId(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                    >
                      {stores.map(s => (
                        <option key={s._id} value={s._id}>{s.name} ({s.domain})</option>
                      ))}
                      <option value="custom">Custom Store...</option>
                    </select>
                  </div>
                )}
                {selectedStoreId === 'custom' && (
                  <div className="col-span-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custom Store Name</label>
                    <input
                      type="text"
                      value={customStoreName}
                      onChange={(e) => setCustomStoreName(e.target.value)}
                      placeholder="Enter custom store name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <FiCalendar className="text-gray-400" />
                    Order Date
                  </label>
                  <input
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave as today unless backdating.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <FiCalendar className="text-gray-400" />
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dispatching Center</label>
                  <input
                    type="text"
                    value={dispatchingCenter}
                    onChange={(e) => setDispatchingCenter(e.target.value)}
                    placeholder="e.g. AKOT, DIST. AKOLA"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Detail</label>
                  <input
                    type="text"
                    value={shippingDetail}
                    onChange={(e) => setShippingDetail(e.target.value)}
                    placeholder="e.g. Vehicle No or Courier"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>
              </div>

              <div className="flex gap-6 mb-5 border-b border-gray-100 pb-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                  <input type="radio" checked={!isExistingCustomer} onChange={() => setIsExistingCustomer(false)} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                  New Customer
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                  <input type="radio" checked={isExistingCustomer} onChange={() => setIsExistingCustomer(true)} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                  Existing Customer
                </label>
              </div>

              {isExistingCustomer ? (
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search Customer</label>
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by email, phone, or name..."
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        if (selectedCustomerId) setSelectedCustomerId('');
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  {customers.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                      {customers.map(c => (
                        <button
                          key={c._id}
                          onClick={() => { 
                            setSelectedCustomerId(c._id); 
                            setCustomerSearch(c.email); 
                            setCustomers([]); 
                            if (c.address) {
                              setShippingAddress({
                                street: c.address.street || '',
                                city: c.address.city || '',
                                state: c.address.state || '',
                                zipCode: c.address.zipCode || '',
                                country: c.address.country || 'India'
                              });
                            } else {
                              setShippingAddress({ street: '', city: '', state: '', zipCode: '', country: 'India' });
                            }
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-0 transition"
                        >
                          <p className="font-semibold text-gray-900">{c.firstName} {c.lastName}</p>
                          <p className="text-gray-500 text-xs mt-0.5">{c.email} • {c.phone}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">First Name *</label>
                    <input type="text" value={customerInfo.firstName} onChange={e => setCustomerInfo({...customerInfo, firstName: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                    <input type="text" value={customerInfo.lastName} onChange={e => setCustomerInfo({...customerInfo, lastName: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                    <input type="email" value={customerInfo.email} onChange={e => setCustomerInfo({...customerInfo, email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone *</label>
                    <input type="text" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                </div>
              )}

              {/* Shipping Address - ALWAYS SHOW */}
              <div className="mt-6 border-t border-gray-100 pt-6">
                <h4 className="text-sm font-semibold text-gray-800 mb-4">Shipping Address</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Street Address</label>
                    <input type="text" value={shippingAddress.street} onChange={e => setShippingAddress({...shippingAddress, street: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="123 Main St" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                    <input type="text" value={shippingAddress.city} onChange={e => setShippingAddress({...shippingAddress, city: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="City" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                    <input type="text" value={shippingAddress.state} onChange={e => setShippingAddress({...shippingAddress, state: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="State" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Postal / Zip Code</label>
                    <input type="text" value={shippingAddress.zipCode} onChange={e => setShippingAddress({...shippingAddress, zipCode: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Zip Code" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
                    <input type="text" value={shippingAddress.country} onChange={e => setShippingAddress({...shippingAddress, country: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Products */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <FiShoppingBag className="text-green-500" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">Products</h3>
              </div>
              
              <div className="relative mb-6">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search catalog to add products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                    {searchResults.map(p => (
                      <button
                        key={p._id}
                        onClick={() => addToCart(p)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-green-50 border-b border-gray-100 last:border-0 transition"
                      >
                        <span className="text-sm font-medium text-gray-900">{p.name}</span>
                        <span className="text-sm font-bold text-green-600">₹{p.finalPrice}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50/50">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-100 border-b border-gray-200 text-gray-600">
                    <tr>
                      <th className="px-4 py-3 font-medium">Product</th>
                      <th className="px-4 py-3 font-medium">Qty</th>
                      <th className="px-4 py-3 font-medium">Selling Price</th>
                      <th className="px-4 py-3 font-medium text-right">Total</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {cart.map(item => (
                      <React.Fragment key={item._id}>
                        <tr className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateCartItem(item._id, 'quantity', Number(e.target.value))}
                              className="w-16 px-2 py-1.5 border border-gray-300 rounded-md text-center focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <span className="mr-1 text-gray-400 font-medium">₹</span>
                              <input
                                type="number"
                                min="0"
                                value={item.overridePrice}
                                onChange={(e) => updateCartItem(item._id, 'overridePrice', Number(e.target.value))}
                                className="w-24 px-2 py-1.5 border border-gray-300 rounded-md text-right text-gray-900 font-semibold focus:ring-1 focus:ring-blue-500 outline-none"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900">
                            ₹{(item.quantity * item.overridePrice).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => removeFromCart(item._id)} className="text-gray-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition">
                              <FiTrash2 size={16} />
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={5} className="px-4 pb-3 pt-1 border-b border-gray-100">
                            <div className="flex flex-col sm:flex-row gap-3">
                              <input
                                type="text"
                                placeholder="Variety (e.g. Grand Nain)"
                                value={item.variety}
                                onChange={(e) => updateCartItem(item._id, 'variety', e.target.value)}
                                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
                              />
                              <input
                                type="text"
                                placeholder="Extra Description (optional)"
                                value={item.extraDescription}
                                onChange={(e) => updateCartItem(item._id, 'extraDescription', e.target.value)}
                                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
                              />
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                    {cart.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                          No products added to order yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Right Sidebar: Summary & Payment */}
          <div className="w-full lg:w-[350px] bg-white border-l border-gray-200 flex flex-col">
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Payment & Discount</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Payment Method</label>
                    <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white transition">
                      <option value="cod">Cash on Delivery</option>
                      <option value="card">Card / UPI</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Custom Discount (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                      <input type="number" min="0" value={customDiscount} onChange={e => setCustomDiscount(Number(e.target.value))} className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white transition" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Shipping Charge (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                      <input type="number" min="0" value={shippingCharge} onChange={e => setShippingCharge(Number(e.target.value))} className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white transition" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <input type="checkbox" id="applyGst" checked={applyGst} onChange={e => setApplyGst(e.target.checked)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
                    <label htmlFor="applyGst" className="text-xs font-medium text-gray-700 cursor-pointer">Apply GST (18%)</label>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Order Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium text-gray-900">₹{cart.reduce((sum, item) => sum + (item.overridePrice * item.quantity), 0).toFixed(2)}</span>
                  </div>
                  {customDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-₹{customDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>₹{shippingCharge.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Taxes</span>
                    <span>{applyGst ? '18% applied' : '0%'}</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-end">
                    <span className="text-gray-900 font-bold">Approx Total</span>
                    <span className="text-2xl font-black text-gray-900">₹{calculateTotal().toFixed(2)}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 text-right mt-1">* Final amount might vary by exact tax bracket</p>
                </div>
              </div>

            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <button 
                onClick={handleSubmit} 
                disabled={loading || cart.length === 0} 
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm shadow-blue-200"
              >
                {loading ? <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span> : <FiPlus size={20} />}
                {loading ? 'Processing...' : 'Confirm Order'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
