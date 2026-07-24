'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

export interface ChatMessage {
  _id: string;
  conversationId: string;
  senderId: string;
  senderModel: string;
  content: string;
  attachments?: any[];
  isReadBy: string[];
  createdAt: string;
}

export interface ChatContact {
  _id: string;
  name: string;
  email: string;
  role: string;
  userModel: string;
}

export interface Conversation {
  _id: string;
  participants: { userId: string; userModel: string; name: string }[];
  lastMessageContent: string;
  lastMessage?: ChatMessage;
  unreadCounts: Record<string, number>;
  updatedAt: string;
}

interface ChatContextType {
  socket: Socket | null;
  onlineUsers: string[]; // List of user IDs online
  activeChats: ChatContact[]; // Array of contacts currently having mini windows open
  conversations: Conversation[];
  unreadTotal: number;
  openChat: (contact: ChatContact) => void;
  closeChat: (userId: string) => void;
  sendMessage: (contact: ChatContact, content: string, attachments?: any[]) => Promise<ChatMessage>;
  markAsRead: (conversationId: string, messageIds: string[]) => void;
  fetchHistory: (conversationId: string) => Promise<ChatMessage[]>;
  searchContacts: (query: string) => Promise<ChatContact[]>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { admin, adminToken } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [activeChats, setActiveChats] = useState<ChatContact[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unreadTotal, setUnreadTotal] = useState(0);

  // Initialize socket
  useEffect(() => {
    if (!admin?._id) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050', {
      transports: ['websocket'],
    });

    socketInstance.on('connect', () => {
      socketInstance.emit('join', admin._id);
    });

    socketInstance.on('user_status_change', ({ userId, status }) => {
      setOnlineUsers(prev => {
        if (status === 'online' && !prev.includes(userId)) return [...prev, userId];
        if (status === 'offline') return prev.filter(id => id !== userId);
        return prev;
      });
    });

    socketInstance.on('receive_message', (message: ChatMessage) => {
      // Play sound if window isn't active
      if (message.senderId !== admin._id) {
         const audio = new Audio('/notification.mp3'); // We'll assume sound exists or fail silently
         audio.play().catch(() => {});
         
         // In a real app we'd update unread counts and conversation list here
         setUnreadTotal(prev => prev + 1);
         document.title = '(1) New Message!';
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [admin?._id]);

  // Reset title when unread is 0
  useEffect(() => {
    if (unreadTotal === 0) {
      document.title = 'ERP Dashboard'; // Default title or original
    }
  }, [unreadTotal]);

  const openChat = useCallback((contact: ChatContact) => {
    setActiveChats(prev => {
      if (prev.find(c => c._id === contact._id)) return prev;
      // Keep max 3 chat windows open
      const next = [...prev, contact];
      if (next.length > 3) next.shift();
      return next;
    });
  }, []);

  const closeChat = useCallback((userId: string) => {
    setActiveChats(prev => prev.filter(c => c._id !== userId));
  }, []);

  const sendMessage = useCallback((contact: ChatContact, content: string, attachments?: any[]): Promise<ChatMessage> => {
    return new Promise((resolve, reject) => {
      if (!socket || !admin?._id) return reject('Socket not connected');
      
      const payload = {
        senderId: admin._id,
        senderModel: admin.role === 'staff' || admin.role === 'staff_admin' ? 'StaffMember' : 'Admin',
        senderName: (admin as any).name || (admin.firstName ? `${admin.firstName} ${admin.lastName || ''}`.trim() : 'Unknown User'),
        receiverId: contact._id,
        receiverModel: contact.userModel,
        receiverName: contact.name,
        content,
        attachments
      };
      
      socket.emit('send_message', payload, (res: any) => {
        if (res.success) {
          resolve(res.message);
        } else {
          reject(res.error);
        }
      });
    });
  }, [socket, admin]);

  const markAsRead = useCallback((conversationId: string, messageIds: string[]) => {
    if (!socket || !admin?._id) return;
    socket.emit('mark_as_read', { conversationId, userId: admin._id, messageIds });
    setUnreadTotal(prev => Math.max(0, prev - messageIds.length));
  }, [socket, admin]);

  const fetchHistory = async (conversationId: string): Promise<ChatMessage[]> => {
     try {
       const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050'}/api/chat/${conversationId}/messages`, {
         headers: {
           'Authorization': `Bearer ${adminToken}`
         }
       });
       const data = await res.json();
       return data.success ? data.data : [];
     } catch {
       return [];
     }
  };

  const searchContacts = async (query: string): Promise<ChatContact[]> => {
     try {
       const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050'}/api/chat/contacts?q=${query}`, {
         headers: {
           'Authorization': `Bearer ${adminToken}`
         }
       });
       const data = await res.json();
       return data.success ? data.data.filter((c: any) => c._id !== admin?._id) : [];
     } catch {
       return [];
     }
  };

  return (
    <ChatContext.Provider value={{
      socket,
      onlineUsers,
      activeChats,
      conversations,
      unreadTotal,
      openChat,
      closeChat,
      sendMessage,
      markAsRead,
      fetchHistory,
      searchContacts
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
};
