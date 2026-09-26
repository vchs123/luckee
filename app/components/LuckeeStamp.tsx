import React, { useState } from 'react';
import { m, AnimatePresence } from "framer-motion";
import { playCoinSparkle } from "~/lib/sound";

export type StampSize = 'xs' | 'sm' | 'md' | 'lg';
export type StampColor = 'pink' | 'emerald' | 'crimson' | 'indigo';

interface LuckeeStampProps {
  size?: StampSize;
  rotate?: number;
  interactive?: boolean;
  tooltipText?: string;
  className?: string;
  color?: StampColor;
  showTooltipOnHover?: boolean;
}

const SIZE_CONFIG: Record<StampSize, { dimension: number; textClass: string; containerClass: string }> = {
  xs: { dimension: 44, textClass: 'text-[7px]', containerClass: 'w-11 h-11' },
  sm: { dimension: 56, textClass: 'text-[8.5px]', containerClass: 'w-14 h-14' },
  md: { dimension: 72, textClass: 'text-[10px]', containerClass: 'w-[72px] h-[72px]' },
  lg: { dimension: 96, textClass: 'text-[12px]', containerClass: 'w-24 h-24' },
};

const COLOR_MAP: Record<StampColor, {
  ink: string;
  inkBorder: string;
  bgFill: string;
  badgeBg: string;
}> = {
  pink: {
    ink: '#e91e8c',
    inkBorder: '#e91e8c',
    bgFill: '#fff5fa',
    badgeBg: 'rgba(255, 245, 250, 0.95)',
  },
  crimson: {
    ink: '#be185d',
    inkBorder: '#be185d',
    bgFill: '#fff1f2',
    badgeBg: 'rgba(255, 241, 242, 0.95)',
  },
  emerald: {
    ink: '#059669',
    inkBorder: '#059669',
    bgFill: '#ecfdf5',
    badgeBg: 'rgba(236, 253, 245, 0.95)',
  },
  indigo: {
    ink: '#4f46e5',
    inkBorder: '#4f46e5',
    bgFill: '#eef2ff',
    badgeBg: 'rgba(238, 242, 255, 0.95)',
  },
};

