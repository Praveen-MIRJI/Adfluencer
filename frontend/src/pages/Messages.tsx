import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { Send, MessageSquare, Search, Phone, Video, MoreVertical, Smile, Paperclip, CheckCheck, Circle, ArrowLeft } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Conversation, Message } from '../types';
import { PageLoader } from '../components/ui/Spinner';


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
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(true); // Mobile: show sidebar by default
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      // Focus input when conversation is selected
      setTimeout(() => inputRef.current?.focus(), 100);
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

  const getPartnerAvatar = (conv: Conversation) => {
    if (conv.partner.role === 'CLIENT') {
      return conv.partner.clientProfile?.companyName?.charAt(0).toUpperCase() || 'C';
    }
    return conv.partner.influencerProfile?.displayName?.charAt(0).toUpperCase() || 'I';
  };

  const getPartnerRole = (conv: Conversation) => {
    return conv.partner.role === 'CLIENT' ? 'Client' : 'Influencer';
  };

  const filteredConversations = conversations.filter(conv => {
    const name = getPartnerName(conv).toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  // Group messages by date
  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    msgs.forEach(msg => {
      const date = format(new Date(msg.createdAt), 'yyyy-MM-dd');
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) return 'Today';
    if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  const messageGroups = groupMessagesByDate(messages);

  if (loading) return <PageLoader />;

  return (
    <div className="h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Messages
        </h1>
        <p className="text-slate-400 mt-1">Chat with clients and influencers securely</p>
      </div>

      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl shadow-black/20 h-[calc(100%-80px)]">
        <div className="grid md:grid-cols-[340px_1fr] h-full">
          {/* Conversations Sidebar - Hidden on mobile when chat is open */}
          <div className={`border-r border-slate-700/50 flex flex-col bg-slate-800/30 ${!showMobileSidebar && selectedConversation ? 'hidden md:flex' : 'flex'}`}>
            {/* Sidebar Header */}
            <div className="p-4 border-b border-slate-700/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-600/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 && !newPartner ? (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mb-4">
                    <MessageSquare className="h-8 w-8 text-slate-500" />
                  </div>
                  <p className="text-slate-400 font-medium">No conversations yet</p>
                  <p className="text-sm text-slate-500 mt-1">Start messaging to connect with others</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/30">
                  {/* New partner conversation */}
                  {newPartner && !conversations.find(c => c.partnerId === newPartner.id) && (
                    <button
                      onClick={() => {
                        setSelectedConversation(newPartner.id);
                        setShowMobileSidebar(false);
                      }}
                      className={`w-full p-4 text-left hover:bg-slate-700/30 transition-all duration-200 ${selectedConversation === newPartner.id
                        ? 'bg-gradient-to-r from-rose-500/20 to-purple-500/10 border-l-2 border-rose-500'
                        : ''
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-rose-500/20">
                            {newPartner.influencerProfile?.displayName?.charAt(0)?.toUpperCase() ||
                              newPartner.clientProfile?.companyName?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-800"></span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-white truncate">
                              {newPartner.influencerProfile?.displayName || newPartner.clientProfile?.companyName || newPartner.email}
                            </p>
                            <span className="text-xs text-emerald-400 font-medium">New</span>
                          </div>
                          <p className="text-sm text-slate-400 truncate mt-0.5">Start a new conversation</p>
                        </div>
                      </div>
                    </button>
                  )}

                  {/* Existing conversations */}
                  {filteredConversations.map((conv) => (
                    <button
                      key={conv.partnerId}
                      onClick={() => {
                        setSelectedConversation(conv.partnerId);
                        setShowMobileSidebar(false);
                      }}
                      className={`w-full p-4 text-left hover:bg-slate-700/30 transition-all duration-200 ${selectedConversation === conv.partnerId
                        ? 'bg-gradient-to-r from-rose-500/20 to-purple-500/10 border-l-2 border-rose-500'
                        : ''
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${conv.partner.role === 'CLIENT'
                            ? 'bg-gradient-to-br from-blue-500 to-cyan-600 shadow-blue-500/20'
                            : 'bg-gradient-to-br from-purple-500 to-pink-600 shadow-purple-500/20'
                            }`}>
                            {getPartnerAvatar(conv)}
                          </div>
                          <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-800 ${Math.random() > 0.5 ? 'bg-emerald-500' : 'bg-slate-500'
                            }`}></span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-white truncate">
                              {getPartnerName(conv)}
                            </p>
                            <span className="text-xs text-slate-500">
                              {conv.lastMessage?.createdAt && formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: false })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <p className="text-sm text-slate-400 truncate flex-1 mr-2">
                              {conv.lastMessage?.content || 'No messages yet'}
                            </p>
                            {conv.unreadCount > 0 && (
                              <span className="flex-shrink-0 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-lg shadow-rose-500/30">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{getPartnerRole(conv)}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Messages Area - Hidden on mobile when sidebar is shown */}
          <div className={`flex flex-col bg-gradient-to-b from-slate-900/50 to-slate-900/80 ${showMobileSidebar && selectedConversation ? 'hidden md:flex' : !selectedConversation ? 'hidden md:flex' : 'flex'}`}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="px-4 sm:px-6 py-4 border-b border-slate-700/50 bg-slate-800/40 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4">
                      {/* Mobile Back Button */}
                      <button
                        onClick={() => setShowMobileSidebar(true)}
                        className="md:hidden p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </button>
                      <div className="relative">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-rose-500/20">
                          {getSelectedPartnerName().charAt(0).toUpperCase()}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-800"></span>
                      </div>
                      <div>
                        <h2 className="font-semibold text-white text-lg">{getSelectedPartnerName()}</h2>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-xs text-emerald-400">
                            <Circle className="h-2 w-2 fill-emerald-400" />
                            Online
                          </span>
                          <span className="text-xs text-slate-500">•</span>
                          <span className="text-xs text-slate-400">
                            {messages.length} message{messages.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2.5 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-all duration-200">
                        <Phone className="h-4 w-4" />
                      </button>
                      <button className="p-2.5 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-all duration-200">
                        <Video className="h-4 w-4" />
                      </button>
                      <button className="p-2.5 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-all duration-200">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                        <MessageSquare className="h-10 w-10 text-rose-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">Start the conversation</h3>
                      <p className="text-slate-400 text-sm max-w-sm">
                        Send a message to {getSelectedPartnerName()} to begin your collaboration
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(messageGroups).map(([date, msgs]) => (
                        <div key={date}>
                          {/* Date Divider */}
                          <div className="flex items-center gap-4 my-6">
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
                            <span className="text-xs font-medium text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full">
                              {getDateLabel(date)}
                            </span>
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
                          </div>

                          {/* Messages for this date */}
                          <div className="space-y-3">
                            {msgs.map((msg, index) => {
                              const isOwn = msg.senderId === user?.id;
                              const showAvatar = index === 0 || msgs[index - 1]?.senderId !== msg.senderId;

                              return (
                                <div
                                  key={msg.id}
                                  className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                                >
                                  {!isOwn && (
                                    <div className={`w-8 h-8 rounded-full flex-shrink-0 ${showAvatar ? 'visible' : 'invisible'}`}>
                                      <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-xs font-bold">
                                        {getSelectedPartnerName().charAt(0).toUpperCase()}
                                      </div>
                                    </div>
                                  )}
                                  <div className={`group max-w-[65%] ${isOwn ? 'order-1' : ''}`}>
                                    <div
                                      className={`px-4 py-2.5 rounded-2xl shadow-lg ${isOwn
                                        ? 'bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-br-md'
                                        : 'bg-slate-700/80 text-white rounded-bl-md'
                                        }`}
                                    >
                                      <p className="text-sm leading-relaxed">{msg.content}</p>
                                    </div>
                                    <div className={`flex items-center gap-1.5 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                      <span className="text-[10px] text-slate-500">
                                        {format(new Date(msg.createdAt), 'h:mm a')}
                                      </span>
                                      {isOwn && (
                                        <CheckCheck className="h-3 w-3 text-rose-400" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="px-6 py-2">
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                      <span>{getSelectedPartnerName()} is typing...</span>
                    </div>
                  </div>
                )}

                {/* Message Input */}
                <form onSubmit={handleSend} className="p-4 border-t border-slate-700/50 bg-slate-800/30">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="p-2.5 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-all duration-200"
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>
                    <div className="flex-1 relative">
                      <input
                        ref={inputRef}
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="w-full px-5 py-3 bg-slate-900/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-transparent transition-all pr-12"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                      >
                        <Smile className="h-5 w-5" />
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className={`p-3 rounded-xl font-medium transition-all duration-200 ${newMessage.trim() && !sending
                        ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 hover:scale-105'
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        }`}
                    >
                      {sending ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6">
                    <MessageSquare className="h-12 w-12 text-rose-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Your Messages</h2>
                  <p className="text-slate-400 max-w-sm">
                    Select a conversation from the sidebar to start messaging, or search for a specific contact.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
