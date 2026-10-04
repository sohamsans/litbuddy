import React from 'react';

interface LitBuddyLogoProps {
  className?: string;
}

export const LitBuddyLogo: React.FC<LitBuddyLogoProps> = ({ className = 'w-5 h-5' }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="lb-silver-grad" x1="16" y1="16" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>
      </defs>

      {/* Obsidian Dark Rounded Squircle Container */}
      <rect width="64" height="64" rx="14" fill="#0C0D10" />
      <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="13.25" stroke="#23262D" strokeWidth="1.5" />

      {/* Architectural Background Folio Page Layer */}
      <path
        d="M13 21L32 27.5L51 21V43.5L32 50L13 43.5V21Z"
        stroke="#334155"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="#13161C"
      />

      {/* Core Architectural Book Wings */}
      <path
        d="M17 18L32 24.5L47 18V41L32 47.5L17 41V18Z"
        stroke="url(#lb-silver-grad)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        fill="#181B22"
      />

      {/* Central Spine Fold */}
      <path
        d="M32 24.5V47.5"
        stroke="url(#lb-silver-grad)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Geometric Monogram: Left Page 'L' */}
      <path
        d="M22 23V36.5H29"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Geometric Monogram: Right Page 'B' Chevron & Spine */}
      <path
        d="M35 24.5L43 32L35 39.5"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M35 32H41.5"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
};
