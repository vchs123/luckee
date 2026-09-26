import React from 'react';
import { LuckeeMascotToken } from "~/components/LuckeeMascotToken";

export { LuckeeMascotToken };

interface SvgIconProps {
  className?: string;
  size?: number;
}

// 1. Food: Chicken / Peri-Peri (Nando's)
export const ChickenSvg: React.FC<SvgIconProps> = ({ className = "w-5 h-5", size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M18.5 7.5c-1.8-2.2-4.9-2.5-7-.7-1.2 1-1.8 2.5-1.7 4-.1.3-.3.6-.6.8L6.4 14.4c-.8.8-2.1.8-2.9 0s-.8-2.1 0-2.9l1.1-1.1" stroke="#d97706" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12.5 13.5c2 2 4.5 2.5 6.5.5s1.5-4.5-.5-6.5" fill="#f59e0b" fillOpacity="0.25" stroke="#d97706" strokeWidth="2"/>
    <circle cx="15.5" cy="10.5" r="4.5" fill="#f59e0b" fillOpacity="0.4"/>
  </svg>
);

// 2. Food: Donut (Krispy Kreme)
export const DonutSvg: React.FC<SvgIconProps> = ({ className = "w-5 h-5", size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="9" fill="#fde68a" stroke="#d97706" strokeWidth="1.8"/>
    <path d="M3.5 11c1.5 2 3-1 5 1s2.5-1 4.5.5 3-1 5 1 2-1 2.5-.5" fill="#ec4899" fillOpacity="0.85" stroke="#db2777" strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="3.2" fill="#ffffff" stroke="#d97706" strokeWidth="1.8"/>
    <path d="M8 7h.01M16 8h.01M9 16h.01M15 15h.01M12 5h.01" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// 3. Food: Burrito / Taco (Mad Mex / Zambrero)
export const BurritoSvg: React.FC<SvgIconProps> = ({ className = "w-5 h-5", size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="3" y="7" width="18" height="10" rx="5" fill="#fed7aa" stroke="#ea580c" strokeWidth="1.8"/>
    <path d="M7 7c0 5 1.5 10 3 10M11 7c0 5 1.5 10 3 10M15 7c0 5 1.5 10 3 10" stroke="#f97316" strokeWidth="1.5" strokeDasharray="1.5 2"/>
    <circle cx="6" cy="12" r="1.5" fill="#16a34a"/>
  </svg>
);

// 4. Drink: Juice / Smoothie Cup (Boost Juice)
export const DrinkCupSvg: React.FC<SvgIconProps> = ({ className = "w-5 h-5", size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M7 8h10l-1.5 12h-7L7 8z" fill="#f43f5e" fillOpacity="0.25" stroke="#e11d48" strokeWidth="1.8" strokeLinejoin="round"/>
    <path d="M6 8h12" stroke="#be123c" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 4v4M15 2l-3 2" stroke="#10b981" strokeWidth="2" strokeLinecap="round"/>
    <path d="M9 13c1.5 1 4.5 1 6 0" stroke="#f43f5e" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

// 5. Food: Burger (Grill'd / McDonald's)
export const BurgerSvg: React.FC<SvgIconProps> = ({ className = "w-5 h-5", size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    {/* Bun Top */}
    <path d="M4 10c0-3.5 3.5-6 8-6s8 2.5 8 6H4z" fill="#fcd34d" stroke="#d97706" strokeWidth="1.8"/>
    {/* Patty */}
    <rect x="3" y="13" width="18" height="3" rx="1.5" fill="#78350f"/>
    {/* Lettuce */}
    <path d="M4 11.5c1.5 1 2.5-1 4 0s2.5-1 4 0 2.5-1 4 0 2.5-1 4 0" stroke="#16a34a" strokeWidth="2" strokeLinecap="round"/>
    {/* Bun Bottom */}
    <rect x="4" y="17" width="16" height="3" rx="1.5" fill="#fcd34d" stroke="#d97706" strokeWidth="1.8"/>
  </svg>
);

// 6. Food: Fries / Snack (McDonald's / Hungry Jack's)
export const FriesSvg: React.FC<SvgIconProps> = ({ className = "w-5 h-5", size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M7 10h10l-1.5 11h-7L7 10z" fill="#dc2626" stroke="#b91c1c" strokeWidth="1.8"/>
    <path d="M8 5v5M10 3v7M12 4v6M14 2v8M16 5v5" stroke="#facc15" strokeWidth="2.2" strokeLinecap="round"/>
    <path d="M10 14c1 1 3 1 4 0" stroke="#fef08a" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

// 7. Drink: Coffee Cup (Starbucks / Coffee Club)
export const CoffeeSvg: React.FC<SvgIconProps> = ({ className = "w-5 h-5", size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M4 8h12v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8z" fill="#047857" fillOpacity="0.15" stroke="#047857" strokeWidth="1.8"/>
    <path d="M16 10h2a3 3 0 0 1 0 6h-2" stroke="#047857" strokeWidth="1.8"/>
    <path d="M3 21h14" stroke="#047857" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M8 4c0 1 1 2 1 3M12 4c0 1 1 2 1 3" stroke="#059669" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// 8. Dessert: Ice Cream Cone (Cold Rock / Baskin-Robbins)
export const IceCreamSvg: React.FC<SvgIconProps> = ({ className = "w-5 h-5", size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="7.5" r="5" fill="#f472b6" stroke="#db2777" strokeWidth="1.8"/>
    <path d="M7 11l5 10 5-10H7z" fill="#fde68a" stroke="#d97706" strokeWidth="1.8" strokeLinejoin="round"/>
    <path d="M9 13l3 4M15 13l-3 4" stroke="#d97706" strokeWidth="1.2"/>
  </svg>
);

// 8b. Birthday Cake (Freebies & Celebration)
export const BirthdayCakeSvg: React.FC<SvgIconProps> = ({ className = "w-5 h-5", size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    {/* Candles */}
    <path d="M9 7v3M12 6v4M15 7v3" stroke="#f59e0b" strokeWidth="1.6" strokeLinecap="round"/>
    <circle cx="9" cy="5" r="1" fill="#ef4444"/>
    <circle cx="12" cy="4" r="1" fill="#f59e0b"/>
    <circle cx="15" cy="5" r="1" fill="#ef4444"/>
    {/* Cake Tier 1 */}
    <path d="M6 10h12a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1z" fill="#fce7f3" stroke="#ec4899" strokeWidth="1.6"/>
    {/* Icing waves */}
    <path d="M5 12c1.5 1 2.5-1 4 0s2.5-1 4 0 2.5-1 4 0 1.5-.5 2 0" stroke="#db2777" strokeWidth="1.4" strokeLinecap="round"/>
    {/* Cake Tier 2 / Plate */}
    <path d="M4 16h16a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z" fill="#fdf2f8" stroke="#be185d" strokeWidth="1.6"/>
    <path d="M2 20h20" stroke="#9d174d" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

// 9. Beauty: Mecca / Sephora / Cosmetics
export const BeautyCosmeticsSvg: React.FC<SvgIconProps> = ({ className = "w-5 h-5", size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    {/* Lipstick Base */}
    <rect x="8" y="11" width="8" height="10" rx="1" fill="#1e1b4b" stroke="#312e81" strokeWidth="1.8"/>
    {/* Lipstick Bullet */}
    <path d="M10 11V7l4-3v7H10z" fill="#e11d48" stroke="#be123c" strokeWidth="1.5"/>
    <rect x="7" y="10" width="10" height="2" rx="0.5" fill="#fbbf24"/>
  </svg>
);

// 10. Beauty: Perfume / Serum Bottle
export const PerfumeSvg: React.FC<SvgIconProps> = ({ className = "w-5 h-5", size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="6" y="9" width="12" height="12" rx="3" fill="#fbcfe8" stroke="#db2777" strokeWidth="1.8"/>
    <rect x="9.5" y="6" width="5" height="3" fill="#fbbf24" stroke="#d97706" strokeWidth="1.2"/>
    <circle cx="12" cy="4" r="1.5" fill="#db2777"/>
    <path d="M9 13h6M10 16h4" stroke="#db2777" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

// 11. Melbourne: Vintage Green & Gold Tram (Free Tram Zone)
export const MelbourneTramSvg: React.FC<SvgIconProps> = ({ className = "w-5 h-5", size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    {/* Tram Body */}
    <rect x="5" y="5" width="14" height="15" rx="3" fill="#065f46" stroke="#047857" strokeWidth="1.8"/>
    {/* Roof Trolley Pole */}
    <path d="M12 5V2M9 2h6" stroke="#eab308" strokeWidth="1.6" strokeLinecap="round"/>
    {/* Windshield */}
    <rect x="7" y="7" width="10" height="4" rx="1" fill="#bae6fd" stroke="#047857" strokeWidth="1.2"/>
    {/* Headlights */}
    <circle cx="8.5" cy="15.5" r="1.2" fill="#fde047"/>
    <circle cx="15.5" cy="15.5" r="1.2" fill="#fde047"/>
    {/* Cowcatcher / Wheels */}
    <path d="M7 20v2M17 20v2" stroke="#0f172a" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// 12. Landmark / Culture: Museum / NGV / Library
export const MuseumSvg: React.FC<SvgIconProps> = ({ className = "w-5 h-5", size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M3 9l9-6 9 6H3z" fill="#e0e7ff" stroke="#4f46e5" strokeWidth="1.8" strokeLinejoin="round"/>
    <path d="M5 9v9M9 9v9M15 9v9M19 9v9M2 20h20" stroke="#4f46e5" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

// 13. Park / Gardens: Royal Botanic Gardens
export const BotanicLeafSvg: React.FC<SvgIconProps> = ({ className = "w-5 h-5", size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M6 18c0-8 6-14 14-14 0 8-6 14-14 14z" fill="#bbf7d0" stroke="#16a34a" strokeWidth="1.8"/>
    <path d="M6 18c3-3 6-5 11-10" stroke="#16a34a" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);

// 14. Market / Laneway: Hosier Lane / QVM
export const LanewayArtSvg: React.FC<SvgIconProps> = ({ className = "w-5 h-5", size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="8" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.8"/>
    <path d="M9 10c0 1.5 2 1.5 2 3s-2 1.5-2 3" stroke="#ca8a04" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="15" cy="9" r="1.5" fill="#f43f5e"/>
    <circle cx="14" cy="14" r="1.5" fill="#3b82f6"/>
  </svg>
);

// 15. Luckee Mascot Token (Gold Arcade / Gachapon Medallion)
export const LuckyGoldCoinSvg: React.FC<SvgIconProps> = ({ className = "w-5 h-5", size = 20 }) => (
  <LuckeeMascotToken size={size} className={className} />
);

// 16. Gachapon Capsule Icon
export const GachaponCapsuleSvg: React.FC<SvgIconProps> = ({ className = "w-5 h-5", size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    {/* Top Half */}
    <path d="M4 12a8 8 0 0 1 16 0H4z" fill="#f43f5e" stroke="#be123c" strokeWidth="1.6"/>
    {/* Bottom Half */}
    <path d="M4 12a8 8 0 0 0 16 0H4z" fill="#e0f2fe" fillOpacity="0.8" stroke="#0284c7" strokeWidth="1.6"/>
    <line x1="3" y1="12" x2="21" y2="12" stroke="#ffffff" strokeWidth="2"/>
    <circle cx="12" cy="12" r="2.5" fill="#fbbf24"/>
  </svg>
);

// 17. Streak Flame
export const StreakFireSvg: React.FC<SvgIconProps> = ({ className = "w-5 h-5", size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 2c0 3.5-3 5.5-3 9 0 3.3 2.7 6 6 6s6-2.7 6-6c0-2-1-3.5-2-4.5 0 2-1 3.5-2.5 4-1-2-1-4.5-.5-6.5-2 1-4 3-4-2z" fill="#f97316" stroke="#ea580c" strokeWidth="1.6"/>
    <path d="M12 12c0 2 1.5 3.5 3.5 3.5s3.5-1.5 3.5-3.5c0-1.5-1-2.5-2-3 0 1-.5 1.5-1.5 1.8-.5-1-.5-2 0-3-1.5.8-2 2-2 4.2z" fill="#fde047"/>
  </svg>
);

// 18. Four-leaf Clover
export const FourLeafCloverSvg: React.FC<SvgIconProps> = ({ className = "w-5 h-5", size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 4c-1.5 0-2.8 1.2-2.8 2.8 0 1.8 2.8 3.2 2.8 3.2s2.8-1.4 2.8-3.2C14.8 5.2 13.5 4 12 4z" fill="#10b981"/>
    <path d="M12 20c-1.5 0-2.8-1.2-2.8-2.8 0-1.8 2.8-3.2 2.8-3.2s2.8 1.4 2.8 3.2c0 1.6-1.3 2.8-2.8 2.8z" fill="#059669"/>
    <path d="M4 12c0-1.5 1.2-2.8 2.8-2.8 1.8 0 3.2 2.8 3.2 2.8s-1.4 2.8-3.2 2.8C5.2 14.8 4 13.5 4 12z" fill="#10b981"/>
    <path d="M20 12c0-1.5-1.2-2.8-2.8-2.8-1.8 0-3.2 2.8-3.2 2.8s1.4 2.8 3.2 2.8c1.6 0 2.8-1.3 2.8-2.8z" fill="#059669"/>
    <path d="M12 12c0 3 2 7 5 9" stroke="#047857" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

// 19. Sparkle Star
export const SparkleStarSvg: React.FC<SvgIconProps> = ({ className = "w-5 h-5", size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="#facc15" stroke="#eab308" strokeWidth="1.2"/>
  </svg>
);

// Helper function to resolve emoji or brand key to clean SVG
export function renderBrandOrEmojiSvg(emojiOrKey: string, size = 20, className = 'w-5 h-5'): React.ReactNode {
  switch (emojiOrKey) {
    case '🍗':
    case 'nandos':
      return <ChickenSvg size={size} className={className} />;
    case '🍩':
    case 'krispy-kreme':
      return <DonutSvg size={size} className={className} />;
    case '🌯':
    case 'mad-mex':
    case 'zambrero':
      return <BurritoSvg size={size} className={className} />;
    case '🥤':
    case 'boost-juice':
    case 'chatime':
      return <DrinkCupSvg size={size} className={className} />;
    case '🍟':
    case 'mcdonalds':
    case 'hungry-jacks':
      return <FriesSvg size={size} className={className} />;
    case '🍔':
    case 'grilld':
    case 'bettys-burgers':
      return <BurgerSvg size={size} className={className} />;
    case '☕':
    case 'starbucks':
    case 'coffee-club':
      return <CoffeeSvg size={size} className={className} />;
    case '🍦':
    case 'cold-rock':
    case 'baskin-robbins':
      return <IceCreamSvg size={size} className={className} />;
    case '🎂':
    case 'birthday':
    case 'cake':
      return <BirthdayCakeSvg size={size} className={className} />;
    case '💄':
    case 'mecca':
    case 'sephora':
    case 'priceline':
      return <BeautyCosmeticsSvg size={size} className={className} />;
    case '✨':
    case 'sparkles':
      return <SparkleStarSvg size={size} className={className} />;
    case '🚋':
    case 'tram':
      return <MelbourneTramSvg size={size} className={className} />;
    case '🏛️':
    case 'museum':
    case 'ngv':
      return <MuseumSvg size={size} className={className} />;
    case '🌿':
    case 'botanic':
      return <BotanicLeafSvg size={size} className={className} />;
    case '🎨':
    case 'laneway':
      return <LanewayArtSvg size={size} className={className} />;
    case '🍀':
    case 'luckee':
      return <FourLeafCloverSvg size={size} className={className} />;
    case '⭐':
    case 'coins':
      return <LuckyGoldCoinSvg size={size} className={className} />;
    case '⚡':
    case 'streak':
      return <StreakFireSvg size={size} className={className} />;
    default:
      // No brand icon for this one — show the emoji itself rather than a coin,
      // which would misrepresent the offer.
      return (
        <span aria-hidden className={className} style={{ fontSize: size, lineHeight: 1 }}>
          {emojiOrKey}
        </span>
      );
  }
}
