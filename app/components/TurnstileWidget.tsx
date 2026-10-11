import { useEffect, useRef, useState } from "react";

/*
 * Cloudflare Turnstile, rendered explicitly.
 *
 * Explicit rendering because this is a client-routed app: the script's automatic
 * scan of `.cf-turnstile` divs only runs once, when the script first loads, so a
 * form reached by client-side navigation would never get a widget.
 *
 * The widget writes its token into a hidden `cf-turnstile-response` input inside
 * the container, so it rides along with whatever <Form> it sits in. Tokens are
 * single-use: bump `resetKey` after each submission so a retry gets a fresh one.
 */

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id: string) => void;
      remove: (id: string) => void;
    };
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  scriptPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null; // allow a later retry
      reject(new Error("turnstile script failed to load"));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export type TurnstileStatus = "loading" | "ready" | "error";

interface Props {
  siteKey: string;
  action: string;
  /** Change this to get a fresh token (tokens are single-use). */
  resetKey?: unknown;
  onStatus?: (status: TurnstileStatus) => void;
}

export function TurnstileWidget({ siteKey, action, resetKey, onStatus }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const idRef = useRef<string | null>(null);
  const statusRef = useRef(onStatus);
  statusRef.current = onStatus;

  useEffect(() => {
    let cancelled = false;
    let settled = false;
    const report = (s: TurnstileStatus) => {
      if (s !== "loading") settled = true;
      statusRef.current?.(s);
    };
    report("loading");
    // A check that never answers (blocked script, stalled challenge) would
    // otherwise leave the button disabled with no explanation.
    const watchdog = setTimeout(() => {
      if (!cancelled && !settled) report("error");
    }, 20_000);

    loadScript()
      .then(() => {
        if (cancelled || !ref.current || !window.turnstile) return;
        idRef.current = window.turnstile.render(ref.current, {
          sitekey: siteKey,
          action,
          callback: () => report("ready"),
          "expired-callback": () => report("loading"),
          "error-callback": () => report("error"),
          "timeout-callback": () => report("error"),
        });
      })
      .catch(() => {
        if (!cancelled) report("error");
      });

    return () => {
      cancelled = true;
      clearTimeout(watchdog);
      if (idRef.current && window.turnstile) window.turnstile.remove(idRef.current);
      idRef.current = null;
    };
  }, [siteKey, action]);

  // A submitted token is spent; fetch a new one for the next attempt.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (idRef.current && window.turnstile) {
      statusRef.current?.("loading");
      window.turnstile.reset(idRef.current);
    }
  }, [resetKey]);

  return <div ref={ref} style={{ margin: "12px 0", minHeight: 65 }} />;
}

/** Shown under the widget so a stuck check never looks like a dead button. */
export function turnstileHint(status: TurnstileStatus): string | null {
  if (status === "loading") return "Checking you're human…";
  if (status === "error") return "The security check couldn't load. Refresh the page, or continue with Google.";
  return null;
}
