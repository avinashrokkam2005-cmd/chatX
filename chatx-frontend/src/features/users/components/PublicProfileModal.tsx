import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProfileDto } from '../../../types/profile';
import profileApi from '../../profile/services/profileApi';
import friendApi from '../../friends/services/friendApi';
import blockApi from '../../friends/services/blockApi';
import conversationApi from '../../chat/services/conversationApi';
import { X, Calendar, Shield, AtSign, Loader2, UserPlus, MessageCircle, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface PublicProfileModalProps {
  userId?: string;
  username?: string;
  onClose: () => void;
}

export const PublicProfileModal: React.FC<PublicProfileModalProps> = ({ userId, username, onClose }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        let data: ProfileDto;
        if (userId) {
          data = await profileApi.getProfileById(userId);
        } else if (username) {
          data = await profileApi.getProfileByUsername(username);
        } else {
          return;
        }
        setProfile(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load user profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userId, username]);

  const handleSendFriendRequest = async () => {
    if (!profile) return;
    try {
      setIsSendingRequest(true);
      await friendApi.sendFriendRequest(profile.userId);
      toast.success(`Friend request sent to @${profile.username}!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send friend request');
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleBlockUser = async () => {
    if (!profile) return;
    if (!confirm(`Are you sure you want to block @${profile.username}?`)) return;
    try {
      await blockApi.blockUser(profile.userId);
      toast.success(`Blocked @${profile.username}`);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to block user');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-chatx-surface border border-chatx-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
        {/* Header background banner */}
        <div className="h-28 bg-gradient-to-r from-chatx-accent/30 via-purple-600/20 to-chatx-accent/10 border-b border-chatx-border/50 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-chatx-bg/60 hover:bg-chatx-bg border border-chatx-border text-chatx-text-secondary hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 pt-0 relative">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-7 h-7 text-chatx-accent animate-spin" />
              <p className="text-xs text-chatx-text-secondary">Loading profile...</p>
            </div>
          ) : error || !profile ? (
            <div className="py-12 text-center">
              <p className="text-sm text-chatx-danger mb-4">{error || 'User not found'}</p>
              <button onClick={onClose} className="btn-secondary text-xs px-4 py-2">
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Avatar */}
              <div className="-mt-14 mb-4 flex items-end justify-between">
                <div className="w-24 h-24 rounded-2xl border-4 border-chatx-surface bg-gradient-to-br from-chatx-accent to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl overflow-hidden">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={profile.username} className="w-full h-full object-cover" />
                  ) : (
                    profile.displayName?.charAt(0).toUpperCase() || profile.username.charAt(0).toUpperCase()
                  )}
                </div>

                <div className="flex gap-2">
                  <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-chatx-accent/10 border border-chatx-accent/30 text-chatx-accent">
                    {profile.role}
                  </span>
                </div>
              </div>

              {/* Name & Username */}
              <div>
                <h3 className="text-xl font-bold text-white">{profile.displayName || profile.username}</h3>
                <div className="flex items-center gap-1 text-sm text-chatx-accent font-medium mt-0.5">
                  <AtSign className="w-3.5 h-3.5" />
                  <span>{profile.username}</span>
                </div>
              </div>

              {/* Bio */}
              <div className="mt-4 p-3 rounded-xl bg-chatx-card/60 border border-chatx-border/60">
                <p className="text-sm text-chatx-text leading-relaxed whitespace-pre-wrap">
                  {profile.bio || 'This user has not written a bio yet.'}
                </p>
              </div>

              {/* Metadata */}
              <div className="mt-4 pt-4 border-t border-chatx-border/50 grid grid-cols-2 gap-3 text-xs text-chatx-text-secondary">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-chatx-text-secondary/70" />
                  <span>
                    Joined {profile.createdAt ? format(new Date(profile.createdAt), 'MMM yyyy') : 'Recently'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-chatx-text-secondary/70" />
                  <span>Privacy: {profile.messagePrivacy}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-6 flex flex-col gap-2.5">
                <div className="flex gap-2.5">
                  <button
                    onClick={async () => {
                      try {
                        const conv = await conversationApi.getOrCreateDirectConversation(profile.userId);
                        onClose();
                        navigate(`/chat/${conv.id}`);
                      } catch (err: any) {
                        toast.error(err.response?.data?.message || 'Failed to start conversation');
                      }
                    }}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Message</span>
                  </button>
                  <button
                    onClick={handleSendFriendRequest}
                    disabled={isSendingRequest}
                    className="btn-secondary flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold"
                  >
                    {isSendingRequest ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    <span>Add Friend</span>
                  </button>
                </div>

                <button
                  onClick={handleBlockUser}
                  className="w-full py-2 rounded-lg bg-chatx-danger/10 hover:bg-chatx-danger/20 border border-chatx-danger/20 text-chatx-danger text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Block @{profile.username}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicProfileModal;
