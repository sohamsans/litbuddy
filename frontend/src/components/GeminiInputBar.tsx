import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  ArrowUp,
  Sliders,
  Sparkles,
  ChevronDown,
  Layers,
  Calendar,
  Filter,
  Check,
  Compass,
  FileText
} from 'lucide-react';
import { ModelProvider } from '../types';
import { useAuth } from '../context/AuthContext';

interface GeminiInputBarProps {
  onSearch: (params: {
    topic: string;
    maxResults: number;
    yearMin?: number;
    yearMax?: number;
    noYearConstraint: boolean;
    relevanceThreshold: number;
    mode: 'discover' | 'autonomous';
  }) => void;
  isLoading: boolean;
  initialTopic?: string;
  onOpenAssistant: () => void;
}

const STARTER_PROMPTS = [
  {
    icon: Layers,
    text: 'Survey KV cache compression and optimization in large language models'
  },
  {
    icon: FileText,
    text: 'Zero-shot clinical reasoning benchmarks in vision-language models'
  },
  {
    icon: Compass,
    text: 'Fault-tolerant threshold bounds and decoding algorithms in quantum surface codes'
  }
];

export const GeminiInputBar: React.FC<GeminiInputBarProps> = ({
  onSearch,
  isLoading,
  initialTopic = '',
  onOpenAssistant
}) => {
  const [topic, setTopic] = useState(initialTopic);
  const [mode, setMode] = useState<'discover' | 'autonomous'>('discover');
  const [maxResults, setMaxResults] = useState<number>(50);
  const [yearMin, setYearMin] = useState<number>(2020);
  const [yearMax, setYearMax] = useState<number>(new Date().getFullYear());
  const [noYearConstraint, setNoYearConstraint] = useState<boolean>(false);
  const [relevanceThreshold, setRelevanceThreshold] = useState<number>(4);

  // Popover menus
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);

  const { activeProvider, setActiveProvider, activeModel, setActiveModel, openKeyModal } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialTopic) {
      setTopic(initialTopic);
    }
  }, [initialTopic]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [topic]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim() || isLoading) return;

    onSearch({
      topic: topic.trim(),
      maxResults,
      yearMin: noYearConstraint ? undefined : yearMin,
      yearMax: noYearConstraint ? undefined : yearMax,
      noYearConstraint,
      relevanceThreshold,
      mode
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const getModelLabel = () => {
    switch (activeProvider) {
      case 'groq':
        return 'Groq (14.4k/d Free)';
      case 'gemini':
        return 'Gemini Flash (Free)';
      case 'openrouter':
        return 'OpenRouter';
      case 'deepseek':
        return 'DeepSeek V3';
      case 'nvidia':
        return 'NVIDIA NIM';
      default:
        return 'Cloud LLM';
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
      {/* Gemini Center Headline */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-center dark:text-[#e3e3e3] text-[#1f1f1f] mb-8 font-sans">
        Where should we start?
      </h1>

      {/* Main Capsule Search Bar */}
      <form
        onSubmit={handleSubmit}
        className="w-full relative rounded-[28px] dark:bg-[#1e1f20] bg-white border dark:border-[#3c4043] border-[#dadce0] shadow-lg hover:border-[#5f6368] focus-within:border-[#8ab4f8] transition-all p-3 sm:px-4 sm:py-3.5 flex flex-col gap-2"
      >
        <div className="flex items-start gap-3 w-full">
          {/* Options Trigger (+) */}
          <div className="relative pt-1">
            <button
              type="button"
              onClick={() => {
                setShowOptionsMenu(!showOptionsMenu);
                setShowModelMenu(false);
              }}
              className="p-1.5 rounded-full dark:text-[#9aa0a6] text-[#5f6368] hover:dark:bg-[#282a2c] hover:bg-slate-100 transition-colors"
              title="Search parameters (Timeline, Pool size, Cutoff)"
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* Options Popover (Opens downward to avoid top viewport clipping) */}
            {showOptionsMenu && (
              <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 p-4 rounded-2xl dark:bg-[#282a2c] bg-white shadow-2xl border dark:border-[#3c4043] border-slate-200 z-50 animate-fadeIn text-xs">
                <div className="font-semibold dark:text-white text-slate-900 pb-2 border-b dark:border-[#3c4043] border-slate-200 mb-3 flex items-center justify-between">
                  <span>Search Parameters</span>
                  <button
                    type="button"
                    onClick={() => setShowOptionsMenu(false)}
                    className="text-[#9aa0a6] hover:text-white px-2 py-0.5 rounded-md hover:bg-[#3c4043]/50 transition-colors"
                  >
                    Done
                  </button>
                </div>

                {/* Candidate Pool Size */}
                <div className="mb-3">
                  <span className="dark:text-[#9aa0a6] text-slate-500 block mb-1.5">Candidate Pool</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[20, 50, 100, 200].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setMaxResults(num)}
                        className={`py-1 rounded-lg border text-center transition-colors ${
                          maxResults === num
                            ? 'border-[#8ab4f8] dark:bg-[#8ab4f8]/10 bg-blue-50 text-[#8ab4f8] font-semibold'
                            : 'dark:border-[#3c4043] border-slate-200 dark:text-[#c4c7c5] text-slate-700'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Publication Window */}
                <div className="mb-3">
                  <span className="dark:text-[#9aa0a6] text-slate-500 block mb-1.5">Publication Window</span>
                  <label className="flex items-center gap-2 cursor-pointer mb-2 dark:text-[#c4c7c5] text-slate-700">
                    <input
                      type="checkbox"
                      checked={noYearConstraint}
                      onChange={(e) => setNoYearConstraint(e.target.checked)}
                      className="accent-[#8ab4f8]"
                    />
                    <span>All Time (No Year Limit)</span>
                  </label>

                  {!noYearConstraint && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-[#9aa0a6] block mb-0.5">Start</span>
                        <input
                          type="number"
                          value={yearMin}
                          onChange={(e) => setYearMin(parseInt(e.target.value) || 2020)}
                          className="w-full px-2 py-1 rounded dark:bg-[#1e1f20] bg-slate-50 border dark:border-[#3c4043] border-slate-200 text-center"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-[#9aa0a6] block mb-0.5">End</span>
                        <input
                          type="number"
                          value={yearMax}
                          onChange={(e) => setYearMax(parseInt(e.target.value) || 2026)}
                          className="w-full px-2 py-1 rounded dark:bg-[#1e1f20] bg-slate-50 border dark:border-[#3c4043] border-slate-200 text-center"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Relevance Cutoff */}
                <div className="mb-3">
                  <span className="dark:text-[#9aa0a6] text-slate-500 block mb-1.5">Relevance Cutoff</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { val: 3, label: 'Score ≥ 3' },
                      { val: 4, label: 'Score ≥ 4' },
                      { val: 5, label: 'Score 5 Only' }
                    ].map((c) => (
                      <button
                        key={c.val}
                        type="button"
                        onClick={() => setRelevanceThreshold(c.val)}
                        className={`py-1 rounded-lg border text-center transition-colors ${
                          relevanceThreshold === c.val
                            ? 'border-[#8ab4f8] dark:bg-[#8ab4f8]/10 bg-blue-50 text-[#8ab4f8] font-semibold'
                            : 'dark:border-[#3c4043] border-slate-200 dark:text-[#c4c7c5] text-slate-700'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Flow Mode */}
                <div>
                  <span className="dark:text-[#9aa0a6] text-slate-500 block mb-1.5">Execution Flow</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setMode('discover')}
                      className={`py-1 rounded-lg border text-center transition-colors ${
                        mode === 'discover'
                          ? 'border-[#8ab4f8] dark:bg-[#8ab4f8]/10 bg-blue-50 text-[#8ab4f8] font-semibold'
                          : 'dark:border-[#3c4043] border-slate-200 dark:text-[#c4c7c5] text-slate-700'
                      }`}
                    >
                      Preview Pool
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('autonomous')}
                      className={`py-1 rounded-lg border text-center transition-colors ${
                        mode === 'autonomous'
                          ? 'border-[#8ab4f8] dark:bg-[#8ab4f8]/10 bg-blue-50 text-[#8ab4f8] font-semibold'
                          : 'dark:border-[#3c4043] border-slate-200 dark:text-[#c4c7c5] text-slate-700'
                      }`}
                    >
                      Auto-Review
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask LitBuddy or search research topics..."
            disabled={isLoading}
            className="w-full bg-transparent border-none outline-none resize-none dark:text-[#e3e3e3] text-[#1f1f1f] placeholder-[#9aa0a6] text-base leading-relaxed pt-1"
          />
        </div>

        {/* Bottom Actions Bar inside capsule */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            {/* Model Selector Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowModelMenu(!showModelMenu);
                  setShowOptionsMenu(false);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full dark:bg-[#282a2c] bg-slate-100 hover:dark:bg-[#3c4043] hover:bg-slate-200 text-xs font-medium dark:text-[#c4c7c5] text-[#444746] transition-colors"
              >
                <span>{getModelLabel()}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#9aa0a6]" />
              </button>

              {showModelMenu && (
                <div className="absolute left-0 top-full mt-2 w-56 p-2 rounded-2xl dark:bg-[#282a2c] bg-white shadow-2xl border dark:border-[#3c4043] border-slate-200 z-50 animate-fadeIn text-xs">
                  <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider dark:text-[#9aa0a6] text-[#5f6368]">
                    Model Provider
                  </div>
                  {[
                    { id: 'groq' as ModelProvider, name: 'Groq Cloud', tag: '14.4k/d Free' },
                    { id: 'gemini' as ModelProvider, name: 'Google Gemini', tag: '1.5k/d Free' },
                    { id: 'openrouter' as ModelProvider, name: 'OpenRouter', tag: ':free models' },
                    { id: 'deepseek' as ModelProvider, name: 'DeepSeek V3', tag: '$0.14/1M' },
                    { id: 'nvidia' as ModelProvider, name: 'NVIDIA NIM', tag: '1,000 Credits' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setActiveProvider(p.id);
                        setShowModelMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-left transition-colors ${
                        activeProvider === p.id
                          ? 'dark:bg-[#8ab4f8]/10 bg-blue-50 text-[#8ab4f8] font-semibold'
                          : 'dark:text-[#c4c7c5] text-slate-700 hover:dark:bg-[#3c4043] hover:bg-slate-100'
                      }`}
                    >
                      <span>{p.name}</span>
                      <span className="text-[10px] text-[#9aa0a6]">{p.tag}</span>
                    </button>
                  ))}
                  <div className="pt-2 mt-1 border-t dark:border-[#3c4043] border-slate-200 px-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModelMenu(false);
                        openKeyModal();
                      }}
                      className="text-xs text-[#8ab4f8] hover:underline"
                    >
                      Manage API Keys
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* AI Research Advisor Trigger */}
            <button
              type="button"
              onClick={onOpenAssistant}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full dark:bg-[#282a2c] bg-slate-100 hover:dark:bg-[#3c4043] hover:bg-slate-200 text-xs font-medium dark:text-[#c4c7c5] text-[#444746] transition-colors"
            >
              <span>Copilot</span>
            </button>
          </div>

          {/* Submit Arrow Button */}
          <button
            type="submit"
            disabled={!topic.trim() || isLoading}
            className="w-8 h-8 rounded-full bg-[#e3e3e3] dark:bg-white text-[#131314] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white transition-all shrink-0"
            title="Search & Review"
          >
            {isLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-[#131314]/30 border-t-[#131314] rounded-full animate-spin" />
            ) : (
              <ArrowUp className="w-4 h-4 font-bold" />
            )}
          </button>
        </div>
      </form>

      {/* Starter Suggestion Chips (Exact match with Gemini screenshot design) */}
      <div className="w-full mt-6 space-y-2">
        {STARTER_PROMPTS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setTopic(item.text);
                onSearch({
                  topic: item.text,
                  maxResults,
                  yearMin: noYearConstraint ? undefined : yearMin,
                  yearMax: noYearConstraint ? undefined : yearMax,
                  noYearConstraint,
                  relevanceThreshold,
                  mode
                });
              }}
              className="w-full text-left px-4 py-3 rounded-2xl dark:bg-[#1e1f20] bg-[#f0f4f9] hover:dark:bg-[#282a2c] hover:bg-[#e9eef6] border dark:border-white/5 border-transparent flex items-center gap-3 transition-all group"
            >
              <Icon className="w-4 h-4 dark:text-[#9aa0a6] text-[#5f6368] group-hover:text-[#8ab4f8] transition-colors shrink-0" />
              <span className="text-xs sm:text-sm dark:text-[#c4c7c5] text-[#444746] group-hover:dark:text-white group-hover:text-black transition-colors truncate">
                {item.text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
