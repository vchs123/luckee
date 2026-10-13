/**
 * Outbound referral click: analytics event, click row, and points for signed-in
 * users. Shared by every deal surface so the three recordings can't drift apart.
 *
 * `awardPoints: false` is for callers that submit the award themselves
 * (ReferralDealCard uses a fetcher so it can show a "+n pts" toast). The server
 * pays a deal click at most once per deal per day.
 */
export function trackDealClick(deal: { n: string; cls: string }, { awardPoints = true } = {}) {
  const dealName = deal.n;
  if (typeof window !== "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gtag = (window as any).gtag;
    if (gtag) gtag("event", "referral_click", { deal_name: dealName });
  }

  fetch("/api/track-click", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deal_name: dealName }),
  }).catch(() => {});

  if (awardPoints) {
    fetch("/api/award-points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // The server identifies the deal by code and writes the ledger text itself.
      body: JSON.stringify({ action: "deal_click", deal: deal.cls }),
    }).catch(() => {});
  }
}
