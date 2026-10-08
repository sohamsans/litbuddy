import React, { useEffect, useState } from 'react';

/**
 * TopographicBackground:
 * Renders an ultra-subtle, minimalist topographic contour line background
 * (inspired by Joy Division / elevation maps) with smooth parallax mouse tracking.
 * Strictly restrained opacity (0.02 - 0.05) so it never distracts the researcher.
 */
export const TopographicBackground: React.FC = () => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let animationFrameId: number;
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse offset between -1 and 1
      const normalizedX = (e.clientX / window.innerWidth - 0.5) * 2;
      const normalizedY = (e.clientY / window.innerHeight - 0.5) * 2;

      animationFrameId = requestAnimationFrame(() => {
        setOffset({
          x: normalizedX * 12,
          y: normalizedY * 8
        });
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none transition-transform duration-700 ease-out"
      style={{
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`
      }}
      aria-hidden="true"
    >
      <svg
        className="w-full h-full opacity-[0.035] stroke-white"
        viewBox="0 0 1600 1000"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <path
          d="M-100 200 C 300 120, 600 350, 950 220 C 1300 90, 1500 280, 1800 210"
          strokeWidth="1.2"
          strokeDasharray="4 8"
        />
        <path
          d="M-100 320 C 250 240, 550 480, 900 340 C 1250 200, 1550 380, 1800 330"
          strokeWidth="1.2"
        />
        <path
          d="M-100 440 C 200 360, 500 590, 850 460 C 1200 330, 1500 500, 1800 450"
          strokeWidth="1.5"
        />
        <path
          d="M-100 560 C 350 460, 650 710, 1000 570 C 1350 430, 1600 620, 1800 570"
          strokeWidth="1.2"
          strokeDasharray="6 10"
        />
        <path
          d="M-100 680 C 300 600, 600 830, 950 690 C 1300 550, 1550 740, 1800 690"
          strokeWidth="1.2"
        />
        <path
          d="M-100 800 C 250 720, 550 940, 900 810 C 1250 680, 1500 860, 1800 810"
          strokeWidth="1.5"
        />
        <path
          d="M-100 920 C 400 820, 700 1020, 1050 890 C 1400 760, 1650 960, 1800 910"
          strokeWidth="1.2"
          strokeDasharray="3 6"
        />

        {/* Ambient Topographic Elevation Rings */}
        <circle cx="1250" cy="300" r="140" strokeWidth="1" strokeDasharray="4 6" />
        <circle cx="1250" cy="300" r="220" strokeWidth="1" />
        <circle cx="1250" cy="300" r="300" strokeWidth="1" strokeDasharray="8 12" />

        <circle cx="350" cy="750" r="110" strokeWidth="1" />
        <circle cx="350" cy="750" r="190" strokeWidth="1" strokeDasharray="5 7" />
        <circle cx="350" cy="750" r="270" strokeWidth="1" />
      </svg>
    </div>
  );
};
