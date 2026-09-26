import React, { useState } from 'react';
import { ConversationDto } from '../../../types/conversation';
import { UserSummary } from '../../../types/auth';
import {
  X,
  Users,
  Flag,
  Ban,
  Lock,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import blockApi from '../../friends/services/blockApi';

interface ConversationInfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: ConversationDto;
  currentUser: UserSummary | null;
  onReport: (targetType: 'USER' | 'CONVERSATION', targetId: string, targetLabel: string) => void;
  onConversationUpdated?: () => void;
}

export const ConversationInfoDrawer: React.FC<ConversationInfoDrawerProps> = ({
  isOpen,
  onClose,
  conversation,
  currentUser,
  onReport,
  onConversationUpdated,
}) => {
  const [isBlocking, setIsBlocking] = useState(false);

  if (!isOpen) return null;

  const isGroup = conversation.type === 'GROUP';
  const partner = conversation.directParticipant;

  const handleBlockUser = async () => {
    if (!partner) return;
    if (!window.confirm(`Block @${partner.username}? They won't be able to message you or see your online status.`)) return;

    try {
      setIsBlocking(true);
      await blockApi.blockUser(partner.id);
      toast.success(`@${partner.username} has been blocked`);
      onClose();
      onConversationUpdated?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to block user');
    } finally {
      setIsBlocking(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[400px] md:w-[420px] bg-wa-panel border-l border-wa-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Top Header */}
      <div className="h-[60px] bg-wa-header px-4 flex items-center gap-6 border-b border-wa-border shrink-0">
        <button
          onClick={onClose}
          className="wa-icon-btn p-1.5"
          title="Close"
        >
          <X className="w-5 h-5 text-wa-text-secondary hover:text-wa-text" />
        </button>
        <h3 className="font-semibold text-base text-wa-text">
          {isGroup ? 'Group info' : 'Contact info'}
        </h3>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto space-y-3 bg-wa-bg p-3">
        {/* Profile Card */}
        <div className="bg-wa-panel p-6 flex flex-col items-center text-center rounded-xl border border-wa-border/50">
          <div className="w-40 h-40 rounded-full overflow-hidden bg-wa-input flex items-center justify-center text-wa-green font-bold text-4xl shadow-md mb-4 border-2 border-wa-border">
            {conversation.avatarUrl ? (
              <img src={conversation.avatarUrl} alt={conversation.name} className="w-full h-full object-cover" />
            ) : isGroup ? (
              <Users className="w-16 h-16 text-wa-text-secondary" />
            ) : (
              conversation.name.charAt(0).toUpperCase()
            )}
          </div>

          <h2 className="text-xl font-semibold text-wa-text">{conversation.name}</h2>
          {partner && (
            <p className="text-sm text-wa-text-secondary font-mono mt-0.5">@{partner.username}</p>
          )}
          {isGroup && (
            <p className="text-xs text-wa-text-secondary mt-0.5">Group • {conversation.memberCount} participants</p>
          )}
        </div>

        {/* About / Description Card */}
        <div className="bg-wa-panel p-4 rounded-xl border border-wa-border/50 space-y-1">
          <h4 className="text-xs font-semibold text-wa-text-secondary uppercase tracking-wider">
            {isGroup ? 'Group description' : 'About'}
          </h4>
          <p className="text-sm text-wa-text leading-relaxed">
            {conversation.description || (isGroup ? 'No group description set' : 'Hey there! I am using ChatX.')}
          </p>
        </div>

        {/* Encryption Assurance Card */}
        <div className="bg-wa-panel p-4 rounded-xl border border-wa-border/50 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-wa-input flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5 text-wa-green" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-wa-text">Encryption</h4>
            <p className="text-xs text-wa-text-secondary mt-0.5">
              Messages and calls are end-to-end encrypted. No one outside of this chat can read them.
            </p>
          </div>
        </div>

        {/* Group Participants Section */}
        {isGroup && (
          <div className="bg-wa-panel p-4 rounded-xl border border-wa-border/50 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-wa-text-secondary uppercase tracking-wider">
                {conversation.memberCount} participants
              </h4>
            </div>

            <div className="divide-y divide-wa-border/40 max-h-60 overflow-y-auto">
              {conversation.members?.map((m) => {
                const isMemberSelf = m.userId === currentUser?.id;
                return (
                  <div key={m.userId} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-wa-input flex items-center justify-center font-bold text-xs text-wa-text overflow-hidden shrink-0">
                        {m.avatarUrl ? (
                          <img src={m.avatarUrl} alt={m.displayName} className="w-full h-full object-cover" />
                        ) : (
                          m.displayName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-wa-text flex items-center gap-1.5 truncate">
                          <span>{m.displayName}</span>
                          {isMemberSelf && <span className="text-[10px] text-wa-green font-bold">(You)</span>}
                        </div>
                        <div className="text-xs text-wa-text-secondary font-mono truncate">@{m.username}</div>
                      </div>
                    </div>

                    {m.role === 'ADMIN' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-wa-green text-wa-green">
                        Group Admin
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions Card */}
        <div className="bg-wa-panel rounded-xl border border-wa-border/50 overflow-hidden divide-y divide-wa-border/40">
          <button
            onClick={() => {
              if (isGroup) {
                onReport('CONVERSATION', conversation.id, conversation.name);
              } else if (partner) {
                onReport('USER', partner.id, `@${partner.username}`);
              }
            }}
            className="w-full p-3.5 px-4 flex items-center gap-3 text-left text-sm text-wa-danger hover:bg-wa-hover transition-colors"
          >
            <Flag className="w-4 h-4 text-wa-danger shrink-0" />
            <span>{isGroup ? 'Report group' : 'Report contact'}</span>
          </button>

          {!isGroup && partner && (
            <button
              onClick={handleBlockUser}
              disabled={isBlocking}
              className="w-full p-3.5 px-4 flex items-center gap-3 text-left text-sm text-wa-danger hover:bg-wa-hover transition-colors disabled:opacity-50"
            >
              {isBlocking ? (
                <Loader2 className="w-4 h-4 text-wa-danger animate-spin" />
              ) : (
                <Ban className="w-4 h-4 text-wa-danger shrink-0" />
              )}
              <span>Block @{partner.username}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationInfoDrawer;
