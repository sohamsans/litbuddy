import React, { useState, useMemo } from 'react';
import { RawPaperMetadata } from '../types';
import { CheckSquare, Square, ExternalLink, Search, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { TagBadge } from './TagBadge';

interface CandidatePreviewTableProps {
  papers: RawPaperMetadata[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onProceedToSynthesis: () => void;
  onBulkDownload?: (papers: RawPaperMetadata[]) => void;
  isProcessing: boolean;
}

export const CandidatePreviewTable: React.FC<CandidatePreviewTableProps> = ({
  papers,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onProceedToSynthesis,
  onBulkDownload,
  isProcessing,
}) => {
  const [filterText, setFilterText] = useState('');
  const [expandedAbstracts, setExpandedAbstracts] = useState<Set<string>>(new Set());
  const [isZipping, setIsZipping] = useState(false);

  const toggleAbstract = (id: string) => {
    setExpandedAbstracts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredPapers = useMemo(() => {
    if (!filterText.trim()) return papers;
    const q = filterText.toLowerCase();
    return papers.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.authors.some((a) => a.toLowerCase().includes(q)) ||
        (p.venue && p.venue.toLowerCase().includes(q)) ||
        p.abstract.toLowerCase().includes(q)
    );
  }, [papers, filterText]);

  const allSelected = papers.length > 0 && selectedIds.size === papers.length;

  const handleDownloadZip = async () => {
    if (!onBulkDownload) return;
    const selectedList = papers.filter((p) => selectedIds.has(p.id));
    if (selectedList.length === 0) return;

    setIsZipping(true);
    try {
      await onBulkDownload(selectedList);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="rounded-2xl dark:bg-[#1e1f20] bg-white border dark:border-[#3c4043] border-[#dadce0] shadow-md overflow-hidden mb-8 transition-all">
      {/* Control Bar */}
      <div className="p-4 sm:px-5 sm:py-3.5 dark:bg-[#18191a] bg-[#f8fafd] border-b dark:border-[#3c4043] border-[#dadce0] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button
            onClick={allSelected ? onDeselectAll : onSelectAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full dark:bg-[#282a2c] bg-white border dark:border-[#3c4043] border-slate-300 dark:text-[#e3e3e3] text-[#1f1f1f] text-xs font-medium transition-colors"
          >
            {allSelected ? (
              <CheckSquare className="w-3.5 h-3.5 text-[#8ab4f8]" />
            ) : (
              <Square className="w-3.5 h-3.5 text-[#9aa0a6]" />
            )}
            <span>{allSelected ? 'Deselect all' : `Select all (${papers.length})`}</span>
          </button>

          <span className="text-xs dark:text-[#9aa0a6] text-[#5f6368]">
            <strong className="dark:text-[#e3e3e3] text-[#1f1f1f]">{selectedIds.size}</strong> of {papers.length} selected
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#9aa0a6] pointer-events-none" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter candidates..."
              className="w-full pl-8 pr-3 py-1.5 rounded-full dark:bg-[#131314] bg-white border dark:border-[#3c4043] border-slate-300 text-xs dark:text-[#e3e3e3] text-[#1f1f1f] placeholder-[#9aa0a6] focus:outline-none focus:border-[#8ab4f8]"
            />
          </div>

          {onBulkDownload && (
            <button
              type="button"
              onClick={handleDownloadZip}
              disabled={selectedIds.size === 0 || isZipping}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#282a2c] hover:bg-[#3c4043] border border-[#3c4043] text-xs font-medium text-[#8ab4f8] disabled:opacity-40 transition-all shrink-0 cursor-pointer"
              title="Download all selected papers as a single .zip archive"
            >
              {isZipping ? (
                <>
                  <div className="w-3 h-3 border-2 border-[#8ab4f8]/30 border-t-[#8ab4f8] rounded-full animate-spin" />
                  <span>Zipping...</span>
                </>
              ) : (
                <>
                  <span>Download ZIP ({selectedIds.size})</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={onProceedToSynthesis}
            disabled={selectedIds.size === 0 || isProcessing}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#8ab4f8] hover:bg-[#a8c7fa] disabled:opacity-40 text-[#131314] text-xs font-semibold shadow-xs transition-all shrink-0 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-[#131314]/30 border-t-[#131314] rounded-full animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <span>Synthesize selected ({selectedIds.size})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Papers List */}
      <div className="divide-y dark:divide-[#282a2c] divide-slate-100 max-h-[550px] overflow-y-auto">
        {filteredPapers.length === 0 ? (
          <div className="p-8 text-center text-xs dark:text-[#9aa0a6] text-[#5f6368]">
            No papers match your filter criteria.
          </div>
        ) : (
          filteredPapers.map((paper, idx) => {
            const isSelected = selectedIds.has(paper.id);
            const isAbstractExpanded = expandedAbstracts.has(paper.id);

            return (
              <div
                key={paper.id}
                className={`p-4 transition-colors flex items-start gap-3.5 ${
                  isSelected ? 'dark:bg-[#8ab4f8]/5 bg-blue-50/40' : 'hover:dark:bg-[#282a2c]/50 hover:bg-slate-50'
                }`}
              >
                {/* Checkbox */}
                <button
                  type="button"
                  onClick={() => onToggleSelect(paper.id)}
                  className="mt-0.5 dark:text-[#9aa0a6] text-[#5f6368] hover:text-[#8ab4f8] cursor-pointer shrink-0"
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-[#8ab4f8]" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-mono dark:text-[#5f6368] text-[#9aa0a6]">#{idx + 1}</span>
                    <TagBadge type={paper.source} />
                    {paper.is_oa && <TagBadge type="oa_pdf" />}
                    {paper.year && (
                      <span className="text-[11px] dark:text-[#9aa0a6] text-[#5f6368]">
                        {paper.year}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-medium dark:text-[#e3e3e3] text-[#1f1f1f] leading-snug hover:text-[#8ab4f8] transition-colors">
                    {paper.doi ? (
                      <a
                        href={`https://doi.org/${paper.doi}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 hover:underline"
                      >
                        <span>{paper.title}</span>
                        <ExternalLink className="w-3 h-3 text-[#9aa0a6] shrink-0 inline" />
                      </a>
                    ) : (
                      paper.title
                    )}
                  </h3>

                  <p className="text-xs dark:text-[#9aa0a6] text-[#5f6368] mt-1 line-clamp-1">
                    {paper.authors.length > 0 ? paper.authors.join(', ') : 'Authors not specified'}
                    {paper.venue && ` • ${paper.venue}`}
                  </p>

                  {/* Abstract Accordion */}
                  {paper.abstract && (
                    <div className="mt-2 text-xs">
                      <p
                        className={`dark:text-[#c4c7c5] text-[#444746] leading-relaxed ${
                          isAbstractExpanded ? '' : 'line-clamp-2'
                        }`}
                      >
                        {paper.abstract}
                      </p>
                      <button
                        type="button"
                        onClick={() => toggleAbstract(paper.id)}
                        className="mt-1 text-[11px] text-[#8ab4f8] hover:underline font-medium inline-flex items-center gap-0.5 cursor-pointer"
                      >
                        {isAbstractExpanded ? (
                          <>
                            <span>Show less</span>
                            <ChevronUp className="w-3 h-3" />
                          </>
                        ) : (
                          <>
                            <span>Read abstract</span>
                            <ChevronDown className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
