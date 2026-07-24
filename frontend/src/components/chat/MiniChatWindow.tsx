'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChat, ChatMessage, ChatContact } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { X, Send, Paperclip, Check, CheckCheck } from 'lucide-react';

export const MessageBubble = ({ message, isMe }: { message: ChatMessage, isMe: boolean }) => {
  return (
    <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${isMe ? 'bg-purple-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
        <p>{message.content}</p>
        {message.attachments?.map((att, i) => (
           <div key={i} className="mt-1">
             <a href={att.url} target="_blank" rel="noreferrer" className="underline text-xs">View Attachment</a>
           </div>
        ))}
        <div className={`text-[10px] text-right mt-1 ${isMe ? 'text-purple-200' : 'text-gray-400'} flex justify-end items-center space-x-1`}>
          <span>{new Date(message.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          {isMe && (
            <span>
              {message.isReadBy.length > 1 ? (
                <CheckCheck size={12} className="text-blue-300" />
              ) : (
                <Check size={12} className="opacity-70" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export const MiniChatWindow = ({ contact, onClose }: { contact: ChatContact, onClose: () => void }) => {
  const { sendMessage, socket, markAsRead, onlineUsers, fetchHistory } = useChat();
  const { admin, adminToken } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Here we would ideally fetch the conversationId and past history using `fetchHistory`
  // For MVP, we just listen to incoming messages
  useEffect(() => {
    if (!socket || !admin) return;

    const handleMessage = (msg: ChatMessage) => {
      if (conversationId && msg.conversationId === conversationId) {
        setMessages(prev => [...prev, msg]);
        if (msg.senderId === contact._id && admin._id) {
           markAsRead(msg.conversationId, [msg._id]);
        }
      } else if (msg.senderId === contact._id) {
        setConversationId(msg.conversationId);
        setMessages(prev => [...prev, msg]);
        if (admin._id) {
           markAsRead(msg.conversationId, [msg._id]);
        }
      }
    };

    socket.on('receive_message', handleMessage);
    return () => {
      socket.off('receive_message', handleMessage);
    };
  }, [socket, contact._id, admin, markAsRead, conversationId]);

  // Fetch initial history
  useEffect(() => {
    const initChat = async () => {
      if (!admin || !adminToken) return;
      try {
        const payload = {
          senderId: admin._id,
          senderModel: admin.role === 'staff' || admin.role === 'staff_admin' ? 'StaffMember' : 'Admin',
          senderName: (admin as any).name || (admin.firstName ? `${admin.firstName} ${admin.lastName || ''}`.trim() : 'Unknown User'),
          receiverId: contact._id,
          receiverModel: contact.userModel,
          receiverName: contact.name
        };

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050'}/api/chat/conversations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.success && data.data) {
          const convId = data.data._id;
          setConversationId(convId);
          
          // Now fetch history
          const history = await fetchHistory(convId);
          setMessages(history);
        }
      } catch (e) {
        console.error('Failed to init chat history:', e);
      }
    };
    initChat();
  }, [admin, adminToken, contact, fetchHistory]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !selectedFile) return;
    
    try {
      setIsUploading(true);
      let attachments: any[] = [];
      
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('folder', 'chat-attachments');
        
        const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050'}/api/upload`, {
          method: 'POST',
          headers: {
             'Authorization': `Bearer ${adminToken}`
          },
          body: formData
        });
        
        const uploadPayload = await uploadRes.json();
        if (uploadRes.ok && uploadPayload.success) {
          attachments.push({
            url: uploadPayload.url,
            name: selectedFile.name,
            type: selectedFile.type
          });
        }
      }

      const msg = await sendMessage(contact, input || (selectedFile ? 'Shared an attachment' : ''), attachments);
      setConversationId(msg.conversationId);
      setMessages(prev => [...prev, msg]);
      setInput('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-72 h-96 bg-white rounded-t-xl shadow-2xl flex flex-col border border-gray-200 mr-4 z-50">
      <div className="bg-purple-600 text-white px-3 py-2 rounded-t-xl flex justify-between items-center cursor-pointer">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${onlineUsers.includes(contact._id) ? 'bg-green-400' : 'bg-gray-400'}`}></div>
          <h3 className="font-medium text-sm truncate">{contact.name}</h3>
        </div>
        <button onClick={onClose} className="hover:bg-purple-700 p-1 rounded-full"><X size={16} /></button>
      </div>
      
      <div className="flex-1 p-3 overflow-y-auto bg-gray-50 flex flex-col">
        {messages.map((m, i) => (
          <MessageBubble key={m._id || i} message={m} isMe={m.senderId === admin?._id} />
        ))}
        <div ref={bottomRef} />
      </div>

      {selectedFile && (
        <div className="px-3 py-2 bg-purple-50 border-t flex justify-between items-center text-xs text-purple-700">
          <span className="truncate pr-2">{selectedFile.name}</span>
          <button onClick={() => setSelectedFile(null)} className="hover:text-red-500"><X size={14} /></button>
        </div>
      )}

      <div className="p-2 border-t bg-white">
        <form onSubmit={handleSend} className="flex items-center space-x-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            className="hidden" 
          />
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()} 
            className={`text-gray-400 hover:text-purple-600 ${selectedFile ? 'text-purple-600' : ''}`}
          >
            <Paperclip size={18} />
          </button>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-100 rounded-full px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
            disabled={isUploading}
          />
          <button 
            type="submit" 
            disabled={(!input.trim() && !selectedFile) || isUploading} 
            className="text-purple-600 disabled:opacity-50"
          >
            {isUploading ? <span className="animate-pulse text-xs font-bold">...</span> : <Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
};
