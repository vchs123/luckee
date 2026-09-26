import React, { useState } from 'react';
import { m } from "framer-motion";
import { playCoinSparkle } from "~/lib/sound";

export interface LuckeeMascotTokenProps {
  size?: number;
  className?: string;
  animateShimmer?: boolean;
  animateSpin?: boolean;
  interactive?: boolean;
  showGlow?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const LuckeeMascotToken: React.FC<LuckeeMascotTokenProps> = ({
  size = 36,
  className = '',
  animateShimmer = false,
  animateSpin = false,
  interactive = false,
  showGlow = false,
  style,
  onClick,
}) => {
  const [isFlipping, setIsFlipping] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (interactive) {
      setIsFlipping(true);
      playCoinSparkle();
      setTimeout(() => setIsFlipping(false), 700);
    }
    if (onClick) {
      onClick();
    }
  };

  return (
    <m.div
      className={`inline-flex items-center justify-center select-none relative ${
        interactive ? 'cursor-pointer' : ''
      } ${className}`}
      style={{ width: size, height: size, ...style }}
      onClick={handleClick}
      whileHover={interactive ? { scale: 1.1, y: -1 } : undefined}
      whileTap={interactive ? { scale: 0.92 } : undefined}
      animate={
        isFlipping
          ? { rotateY: [0, 180, 360], scale: [1, 1.25, 1], y: [0, -8, 0] }
          : animateSpin
          ? { rotateY: [0, 360] }
          : undefined
      }
      transition={
        isFlipping
          ? { duration: 0.65, ease: 'easeOut' }
          : animateSpin
          ? { repeat: Infinity, duration: 4, ease: 'linear' }
          : undefined
      }
      title={interactive ? 'Luckee Mascot Token (Click to flip!)' : 'Luckee Mascot Token'}
    >
      {showGlow && (
        <div 
          className="absolute inset-0 rounded-full blur-md bg-[#fbbf24] opacity-50 -z-10 pointer-events-none"
          style={{ transform: 'scale(1.25)' }}
        />
      )}

      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm overflow-visible"
      >
        <defs>
          {/* Outer Coin Rim Gradient */}
          <linearGradient id="coinOuterRimGrad" x1="15" y1="10" x2="85" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFF9C4" />
            <stop offset="25%" stopColor="#F59E0B" />
            <stop offset="60%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>

          {/* Raised Bevel Highlight */}
          <linearGradient id="coinBevelGrad" x1="50" y1="5" x2="50" y2="95" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="40%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>

          {/* Sunken Medallion Center Gradient */}
          <radialGradient id="coinCenterGrad" cx="50" cy="45" r="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="60%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </radialGradient>

          {/* Luckee Mascot Face Enamel / Fur Gradient */}
          <linearGradient id="tokenFurGrad" x1="50" y1="28" x2="50" y2="76" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="70%" stopColor="#FFF7ED" />
            <stop offset="100%" stopColor="#FED7AA" />
          </linearGradient>

          {/* Shimmer Specular Sweep */}
          <linearGradient id="tokenShimmerGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.75" />
            <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* Clip Path for the inner coin area to contain light sheen */}
          <clipPath id="coinClip">
            <circle cx="50" cy="50" r="46" />
          </clipPath>
        </defs>

        {/* 1. Deep Coin Edge Shadow */}
        <circle cx="50" cy="53" r="46" fill="#78350F" opacity="0.4" />

        {/* 2. Coin Base & Serrated Arcade Notches (Edge Ridges) */}
        <g stroke="#92400E" strokeWidth="2.5" strokeLinecap="round">
          {Array.from({ length: 16 }).map((_, i) => {
            const angle = (i * 360) / 16;
            const rad = (angle * Math.PI) / 180;
            const x1 = 50 + 44.5 * Math.cos(rad);
            const y1 = 50 + 44.5 * Math.sin(rad);
            const x2 = 50 + 47.5 * Math.cos(rad);
            const y2 = 50 + 47.5 * Math.sin(rad);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
          })}
        </g>

        {/* 3. Outer Polished Gold Rim */}
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="url(#coinOuterRimGrad)"
          stroke="#1E0A2E"
          strokeWidth="3.2"
        />