export const LuckeeStamp: React.FC<LuckeeStampProps> = ({
  size = 'md',
  rotate = -7,
  interactive = true,
  tooltipText = 'Tried & Tested by Luckee',
  className = '',
  color = 'pink',
  showTooltipOnHover = true,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const { dimension, containerClass } = SIZE_CONFIG[size];
  const { ink, bgFill } = COLOR_MAP[color];

  const handleClick = (e: React.MouseEvent) => {
    if (!interactive) return;
    e.stopPropagation();
    playCoinSparkle();
    setShowTooltip(prev => !prev);
    setTimeout(() => setShowTooltip(false), 2400);
  };

  return (
    <div 
      className={`relative inline-block select-none ${className}`}
      onMouseEnter={() => showTooltipOnHover && setShowTooltip(true)}
      onMouseLeave={() => showTooltipOnHover && setShowTooltip(false)}
      onClick={handleClick}
      title={tooltipText}
    >
      <m.div
        className={`${containerClass} flex items-center justify-center cursor-pointer`}
        style={{ transform: `rotate(${rotate}deg)` }}
        whileHover={interactive ? { scale: 1.08, rotate: rotate + (rotate < 0 ? 3 : -3) } : undefined}
        whileTap={interactive ? { scale: 0.94 } : undefined}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        <svg
          viewBox="0 0 100 100"
          width={dimension}
          height={dimension}
          className="w-full h-full drop-shadow-xs overflow-visible"
        >
          <defs>
            {/* Top Text Arc Path (Clockwise along top, heads point up/out) */}
            <path
              id={`stampTopPath-${size}-${color}`}
              d="M 16,50 A 34,34 0 1,1 84,50"
              fill="none"
            />
            {/* Bottom Text Arc Path (Counter-clockwise along bottom, heads point up towards center) */}
            <path
              id={`stampBottomPath-${size}-${color}`}
              d="M 16,50 A 34,34 0 0,0 84,50"
              fill="none"
            />
          </defs>

          {/* Stamp Circular Outer Scalloped / Dashed Border */}
          <circle
            cx="50"
            cy="50"
            r="47"
            fill={bgFill}
            stroke={ink}
            strokeWidth="2.4"
            strokeDasharray="4,2.5"
            strokeOpacity="0.88"
          />

          {/* Inner Concentric Ring */}
          <circle
            cx="50"
            cy="50"
            r="42.5"
            fill="none"
            stroke={ink}
            strokeWidth="1.2"
            strokeOpacity="0.75"
          />

          {/* Innermost Head Boundary Circle */}
          <circle
            cx="50"
            cy="50"
            r="25.5"
            fill="#FFFFFF"
            stroke={ink}
            strokeWidth="1.5"
            strokeOpacity="0.5"
          />

          {/* Top Arc Text: TRIED & TESTED */}
          <text
            fill={ink}
            fontSize="8"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="900"
            letterSpacing="1.8"
            textAnchor="middle"
          >
            <textPath
              href={`#stampTopPath-${size}-${color}`}
              startOffset="50%"
            >
              TRIED &amp; TESTED
            </textPath>
          </text>

          {/* Bottom Arc Text: ★ LUCKEE ★ */}
          <text
            fill={ink}
            fontSize="7.5"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="900"
            letterSpacing="2.2"
            textAnchor="middle"
          >
            <textPath
              href={`#stampBottomPath-${size}-${color}`}
              startOffset="50%"
            >
              ★ LUCKEE ★
            </textPath>
          </text>

          {/* Center Luckee Mascot Face */}
          <g transform="translate(24.5, 23.5) scale(0.32)">
            {/* Mascot Head Outer Silhouette */}
            <path
              d="M 80 34 
                 C 114 34, 134 56, 134 86 
                 C 134 116, 126 142, 80 142 
                 C 34 142, 26 116, 26 86 
                 C 26 56, 46 34, 80 34 Z"
              fill="#FFFBF5"
              stroke={ink}
              strokeWidth="5"
            />

            {/* Left Cat Ear */}
            <path
              d="M 38 68 C 30 50, 32 26, 44 20 C 56 22, 68 44, 70 58 Z"
              fill="#FFFBF5"
              stroke={ink}
              strokeWidth="5"
              strokeLinejoin="round"
            />
            <path
              d="M 42 60 C 37 46, 40 30, 47 27 C 54 31, 60 46, 60 55 Z"
              fill="#FDA4AF"
            />

            {/* Right Cat Ear */}
            <path
              d="M 122 68 C 130 50, 128 26, 116 20 C 104 22, 92 44, 90 58 Z"
              fill="#FFFBF5"
              stroke={ink}
              strokeWidth="5"
              strokeLinejoin="round"
            />
            <path
              d="M 118 60 C 123 46, 120 30, 113 27 C 106 31, 100 46, 100 55 Z"
              fill="#FDA4AF"
            />

            {/* Rosy Cheeks */}
            <ellipse cx="46" cy="94" rx="10" ry="7" fill="#FDA4AF" fillOpacity="0.8" />
            <ellipse cx="114" cy="94" rx="10" ry="7" fill="#FDA4AF" fillOpacity="0.8" />

            {/* Cute Whiskers */}
            <path d="M 28 89 Q 38 91 44 91" stroke={ink} strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 28 97 Q 38 97 44 96" stroke={ink} strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 132 89 Q 122 91 116 91" stroke={ink} strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 132 97 Q 122 97 116 96" stroke={ink} strokeWidth="3.5" strokeLinecap="round" />

            {/* Left Eye: Big sparkle circle */}
            <circle cx="58" cy="80" r="7.5" fill="#1E0A2E" />
            <circle cx="56" cy="77.5" r="2.5" fill="#FFFFFF" />
            <circle cx="61" cy="82" r="1.2" fill="#FFFFFF" />

            {/* Right Eye: Cute Winking Arc */}
            <path
              d="M 94 80 Q 102 89 110 80"
              fill="none"
              stroke="#1E0A2E"
              strokeWidth="4.5"
              strokeLinecap="round"
            />

            {/* Cute Cat Nose & Mouth :3 */}
            <ellipse cx="80" cy="89" rx="3.5" ry="2.5" fill="#E91E8C" />
            <path
              d="M 75 92 Q 80 97 85 92"
              fill="none"
              stroke="#1E0A2E"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </g>

          {/* Sparkle star accents on corners */}
          <circle cx="20" cy="48" r="1.8" fill={ink} />
          <circle cx="80" cy="48" r="1.8" fill={ink} />
        </svg>
      </m.div>

      {/* Interactive Tooltip on Hover/Tap */}
      <AnimatePresence>
        {showTooltip && (
          <m.div
            initial={{ opacity: 0, y: 4, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 2, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-[#1e0a2e] text-white text-[10px] font-black tracking-wide rounded-lg whitespace-nowrap shadow-md pointer-events-none z-30 flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#e91e8c]" />
            <span>{tooltipText}</span>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1e0a2e] rotate-45" />
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
};
