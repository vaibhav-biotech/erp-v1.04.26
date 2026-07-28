'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FiBell, FiCheck } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl, fetchWithStore } from '@/lib/storeConfig';
import { useRouter } from 'next/navigation';

export default function NotificationBell() {
  const { adminToken, adminAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchNotifications = async () => {
    if (!adminAuthenticated) return;
    try {
      const res = await fetchWithStore(buildApiUrl('/api/notifications'), {
        token: adminToken || undefined
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [adminToken, adminAuthenticated]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const markAsRead = async (id: string) => {
    try {
      await fetchWithStore(buildApiUrl(`/api/notifications/${id}/read`), {
        method: 'PUT',
        token: adminToken || undefined
      });
      // Update local state
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetchWithStore(buildApiUrl(`/api/notifications/read-all`), {
        method: 'PUT',
        token: adminToken || undefined
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = (n: any) => {
    if (!n.isRead) markAsRead(n._id);
    
    // Navigate based on type
    if (n.type === 'payment_success') {
      router.push('/accounts?page=accounts-payments');
    }
    
    setIsOpen(false);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition"
      >
        <FiBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                No notifications yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map(n => (
                  <div 
                    key={n._id} 
                    onClick={() => handleNotificationClick(n)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition flex gap-3 ${!n.isRead ? 'bg-blue-50/50' : ''}`}
                  >
                    <div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${!n.isRead ? 'bg-blue-500' : 'bg-transparent'}`} />
                    <div>
                      <p className={`text-sm ${!n.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
