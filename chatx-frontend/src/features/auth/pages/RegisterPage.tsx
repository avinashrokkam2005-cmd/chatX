import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { MessageSquare, Lock, User, Mail, AtSign, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

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
      navigate('/');
    } catch (err: any) {
      const message = err.response?.data?.message ||
                      err.response?.data?.errors?.[0] ||
                      'Registration failed. Please check the provided information.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8 bg-chatx-bg">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-chatx-surface border border-chatx-border shadow-lg shadow-chatx-accent/5 mb-4">
            <MessageSquare className="w-7 h-7 text-chatx-accent" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-chatx-text">Create account</h1>
          <p className="text-chatx-text-secondary mt-2 text-sm">
            Join ChatX to connect and message in real time
          </p>
        </div>

        {/* Form Card */}
        <div className="glass-panel p-8 shadow-xl">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-lg bg-chatx-danger/10 border border-chatx-danger/20 flex items-start gap-3 text-chatx-danger text-sm animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-chatx-text-secondary uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-chatx-text-secondary">
                  <AtSign className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  placeholder="avinash123"
                  className="input-field pl-10 text-sm"
                  autoComplete="username"
                  required
                />
              </div>
              <p className="text-[11px] text-chatx-text-secondary mt-1">
                Your permanent searchable handle (e.g. @avinash123)
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-chatx-text-secondary uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-chatx-text-secondary">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="avinash@example.com"
                  className="input-field pl-10 text-sm"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Display Name (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-chatx-text-secondary uppercase tracking-wider mb-1.5">
                Display Name <span className="text-chatx-text-secondary/60 lowercase font-normal">(optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-chatx-text-secondary">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Avinash Sharma"
                  className="input-field pl-10 text-sm"
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-chatx-text-secondary uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-chatx-text-secondary">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="input-field pl-10 pr-10 text-sm"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-chatx-text-secondary hover:text-chatx-text transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-chatx-text-secondary uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-chatx-text-secondary">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="input-field pl-10 text-sm"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full flex items-center justify-center gap-2 pt-3 pb-3 mt-4 shadow-lg shadow-chatx-accent/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <span>Register account</span>
              )}
            </button>
          </form>

          {/* Footer link */}
          <div className="mt-6 text-center text-sm text-chatx-text-secondary">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-chatx-accent hover:text-chatx-accent-hover font-semibold transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
