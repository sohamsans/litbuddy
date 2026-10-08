import React, { useState } from 'react';
import { X, ExternalLink, BookOpen, AlertCircle, Award, Download, Image as ImageIcon, Sparkles, Loader2, ZoomIn, Quote } from 'lucide-react';
import { ReviewPaper, FigureMetadata, RefinedSynthesisResponse } from '../types';
import { TagBadge } from './TagBadge';
import { vaultSinglePaper, fetchRefinedSynthesis } from '../services/api';

interface PaperDetailModalProps {
  paper: ReviewPaper | null;
  onClose: () => void;
  onCitePaper?: (paper: { id: string; title: string; authors?: string[]; year?: number; doi?: string }) => void;
}

export const PaperDetailModal: React.FC<PaperDetailModalProps> = ({ paper, onClose, onCitePaper }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [refinedData, setRefinedData] = useState<RefinedSynthesisResponse | null>(null);
  const [selectedZoomFigure, setSelectedZoomFigure] = useState<FigureMetadata | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!paper) return null;

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    setActionError(null);
    try {
      const res = await vaultSinglePaper(paper);
      if (res.download_url) {
        window.open(res.download_url, '_blank');
      }
    } catch (err: any) {
      setActionError(err.message || 'Full-text retrieval failed.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleExtractFigures = async () => {
    setIsRefining(true);
    setActionError(null);
    try {
      const res = await fetchRefinedSynthesis(paper);
      setRefinedData(res);
    } catch (err: any) {
      setActionError(err.message || 'Multimodal extraction failed.');
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="dark:bg-[#1e1f20] bg-white rounded-3xl max-w-3xl w-full shadow-2xl border dark:border-[#3c4043] border-[#dadce0] overflow-hidden relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b dark:border-[#3c4043] border-slate-200 flex items-start justify-between dark:bg-[#18191a] bg-slate-50/70">
          <div className="space-y-1 pr-6">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full dark:bg-[#8ab4f8]/15 text-[#8ab4f8] border border-[#8ab4f8]/30">
                Score {paper.relevance_score}/5
              </span>
              <TagBadge type={paper.source || 'openalex'} />
              {paper.pdf_downloaded ? (
                <TagBadge type="oa_pdf" />
              ) : (
                <TagBadge type="abstract_only" />
              )}
              {paper.year && (
                <span className="text-xs dark:text-[#9aa0a6] text-[#5f6368] font-mono">
                  {paper.year}
                </span>
              )}
            </div>
            <h2 className="text-lg font-semibold dark:text-[#e3e3e3] text-[#1f1f1f] leading-snug">
              {paper.title}
            </h2>
            <p className="text-xs dark:text-[#9aa0a6] text-[#5f6368]">
              {paper.authors.length > 0 ? paper.authors.join(', ') : 'Authors not listed'}
              {paper.venue && ` • ${paper.venue}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="dark:text-[#9aa0a6] text-[#5f6368] hover:dark:text-white hover:text-black p-1.5 rounded-lg hover:dark:bg-[#282a2c] hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="px-6 py-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {actionError && (
            <div className="p-3 rounded-xl bg-[#f28b82]/10 border border-[#f28b82]/30 text-[#f28b82] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Triage Rationale */}
          <div className="dark:bg-[#282a2c] bg-blue-50/50 border dark:border-[#3c4043] border-blue-100 rounded-xl p-4">
            <h4 className="text-xs font-semibold dark:text-[#8ab4f8] text-[#1a73e8] uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              <span>Screening Rationale</span>
            </h4>
            <p className="text-xs dark:text-[#e3e3e3] text-[#1f1f1f] leading-relaxed">
              {paper.triage_rationale}
            </p>
          </div>

          {/* Core Problem & Methodology */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="dark:bg-[#18191a] bg-slate-50 p-4 rounded-xl border dark:border-[#3c4043] border-slate-200">
              <h4 className="text-xs font-semibold dark:text-[#9aa0a6] text-[#5f6368] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Problem Addressed</span>
              </h4>
              <p className="dark:text-[#c4c7c5] text-[#1f1f1f] text-xs leading-relaxed">
                {paper.core_problem}
              </p>
            </div>

            <div className="dark:bg-[#18191a] bg-slate-50 p-4 rounded-xl border dark:border-[#3c4043] border-slate-200">
              <h4 className="text-xs font-semibold dark:text-[#9aa0a6] text-[#5f6368] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                <span>Methodology & Approach</span>
              </h4>
              <p className="dark:text-[#c4c7c5] text-[#1f1f1f] text-xs leading-relaxed">
                {paper.methodology}
              </p>
            </div>
          </div>

          {/* Key Findings */}
          <div className="dark:bg-[#18191a] bg-slate-50 p-4 rounded-xl border dark:border-[#3c4043] border-slate-200">
            <h4 className="text-xs font-semibold dark:text-[#9aa0a6] text-[#5f6368] uppercase tracking-wider mb-1.5">
              Empirical & Conceptual Findings
            </h4>
            <p className="dark:text-[#c4c7c5] text-[#1f1f1f] text-xs leading-relaxed whitespace-pre-line">
              {paper.key_findings}
            </p>
          </div>

          {/* Multimodal Figures & Layout Analysis Section */}
          <div className="dark:bg-[#18191a] bg-slate-50 p-4 rounded-xl border dark:border-[#3c4043] border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold dark:text-[#8ab4f8] text-[#1a73e8] uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Multimodal Layout & Figures</span>
              </h4>
              {!refinedData && (
                <button
                  type="button"
                  onClick={handleExtractFigures}
                  disabled={isRefining}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#282a2c] hover:bg-[#3c4043] border border-[#3c4043] text-xs text-[#8ab4f8] disabled:opacity-40 transition-colors"
                >
                  {isRefining ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Parsing Layout...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-[#fdd663]" />
                      <span>Extract Diagrams & Refine</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {refinedData ? (
              <div className="space-y-3">
                {refinedData.figures && refinedData.figures.length > 0 ? (
                  <div>
                    <p className="text-[11px] text-[#9aa0a6] mb-2">
                      Extracted {refinedData.figures.length} high-resolution scientific diagrams & charts:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {refinedData.figures.map((fig) => (
                        <div
                          key={fig.id}
                          onClick={() => setSelectedZoomFigure(fig)}
                          className="group relative rounded-xl overflow-hidden border dark:border-[#3c4043] border-slate-200 bg-[#131314] cursor-pointer hover:border-[#8ab4f8] transition-all"
                        >
                          <img
                            src={fig.img_url}
                            alt={fig.caption}
                            className="w-full h-28 object-contain p-1 bg-white"
                          />
                          <div className="p-1.5 bg-[#1e1f20] text-[10px] text-[#9aa0a6] flex items-center justify-between">
                            <span>p. {fig.page}</span>
                            <ZoomIn className="w-3 h-3 opacity-0 group-hover:opacity-100 text-[#8ab4f8] transition-opacity" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#9aa0a6] italic">
                    No figures exceeding visual resolution threshold detected in this paper.
                  </p>
                )}

                {refinedData.visual_synthesis && (
                  <div className="p-3 rounded-lg bg-[#282a2c]/60 border border-[#3c4043]/60 text-xs">
                    <p className="font-semibold text-[#8ab4f8] mb-1">Visual Architecture Analysis:</p>
                    <p className="text-[#c4c7c5] leading-relaxed">{refinedData.visual_synthesis}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-[#9aa0a6] leading-relaxed">
                Parse embedded figures, graphs, and schematic architectures using PyMuPDF and analyze them visually with multimodal AI.
              </p>
            )}
          </div>

          {/* Research Gaps & Limitations */}
          <div className="dark:bg-[#18191a] bg-amber-50/50 p-4 rounded-xl border dark:border-[#3c4043] border-amber-200/60">
            <h4 className="text-xs font-semibold dark:text-[#fdd663] text-amber-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Research Gaps & Future Directions</span>
            </h4>
            <p className="dark:text-[#c4c7c5] text-amber-950 text-xs leading-relaxed">
              {paper.research_gaps}
            </p>
          </div>

          {/* Critical Remarks */}
          <div className="dark:bg-[#18191a] bg-slate-50 p-4 rounded-xl border dark:border-[#3c4043] border-slate-200">
            <h4 className="text-xs font-semibold dark:text-[#8ab4f8] text-[#1a73e8] uppercase tracking-wider mb-1.5">
              Synthesis & Literature Review Placement
            </h4>
            <p className="dark:text-[#c4c7c5] text-[#1f1f1f] text-xs leading-relaxed">
              {paper.critical_remarks}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t dark:border-[#3c4043] border-slate-200 dark:bg-[#18191a] bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs dark:text-[#9aa0a6] text-[#5f6368]">
            DOI Reference:{' '}
            <span className="font-mono dark:text-[#c4c7c5] text-[#1f1f1f]">
              {paper.doi_link || 'Direct Academic Index'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="inline-flex items-center text-xs font-medium text-[#8ab4f8] hover:text-white px-3 py-1.5 rounded-full dark:bg-[#282a2c] bg-white border dark:border-[#3c4043] border-slate-300 disabled:opacity-40 transition-colors"
              title="Download or archive PDF in LitBuddy Document Vault"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-[#8ab4f8]" />
                  <span>Fetching PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 mr-1.5 text-[#8ab4f8]" />
                  <span>Download Full-Text</span>
                </>
              )}
            </button>

            {onCitePaper && (
              <button
                type="button"
                onClick={() => {
                  onCitePaper({
                    id: paper.id,
                    title: paper.title,
                    authors: paper.authors,
                    year: paper.year,
                    doi: paper.doi_link
                  });
                  onClose();
                }}
                className="inline-flex items-center text-xs font-medium text-emerald-400 hover:text-white px-3.5 py-1.5 rounded-full dark:bg-[#282a2c] bg-white border border-emerald-500/40 hover:bg-emerald-500/20 transition-colors shadow-xs"
                title="Cite paper directly in Writing Studio"
              >
                <Quote className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                <span>Cite in Studio</span>
              </button>
            )}

            {paper.doi_link && (
              <a
                href={paper.doi_link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-xs font-medium dark:text-[#8ab4f8] text-[#1a73e8] hover:underline px-3 py-1.5 rounded-full dark:bg-[#282a2c] bg-white border dark:border-[#3c4043] border-slate-300"
              >
                <span>Open DOI</span>
                <ExternalLink className="w-3 h-3 ml-1.5" />
              </a>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-full dark:bg-white bg-[#1f1f1f] dark:text-[#131314] text-white text-xs font-medium hover:opacity-90 transition-opacity"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Image Zoom Modal */}
      {selectedZoomFigure && (
        <div
          onClick={() => setSelectedZoomFigure(null)}
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out animate-fadeIn"
        >
          <div className="max-w-4xl max-h-[90vh] bg-white p-2 rounded-2xl overflow-hidden flex flex-col items-center">
            <img
              src={selectedZoomFigure.img_url}
              alt={selectedZoomFigure.caption}
              className="max-h-[80vh] object-contain"
            />
            <p className="text-xs text-slate-800 mt-2 font-mono">{selectedZoomFigure.caption || `Figure on page ${selectedZoomFigure.page}`}</p>
          </div>
        </div>
      )}
    </div>
  );
};
