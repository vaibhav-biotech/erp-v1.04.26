'use client';

import React, { useState, useEffect } from 'react';
import { FiClock, FiUser, FiActivity, FiInfo } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';

interface ActivityLog {
  _id: string;
  adminId: string;
  adminEmail: string;
  role: string;
  action: string;
  details: string;
  createdAt: string;
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { adminToken } = useAuth();
  
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 50,
    total: 0,
    pages: 1
  });

  useEffect(() => {
    fetchLogs();
  }, [pagination.currentPage]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const skip = (pagination.currentPage - 1) * pagination.pageSize;
      const response = await fetch(buildApiUrl(`/api/inventory/activity-log?limit=${pagination.pageSize}&skip=${skip}`), {
        headers: {
          ...getApiHeaders(adminToken || undefined),
          'Authorization': `Bearer ${adminToken}`
        }
      });
      if (response.ok) {
        const json = await response.json();
        setLogs(json.data || []);
        setPagination(prev => ({
          ...prev,
          total: json.pagination.total,
          pages: json.pagination.pages
        }));
      }
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">LOGIN</span>;
      case 'LOGOUT':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">LOGOUT</span>;
      case 'UPDATE_PRODUCT':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">UPDATED</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">{action}</span>;
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FiActivity className="text-blue-600" /> System Audit Logs
            </h2>
            <p className="text-sm text-gray-500 mt-1">Immutable record of all inventory management activities.</p>
          </div>
          <button onClick={fetchLogs} className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
            Refresh Logs
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700 text-sm uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold border-b"><FiClock className="inline mr-2" />Timestamp</th>
                <th className="px-6 py-4 font-semibold border-b"><FiUser className="inline mr-2" />User</th>
                <th className="px-6 py-4 font-semibold border-b">Action</th>
                <th className="px-6 py-4 font-semibold border-b"><FiInfo className="inline mr-2" />Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2">Loading logs...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No activity logs found.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(log.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.adminEmail}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getActionBadge(log.action)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-md truncate" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && pagination.pages > 1 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <span className="text-sm text-gray-600">
              Showing page {pagination.currentPage} of {pagination.pages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }))}
                disabled={pagination.currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.min(prev.pages, prev.currentPage + 1) }))}
                disabled={pagination.currentPage === pagination.pages}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
