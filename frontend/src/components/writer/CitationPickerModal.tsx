import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, BookOpen, Quote, Check, Plus, ExternalLink, Download, Archive, Layers } from 'lucide-react';
import { ReviewPaper, RawPaperMetadata } from '../../types';
import { api } from '../../services/api';

interface CitationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertCitation: (citationText: string, paperInfo: { id: string; title: string; authors: string[]; year?: number; doi?: string }) => void;
  papers: ReviewPaper[];
  candidatePapers?: RawPaperMetadata[];
  mode: 'rich' | 'latex';
}

function generateCiteKey(title: string, authors: string[], year?: number): string {
  const firstAuthor = authors && authors.length > 0
    ? authors[0].replace(/[^a-zA-Z]/g, '').toLowerCase()
    : 'author';
  const y = year || new Date().getFullYear();
  const firstWord = title
    .split(/\s+/)
    .find((w) => w.length > 3 && !['with', 'from', 'that', 'this', 'using', 'towards', 'through'].includes(w.toLowerCase()))
    ?.replace(/[^a-zA-Z]/g, '')
    .toLowerCase() || 'paper';
  return `${firstAuthor}${y}${firstWord}`;
}

export const CitationPickerModal: React.FC<CitationPickerModalProps> = ({
  isOpen,
  onClose,
  onInsertCitation,
  papers,
  candidatePapers = [],
  mode
}) => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'review' | 'pool' | 'vault'>('all');
  const [citationStyle, setCitationStyle] = useState<'parenthetical' | 'inline' | 'latex'>('parenthetical');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [storedReferences, setStoredReferences] = useState<any[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);

  // Load all previously downloaded, vaulted, and pooled papers from Master Reference Vault
  useEffect(() => {
    if (isOpen) {
      setIsLoadingLibrary(true);
      api.getAllReferences()
        .then((res) => {
          if (res && res.items) {
            setStoredReferences(res.items);
          }
        })
        .catch((err) => console.warn('Could not load stored reference vault:', err))
        .finally(() => setIsLoadingLibrary(false));
    }
  }, [isOpen]);

  // Combine and deduplicate across current review, candidate pool, and entire stored library
  const combinedList = useMemo(() => {
    const map = new Map<string, any>();

    // 1. Add stored library (vaulted, previously synthesized, pooled)
    storedReferences.forEach((p) => {
      const key = (p.doi && p.doi.toLowerCase().trim()) || p.title.toLowerCase().trim();
      map.set(key, { ...p, origin: p.is_vaulted ? 'vault' : (p.is_synthesized ? 'review' : 'stored') });
    });

    // 2. Add current candidate papers
    candidatePapers.forEach((p) => {
      const key = (p.doi && p.doi.toLowerCase().trim()) || p.title.toLowerCase().trim();
      if (!map.has(key)) {
        map.set(key, { ...p, origin: 'pool' });
      }
    });

    // 3. Add active review synthesized papers (highest fidelity)
    papers.forEach((p) => {
      const key = (p.doi_link && p.doi_link.toLowerCase().trim()) || p.title.toLowerCase().trim();
      map.set(key, { ...p, origin: 'review' });
    });

    return Array.from(map.values());
  }, [storedReferences, candidatePapers, papers]);

  // Filter based on active tab & search query
  const displayList = useMemo(() => {
    let list = combinedList;

    if (activeTab === 'review') {
      list = list.filter((p) => p.origin === 'review' || p.is_synthesized);
    } else if (activeTab === 'pool') {
      list = list.filter((p) => p.origin === 'pool' || p.origin === 'stored');
    } else if (activeTab === 'vault') {
      list = list.filter((p) => p.is_vaulted || p.pdf_downloaded || p.vault_id);
    }

    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((p) => {
      const titleMatch = p.title?.toLowerCase().includes(q);
      const authorMatch = Array.isArray(p.authors) && p.authors.some((a: string) => a.toLowerCase().includes(q));
      const doiMatch = (p.doi && p.doi.toLowerCase().includes(q)) ||
                       (p.doi_link && p.doi_link.toLowerCase().includes(q));
      const venueMatch = p.venue && p.venue.toLowerCase().includes(q);
      return titleMatch || authorMatch || doiMatch || venueMatch;
    });
  }, [combinedList, activeTab, search]);

  if (!isOpen) return null;

  const handleSelectPaper = (paper: any) => {
    const authors = Array.isArray(paper.authors) ? paper.authors : [];
    const year = paper.year || new Date().getFullYear();
    const doi = paper.doi || paper.doi_link || '';
    const citeKey = generateCiteKey(paper.title, authors, year);

    let insertText = '';
    if (mode === 'latex') {
      insertText = `\\cite{${citeKey}}`;
    } else {
      const firstAuthorSurname = authors.length > 0 ? authors[0].split(' ').pop() : 'Author';
      const authorStr = authors.length === 1 ? firstAuthorSurname : `${firstAuthorSurname} et al.`;
      
      if (citationStyle === 'inline') {
        insertText = `${authorStr} (${year})`;
      } else {
        insertText = `(${authorStr}, ${year})`;
      }
    }

    onInsertCitation(insertText, {
      id: paper.id,
      title: paper.title,
      authors,
      year: paper.year,
      doi
    });

    setCopiedKey(paper.id);
    setTimeout(() => {
      onClose();
    }, 250);
  };

  const vaultedCount = combinedList.filter((p) => p.is_vaulted || p.pdf_downloaded).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-zinc-100 animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80 backdrop-blur shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-200">
              <Quote className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Insert Paper Citation</h3>
              <p className="text-xs text-zinc-400">
                {mode === 'latex'
                  ? 'Generates \\cite{key} and appends to manuscript bibliography'
                  : 'Inserts academic citation into your document text'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Tabs */}
        <div className="p-4 border-b border-zinc-800 space-y-3 bg-zinc-900/50 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search across all pooled, downloaded, and synthesized literature..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-hidden focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between text-xs flex-wrap gap-2">
            {/* Source Tab Toggle */}
            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-300'
                }`}
              >
                All Library ({combinedList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('vault')}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer flex items-center gap-1 ${
                  activeTab === 'vault'
                    ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-300'
                }`}
              >
                <Download className="w-3 h-3 text-emerald-400" />
                <span>Downloaded ({vaultedCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('review')}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                  activeTab === 'review'
                    ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-300'
                }`}
              >
                Synthesized ({papers.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pool')}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                  activeTab === 'pool'
                    ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-300'
                }`}
              >
                Candidates ({candidatePapers.length})
              </button>
            </div>

            {/* Markdown Citation Style Toggle */}
            {mode === 'rich' && (
              <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setCitationStyle('parenthetical')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                    citationStyle === 'parenthetical'
                      ? 'bg-zinc-800 text-zinc-100'
                      : 'text-zinc-400 hover:text-zinc-300'
                  }`}
                  title="Format: (Author et al., Year)"
                >
                  (Author, Year)
                </button>
                <button
                  type="button"
                  onClick={() => setCitationStyle('inline')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                    citationStyle === 'inline'
                      ? 'bg-zinc-800 text-zinc-100'
                      : 'text-zinc-400 hover:text-zinc-300'
                  }`}
                  title="Format: Author et al. (Year)"
                >
                  Author (Year)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Paper List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoadingLibrary ? (
            <div className="py-12 text-center text-zinc-500">
              <div className="w-5 h-5 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs">Loading library vault references...</p>
            </div>
          ) : displayList.length === 0 ? (
            <div className="py-12 text-center text-zinc-500">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-medium">No matching papers found in library</p>
              <p className="text-[11px] mt-1 text-zinc-600">Run a search or import references to add to your library</p>
            </div>
          ) : (
            displayList.map((p) => {
              const authors = Array.isArray(p.authors) ? p.authors : [];
              const authorsText = authors.length > 2 
                ? `${authors.slice(0, 2).join(', ')} et al.` 
                : authors.join(', ') || 'Unknown Authors';
              const citeKey = generateCiteKey(p.title, authors, p.year);
              const isDownloaded = p.is_vaulted || p.pdf_downloaded || p.vault_id;

              return (
                <div
                  key={p.id}
                  className="p-3 bg-zinc-950/60 hover:bg-zinc-800/60 border border-zinc-800 hover:border-zinc-700 rounded-lg transition group flex items-start justify-between gap-3"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <h4 className="text-xs font-medium text-zinc-200 group-hover:text-zinc-100 leading-snug line-clamp-2">
                      {p.title}
                    </h4>
                    <div className="flex items-center flex-wrap gap-2 text-[11px] text-zinc-400">
                      <span className="truncate max-w-[260px]">{authorsText}</span>
                      {p.year && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-zinc-400">{p.year}</span>
                        </>
                      )}
                      {isDownloaded && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 px-1.5 py-0.2 rounded font-medium">
                          <Check className="w-2.5 h-2.5" />
                          <span>PDF in Vault</span>
                        </span>
                      )}
                      {p.relevance_score && (
                        <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.2 rounded font-mono">
                          Score: {p.relevance_score}/5
                        </span>
                      )}
                      {mode === 'latex' && (
                        <span className="font-mono text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.2 rounded">
                          \{citeKey}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectPaper(p)}
                    className="shrink-0 px-2.5 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition flex items-center gap-1.5 border border-zinc-700/50 cursor-pointer"
                  >
                    {copiedKey === p.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Inserted</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Insert</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between text-[11px] text-zinc-500 shrink-0">
          <span>
            {mode === 'latex' ? 'Inserts \\cite{key} and updates \\begin{thebibliography}' : 'Inserts formatted in-text citation'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
