import React from 'react';

interface WaveDecorationsProps {
  className?: string;
}

export const WaveDecorations: React.FC<WaveDecorationsProps> = ({ className = '' }) => {
  return (
    <div className={`absolute bottom-0 left-0 right-0 w-full overflow-hidden pointer-events-none select-none ${className}`}>
      <svg
        viewBox="0 0 1440 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="w-full h-28 sm:h-36 md:h-44 lg:h-52"
      >
        <defs>
          {/* Primary Orange Gradient */}
          <linearGradient id="waveOrangeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF7900" />
            <stop offset="35%" stopColor="#FFA52F" />
            <stop offset="70%" stopColor="#FF8B1F" />
            <stop offset="100%" stopColor="#FFA52F" stopOpacity="0.8" />
          </linearGradient>

          {/* Deep Navy to Royal Blue Gradient */}
          <linearGradient id="waveBlueGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#102B63" />
            <stop offset="30%" stopColor="#1B428A" />
            <stop offset="70%" stopColor="#2865B8" />
            <stop offset="100%" stopColor="#3E83DF" />
          </linearGradient>

          {/* Subtle Light Blue Right Wave */}
          <linearGradient id="waveLightBlueGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F3F7FC" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#E2EDF9" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#DBE8F8" />
          </linearGradient>
        </defs>

        {/* 1. Background Soft Light Wave (extends right side under login card) */}
        <path
          d="M0 160 C320 100, 640 180, 960 140 C1180 110, 1340 170, 1440 150 L1440 220 L0 220 Z"
          fill="url(#waveLightBlueGrad)"
        />

        {/* 2. Deep Navy & Royal Blue Smooth Wave */}
        <path
          d="M0 175 C160 185, 280 150, 420 180 C560 210, 720 195, 860 165 C1020 130, 1260 185, 1440 160 L1440 220 L0 220 Z"
          fill="url(#waveBlueGrad)"
        />

        {/* 3. Foreground Flowing Vibrant Orange Wave */}
        <path
          d="M0 135 C140 135, 240 170, 360 175 C480 180, 580 145, 680 170 C760 190, 840 210, 920 220 L0 220 Z"
          fill="url(#waveOrangeGrad)"
        />
      </svg>
    </div>
  );
};
