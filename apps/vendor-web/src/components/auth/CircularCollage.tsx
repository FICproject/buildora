import React from 'react';

interface CircularCollageProps {
  className?: string;
  size?: number;
}

export const CircularCollage: React.FC<CircularCollageProps> = ({
  className = '',
  size = 480
}) => {
  // Center coordinates and radii
  const cx = 250;
  const cy = 250;
  const rOuter = 215;
  const rInner = 74;

  // Sector Angle Definitions (degrees)
  // 5 sectors spanning clockwise from top (250°) to bottom-left (210°)
  // leaving the left open towards the "Partner with BUILDORA 60" text
  const sectors = [
    {
      id: 'steel',
      name: 'Steel Rods & TMT Rebar',
      startAngle: 248,
      endAngle: 306,
      image: 'https://images.unsplash.com/photo-1535813547-99c456a41d4a?auto=format&fit=crop&w=700&q=80',
      fallbackColor: '#334155'
    },
    {
      id: 'wood',
      name: 'Wooden Timber & Lumber Planks',
      startAngle: 312,
      endAngle: 10,
      image: 'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?auto=format&fit=crop&w=700&q=80',
      fallbackColor: '#b45309'
    },
    {
      id: 'concrete',
      name: 'Concrete Blocks & AAC Masonry',
      startAngle: 16,
      endAngle: 76,
      image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=700&q=80',
      fallbackColor: '#64748b'
    },
    {
      id: 'plumbing',
      name: 'Plumbing Pipes & Sanitary Materials',
      startAngle: 82,
      endAngle: 142,
      image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=700&q=80',
      fallbackColor: '#e2e8f0'
    },
    {
      id: 'paints',
      name: 'Colorful Paint Cans & Coatings',
      startAngle: 148,
      endAngle: 206,
      image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=700&q=80',
      fallbackColor: '#eab308'
    }
  ];

  // Helper to generate annular sector path
  const createAnnularSector = (
    startAngleDeg: number,
    endAngleDeg: number,
    rIn: number,
    rOut: number
  ) => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const startRad = toRad(startAngleDeg);
    const endRad = toRad(endAngleDeg);

    const x1 = cx + rOut * Math.cos(startRad);
    const y1 = cy + rOut * Math.sin(startRad);
    const x2 = cx + rOut * Math.cos(endRad);
    const y2 = cy + rOut * Math.sin(endRad);

    const x3 = cx + rIn * Math.cos(endRad);
    const y3 = cy + rIn * Math.sin(endRad);
    const x4 = cx + rIn * Math.cos(startRad);
    const y4 = cy + rIn * Math.sin(startRad);

    // Normalize arc span
    let span = endAngleDeg - startAngleDeg;
    if (span < 0) span += 360;
    const largeArc = span > 180 ? 1 : 0;

    return `M ${x1} ${y1} A ${rOut} ${rOut} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${rIn} ${rIn} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  };

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 500 500"
        width={size}
        height={size}
        className="w-full h-auto max-w-[480px] drop-shadow-xl overflow-visible"
      >
        <defs>
          {/* Slices ClipPaths */}
          {sectors.map((sector) => (
            <clipPath key={`clip-${sector.id}`} id={`clip-${sector.id}`}>
              <path d={createAnnularSector(sector.startAngle, sector.endAngle, rInner, rOuter)} />
            </clipPath>
          ))}

          {/* Center Orange Badge Gradient */}
          <linearGradient id="centerOrangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFA52F" />
            <stop offset="100%" stopColor="#FF7900" />
          </linearGradient>

          {/* Center Drop Shadow */}
          <filter id="centerShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#FF7900" floodOpacity="0.38" />
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#102B63" floodOpacity="0.12" />
          </filter>

          {/* Slices Outer Shadow */}
          <filter id="wheelShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#102B63" floodOpacity="0.08" />
          </filter>
        </defs>

        {/* Outer Circular Backdrop subtle ring */}
        <circle
          cx={cx}
          cy={cy}
          r={rOuter + 3}
          fill="none"
          stroke="#F8FAFC"
          strokeWidth="6"
        />

        {/* Sectors Group */}
        <g filter="url(#wheelShadow)">
          {sectors.map((sector) => {
            const pathD = createAnnularSector(sector.startAngle, sector.endAngle, rInner, rOuter);
            return (
              <g key={sector.id} className="transition-transform duration-300 hover:scale-[1.01] origin-center">
                {/* Fallback solid background */}
                <path d={pathD} fill={sector.fallbackColor} />

                {/* Photo clipped to sector */}
                <image
                  href={sector.image}
                  x="0"
                  y="0"
                  width="500"
                  height="500"
                  preserveAspectRatio="xMidYMid slice"
                  clipPath={`url(#clip-${sector.id})`}
                />

                {/* Crisp white dividing border */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="5"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}
        </g>

        {/* Center Storefront Icon Badge */}
        {/* Outer white ring */}
        <circle
          cx={cx}
          cy={cy}
          r={rInner + 4}
          fill="#FFFFFF"
          stroke="#F1F5F9"
          strokeWidth="2"
        />

        {/* Vibrant Orange Gradient Circle */}
        <circle
          cx={cx}
          cy={cy}
          r={rInner - 4}
          fill="url(#centerOrangeGrad)"
          filter="url(#centerShadow)"
        />

        {/* Storefront / Shop Icon (white line art matching reference) */}
        <g transform={`translate(${cx - 26}, ${cy - 26})`} className="pointer-events-none">
          <svg
            width="52"
            height="52"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Awning top roof */}
            <path d="M3 9l2.5-5h13L21 9" />
            {/* Scalloped Awning Edge */}
            <path d="M3 9a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 4 0" />
            {/* Store body walls */}
            <path d="M4 11.5v8.5a1.5 1.5 0 0 0 1.5 1.5h13a1.5 1.5 0 0 0 1.5-1.5v-8.5" />
            {/* Entrance Doorway & Window */}
            <path d="M9 21.5v-5a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5v5" />
          </svg>
        </g>
      </svg>
    </div>
  );
};
