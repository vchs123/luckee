import type { Deal, BlossomTier } from "./types";

export const BLOSSOM_TIERS: BlossomTier[] = [
  {
    name: "Blossom Save",
    rate: "5.95% p.a. target",
    from: "from $50",
    access: "fast withdrawals",
    compounding: "daily compounding",
  },
  {
    name: "Blossom Plus",
    rate: "6.50% p.a. target",
    from: "from $5,000",
    access: "quarterly access",
    compounding: "daily earnings",
  },
  {
    name: "Blossom Grow",
    rate: "7.00% p.a. target",
    from: "from $5,000",
    access: "12-month term",
    compounding: "annual compounding",
  },
];

export const DEALS: Deal[] = [
  {
    cls: "cld", e: "🤖", n: "Claude Pro", sub: "Anthropic · AI assistant",
    reward: "7-day free trial", rl: "Try Claude Pro",
    desc: "The AI I use every day for work, writing, research and building Luckee. Claude Pro gives access to the most capable models with more usage than the free tier. Try it free for 7 days.",
    code: null,
    tags: ["🌍 Global", "💻 Web & mobile", "🧠 AI"],
    cta: "Start 7-day free trial →",
    link: "https://claude.ai",
  },
  {
    cls: "bls", e: "🌸", n: "Blossom", sub: "Savings & investment app · Australia",
    reward: "$10 bonus on first $50 deposit", rl: "Referral bonus",
    desc: "Reach your savings goals faster than with a bank. Three products to match your timeline — Save for everyday access, Plus for quarterly withdrawals, Grow for 12-month terms.",
    code: null,
    tags: ["🇦🇺 Australia only", "📱 iOS & Android", "💰 Finance"],
    cta: "Get $10 bonus →",
    link: "https://blossom.com.au",
  },
  {
    cls: "krs", e: "✈️", n: "Kris+", sub: "Singapore Airlines lifestyle app",
    reward: "500 KrisPay miles on first $5 spend", rl: "Code: C506127",
    desc: "Earn KrisPay miles on everyday spending across five categories: dining, retail, activities, services and wellness. 100+ partners. Worth having if you fly SQ.",
    code: "C506127",
    tags: ["🍽️ Dining", "🛍️ Retail", "🏃 Activities", "💆 Wellness"],
    cta: "Join Kris+ →",
    link: "https://www.singaporeair.com/en_UK/sg/ppsclub-krisflyer/kris-plus/",
  },
  {
    cls: "mac", e: "🚶", n: "Macadam", sub: "Walking rewards app · Australia",
    reward: "1,000 coins on sign-up", rl: "Code: RE65K8",
    desc: "A walking rewards app. Earn coins for every step you take and redeem via PayPal, Visa gift cards or Amazon vouchers. The more you walk, the more you earn.",
    code: "RE65K8",
    tags: ["🇦🇺 Australia", "🚶 Walking app", "💳 PayPal · Visa · Amazon"],
    cta: "Join Macadam →",
    link: "https://macadam.com.au",
  },
];
