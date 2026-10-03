import React, { useState, useEffect } from 'react';
import { ShieldCheck, X } from 'lucide-react';

interface CookieBannerProps {
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
}

export const CookieBanner: React.FC<CookieBannerProps> = ({ onOpenPrivacy, onOpenTerms }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('litbuddy_cookie_consent');
    if (!accepted) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('litbuddy_cookie_consent', 'accepted');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md p-4 rounded-2xl bg-[#1e1f20]/95 backdrop-blur-md border border-[#3c4043] shadow-2xl z-50 animate-fadeIn text-xs text-[#c4c7c5]">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 text-[#e3e3e3] font-semibold text-sm">
          <ShieldCheck className="w-4 h-4 text-[#8ab4f8]" />
          <span>Privacy & Cookie Preferences</span>
        </div>
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="text-[#9aa0a6] hover:text-[#e3e3e3] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="leading-relaxed mb-3 text-[#9aa0a6]">
        LitBuddy uses essential local browser storage strictly for caching search tokens, UI themes, and BYOK credentials. No advertising cookies or tracker telemetry are used.
      </p>
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2 text-[11px]">
          <button
            type="button"
            onClick={onOpenPrivacy}
            className="text-[#8ab4f8] hover:underline"
          >
            Privacy
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={onOpenTerms}
            className="text-[#8ab4f8] hover:underline"
          >
            Terms
          </button>
        </div>
        <button
          type="button"
          onClick={handleAccept}
          className="px-3.5 py-1.5 rounded-full bg-[#8ab4f8] text-[#131314] font-medium text-xs hover:bg-[#8ab4f8]/90 transition-colors"
        >
          Accept
        </button>
      </div>
    </div>
  );
};
