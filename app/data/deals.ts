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
    link: "https://claude.ai/referral/BICinJTaaw",
  },
  {
    cls: "bls", e: "🌸", n: "Blossom", sub: "Savings & rewards app · Australia",
    reward: "$10 bonus on first deposit", rl: "Referral bonus",
    desc: "A savings and rewards app that helps you build good financial habits. Deposit $50, earn $10 instantly. I use it to ringfence specific savings goals.",
    code: "JEPAL6LS",
    tags: ["🇦🇺 Australia only", "📱 iOS & Android", "💰 Finance"],
    cta: "Get $10 bonus →",
    link: "https://app.blossomapp.com/auth/home?ref=MqARJk3LGTTaik6c9",
  },
  {
    cls: "krs", e: "✈️", n: "Kris+", sub: "Singapore Airlines lifestyle app",
    reward: "500 KrisPay miles on first $5 spend", rl: "Code: C506127",
    desc: "The lifestyle rewards app from Singapore Airlines. Earn KrisPay miles on everyday spending at 100+ partners — restaurants, retail, entertainment. Worth having if you fly SQ.",
    code: "C506127",
    tags: ["🇦🇺 Australia", "🌍 Global", "🎁 Miles & rewards"],
    cta: "Join Kris+ →",
    link: "https://app.krisplus.com/BAOwqtUTU4b",
  },
  {
    cls: "rvl", e: "💳", n: "Revolut", sub: "Digital banking & money transfers · Australia",
    reward: "$15 cash bonus", rl: "Referral bonus — DM us on IG first",
    desc: "The card I use for overseas spending and fee-free international transfers. To get your $15 bonus, DM Luckee on Instagram before signing up — then use my referral link. The bonus is applied once you activate your card.",
    code: null,
    tags: ["🇦🇺 Australia", "💳 Banking", "🌍 Travel & transfers"],
    cta: "Get $15 with Revolut →",
    link: "https://revolut.com/referral/?referral-code=vanesskirh!JUL2-26-AR-AU-H1&geo-redirect",
  },
  {
    cls: "mac", e: "🚶", n: "Macadam", sub: "Walking rewards app · Australia",
    reward: "1,000 coins on sign-up", rl: "Code: RE65K8",
    desc: "A walking rewards app. Earn coins for every step you take and redeem via PayPal, Visa gift cards or Amazon vouchers. The more you walk, the more you earn.",
    code: "RE65K8",
    tags: ["🇦🇺 Australia", "🚶 Walking app", "💳 PayPal · Visa · Amazon"],
    cta: "Join Macadam →",
    link: "https://macadam.app/i/re65k8?v=3",
  },
];
