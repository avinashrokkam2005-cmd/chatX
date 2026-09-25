import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import conversationApi from '../services/conversationApi';
import messageApi from '../services/messageApi';
import presenceApi from '../../presence/services/presenceApi';
import fileApi from '../../files/services/fileApi';
import wsService from '../../../services/websocket';
import { ConversationDto } from '../../../types/conversation';
import { MessageDto, MessageAttachmentDto } from '../../../types/message';
import { CreateGroupModal } from '../components/CreateGroupModal';
import { NotificationDropdown } from '../../notifications/components/NotificationDropdown';
import { ReportModal } from '../../reports/components/ReportModal';
import {
  MessageSquare,
  Search,
  Plus,
  Users,
  Send,
  MoreVertical,
  ArrowLeft,
  Loader2,
  Calendar,
  Sparkles,
  Smile,
  Reply,
  Pencil,
  Trash2,
  X,
  Check,
  CheckCheck,
  Paperclip,
  FileText,
  Download,
  Flag,
  Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '🔥', '🎉', '😮'];

export const ChatPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<ConversationDto[]>([]);
  const [selectedConv, setSelectedConv] = useState<ConversationDto | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [showMemberDetails, setShowMemberDetails] = useState(false);

  // Messaging state
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<MessageDto | null>(null);
  const [editingMessage, setEditingMessage] = useState<MessageDto | null>(null);
  const [editInput, setEditInput] = useState('');
  const [activeReactionMessageId, setActiveReactionMessageId] = useState<string | null>(null);

  // Moderation Report state
  const [reportModalData, setReportModalData] = useState<{
    isOpen: boolean;
    targetType: 'USER' | 'MESSAGE' | 'CONVERSATION';
    targetId: string;
    targetLabel?: string;
  } | null>(null);

  // File attachment state
  const [pendingAttachment, setPendingAttachment] = useState<MessageAttachmentDto | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Real-Time Presence & Typing state
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sendTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Connect WebSocket on user auth
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      wsService.connect(token).then(() => {
        // Subscribe to global presence events
        const sub = wsService.subscribeToPresence((event: any) => {
          if (event && event.payload) {
            const { userId, status } = event.payload;
            setOnlineUsers((prev) => ({
              ...prev,
              [userId]: status === 'ONLINE',
            }));
          }
        });
        return () => sub?.unsubscribe();
      }).catch((err) => {
        console.warn('[WebSocket] Connection failed, using HTTP polling fallback:', err);
      });
    }

    return () => {
      // Cleanup typing timers
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (sendTypingTimeoutRef.current) clearTimeout(sendTypingTimeoutRef.current);
    };
  }, [currentUser]);

  const fetchConversations = async () => {
    try {
      setIsLoadingChats(true);
      const data = await conversationApi.getUserConversations();
      setConversations(data);

      if (conversationId) {
        const detailed = await conversationApi.getConversationById(conversationId);
        setSelectedConv(detailed);
      }

      // Check online status for direct participants
      const userIds = data
        .filter((c) => c.type === 'DIRECT' && c.directParticipant)
        .map((c) => c.directParticipant!.id);
      if (userIds.length > 0) {
        presenceApi.getOnlineStatusBatch(userIds).then((statuses) => {
          setOnlineUsers((prev) => ({ ...prev, ...statuses }));
        }).catch(() => {});
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsLoadingChats(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      setIsLoadingMessages(true);
      const msgs = await messageApi.getConversationMessages(convId, undefined, 50);
      setMessages([...msgs].reverse());
      await messageApi.markConversationAsRead(convId);
      setTimeout(() => scrollToBottom('auto'), 50);
    } catch (err: any) {
      console.error('Failed to load messages:', err);
      toast.error('Failed to load message history');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Handle active conversation selection & WebSocket topic subscription
  useEffect(() => {
    if (conversationId) {
      conversationApi
        .getConversationById(conversationId)
        .then((detailed) => {
          setSelectedConv(detailed);
          fetchMessages(conversationId);
        })
        .catch((err) => {
          console.error(err);
          toast.error('Conversation not found');
        });

      // Subscribe to conversation STOMP topic
      const convSub = wsService.subscribeToConversation(conversationId, (event: any) => {
        if (!event) return;
        const type = event.type;
        const payload = event.payload;

        if (type === 'NEW_MESSAGE' && payload) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.id)) return prev;
            return [...prev, payload];
          });

          // Update sidebar snippet
          setConversations((prev) =>
            prev.map((c) =>
              c.id === conversationId
                ? {
                    ...c,
                    lastMessageContent: payload.content,
                    lastMessageAt: payload.createdAt,
                    lastMessageSenderUsername: payload.senderUsername,
                  }
                : c
            )
          );
        } else if (type === 'MESSAGE_EDITED' && payload) {
          setMessages((prev) => prev.map((m) => (m.id === payload.id ? payload : m)));
        } else if (type === 'MESSAGE_DELETED' && payload) {
          setMessages((prev) => prev.map((m) => (m.id === payload.id ? payload : m)));
        } else if (type === 'REACTION_UPDATED' && payload) {
          const { messageId, reactions } = payload;
          setMessages((prev) =>
            prev.map((m) => (m.id === messageId ? { ...m, reactions } : m))
          );
        }
      });

      // Subscribe to typing indicator STOMP topic
      const typingSub = wsService.subscribeToTyping(conversationId, (event: any) => {
        if (!event || !event.payload) return;
        const { userId, username, isTyping } = event.payload;
        if (userId === currentUser?.id) return;

        if (isTyping) {
          setTypingUser(username);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setTypingUser(null);
          }, 3500);
        } else {
          setTypingUser(null);
        }
      });

      return () => {
        convSub?.unsubscribe();
        typingSub?.unsubscribe();
        setTypingUser(null);
      };
    } else {
      setSelectedConv(null);
      setMessages([]);
    }
  }, [conversationId, currentUser?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUser]);

  const handleSelectConversation = (conv: ConversationDto) => {
    navigate(`/chat/${conv.id}`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    if (!selectedConv) return;

    // Send typing event to WebSocket
    wsService.sendTyping(selectedConv.id, true);

    if (sendTypingTimeoutRef.current) clearTimeout(sendTypingTimeoutRef.current);
    sendTypingTimeoutRef.current = setTimeout(() => {
      if (selectedConv) {
        wsService.sendTyping(selectedConv.id, false);
      }
    }, 2500);
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File exceeds 10MB limit');
      return;
    }

    try {
      setIsUploadingFile(true);
      const res = await fileApi.uploadFile(file);
      setPendingAttachment({
        fileName: res.fileName,
        fileUrl: res.fileUrl,
        fileType: res.fileType,
        fileSize: res.fileSize,
      });
      toast.success('File attached');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'File upload failed');
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageInput.trim() && !pendingAttachment) || !selectedConv || isSending) return;

    const content = messageInput.trim();
    setIsSending(true);

    // Turn off typing indicator immediately on send
    if (sendTypingTimeoutRef.current) clearTimeout(sendTypingTimeoutRef.current);
    wsService.sendTyping(selectedConv.id, false);

    try {
      const type = pendingAttachment
        ? pendingAttachment.fileType?.startsWith('image/')
          ? 'IMAGE'
          : 'FILE'
        : 'TEXT';

      const sentMsg = await messageApi.sendMessage({
        conversationId: selectedConv.id,
        content: content || (pendingAttachment ? `[${pendingAttachment.fileName}]` : ''),
        type,
        replyToMessageId: replyingTo ? replyingTo.id : undefined,
        attachments: pendingAttachment ? [pendingAttachment] : undefined,
      });

      setMessages((prev) => {
        if (prev.some((m) => m.id === sentMsg.id)) return prev;
        return [...prev, sentMsg];
      });
      setMessageInput('');
      setReplyingTo(null);
      setPendingAttachment(null);

      // Update sidebar snippet
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConv.id
            ? {
                ...c,
                lastMessageContent: content || `[${sentMsg.type}]`,
                lastMessageAt: sentMsg.createdAt,
                lastMessageSenderUsername: currentUser?.username,
              }
            : c
        )
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingMessage || !editInput.trim()) return;

    try {
      const updated = await messageApi.editMessage(editingMessage.id, {
        content: editInput.trim(),
      });
      setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setEditingMessage(null);
      setEditInput('');
      toast.success('Message updated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to edit message');
    }
  };

  const handleDeleteMessage = async (msg: MessageDto) => {
    if (!window.confirm('Delete this message for everyone?')) return;

    try {
      const updated = await messageApi.deleteMessage(msg.id);
      setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      toast.success('Message deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete message');
    }
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    try {
      const updatedReactions = await messageApi.toggleReaction(messageId, emoji);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reactions: updatedReactions } : m))
      );
      setActiveReactionMessageId(null);
    } catch (err: any) {
      toast.error('Failed to react');
    }
  };

  const isPartnerOnline =
    selectedConv?.type === 'DIRECT' &&
    selectedConv.directParticipant &&
    onlineUsers[selectedConv.directParticipant.id];

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col bg-chatx-bg text-chatx-text overflow-hidden">
      {/* Top Navbar */}
      <header className="border-b border-chatx-border bg-chatx-surface/90 backdrop-blur-md px-6 py-3 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-chatx-accent/10 border border-chatx-accent/20 flex items-center justify-center text-chatx-accent">
              <MessageSquare className="w-4 h-4" />
            </div>
            <span className="font-bold text-base text-white tracking-tight">ChatX</span>
          </Link>
          <span className="text-xs px-2 py-0.5 rounded bg-chatx-card text-chatx-text-secondary border border-chatx-border flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Real-Time WebSocket Active</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <NotificationDropdown />
          <Link
            to="/friends"
            className="p-2 rounded-lg bg-chatx-card hover:bg-chatx-hover border border-chatx-border text-chatx-text-secondary hover:text-white transition-colors"
            title="Friends"
          >
            <Users className="w-4 h-4" />
          </Link>
          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') && (
            <Link
              to="/admin"
              className="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 transition-colors"
              title="Admin Moderation Portal"
            >
              <Shield className="w-4 h-4" />
            </Link>
          )}
          <Link
            to="/profile"
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-chatx-card transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-chatx-accent to-purple-600 flex items-center justify-center font-bold text-white text-xs overflow-hidden">
              {currentUser?.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.username} className="w-full h-full object-cover" />
              ) : (
                currentUser?.username.charAt(0).toUpperCase()
              )}
            </div>
            <span className="text-xs font-semibold text-white hidden sm:inline">@{currentUser?.username}</span>
          </Link>
        </div>
      </header>

      {/* Main Chat Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Conversations List */}
        <aside
          className={`w-full sm:w-80 md:w-96 border-r border-chatx-border bg-chatx-surface/40 flex flex-col shrink-0 ${
            selectedConv ? 'hidden sm:flex' : 'flex'
          }`}
        >
          {/* Header & New Group button */}
          <div className="p-4 border-b border-chatx-border/60 flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Conversations</h2>
            <button
              onClick={() => setIsGroupModalOpen(true)}
              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
              title="Create new group chat"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Group</span>
            </button>
          </div>

          {/* Search conversations */}
          <div className="p-3 border-b border-chatx-border/40">
            <div className="relative">
              <Search className="w-4 h-4 text-chatx-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter chats..."
                className="input-field pl-9 py-1.5 text-xs bg-chatx-card/60"
              />
            </div>
          </div>

          {/* Conversations Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-chatx-border/30 p-2">
            {isLoadingChats ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 text-chatx-accent animate-spin" />
                <span className="text-xs text-chatx-text-secondary">Loading chats...</span>
              </div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => {
                const isSelected = selectedConv?.id === conv.id;
                const isOnline =
                  conv.type === 'DIRECT' &&
                  conv.directParticipant &&
                  onlineUsers[conv.directParticipant.id];

                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-chatx-accent/15 border border-chatx-accent/30'
                        : 'hover:bg-chatx-hover/60 border border-transparent'
                    }`}
                  >
                    {/* Avatar with live status dot */}
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-chatx-accent to-purple-600 flex items-center justify-center font-bold text-white text-sm overflow-hidden shadow-sm">
                        {conv.avatarUrl ? (
                          <img src={conv.avatarUrl} alt={conv.name} className="w-full h-full object-cover" />
                        ) : conv.type === 'GROUP' ? (
                          <Users className="w-5 h-5" />
                        ) : (
                          conv.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      {conv.type === 'DIRECT' && isOnline && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-chatx-bg ring-1 ring-emerald-400" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold text-xs text-white truncate">{conv.name}</span>
                        {conv.lastMessageAt && (
                          <span className="text-[10px] text-chatx-text-secondary shrink-0">
                            {format(new Date(conv.lastMessageAt), 'HH:mm')}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs text-chatx-text-secondary truncate">
                          {conv.lastMessageContent
                            ? (conv.type === 'GROUP' && conv.lastMessageSenderUsername
                                ? `@${conv.lastMessageSenderUsername}: `
                                : '') + conv.lastMessageContent
                            : conv.type === 'GROUP'
                            ? `${conv.memberCount} members`
                            : 'No messages yet'}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-chatx-accent text-white text-[10px] font-bold shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-16 text-center px-4">
                <MessageSquare className="w-8 h-8 text-chatx-text-secondary/40 mx-auto mb-2" />
                <p className="text-xs font-semibold text-white">No conversations yet</p>
                <p className="text-[11px] text-chatx-text-secondary mt-1">
                  Start a conversation from Friends, Search (Ctrl+K), or create a New Group.
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* Right Pane: Active Chat Window */}
        <main className={`flex-1 flex flex-col bg-chatx-bg ${!selectedConv ? 'hidden sm:flex' : 'flex'}`}>
          {selectedConv ? (
            <>
              {/* Active Conversation Header */}
              <div className="p-3.5 px-6 border-b border-chatx-border bg-chatx-surface/60 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3.5 min-w-0">
                  <button
                    onClick={() => {
                      setSelectedConv(null);
                      navigate('/chat');
                    }}
                    className="sm:hidden p-1.5 rounded-lg bg-chatx-card text-chatx-text-secondary hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-chatx-accent to-purple-600 flex items-center justify-center font-bold text-white text-sm overflow-hidden shadow">
                      {selectedConv.avatarUrl ? (
                        <img src={selectedConv.avatarUrl} alt={selectedConv.name} className="w-full h-full object-cover" />
                      ) : selectedConv.type === 'GROUP' ? (
                        <Users className="w-5 h-5" />
                      ) : (
                        selectedConv.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    {isPartnerOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-chatx-bg ring-1 ring-emerald-400" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-white truncate">{selectedConv.name}</h3>
                      {selectedConv.type === 'GROUP' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-chatx-accent/10 border border-chatx-accent/30 text-chatx-accent font-semibold">
                          Group ({selectedConv.memberCount})
                        </span>
                      ) : (
                        <span className="text-[11px] text-chatx-accent font-mono">
                          @{selectedConv.directParticipant?.username}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-chatx-text-secondary truncate mt-0.5 flex items-center gap-1.5">
                      {isPartnerOnline ? (
                        <span className="text-emerald-400 font-medium">Online</span>
                      ) : (
                        <span>
                          {selectedConv.description ||
                            (selectedConv.type === 'DIRECT' ? 'Direct private session' : 'Group communication')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setReportModalData({
                        isOpen: true,
                        targetType: selectedConv.type === 'DIRECT' ? 'USER' : 'CONVERSATION',
                        targetId:
                          selectedConv.type === 'DIRECT' && selectedConv.directParticipant
                            ? selectedConv.directParticipant.id
                            : selectedConv.id,
                        targetLabel:
                          selectedConv.type === 'DIRECT'
                            ? `@${selectedConv.directParticipant?.username || selectedConv.name}`
                            : selectedConv.name,
                      })
                    }
                    className="p-2 rounded-lg bg-chatx-card hover:bg-chatx-hover border border-chatx-border text-chatx-text-secondary hover:text-amber-400 transition-colors"
                    title={selectedConv.type === 'DIRECT' ? 'Report user' : 'Report conversation'}
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowMemberDetails(!showMemberDetails)}
                    className="p-2 rounded-lg bg-chatx-card hover:bg-chatx-hover border border-chatx-border text-chatx-text-secondary hover:text-white transition-colors"
                    title="View conversation details & members"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat View Area (Messages & Members) */}
              <div className="flex-1 flex overflow-hidden relative">
                {/* Messages Feed */}
                <div className="flex-1 flex flex-col justify-between overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                    {isLoadingMessages ? (
                      <div className="py-20 flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 text-chatx-accent animate-spin" />
                        <span className="text-xs text-chatx-text-secondary">Loading messages...</span>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="my-auto text-center max-w-sm mx-auto p-6 rounded-2xl glass-panel">
                        <div className="w-12 h-12 rounded-2xl bg-chatx-accent/10 border border-chatx-accent/20 flex items-center justify-center text-chatx-accent mx-auto mb-3">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-white text-sm mb-1">{selectedConv.name}</h4>
                        <p className="text-xs text-chatx-text-secondary leading-relaxed">
                          {selectedConv.type === 'DIRECT'
                            ? `This is the start of your direct conversation with @${selectedConv.directParticipant?.username}.`
                            : `Welcome to ${selectedConv.name}! Say hi to get things started.`}
                        </p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isOwn = msg.senderId === currentUser?.id;
                        const isDeleted = msg.isDeleted;

                        return (
                          <div
                            key={msg.id}
                            className={`group relative flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
                          >
                            {/* Group sender name for incoming messages */}
                            {!isOwn && selectedConv.type === 'GROUP' && (
                              <span className="text-[10px] text-chatx-accent font-semibold mb-1 ml-1">
                                {msg.senderDisplayName || msg.senderUsername}
                              </span>
                            )}

                            {/* Main Bubble Wrapper */}
                            <div className="relative max-w-[85%] sm:max-w-[70%]">
                              {/* Reply context pill */}
                              {msg.replyTo && (
                                <div className="mb-1 text-[11px] p-2 rounded-lg bg-black/30 border-l-2 border-chatx-accent text-chatx-text-secondary truncate">
                                  <span className="font-bold text-chatx-accent mr-1">
                                    @{msg.replyTo.senderUsername}:
                                  </span>
                                  <span>{msg.replyTo.content}</span>
                                </div>
                              )}

                              {/* Message Content Container */}
                              <div
                                className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm transition-all ${
                                  isOwn
                                    ? isDeleted
                                      ? 'bg-chatx-surface/80 border border-chatx-border/60 text-chatx-text-secondary italic'
                                      : 'bg-chatx-accent text-white rounded-br-none'
                                    : isDeleted
                                    ? 'bg-chatx-surface/60 border border-chatx-border/40 text-chatx-text-secondary italic'
                                    : 'bg-chatx-surface border border-chatx-border text-white rounded-bl-none'
                                }`}
                              >
                                {/* Media / File Attachments */}
                                {!isDeleted && msg.attachments && msg.attachments.length > 0 && (
                                  <div className="space-y-2 mb-2">
                                    {msg.attachments.map((att, idx) => {
                                      const isImg = att.fileType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(att.fileName);
                                      const fullUrl = att.fileUrl.startsWith('http') ? att.fileUrl : `http://localhost:8080${att.fileUrl}`;
                                      return isImg ? (
                                        <div key={idx} className="rounded-xl overflow-hidden max-w-xs cursor-pointer border border-white/10" onClick={() => window.open(fullUrl, '_blank')}>
                                          <img src={fullUrl} alt={att.fileName} className="w-full h-auto max-h-60 object-cover hover:opacity-90 transition-opacity" />
                                        </div>
                                      ) : (
                                        <a
                                          key={idx}
                                          href={fullUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          download={att.fileName}
                                          className={`flex items-center gap-2 p-2 rounded-xl text-xs transition-colors ${
                                            isOwn ? 'bg-black/20 hover:bg-black/30 text-white' : 'bg-chatx-card hover:bg-chatx-card/80 text-chatx-text'
                                          }`}
                                        >
                                          <FileText className="w-4 h-4 shrink-0 text-chatx-accent" />
                                          <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{att.fileName}</p>
                                            {att.fileSize && (
                                              <p className="text-[10px] opacity-70">
                                                {(att.fileSize / 1024).toFixed(1)} KB
                                              </p>
                                            )}
                                          </div>
                                          <Download className="w-3.5 h-3.5 shrink-0 opacity-70" />
                                        </a>
                                      );
                                    })}
                                  </div>
                                )}

                                <p className="whitespace-pre-wrap break-words">{msg.content}</p>

                                {/* Meta: time, edited badge, receipt status */}
                                <div
                                  className={`mt-1 flex items-center gap-1.5 justify-end text-[10px] ${
                                    isOwn ? 'text-white/70' : 'text-chatx-text-secondary'
                                  }`}
                                >
                                  {msg.isEdited && !isDeleted && <span>(edited)</span>}
                                  <span>{msg.createdAt ? format(new Date(msg.createdAt), 'HH:mm') : ''}</span>
                                  {isOwn && !isDeleted && (
                                    <span>
                                      {msg.deliveryStatus === 'READ' ? (
                                        <CheckCheck className="w-3.5 h-3.5 text-blue-300 inline" />
                                      ) : (
                                        <Check className="w-3.5 h-3.5 inline" />
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Reactions Pills */}
                              {msg.reactions && msg.reactions.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {msg.reactions.map((r) => (
                                    <button
                                      key={r.emoji}
                                      onClick={() => handleToggleReaction(msg.id, r.emoji)}
                                      className={`text-[11px] px-2 py-0.5 rounded-full border flex items-center gap-1 transition-all ${
                                        r.hasReacted
                                          ? 'bg-chatx-accent/20 border-chatx-accent text-chatx-accent font-semibold'
                                          : 'bg-chatx-surface border-chatx-border text-chatx-text-secondary hover:text-white'
                                      }`}
                                      title={r.usernames.join(', ')}
                                    >
                                      <span>{r.emoji}</span>
                                      <span>{r.count}</span>
                                    </button>
                                  ))}
                                </div>
                              )}

                              {/* Hover Floating Actions Menu */}
                              {!isDeleted && (
                                <div
                                  className={`absolute top-0 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-chatx-surface/95 border border-chatx-border shadow-lg rounded-xl px-1.5 py-1 z-10 ${
                                    isOwn ? 'right-0' : 'left-0'
                                  }`}
                                >
                                  {/* Quick reaction trigger */}
                                  <button
                                    onClick={() =>
                                      setActiveReactionMessageId(
                                        activeReactionMessageId === msg.id ? null : msg.id
                                      )
                                    }
                                    className="p-1 rounded hover:bg-chatx-card text-chatx-text-secondary hover:text-white transition-colors"
                                    title="React"
                                  >
                                    <Smile className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Reply button */}
                                  <button
                                    onClick={() => {
                                      setReplyingTo(msg);
                                      setEditingMessage(null);
                                    }}
                                    className="p-1 rounded hover:bg-chatx-card text-chatx-text-secondary hover:text-white transition-colors"
                                    title="Reply"
                                  >
                                    <Reply className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Edit button (own message only) */}
                                  {isOwn && (
                                    <button
                                      onClick={() => {
                                        setEditingMessage(msg);
                                        setEditInput(msg.content);
                                        setReplyingTo(null);
                                      }}
                                      className="p-1 rounded hover:bg-chatx-card text-chatx-text-secondary hover:text-white transition-colors"
                                      title="Edit"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  {/* Delete button (own or admin) */}
                                  {isOwn && (
                                    <button
                                      onClick={() => handleDeleteMessage(msg)}
                                      className="p-1 rounded hover:bg-chatx-danger/20 text-chatx-text-secondary hover:text-chatx-danger transition-colors"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  {/* Report message button */}
                                  <button
                                    onClick={() =>
                                      setReportModalData({
                                        isOpen: true,
                                        targetType: 'MESSAGE',
                                        targetId: msg.id,
                                        targetLabel: `Message by @${msg.senderUsername}`,
                                      })
                                    }
                                    className="p-1 rounded hover:bg-chatx-card text-chatx-text-secondary hover:text-amber-400 transition-colors"
                                    title="Report message"
                                  >
                                    <Flag className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}

                              {/* Emoji Picker Popup */}
                              {activeReactionMessageId === msg.id && (
                                <div
                                  className={`absolute bottom-full mb-1 flex items-center gap-1 p-1.5 rounded-xl bg-chatx-card border border-chatx-border shadow-xl z-20 ${
                                    isOwn ? 'right-0' : 'left-0'
                                  }`}
                                >
                                  {QUICK_REACTIONS.map((emoji) => (
                                    <button
                                      key={emoji}
                                      onClick={() => handleToggleReaction(msg.id, emoji)}
                                      className="p-1.5 hover:bg-chatx-surface rounded-lg text-sm transition-transform hover:scale-125"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                  <button
                                    onClick={() => setActiveReactionMessageId(null)}
                                    className="p-1 text-chatx-text-secondary hover:text-white"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}

                    {/* Live Typing Indicator Bubble */}
                    {typingUser && (
                      <div className="flex items-center gap-2 p-2 px-3 rounded-2xl bg-chatx-surface border border-chatx-border w-max animate-in fade-in duration-200">
                        <span className="text-xs text-chatx-text-secondary italic">
                          @{typingUser} is typing
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-chatx-accent animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-chatx-accent animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-chatx-accent animate-bounce" />
                        </span>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Footer */}
                  <div className="p-3 sm:p-4 border-t border-chatx-border bg-chatx-surface/40 shrink-0">
                    {/* Replying banner */}
                    {replyingTo && (
                      <div className="mb-2 p-2 px-3 rounded-lg bg-chatx-card border border-chatx-border flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <Reply className="w-3.5 h-3.5 text-chatx-accent shrink-0" />
                          <span className="text-chatx-text-secondary truncate">
                            Replying to <span className="font-semibold text-white">@{replyingTo.senderUsername}</span>:{' '}
                            {replyingTo.content}
                          </span>
                        </div>
                        <button
                          onClick={() => setReplyingTo(null)}
                          className="text-chatx-text-secondary hover:text-white p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Editing banner */}
                    {editingMessage && (
                      <div className="mb-2 p-2 px-3 rounded-lg bg-chatx-accent/10 border border-chatx-accent/30 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <Pencil className="w-3.5 h-3.5 text-chatx-accent shrink-0" />
                          <span className="text-white font-semibold">Editing message</span>
                        </div>
                        <button
                          onClick={() => {
                            setEditingMessage(null);
                            setEditInput('');
                          }}
                          className="text-chatx-text-secondary hover:text-white p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Attachment preview banner */}
                    {pendingAttachment && (
                      <div className="mb-2 p-2 px-3 rounded-lg bg-chatx-card border border-chatx-border flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <Paperclip className="w-3.5 h-3.5 text-chatx-accent shrink-0" />
                          <span className="text-white font-medium truncate">{pendingAttachment.fileName}</span>
                          {pendingAttachment.fileSize && (
                            <span className="text-[10px] text-chatx-text-secondary">
                              ({(pendingAttachment.fileSize / 1024).toFixed(1)} KB)
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => setPendingAttachment(null)}
                          className="text-chatx-text-secondary hover:text-white p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {editingMessage ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editInput}
                          onChange={(e) => setEditInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') setEditingMessage(null);
                          }}
                          className="input-field text-xs py-2.5"
                          autoFocus
                        />
                        <button
                          onClick={handleSaveEdit}
                          disabled={!editInput.trim()}
                          className="btn-primary py-2.5 px-4 text-xs shrink-0"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleSendMessage} className="flex items-center gap-2 sm:gap-3">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileSelected}
                          className="hidden"
                          accept="image/*,video/mp4,audio/*,application/pdf,application/zip"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingFile || isSending}
                          className="p-2.5 rounded-xl bg-chatx-card hover:bg-chatx-hover border border-chatx-border text-chatx-text-secondary hover:text-white transition-colors shrink-0"
                          title="Attach file or image"
                        >
                          {isUploadingFile ? (
                            <Loader2 className="w-4 h-4 animate-spin text-chatx-accent" />
                          ) : (
                            <Paperclip className="w-4 h-4" />
                          )}
                        </button>
                        <input
                          type="text"
                          value={messageInput}
                          onChange={handleInputChange}
                          placeholder={`Message ${selectedConv.name}...`}
                          className="input-field text-xs py-2.5"
                          disabled={isSending}
                        />
                        <button
                          type="submit"
                          disabled={(!messageInput.trim() && !pendingAttachment) || isSending}
                          className="btn-primary py-2.5 px-4 flex items-center justify-center gap-1.5 shrink-0"
                        >
                          {isSending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span className="text-xs hidden sm:inline">Send</span>
                            </>
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                {/* Member Drawer (Sidebar when toggled) */}
                {showMemberDetails && (
                  <div className="w-72 border-l border-chatx-border bg-chatx-surface/90 backdrop-blur-md p-4 flex flex-col shrink-0 overflow-y-auto animate-in slide-in-from-right duration-200">
                    <div className="flex items-center justify-between pb-3 border-b border-chatx-border mb-4">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-white">Participants</h4>
                      <button
                        onClick={() => setShowMemberDetails(false)}
                        className="text-chatx-text-secondary hover:text-white"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {selectedConv.members?.map((member) => {
                        const isMemberOnline = onlineUsers[member.userId];
                        return (
                          <div
                            key={member.userId}
                            className="flex items-center justify-between gap-2 p-2 rounded-lg bg-chatx-card/60"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="relative shrink-0">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-chatx-accent to-purple-600 flex items-center justify-center font-bold text-white text-xs overflow-hidden">
                                  {member.avatarUrl ? (
                                    <img src={member.avatarUrl} alt={member.username} className="w-full h-full object-cover" />
                                  ) : (
                                    member.displayName?.charAt(0).toUpperCase() || member.username.charAt(0).toUpperCase()
                                  )}
                                </div>
                                {isMemberOnline && (
                                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-chatx-bg" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-xs text-white truncate">
                                  {member.displayName || member.username}
                                </div>
                                <div className="text-[10px] text-chatx-accent font-mono truncate">
                                  @{member.username}
                                </div>
                              </div>
                            </div>

                            {member.role === 'ADMIN' && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-chatx-accent/15 text-chatx-accent border border-chatx-accent/30 shrink-0">
                                ADMIN
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-auto pt-6 border-t border-chatx-border/60 text-[11px] text-chatx-text-secondary space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          Created {selectedConv.createdAt ? format(new Date(selectedConv.createdAt), 'PP') : 'recently'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-chatx-accent/10 border border-chatx-accent/20 flex items-center justify-center text-chatx-accent mb-4">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Select a Conversation</h3>
              <p className="text-xs text-chatx-text-secondary max-w-sm mt-1">
                Choose a conversation from the left sidebar or start a new group to begin messaging.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onGroupCreated={(newConv) => {
          setConversations([newConv, ...conversations]);
          setSelectedConv(newConv);
          navigate(`/chat/${newConv.id}`);
        }}
      />

      {/* Report Modal */}
      {reportModalData && (
        <ReportModal
          isOpen={reportModalData.isOpen}
          onClose={() => setReportModalData(null)}
          targetType={reportModalData.targetType}
          targetId={reportModalData.targetId}
          targetLabel={reportModalData.targetLabel}
        />
      )}
    </div>
  );
};

export default ChatPage;
