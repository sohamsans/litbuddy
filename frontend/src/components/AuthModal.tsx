import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, loginWithEmail, registerWithEmail, loginOAuthMock } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isRegister) {
        await registerWithEmail(email, password, name);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'apple' | 'demo') => {
    setError(null);
    setLoading(true);
    try {
      await loginOAuthMock(provider);
    } catch (err: any) {
      setError(err.message || `Failed to sign in with ${provider}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-md dark:bg-[#1e1f20] bg-white rounded-3xl p-6 shadow-2xl border dark:border-[#3c4043] border-slate-200">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 dark:text-[#9aa0a6] text-slate-400 hover:dark:text-white hover:text-black p-1.5 rounded-full hover:dark:bg-[#282a2c] hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full dark:bg-[#282a2c] bg-slate-100 dark:text-[#8ab4f8] text-[#1a73e8] mb-3">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-normal dark:text-[#e3e3e3] text-slate-900 font-sans">
            {isRegister ? 'Create LitBuddy Account' : 'Sign In to LitBuddy'}
          </h2>
          <p className="text-xs dark:text-[#9aa0a6] text-slate-500 mt-1">
            Isolate your API credentials and access your synthesis cache.
          </p>
        </div>

        {/* 1-Click Fast Auth Options */}
        <div className="space-y-2 mb-4">
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-full dark:bg-[#131314] bg-white hover:dark:bg-[#282a2c] hover:bg-slate-50 border dark:border-[#3c4043] border-slate-300 dark:text-[#e3e3e3] text-slate-700 text-xs font-medium flex items-center justify-center gap-3 transition-colors"
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
            <span>Continue with Google</span>
          </button>

          <button
            type="button"
            onClick={() => handleOAuth('apple')}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-full dark:bg-[#131314] bg-white hover:dark:bg-[#282a2c] hover:bg-slate-50 border dark:border-[#3c4043] border-slate-300 dark:text-[#e3e3e3] text-slate-700 text-xs font-medium flex items-center justify-center gap-3 transition-colors"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 170 170">
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.71-7.96-12.03-14.64-5.88-9.14-10.43-19.46-13.65-30.98-3.23-11.51-4.84-22.39-4.84-32.61 0-14.48 3.53-26.65 10.59-36.52 7.06-9.87 16.14-14.89 27.24-15.06 4.79 0 10.36 1.34 16.71 4.02 6.35 2.68 10.3 4.07 11.85 4.17 1.83 0 6.06-1.53 12.69-4.59 6.64-3.06 12.39-4.37 17.26-3.93 12.92.93 23.08 5.75 30.49 14.47-11.39 6.89-16.94 16.48-16.65 28.77.29 9.68 3.96 17.77 11.02 24.27 7.06 6.49 15.34 10.23 24.84 11.21-2.22 6.69-4.99 13.88-8.31 21.57zM119.22 33.56c0-7.38 2.64-14.28 7.91-20.7 5.28-6.42 11.83-10.48 19.67-12.18.57 2.12.86 4.3.86 6.54 0 7.39-2.73 14.39-8.19 21.01-5.46 6.62-12.2 10.52-20.25 11.71-.24-2.14-.36-4.27-.36-6.38z" />
            </svg>
            <span>Continue with Apple</span>
          </button>

          <button
            type="button"
            onClick={() => handleOAuth('demo')}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-full dark:bg-[#282a2c] bg-slate-100 hover:dark:bg-[#3c4043] hover:bg-slate-200 border dark:border-[#3c4043] border-slate-300 dark:text-[#8ab4f8] text-[#1a73e8] text-xs font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <span>Instant Demo Session</span>
          </button>
        </div>

        <div className="relative flex items-center justify-center my-4">
          <div className="border-t dark:border-[#3c4043] border-slate-200 w-full" />
          <span className="dark:bg-[#1e1f20] bg-white px-3 text-[10px] uppercase tracking-wider dark:text-[#9aa0a6] text-slate-400">
            or with email
          </span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="p-2.5 rounded-xl dark:bg-[#f28b82]/10 bg-rose-50 border dark:border-[#f28b82]/30 border-rose-200 text-[#f28b82] text-xs">
              {error}
            </div>
          )}

          {isRegister && (
            <div>
              <label className="block text-[11px] dark:text-[#9aa0a6] text-slate-500 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-2.5 dark:text-[#9aa0a6] text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Researcher Name"
                  className="w-full pl-9 pr-3 py-2 rounded-full dark:bg-[#131314] bg-slate-50 border dark:border-[#3c4043] border-slate-300 text-xs dark:text-white text-slate-900 outline-none focus:border-[#8ab4f8]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] dark:text-[#9aa0a6] text-slate-500 mb-1">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 dark:text-[#9aa0a6] text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="researcher@institution.edu"
                className="w-full pl-9 pr-3 py-2 rounded-full dark:bg-[#131314] bg-slate-50 border dark:border-[#3c4043] border-slate-300 text-xs dark:text-white text-slate-900 outline-none focus:border-[#8ab4f8]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] dark:text-[#9aa0a6] text-slate-500 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 dark:text-[#9aa0a6] text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 rounded-full dark:bg-[#131314] bg-slate-50 border dark:border-[#3c4043] border-slate-300 text-xs dark:text-white text-slate-900 outline-none focus:border-[#8ab4f8]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-full bg-[#8ab4f8] text-[#131314] hover:bg-[#a8c7fa] text-xs font-semibold flex items-center justify-center gap-2 mt-4 transition-colors"
          >
            {loading ? (
              <div className="w-3.5 h-3.5 border-2 border-[#131314]/30 border-t-[#131314] rounded-full animate-spin" />
            ) : (
              <>
                <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Register/Sign-In */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-xs dark:text-[#9aa0a6] text-slate-500 hover:underline"
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
          </button>
        </div>

        {/* Privacy badge */}
        <div className="mt-4 pt-3 border-t dark:border-[#3c4043] border-slate-200 flex items-center justify-center gap-1.5 text-[11px] dark:text-[#9aa0a6] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-[#81c995]" />
          <span>Client-Isolated AES-256 Security</span>
        </div>
      </div>
    </div>
  );
};
