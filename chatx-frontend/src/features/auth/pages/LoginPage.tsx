import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { MessageSquare, Lock, User, Eye, EyeOff, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!usernameOrEmail.trim()) {
      setErrorMessage('Please enter your username or email');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password');
      return;
    }

    try {
      setIsSubmitting(true);
      await login(usernameOrEmail.trim(), password);
      navigate('/chat');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Login failed. Please check your credentials.';
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
              To use ChatX on your computer:
            </h1>
            <ol className="space-y-4 text-sm text-wa-text-secondary leading-relaxed">
              <li className="flex items-start gap-3">
                <span className="font-semibold text-wa-text">1.</span>
                <span>Open ChatX on your device or sign in with your account.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-semibold text-wa-text">2.</span>
                <span>Enter your username or registered email address.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-semibold text-wa-text">3.</span>
                <span>Enter your account password to decrypt and synchronize your chats.</span>
              </li>
            </ol>

            <div className="pt-4 border-t border-wa-border/40 flex items-center gap-3 text-xs text-wa-text-secondary">
              <ShieldCheck className="w-4 h-4 text-wa-green shrink-0" />
              <span>Protected with real-time end-to-end WebSocket encryption.</span>
            </div>
          </div>

          {/* Right Column: Credentials Form */}
          <div className="w-full md:w-80 flex flex-col justify-center">
            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2.5 text-red-400 text-xs animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-wa-green uppercase tracking-wider mb-1.5">
                  Username or Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-wa-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    placeholder="avinash or avinash@example.com"
                    className="w-full bg-wa-input border border-wa-border rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-wa-text placeholder-wa-text-secondary focus:border-wa-green focus:outline-none"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-wa-green uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-wa-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full bg-wa-input border border-wa-border rounded-lg pl-9 pr-10 py-2.5 text-sm text-wa-text placeholder-wa-text-secondary focus:border-wa-green focus:outline-none"
                    autoComplete="current-password"
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-lg bg-wa-green hover:bg-emerald-600 text-wa-bg font-semibold text-sm transition-colors flex items-center justify-center gap-2 mt-4 shadow-md shadow-wa-green/10 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign in</span>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-wa-text-secondary">
              Need an account?{' '}
              <Link to="/register" className="text-wa-green hover:underline font-medium">
                Create account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
