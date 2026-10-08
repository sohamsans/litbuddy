import React, { useState, useMemo } from 'react';
import { Search, Plus, X, BookOpen, FileText, Check, ExternalLink } from 'lucide-react';
import { ReviewPaper, RawPaperMetadata } from '../../types';

interface PaperPoolSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  synthesizedPapers: ReviewPaper[];
  candidatePool: RawPaperMetadata[];
  onSelectPaper: (paper: {
    id: string;
    title: string;
    subtitle?: string;
    authors?: string[];
    year?: number;
    doi?: string;
    pdf_url?: string;
    abstract?: string;
  }) => void;
}

export const PaperPoolSelectorModal: React.FC<PaperPoolSelectorModalProps> = ({
  isOpen,
  onClose,
  synthesizedPapers = [],
  candidatePool = [],
  onSelectPaper
}) => {
  const [activeTab, setActiveTab] = useState<'pool' | 'custom'>('pool');
  const [searchQuery, setSearchQuery] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customDoi, setCustomDoi] = useState('');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  // Deduplicate and combine all pool papers
  const allPoolPapers = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      authors: string[];
      year?: number;
      doi?: string;
      pdf_url?: string;
      abstract?: string;
      source: 'synthesized' | 'candidate';
    }> = [];

    const seenTitles = new Set<string>();

    synthesizedPapers.forEach((p) => {
      const key = p.title.toLowerCase().trim();
      if (!seenTitles.has(key)) {
        seenTitles.add(key);
        const anyP = p as any;
        list.push({
          id: p.id,
          title: p.title,
          authors: Array.isArray(p.authors) ? p.authors : [],
          year: p.year,
          doi: anyP.doi || p.doi_link,
          pdf_url: anyP.pdf_url,
          abstract: anyP.abstract || p.key_findings || p.core_problem || '',
          source: 'synthesized'
        });
      }
    });

    candidatePool.forEach((c) => {
      const key = c.title.toLowerCase().trim();
      if (!seenTitles.has(key)) {
        seenTitles.add(key);
        list.push({
          id: c.id,
          title: c.title,
          authors: Array.isArray(c.authors) ? c.authors : [],
          year: c.year,
          doi: c.doi,
          pdf_url: c.pdf_url,
          abstract: c.abstract || '',
          source: 'candidate'
        });
      }
    });

    return list;
  }, [synthesizedPapers, candidatePool]);

  // Filter based on search query
  const filteredPapers = useMemo(() => {
    if (!searchQuery.trim()) return allPoolPapers;
    const q = searchQuery.toLowerCase().trim();
    return allPoolPapers.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.authors.some((a) => a.toLowerCase().includes(q)) ||
        (p.abstract && p.abstract.toLowerCase().includes(q)) ||
        (p.doi && p.doi.toLowerCase().includes(q))
    );
  }, [allPoolPapers, searchQuery]);

  if (!isOpen) return null;

  const handleAddPaper = (p: any) => {
    onSelectPaper({
      id: p.id,
      title: p.title,
      subtitle: p.authors && p.authors.length > 0 ? p.authors[0] + (p.authors.length > 1 ? ' et al.' : '') : 'Researcher',
      authors: p.authors,
      year: p.year,
      doi: p.doi,
      pdf_url: p.pdf_url,
      abstract: p.abstract
    });
    setAddedIds((prev) => new Set([...prev, p.id]));
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    onSelectPaper({
      id: `custom_${Date.now()}`,
      title: customTitle.trim(),
      subtitle: customDoi ? 'DOI Lookup' : 'Custom Insertion',
      doi: customDoi.trim() || undefined,
      year: new Date().getFullYear(),
      abstract: 'Manually inserted paper into research flow map.'
    });

    setCustomTitle('');
    setCustomDoi('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl antigravity-card p-6 shadow-2xl border border-white/10 bg-[#0d0e12] space-y-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sky-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                Insert Paper from Research Pool
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  {allPoolPapers.length} Available
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                Browse candidate or synthesized literature and add directly to your flow map.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch & Search Bar */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => setActiveTab('pool')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'pool' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Research Pool ({allPoolPapers.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'custom' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              + Custom DOI / Query
            </button>
          </div>

          {activeTab === 'pool' && (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by title, author, keyword, or DOI..."
                className="w-full bg-zinc-950 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 border border-zinc-800 focus:outline-none focus:border-sky-500"
              />
            </div>
          )}
        </div>

        {/* Paper List */}
        {activeTab === 'pool' ? (
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[280px]">
            {filteredPapers.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500">
                {allPoolPapers.length === 0
                  ? 'No papers in research pool yet. Run a search in the Research tab first or add a custom paper.'
                  : 'No papers match your filter query.'}
              </div>
            ) : (
              filteredPapers.map((p) => {
                const isAdded = addedIds.has(p.id);

                return (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 transition-all flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                          {p.year || '2024'}
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                            p.source === 'synthesized'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}
                        >
                          {p.source === 'synthesized' ? 'Synthesized' : 'Candidate'}
                        </span>
                        {p.doi && (
                          <span className="text-[10px] font-mono text-zinc-500 truncate max-w-[150px]">
                            {p.doi}
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-semibold text-zinc-200 leading-snug line-clamp-2">
                        {p.title}
                      </h4>

                      <p className="text-[11px] text-zinc-400 truncate">
                        {p.authors.length > 0 ? p.authors.join(', ') : 'Unknown Authors'}
                      </p>

                      {p.abstract && (
                        <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">
                          {p.abstract}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={isAdded}
                      onClick={() => handleAddPaper(p)}
                      className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        isAdded
                          ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/30'
                          : 'bg-sky-500 hover:bg-sky-400 text-zinc-950 shadow-md'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Flow</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Custom Paper Insertion Tab */
          <form onSubmit={handleAddCustom} className="space-y-4 py-4">
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1.5">Paper Title or Query</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. Experimental Study on Artificial Supercavitation in Water Tunnel"
                className="w-full bg-zinc-950 rounded-xl px-3.5 py-2 text-xs text-zinc-200 border border-zinc-800 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1.5">DOI (Optional)</label>
              <input
                type="text"
                value={customDoi}
                onChange={(e) => setCustomDoi(e.target.value)}
                placeholder="10.1016/j.oceaneng.2023.115820"
                className="w-full bg-zinc-950 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-200 border border-zinc-800 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={!customTitle.trim()}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-semibold text-xs transition-colors disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Insert to Canvas</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
