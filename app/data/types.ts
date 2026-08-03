export interface Freebie {
  e: string;
  n: string;
  pg: string;
  r: string;
  m: string;
  t: string;
  c: string | null;
  ns: boolean;
  link: string;
  cat: "food" | "bty" | "sgn";
}

export interface Experience {
  e: string;
  cat: string;
  n: string;
  d: string;
  t: string;
  col: "melb" | "amber";
  lat?: number;
  lng?: number;
}

export interface Event {
  month: string;
  n: string;
  d: string;
  f: boolean;
}

export interface Deal {
  cls: "cld" | "bls" | "krs" | "mac" | "rvl";
  e: string;
  n: string;
  sub: string;
  reward: string;
  rl: string;
  desc: string;
  code: string | null;
  tags: string[];
  cta: string;
  link: string;
}

export interface BlossomTier {
  name: string;
  rate: string;
  from: string;
  access: string;
  compounding: string;
}
