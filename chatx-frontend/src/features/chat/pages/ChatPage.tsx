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
import { ConversationInfoDrawer } from '../components/ConversationInfoDrawer';
import { ProfileDrawer } from '../components/ProfileDrawer';
import { NewChatDrawer } from '../components/NewChatDrawer';
import {
  MessageSquare,
  Search,
  Users,
  Send,
  MoreVertical,
  ArrowLeft,
  Loader2,
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
  CircleDashed,
  MessageSquarePlus,
  Filter,
  Lock,
  Mic,
  Image as ImageIcon,
  Laptop,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '🔥', '🎉', '😮'];

export const ChatPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const { user: currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<ConversationDto[]>([]);
  const [selectedConv, setSelectedConv] = useState<ConversationDto | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(true);

  // Drawers and Modals state
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [isNewChatDrawerOpen, setIsNewChatDrawerOpen] = useState(false);
  const [isInfoDrawerOpen, setIsInfoDrawerOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);

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
        console.warn('[WebSocket] Connection failed, fallback active:', err);
      });
    }

    return () => {
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
      setIsAttachmentMenuOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageInput.trim() && !pendingAttachment) || !selectedConv || isSending) return;

    const content = messageInput.trim();
    setIsSending(true);

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

  const filteredConversations = conversations
    .filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((c) => (filterUnreadOnly ? c.unreadCount > 0 : true));

  return (
    <div className="h-screen w-screen flex bg-wa-bg text-wa-text overflow-hidden font-sans select-none">
      {/* ======================================================== */}
      {/* LEFT PANEL: Chats List / Sidebars                        */}
      {/* ======================================================== */}
      <aside
        className={`w-full sm:w-[400px] md:w-[450px] border-r border-wa-border bg-wa-bg flex flex-col shrink-0 relative ${
          selectedConv ? 'hidden sm:flex' : 'flex'
        }`}
      >
        {/* Sidebar Header (WhatsApp Web 60px header) */}
        <header className="h-[60px] bg-wa-header px-4 flex items-center justify-between border-b border-wa-border shrink-0 z-10">
          {/* User Profile Avatar */}
          <div
            onClick={() => setIsProfileDrawerOpen(true)}
            className="w-10 h-10 rounded-full overflow-hidden bg-wa-panel border border-wa-border cursor-pointer flex items-center justify-center text-wa-green font-bold text-sm hover:opacity-90 transition-opacity"
            title="Profile"
          >
            {currentUser?.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt={currentUser.username} className="w-full h-full object-cover" />
            ) : (
              currentUser?.username.charAt(0).toUpperCase()
            )}
          </div>

          {/* Header Action Icons */}
          <div className="flex items-center gap-1 text-wa-text-secondary">
            {/* Status icon */}
            <button
              className="wa-icon-btn p-2 rounded-full"
              title="Status"
            >
              <CircleDashed className="w-5 h-5 text-wa-text-secondary hover:text-wa-text" />
            </button>

            {/* New Chat icon */}
            <button
              onClick={() => setIsNewChatDrawerOpen(true)}
              className="wa-icon-btn p-2 rounded-full"
              title="New chat"
            >
              <MessageSquarePlus className="w-5 h-5 text-wa-text-secondary hover:text-wa-text" />
            </button>

            {/* Notifications Dropdown */}
            <NotificationDropdown />

            {/* Admin Shield (if user is admin) */}
            {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') && (
              <Link
                to="/admin"
                className="p-2 rounded-full hover:bg-wa-hover text-amber-400 transition-colors"
                title="Admin Moderation Portal"
              >
                <Shield className="w-5 h-5" />
              </Link>
            )}

            {/* 3-dots Menu dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="wa-icon-btn p-2 rounded-full"
                title="Menu"
              >
                <MoreVertical className="w-5 h-5 text-wa-text-secondary hover:text-wa-text" />
              </button>

              {isMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-1 w-48 bg-wa-panel border border-wa-border rounded-xl shadow-2xl py-1.5 z-50 text-sm animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <button
                    onClick={() => setIsGroupModalOpen(true)}
                    className="w-full text-left px-4 py-2 hover:bg-wa-hover text-wa-text transition-colors"
                  >
                    New group
                  </button>
                  <button
                    onClick={() => setIsProfileDrawerOpen(true)}
                    className="w-full text-left px-4 py-2 hover:bg-wa-hover text-wa-text transition-colors"
                  >
                    Profile
                  </button>
                  <Link
                    to="/friends"
                    className="block w-full text-left px-4 py-2 hover:bg-wa-hover text-wa-text transition-colors"
                  >
                    Contacts & Friends
                  </Link>
                  <div className="my-1 border-t border-wa-border/50" />
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 hover:bg-wa-hover text-red-400 transition-colors"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Search Bar & Unread Filter */}
        <div className="px-3 py-2 bg-wa-bg flex items-center gap-2 border-b border-wa-border/50 shrink-0">
          <div className="bg-wa-panel rounded-lg px-3 py-1.5 flex items-center gap-4 flex-1">
            <Search className="w-4 h-4 text-wa-text-secondary shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search or start new chat"
              className="w-full bg-transparent text-sm text-wa-text placeholder-wa-text-secondary outline-none"
            />
          </div>
          <button
            onClick={() => setFilterUnreadOnly(!filterUnreadOnly)}
            className={`p-2 rounded-full transition-colors ${
              filterUnreadOnly
                ? 'bg-wa-green text-wa-bg'
                : 'hover:bg-wa-hover text-wa-text-secondary hover:text-wa-text'
            }`}
            title="Filter unread chats"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Chat List Scroll View */}
        <div className="flex-1 overflow-y-auto divide-y divide-wa-border/30 custom-scrollbar">
          {isLoadingChats ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 text-wa-green animate-spin" />
              <span className="text-xs text-wa-text-secondary">Loading chats...</span>
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
                  className={`h-[72px] px-3.5 flex items-center gap-3.5 cursor-pointer transition-colors ${
                    isSelected ? 'bg-wa-active' : 'hover:bg-wa-hover'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full bg-wa-panel border border-wa-border/60 flex items-center justify-center font-bold text-wa-green text-base overflow-hidden">
                      {conv.avatarUrl ? (
                        <img src={conv.avatarUrl} alt={conv.name} className="w-full h-full object-cover" />
                      ) : conv.type === 'GROUP' ? (
                        <Users className="w-6 h-6 text-wa-text-secondary" />
                      ) : (
                        conv.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    {conv.type === 'DIRECT' && isOnline && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-wa-green border-2 border-wa-bg" />
                    )}
                  </div>

                  {/* Chat Info */}
                  <div className="flex-1 min-w-0 border-b border-wa-border/20 py-2.5 h-full flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-normal text-base text-wa-text truncate">{conv.name}</span>
                      {conv.lastMessageAt && (
                        <span
                          className={`text-xs shrink-0 ${
                            conv.unreadCount > 0 ? 'text-wa-green font-medium' : 'text-wa-text-secondary'
                          }`}
                        >
                          {format(new Date(conv.lastMessageAt), 'HH:mm')}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1 text-sm text-wa-text-secondary truncate">
                        {conv.lastMessageSenderUsername === currentUser?.username && (
                          <CheckCheck className="w-4 h-4 text-wa-check-blue shrink-0 inline" />
                        )}
                        <span className="truncate">
                          {conv.lastMessageContent
                            ? (conv.type === 'GROUP' && conv.lastMessageSenderUsername
                                ? `${conv.lastMessageSenderUsername}: `
                                : '') + conv.lastMessageContent
                            : conv.type === 'GROUP'
                            ? `${conv.memberCount} participants`
                            : 'No messages yet'}
                        </span>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="min-w-[20px] h-5 rounded-full bg-wa-green text-wa-bg text-xs font-bold px-1.5 flex items-center justify-center shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-20 text-center px-6">
              <MessageSquare className="w-10 h-10 text-wa-text-secondary/30 mx-auto mb-3" />
              <p className="text-sm font-medium text-wa-text">No chats found</p>
              <p className="text-xs text-wa-text-secondary mt-1">
                Click the message icon above to start chatting with your contacts.
              </p>
            </div>
          )}
        </div>

        {/* Slide-over Profile Drawer */}
        <ProfileDrawer
          isOpen={isProfileDrawerOpen}
          onClose={() => setIsProfileDrawerOpen(false)}
        />

        {/* Slide-over New Chat Drawer */}
        <NewChatDrawer
          isOpen={isNewChatDrawerOpen}
          onClose={() => setIsNewChatDrawerOpen(false)}
          onOpenNewGroup={() => setIsGroupModalOpen(true)}
          onConversationSelected={(conv) => {
            setConversations([conv, ...conversations.filter((c) => c.id !== conv.id)]);
            navigate(`/chat/${conv.id}`);
          }}
        />
      </aside>

      {/* ======================================================== */}
      {/* RIGHT PANEL: Active Chat Stream or Welcome Screen        */}
      {/* ======================================================== */}
      <main className={`flex-1 flex flex-col bg-wa-bg-chat relative overflow-hidden ${!selectedConv ? 'hidden sm:flex' : 'flex'}`}>
        {selectedConv ? (
          <>
            {/* Active Conversation Header (WhatsApp 60px) */}
            <header className="h-[60px] bg-wa-header px-4 flex items-center justify-between border-b border-wa-border shrink-0 z-20">
              <div
                onClick={() => setIsInfoDrawerOpen(true)}
                className="flex items-center gap-3.5 min-w-0 cursor-pointer flex-1"
              >
                {/* Mobile Back Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedConv(null);
                    navigate('/chat');
                  }}
                  className="sm:hidden p-1 rounded-full hover:bg-wa-hover text-wa-text-secondary"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-wa-panel border border-wa-border flex items-center justify-center font-bold text-wa-green text-sm overflow-hidden">
                    {selectedConv.avatarUrl ? (
                      <img src={selectedConv.avatarUrl} alt={selectedConv.name} className="w-full h-full object-cover" />
                    ) : selectedConv.type === 'GROUP' ? (
                      <Users className="w-5 h-5 text-wa-text-secondary" />
                    ) : (
                      selectedConv.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  {isPartnerOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-wa-green border-2 border-wa-bg" />
                  )}
                </div>

                {/* Name & Status */}
                <div className="min-w-0">
                  <h3 className="font-normal text-base text-wa-text truncate leading-snug">
                    {selectedConv.name}
                  </h3>
                  <p className="text-xs truncate text-wa-text-secondary leading-tight">
                    {typingUser ? (
                      <span className="text-wa-green font-medium animate-pulse">{typingUser} is typing...</span>
                    ) : isPartnerOnline ? (
                      <span className="text-wa-green font-medium">online</span>
                    ) : selectedConv.type === 'GROUP' ? (
                      selectedConv.members?.map((m) => m.displayName || m.username).join(', ')
                    ) : (
                      'click here for contact info'
                    )}
                  </p>
                </div>
              </div>

              {/* Right Header Action Icons */}
              <div className="flex items-center gap-2 text-wa-text-secondary">
                <button
                  onClick={() => setIsInfoDrawerOpen(true)}
                  className="wa-icon-btn p-2 rounded-full"
                  title="Search in chat"
                >
                  <Search className="w-5 h-5 text-wa-text-secondary hover:text-wa-text" />
                </button>
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
                  className="wa-icon-btn p-2 rounded-full"
                  title="Report"
                >
                  <Flag className="w-4 h-4 text-wa-text-secondary hover:text-amber-400" />
                </button>
                <button
                  onClick={() => setIsInfoDrawerOpen(true)}
                  className="wa-icon-btn p-2 rounded-full"
                  title="Contact info"
                >
                  <MoreVertical className="w-5 h-5 text-wa-text-secondary hover:text-wa-text" />
                </button>
              </div>
            </header>

            {/* Message Stream Area with WhatsApp Doodle Wallpaper */}
            <div className="flex-1 flex overflow-hidden relative">
              <div className="flex-1 flex flex-col justify-between overflow-hidden bg-wa-doodle bg-repeat relative">
                {/* Overlay to dim wallpaper */}
                <div className="absolute inset-0 bg-wa-bg-chat/90 pointer-events-none" />

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-4 sm:px-12 space-y-2 z-10 custom-scrollbar">
                  {/* End-to-End Encryption Yellow Banner */}
                  <div className="my-3 mx-auto max-w-lg p-2 px-3 rounded-lg bg-[#182229] border border-[#ffd279]/15 shadow-sm text-center flex items-center justify-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-[#ffd279] shrink-0" />
                    <span className="text-[11px] text-[#ffd279] font-normal leading-tight">
                      Messages are end-to-end encrypted. No one outside of this chat can read them.
                    </span>
                  </div>

                  {isLoadingMessages ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 text-wa-green animate-spin" />
                      <span className="text-xs text-wa-text-secondary">Loading messages...</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="my-auto text-center max-w-sm mx-auto p-6 rounded-2xl bg-wa-panel/80 border border-wa-border/40 shadow-lg">
                      <div className="w-12 h-12 rounded-full bg-wa-green/10 border border-wa-green/20 flex items-center justify-center text-wa-green mx-auto mb-3">
                        <Lock className="w-6 h-6" />
                      </div>
                      <h4 className="font-semibold text-wa-text text-sm mb-1">{selectedConv.name}</h4>
                      <p className="text-xs text-wa-text-secondary leading-relaxed">
                        {selectedConv.type === 'DIRECT'
                          ? `Send a message to start chatting with @${selectedConv.directParticipant?.username}.`
                          : `Welcome to ${selectedConv.name}! Send a message to get things started.`}
                      </p>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const isOwn = msg.senderId === currentUser?.id;
                      const isDeleted = msg.isDeleted;

                      // Date separator check
                      const showDateHeader =
                        index === 0 ||
                        format(new Date(messages[index - 1].createdAt), 'yyyy-MM-dd') !==
                          format(new Date(msg.createdAt), 'yyyy-MM-dd');

                      return (
                        <React.Fragment key={msg.id}>
                          {showDateHeader && (
                            <div className="flex justify-center my-3">
                              <span className="bg-[#182229] text-wa-text-secondary text-[11px] font-medium uppercase px-3 py-1 rounded-md shadow-sm">
                                {format(new Date(msg.createdAt), 'MMMM d, yyyy')}
                              </span>
                            </div>
                          )}

                          <div
                            className={`group relative flex flex-col mb-1 ${
                              isOwn ? 'items-end' : 'items-start'
                            }`}
                          >
                            {/* WhatsApp Speech Bubble */}
                            <div
                              className={`relative max-w-[85%] sm:max-w-[65%] px-3 py-1.5 shadow-sm text-sm rounded-lg ${
                                isOwn
                                  ? 'bg-wa-bubble-out rounded-tr-none wa-tail-out'
                                  : 'bg-wa-bubble-in rounded-tl-none wa-tail-in'
                              }`}
                            >
                              {/* Sender name for group chats */}
                              {!isOwn && selectedConv.type === 'GROUP' && (
                                <div className="text-xs font-semibold text-wa-green mb-0.5">
                                  {msg.senderDisplayName || msg.senderUsername}
                                </div>
                              )}

                              {/* Replying quote preview */}
                              {msg.replyTo && (
                                <div className="mb-1 p-2 rounded bg-black/25 border-l-4 border-wa-green text-xs text-wa-text-secondary truncate">
                                  <span className="font-semibold text-wa-green mr-1">
                                    @{msg.replyTo.senderUsername}
                                  </span>
                                  <p className="truncate text-wa-text">{msg.replyTo.content}</p>
                                </div>
                              )}

                              {/* File & Image attachments */}
                              {!isDeleted && msg.attachments && msg.attachments.length > 0 && (
                                <div className="space-y-1 mb-1">
                                  {msg.attachments.map((att, idx) => {
                                    const isImg =
                                      att.fileType?.startsWith('image/') ||
                                      /\.(jpg|jpeg|png|gif|webp)$/i.test(att.fileName);
                                    const fullUrl = att.fileUrl.startsWith('http')
                                      ? att.fileUrl
                                      : `http://localhost:8088${att.fileUrl}`;

                                    return isImg ? (
                                      <div
                                        key={idx}
                                        onClick={() => window.open(fullUrl, '_blank')}
                                        className="rounded-lg overflow-hidden max-w-sm cursor-pointer border border-white/5 my-1"
                                      >
                                        <img
                                          src={fullUrl}
                                          alt={att.fileName}
                                          className="w-full h-auto max-h-72 object-cover hover:opacity-95 transition-opacity"
                                        />
                                      </div>
                                    ) : (
                                      <a
                                        key={idx}
                                        href={fullUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        download={att.fileName}
                                        className="flex items-center gap-2.5 p-2 rounded-lg bg-black/20 hover:bg-black/30 text-wa-text text-xs transition-colors my-1"
                                      >
                                        <FileText className="w-5 h-5 text-wa-green shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium truncate">{att.fileName}</p>
                                          {att.fileSize && (
                                            <p className="text-[10px] text-wa-text-secondary">
                                              {(att.fileSize / 1024).toFixed(1)} KB
                                            </p>
                                          )}
                                        </div>
                                        <Download className="w-4 h-4 text-wa-text-secondary shrink-0" />
                                      </a>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Message text */}
                              <div className="whitespace-pre-wrap break-words text-wa-text text-[14.2px] leading-relaxed inline">
                                {isDeleted ? (
                                  <span className="text-wa-text-secondary italic flex items-center gap-1">
                                    <Trash2 className="w-3.5 h-3.5 inline" />
                                    This message was deleted
                                  </span>
                                ) : (
                                  msg.content
                                )}
                              </div>

                              {/* Time & Delivery Status Check */}
                              <span className="float-right ml-3 mt-1.5 inline-flex items-center gap-1 text-[11px] text-wa-text-secondary">
                                {msg.isEdited && !isDeleted && <span className="text-[10px]">(edited)</span>}
                                <span>{msg.createdAt ? format(new Date(msg.createdAt), 'HH:mm') : ''}</span>
                                {isOwn && !isDeleted && (
                                  <span>
                                    {msg.deliveryStatus === 'READ' ? (
                                      <CheckCheck className="w-4 h-4 text-wa-check-blue inline" />
                                    ) : (
                                      <Check className="w-4 h-4 text-wa-text-secondary inline" />
                                    )}
                                  </span>
                                )}
                              </span>

                              {/* Reactions Floating Badge */}
                              {msg.reactions && msg.reactions.length > 0 && (
                                <div className="absolute -bottom-2.5 right-2 flex items-center gap-0.5 bg-wa-panel border border-wa-border px-1.5 py-0.5 rounded-full shadow-md z-10">
                                  {msg.reactions.map((r) => (
                                    <button
                                      key={r.emoji}
                                      onClick={() => handleToggleReaction(msg.id, r.emoji)}
                                      className="text-xs hover:scale-125 transition-transform"
                                      title={r.usernames.join(', ')}
                                    >
                                      <span>{r.emoji}</span>
                                      {r.count > 1 && (
                                        <span className="text-[10px] text-wa-text-secondary ml-0.5 font-bold">
                                          {r.count}
                                        </span>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              )}

                              {/* WhatsApp Message Hover Menu Button */}
                              {!isDeleted && (
                                <div
                                  className={`absolute top-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-wa-panel/95 border border-wa-border shadow-lg rounded-lg p-1 z-20 ${
                                    isOwn ? '-left-24' : '-right-24'
                                  }`}
                                >
                                  {/* Quick reaction */}
                                  <button
                                    onClick={() =>
                                      setActiveReactionMessageId(
                                        activeReactionMessageId === msg.id ? null : msg.id
                                      )
                                    }
                                    className="p-1 hover:bg-wa-hover rounded text-wa-text-secondary hover:text-wa-text"
                                    title="React"
                                  >
                                    <Smile className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Reply */}
                                  <button
                                    onClick={() => {
                                      setReplyingTo(msg);
                                      setEditingMessage(null);
                                    }}
                                    className="p-1 hover:bg-wa-hover rounded text-wa-text-secondary hover:text-wa-text"
                                    title="Reply"
                                  >
                                    <Reply className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Edit (own only) */}
                                  {isOwn && (
                                    <button
                                      onClick={() => {
                                        setEditingMessage(msg);
                                        setEditInput(msg.content);
                                        setReplyingTo(null);
                                      }}
                                      className="p-1 hover:bg-wa-hover rounded text-wa-text-secondary hover:text-wa-text"
                                      title="Edit"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  {/* Delete (own only) */}
                                  {isOwn && (
                                    <button
                                      onClick={() => handleDeleteMessage(msg)}
                                      className="p-1 hover:bg-wa-hover rounded text-wa-text-secondary hover:text-red-400"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              )}

                              {/* Emoji Picker Popup */}
                              {activeReactionMessageId === msg.id && (
                                <div
                                  className={`absolute bottom-full mb-2 flex items-center gap-1.5 p-1.5 rounded-full bg-wa-panel border border-wa-border shadow-2xl z-30 ${
                                    isOwn ? 'right-0' : 'left-0'
                                  }`}
                                >
                                  {QUICK_REACTIONS.map((emoji) => (
                                    <button
                                      key={emoji}
                                      onClick={() => handleToggleReaction(msg.id, emoji)}
                                      className="p-1.5 hover:bg-wa-hover rounded-full text-base hover:scale-130 transition-transform"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                  <button
                                    onClick={() => setActiveReactionMessageId(null)}
                                    className="p-1 text-wa-text-secondary hover:text-wa-text"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })
                  )}

                  {/* Live Typing Indicator */}
                  {typingUser && (
                    <div className="flex items-center gap-2 p-2 px-3 rounded-lg bg-wa-bubble-in border border-wa-border/40 w-max shadow-sm">
                      <span className="text-xs text-wa-text-secondary italic">
                        {typingUser} is typing
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-wa-green animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-wa-green animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-wa-green animate-bounce" />
                      </span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar Footer (WhatsApp Web 62px) */}
                <div className="bg-wa-header px-4 py-2 border-t border-wa-border shrink-0 z-20">
                  {/* Quoted reply banner */}
                  {replyingTo && (
                    <div className="mb-2 p-2 px-3 rounded-lg bg-wa-panel border-l-4 border-wa-green flex items-center justify-between text-xs">
                      <div className="truncate">
                        <span className="font-semibold text-wa-green">
                          @{replyingTo.senderUsername}:{' '}
                        </span>
                        <span className="text-wa-text-secondary">{replyingTo.content}</span>
                      </div>
                      <button
                        onClick={() => setReplyingTo(null)}
                        className="text-wa-text-secondary hover:text-wa-text p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Pending attachment banner */}
                  {pendingAttachment && (
                    <div className="mb-2 p-2 px-3 rounded-lg bg-wa-panel border border-wa-border flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <Paperclip className="w-4 h-4 text-wa-green shrink-0" />
                        <span className="text-wa-text font-medium truncate">{pendingAttachment.fileName}</span>
                        {pendingAttachment.fileSize && (
                          <span className="text-[10px] text-wa-text-secondary">
                            ({(pendingAttachment.fileSize / 1024).toFixed(1)} KB)
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setPendingAttachment(null)}
                        className="text-wa-text-secondary hover:text-wa-text p-1"
                      >
                        <X className="w-4 h-4" />
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
                        className="flex-1 bg-wa-input text-wa-text text-sm rounded-lg px-4 py-2.5 outline-none border border-wa-green"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveEdit}
                        disabled={!editInput.trim()}
                        className="px-4 py-2 rounded-lg bg-wa-green text-wa-bg font-semibold text-xs"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                      {/* Hidden file input */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelected}
                        className="hidden"
                        accept="image/*,video/mp4,audio/*,application/pdf,application/zip"
                      />

                      {/* Emoji Icon */}
                      <button
                        type="button"
                        className="wa-icon-btn p-2 rounded-full"
                        title="Emoji"
                      >
                        <Smile className="w-6 h-6 text-wa-text-secondary hover:text-wa-text" />
                      </button>

                      {/* Attachment Icon & Popup Menu */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}
                          disabled={isUploadingFile || isSending}
                          className="wa-icon-btn p-2 rounded-full"
                          title="Attach"
                        >
                          {isUploadingFile ? (
                            <Loader2 className="w-6 h-6 text-wa-green animate-spin" />
                          ) : (
                            <Paperclip className="w-6 h-6 text-wa-text-secondary hover:text-wa-text" />
                          )}
                        </button>

                        {/* WhatsApp Attachment Menu Popup */}
                        {isAttachmentMenuOpen && (
                          <div className="absolute bottom-full mb-3 left-0 bg-wa-panel border border-wa-border rounded-2xl shadow-2xl p-3 flex flex-col gap-2.5 z-40 w-44 animate-in fade-in zoom-in-95 duration-100">
                            <button
                              type="button"
                              onClick={() => {
                                setIsAttachmentMenuOpen(false);
                                fileInputRef.current?.click();
                              }}
                              className="flex items-center gap-3 p-2 rounded-xl hover:bg-wa-hover text-wa-text text-xs transition-colors"
                            >
                              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white">
                                <ImageIcon className="w-4 h-4" />
                              </div>
                              <span className="font-medium">Photos & videos</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsAttachmentMenuOpen(false);
                                fileInputRef.current?.click();
                              }}
                              className="flex items-center gap-3 p-2 rounded-xl hover:bg-wa-hover text-wa-text text-xs transition-colors"
                            >
                              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                                <FileText className="w-4 h-4" />
                              </div>
                              <span className="font-medium">Document</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* WhatsApp Pill Text Input */}
                      <div className="flex-1 bg-wa-input rounded-lg px-4 py-2.5 flex items-center">
                        <input
                          type="text"
                          value={messageInput}
                          onChange={handleInputChange}
                          placeholder="Type a message"
                          disabled={isSending}
                          className="w-full bg-transparent text-wa-text placeholder-wa-text-secondary text-sm outline-none"
                        />
                      </div>

                      {/* Send or Mic Button */}
                      {messageInput.trim() || pendingAttachment ? (
                        <button
                          type="submit"
                          disabled={isSending}
                          className="p-2.5 rounded-full text-wa-green hover:text-emerald-400 transition-colors"
                          title="Send message"
                        >
                          {isSending ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                          ) : (
                            <Send className="w-6 h-6" />
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="p-2.5 rounded-full text-wa-text-secondary hover:text-wa-text transition-colors"
                          title="Voice message"
                        >
                          <Mic className="w-6 h-6" />
                        </button>
                      )}
                    </form>
                  )}
                </div>
              </div>

              {/* Sliding Contact/Group Info Drawer on Right */}
              <ConversationInfoDrawer
                isOpen={isInfoDrawerOpen}
                onClose={() => setIsInfoDrawerOpen(false)}
                conversation={selectedConv}
                currentUser={currentUser}
                onReport={(targetType, targetId, targetLabel) =>
                  setReportModalData({
                    isOpen: true,
                    targetType,
                    targetId,
                    targetLabel,
                  })
                }
                onConversationUpdated={fetchConversations}
              />
            </div>
          </>
        ) : (
          /* WhatsApp Signature Welcome Screen */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#222e35] select-none border-b-6 border-wa-green">
            <div className="w-64 h-64 mb-8 flex items-center justify-center text-wa-text-secondary/40">
              <Laptop className="w-52 h-52 stroke-[1.2]" />
            </div>
            <h2 className="text-3xl font-light text-wa-text mb-3">ChatX Web</h2>
            <p className="text-sm text-wa-text-secondary max-w-md leading-relaxed mb-8">
              Send and receive messages without keeping your phone online.
              <br />
              Use ChatX on up to 4 linked devices and 1 phone simultaneously.
            </p>
            <div className="flex items-center gap-2 text-xs text-wa-text-secondary/70">
              <Lock className="w-3.5 h-3.5" />
              <span>End-to-end encrypted</span>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onGroupCreated={(newConv) => {
          setConversations([newConv, ...conversations]);
          setSelectedConv(newConv);
          navigate(`/chat/${newConv.id}`);
        }}
      />

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
