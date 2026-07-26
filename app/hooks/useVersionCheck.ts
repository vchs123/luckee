import { useEffect, useRef, useState } from "react";

export function useVersionCheck() {
  const initialVersion = useRef<string | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/version.json", { cache: "no-store" });
        if (!res.ok) return;
        const { version } = await res.json() as { version: string };
        if (initialVersion.current === null) {
          initialVersion.current = version;
        } else if (version !== initialVersion.current) {
          setUpdateAvailable(true);
        }
      } catch { /* ignore network errors */ }
    };

    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, []);

  return updateAvailable;
}
