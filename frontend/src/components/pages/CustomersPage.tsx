'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Mail, Phone, Calendar, Trash2 } from 'lucide-react';

interface Customer {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  createdAt: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5050/api/customers');
      const data = await response.json();

      if (data.success) {
        setCustomers(data.data);
      } else {
        setError(data.message || 'Failed to fetch customers');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching customers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;

    try {
      const response = await fetch(`http://localhost:5050/api/customers/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        setCustomers(customers.filter((c) => c._id !== id));
      } else {
        setError(data.message || 'Failed to delete customer');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting customer');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-montserrat text-gray-600">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="text-green-600" size={32} />
          <div>
            <h1 className="font-playfair text-3xl text-gray-900">Customers</h1>
            <p className="font-montserrat text-sm text-gray-600">
              Total Registered: {customers.length}
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 bg-red-50 border border-red-200 rounded-lg"
        >
          <p className="font-montserrat text-sm text-red-700">{error}</p>
        </motion.div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {customers.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-montserrat text-gray-600">No customers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Table Header */}
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left font-montserrat text-xs font-semibold text-gray-900 uppercase tracking-wide">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left font-montserrat text-xs font-semibold text-gray-900 uppercase tracking-wide">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left font-montserrat text-xs font-semibold text-gray-900 uppercase tracking-wide">
                    Phone
                  </th>
                  <th className="px-6 py-4 text-left font-montserrat text-xs font-semibold text-gray-900 uppercase tracking-wide">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-center font-montserrat text-xs font-semibold text-gray-900 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {customers.map((customer, index) => (
                  <motion.tr
                    key={customer._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    {/* Name */}
                    <td className="px-6 py-4">
                      <p className="font-montserrat text-sm text-gray-900 font-medium">
                        {customer.firstName} {customer.lastName}
                      </p>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-gray-400" />
                        <p className="font-montserrat text-sm text-gray-600">
                          {customer.email}
                        </p>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-gray-400" />
                        <p className="font-montserrat text-sm text-gray-600">
                          {customer.phone}
                        </p>
                      </div>
                    </td>

                    {/* Joined Date */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <p className="font-montserrat text-sm text-gray-600">
                          {new Date(customer.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-center">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDelete(customer._id)}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                        <span className="font-montserrat text-xs">Delete</span>
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
