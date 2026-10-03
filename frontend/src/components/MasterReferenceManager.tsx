import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  Search,
  Filter,
  Download,
  Copy,
  Check,
  FileText,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Layers,
  Archive,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import { api } from '../services/api';

interface ReferenceItem {
  id: string;
  title: string;
  authors: string[];
  year: number | null;
  venue: string;
  doi: string | null;
  doi_link: string;
  pdf_url: string;
  pdf_downloaded: boolean;
  is_vaulted: boolean;
  vault_id: string | null;
  file_size_bytes: number;
  source: string;
  is_synthesized: boolean;
  relevance_score: number;
  core_problem: string;
  methodology: string;
  key_findings: string;
  research_gaps: string;
  abstract: string;
  has_figures: boolean;
  created_at: string | null;
}

interface MasterReferenceManagerProps {
  onOpenPdf: (vaultId: string, title: string) => void;
  onChatAboutPaper: (paper: any) => void;
}

type CitationFormat = 'bibtex' | 'apa' | 'mla' | 'chicago' | 'ieee' | 'ris';

export const MasterReferenceManager: React.FC<MasterReferenceManagerProps> = ({
  onOpenPdf,
  onChatAboutPaper
}) => {
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [total, setTotal] = useState(0);
  const [vaultedCount, setVaultedCount] = useState(0);
  const [synthesizedCount, setSynthesizedCount] = useState(0);
  const [search, setSearch] = useState('');
  const [onlyVaulted, setOnlyVaulted] = useState(false);
  const [onlySynthesized, setOnlySynthesized] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<CitationFormat>('bibtex');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPaperIds, setSelectedPaperIds] = useState<Set<string>>(new Set());

  const fetchReferences = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAllReferences({
        search: search || undefined,
        only_vaulted: onlyVaulted || undefined,
        only_synthesized: onlySynthesized || undefined
      });
      setReferences(data.items || []);
      setTotal(data.total || 0);
      setVaultedCount(data.vaulted_count || 0);
      setSynthesizedCount(data.synthesized_count || 0);
    } catch (e) {
      console.error('Failed to load references:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReferences();
  }, [search, onlyVaulted, onlySynthesized]);

  const generateCitation = (p: ReferenceItem, format: CitationFormat): string => {
    const authorLead = p.authors.length > 0 ? p.authors[0] : 'Unknown';
    const authorsAll = p.authors.join(', ') || 'Unknown Authors';
    const year = p.year || 'n.d.';
    const title = p.title || 'Untitled';
    const venue = p.venue ? ` ${p.venue}.` : '';
    const doiPart = p.doi ? ` https://doi.org/${p.doi}` : '';

    switch (format) {
      case 'apa':
        return `${authorsAll} (${year}). ${title}.${venue}${doiPart}`;
      case 'mla':
        return `${authorsAll}. "${title}."${venue ? ` ${venue},` : ''} ${year}.${doiPart}`;
      case 'chicago':
        return `${authorsAll}. "${title}."${venue ? ` ${venue}` : ''} (${year}).${doiPart}`;
      case 'ieee':
        return `${authorsAll}, "${title},"${venue ? ` in ${venue},` : ''} ${year}.${doiPart}`;
      case 'ris':
        return `TY  - JOUR\nTI  - ${title}\nAU  - ${authorLead}\nPY  - ${year}\n${p.venue ? `JO  - ${p.venue}\n` : ''}${p.doi ? `DO  - ${p.doi}\n` : ''}ER  -`;
      case 'bibtex':
      default:
        const citeKey = `${(authorLead.split(' ').pop() || 'paper').toLowerCase()}${year}`;
        return `@article{${citeKey},\n  title={${title}},\n  author={${p.authors.join(' and ')}},\n  year={${year}}${p.venue ? `,\n  journal={${p.venue}}` : ''}${p.doi ? `,\n  doi={${p.doi}}` : ''}\n}`;
    }
  };

  const handleCopyCitation = (paper: ReferenceItem) => {
    const text = generateCitation(paper, selectedFormat);
    navigator.clipboard.writeText(text);
    setCopiedId(paper.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleExportAll = async (fmt: 'bibtex' | 'ris') => {
    const ids = selectedPaperIds.size > 0 ? Array.from(selectedPaperIds) : undefined;
    await api.exportReferences(fmt, ids);
  };

  const toggleSelectAll = () => {
    if (selectedPaperIds.size === references.length) {
      setSelectedPaperIds(new Set());
    } else {
      setSelectedPaperIds(new Set(references.map((r) => r.id)));
    }
  };

  const toggleSelectPaper = (id: string) => {
    const next = new Set(selectedPaperIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedPaperIds(next);
  };

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 py-6 flex flex-col space-y-6 overflow-y-auto animate-fade-in">
      {/* Header & Stats Banner */}
      <div className="bg-[#1e1f20] border border-[#3c4043] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#c084fc]/10 text-[#c084fc] rounded-2xl border border-[#c084fc]/20">
              <Bookmark className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#e3e3e3]">Master Reference Manager</h1>
              <p className="text-xs text-[#9aa0a6]">
                Global academic repository & multi-format citation generator
              </p>
            </div>
          </div>
        </div>

        {/* Counts & Global Export Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2 bg-[#131314] border border-[#3c4043] rounded-2xl text-center">
            <div className="text-lg font-bold text-[#e3e3e3]">{total}</div>
            <div className="text-[10px] text-[#9aa0a6] uppercase tracking-wider font-semibold">Total Papers</div>
          </div>

          <div className="px-4 py-2 bg-[#131314] border border-[#3c4043] rounded-2xl text-center">
            <div className="text-lg font-bold text-[#8ab4f8]">{vaultedCount}</div>
            <div className="text-[10px] text-[#9aa0a6] uppercase tracking-wider font-semibold">Vaulted PDFs</div>
          </div>

          <div className="px-4 py-2 bg-[#131314] border border-[#3c4043] rounded-2xl text-center">
            <div className="text-lg font-bold text-[#34d399]">{synthesizedCount}</div>
            <div className="text-[10px] text-[#9aa0a6] uppercase tracking-wider font-semibold">Synthesized</div>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-[#131314] border border-[#3c4043] rounded-2xl">
            <button
              onClick={() => handleExportAll('bibtex')}
              className="px-3 py-2 text-xs font-semibold text-[#8ab4f8] hover:bg-[#282a2c] rounded-xl transition-colors"
              title="Download entire library as .bib file"
            >
              Export .BIB
            </button>
            <button
              onClick={() => handleExportAll('ris')}
              className="px-3 py-2 text-xs font-semibold text-[#c084fc] hover:bg-[#282a2c] rounded-xl transition-colors"
              title="Download entire library as .ris file (EndNote, Zotero)"
            >
              Export .RIS
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar: Search, Filters, Citation Style Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#1e1f20] border border-[#3c4043] rounded-2xl p-4 shadow-md">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9aa0a6]" />
            <input
              type="text"
              placeholder="Search by title, author, or journal across all gathered literature..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#131314] border border-[#3c4043] rounded-xl text-xs text-[#e3e3e3] placeholder-[#5f6368] focus:outline-none focus:border-[#8ab4f8] transition-colors"
            />
          </div>

          {/* Filters */}
          <button
            onClick={() => setOnlyVaulted(!onlyVaulted)}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              onlyVaulted
                ? 'bg-[#8ab4f8]/15 border-[#8ab4f8] text-[#8ab4f8]'
                : 'bg-[#131314] border-[#3c4043] text-[#9aa0a6] hover:text-[#e3e3e3]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Vaulted PDFs Only</span>
          </button>

          <button
            onClick={() => setOnlySynthesized(!onlySynthesized)}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              onlySynthesized
                ? 'bg-[#34d399]/15 border-[#34d399] text-[#34d399]'
                : 'bg-[#131314] border-[#3c4043] text-[#9aa0a6] hover:text-[#e3e3e3]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Synthesized Only</span>
          </button>
        </div>

        {/* Citation Format Switcher */}
        <div className="flex items-center gap-1 bg-[#131314] border border-[#3c4043] rounded-xl p-1">
          {(['bibtex', 'apa', 'mla', 'chicago', 'ieee', 'ris'] as CitationFormat[]).map((fmt) => (
            <button
              key={fmt}
              onClick={() => setSelectedFormat(fmt)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg uppercase tracking-wider transition-colors ${
                selectedFormat === fmt
                  ? 'bg-[#8ab4f8] text-[#131314]'
                  : 'text-[#9aa0a6] hover:text-[#e3e3e3]'
              }`}
            >
              {fmt}
            </button>
          ))}
        </div>
      </div>

      {/* References Paper Cards */}
      <div className="bg-[#1e1f20] border border-[#3c4043] rounded-3xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-[#8ab4f8] animate-spin mx-auto" />
            <p className="text-xs text-[#9aa0a6]">Loading reference repository...</p>
          </div>
        ) : references.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-[#5f6368] mx-auto" />
            <p className="text-sm font-medium text-[#e3e3e3]">No references found</p>
            <p className="text-xs text-[#9aa0a6] max-w-sm mx-auto">
              Run a literature search in the Research &amp; Chat tab to start pooling papers into your master library.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#3c4043]">
            {references.map((paper, idx) => (
              <div
                key={paper.id || idx}
                className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-5 hover:bg-[#282a2c]/40 transition-colors"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono text-[#8ab4f8] font-semibold">[{idx + 1}]</span>
                    {paper.is_vaulted && (
                      <span className="px-2 py-0.5 bg-[#8ab4f8]/10 text-[#8ab4f8] border border-[#8ab4f8]/20 rounded-md text-[10px] font-medium">
                        Vaulted PDF
                      </span>
                    )}
                    {paper.is_synthesized && (
                      <span className="px-2 py-0.5 bg-[#34d399]/10 text-[#34d399] border border-[#34d399]/20 rounded-md text-[10px] font-medium">
                        Synthesized
                      </span>
                    )}
                    {paper.year && (
                      <span className="text-xs text-[#9aa0a6]">{paper.year}</span>
                    )}
                    {paper.venue && (
                      <span className="text-xs text-[#5f6368] truncate max-w-xs">• {paper.venue}</span>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-[#e3e3e3] leading-snug">
                    {paper.title}
                  </h3>

                  <p className="text-xs text-[#9aa0a6] line-clamp-1">
                    {paper.authors.length > 0 ? paper.authors.join(', ') : 'Unknown Authors'}
                  </p>

                  {/* Core Problem or Abstract excerpt */}
                  {paper.core_problem ? (
                    <p className="text-xs text-[#c4c7c5] line-clamp-2 pt-1 bg-[#131314]/50 p-2.5 rounded-xl border border-[#3c4043]/50">
                      <span className="text-[#8ab4f8] font-medium">Core Problem: </span>
                      {paper.core_problem}
                    </p>
                  ) : paper.abstract ? (
                    <p className="text-xs text-[#9aa0a6] line-clamp-2 pt-1">
                      {paper.abstract}
                    </p>
                  ) : null}

                  {paper.doi && (
                    <div className="pt-1">
                      <a
                        href={paper.doi_link || `https://doi.org/${paper.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-[#8ab4f8] hover:underline font-mono"
                      >
                        <span>doi:{paper.doi}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-start">
                  <button
                    onClick={() => handleCopyCitation(paper)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#282a2c] hover:bg-[#3c4043] border border-[#3c4043] text-[#e3e3e3] rounded-xl text-xs font-medium transition-colors"
                    title={`Copy in ${selectedFormat.toUpperCase()} format`}
                  >
                    {copiedId === paper.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#34d399]" />
                        <span className="text-[#34d399]">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#8ab4f8]" />
                        <span>Copy {selectedFormat.toUpperCase()}</span>
                      </>
                    )}
                  </button>

                  {paper.is_vaulted && paper.vault_id && (
                    <button
                      onClick={() => onOpenPdf(paper.vault_id!, paper.title)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#8ab4f8]/10 hover:bg-[#8ab4f8]/20 border border-[#8ab4f8]/30 text-[#8ab4f8] rounded-xl text-xs font-medium transition-colors"
                      title="Read PDF in-app viewer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Read PDF</span>
                    </button>
                  )}

                  <button
                    onClick={() => onChatAboutPaper(paper)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#c084fc]/10 hover:bg-[#c084fc]/20 border border-[#c084fc]/30 text-[#c084fc] rounded-xl text-xs font-medium transition-colors"
                    title="Jump to grounded chat focusing on this paper"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Ask AI</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
