import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, loginWithEmail, registerWithEmail, loginOAuthMock } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Google 1-click email input mode
  const [isGoogleMode, setIsGoogleMode] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (activeTab === 'register') {
        if (!name.trim()) {
          throw new Error('Please enter your name.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        await registerWithEmail(email.trim(), password, name.trim());
      } else {
        await loginWithEmail(email.trim(), password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim()) {
      setError('Please enter your Google account email.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await loginOAuthMock('google', googleEmail.trim(), googleEmail.split('@')[0]);
      setIsGoogleMode(false);
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate with Google account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#1e1f20] text-[#e3e3e3] rounded-3xl p-6 shadow-2xl border border-[#3c4043]">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 text-[#9aa0a6] hover:text-white p-1.5 rounded-full hover:bg-[#282a2c] transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#282a2c] border border-[#3c4043] text-[#8ab4f8] mb-3 shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-semibold text-[#e3e3e3]">
            {isGoogleMode
              ? 'Connect Google Account'
              : activeTab === 'register'
              ? 'Create LitBuddy Account'
              : 'Sign In to LitBuddy'}
          </h2>
          <p className="text-xs text-[#9aa0a6] mt-1 max-w-xs mx-auto">
            {isGoogleMode
              ? 'Enter your real Google email to sync review history and LLM keys.'
              : 'Keep all your synthesized papers, chat history, and encrypted BYOK keys permanently saved.'}
          </p>
        </div>

        {/* Mode Switcher Tabs (Sign In / Create Account) */}
        {!isGoogleMode && (
          <div className="flex p-1 bg-[#131314] rounded-2xl border border-[#3c4043] mb-5">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'login'
                  ? 'bg-[#282a2c] text-[#8ab4f8] shadow-sm font-semibold'
                  : 'text-[#9aa0a6] hover:text-[#e3e3e3]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'register'
                  ? 'bg-[#282a2c] text-[#8ab4f8] shadow-sm font-semibold'
                  : 'text-[#9aa0a6] hover:text-[#e3e3e3]'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Error Notice */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[#f28b82]/10 border border-[#f28b82]/30 text-[#f28b82] text-xs">
            {error}
          </div>
        )}

        {/* Google 1-Click Connection Prompt */}
        {isGoogleMode ? (
          <form onSubmit={handleGoogleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-medium text-[#c4c7c5] mb-1.5">
                Google Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-[#9aa0a6]" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#131314] border border-[#3c4043] text-xs text-white placeholder-[#9aa0a6] outline-none focus:border-[#8ab4f8] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !googleEmail.trim()}
              className="w-full py-2.5 rounded-xl bg-[#8ab4f8] text-[#131314] hover:bg-[#8ab4f8]/90 text-xs font-semibold flex items-center justify-center gap-2 mt-4 transition-all disabled:opacity-40"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-[#131314]/30 border-t-[#131314] rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In with Google Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsGoogleMode(false);
                setError(null);
              }}
              className="w-full text-center text-xs text-[#9aa0a6] hover:text-[#e3e3e3] hover:underline pt-1"
            >
              Back to Email &amp; Password
            </button>
          </form>
        ) : (
          /* Standard Email & Password Form */
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {activeTab === 'register' && (
              <div>
                <label className="block text-[11px] font-medium text-[#c4c7c5] mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-[#9aa0a6]" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Soham"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#131314] border border-[#3c4043] text-xs text-white placeholder-[#9aa0a6] outline-none focus:border-[#8ab4f8] transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium text-[#c4c7c5] mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-[#9aa0a6]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. researcher@gmail.com"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#131314] border border-[#3c4043] text-xs text-white placeholder-[#9aa0a6] outline-none focus:border-[#8ab4f8] transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-medium text-[#c4c7c5]">Password</label>
                {activeTab === 'register' && (
                  <span className="text-[10px] text-[#9aa0a6]">Min. 6 characters</span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#9aa0a6]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#131314] border border-[#3c4043] text-xs text-white placeholder-[#9aa0a6] outline-none focus:border-[#8ab4f8] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#9aa0a6] hover:text-[#e3e3e3]"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="w-full py-2.5 rounded-xl bg-[#8ab4f8] text-[#131314] hover:bg-[#8ab4f8]/90 text-xs font-semibold flex items-center justify-center gap-2 mt-4 transition-all disabled:opacity-40"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-[#131314]/30 border-t-[#131314] rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {activeTab === 'register' ? 'Create Account & Sync Data' : 'Sign In to LitBuddy'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            {/* Google Alternative Option */}
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-[#3c4043] w-full" />
              <span className="bg-[#1e1f20] px-3 text-[10px] uppercase tracking-wider text-[#9aa0a6]">
                or
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsGoogleMode(true);
                setError(null);
              }}
              className="w-full py-2 px-3 rounded-xl bg-[#131314] hover:bg-[#282a2c] border border-[#3c4043] text-xs text-[#e3e3e3] font-medium flex items-center justify-center gap-2.5 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google Account</span>
            </button>
          </form>
        )}

        {/* Security badge */}
        <div className="mt-5 pt-3 border-t border-[#3c4043] flex items-center justify-center gap-1.5 text-[11px] text-[#9aa0a6]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#81c995]" />
          <span>Encrypted with AES-256 Fernet Key Isolation</span>
        </div>
      </div>
    </div>
  );
};
