'use client';

import React, { useState, useEffect } from 'react';
import { MessageCircle, Search, X } from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';
import { MiniChatWindow } from './MiniChatWindow';
import { useAuth } from '@/contexts/AuthContext';

export const GlobalChatWidget = () => {
  const { admin } = useAuth();
  const { activeChats, closeChat, openChat, unreadTotal, searchContacts, onlineUsers } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchContacts = async (q: string = '') => {
    setIsLoading(true);
    const results = await searchContacts(q);
    setSearchResults(results);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchContacts(searchQuery);
    }
  }, [isOpen]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    fetchContacts(q);
  };

  // RBAC: Strictly render only for valid staff/admin roles. Public users (customers) will not pass this check.
  const allowedRoles = ['super_admin', 'store_admin', 'inventory_admin', 'accountant', 'staff', 'staff_admin'];
  if (!admin || !admin.role || !allowedRoles.includes(admin.role)) return null;

  return (
    <div className="fixed bottom-0 right-4 z-50 flex items-end">
      {/* Active Mini Chat Windows */}
      <div className="flex items-end">
        {activeChats.map(contact => (
          <MiniChatWindow key={contact._id} contact={contact} onClose={() => closeChat(contact._id)} />
        ))}
      </div>

      {/* Main Global Widget (Contacts List) */}
      <div className="relative mb-4">
        {/* Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-105 relative"
        >
          {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
          {!isOpen && unreadTotal > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
              {unreadTotal}
            </span>
          )}
        </button>

        {/* Contacts Sidebar Popup */}
        {isOpen && (
          <div className="absolute bottom-16 right-0 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col h-96">
            <div className="bg-purple-600 p-4 text-white">
              <h2 className="font-bold">Team Chat</h2>
              <div className="mt-2 relative">
                <Search size={16} className="absolute left-3 top-2 text-purple-200" />
                <input 
                  type="text" 
                  placeholder="Search staff/admins..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="w-full bg-purple-700/50 text-white placeholder-purple-200 rounded-full pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-white"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              <div>
                <p className="text-xs text-gray-400 mb-2 px-2 uppercase font-bold">
                  {searchQuery ? 'Search Results' : 'All Staff'}
                </p>
                {isLoading ? (
                  <p className="text-center text-sm text-gray-500 mt-4">Loading...</p>
                ) : (
                  searchResults.map(user => (
                    <div 
                      key={user._id} 
                      onClick={() => { openChat(user); setIsOpen(false); }}
                      className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                    >
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                          {user.name.charAt(0)}
                        </div>
                        {onlineUsers.includes(user._id) && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{user.name}</p>
                      </div>
                    </div>
                  ))
                )}
                {!isLoading && searchResults.length === 0 && (
                   <p className="text-center text-sm text-gray-500 mt-4">No users found.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
