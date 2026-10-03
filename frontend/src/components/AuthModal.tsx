import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, ArrowRight, Eye, EyeOff, KeyRound, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    loginWithEmail,
    registerWithEmail,
    verifyAccountCode,
    resendAccountCode
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<'form' | 'verify'>('form');

  // Form Fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & Feedback
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  if (!isAuthModalOpen) return null;

  const resetForm = () => {
    setError(null);
    setSuccessMsg(null);
    setVerificationCode('');
    setStep('form');
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const cleanUser = username.trim().toLowerCase();
      const cleanEmail = email.trim().toLowerCase();

      if (cleanUser.length < 3) {
        throw new Error('Username must be at least 3 characters.');
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters.');
      }

      await registerWithEmail(cleanUser, cleanEmail, password, cleanUser);
      setSuccessMsg(`A 6-digit verification code was sent to ${cleanEmail}`);
      setStep('verify');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (verificationCode.trim().length !== 6) {
        throw new Error('Please enter the complete 6-digit code.');
      }
      await verifyAccountCode(email.trim().toLowerCase(), verificationCode.trim());
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await loginWithEmail(email.trim(), password);
      resetForm();
    } catch (err: any) {
      const msg = err.message || 'Login failed.';
      if (msg.toLowerCase().includes('verify your account first')) {
        setSuccessMsg(`Please enter the 6-digit code sent to ${email}`);
        setStep('verify');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError(null);
    try {
      await resendAccountCode(email.trim().toLowerCase());
      setSuccessMsg(`A fresh verification code was sent to ${email}`);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#1e1f20] text-[#e3e3e3] rounded-3xl p-6 shadow-2xl border border-[#3c4043]">
        {/* Close Button */}
        <button
          onClick={() => {
            resetForm();
            closeAuthModal();
          }}
          className="absolute top-4 right-4 text-[#9aa0a6] hover:text-white p-1.5 rounded-full hover:bg-[#282a2c] transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#282a2c] border border-[#3c4043] text-[#8ab4f8] mb-3 shadow-inner">
            {step === 'verify' ? <KeyRound className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </div>
          <h2 className="text-xl font-semibold text-[#e3e3e3]">
            {step === 'verify'
              ? 'Verify Your Email'
              : activeTab === 'register'
              ? 'Create LitBuddy Account'
              : 'Sign In to LitBuddy'}
          </h2>
          <p className="text-xs text-[#9aa0a6] mt-1 max-w-xs mx-auto">
            {step === 'verify'
              ? `Enter the 6-digit confirmation code sent to ${email}.`
              : 'Keep all your synthesized literature reviews, chat history, and encrypted BYOK keys permanently saved.'}
          </p>
        </div>

        {/* Mode Switcher Tabs (Only in form step) */}
        {step === 'form' && (
          <div className="flex p-1 bg-[#131314] rounded-2xl border border-[#3c4043] mb-5">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setError(null);
                setSuccessMsg(null);
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
                setSuccessMsg(null);
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
          <div className="mb-4 p-3 rounded-xl bg-[#f28b82]/10 border border-[#f28b82]/30 text-[#f28b82] text-xs animate-fadeIn">
            {error}
          </div>
        )}

        {/* Success Notice */}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-[#81c995]/10 border border-[#81c995]/30 text-[#81c995] text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 2: VERIFICATION CODE INPUT */}
        {step === 'verify' ? (
          <form onSubmit={handleVerifySubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-[#c4c7c5] mb-2 text-center">
                Enter 6-Digit Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                autoFocus
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                className="w-full text-center py-3 rounded-2xl bg-[#131314] border border-[#3c4043] text-xl font-mono tracking-[0.5em] text-[#8ab4f8] placeholder-[#5f6368] outline-none focus:border-[#8ab4f8] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading || verificationCode.length !== 6}
              className="w-full py-2.5 rounded-xl bg-[#8ab4f8] text-[#131314] hover:bg-[#8ab4f8]/90 text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-[#131314]/30 border-t-[#131314] rounded-full animate-spin" />
              ) : (
                <>
                  <span>Verify Account &amp; Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            <div className="flex items-center justify-between pt-2 text-xs text-[#9aa0a6]">
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="inline-flex items-center gap-1 hover:text-[#e3e3e3] hover:underline"
              >
                <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
                <span>Resend Code</span>
              </button>

              <button
                type="button"
                onClick={() => setStep('form')}
                className="hover:text-[#e3e3e3] hover:underline"
              >
                Change Details
              </button>
            </div>
          </form>
        ) : activeTab === 'register' ? (
          /* STEP 1A: REGISTRATION FORM */
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-medium text-[#c4c7c5] mb-1.5">Username</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-[#9aa0a6]" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. sohamsans"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#131314] border border-[#3c4043] text-xs text-white placeholder-[#9aa0a6] outline-none focus:border-[#8ab4f8] transition-colors"
                />
              </div>
            </div>

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
                <span className="text-[10px] text-[#9aa0a6]">Min. 6 characters</span>
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
              disabled={loading || !username.trim() || !email.trim() || !password}
              className="w-full py-2.5 rounded-xl bg-[#8ab4f8] text-[#131314] hover:bg-[#8ab4f8]/90 text-xs font-semibold flex items-center justify-center gap-2 mt-4 transition-all disabled:opacity-40"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-[#131314]/30 border-t-[#131314] rounded-full animate-spin" />
              ) : (
                <>
                  <span>Send Verification Code</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* STEP 1B: SIGN IN FORM */
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-medium text-[#c4c7c5] mb-1.5">
                Email or Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-[#9aa0a6]" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Username or email address"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#131314] border border-[#3c4043] text-xs text-white placeholder-[#9aa0a6] outline-none focus:border-[#8ab4f8] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#c4c7c5] mb-1.5">Password</label>
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
                  <span>Sign In to LitBuddy</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Security footer */}
        <div className="mt-5 pt-3 border-t border-[#3c4043] flex items-center justify-center gap-1.5 text-[11px] text-[#9aa0a6]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#81c995]" />
          <span>Email Verified • AES-256 Key Isolation</span>
        </div>
      </div>
    </div>
  );
};
