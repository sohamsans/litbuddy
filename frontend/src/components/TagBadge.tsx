import React, { useState } from 'react';

export type TagType = 'openalex' | 'crossref' | 'europe_pmc' | 'arxiv' | 'semantic_scholar' | 'oa_pdf' | 'abstract_only';

interface TagBadgeProps {
  type: TagType | string;
  className?: string;
}

const TAG_DEFINITIONS: Record<string, { label: string; explanation: string; darkClass: string; lightClass: string }> = {
  openalex: {
    label: 'OpenAlex',
    explanation: 'Global scholarly index cataloging 250M+ academic works, authors, and citations across all scientific disciplines.',
    darkClass: 'bg-[#1a73e8]/15 text-[#8ab4f8] border-[#1a73e8]/30',
    lightClass: 'bg-[#e8f0fe] text-[#1a73e8] border-[#d2e3fc]'
  },
  crossref: {
    label: 'Crossref',
    explanation: 'Official Digital Object Identifier (DOI) registration agency linking published journal articles and citations.',
    darkClass: 'bg-[#9b72cb]/15 text-[#c58af9] border-[#9b72cb]/30',
    lightClass: 'bg-[#f3e8fd] text-[#9334e6] border-[#e9d5ff]'
  },
  europe_pmc: {
    label: 'Europe PMC',
    explanation: 'Open access biomedical research database indexing over 40M abstracts and life sciences literature.',
    darkClass: 'bg-[#34a853]/15 text-[#81c995] border-[#34a853]/30',
    lightClass: 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]'
  },
  arxiv: {
    label: 'arXiv',
    explanation: 'Open-access preprint repository for 2.4M+ research papers in computer science, physics, and mathematics.',
    darkClass: 'bg-[#ea4335]/15 text-[#f28b82] border-[#ea4335]/30',
    lightClass: 'bg-[#fce8e6] text-[#c5221f] border-[#fad2cf]'
  },
  semantic_scholar: {
    label: 'Semantic Scholar',
    explanation: 'AI-driven scientific literature graph providing contextual citations and influential paper tracking.',
    darkClass: 'bg-[#0284c7]/15 text-[#38bdf8] border-[#0284c7]/30',
    lightClass: 'bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]'
  },
  oa_pdf: {
    label: 'OA Sliced',
    explanation: 'Verified open-access full-text PDF downloaded and sliced. Methodology and conclusions extracted directly from paper text.',
    darkClass: 'bg-[#34a853]/15 text-[#81c995] border-[#34a853]/30',
    lightClass: 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]'
  },
  abstract_only: {
    label: 'Abstract Only',
    explanation: 'Synthesized from peer-reviewed abstract. Full-text PDF was behind publisher paywall or closed access.',
    darkClass: 'bg-white/5 text-[#9aa0a6] border-white/10',
    lightClass: 'bg-slate-100 text-[#5f6368] border-slate-200'
  }
};

export const TagBadge: React.FC<TagBadgeProps> = ({ type, className = '' }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const normalizedKey = type.toLowerCase().replace(/[- ]/g, '_');
  const tagInfo = TAG_DEFINITIONS[normalizedKey] || {
    label: type,
    explanation: 'Academic publication metadata reference.',
    darkClass: 'bg-white/5 text-[#9aa0a6] border-white/10',
    lightClass: 'bg-slate-100 text-[#5f6368] border-slate-200'
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span
        className={`text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded border transition-colors cursor-help ${tagInfo.darkClass} ${tagInfo.lightClass} ${className}`}
      >
        {tagInfo.label}
      </span>

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-56 p-2 rounded-lg bg-[#282a2c] text-[#e3e3e3] text-[11px] leading-tight shadow-xl border border-[#3c4043] z-50 pointer-events-none animate-fadeIn">
          <p className="font-semibold text-white mb-0.5">{tagInfo.label}</p>
          <p className="text-[#9aa0a6] font-normal">{tagInfo.explanation}</p>
        </div>
      )}
    </div>
  );
};
