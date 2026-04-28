'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import PublicNavbar from '@/components/PublicNavbar';
import PublicFooter from '@/components/PublicFooter';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';

interface OrderData {
  customerId: string;
  items: any[];
  address: {
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  paymentMethod: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, getSubtotal, clearCart } = useCart();
  const { customer, customerToken, customerAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState('');
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    paymentMethod: 'COD',
  });

  // Initialize form with customer data if logged in
  useEffect(() => {
    if (customerAuthenticated && customer) {
      setFormData(prev => ({
        ...prev,
        email: customer.email || '',
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        phone: customer.phone || '',
      }));
    }
  }, [customerAuthenticated, customer]);

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      redirectTimerRef.current = setTimeout(() => router.push('/products'), 2000);
    }

    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    };
  }, [cartItems.length, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.email) return 'Email is required';
    if (!formData.firstName) return 'First name is required';
    if (!formData.lastName) return 'Last name is required';
    if (!formData.street) return 'Street address is required';
    if (!formData.city) return 'City is required';
    if (!formData.state) return 'State is required';
    if (!/^\d{6}$/.test(formData.pincode)) return 'Pincode must be 6 digits';
    if (!/^\d{10}$/.test(formData.phone)) return 'Phone number must be 10 digits';
    return null;
  };

  const handlePlaceOrder = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // If not authenticated, require login
      if (!customerAuthenticated) {
        setError('Please login or signup to place an order');
        setLoading(false);
        return;
      }

      const orderPayload: OrderData = {
        customerId: customer?._id || '',
        items: cartItems.map(item => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.totalPrice / item.quantity,
          sizeVariant: item.sizeVariant,
          potVariant: item.potVariant,
          image: item.image,
        })),
        address: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          street: formData.street,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          phone: formData.phone,
        },
        paymentMethod: formData.paymentMethod,
      };

      const headers = getApiHeaders(customerToken || '');
      const response = await fetch(buildApiUrl('/api/orders'), {
        method: 'POST',
        headers,
        body: JSON.stringify(orderPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to place order');
      }

      clearCart();
      setSuccess(true);
      setPlacedOrderId(result.data?.orderId || result.data?.orderNumber || result.data?._id || '');
      
      // Redirect to customer orders (My Account > Orders) after success
      redirectTimerRef.current = setTimeout(() => {
        router.push('/customer?tab=orders');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error placing order');
    } finally {
      setLoading(false);
    }
  };

  const pricing = useMemo(() => {
    const subtotal = getSubtotal();
    const shipping = subtotal >= 60 ? 0 : 50;
    const tax = Math.round(subtotal * 0.18 * 100) / 100;
    const total = subtotal + shipping + tax;
    return { subtotal, shipping, tax, total };
  }, [getSubtotal, cartItems]);

  if (cartItems.length === 0) {
    return (
      <>
        <PublicNavbar />
        <div className="min-h-screen bg-stone-50 py-12 flex items-center justify-center">
          <div className="text-center">
            <p className="font-montserrat text-gray-600 mb-4">Your cart is empty</p>
            <Link href="/products" className="inline-block bg-black text-white px-6 py-3 rounded-lg font-montserrat font-bold text-sm hover:bg-gray-900">
              Continue Shopping
            </Link>
          </div>
        </div>
        <PublicFooter />
      </>
    );
  }

  return (
    <>
      <PublicNavbar />
      <div className="min-h-screen bg-stone-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="font-playfair text-3xl text-black mb-8">Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form - 2 Columns */}
            <div className="lg:col-span-2 space-y-6">
              {success ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-green-50 border border-green-200 rounded-lg p-8 text-center"
                >
                  <p className="font-montserrat text-green-700 text-lg">✓ Order placed successfully!</p>
                  {placedOrderId && (
                    <p className="font-montserrat text-black text-sm mt-2">Order ID: {placedOrderId}</p>
                  )}
                  <p className="font-montserrat text-gray-600 text-sm mt-2">Redirecting to My Orders...</p>
                </motion.div>
              ) : (
                <>
                  {/* Contact Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg p-6"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="font-montserrat font-bold text-lg text-black">Contact</h2>
                      {!customerAuthenticated && (
                        <Link href="/auth/login?redirect=/checkout" className="text-blue-600 font-montserrat text-sm hover:underline">
                          Sign in
                        </Link>
                      )}
                    </div>
                    <input
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg font-montserrat text-sm focus:outline-none focus:border-black"
                    />
                    {customerAuthenticated && (
                      <p className="font-montserrat text-xs text-gray-600 mt-2">
                        ✓ Logged in as {customer?.firstName}
                      </p>
                    )}
                  </motion.div>

                  {/* Delivery Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-lg p-6"
                  >
                    <h2 className="font-montserrat font-bold text-lg mb-4 text-black">Delivery Address</h2>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <input
                        type="text"
                        name="firstName"
                        placeholder="First Name"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="px-4 py-3 border border-gray-300 rounded-lg font-montserrat text-sm focus:outline-none focus:border-black"
                      />
                      <input
                        type="text"
                        name="lastName"
                        placeholder="Last Name"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="px-4 py-3 border border-gray-300 rounded-lg font-montserrat text-sm focus:outline-none focus:border-black"
                      />
                    </div>
                    <input
                      type="text"
                      name="street"
                      placeholder="Street Address"
                      value={formData.street}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg font-montserrat text-sm focus:outline-none focus:border-black mb-4"
                    />
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <input
                        type="text"
                        name="city"
                        placeholder="City"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="px-4 py-3 border border-gray-300 rounded-lg font-montserrat text-sm focus:outline-none focus:border-black"
                      />
                      <select
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="px-4 py-3 border border-gray-300 rounded-lg font-montserrat text-sm focus:outline-none focus:border-black"
                      >
                        <option value="">Select State</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Delhi">Delhi</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        <option value="Uttar Pradesh">Uttar Pradesh</option>
                        <option value="Telangana">Telangana</option>
                        <option value="Gujarat">Gujarat</option>
                        <option value="West Bengal">West Bengal</option>
                        <option value="Rajasthan">Rajasthan</option>
                        <option value="Punjab">Punjab</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="pincode"
                        placeholder="PIN code"
                        value={formData.pincode}
                        onChange={handleInputChange}
                        className="px-4 py-3 border border-gray-300 rounded-lg font-montserrat text-sm focus:outline-none focus:border-black"
                      />
                      <input
                        type="text"
                        name="phone"
                        placeholder="Phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="px-4 py-3 border border-gray-300 rounded-lg font-montserrat text-sm focus:outline-none focus:border-black"
                      />
                    </div>
                  </motion.div>

                  {/* Payment Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-lg p-6"
                  >
                    <h2 className="font-montserrat font-bold text-lg mb-4 text-black">Payment</h2>
                    <label className="flex items-center p-4 border border-black rounded-lg cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="COD"
                        checked={formData.paymentMethod === 'COD'}
                        onChange={handleInputChange}
                        className="w-4 h-4"
                      />
                      <span className="ml-3 font-montserrat text-sm text-black font-bold">
                        Cash on Delivery (COD)
                      </span>
                    </label>
                  </motion.div>

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-red-50 border border-red-200 rounded-lg p-4"
                    >
                      <p className="font-montserrat text-sm text-red-700">{error}</p>
                    </motion.div>
                  )}

                  {/* Place Order Button */}
                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="w-full bg-black text-white py-4 rounded-lg font-montserrat font-bold text-sm hover:bg-gray-900 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      'Place Order'
                    )}
                  </button>
                </>
              )}
            </div>

            {/* Order Summary - Sidebar */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-lg p-6 sticky top-24 space-y-4"
              >
                <h2 className="font-montserrat font-bold text-lg text-black mb-4">Order Summary</h2>

                {/* Items */}
                <div className="border-b border-gray-200 pb-4 space-y-2">
                  {cartItems.map((item, idx) => (
                    <div key={`${item.productId}-${idx}`} className="flex items-start gap-3 text-sm">
                      <img
                        src={item.image || '/placeholder.png'}
                        alt={item.name}
                        className="w-12 h-12 rounded-md object-cover border border-gray-200 shrink-0"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/80?text=Plant';
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between gap-2 font-montserrat text-gray-600">
                          <span className="font-semibold text-gray-800 truncate">{item.name}</span>
                          <span className="shrink-0">₹{item.totalPrice.toLocaleString('en-IN')}</span>
                        </div>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        <p className="text-xs text-gray-500 truncate">{item.sizeVariant.name} / {item.potVariant.name}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pricing */}
                <div className="space-y-2 text-sm border-b border-gray-200 pb-4">
                  <div className="flex justify-between font-montserrat text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{pricing.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-montserrat text-gray-600">
                    <span>Tax (18%)</span>
                    <span>₹{pricing.tax.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-montserrat text-gray-600">
                    <span>Shipping</span>
                    <span className={pricing.shipping === 0 ? 'text-green-600 font-bold' : ''}>
                      {pricing.shipping === 0 ? 'FREE' : `₹${pricing.shipping}`}
                    </span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between font-montserrat font-bold text-lg text-black">
                  <span>Total</span>
                  <span>₹{pricing.total.toLocaleString('en-IN')}</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
      <PublicFooter />
    </>
  );
}
