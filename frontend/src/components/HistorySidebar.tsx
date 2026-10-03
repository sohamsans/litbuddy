import React, { useState, useEffect } from 'react';
import { X, History, Database, MessageSquare, Clock, Zap, ArrowRight, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { SavedSearchItem, ChatHistoryRecord } from '../types';

interface HistorySidebarProps {
  onSelectSearchTopic: (topic: string) => void;
  onRestoreChat?: (chat: ChatHistoryRecord) => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  onSelectSearchTopic,
  onRestoreChat
}) => {
  const { isHistoryDrawerOpen, closeHistoryDrawer, token, isAuthenticated, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<'searches' | 'chats'>('searches');
  const [savedSearches, setSavedSearches] = useState<SavedSearchItem[]>([]);
  const [savedChats, setSavedChats] = useState<ChatHistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isHistoryDrawerOpen) {
      loadHistory();
    }
  }, [isHistoryDrawerOpen, token]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const searches = await api.getSavedSearches();
      setSavedSearches(searches);

      if (token) {
        const chats = await api.getChatHistory(token);
        setSavedChats(chats);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isHistoryDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md glass-panel dark:bg-[#0c121e]/98 bg-white/98 border-l dark:border-white/10 border-slate-200 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b dark:border-white/10 border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <History className="w-5 h-5 text-emerald-400" />
              <h2 className="font-bold text-slate-900 dark:text-white text-base">
                Research Memory & History
              </h2>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={loadHistory}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                title="Refresh history"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={closeHistoryDrawer}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b dark:border-white/10 border-slate-200 px-4 pt-2">
            <button
              onClick={() => setActiveTab('searches')}
              className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'searches'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Cached Searches ({savedSearches.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('chats')}
              className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'chats'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Copilot Inquiries ({savedChats.length})</span>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeTab === 'searches' && (
              <>
                <div className="text-[11px] text-slate-400 flex items-center gap-1 mb-2">
                  <Zap className="w-3 h-3 text-emerald-400" />
                  <span>Dual-Layer Discovery Cache: Replay queries instantly with 0 API calls.</span>
                </div>

                {savedSearches.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    No cached queries yet. Run a literature search to build your local cache.
                  </div>
                ) : (
                  savedSearches.map((item) => (
                    <div
                      key={item.query_hash}
                      className="p-3.5 rounded-xl dark:bg-black/30 bg-slate-50 border dark:border-white/10 border-slate-200 hover:border-emerald-500/40 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-medium text-slate-200 group-hover:text-emerald-400 transition-colors line-clamp-2">
                          {item.topic}
                        </h4>
                        <span className="shrink-0 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5" />
                          <span>0ms Cache</span>
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t dark:border-white/5 border-slate-200">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}
                        </span>
                        <span className="text-slate-400">
                          {item.total_count} candidate papers
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectSearchTopic(item.topic);
                            closeHistoryDrawer();
                          }}
                          className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white transition-all text-[11px] font-medium flex items-center gap-1"
                        >
                          <span>Replay</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {activeTab === 'chats' && (
              <>
                {!isAuthenticated ? (
                  <div className="text-center py-12 text-slate-400 text-xs space-y-3">
                    <p>Sign in to save and sync your AI Copilot conversation transcripts across devices.</p>
                    <button
                      onClick={openAuthModal}
                      className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-medium text-xs hover:bg-emerald-600 transition-colors"
                    >
                      Sign In / Register
                    </button>
                  </div>
                ) : savedChats.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    No saved Copilot conversations found. Use the Copilot to narrow down your research topic!
                  </div>
                ) : (
                  savedChats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => onRestoreChat?.(chat)}
                      className="p-3.5 rounded-xl dark:bg-black/30 bg-slate-50 border dark:border-white/10 border-slate-200 hover:border-violet-500/40 cursor-pointer transition-all"
                    >
                      <h4 className="text-xs font-medium text-slate-200 hover:text-violet-400 transition-colors">
                        {chat.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {chat.messages[chat.messages.length - 1]?.content}
                      </p>
                      <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {chat.created_at ? new Date(chat.created_at).toLocaleDateString() : 'Saved'}
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
