import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';
import { PipelineStage } from '../types';

interface GeminiThinkingProps {
  stage: PipelineStage;
}

export const GeminiThinking: React.FC<GeminiThinkingProps> = ({ stage }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let timer: any;
    if (stage === 'discovering' || stage === 'triaging' || stage === 'extracting') {
      setElapsed(0);
      timer = setInterval(() => {
        setElapsed((prev) => +(prev + 0.1).toFixed(1));
      }, 100);
    }
    return () => clearInterval(timer);
  }, [stage]);

  if (stage === 'idle') return null;

  const isRunning = stage === 'discovering' || stage === 'triaging' || stage === 'extracting';

  const getStageDescription = () => {
    switch (stage) {
      case 'discovering':
        return 'Searching OpenAlex, Crossref, Europe PMC, and arXiv...';
      case 'triaging':
        return 'Evaluating relevance scores across candidate papers...';
      case 'extracting':
        return 'Retrieving open-access PDFs and synthesizing methodology...';
      case 'completed':
        return `Thought for ${elapsed > 0 ? elapsed : '3.8'} seconds`;
      default:
        return 'Analyzing academic query...';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-6 animate-fadeIn">
      {/* Header Pill */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full dark:bg-[#1e1f20] bg-slate-100 hover:dark:bg-[#282a2c] hover:bg-slate-200 border dark:border-[#3c4043] border-slate-300 transition-all text-xs font-medium dark:text-[#c4c7c5] text-[#444746]"
      >
        {isRunning ? (
          <span className="w-2 h-2 rounded-full bg-[#8ab4f8] animate-ping" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-[#81c995]" />
        )}

        <span className={isRunning ? 'animate-pulse font-medium text-[#8ab4f8]' : ''}>
          {getStageDescription()}
        </span>

        {isExpanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-[#9aa0a6]" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-[#9aa0a6]" />
        )}
      </button>

      {/* Expanded Step Log */}
      {isExpanded && (
        <div className="mt-2.5 ml-3 pl-3 border-l-2 dark:border-[#3c4043] border-slate-300 py-1 space-y-2 text-xs dark:text-[#9aa0a6] text-[#5f6368] animate-fadeIn">
          <div className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-[#81c995]" />
            <span>Academic discovery across OpenAlex, Europe PMC, Crossref, and arXiv</span>
          </div>

          {(stage === 'triaging' || stage === 'extracting' || stage === 'completed') && (
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[#81c995]" />
              <span>Lean batch abstract triage for relevance scoring (1–5)</span>
            </div>
          )}

          {(stage === 'extracting' || stage === 'completed') && (
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[#81c995]" />
              <span>PyMuPDF text slicing and deep section synthesis</span>
            </div>
          )}

          {stage === 'completed' && (
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[#81c995]" />
              <span>Synthesis matrix ready and cached in local database</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
