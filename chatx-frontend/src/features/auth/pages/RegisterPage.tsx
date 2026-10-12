import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { MessageSquare, Lock, User, Mail, AtSign, Eye, EyeOff, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUsername = username.trim();
    const cleanEmail = email.trim();

    if (!cleanUsername || cleanUsername.length < 3 || cleanUsername.length > 30) {
      setErrorMessage('Username must be between 3 and 30 characters');
      return;
    }

    if (!/^[a-zA-Z0-9._]+$/.test(cleanUsername)) {
      setErrorMessage('Username can only contain letters, numbers, dots, and underscores');
      return;
    }

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    try {
      setIsSubmitting(true);
      await register(cleanUsername, cleanEmail, password, displayName);
      navigate('/chat');
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0] ||
        'Registration failed. Please check the provided information.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen w-full bg-[#111b21] flex flex-col font-sans select-none relative overflow-y-auto custom-scrollbar">
      {/* Top Emerald Header Strip (signature WhatsApp Web banner) */}
      <div className="h-[222px] bg-wa-green w-full absolute top-0 left-0 z-0">
        <div className="max-w-5xl mx-auto px-6 pt-7 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white shadow-sm">
            <MessageSquare className="w-6 h-6 fill-white" />
          </div>
          <span className="text-white font-medium text-sm tracking-widest uppercase">ChatX Web</span>
        </div>
      </div>

      {/* Main Elevated Container */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12 z-10 my-auto min-h-fit">
        <div className="w-full max-w-4xl bg-wa-panel border border-wa-border/70 rounded-2xl shadow-2xl p-6 sm:p-10 flex flex-col md:flex-row gap-8 sm:gap-10 my-auto">
          {/* Left Column: Instructions */}
          <div className="flex-1 space-y-6">
            <h1 className="text-2xl sm:text-3xl font-light text-wa-text leading-tight">
              Create your ChatX account
            </h1>
            <p className="text-sm text-wa-text-secondary leading-relaxed">
              Join ChatX to message friends and groups in real time with authentic WhatsApp Web speed and privacy.
            </p>

            <div className="space-y-3 pt-2 text-sm text-wa-text-secondary">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-wa-green shrink-0" />
                <span>Choose a unique handle for direct messaging</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-wa-green shrink-0" />
                <span>Instant group chats with up to 256 participants</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-wa-green shrink-0" />
                <span>Rich file attachments, emoji reactions, and read receipts</span>
              </div>
            </div>

            <div className="pt-6 border-t border-wa-border/40 flex items-center gap-3 text-xs text-wa-text-secondary">
              <ShieldCheck className="w-4 h-4 text-wa-green shrink-0" />
              <span>Full end-to-end WebSocket encryption included.</span>
            </div>
          </div>

          {/* Right Column: Registration Form */}
          <div className="w-full md:w-88 flex flex-col justify-center">
            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2.5 text-red-400 text-xs animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Username */}
              <div>
                <label className="block text-xs font-medium text-wa-green uppercase tracking-wider mb-1">
                  Username *
                </label>
                <div className="relative">
                  <AtSign className="w-4 h-4 text-wa-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="avinash123"
                    className="w-full bg-wa-input border border-wa-border rounded-lg pl-9 pr-3 py-2 text-sm text-wa-text placeholder-wa-text-secondary focus:border-wa-green focus:outline-none"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-wa-green uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-wa-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="avinash@example.com"
                    className="w-full bg-wa-input border border-wa-border rounded-lg pl-9 pr-3 py-2 text-sm text-wa-text placeholder-wa-text-secondary focus:border-wa-green focus:outline-none"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-xs font-medium text-wa-text-secondary uppercase tracking-wider mb-1">
                  Display Name <span className="lowercase font-normal opacity-70">(optional)</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-wa-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Avinash Sharma"
                    className="w-full bg-wa-input border border-wa-border rounded-lg pl-9 pr-3 py-2 text-sm text-wa-text placeholder-wa-text-secondary focus:border-wa-green focus:outline-none"
                    autoComplete="name"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-wa-green uppercase tracking-wider mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-wa-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full bg-wa-input border border-wa-border rounded-lg pl-9 pr-10 py-2 text-sm text-wa-text placeholder-wa-text-secondary focus:border-wa-green focus:outline-none"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-wa-text-secondary hover:text-wa-text transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-medium text-wa-green uppercase tracking-wider mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-wa-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full bg-wa-input border border-wa-border rounded-lg pl-9 pr-3 py-2 text-sm text-wa-text placeholder-wa-text-secondary focus:border-wa-green focus:outline-none"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-lg bg-wa-green hover:bg-emerald-600 text-wa-bg font-semibold text-sm transition-colors flex items-center justify-center gap-2 mt-4 shadow-md shadow-wa-green/10 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <span>Create account</span>
                )}
              </button>
            </form>

            <div className="mt-5 text-center text-xs text-wa-text-secondary">
              Already have an account?{' '}
              <Link to="/login" className="text-wa-green hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
