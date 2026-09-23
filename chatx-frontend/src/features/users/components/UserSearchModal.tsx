import React, { useState, useEffect } from 'react';
import { UserSearchDto } from '../../../types/profile';
import userApi from '../services/userApi';
import { useDebounce } from '../../../hooks/useDebounce';
import { Search, X, Loader2, User, ArrowRight } from 'lucide-react';
import { PublicProfileModal } from './PublicProfileModal';

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserSearchModal: React.FC<UserSearchModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<UserSearchDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    const handleSearch = async () => {
      const clean = debouncedSearch.trim();
      if (!clean) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await userApi.searchUsers(clean, 0, 15);
        setResults(data);
      } catch (err) {
        console.error('Failed to search users:', err);
      } finally {
        setIsLoading(false);
      }
    };

    handleSearch();
  }, [debouncedSearch]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
        <div className="bg-chatx-surface border border-chatx-border rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl relative flex flex-col max-h-[80vh]">
          {/* Search Bar Input */}
          <div className="p-4 border-b border-chatx-border flex items-center gap-3 bg-chatx-card/60">
            <Search className="w-5 h-5 text-chatx-text-secondary shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by username (e.g. @avinash or avi)..."
              className="bg-transparent border-none text-chatx-text placeholder-chatx-text-secondary text-sm focus:outline-none w-full"
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-chatx-text-secondary hover:text-chatx-text p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="px-2 py-1 text-xs rounded bg-chatx-surface border border-chatx-border text-chatx-text-secondary hover:text-white"
            >
              ESC
            </button>
          </div>

          {/* Search Results List */}
          <div className="overflow-y-auto p-3 divide-y divide-chatx-border/40 flex-1">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 text-chatx-accent animate-spin" />
                <span className="text-xs text-chatx-text-secondary">Searching usernames...</span>
              </div>
            ) : results.length > 0 ? (
              results.map((user) => (
                <div
                  key={user.id}
                  onClick={() => setSelectedUsername(user.username)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-chatx-hover/70 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-chatx-accent to-purple-600 flex items-center justify-center font-bold text-white text-sm shrink-0 overflow-hidden">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                      ) : (
                        user.displayName?.charAt(0).toUpperCase() || user.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white truncate">{user.displayName || user.username}</span>
                        <span className="text-xs text-chatx-accent font-mono truncate">@{user.username}</span>
                      </div>
                      {user.bio ? (
                        <p className="text-xs text-chatx-text-secondary truncate mt-0.5">{user.bio}</p>
                      ) : (
                        <p className="text-xs text-chatx-text-secondary/60 italic mt-0.5">ChatX member</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-chatx-text-secondary group-hover:text-chatx-accent transition-colors pl-2">
                    <span className="text-xs hidden sm:inline">View Profile</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              ))
            ) : searchTerm.trim() ? (
              <div className="py-12 text-center">
                <User className="w-8 h-8 text-chatx-text-secondary/40 mx-auto mb-2" />
                <p className="text-sm font-medium text-white">No users found</p>
                <p className="text-xs text-chatx-text-secondary mt-1">
                  No username starting with "@{searchTerm.replace(/^@/, '')}"
                </p>
              </div>
            ) : (
              <div className="py-12 text-center text-chatx-text-secondary text-xs">
                Type a username to discover and connect with other users.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Public profile detail modal */}
      {selectedUsername && (
        <PublicProfileModal
          username={selectedUsername}
          onClose={() => setSelectedUsername(null)}
        />
      )}
    </>
  );
};

export default UserSearchModal;
