import React from 'react';
import { Search, Filter, FileText, CheckCircle2, Zap } from 'lucide-react';
import { PipelineStage } from '../types';

interface PipelineProgressProps {
  stage: PipelineStage;
}

const STAGES = [
  { key: 'discovering', label: '1. Discovery', desc: 'OpenAlex, Crossref, Europe PMC, arXiv, S2', icon: Search },
  { key: 'triaging', label: '2. Batch Triage', desc: 'Lean Stage 1 LLM evaluation', icon: Filter },
  { key: 'extracting', label: '3. Deep Extraction', desc: 'PyMuPDF slicing & Universal LLM synthesis', icon: FileText },
  { key: 'completed', label: '4. Synthesized', desc: 'Dual-Layer cache stored', icon: CheckCircle2 },
];

export const PipelineProgress: React.FC<PipelineProgressProps> = ({ stage }) => {
  if (stage === 'idle') return null;

  const getStageIndex = (s: PipelineStage): number => {
    switch (s) {
      case 'discovering': return 0;
      case 'triaging': return 1;
      case 'extracting': return 2;
      case 'completed': return 3;
      default: return 0;
    }
  };

  const currentIndex = getStageIndex(stage);

  return (
    <div className="glass-panel dark:bg-[#0c121e]/90 bg-white rounded-2xl border dark:border-white/10 border-slate-200 p-6 mb-8 shadow-xl transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Autonomous Pipeline Execution
          </h3>
        </div>
        <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 animate-pulse">
          {stage === 'completed' ? 'Synthesis Finished' : 'Processing Cloud Pipeline...'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {STAGES.map((s, index) => {
          const Icon = s.icon;
          const isDone = currentIndex > index || stage === 'completed';
          const isCurrent = currentIndex === index && stage !== 'completed';

          return (
            <div
              key={s.key}
              className={`p-3.5 rounded-xl border transition-all ${
                isCurrent
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-sm ring-1 ring-emerald-500/30'
                  : isDone
                  ? 'dark:border-white/10 border-slate-200 dark:bg-black/20 bg-slate-50 text-slate-300'
                  : 'dark:border-white/5 border-slate-100 dark:bg-black/10 bg-white text-slate-500 opacity-60'
              }`}
            >
              <div className="flex items-center space-x-2.5 mb-1">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    isCurrent
                      ? 'bg-emerald-500 text-white animate-bounce shadow-md shadow-emerald-500/30'
                      : isDone
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'dark:bg-white/5 bg-slate-100 text-slate-500'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className={`text-xs font-semibold ${isCurrent ? 'text-emerald-400' : 'text-slate-200'}`}>
                  {s.label}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 pl-9">
                {s.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
