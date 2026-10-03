import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Key, Compass, Layers, Calendar, CheckSquare, Square } from 'lucide-react';
import { SearchRequest } from '../types';

interface SearchFormProps {
  onSearch: (request: SearchRequest, mode: 'discover' | 'pipeline') => void;
  isLoading: boolean;
  showSettings: boolean;
  onToggleSettings: () => void;
  onOpenAssistant: () => void;
  initialTopic?: string;
  initialYearMin?: number;
  initialYearMax?: number;
  initialThreshold?: number;
}

const EXAMPLE_TOPICS = [
  "Ventilated supercavitation hydrodynamic drag reduction",
  "Agentic AI autonomous literature screening architectures",
  "Graph neural networks for antibiotic discovery",
  "Mechanistic interpretability in transformer attention"
];

export const SearchForm: React.FC<SearchFormProps> = ({
  onSearch,
  isLoading,
  showSettings,
  onOpenAssistant,
  initialTopic = '',
  initialYearMin,
  initialYearMax,
  initialThreshold = 4,
}) => {
  const [topic, setTopic] = useState(initialTopic);
  const [maxResults, setMaxResults] = useState(50);
  const [yearMin, setYearMin] = useState<number | undefined>(initialYearMin ?? 2021);
  const [yearMax, setYearMax] = useState<number | undefined>(initialYearMax);
  const [noYearConstraint, setNoYearConstraint] = useState(false);
  const [threshold, setThreshold] = useState(initialThreshold);
  const [groqKey, setGroqKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');

  // Sync with prop updates from AI Assistant
  useEffect(() => {
    if (initialTopic) setTopic(initialTopic);
  }, [initialTopic]);

  useEffect(() => {
    if (initialYearMin !== undefined) setYearMin(initialYearMin);
    if (initialYearMax !== undefined) setYearMax(initialYearMax);
    if (initialThreshold !== undefined) setThreshold(initialThreshold);
  }, [initialYearMin, initialYearMax, initialThreshold]);

  const handleSubmit = (mode: 'discover' | 'pipeline') => {
    if (!topic.trim() || isLoading) return;

    onSearch(
      {
        topic: topic.trim(),
        max_results: maxResults,
        year_min: noYearConstraint ? undefined : yearMin,
        year_max: noYearConstraint ? undefined : yearMax,
        no_year_constraint: noYearConstraint,
        relevance_threshold: threshold,
        groq_api_key: groqKey.trim() || undefined,
        gemini_api_key: geminiKey.trim() || undefined,
      },
      mode
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 md:p-8 mb-8">
      <div className="space-y-6">
        {/* Main Search Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="topic-input" className="block text-sm font-semibold text-slate-800">
              Research Topic or Query
            </label>
            <button
              type="button"
              onClick={onOpenAssistant}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200 transition-colors cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-emerald-600" />
              <span>AI Layman Assistant</span>
            </button>
          </div>

          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
            <input
              id="topic-input"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Ventilated supercavitation hydrodynamic drag reduction"
              required
              disabled={isLoading}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm sm:text-base transition-all"
            />
          </div>
        </div>

        {/* Quick Suggestions Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <span className="text-xs font-medium text-slate-400 flex items-center mr-1">
            Try:
          </span>
          {EXAMPLE_TOPICS.map((ex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setTopic(ex)}
              disabled={isLoading}
              className="text-xs bg-slate-100 hover:bg-slate-200/80 text-slate-600 px-2.5 py-1 rounded-full border border-slate-200/60 transition-colors cursor-pointer"
            >
              {ex}
            </button>
          ))}
        </div>

        {/* Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
          {/* Candidate Pool Size */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center">
              <Layers className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Candidate Pool Limit
            </label>
            <select
              value={maxResults}
              onChange={(e) => setMaxResults(Number(e.target.value))}
              disabled={isLoading}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-hidden"
            >
              <option value={20}>20 Papers (Fast)</option>
              <option value={50}>50 Papers (Standard Pool)</option>
              <option value={100}>100 Papers (Deep Pool)</option>
              <option value={200}>200 Papers (Extensive Search)</option>
            </select>
          </div>

          {/* Timeline Range */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-600 flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Publication Window
              </label>
              <button
                type="button"
                onClick={() => setNoYearConstraint((prev) => !prev)}
                className="flex items-center space-x-1 text-[11px] font-medium text-slate-600 hover:text-emerald-700 cursor-pointer"
              >
                {noYearConstraint ? (
                  <CheckSquare className="w-3 h-3 text-emerald-600" />
                ) : (
                  <Square className="w-3 h-3 text-slate-400" />
                )}
                <span>All Time (No Limits)</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min={1950}
                max={new Date().getFullYear()}
                value={noYearConstraint ? '' : yearMin || ''}
                onChange={(e) => setYearMin(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="From (e.g. 2021)"
                disabled={isLoading || noYearConstraint}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 disabled:bg-slate-100 disabled:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-hidden"
              />
              <input
                type="number"
                min={1950}
                max={new Date().getFullYear()}
                value={noYearConstraint ? '' : yearMax || ''}
                onChange={(e) => setYearMax(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="To (e.g. 2026)"
                disabled={isLoading || noYearConstraint}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 disabled:bg-slate-100 disabled:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          {/* Relevance Threshold */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-600">
                Min Relevance Filter
              </label>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                Score &ge; {threshold}/5
              </span>
            </div>
            <input
              type="range"
              min={2}
              max={5}
              step={1}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              disabled={isLoading}
              className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
            />
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => handleSubmit('discover')}
            disabled={isLoading || !topic.trim()}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-semibold rounded-xl shadow-xs transition-colors text-xs sm:text-sm flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Step 1: Explore Candidate Pool ({maxResults})</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubmit('pipeline')}
            disabled={isLoading || !topic.trim()}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold rounded-xl shadow-xs transition-colors text-xs sm:text-sm flex items-center justify-center space-x-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing Cloud Flow...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Direct Full Synthesis</span>
              </>
            )}
          </button>
        </div>

        {/* Collapsible API Keys Settings */}
        {showSettings && (
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 flex items-center">
                <Key className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                Runtime Cloud API Keys (100% Free Tiers)
              </span>
              <span className="text-[11px] text-slate-400">
                Optional: Uses server .env defaults if empty
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Groq API Key (Free: 30 RPM - openai/gpt-oss-20b)
                </label>
                <input
                  type="password"
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  placeholder="gsk_..."
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Gemini API Key (Free: 15 RPM - gemini-3.5-flash-lite)
                </label>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AQ... / AIzaSy..."
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
