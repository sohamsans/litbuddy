import React, { useState, useEffect, useMemo } from 'react';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  BookOpen,
  Settings,
  Clock,
  Sparkles,
  ChevronRight,
  Database,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { SavedSearchItem } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onNewReview: () => void;
  onSelectTopic: (topic: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  onNewReview,
  onSelectTopic
}) => {
  const { user, isAuthenticated, openAuthModal, openKeyModal } = useAuth();
  const [recentSearches, setRecentSearches] = useState<SavedSearchItem[]>([]);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    api.getSavedSearches().then(setRecentSearches).catch(() => {});
  }, []);

  const handleDeleteSearch = async (e: React.MouseEvent, queryHash: string) => {
    e.stopPropagation();
    try {
      await api.deleteSavedSearch(queryHash);
      setRecentSearches(prev => prev.filter(s => s.query_hash !== queryHash));
    } catch (err) {
      console.error('Failed to remove review history:', err);
    }
  };

  const filteredSearches = useMemo(() => {
    const seen = new Set<string>();
    const unique: SavedSearchItem[] = [];
    for (const s of recentSearches) {
      const key = s.topic.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(s);
      }
    }
    if (!searchFilter.trim()) return unique;
    return unique.filter(s => s.topic.toLowerCase().includes(searchFilter.toLowerCase()));
  }, [recentSearches, searchFilter]);

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex flex-col transition-all duration-300 ease-in-out border-r dark:bg-[#1e1f20] bg-[#f0f4f9] dark:border-[#2d2f31] border-[#dadce0] ${
        isOpen ? 'w-64' : 'w-16'
      }`}
    >
      {/* Top Header: Gemini Logo + Collapse Button */}
      <div className="h-14 px-4 flex items-center justify-between border-b dark:border-[#2d2f31] border-[#dadce0]">
        {isOpen ? (
          <div className="flex items-center gap-2.5">
            {/* Google-style 4-point rainbow star */}
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
                fill="url(#gemini-rainbow)"
              />
              <defs>
                <linearGradient id="gemini-rainbow" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#4285F4" />
                  <stop offset="0.33" stopColor="#9B72CB" />
                  <stop offset="0.66" stopColor="#D96570" />
                  <stop offset="1" stopColor="#F4B400" />
                </linearGradient>
              </defs>
            </svg>
            <span className="font-semibold text-base tracking-tight dark:text-[#e3e3e3] text-[#1f1f1f]">
              LitBuddy
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={onToggle}
            className="p-1 text-[#9aa0a6] hover:text-white"
            title="Expand Sidebar"
          >
            <svg className="w-5 h-5 mx-auto" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
                fill="url(#gemini-rainbow-collapsed)"
              />
              <defs>
                <linearGradient id="gemini-rainbow-collapsed" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#4285F4" />
                  <stop offset="0.33" stopColor="#9B72CB" />
                  <stop offset="0.66" stopColor="#D96570" />
                  <stop offset="1" stopColor="#F4B400" />
                </linearGradient>
              </defs>
            </svg>
          </button>
        )}

        <button
          type="button"
          onClick={onToggle}
          className="p-1.5 rounded-lg dark:text-[#9aa0a6] text-[#5f6368] hover:dark:bg-[#282a2c] hover:bg-slate-200 transition-colors"
          title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Sidebar Actions */}
      <div className="p-3 space-y-2">
        {/* + New Review Capsule Button */}
        <button
          type="button"
          onClick={onNewReview}
          className={`w-full py-2 px-3 rounded-full flex items-center gap-3 text-xs font-medium transition-all ${
            isOpen
              ? 'dark:bg-[#131314] bg-white border dark:border-[#3c4043] border-slate-300 dark:text-[#e3e3e3] text-[#1f1f1f] hover:dark:bg-[#282a2c] hover:bg-slate-100 shadow-xs'
              : 'justify-center p-2 rounded-full dark:bg-[#131314] bg-white border dark:border-[#3c4043] border-slate-300'
          }`}
          title="Start new literature review"
        >
          <Plus className="w-4 h-4 text-[#8ab4f8]" />
          {isOpen && <span>New review</span>}
        </button>

        {isOpen && (
          <div className="relative mt-2">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 dark:text-[#9aa0a6] text-[#5f6368]" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search reviews..."
              className="w-full pl-8 pr-3 py-1.5 rounded-full dark:bg-[#131314] bg-white border dark:border-[#3c4043] border-slate-300 text-xs dark:text-[#e3e3e3] text-[#1f1f1f] placeholder-[#9aa0a6] focus:outline-none focus:border-[#8ab4f8]"
            />
          </div>
        )}
      </div>

      {/* Recent History List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {isOpen && (
          <div>
            <div className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider dark:text-[#9aa0a6] text-[#5f6368]">
              Recent
            </div>

            <div className="space-y-0.5">
              {filteredSearches.length === 0 ? (
                <div className="px-2 py-4 text-xs dark:text-[#5f6368] text-[#9aa0a6]">
                  {searchFilter ? 'No matching reviews' : 'No recent reviews yet'}
                </div>
              ) : (
                filteredSearches.map((item) => (
                  <div
                    key={item.query_hash}
                    onClick={() => onSelectTopic(item.topic)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs dark:text-[#c4c7c5] text-[#444746] hover:dark:bg-[#282a2c] hover:bg-slate-200/80 transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <span className="truncate flex-1 pr-2">{item.topic}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSearch(e, item.query_hash)}
                        className="p-1 rounded text-[#9aa0a6] hover:text-[#f28b82] hover:dark:bg-[#3c4043] hover:bg-slate-300 transition-colors"
                        title="Remove review from list (paper vault data remains safely cached)"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <ChevronRight className="w-3 h-3 text-[#9aa0a6]" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Account Profile Footer */}
      <div className="p-3 border-t dark:border-[#2d2f31] border-[#dadce0]">
        {isAuthenticated && user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-[#8ab4f8] text-[#131314] font-bold text-xs flex items-center justify-center shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              {isOpen && (
                <div className="min-w-0 truncate">
                  <p className="text-xs font-semibold dark:text-[#e3e3e3] text-[#1f1f1f] truncate">
                    {user.name}
                  </p>
                  <p className="text-[10px] dark:text-[#9aa0a6] text-[#5f6368] truncate">
                    BYOK Enabled
                  </p>
                </div>
              )}
            </div>

            {isOpen && (
              <button
                type="button"
                onClick={openKeyModal}
                className="p-1.5 rounded-lg dark:text-[#9aa0a6] text-[#5f6368] hover:dark:bg-[#282a2c] hover:bg-slate-200 transition-colors"
                title="Settings & BYOK Keys"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={openAuthModal}
            className={`w-full py-2 px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              isOpen
                ? 'dark:bg-[#282a2c] bg-white border dark:border-[#3c4043] border-slate-300 dark:text-[#e3e3e3] text-[#1f1f1f] hover:dark:bg-[#3c4043]'
                : 'p-2 rounded-full dark:bg-[#282a2c] bg-white'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-slate-400 text-white flex items-center justify-center text-[10px]">
              S
            </div>
            {isOpen && <span>Sign In</span>}
          </button>
        )}
      </div>
    </aside>
  );
};
