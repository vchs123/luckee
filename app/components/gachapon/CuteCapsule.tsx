import React from 'react';
import { m } from "framer-motion";

export type CuteCapsuleTheme = 
  | 'strawberry' 
  | 'mint' 
  | 'lemon' 
  | 'lavender' 
  | 'sky' 
  | 'peach' 
  | 'rose' 
  | 'matcha';

export interface CuteCapsuleProps {
  theme?: CuteCapsuleTheme;
  size?: number;
  className?: string;
  showGlow?: boolean;
  animateBounce?: boolean;
  isCracked?: boolean;
}

interface ThemeConfig {
  top: string;
  topLight: string;
  bottom: string;
  clasp: string;
  accent: 'star' | 'heart' | 'luckee' | 'clover' | 'sparkle';
  glow: string;
}

export const CAPSULE_THEMES: Record<CuteCapsuleTheme, ThemeConfig> = {
  strawberry: {
    top: '#ff3366',
    topLight: '#ff6699',
    bottom: '#ffffff',
    clasp: '#ff3366',
    accent: 'heart',
    glow: 'rgba(255, 51, 102, 0.35)',
  },
  mint: {
    top: '#059669',
    topLight: '#34d399',
    bottom: '#f0fdf4',
    clasp: '#059669',
    accent: 'clover',
    glow: 'rgba(5, 150, 105, 0.35)',
  },
  lemon: {
    top: '#eab308',
    topLight: '#fde047',
    bottom: '#fefce8',
    clasp: '#ca8a04',
    accent: 'star',
    glow: 'rgba(234, 179, 8, 0.35)',
  },
  lavender: {
    top: '#9333ea',
    topLight: '#c084fc',
    bottom: '#faf5ff',
    clasp: '#9333ea',
    accent: 'sparkle',
    glow: 'rgba(147, 51, 234, 0.35)',
  },
  sky: {
    top: '#0284c7',
    topLight: '#38bdf8',
    bottom: '#f0f9ff',
    clasp: '#0284c7',
    accent: 'star',
    glow: 'rgba(2, 132, 199, 0.35)',
  },
  peach: {
    top: '#ea580c',
    topLight: '#fb923c',
    bottom: '#fff7ed',
    clasp: '#ea580c',
    accent: 'heart',
    glow: 'rgba(234, 88, 12, 0.35)',
  },
  rose: {
    top: '#e11d48',
    topLight: '#fb7185',
    bottom: '#fff1f2',
    clasp: '#e11d48',
    accent: 'luckee',
    glow: 'rgba(225, 29, 72, 0.35)',
  },
  matcha: {
    top: '#65a30d',
    topLight: '#a3e635',
    bottom: '#f7fee7',
    clasp: '#65a30d',
    accent: 'clover',
    glow: 'rgba(101, 163, 13, 0.35)',
  },
};

