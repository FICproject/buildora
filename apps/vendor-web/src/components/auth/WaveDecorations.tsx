import React from 'react';

interface WaveDecorationsProps {
  className?: string;
}

export const WaveDecorations: React.FC<WaveDecorationsProps> = ({ className = '' }) => {
  return (
    <div
      className={`absolute bottom-0 left-0 right-0 w-full overflow-hidden pointer-events-none select-none ${className}`}
    >
      <svg
        viewBox="0 0 1440 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="w-full h-28 sm:h-36 md:h-44 lg:h-52"
      >
        <defs>
          <linearGradient id="waveTerracottaGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7D331E" />
            <stop offset="50%" stopColor="#943D24" />
            <stop offset="100%" stopColor="#A6482D" />
          </linearGradient>

          <linearGradient id="waveGoldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E5B342" />
            <stop offset="50%" stopColor="#F6C453" />
            <stop offset="100%" stopColor="#F8D076" stopOpacity="0.85" />
          </linearGradient>

          <linearGradient id="waveCreamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F8F7F5" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#FBF3F0" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#F5E3DC" />
          </linearGradient>
        </defs>

        {/* Soft Cream Wave */}
        <path
          d="M0 160 C320 100, 640 180, 960 140 C1180 110, 1340 170, 1440 150 L1440 220 L0 220 Z"
          fill="url(#waveCreamGrad)"
        />

        {/* Deep Terracotta Brown Wave */}
        <path
          d="M0 175 C160 185, 280 150, 420 180 C560 210, 720 195, 860 165 C1020 130, 1260 185, 1440 160 L1440 220 L0 220 Z"
          fill="url(#waveTerracottaGrad)"
        />

        {/* Warm Golden Yellow Accent Wave */}
        <path
          d="M0 135 C140 135, 240 170, 360 175 C480 180, 580 145, 680 170 C760 190, 840 210, 920 220 L0 220 Z"
          fill="url(#waveGoldGrad)"
        />
      </svg>
    </div>
  );
};
