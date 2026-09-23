import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import friendApi from '../services/friendApi';
import blockApi from '../services/blockApi';
import { FriendDto, FriendRequestDto, BlockDto } from '../../../types/friend';
import {
  Users,
  UserCheck,
  UserPlus,
  ShieldAlert,
  ArrowLeft,
  Check,
  X,
  Trash2,
  Shield,
  Loader2,
  MessageCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

type Tab = 'friends' | 'received' | 'sent' | 'blocked';

export const FriendsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<FriendDto[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequestDto[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequestDto[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      const [friendsData, receivedData, sentData, blockedData] = await Promise.all([
        friendApi.getFriends(),
        friendApi.getReceivedRequests(),
        friendApi.getSentRequests(),
        blockApi.getBlockedUsers(),
      ]);

      setFriends(friendsData);
      setReceivedRequests(receivedData);
      setSentRequests(sentData);
      setBlockedUsers(blockedData);
    } catch (err: any) {
      toast.error('Failed to load friend data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await friendApi.acceptFriendRequest(requestId);
      toast.success('Friend request accepted!');
      fetchAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await friendApi.rejectFriendRequest(requestId);
      toast.success('Friend request rejected');
      fetchAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject request');
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await friendApi.cancelFriendRequest(requestId);
      toast.success('Friend request cancelled');
      fetchAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel request');
    }
  };

  const handleRemoveFriend = async (friendId: string, username: string) => {
    if (!confirm(`Are you sure you want to remove @${username} from your friends?`)) return;
    try {
      await friendApi.removeFriend(friendId);
      toast.success(`Removed @${username} from friends`);
      fetchAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove friend');
    }
  };

  const handleBlockUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to block @${username}? They will no longer be able to message you.`)) return;
    try {
      await blockApi.blockUser(userId);
      toast.success(`Blocked @${username}`);
      fetchAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to block user');
    }
  };

  const handleUnblockUser = async (userId: string, username: string) => {
    try {
      await blockApi.unblockUser(userId);
      toast.success(`Unblocked @${username}`);
      fetchAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to unblock user');
    }
  };

  return (
    <div className="min-h-screen bg-chatx-bg text-chatx-text pb-12">
      {/* Top Header */}
      <div className="border-b border-chatx-border bg-chatx-surface/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="p-2 rounded-lg bg-chatx-card hover:bg-chatx-hover border border-chatx-border text-chatx-text-secondary hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white">Friends & Contacts</h1>
              <p className="text-xs text-chatx-text-secondary">
                Manage your friendships, requests, and blocked users
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-chatx-border pb-4 mb-6">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'friends'
                ? 'bg-chatx-accent text-white shadow-md shadow-chatx-accent/20'
                : 'bg-chatx-card text-chatx-text-secondary hover:bg-chatx-hover hover:text-white border border-chatx-border'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>All Friends</span>
            <span className="px-1.5 py-0.5 rounded-full bg-black/20 text-[10px]">
              {friends.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('received')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all relative ${
              activeTab === 'received'
                ? 'bg-chatx-accent text-white shadow-md shadow-chatx-accent/20'
                : 'bg-chatx-card text-chatx-text-secondary hover:bg-chatx-hover hover:text-white border border-chatx-border'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Received Requests</span>
            {receivedRequests.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-chatx-danger text-white text-[10px] animate-pulse">
                {receivedRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('sent')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'sent'
                ? 'bg-chatx-accent text-white shadow-md shadow-chatx-accent/20'
                : 'bg-chatx-card text-chatx-text-secondary hover:bg-chatx-hover hover:text-white border border-chatx-border'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Sent Requests</span>
            <span className="px-1.5 py-0.5 rounded-full bg-black/20 text-[10px]">
              {sentRequests.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('blocked')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'blocked'
                ? 'bg-chatx-accent text-white shadow-md shadow-chatx-accent/20'
                : 'bg-chatx-card text-chatx-text-secondary hover:bg-chatx-hover hover:text-white border border-chatx-border'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Blocked</span>
            <span className="px-1.5 py-0.5 rounded-full bg-black/20 text-[10px]">
              {blockedUsers.length}
            </span>
          </button>
        </div>

        {/* Tab Content */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-chatx-accent animate-spin" />
            <p className="text-xs text-chatx-text-secondary">Loading...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Friends Tab */}
            {activeTab === 'friends' && (
              friends.length > 0 ? (
                friends.map((friend) => (
                  <div
                    key={friend.friendshipId}
                    className="glass-panel p-4 flex items-center justify-between gap-4 hover:border-chatx-border transition-all"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-chatx-accent to-purple-600 flex items-center justify-center font-bold text-white text-base shrink-0 overflow-hidden shadow-md">
                        {friend.avatarUrl ? (
                          <img src={friend.avatarUrl} alt={friend.username} className="w-full h-full object-cover" />
                        ) : (
                          friend.displayName?.charAt(0).toUpperCase() || friend.username.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white truncate">{friend.displayName || friend.username}</span>
                          <span className="text-xs text-chatx-accent font-mono">@{friend.username}</span>
                        </div>
                        <p className="text-xs text-chatx-text-secondary truncate mt-0.5">
                          {friend.bio || 'Friends since ' + (friend.friendsSince ? format(new Date(friend.friendsSince), 'MMM yyyy') : 'recently')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => alert(`Direct conversation with @${friend.username} will be launched in Phase 5!`)}
                        className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5"
                        title="Open direct message"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Message</span>
                      </button>

                      <button
                        onClick={() => handleRemoveFriend(friend.friendId, friend.username)}
                        className="p-2 rounded-lg bg-chatx-card hover:bg-chatx-danger/20 border border-chatx-border text-chatx-text-secondary hover:text-chatx-danger transition-colors"
                        title="Remove friend"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleBlockUser(friend.friendId, friend.username)}
                        className="p-2 rounded-lg bg-chatx-card hover:bg-chatx-danger/20 border border-chatx-border text-chatx-text-secondary hover:text-chatx-danger transition-colors"
                        title="Block user"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="glass-panel p-12 text-center">
                  <Users className="w-10 h-10 text-chatx-text-secondary/40 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-white">No friends yet</h3>
                  <p className="text-xs text-chatx-text-secondary mt-1 max-w-sm mx-auto">
                    Search for users using the top search bar (Ctrl+K) and send them a friend request to start connecting.
                  </p>
                </div>
              )
            )}

            {/* Received Requests Tab */}
            {activeTab === 'received' && (
              receivedRequests.length > 0 ? (
                receivedRequests.map((req) => (
                  <div
                    key={req.requestId}
                    className="glass-panel p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-chatx-accent to-purple-600 flex items-center justify-center font-bold text-white text-sm shrink-0 overflow-hidden">
                        {req.sender.avatarUrl ? (
                          <img src={req.sender.avatarUrl} alt={req.sender.username} className="w-full h-full object-cover" />
                        ) : (
                          req.sender.displayName?.charAt(0).toUpperCase() || req.sender.username.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white truncate">{req.sender.displayName || req.sender.username}</span>
                          <span className="text-xs text-chatx-accent font-mono">@{req.sender.username}</span>
                        </div>
                        <p className="text-[11px] text-chatx-text-secondary mt-0.5">
                          Sent {req.createdAt ? format(new Date(req.createdAt), 'PP') : 'recently'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleAcceptRequest(req.requestId)}
                        className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1 bg-chatx-success hover:bg-chatx-success/80"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => handleRejectRequest(req.requestId)}
                        className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 hover:text-chatx-danger"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="glass-panel p-12 text-center">
                  <UserPlus className="w-10 h-10 text-chatx-text-secondary/40 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-white">No incoming requests</h3>
                  <p className="text-xs text-chatx-text-secondary mt-1">
                    When someone sends you a friend request, it will show up here.
                  </p>
                </div>
              )
            )}

            {/* Sent Requests Tab */}
            {activeTab === 'sent' && (
              sentRequests.length > 0 ? (
                sentRequests.map((req) => (
                  <div
                    key={req.requestId}
                    className="glass-panel p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-chatx-accent to-purple-600 flex items-center justify-center font-bold text-white text-sm shrink-0 overflow-hidden">
                        {req.receiver.avatarUrl ? (
                          <img src={req.receiver.avatarUrl} alt={req.receiver.username} className="w-full h-full object-cover" />
                        ) : (
                          req.receiver.displayName?.charAt(0).toUpperCase() || req.receiver.username.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white truncate">{req.receiver.displayName || req.receiver.username}</span>
                          <span className="text-xs text-chatx-accent font-mono">@{req.receiver.username}</span>
                        </div>
                        <span className="inline-block mt-0.5 text-[11px] px-2 py-0.5 rounded bg-chatx-warning/10 text-chatx-warning border border-chatx-warning/20">
                          Pending confirmation
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCancelRequest(req.requestId)}
                      className="btn-secondary text-xs py-1.5 px-3 hover:text-chatx-danger"
                    >
                      Cancel
                    </button>
                  </div>
                ))
              ) : (
                <div className="glass-panel p-12 text-center">
                  <Users className="w-10 h-10 text-chatx-text-secondary/40 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-white">No pending sent requests</h3>
                  <p className="text-xs text-chatx-text-secondary mt-1">
                    Requests you send to other users will appear here until accepted.
                  </p>
                </div>
              )
            )}

            {/* Blocked Users Tab */}
            {activeTab === 'blocked' && (
              blockedUsers.length > 0 ? (
                blockedUsers.map((block) => (
                  <div
                    key={block.blockId}
                    className="glass-panel p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-chatx-danger/20 border border-chatx-danger/30 flex items-center justify-center font-bold text-chatx-danger text-sm shrink-0">
                        {block.blockedUser.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white truncate">{block.blockedUser.displayName || block.blockedUser.username}</span>
                          <span className="text-xs text-chatx-accent font-mono">@{block.blockedUser.username}</span>
                        </div>
                        <p className="text-[11px] text-chatx-text-secondary mt-0.5">
                          Blocked on {block.blockedAt ? format(new Date(block.blockedAt), 'PP') : 'recently'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleUnblockUser(block.blockedUser.id, block.blockedUser.username)}
                      className="btn-secondary text-xs py-1.5 px-3 hover:text-chatx-success"
                    >
                      Unblock
                    </button>
                  </div>
                ))
              ) : (
                <div className="glass-panel p-12 text-center">
                  <ShieldAlert className="w-10 h-10 text-chatx-text-secondary/40 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-white">No blocked users</h3>
                  <p className="text-xs text-chatx-text-secondary mt-1">
                    You have not blocked any users.
                  </p>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsPage;
