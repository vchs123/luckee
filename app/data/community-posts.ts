/**
 * Illustrative pins for the community bulletin, shown while submissions are
 * closed. These are examples of the kind of find people will be able to pin —
 * they are labelled as examples in the UI and deliberately carry no author
 * names, vote counts or timestamps, so nothing on the page implies community
 * activity that hasn't happened yet.
 *
 * When submissions open, this file is replaced by approved rows from the
 * database (pending → approved, reviewed in the admin dashboard).
 */
export interface ExamplePin {
  id: string;
  avatar: string;
  dealTitle: string;
  savings: string;
  store: string;
  comment: string;
  badge: string;
}

export const EXAMPLE_PINS: ExamplePin[] = [
  {
    id: "example-bubble-tea",
    avatar: "🧋",
    dealTitle: "First-order voucher on a bubble tea app",
    savings: "About $5 off",
    store: "Chinatown",
    comment:
      "The kind of find that belongs here: a sign-up voucher on a store app, with the steps that actually worked.",
    badge: "Example pin",
  },
  {
    id: "example-student",
    avatar: "🎓",
    dealTitle: "Student discount that isn't advertised in store",
    savings: "10–20% off",
    store: "CBD",
    comment:
      "Tell people what to ask for at the counter and which card they need to show.",
    badge: "Example pin",
  },
  {
    id: "example-happy-hour",
    avatar: "🍜",
    dealTitle: "Weeknight happy hour worth the trip",
    savings: "Half price",
    store: "Northside",
    comment: "Include the days and times — the details are what make a pin useful.",
    badge: "Example pin",
  },
  {
    id: "example-loyalty",
    avatar: "☕",
    dealTitle: "Loyalty app freebie after the first scan",
    savings: "One free item",
    store: "Multiple suburbs",
    comment: "Say how long it took to arrive and whether it worked in store or online.",
    badge: "Example pin",
  },
];
