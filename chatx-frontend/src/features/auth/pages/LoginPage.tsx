import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { MessageSquare, Lock, User, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

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
      navigate('/');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-chatx-bg">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-chatx-surface border border-chatx-border shadow-lg shadow-chatx-accent/5 mb-4">
            <MessageSquare className="w-7 h-7 text-chatx-accent" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-chatx-text">Welcome back</h1>
          <p className="text-chatx-text-secondary mt-2 text-sm">
            Sign in to your ChatX account
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

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username or Email Input */}
            <div>
              <label className="block text-xs font-semibold text-chatx-text-secondary uppercase tracking-wider mb-2">
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-chatx-text-secondary">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="avinash or avinash@example.com"
                  className="input-field pl-11"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold text-chatx-text-secondary uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-chatx-text-secondary">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-field pl-11 pr-11"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-chatx-text-secondary hover:text-chatx-text transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2 shadow-lg shadow-chatx-accent/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign in</span>
              )}
            </button>
          </form>

          {/* Footer link */}
          <div className="mt-6 text-center text-sm text-chatx-text-secondary">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-chatx-accent hover:text-chatx-accent-hover font-semibold transition-colors"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
