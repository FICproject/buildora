import React from 'react';

interface SkylineIllustrationProps {
  className?: string;
}

export const SkylineIllustration: React.FC<SkylineIllustrationProps> = ({ className = '' }) => {
  return (
    <div className={`pointer-events-none select-none ${className}`}>
      <svg
        viewBox="0 0 320 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto max-w-[280px] opacity-35"
      >
        {/* Tower 1 (Left spire tower) */}
        <path
          d="M18 180V80h14v100"
          stroke="#943D24"
          strokeWidth="1.2"
        />
        <path d="M25 80V55M25 55L21 62h8l-4-7" stroke="#943D24" strokeWidth="1" />
        {/* Tower 1 Windows */}
        <line x1="22" y1="92" x2="28" y2="92" stroke="#943D24" strokeWidth="1" strokeDasharray="1.5 2" />
        <line x1="22" y1="105" x2="28" y2="105" stroke="#943D24" strokeWidth="1" strokeDasharray="1.5 2" />
        <line x1="22" y1="118" x2="28" y2="118" stroke="#943D24" strokeWidth="1" strokeDasharray="1.5 2" />
        <line x1="22" y1="131" x2="28" y2="131" stroke="#943D24" strokeWidth="1" strokeDasharray="1.5 2" />
        <line x1="22" y1="144" x2="28" y2="144" stroke="#943D24" strokeWidth="1" strokeDasharray="1.5 2" />

        {/* Building 2 (Mid-rise stepped building) */}
        <path
          d="M36 180V105h18v75"
          stroke="#943D24"
          strokeWidth="1.2"
        />
        <rect x="40" y="115" width="10" height="8" stroke="#943D24" strokeWidth="0.8" />
        <rect x="40" y="130" width="10" height="8" stroke="#943D24" strokeWidth="0.8" />
        <rect x="40" y="145" width="10" height="8" stroke="#943D24" strokeWidth="0.8" />

        {/* Tower 3 (Tall modern skyscraper with angled roof) */}
        <path
          d="M58 180V45l18-15v150"
          stroke="#943D24"
          strokeWidth="1.2"
        />
        <path d="M67 30V15" stroke="#943D24" strokeWidth="1" />
        {/* Grid of windows on tower 3 */}
        <line x1="64" y1="60" x2="72" y2="60" stroke="#943D24" strokeWidth="1" strokeDasharray="1.5 1.5" />
        <line x1="64" y1="75" x2="72" y2="75" stroke="#943D24" strokeWidth="1" strokeDasharray="1.5 1.5" />
        <line x1="64" y1="90" x2="72" y2="90" stroke="#943D24" strokeWidth="1" strokeDasharray="1.5 1.5" />
        <line x1="64" y1="105" x2="72" y2="105" stroke="#943D24" strokeWidth="1" strokeDasharray="1.5 1.5" />
        <line x1="64" y1="120" x2="72" y2="120" stroke="#943D24" strokeWidth="1" strokeDasharray="1.5 1.5" />
        <line x1="64" y1="135" x2="72" y2="135" stroke="#943D24" strokeWidth="1" strokeDasharray="1.5 1.5" />

        {/* Building 4 (Wide commercial complex) */}
        <path
          d="M80 180V85h28v95"
          stroke="#943D24"
          strokeWidth="1.2"
        />
        <line x1="86" y1="95" x2="102" y2="95" stroke="#943D24" strokeWidth="0.8" strokeDasharray="2 2" />
        <line x1="86" y1="110" x2="102" y2="110" stroke="#943D24" strokeWidth="0.8" strokeDasharray="2 2" />
        <line x1="86" y1="125" x2="102" y2="125" stroke="#943D24" strokeWidth="0.8" strokeDasharray="2 2" />
        <line x1="86" y1="140" x2="102" y2="140" stroke="#943D24" strokeWidth="0.8" strokeDasharray="2 2" />

        {/* Tower 5 (Center Landmark Tower with crown & spire) */}
        <path
          d="M112 180V35h22v145"
          stroke="#943D24"
          strokeWidth="1.2"
        />
        <path d="M123 35V12M120 18h6" stroke="#943D24" strokeWidth="1" />
        <rect x="117" y="48" width="12" height="12" stroke="#943D24" strokeWidth="0.8" />
        <rect x="117" y="68" width="12" height="12" stroke="#943D24" strokeWidth="0.8" />
        <rect x="117" y="88" width="12" height="12" stroke="#943D24" strokeWidth="0.8" />
        <rect x="117" y="108" width="12" height="12" stroke="#943D24" strokeWidth="0.8" />
        <rect x="117" y="128" width="12" height="12" stroke="#943D24" strokeWidth="0.8" />

        {/* Building 6 (Geometric angular tower) */}
        <path
          d="M138 180V70l14-12 14 12v110"
          stroke="#943D24"
          strokeWidth="1.2"
        />
        <line x1="145" y1="88" x2="159" y2="88" stroke="#943D24" strokeWidth="0.8" strokeDasharray="2 1.5" />
        <line x1="145" y1="104" x2="159" y2="104" stroke="#943D24" strokeWidth="0.8" strokeDasharray="2 1.5" />
        <line x1="145" y1="120" x2="159" y2="120" stroke="#943D24" strokeWidth="0.8" strokeDasharray="2 1.5" />
        <line x1="145" y1="136" x2="159" y2="136" stroke="#943D24" strokeWidth="0.8" strokeDasharray="2 1.5" />

        {/* Building 7 (High density tower) */}
        <path
          d="M170 180V90h20v90"
          stroke="#943D24"
          strokeWidth="1.2"
        />
        <line x1="175" y1="102" x2="185" y2="102" stroke="#943D24" strokeWidth="0.8" strokeDasharray="1.5 2" />
        <line x1="175" y1="116" x2="185" y2="116" stroke="#943D24" strokeWidth="0.8" strokeDasharray="1.5 2" />
        <line x1="175" y1="130" x2="185" y2="130" stroke="#943D24" strokeWidth="0.8" strokeDasharray="1.5 2" />

        {/* Building 8 (Stepped residential high-rise) */}
        <path
          d="M194 180V110h8v-15h14v85"
          stroke="#943D24"
          strokeWidth="1.2"
        />

        {/* Ground reference line */}
        <line x1="10" y1="180" x2="230" y2="180" stroke="#943D24" strokeWidth="1" strokeDasharray="4 4" />
      </svg>
    </div>
  );
};
