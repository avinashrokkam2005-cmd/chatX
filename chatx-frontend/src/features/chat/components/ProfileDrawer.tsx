import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import profileApi from '../../profile/services/profileApi';
import { ArrowLeft, Camera, Check, Pencil, Loader2, AtSign } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || 'Hey there! I am using ChatX.');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !user) return null;

  const handleSaveName = async () => {
    try {
      setIsSaving(true);
      await profileApi.updateMyProfile({ displayName: displayName.trim() });
      setIsEditingName(false);
      toast.success('Name updated');
    } catch (err: any) {
      toast.error('Failed to update name');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBio = async () => {
    try {
      setIsSaving(true);
      await profileApi.updateMyProfile({ bio: bio.trim() });
      setIsEditingBio(false);
      toast.success('About updated');
    } catch (err: any) {
      toast.error('Failed to update about');
    } finally {
      setIsSaving(false);
    }
  };

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
        <h2 className="text-lg font-medium text-wa-text tracking-wide">Profile</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Avatar */}
        <div className="flex justify-center my-4">
          <div className="relative group w-48 h-48 rounded-full overflow-hidden bg-wa-panel border-2 border-wa-border flex items-center justify-center text-wa-green font-bold text-5xl shadow-lg">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              user.username.charAt(0).toUpperCase()
            )}
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-8 h-8 mb-1" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-center px-4">
                Change Profile Photo
              </span>
            </div>
          </div>
        </div>

        {/* Display Name Section */}
        <div className="bg-wa-panel p-4 rounded-xl border border-wa-border/40 space-y-2">
          <label className="text-xs font-medium text-wa-green">Your name</label>
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
                className="bg-wa-input text-wa-text px-3 py-1.5 rounded-lg border border-wa-green/50 text-sm flex-1 outline-none"
                autoFocus
              />
              <button
                onClick={handleSaveName}
                disabled={isSaving}
                className="text-wa-green hover:text-emerald-400 p-1"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-5 h-5" />}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between group">
              <span className="text-sm text-wa-text font-normal">
                {user.displayName || user.username}
              </span>
              <button
                onClick={() => setIsEditingName(true)}
                className="text-wa-text-secondary hover:text-wa-text p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          )}
          <p className="text-[11px] text-wa-text-secondary">
            This is not your username. This name will be visible to your ChatX contacts.
          </p>
        </div>

        {/* Username Section */}
        <div className="bg-wa-panel p-4 rounded-xl border border-wa-border/40 space-y-1">
          <label className="text-xs font-medium text-wa-green">Username</label>
          <div className="flex items-center gap-2 text-sm text-wa-text font-mono">
            <AtSign className="w-4 h-4 text-wa-text-secondary" />
            <span>{user.username}</span>
          </div>
        </div>

        {/* About Section */}
        <div className="bg-wa-panel p-4 rounded-xl border border-wa-border/40 space-y-2">
          <label className="text-xs font-medium text-wa-green">About</label>
          {isEditingBio ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={140}
                className="bg-wa-input text-wa-text px-3 py-1.5 rounded-lg border border-wa-green/50 text-sm flex-1 outline-none"
                autoFocus
              />
              <button
                onClick={handleSaveBio}
                disabled={isSaving}
                className="text-wa-green hover:text-emerald-400 p-1"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-5 h-5" />}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between group">
              <span className="text-sm text-wa-text font-normal">{user.bio || bio}</span>
              <button
                onClick={() => setIsEditingBio(true)}
                className="text-wa-text-secondary hover:text-wa-text p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
