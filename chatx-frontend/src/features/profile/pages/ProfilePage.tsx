import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import profileApi from '../services/profileApi';
import userApi from '../../users/services/userApi';
import { ProfileDto } from '../../../types/profile';
import { MessagePrivacy } from '../../../types/auth';
import {
  ArrowLeft,
  Shield,
  Save,
  Loader2,
  AtSign,
  Camera,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username?: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const isOwnProfile = !username || (currentUser && username.toLowerCase() === currentUser.username.toLowerCase());

  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [messagePrivacy, setMessagePrivacy] = useState<MessagePrivacy>('EVERYONE');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        let data: ProfileDto;
        if (isOwnProfile) {
          data = await profileApi.getMyProfile();
        } else {
          data = await profileApi.getProfileByUsername(username!);
        }

        setProfile(data);
        setDisplayName(data.displayName || '');
        setBio(data.bio || '');
        setAvatarUrl(data.avatarUrl || '');
        setMessagePrivacy(data.messagePrivacy || 'EVERYONE');
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [username, isOwnProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnProfile) return;

    try {
      setIsSaving(true);
      const updated = await profileApi.updateMyProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        avatarUrl: avatarUrl.trim(),
      });

      // Update privacy setting if changed
      if (profile && messagePrivacy !== profile.messagePrivacy) {
        await userApi.updatePrivacy(messagePrivacy);
      }

      setProfile({ ...updated, messagePrivacy });
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-chatx-bg">
        <div className="text-center flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-chatx-accent animate-spin" />
          <p className="text-sm text-chatx-text-secondary">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-chatx-bg p-8 flex flex-col items-center justify-center">
        <p className="text-chatx-danger mb-4">User profile not found</p>
        <button onClick={() => navigate('/')} className="btn-secondary text-xs">
          Return Home
        </button>
      </div>
    );
  }

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
              <h1 className="text-lg font-bold text-white">
                {isOwnProfile ? 'Edit Profile & Settings' : `@${profile.username}'s Profile`}
              </h1>
              <p className="text-xs text-chatx-text-secondary">
                {isOwnProfile ? 'Manage your public presence and messaging restrictions' : 'ChatX User Profile'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        <div className="glass-panel overflow-hidden shadow-2xl">
          {/* Header Banner */}
          <div className="h-36 bg-gradient-to-r from-chatx-accent/30 via-indigo-600/20 to-purple-600/20 border-b border-chatx-border/60 relative" />

          {/* Profile Overview Banner */}
          <div className="px-6 sm:px-8 pb-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 mb-6">
              <div className="flex items-end gap-5">
                <div className="relative group">
                  <div className="w-28 h-28 rounded-2xl border-4 border-chatx-surface bg-gradient-to-tr from-chatx-accent to-purple-600 flex items-center justify-center font-bold text-4xl text-white shadow-xl overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={profile.username} className="w-full h-full object-cover" />
                    ) : (
                      profile.displayName?.charAt(0).toUpperCase() || profile.username.charAt(0).toUpperCase()
                    )}
                  </div>
                </div>

                <div className="mb-1">
                  <h2 className="text-2xl font-bold text-white leading-tight">
                    {displayName || profile.displayName || profile.username}
                  </h2>
                  <div className="flex items-center gap-1.5 text-sm text-chatx-accent font-medium mt-0.5">
                    <AtSign className="w-4 h-4" />
                    <span>{profile.username}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-md text-xs font-semibold bg-chatx-accent/10 border border-chatx-accent/30 text-chatx-accent">
                  {profile.role}
                </span>
                <span className="px-3 py-1 rounded-md text-xs font-semibold bg-chatx-card border border-chatx-border text-chatx-text-secondary flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {profile.createdAt ? format(new Date(profile.createdAt), 'MMM yyyy') : 'Recent'}
                </span>
              </div>
            </div>

            {/* Profile Form (if own profile) */}
            {isOwnProfile ? (
              <form onSubmit={handleSave} className="space-y-6 pt-4 border-t border-chatx-border/60">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Display Name */}
                  <div>
                    <label className="block text-xs font-semibold text-chatx-text-secondary uppercase tracking-wider mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your friendly name"
                      maxLength={100}
                      className="input-field"
                    />
                    <p className="text-[11px] text-chatx-text-secondary mt-1">
                      How your name appears to other users in chats
                    </p>
                  </div>

                  {/* Avatar URL */}
                  <div>
                    <label className="block text-xs font-semibold text-chatx-text-secondary uppercase tracking-wider mb-2">
                      Avatar Image URL
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-chatx-text-secondary">
                        <Camera className="w-4 h-4" />
                      </div>
                      <input
                        type="url"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="https://example.com/avatar.jpg"
                        className="input-field pl-10"
                      />
                    </div>
                    <p className="text-[11px] text-chatx-text-secondary mt-1">
                      Direct image link for your profile picture
                    </p>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-chatx-text-secondary uppercase tracking-wider">
                      Bio
                    </label>
                    <span className="text-[11px] text-chatx-text-secondary">
                      {bio.length} / 500
                    </span>
                  </div>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell other ChatX users a little about yourself..."
                    rows={3}
                    maxLength={500}
                    className="input-field resize-none"
                  />
                </div>

                {/* Privacy Setting Section */}
                <div className="p-5 rounded-xl bg-chatx-card/60 border border-chatx-border space-y-4">
                  <div className="flex items-center gap-2 text-white font-semibold text-sm">
                    <Shield className="w-4 h-4 text-chatx-accent" />
                    <span>Direct Message Privacy</span>
                  </div>
                  <p className="text-xs text-chatx-text-secondary">
                    Control who is permitted to send you direct messages on ChatX (enforced by backend validation).
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <label
                      className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                        messagePrivacy === 'EVERYONE'
                          ? 'bg-chatx-accent/10 border-chatx-accent text-white'
                          : 'bg-chatx-bg/60 border-chatx-border text-chatx-text-secondary hover:border-chatx-border/80'
                      }`}
                    >
                      <input
                        type="radio"
                        name="privacy"
                        value="EVERYONE"
                        checked={messagePrivacy === 'EVERYONE'}
                        onChange={() => setMessagePrivacy('EVERYONE')}
                        className="mt-1"
                      />
                      <div>
                        <div className="text-sm font-semibold text-white">Everyone</div>
                        <div className="text-xs text-chatx-text-secondary mt-0.5">
                          Any registered user can search and direct message you
                        </div>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                        messagePrivacy === 'FRIENDS_ONLY'
                          ? 'bg-chatx-accent/10 border-chatx-accent text-white'
                          : 'bg-chatx-bg/60 border-chatx-border text-chatx-text-secondary hover:border-chatx-border/80'
                      }`}
                    >
                      <input
                        type="radio"
                        name="privacy"
                        value="FRIENDS_ONLY"
                        checked={messagePrivacy === 'FRIENDS_ONLY'}
                        onChange={() => setMessagePrivacy('FRIENDS_ONLY')}
                        className="mt-1"
                      />
                      <div>
                        <div className="text-sm font-semibold text-white">Friends Only</div>
                        <div className="text-xs text-chatx-text-secondary mt-0.5">
                          Only accepted friends can send you direct messages
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Submit button */}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="btn-primary flex items-center gap-2 px-8 py-2.5 text-sm"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Public profile view */
              <div className="space-y-6 pt-4 border-t border-chatx-border/60">
                <div>
                  <h3 className="text-xs font-semibold text-chatx-text-secondary uppercase tracking-wider mb-2">
                    About
                  </h3>
                  <div className="p-4 rounded-xl bg-chatx-card/60 border border-chatx-border text-sm text-chatx-text leading-relaxed whitespace-pre-wrap">
                    {profile.bio || 'This user has not written a bio yet.'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-chatx-card/60 border border-chatx-border flex items-center justify-between text-xs">
                  <span className="text-chatx-text-secondary flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-chatx-accent" /> Message Privacy
                  </span>
                  <span className="font-semibold text-white bg-chatx-bg px-2.5 py-1 rounded border border-chatx-border">
                    {profile.messagePrivacy}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
