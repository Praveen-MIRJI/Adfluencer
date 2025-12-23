import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Send, MessageSquare, User } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Conversation, Message } from '../types';
import Button from '../components/ui/Button';
import { PageLoader } from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';

export default function Messages() {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newPartner, setNewPartner] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await api.get('/messages/conversations');
        setConversations(response.data.data || []);
        
        // Check if we need to start a new conversation from URL param
        const targetUserId = searchParams.get('user');
        if (targetUserId) {
          // Check if conversation already exists
          const existingConv = (response.data.data || []).find((c: Conversation) => c.partnerId === targetUserId);
          if (existingConv) {
            setSelectedConversation(targetUserId);
          } else {
            // Fetch the user info to start a new conversation
            try {
              // Try influencer endpoint first
              const userRes = await api.get(`/influencers/${targetUserId}`);
              if (userRes.data.data) {
                setNewPartner({
                  id: targetUserId,
                  email: userRes.data.data.user?.email || '',
                  role: 'INFLUENCER',
                  influencerProfile: { displayName: userRes.data.data.displayName, avatar: userRes.data.data.avatar }
                });
                setSelectedConversation(targetUserId);
              }
            } catch (e) {
              // Try to get user from a different source (e.g., from ad client info)
              try {
                // For clients, we might need to get info differently
                // Just set basic info for now
                setNewPartner({
                  id: targetUserId,
                  email: '',
                  role: 'CLIENT',
                  clientProfile: { companyName: 'Client' }
                });
                setSelectedConversation(targetUserId);
              } catch (e2) {
                console.error('Failed to fetch user for new conversation:', e2);
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, [searchParams]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async (partnerId: string) => {
    try {
      const response = await api.get(`/messages/conversation/${partnerId}`);
      setMessages(response.data.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      await api.post('/messages', {
        receiverId: selectedConversation,
        content: newMessage,
      });
      setNewMessage('');
      fetchMessages(selectedConversation);
      
      // If this was a new conversation, refresh the conversations list
      if (newPartner) {
        const response = await api.get('/messages/conversations');
        setConversations(response.data.data || []);
        setNewPartner(null);
      }
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getPartnerName = (conv: Conversation) => {
    if (conv.partner.role === 'CLIENT') {
      return conv.partner.clientProfile?.companyName || conv.partner.email;
    }
    return conv.partner.influencerProfile?.displayName || conv.partner.email;
  };

  const getSelectedPartnerName = () => {
    if (newPartner) {
      return newPartner.influencerProfile?.displayName || newPartner.clientProfile?.companyName || newPartner.email;
    }
    const conv = conversations.find(c => c.partnerId === selectedConversation);
    return conv ? getPartnerName(conv) : 'Unknown';
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Messages</h1>
        <p className="text-slate-400 mt-1">Communicate with clients and influencers</p>
      </div>

      <div className="bg-slate-800/50 rounded-lg border border-slate-600/50 overflow-hidden">
        <div className="grid md:grid-cols-3 h-[600px]">
          {/* Conversations List */}
          <div className="border-r border-slate-600/50 overflow-y-auto">
            {conversations.length === 0 && !newPartner ? (
              <div className="p-4 text-center text-slate-400">
                No conversations yet
              </div>
            ) : (
              <>
                {/* Show new partner at top if starting new conversation */}
                {newPartner && !conversations.find(c => c.partnerId === newPartner.id) && (
                  <button
                    onClick={() => setSelectedConversation(newPartner.id)}
                    className={`w-full p-4 text-left border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors ${
                      selectedConversation === newPartner.id ? 'bg-slate-700/50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-purple-500 flex items-center justify-center flex-shrink-0 text-white font-semibold">
                        {newPartner.influencerProfile?.displayName?.charAt(0) || newPartner.clientProfile?.companyName?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">
                          {newPartner.influencerProfile?.displayName || newPartner.clientProfile?.companyName || newPartner.email}
                        </p>
                        <p className="text-sm text-slate-400">New conversation</p>
                      </div>
                    </div>
                  </button>
                )}
                {conversations.map((conv) => (
                  <button
                    key={conv.partnerId}
                    onClick={() => setSelectedConversation(conv.partnerId)}
                    className={`w-full p-4 text-left border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors ${
                      selectedConversation === conv.partnerId ? 'bg-slate-700/50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-slate-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-white truncate">
                            {getPartnerName(conv)}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="bg-rose-600 text-white text-xs px-2 py-0.5 rounded-full">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-400 truncate">
                          {conv.lastMessage.content}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>

          {/* Messages Area */}
          <div className="md:col-span-2 flex flex-col bg-slate-900/30">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-600/50 bg-slate-800/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                      {getSelectedPartnerName().charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-white">{getSelectedPartnerName()}</p>
                      <p className="text-xs text-slate-400">
                        {messages.length > 0 ? `${messages.length} messages` : 'Start a conversation'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          msg.senderId === user?.id
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-700 text-white'
                        }`}
                      >
                        <p>{msg.content}</p>
                        <p className={`text-xs mt-1 ${
                          msg.senderId === user?.id ? 'text-rose-200' : 'text-slate-400'
                        }`}>
                          {format(new Date(msg.createdAt), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="p-4 border-t border-slate-600/50">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                    />
                    <Button type="submit" loading={sending} disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <EmptyState
                  icon={MessageSquare}
                  title="Select a conversation"
                  description="Choose a conversation from the list to start messaging"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
