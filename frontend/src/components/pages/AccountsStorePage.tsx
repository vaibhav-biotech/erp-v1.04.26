"use client";
import React from 'react';
import { FiSettings } from 'react-icons/fi';

export default function AccountsStorePage() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <FiSettings className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Store Management</h1>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Store Management Module</h2>
        <p className="text-gray-500 max-w-lg mx-auto">
          This section is currently under development. Here you will be able to manage store settings, themes, domains, and global configuration options.
        </p>
      </div>
    </div>
  );
}
