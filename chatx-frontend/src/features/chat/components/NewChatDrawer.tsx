import React, { useState, useEffect } from 'react';
import friendApi from '../../friends/services/friendApi';
import conversationApi from '../services/conversationApi';
import { FriendDto } from '../../../types/friend';
import { ConversationDto } from '../../../types/conversation';
import { ArrowLeft, Search, Users, Loader2, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

interface NewChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewGroup: () => void;
  onConversationSelected: (conv: ConversationDto) => void;
}

export const NewChatDrawer: React.FC<NewChatDrawerProps> = ({
  isOpen,
  onClose,
  onOpenNewGroup,
  onConversationSelected,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [friends, setFriends] = useState<FriendDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const loadFriends = async () => {
        try {
          setIsLoading(true);
          const data = await friendApi.getFriends();
          setFriends(data);
        } catch (err) {
          console.error('Failed to load contacts:', err);
        } finally {
          setIsLoading(false);
        }
      };
      loadFriends();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartDirectChat = async (friend: FriendDto) => {
    try {
      const conv = await conversationApi.getOrCreateDirectConversation(friend.friendId);
      onConversationSelected(conv);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to start chat');
    }
  };

  const filtered = friends.filter(
    (f) =>
      f.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.displayName && f.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="absolute inset-y-0 left-0 z-30 w-full sm:w-[400px] md:w-[450px] bg-wa-bg flex flex-col animate-in slide-in-from-left duration-200 border-r border-wa-border">
      {/* Top Header */}
      <div className="h-[108px] bg-wa-header flex items-end p-5 gap-7 border-b border-wa-border shrink-0">
        <button
          onClick={onClose}
          className="text-wa-text-secondary hover:text-wa-text transition-colors p-1"
          title="Back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-medium text-wa-text tracking-wide">New chat</h2>
      </div>

      {/* Search Bar */}
      <div className="p-3 bg-wa-bg border-b border-wa-border">
        <div className="bg-wa-panel rounded-lg px-3 py-1.5 flex items-center gap-3">
          <Search className="w-4 h-4 text-wa-text-secondary shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search name or username"
            className="w-full bg-transparent text-sm text-wa-text placeholder-wa-text-secondary outline-none"
            autoFocus
          />
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto divide-y divide-wa-border/30">
        {/* New group button */}
        <div
          onClick={() => {
            onClose();
            onOpenNewGroup();
          }}
          className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-wa-hover transition-colors"
        >
          <div className="w-12 h-12 rounded-full bg-wa-green flex items-center justify-center text-white shrink-0 shadow-sm">
            <Users className="w-6 h-6" />
          </div>
          <span className="text-base text-wa-text font-normal">New group</span>
        </div>

        {/* Contacts Header */}
        <div className="px-5 py-3 text-xs font-semibold text-wa-green uppercase tracking-wider bg-wa-bg">
          Contacts on ChatX
        </div>

        {/* Contact list */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 text-wa-green animate-spin" />
            <span className="text-xs text-wa-text-secondary">Loading contacts...</span>
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((friend) => (
            <div
              key={friend.friendId}
              onClick={() => handleStartDirectChat(friend)}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-wa-hover transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-wa-panel border border-wa-border flex items-center justify-center text-wa-green font-bold text-base overflow-hidden shrink-0">
                {friend.avatarUrl ? (
                  <img src={friend.avatarUrl} alt={friend.username} className="w-full h-full object-cover" />
                ) : (
                  (friend.displayName || friend.username).charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base text-wa-text font-normal truncate">
                  {friend.displayName || friend.username}
                </h4>
                <p className="text-xs text-wa-text-secondary truncate mt-0.5">
                  {friend.bio || `@${friend.username}`}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center px-6">
            <UserCheck className="w-8 h-8 text-wa-text-secondary mx-auto mb-2 opacity-50" />
            <p className="text-sm text-wa-text">No contacts found</p>
            <p className="text-xs text-wa-text-secondary mt-1">
              Add friends from the Friends page to chat with them here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
