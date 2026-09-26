import React from 'react';
import { m } from "framer-motion";
import { playCoinSparkle } from "~/lib/sound";

export type MascotPose = 'happy' | 'winking' | 'holding-coin' | 'gachapon' | 'celebrating' | 'cheering';
export type MascotSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';

interface LuckeeMascotProps {
  pose?: MascotPose;
  size?: MascotSize;
  speechBubble?: string;
  onClick?: () => void;
  interactive?: boolean;
  className?: string;
}

const SIZE_MAP: Record<MascotSize, { width: number; height: number; containerClass: string }> = {
  xs: { width: 32, height: 32, containerClass: 'w-8 h-8' },
  sm: { width: 44, height: 44, containerClass: 'w-11 h-11' },
  md: { width: 68, height: 68, containerClass: 'w-[68px] h-[68px]' },
  lg: { width: 104, height: 104, containerClass: 'w-[104px] h-[104px]' },
  xl: { width: 148, height: 148, containerClass: 'w-[148px] h-[148px]' },
  hero: { width: 190, height: 190, containerClass: 'w-[190px] h-[190px]' },
};

export const LuckeeMascot: React.FC<LuckeeMascotProps> = ({
  pose = 'happy',
  size = 'md',
  speechBubble,
  onClick,
  interactive = true,
  className = '',
}) => {
  const { width, height, containerClass } = SIZE_MAP[size];

  const handleClick = () => {
    if (interactive) {
      playCoinSparkle();
    }
    if (onClick) {
      onClick();
    }
  };

  const isWinking = pose === 'winking';
  const isHoldingCoin = pose === 'holding-coin';
  const isGachapon = pose === 'gachapon';
  const isCelebrating = pose === 'celebrating';
  const isCheering = pose === 'cheering';

  return (
    <div className={`relative inline-flex items-center justify-center select-none ${className}`}>
      {/* Optional Speech Bubble Tooltip */}
      {speechBubble && (
        <m.div
          initial={{ opacity: 0, y: 6, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white text-[#1e0a2e] text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-md border border-[#ec489933] flex items-center gap-1 z-20 pointer-events-none"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#e91e8c] animate-ping" />
          <span>{speechBubble}</span>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-b border-r border-[#ec489933] rotate-45" />
        </m.div>
      )}

      {/* Mascot Main Body SVG */}
      <m.div
        className={`${containerClass} cursor-pointer flex items-center justify-center`}
        onClick={handleClick}
        whileHover={interactive ? { scale: 1.06, rotate: [-1, 1, -1] } : undefined}
        whileTap={interactive ? { scale: 0.92 } : undefined}
        animate={
          isCelebrating
            ? { y: [0, -8, 0], rotate: [-2, 2, -2] }
            : { y: [0, -3, 0] }
        }
        transition={{
          repeat: Infinity,
          duration: isCelebrating ? 1.6 : 3,
          ease: 'easeInOut',
        }}
      >
        <svg
          viewBox="0 0 160 160"
          width={width}
          height={height}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm overflow-visible"
        >
          <defs>
            {/* Soft Mascot Fur Gradient */}
            <linearGradient id="furGradient" x1="80" y1="20" x2="80" y2="150" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFBF5" />
              <stop offset="60%" stopColor="#FFF1E6" />
              <stop offset="100%" stopColor="#FFE4D6" />
            </linearGradient>

            {/* Lucky Coin Gold Gradient */}
            <linearGradient id="goldCoinGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>

            {/* Pink Ear Gradient */}
            <linearGradient id="earPink" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FDA4AF" />
              <stop offset="100%" stopColor="#FB7185" />
            </linearGradient>

            {/* Gachapon Capsule Gradient Top */}
            <linearGradient id="capsulePink" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F43F5E" />
              <stop offset="100%" stopColor="#E11D48" />
            </linearGradient>

            {/* Gachapon Capsule Bottom Glass */}
            <linearGradient id="capsuleGlass" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#BAE6FD" stopOpacity="0.95" />
            </linearGradient>

            {/* Soft Shadow */}
            <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#9F1239" floodOpacity="0.12" />
            </filter>
          </defs>

          {/* Ground Soft Glow Shadow */}
          <ellipse cx="80" cy="148" rx="42" ry="7" fill="#1E0A2E" fillOpacity="0.08" />

          {/* Cat Tail Wagging behind */}
          <m.path
            d="M 115 118 C 135 115, 148 100, 142 85 C 138 75, 126 80, 128 92 C 129 98, 122 108, 114 112"
            fill="url(#furGradient)"
            stroke="#FED7AA"
            strokeWidth="3"
            strokeLinecap="round"
            animate={{ rotate: [0, 8, -5, 0] }}
            style={{ originX: '115px', originY: '118px' }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          />

          {/* Left Cat Ear */}
          <path
            d="M 38 68 C 30 50, 32 26, 44 20 C 56 22, 68 44, 70 58 Z"
            fill="url(#furGradient)"
            stroke="#FED7AA"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Left Inner Ear Pink */}
          <path
            d="M 42 60 C 37 46, 40 30, 47 27 C 54 31, 60 46, 60 55 Z"
            fill="url(#earPink)"
          />

          {/* Right Cat Ear */}
          <path
            d="M 122 68 C 130 50, 128 26, 116 20 C 104 22, 92 44, 90 58 Z"
            fill="url(#furGradient)"
            stroke="#FED7AA"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Right Inner Ear Pink */}
          <path
            d="M 118 60 C 123 46, 120 30, 113 27 C 106 31, 100 46, 100 55 Z"
            fill="url(#earPink)"
          />

          {/* Party Hat (for Celebrating Pose) */}
          {isCelebrating && (
            <g>
              <polygon points="80,6 64,36 96,36" fill="#F43F5E" />
              <polygon points="80,6 72,36 88,36" fill="#FDE047" />
              <circle cx="80" cy="5" r="4" fill="#FDE047" />
              <ellipse cx="80" cy="36" rx="16" ry="3" fill="#E11D48" />
            </g>
          )}

          {/* Main Chubby Body / Head (Pear Shape) */}
          <path
            d="M 80 34 
               C 114 34, 134 56, 134 86 
               C 134 116, 126 142, 80 142 
               C 34 142, 26 116, 26 86 
               C 26 56, 46 34, 80 34 Z"
            fill="url(#furGradient)"
            stroke="#FED7AA"
            strokeWidth="2.5"
            filter="url(#softShadow)"
          />

          {/* White Belly Patch */}
          <ellipse cx="80" cy="112" rx="30" ry="24" fill="#FFFFFF" fillOpacity="0.85" />

          {/* Rosy Cheeks */}
          <ellipse cx="46" cy="94" rx="9" ry="6" fill="#FDA4AF" fillOpacity="0.65" />
          <ellipse cx="114" cy="94" rx="9" ry="6" fill="#FDA4AF" fillOpacity="0.65" />

          {/* Whiskers Left */}
          <path d="M 28 88 Q 38 90 44 91" stroke="#FDBA74" strokeWidth="2" strokeLinecap="round" />
          <path d="M 26 95 Q 36 96 44 96" stroke="#FDBA74" strokeWidth="2" strokeLinecap="round" />
          <path d="M 30 102 Q 38 101 44 99" stroke="#FDBA74" strokeWidth="2" strokeLinecap="round" />

          {/* Whiskers Right */}
          <path d="M 132 88 Q 122 90 116 91" stroke="#FDBA74" strokeWidth="2" strokeLinecap="round" />
          <path d="M 134 95 Q 124 96 116 96" stroke="#FDBA74" strokeWidth="2" strokeLinecap="round" />
          <path d="M 130 102 Q 122 101 116 99" stroke="#FDBA74" strokeWidth="2" strokeLinecap="round" />

          {/* Eyes */}
          {isWinking ? (
            <>
              {/* Left Eye: Big sparkle circle */}
              <circle cx="58" cy="80" r="7.5" fill="#1E0A2E" />
              <circle cx="56" cy="77.5" r="2.5" fill="#FFFFFF" />
              <circle cx="61" cy="82" r="1.2" fill="#FFFFFF" />
              {/* Right Eye: Cute Winking Arc */}
              <path
                d="M 94 81 Q 102 89 110 81"
                fill="none"
                stroke="#1E0A2E"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </>
          ) : isCelebrating ? (
            <>
              {/* Joyful curved arcs (^_^) */}
              <path
                d="M 50 82 Q 58 72 66 82"
                fill="none"
                stroke="#1E0A2E"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <path
                d="M 94 82 Q 102 72 110 82"
                fill="none"
                stroke="#1E0A2E"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </>
          ) : (
            <>
              {/* Standard Sweet Eyes */}
              <circle cx="58" cy="80" r="7.5" fill="#1E0A2E" />
              <circle cx="56" cy="77.5" r="2.5" fill="#FFFFFF" />
              <circle cx="61" cy="82" r="1.2" fill="#FFFFFF" />

              <circle cx="102" cy="80" r="7.5" fill="#1E0A2E" />
              <circle cx="100" cy="77.5" r="2.5" fill="#FFFFFF" />
              <circle cx="105" cy="82" r="1.2" fill="#FFFFFF" />
            </>
          )}

          {/* Tiny Nose */}
          <polygon points="80,87 76,83 84,83" fill="#E11D48" />

          {/* Cute Cat Mouth (ω) */}
          <path
            d="M 72 90 Q 76 96 80 91 Q 84 96 88 90"
            fill="none"
            stroke="#1E0A2E"
            strokeWidth="2.4"
            strokeLinecap="round"
          />

          {/* Red/Pink Lucky Collar */}
          <path
            d="M 50 115 Q 80 125 110 115"
            fill="none"
            stroke="#E11D48"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Golden Bell / Four-Leaf Clover Medallion */}
          <circle cx="80" cy="123" r="8" fill="url(#goldCoinGrad)" stroke="#B45309" strokeWidth="1.2" />
          <circle cx="80" cy="123" r="6" fill="#FDE047" />
          {/* Clover in center of bell */}
          <path
            d="M 80 120 C 79 119 77 119 77 121 C 77 122 79 123 80 123 C 81 123 83 122 83 121 C 83 119 81 119 80 120 Z
               M 77 123 C 76 122 74 123 75 125 C 76 126 77 125 78 124 Z
               M 83 123 C 84 122 86 123 85 125 C 84 126 83 125 82 124 Z
               M 80 126 C 79 127 80 128 81 128 C 82 128 81 126 80 124 Z"
            fill="#059669"
          />

          {/* Paws and Accessories based on Pose */}
          {isHoldingCoin ? (
            <>
              {/* Left Paw holding coin */}
              <ellipse cx="64" cy="120" rx="7" ry="6" fill="#FFF1E6" stroke="#FED7AA" strokeWidth="2" />
              {/* Giant Lucky Gold Coin */}
              <circle cx="88" cy="116" r="16" fill="url(#goldCoinGrad)" stroke="#B45309" strokeWidth="1.5" />
              <circle cx="88" cy="116" r="12.5" fill="none" stroke="#FDE047" strokeWidth="1" strokeDasharray="2 1" />
              <text
                x="88"
                y="122"
                textAnchor="middle"
                fontSize="15"
                fontWeight="900"
                fill="#92400E"
                fontFamily="system-ui, sans-serif"
              >
                $
              </text>
              {/* Right Paw holding edge */}
              <ellipse cx="102" cy="120" rx="7" ry="6" fill="#FFF1E6" stroke="#FED7AA" strokeWidth="2" />
            </>
          ) : isGachapon ? (
            <>
              {/* Gachapon Capsule held in paws */}
              <g transform="translate(64, 102)">
                {/* Top Half (Pink) */}
                <path d="M 0 16 A 16 16 0 0 1 32 16 Z" fill="url(#capsulePink)" stroke="#BE123C" strokeWidth="1" />
                {/* Bottom Half (Clear Glass) */}
                <path d="M 0 16 A 16 16 0 0 0 32 16 Z" fill="url(#capsuleGlass)" stroke="#38BDF8" strokeWidth="1" />
                {/* Capsule Center Seam */}
                <rect x="-1" y="14.5" width="34" height="3" rx="1.5" fill="#FFFFFF" />
                {/* Star prize inside */}
                <path d="M 16 18 L 17 21 L 20 21 L 18 23 L 19 26 L 16 24 L 13 26 L 14 23 L 12 21 L 15 21 Z" fill="#F59E0B" />
              </g>
              {/* Paws grasping capsule */}
              <ellipse cx="62" cy="118" rx="6.5" ry="5.5" fill="#FFF1E6" stroke="#FED7AA" strokeWidth="1.8" />
              <ellipse cx="98" cy="118" rx="6.5" ry="5.5" fill="#FFF1E6" stroke="#FED7AA" strokeWidth="1.8" />
            </>
          ) : isCheering || isCelebrating ? (
            <>
              {/* Both Paws raised high in victory! */}
              <m.ellipse
                cx="38"
                cy="62"
                rx="8"
                ry="7"
                fill="#FFF1E6"
                stroke="#FED7AA"
                strokeWidth="2"
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
              />
              <m.ellipse
                cx="122"
                cy="62"
                rx="8"
                ry="7"
                fill="#FFF1E6"
                stroke="#FED7AA"
                strokeWidth="2"
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
              />
              {/* Floating golden sparkle stars */}
              <path d="M 22 45 L 24 50 L 29 52 L 24 54 L 22 59 L 20 54 L 15 52 L 20 50 Z" fill="#F59E0B" />
              <path d="M 138 45 L 140 50 L 145 52 L 140 54 L 138 59 L 136 54 L 131 52 L 136 50 Z" fill="#F59E0B" />
            </>
          ) : (
            <>
              {/* Default Maneki-Neko Waving Paw gesture */}
              <ellipse cx="50" cy="116" rx="7.5" ry="6.5" fill="#FFF1E6" stroke="#FED7AA" strokeWidth="2" />
              {/* Right Waving Paw */}
              <m.g
                animate={{ rotate: [0, -16, 6, -16, 0] }}
                style={{ originX: '112px', originY: '110px' }}
                transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
              >
                <ellipse cx="112" cy="100" rx="8" ry="7" fill="#FFF1E6" stroke="#FED7AA" strokeWidth="2" />
                <circle cx="112" cy="98" r="3.5" fill="#FDA4AF" fillOpacity="0.8" />
                <circle cx="108" cy="95" r="1.5" fill="#FDA4AF" />
                <circle cx="112" cy="93" r="1.5" fill="#FDA4AF" />
                <circle cx="116" cy="95" r="1.5" fill="#FDA4AF" />
              </m.g>
            </>
          )}

          {/* Little feet at bottom */}
          <ellipse cx="60" cy="142" rx="9" ry="5" fill="#FFF1E6" stroke="#FED7AA" strokeWidth="1.8" />
          <ellipse cx="100" cy="142" rx="9" ry="5" fill="#FFF1E6" stroke="#FED7AA" strokeWidth="1.8" />
        </svg>
      </m.div>
    </div>
  );
};
