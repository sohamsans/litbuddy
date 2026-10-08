import React, { useState } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Search,
  Layers,
  MessageSquare,
  Bookmark,
  Download,
  KeyRound,
  CheckCircle2,
  HeartHandshake
} from 'lucide-react';

interface OnboardingTourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TourStep {
  title: string;
  badge: string;
  icon: React.ReactNode;
  description: string;
  bullets: string[];
  color: string;
}

export const OnboardingTourModal: React.FC<OnboardingTourModalProps> = ({
  isOpen,
  onClose
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps: TourStep[] = [
    {
      title: "Researcher's Manifesto: Forever Free & Private",
      badge: 'Our Promise to You',
      icon: <HeartHandshake className="w-8 h-8 text-rose-400" />,
      color: 'from-rose-500/20 via-pink-500/10 to-amber-500/20',
      description:
        'This project will forever remain 100% free. I am a fellow researcher and I understand the frustrations of going through tons of literature review and doing tedious tasks again and again. This app is not here to make money, not here to become famous.',
      bullets: [
        'Dedicated to Research Flow: Built to make research a fun and easy process where we can spend more time on breakthrough methodologies and less on tedious screening.',
        'Feedback & Issues Forum on GitHub: If you encounter any bugs, please report them on our GitHub Issues page (github.com/sohamsans/litbuddy/issues) with screenshots so we can quickly patch them in the next beta build.',
        'Strictly Offline & Privacy-First: The app operates locally on your device. Your notes, manuscripts, and vaulted papers belong solely to you and will never be shared.'
      ]
    },
    {
      title: 'Welcome to LitBuddy',
      badge: 'Overview',
      icon: <Sparkles className="w-8 h-8 text-[#8ab4f8]" />,
      color: 'from-blue-500/20 to-indigo-500/20',
      description:
        'LitBuddy is an autonomous academic literature review engine and document vault designed to accelerate scientific discovery from days to seconds.',
      bullets: [
        'Query 200M+ research papers across OpenAlex, arXiv, DOAJ, Europe PMC, and Crossref without paywalls.',
        '0ms local caching replay: discovered papers and syntheses are cached permanently in your private SQLite database.',
        '100% free cloud AI: seamlessly connects to Groq and Gemini with zero credit card required.'
      ]
    },
    {
      title: 'Academic Discovery & Triage',
      badge: 'Step 1: Search & Screen',
      icon: <Search className="w-8 h-8 text-[#c084fc]" />,
      color: 'from-purple-500/20 to-pink-500/20',
      description:
        'Enter any research question or rough draft idea into the unified search capsule.',
      bullets: [
        'Stage 1 Batch Triage: AI screens candidate abstracts in parallel and assigns a 1-5 relevance score with concise scientific rationale.',
        'Timeline Controls: Filter publication years (e.g. 2021-2026) or switch to All-Time for foundational classics.',
        'Candidate Pool: Inspect all gathered papers before triggering full extraction.'
      ]
    },
    {
      title: 'Structured Review Matrix',
      badge: 'Step 2: Deep Extraction',
      icon: <Layers className="w-8 h-8 text-[#34d399]" />,
      color: 'from-emerald-500/20 to-teal-500/20',
      description:
        'Deep multimodal extraction breaks down each paper into rigorous, standardized literature columns.',
      bullets: [
        'Core Problem & Thesis: 1-2 sentence clarification of what each paper solves.',
        'Empirical Methodology & Key Findings: Statistical benchmarks, experimental datasets, and theoretical proofs.',
        'Research Gaps & Future Work: Explicit limitations and unaddressed boundaries.',
        'Export to Excel / CSV / BibTeX with 1 click for papers, grants, and theses.'
      ]
    },
    {
      title: 'Grounded Conversational AI & Math',
      badge: 'Step 3: Talk to Literature',
      icon: <MessageSquare className="w-8 h-8 text-[#fbbf24]" />,
      color: 'from-amber-500/20 to-orange-500/20',
      description:
        'Chat naturally like Gemini or ChatGPT, fully grounded in your synthesized papers and vaulted PDFs.',
      bullets: [
        'Deep Explanations: Ask "Explain paper 2 to me" or "Compare the loss functions in papers 1 and 3".',
        'LaTeX Math Compilation: Formulas, variables, and loss functions are compiled in real-time with KaTeX ($E = mc^2$, $\\mathcal{L}$).',
        'Direct Bracketed Citations: Click [1] or [2] to highlight the exact cited paper in the Sources sidebar.'
      ]
    },
    {
      title: 'Master Reference Manager & Vault',
      badge: 'Step 4: Citations & Downloads',
      icon: <Bookmark className="w-8 h-8 text-[#60a5fa]" />,
      color: 'from-sky-500/20 to-blue-500/20',
      description:
        'A permanent library outside of chat to manage every paper ever pooled, synthesized, or vaulted.',
      bullets: [
        '1-Click Citations: Copy formatted citations in BibTeX, APA 7th, MLA 9th, Chicago, IEEE, or RIS.',
        'High-Yield PDF Scraper: Resolves full text via arXiv, DOAJ, Crossref text-mining, Internet Archive, and Sci-Hub mirrors.',
        'Downloads Manager: Inspect file sizes, open PDFs in-app, or reveal files in Windows Explorer.'
      ]
    },
    {
      title: 'BYOK & Smart Model Switching',
      badge: 'Step 5: Infinite Resilience',
      icon: <KeyRound className="w-8 h-8 text-[#f472b6]" />,
      color: 'from-pink-500/20 to-rose-500/20',
      description:
        'Bring Your Own Key (BYOK) with automated failover ensures your research never stops.',
      bullets: [
        '100% Free Keys: Groq (14.4k req/day free) and Google Gemini (1,500 req/day free) take 30 seconds to generate.',
        'Smart Auto-Failover: If Groq hits a daily rate limit, LitBuddy automatically cascades to Gemini without losing context.',
        'Zero-Knowledge Security: Your API keys are encrypted with AES-256 Fernet locally and never transmitted to any third party.'
      ]
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem('litbuddy_tour_completed', 'true');
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#1e1f20] border border-[#3c4043] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Gradient Banner */}
        <div className={`p-6 bg-gradient-to-r ${step.color} border-b border-[#3c4043] flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#131314]/80 backdrop-blur-sm rounded-2xl border border-[#3c4043]">
              {step.icon}
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 mb-1 text-[11px] font-semibold text-[#8ab4f8] bg-[#8ab4f8]/10 rounded-full border border-[#8ab4f8]/20">
                {step.badge}
              </span>
              <h2 className="text-xl font-bold text-[#e3e3e3]">{step.title}</h2>
            </div>
          </div>

          <button
            onClick={() => {
              localStorage.setItem('litbuddy_tour_completed', 'true');
              onClose();
            }}
            className="p-1.5 text-[#9aa0a6] hover:text-[#e3e3e3] hover:bg-[#282a2c] rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 flex-1 space-y-5">
          <p className="text-sm text-[#c4c7c5] leading-relaxed">
            {step.description}
          </p>

          <div className="space-y-3 pt-2">
            {step.bullets.map((bullet, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-[#131314]/60 border border-[#3c4043]/60 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-[#8ab4f8] flex-shrink-0 mt-0.5" />
                <span className="text-xs text-[#e3e3e3] leading-relaxed">{bullet}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#131314] border-t border-[#3c4043]">
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentStep ? 'w-6 bg-[#8ab4f8]' : 'w-1.5 bg-[#3c4043] hover:bg-[#5f6368]'
                }`}
                title={`Go to step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="inline-flex items-center gap-1 px-4 py-2 text-xs font-medium text-[#c4c7c5] hover:text-[#e3e3e3] bg-[#282a2c] hover:bg-[#3c4043] rounded-xl border border-[#3c4043] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-[#131314] bg-[#8ab4f8] hover:bg-[#a8c7fa] rounded-xl transition-all shadow-lg shadow-[#8ab4f8]/10"
            >
              <span>{currentStep === steps.length - 1 ? 'Start Research' : 'Next'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
