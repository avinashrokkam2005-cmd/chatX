import React, { useState, useEffect } from 'react';
import friendApi from '../../friends/services/friendApi';
import conversationApi from '../services/conversationApi';
import { FriendDto } from '../../../types/friend';
import { ConversationDto } from '../../../types/conversation';
import { X, Users, Loader2, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (conversation: ConversationDto) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onGroupCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [friends, setFriends] = useState<FriendDto[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchFriends = async () => {
        try {
          setIsLoadingFriends(true);
          const data = await friendApi.getFriends();
          setFriends(data);
        } catch (err) {
          console.error('Failed to load friends for group creation:', err);
        } finally {
          setIsLoadingFriends(false);
        }
      };

      fetchFriends();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleFriend = (friendId: string) => {
    setSelectedFriendIds((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Group name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      const newGroup = await conversationApi.createGroupConversation({
        name: name.trim(),
        description: description.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
        memberIds: selectedFriendIds,
      });

      toast.success(`Group "${newGroup.name}" created!`);
      onGroupCreated(newGroup);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-wa-panel border border-wa-border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 px-6 border-b border-wa-border flex items-center justify-between bg-wa-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-wa-green/20 border border-wa-green/40 flex items-center justify-center text-wa-green">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-wa-text">New Group</h2>
              <p className="text-xs text-wa-text-secondary">Add participants & group subject</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-wa-hover text-wa-text-secondary hover:text-wa-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 bg-wa-bg">
          {/* Group Name */}
          <div>
            <label className="block text-xs font-semibold text-wa-green uppercase tracking-wider mb-1.5">
              Group Subject *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Design Team or Friends"
              maxLength={100}
              className="w-full bg-wa-input border border-wa-border rounded-lg px-3.5 py-2.5 text-sm text-wa-text placeholder-wa-text-secondary focus:border-wa-green focus:outline-none"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-wa-text-secondary uppercase tracking-wider mb-1.5">
              Description <span className="lowercase font-normal opacity-70">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Group description..."
              rows={2}
              maxLength={500}
              className="w-full bg-wa-input border border-wa-border rounded-lg px-3.5 py-2.5 text-sm text-wa-text placeholder-wa-text-secondary focus:border-wa-green focus:outline-none resize-none"
            />
          </div>

          {/* Group Icon URL */}
          <div>
            <label className="block text-xs font-semibold text-wa-text-secondary uppercase tracking-wider mb-1.5">
              Group Icon URL <span className="lowercase font-normal opacity-70">(optional)</span>
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/icon.png"
              className="w-full bg-wa-input border border-wa-border rounded-lg px-3.5 py-2.5 text-sm text-wa-text placeholder-wa-text-secondary focus:border-wa-green focus:outline-none"
            />
          </div>

          {/* Add Friends */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-wa-text-secondary uppercase tracking-wider">
                Select Participants ({selectedFriendIds.length} selected)
              </label>
            </div>

            {isLoadingFriends ? (
              <div className="py-6 flex items-center justify-center gap-2 text-xs text-wa-text-secondary">
                <Loader2 className="w-4 h-4 animate-spin text-wa-green" />
                <span>Loading contacts...</span>
              </div>
            ) : friends.length > 0 ? (
              <div className="max-h-44 overflow-y-auto border border-wa-border rounded-xl divide-y divide-wa-border/40 p-1 bg-wa-panel">
                {friends.map((friend) => {
                  const isSelected = selectedFriendIds.includes(friend.friendId);
                  return (
                    <div
                      key={friend.friendId}
                      onClick={() => toggleFriend(friend.friendId)}
                      className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-wa-green/15 border border-wa-green/30' : 'hover:bg-wa-hover'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-wa-input border border-wa-border flex items-center justify-center font-bold text-wa-green text-xs overflow-hidden">
                          {friend.avatarUrl ? (
                            <img src={friend.avatarUrl} alt={friend.username} className="w-full h-full object-cover" />
                          ) : (
                            friend.displayName?.charAt(0).toUpperCase() || friend.username.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-medium text-wa-text">{friend.displayName || friend.username}</div>
                          <div className="text-[10px] text-wa-text-secondary font-mono">@{friend.username}</div>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-wa-green border-wa-green text-wa-bg'
                            : 'border-wa-border text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-wa-text-secondary italic p-3 bg-wa-panel rounded-lg border border-wa-border">
                You have no contacts added yet. You can still create the group and invite members later.
              </p>
            )}
          </div>

          {/* Footer Submit Button */}
          <div className="pt-3 border-t border-wa-border flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-wa-panel hover:bg-wa-hover text-wa-text text-xs border border-wa-border transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-lg bg-wa-green hover:bg-emerald-600 text-wa-bg text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating group...</span>
                </>
              ) : (
                <span>Create Group</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
