import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import conversationApi from '../services/conversationApi';
import { ConversationDto } from '../../../types/conversation';
import { CreateGroupModal } from '../components/CreateGroupModal';
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export const ChatPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<ConversationDto[]>([]);
  const [selectedConv, setSelectedConv] = useState<ConversationDto | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [showMemberDetails, setShowMemberDetails] = useState(false);
  const [messageInput, setMessageInput] = useState('');

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const data = await conversationApi.getUserConversations();
      setConversations(data);

      if (conversationId) {
        const active = data.find((c) => c.id === conversationId);
        if (active) {
          const detailed = await conversationApi.getConversationById(conversationId);
          setSelectedConv(detailed);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
      toast.error('Failed to load chats');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [conversationId]);

  const handleSelectConversation = (conv: ConversationDto) => {
    navigate(`/chat/${conv.id}`);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    toast.success('Message sent! (Phase 6 persistence will be enabled next)');
    setMessageInput('');
  };

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
          <span className="text-xs px-2 py-0.5 rounded bg-chatx-card text-chatx-text-secondary border border-chatx-border">
            Conversations
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/friends"
            className="p-2 rounded-lg bg-chatx-card hover:bg-chatx-hover border border-chatx-border text-chatx-text-secondary hover:text-white transition-colors"
            title="Friends"
          >
            <Users className="w-4 h-4" />
          </Link>
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
            <h2 className="text-base font-bold text-white">Messages</h2>
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
            {isLoading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 text-chatx-accent animate-spin" />
                <span className="text-xs text-chatx-text-secondary">Loading chats...</span>
              </div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => {
                const isSelected = selectedConv?.id === conv.id;
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
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-chatx-accent to-purple-600 flex items-center justify-center font-bold text-white text-sm shrink-0 overflow-hidden shadow-sm">
                      {conv.avatarUrl ? (
                        <img src={conv.avatarUrl} alt={conv.name} className="w-full h-full object-cover" />
                      ) : conv.type === 'GROUP' ? (
                        <Users className="w-5 h-5" />
                      ) : (
                        conv.name.charAt(0).toUpperCase()
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
                    onClick={() => setSelectedConv(null)}
                    className="sm:hidden p-1.5 rounded-lg bg-chatx-card text-chatx-text-secondary hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-chatx-accent to-purple-600 flex items-center justify-center font-bold text-white text-sm shrink-0 overflow-hidden shadow">
                    {selectedConv.avatarUrl ? (
                      <img src={selectedConv.avatarUrl} alt={selectedConv.name} className="w-full h-full object-cover" />
                    ) : selectedConv.type === 'GROUP' ? (
                      <Users className="w-5 h-5" />
                    ) : (
                      selectedConv.name.charAt(0).toUpperCase()
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
                    <p className="text-[11px] text-chatx-text-secondary truncate mt-0.5">
                      {selectedConv.description || (selectedConv.type === 'DIRECT' ? 'Direct encrypted session' : 'Group communication')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
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
                <div className="flex-1 flex flex-col justify-between p-6 overflow-y-auto">
                  {/* Ready conversation banner */}
                  <div className="my-auto text-center max-w-sm mx-auto p-6 rounded-2xl glass-panel">
                    <div className="w-12 h-12 rounded-2xl bg-chatx-accent/10 border border-chatx-accent/20 flex items-center justify-center text-chatx-accent mx-auto mb-3">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-white text-sm mb-1">{selectedConv.name}</h4>
                    <p className="text-xs text-chatx-text-secondary leading-relaxed">
                      {selectedConv.type === 'DIRECT'
                        ? `This is the start of your direct conversation with @${selectedConv.directParticipant?.username}.`
                        : `Welcome to ${selectedConv.name}! Conversations and members are live.`}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-1.5 text-[11px] text-chatx-accent font-medium px-3 py-1 rounded-full bg-chatx-accent/10 border border-chatx-accent/20">
                      <span>Phase 5 Connected</span>
                    </div>
                  </div>

                  {/* Input Footer */}
                  <form onSubmit={handleSendMessage} className="pt-4 flex items-center gap-3">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder={`Message ${selectedConv.name}...`}
                      className="input-field text-xs py-3"
                    />
                    <button
                      type="submit"
                      disabled={!messageInput.trim()}
                      className="btn-primary py-3 px-4 flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <Send className="w-4 h-4" />
                      <span className="text-xs hidden sm:inline">Send</span>
                    </button>
                  </form>
                </div>

                {/* Member Drawer (Sidebar when toggled) */}
                {showMemberDetails && (
                  <div className="w-72 border-l border-chatx-border bg-chatx-surface/80 backdrop-blur-md p-4 flex flex-col shrink-0 overflow-y-auto animate-in slide-in-from-right duration-200">
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
                      {selectedConv.members?.map((member) => (
                        <div key={member.userId} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-chatx-card/60">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-chatx-accent to-purple-600 flex items-center justify-center font-bold text-white text-xs shrink-0 overflow-hidden">
                              {member.avatarUrl ? (
                                <img src={member.avatarUrl} alt={member.username} className="w-full h-full object-cover" />
                              ) : (
                                member.displayName?.charAt(0).toUpperCase() || member.username.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-xs text-white truncate">{member.displayName || member.username}</div>
                              <div className="text-[10px] text-chatx-accent font-mono truncate">@{member.username}</div>
                            </div>
                          </div>

                          {member.role === 'ADMIN' && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-chatx-accent/15 text-chatx-accent border border-chatx-accent/30 shrink-0">
                              ADMIN
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto pt-6 border-t border-chatx-border/60 text-[11px] text-chatx-text-secondary space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Created {selectedConv.createdAt ? format(new Date(selectedConv.createdAt), 'PP') : 'recently'}</span>
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
    </div>
  );
};

export default ChatPage;