        {/* 4. Raised Step Bevel */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="url(#coinBevelGrad)"
          strokeWidth="2"
        />

        {/* 5. Lathe Beaded / Dotted Ring */}
        <circle
          cx="50"
          cy="50"
          r="37"
          fill="none"
          stroke="#92400E"
          strokeWidth="1.2"
          strokeDasharray="2 3"
          opacity="0.85"
        />

        {/* 6. Sunken Medallion Center Bed */}
        <circle
          cx="50"
          cy="50"
          r="34"
          fill="url(#coinCenterGrad)"
          stroke="#78350F"
          strokeWidth="2"
        />

        {/* Concentric Lathe Grooves inside medallion */}
        <circle cx="50" cy="50" r="30" fill="none" stroke="#FDE047" strokeWidth="0.8" opacity="0.4" />
        <circle cx="50" cy="50" r="26" fill="none" stroke="#FDE047" strokeWidth="0.8" opacity="0.3" />

        {/* 7. Token Embossed Text / Stars along border */}
        {/* Top Arc Stars */}
        <path d="M 50 17 L 51.5 20 L 54.5 20.5 L 52.2 22.5 L 53 25.5 L 50 23.8 L 47 25.5 L 47.8 22.5 L 45.5 20.5 L 48.5 20 Z" fill="#FFF9C4" stroke="#92400E" strokeWidth="0.6" transform="translate(0, -2) scale(0.65) translate(27, 2)" />
        <path d="M 50 17 L 51.5 20 L 54.5 20.5 L 52.2 22.5 L 53 25.5 L 50 23.8 L 47 25.5 L 47.8 22.5 L 45.5 20.5 L 48.5 20 Z" fill="#FFF9C4" stroke="#92400E" strokeWidth="0.6" transform="translate(-18, 4) scale(0.55) translate(40, 0)" />
        <path d="M 50 17 L 51.5 20 L 54.5 20.5 L 52.2 22.5 L 53 25.5 L 50 23.8 L 47 25.5 L 47.8 22.5 L 45.5 20.5 L 48.5 20 Z" fill="#FFF9C4" stroke="#92400E" strokeWidth="0.6" transform="translate(18, 4) scale(0.55) translate(40, 0)" />

        {/* Bottom Arc Text: "★ LUCKEE ★" */}
        <text
          x="50"
          y="86.5"
          textAnchor="middle"
          fontSize="6.5"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          fill="#FFFBEB"
          stroke="#78350F"
          strokeWidth="0.6"
          letterSpacing="1.2"
        >
          ★ LUCKEE ★
        </text>

        {/* 8. CENTER LUCKEE MASCOT FACE */}
        <g transform="translate(50, 48) scale(0.46) translate(-80, -78)">
          {/* Head Shadow */}
          <path
            d="M 80 36 C 112 36, 132 58, 132 86 C 132 114, 124 136, 80 136 C 36 136, 28 114, 28 86 C 28 58, 48 36, 80 36 Z"
            fill="#B45309"
            opacity="0.3"
            transform="translate(0, 3)"
          />

          {/* Left Cat Ear */}
          <path
            d="M 40 68 C 32 50, 34 26, 46 20 C 58 22, 68 44, 70 58 Z"
            fill="url(#tokenFurGrad)"
            stroke="#1E0A2E"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          {/* Left Inner Ear Pink */}
          <path
            d="M 44 60 C 39 46, 42 30, 49 27 C 56 31, 62 46, 62 55 Z"
            fill="#FDA4AF"
          />

          {/* Right Cat Ear */}
          <path
            d="M 120 68 C 128 50, 126 26, 114 20 C 102 22, 92 44, 90 58 Z"
            fill="url(#tokenFurGrad)"
            stroke="#1E0A2E"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          {/* Right Inner Ear Pink */}
          <path
            d="M 116 60 C 121 46, 118 30, 111 27 C 104 31, 98 46, 98 55 Z"
            fill="#FDA4AF"
          />

          {/* Mascot Head Body */}
          <path
            d="M 80 36 C 112 36, 132 58, 132 86 C 132 114, 124 136, 80 136 C 36 136, 28 114, 28 86 C 28 58, 48 36, 80 36 Z"
            fill="url(#tokenFurGrad)"
            stroke="#1E0A2E"
            strokeWidth="4.5"
          />

          {/* Forehead Star / Clover Crest */}
          <path
            d="M 80 44 L 81.8 48.5 L 86.5 49.5 L 83 52.8 L 84 57.5 L 80 55 L 76 57.5 L 77 52.8 L 73.5 49.5 L 78.2 48.5 Z"
            fill="#F59E0B"
            stroke="#92400E"
            strokeWidth="1.2"
          />

          {/* Rosy Pink Cheeks */}
          <ellipse cx="48" cy="94" rx="10" ry="7" fill="#FB7185" fillOpacity="0.85" />
          <ellipse cx="112" cy="94" rx="10" ry="7" fill="#FB7185" fillOpacity="0.85" />

          {/* Whiskers */}
          <path d="M 32 89 Q 40 91 46 91" stroke="#1E0A2E" strokeWidth="3" strokeLinecap="round" />
          <path d="M 30 96 Q 40 96 46 95" stroke="#1E0A2E" strokeWidth="3" strokeLinecap="round" />
          <path d="M 128 89 Q 120 91 114 91" stroke="#1E0A2E" strokeWidth="3" strokeLinecap="round" />
          <path d="M 130 96 Q 120 96 114 95" stroke="#1E0A2E" strokeWidth="3" strokeLinecap="round" />

          {/* Left Eye: Big sparkle circle with dual glint */}
          <circle cx="58" cy="80" r="8" fill="#1E0A2E" />
          <circle cx="56" cy="77" r="2.8" fill="#FFFFFF" />
          <circle cx="61" cy="82" r="1.4" fill="#FFFFFF" />

          {/* Right Eye: Cute Winking Arc */}
          <path
            d="M 94 80 Q 102 89 110 80"
            fill="none"
            stroke="#1E0A2E"
            strokeWidth="4.5"
            strokeLinecap="round"
          />

          {/* Cute Cat Nose & Mouth :3 */}
          <ellipse cx="80" cy="88" rx="3.5" ry="2.5" fill="#E11D48" />
          <path
            d="M 74 91 Q 80 97 86 91"
            fill="none"
            stroke="#1E0A2E"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </g>

        {/* 9. Top Glass Gloss Curve */}
        <g clipPath="url(#coinClip)">
          <path
            d="M 15 28 C 30 16, 70 16, 85 28 C 72 38, 28 38, 15 28 Z"
            fill="#FFFFFF"
            fillOpacity="0.45"
          />
          <ellipse
            cx="32"
            cy="24"
            rx="8"
            ry="4"
            transform="rotate(-25 32 24)"
            fill="#FFFFFF"
            fillOpacity="0.6"
          />

          {/* Animated specular shimmer sweep across the coin */}
          {animateShimmer && (
            <m.rect
              x="-100"
              y="-10"
              width="60"
              height="120"
              transform="rotate(25 50 50)"
              fill="url(#tokenShimmerGrad)"
              animate={{ x: [-80, 140] }}
              transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut', repeatDelay: 1.2 }}
            />
          )}
        </g>
      </svg>
    </m.div>
  );
};