export const CuteCapsule: React.FC<CuteCapsuleProps> = ({
  theme = 'strawberry',
  size = 56,
  className = '',
  showGlow = true,
  animateBounce = false,
  isCracked = false,
}) => {
  const cfg = CAPSULE_THEMES[theme] || CAPSULE_THEMES.strawberry;

  return (
    <m.div
      animate={animateBounce ? {
        y: [0, -6, 0],
        scale: [1, 1.05, 1],
      } : undefined}
      transition={animateBounce ? {
        duration: 1.8,
        repeat: Infinity,
        ease: 'easeInOut',
      } : undefined}
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Soft Ambient Glow */}
      {showGlow && (
        <div 
          className="absolute inset-0 rounded-full blur-md -z-10 pointer-events-none"
          style={{ backgroundColor: cfg.glow }}
        />
      )}

      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="w-full h-full overflow-visible drop-shadow-md"
      >
        <defs>
          {/* Top Half Candy Gradient */}
          <linearGradient id={`topGrad-${theme}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={cfg.topLight} />
            <stop offset="100%" stopColor={cfg.top} />
          </linearGradient>

          {/* Bottom Frosted Glass / Translucent Gradient */}
          <linearGradient id={`botGrad-${theme}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="60%" stopColor={cfg.bottom} stopOpacity="0.9" />
            <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        {/* Bottom Translucent Dome Shell */}
        <path
          d="M 14 50 C 14 74, 30 88, 50 88 C 70 88, 86 74, 86 50 Z"
          fill={`url(#botGrad-${theme})`}
          stroke="#1e0a2e"
          strokeWidth="3.2"
          strokeLinejoin="round"
        />

        {/* Prize Slip folded peek inside bottom */}
        <g transform="translate(35, 60) rotate(-7)">
          <rect
            x="0"
            y="0"
            width="30"
            height="16"
            rx="3"
            fill="#FEF08A"
            stroke="#CA8A04"
            strokeWidth="1.5"
          />
          <line x1="4" y1="5" x2="26" y2="5" stroke="#F59E0B" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="4" y1="10" x2="20" y2="10" stroke="#F59E0B" strokeWidth="1.2" strokeLinecap="round" />
          {/* Tiny Red Luckee Seal on slip */}
          <circle cx="23" cy="10" r="2.2" fill="#E11D48" />
        </g>

        {/* Bottom Rim Specular Sheen */}
        <path
          d="M 26 78 C 34 84, 66 84, 74 78"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />

        {/* Top Glossy Dome Shell (Pops open if cracked) */}
        <g transform={isCracked ? "translate(-2, -9) rotate(-14 14 50)" : undefined}>
          <path
            d="M 14 50 C 14 26, 30 12, 50 12 C 70 12, 86 26, 86 50 Z"
            fill={`url(#topGrad-${theme})`}
            stroke="#1e0a2e"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />

          {/* Curved Glossy Highlight Pill */}
          <path
            d="M 26 34 C 32 22, 46 18, 58 18"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.85"
          />
          <circle cx="68" cy="22" r="2.5" fill="white" opacity="0.85" />
        </g>

        {/* Middle Belt Seam Groove */}
        <rect
          x="11"
          y="47"
          width="78"
          height="6.5"
          rx="3.2"
          fill="#ffffff"
          stroke="#1e0a2e"
          strokeWidth="2.8"
        />

        {/* Center Cute Clasp Button */}
        <circle
          cx="50"
          cy="50.2"
          r="9.5"
          fill="#ffffff"
          stroke="#1e0a2e"
          strokeWidth="2.5"
        />

        {/* Cute Clasp Emblems */}
        {cfg.accent === 'star' && (
          <polygon
            points="50,44.5 52,48 56,48.5 53.2,51.2 54,55 50,53.2 46,55 46.8,51.2 44,48.5 48,48"
            fill="#F59E0B"
          />
        )}

        {cfg.accent === 'heart' && (
          <path
            d="M 50 54.5 C 47.5 51.5, 45 49, 45 47 C 45 45.5, 46.5 44.5, 48 45 C 49 45.4, 49.5 46.2, 50 46.8 C 50.5 46.2, 51 45.4, 52 45 C 53.5 44.5, 55 45.5, 55 47 C 55 49, 52.5 51.5, 50 54.5 Z"
            fill="#E11D48"
          />
        )}

        {cfg.accent === 'clover' && (
          <g transform="translate(46, 46.5) scale(0.8)">
            <circle cx="2.5" cy="2.5" r="2.2" fill="#059669" />
            <circle cx="7.5" cy="2.5" r="2.2" fill="#059669" />
            <circle cx="2.5" cy="7.5" r="2.2" fill="#059669" />
            <circle cx="7.5" cy="7.5" r="2.2" fill="#059669" />
            <circle cx="5" cy="5" r="1.5" fill="#34D399" />
          </g>
        )}

        {cfg.accent === 'sparkle' && (
          <path
            d="M 50 43.5 Q 50 50 56.5 50 Q 50 50 50 56.5 Q 50 50 43.5 50 Q 50 50 50 43.5 Z"
            fill="#9333EA"
          />
        )}

        {cfg.accent === 'luckee' && (
          /* Mini cute Luckee cat ears & winking face */
          <g transform="translate(43, 44) scale(0.85)">
            {/* Left Ear */}
            <polygon points="2,5 0,0 5,2" fill="#E11D48" />
            {/* Right Ear */}
            <polygon points="14,5 16,0 11,2" fill="#E11D48" />
            {/* Left Eye Sparkle */}
            <circle cx="5" cy="7" r="1.4" fill="#1E0A2E" />
            {/* Right Eye Winking */}
            <path d="M 10 7 Q 12 9 14 7" fill="none" stroke="#1E0A2E" strokeWidth="1.2" strokeLinecap="round" />
            {/* Cheeks */}
            <circle cx="3" cy="8.5" r="1" fill="#FDA4AF" />
            <circle cx="13" cy="8.5" r="1" fill="#FDA4AF" />
          </g>
        )}
      </svg>
    </m.div>
  );
};
