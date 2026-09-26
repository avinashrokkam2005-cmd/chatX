import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import notificationApi from '../services/notificationApi';
import { NotificationDto } from '../../../types/notification';
import {
  Bell,
  UserPlus,
  CheckCircle2,
  MessageSquare,
  Users,
  Info,
  Check,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export const NotificationDropdown: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationApi.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Graceful fallback
    }
  };

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await notificationApi.getNotifications(0, 15);
      setNotifications(res.data || []);
    } catch {
      // Graceful fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (notif: NotificationDto, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (notif.read) return;

    try {
      await notificationApi.markAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // Ignore
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success('All marked as read');
    } catch {
      toast.error('Failed to mark notifications as read');
    }
  };

  const handleNotificationClick = async (notif: NotificationDto) => {
    await handleMarkAsRead(notif);
    setIsOpen(false);

    if (notif.type === 'FRIEND_REQUEST' || notif.type === 'FRIEND_ACCEPT') {
      navigate('/friends');
    } else if (notif.type === 'NEW_MESSAGE' && notif.referenceId) {
      navigate(`/chat/${notif.referenceId}`);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'FRIEND_REQUEST':
        return <UserPlus className="w-4 h-4 text-wa-green" />;
      case 'FRIEND_ACCEPT':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'NEW_MESSAGE':
        return <MessageSquare className="w-4 h-4 text-wa-check-blue" />;
      case 'GROUP_INVITE':
        return <Users className="w-4 h-4 text-purple-400" />;
      default:
        return <Info className="w-4 h-4 text-wa-green" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="wa-icon-btn relative"
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-wa-text-secondary" />
        {unreadCount > 0 && (
          <span className="absolute 1 top-1 right-1 px-1.5 py-0.2 rounded-full bg-wa-green text-[#111b21] text-[10px] font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-wa-header border border-wa-border shadow-2xl z-50 overflow-hidden animate-in fade-in duration-150">
          <div className="p-3.5 px-4 border-b border-wa-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-xs text-wa-text tracking-wide">Notifications</h4>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-wa-green/20 text-wa-green text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[11px] text-wa-green hover:underline flex items-center gap-1 font-medium"
              >
                <Check className="w-3 h-3" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-wa-border">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 text-wa-green animate-spin" />
                <span className="text-xs text-wa-text-secondary">Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center px-4">
                <Bell className="w-8 h-8 text-wa-text-secondary/30 mx-auto mb-2" />
                <p className="text-xs font-semibold text-wa-text">No notifications</p>
                <p className="text-[11px] text-wa-text-secondary mt-0.5">
                  You're all caught up!
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                    !notif.read ? 'bg-[#182229] hover:bg-[#202c33]' : 'hover:bg-wa-hover'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-wa-panel border border-wa-border flex items-center justify-center shrink-0">
                    {getIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h5 className="font-semibold text-xs text-wa-text truncate">{notif.title}</h5>
                      <span className="text-[10px] text-wa-text-secondary shrink-0">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-wa-text-secondary line-clamp-2 leading-relaxed">
                      {notif.content}
                    </p>
                  </div>

                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-wa-green shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
