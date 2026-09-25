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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-chatx-surface border border-chatx-border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-chatx-border flex items-center justify-between bg-chatx-card/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-chatx-accent/10 border border-chatx-accent/20 flex items-center justify-center text-chatx-accent">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Create Group Conversation</h2>
              <p className="text-xs text-chatx-text-secondary">Start a multi-user group chat</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-chatx-card hover:bg-chatx-hover text-chatx-text-secondary hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Group Name */}
          <div>
            <label className="block text-xs font-semibold text-chatx-text-secondary uppercase tracking-wider mb-1.5">
              Group Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Design Team or Weekend Trips"
              maxLength={100}
              className="input-field text-sm"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-chatx-text-secondary uppercase tracking-wider mb-1.5">
              Description <span className="text-chatx-text-secondary/60 lowercase font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group about?"
              rows={2}
              maxLength={500}
              className="input-field text-sm resize-none"
            />
          </div>

          {/* Avatar URL */}
          <div>
            <label className="block text-xs font-semibold text-chatx-text-secondary uppercase tracking-wider mb-1.5">
              Avatar URL <span className="text-chatx-text-secondary/60 lowercase font-normal">(optional)</span>
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/group-icon.png"
              className="input-field text-sm"
            />
          </div>

          {/* Add Friends */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-chatx-text-secondary uppercase tracking-wider">
                Select Members ({selectedFriendIds.length} selected)
              </label>
            </div>

            {isLoadingFriends ? (
              <div className="py-6 flex items-center justify-center gap-2 text-xs text-chatx-text-secondary">
                <Loader2 className="w-4 h-4 animate-spin text-chatx-accent" />
                <span>Loading friends...</span>
              </div>
            ) : friends.length > 0 ? (
              <div className="max-h-44 overflow-y-auto border border-chatx-border rounded-xl divide-y divide-chatx-border/40 p-1">
                {friends.map((friend) => {
                  const isSelected = selectedFriendIds.includes(friend.friendId);
                  return (
                    <div
                      key={friend.friendId}
                      onClick={() => toggleFriend(friend.friendId)}
                      className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-chatx-accent/10 border border-chatx-accent/30' : 'hover:bg-chatx-hover'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-chatx-accent to-purple-600 flex items-center justify-center font-bold text-white text-xs overflow-hidden">
                          {friend.avatarUrl ? (
                            <img src={friend.avatarUrl} alt={friend.username} className="w-full h-full object-cover" />
                          ) : (
                            friend.displayName?.charAt(0).toUpperCase() || friend.username.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">{friend.displayName || friend.username}</div>
                          <div className="text-[10px] text-chatx-accent">@{friend.username}</div>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-chatx-accent border-chatx-accent text-white'
                            : 'border-chatx-border text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-chatx-text-secondary italic p-2 bg-chatx-card/40 rounded-lg border border-chatx-border">
                You have no friends to add yet. You can still create the group and invite friends later.
              </p>
            )}
          </div>

          {/* Footer Submit Button */}
          <div className="pt-3 border-t border-chatx-border flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary text-xs flex items-center gap-2 px-6 py-2"
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
