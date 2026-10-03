import React from 'react';
import {
  Key,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  ChevronDown,
  MessageSquare,
  Bookmark,
  Download,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { HealthStatus } from '../types';

interface HeaderProps {
  health: HealthStatus | null;
  onOpenAssistant: () => void;
  activeTab?: 'research' | 'references' | 'downloads';
  onTabChange?: (tab: 'research' | 'references' | 'downloads') => void;
  onOpenTutorial?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  onOpenAssistant,
  activeTab = 'research',
  onTabChange,
  onOpenTutorial
}) => {
  const { user, isAuthenticated, logout, openAuthModal, openKeyModal, saveBYOKKeys } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = React.useState(false);

  const hasConfiguredKeys = user && Object.values(user.configured_keys || {}).some(v => !!v);

  return (
    <header className="h-14 px-4 sm:px-6 flex items-center justify-between border-b border-[#3c4043]/30 z-30 transition-colors bg-[#131314]/80 backdrop-blur-sm">
      {/* Center Nav Pill Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-[#1e1f20] border border-[#3c4043] rounded-2xl">
        <button
          type="button"
          onClick={() => onTabChange?.('research')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
            activeTab === 'research'
              ? 'bg-[#8ab4f8] text-[#131314] font-semibold shadow-sm'
              : 'text-[#9aa0a6] hover:text-[#e3e3e3] hover:bg-[#282a2c]'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Research &amp; Chat</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange?.('references')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
            activeTab === 'references'
              ? 'bg-[#8ab4f8] text-[#131314] font-semibold shadow-sm'
              : 'text-[#9aa0a6] hover:text-[#e3e3e3] hover:bg-[#282a2c]'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Reference Manager</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange?.('downloads')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
            activeTab === 'downloads'
              ? 'bg-[#8ab4f8] text-[#131314] font-semibold shadow-sm'
              : 'text-[#9aa0a6] hover:text-[#e3e3e3] hover:bg-[#282a2c]'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Downloads</span>
        </button>
      </div>

      {/* Right Controls: Tutorial, BYOK, User */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onOpenTutorial && (
          <button
            type="button"
            onClick={onOpenTutorial}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1e1f20] border border-[#3c4043] hover:bg-[#282a2c] text-xs font-medium text-[#c4c7c5] hover:text-[#e3e3e3] transition-all"
            title="Interactive Walkthrough & Tutorials"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#8ab4f8]" />
            <span className="hidden sm:inline">Tutorial</span>
          </button>
        )}

        {/* Gemini-Style BYOK Pill */}
        <button
          type="button"
          onClick={openKeyModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full dark:bg-[#1e1f20] bg-white border dark:border-[#3c4043] border-[#dadce0] hover:dark:bg-[#282a2c] hover:bg-slate-100 text-xs font-medium dark:text-[#e3e3e3] text-[#1f1f1f] shadow-xs transition-all"
        >
          {/* Subtle Google Sparkle */}
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
              fill="url(#header-rainbow)"
            />
            <defs>
              <linearGradient id="header-rainbow" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4285F4" />
                <stop offset="0.33" stopColor="#9B72CB" />
                <stop offset="0.66" stopColor="#D96570" />
                <stop offset="1" stopColor="#F4B400" />
              </linearGradient>
            </defs>
          </svg>
          <span>BYOK Keys</span>
          {hasConfiguredKeys && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#81c995]" title="Keys encrypted" />
          )}
        </button>

        {/* User Account Pill */}
        {isAuthenticated && user ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="w-7 h-7 rounded-full bg-[#8ab4f8] text-[#131314] font-semibold text-xs flex items-center justify-center hover:opacity-90 transition-opacity"
              title={user.name}
            >
              {user.name.charAt(0).toUpperCase()}
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-52 p-2 rounded-2xl dark:bg-[#282a2c] bg-white shadow-xl border dark:border-[#3c4043] border-slate-200 z-50 animate-fadeIn text-xs">
                <div className="px-3 py-2 border-b dark:border-[#3c4043] border-slate-200">
                  <p className="font-semibold dark:text-[#e3e3e3] text-slate-900 truncate">{user.name}</p>
                  <p className="text-[10px] dark:text-[#9aa0a6] text-[#5f6368] truncate">{user.email}</p>
                </div>
                <div className="pt-1 space-y-1">
                  {/* Privacy Quick Toggle */}
                  <div className="px-3 py-1.5 flex items-center justify-between text-xs">
                    <span className="text-[#c4c7c5] text-[11px]">Save History</span>
                    <button
                      type="button"
                      onClick={async () => {
                        const newSetting = !user.save_chat_history;
                        await saveBYOKKeys({ save_chat_history: newSetting });
                      }}
                      className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        user.save_chat_history !== false ? 'bg-[#81c995]' : 'bg-[#5f6368]'
                      }`}
                      title={user.save_chat_history !== false ? 'Chats are saved to your account' : 'Ephemeral mode: chats remain only in browser RAM'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          user.save_chat_history !== false ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowUserDropdown(false);
                      openKeyModal();
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg dark:text-[#c4c7c5] text-slate-700 hover:dark:bg-[#3c4043] hover:bg-slate-100 flex items-center gap-2"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#81c995]" />
                    <span>Security & Keys</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserDropdown(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-[#f28b82] hover:dark:bg-[#3c4043] hover:bg-rose-50 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={openAuthModal}
            className="w-7 h-7 rounded-full dark:bg-[#282a2c] bg-slate-200 dark:text-[#9aa0a6] text-[#5f6368] flex items-center justify-center hover:opacity-80 transition-opacity"
            title="Sign In"
          >
            <UserIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </header>
  );
};
