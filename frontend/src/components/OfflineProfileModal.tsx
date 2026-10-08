import React, { useState } from 'react';
import { X, User, Sparkles, Check, ShieldCheck, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AVATAR_COLORS = [
  { id: 'sky', bg: 'bg-sky-500 text-zinc-950', ring: 'ring-sky-400' },
  { id: 'emerald', bg: 'bg-emerald-500 text-zinc-950', ring: 'ring-emerald-400' },
  { id: 'purple', bg: 'bg-purple-500 text-white', ring: 'ring-purple-400' },
  { id: 'amber', bg: 'bg-amber-500 text-zinc-950', ring: 'ring-amber-400' },
  { id: 'rose', bg: 'bg-rose-500 text-white', ring: 'ring-rose-400' },
  { id: 'zinc', bg: 'bg-zinc-200 text-zinc-900', ring: 'ring-zinc-300' }
] as const;

export const OfflineProfileModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, offlineProfile, saveOfflineProfile } = useAuth();

  const [name, setName] = useState(offlineProfile.name);
  const [username, setUsername] = useState(offlineProfile.username);
  const [title, setTitle] = useState(offlineProfile.title);
  const [avatarColor, setAvatarColor] = useState(offlineProfile.avatar_color || 'sky');
  const [saveHistory, setSaveHistory] = useState(offlineProfile.save_chat_history ?? true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveOfflineProfile({
      name: name.trim() || 'Fellow Researcher',
      username: username.trim().replace(/^@/, '') || 'researcher',
      title: title.trim() || 'Independent Scholar',
      avatar_color: avatarColor,
      save_chat_history: saveHistory
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      closeAuthModal();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl antigravity-card p-6 shadow-2xl border border-white/10 bg-[#0d0e12] space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md ${
              AVATAR_COLORS.find(c => c.id === avatarColor)?.bg || 'bg-sky-500 text-zinc-950'
            }`}>
              {(name.trim() || 'R').charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
                Researcher Profile
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  100% Offline
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400">Customise how your citations &amp; notes are signed.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeAuthModal}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-300 block mb-1.5">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dr. Alex Rivera"
              className="w-full bg-zinc-950 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 border border-zinc-800 focus:outline-none focus:border-sky-500 font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-300 block mb-1.5">Username / Tag</label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs text-zinc-500 font-mono">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/^@/, ''))}
                placeholder="supercav_researcher"
                className="w-full bg-zinc-950 rounded-xl pl-7 pr-3.5 py-2.5 text-xs font-mono text-zinc-200 border border-zinc-800 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-300 block mb-1.5">Research Focus / Lab Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fluid Mechanics &amp; Cavitation Dynamics"
              className="w-full bg-zinc-950 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 border border-zinc-800 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Avatar Color Selection */}
          <div>
            <label className="text-xs font-medium text-zinc-300 block mb-1.5">Avatar Accent</label>
            <div className="flex items-center gap-2.5">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setAvatarColor(c.id)}
                  className={`w-7 h-7 rounded-full transition-all flex items-center justify-center ${c.bg} ${
                    avatarColor === c.id ? `ring-2 ${c.ring} scale-110 shadow-md` : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  {avatarColor === c.id && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Privacy Note */}
          <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex items-start gap-2.5 text-[11px] text-zinc-400 leading-relaxed">
            <Heart className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>
              LitBuddy is 100% offline and free forever. Your profile, papers, and notes remain strictly on your machine.
            </span>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={closeAuthModal}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-semibold text-xs transition-colors shadow-md"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Profile</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
