"use client";

import { useCallback, useEffect, useState } from "react";
import { Link2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface KiteStatus {
  configured: boolean;
  connected: boolean;
  kiteUserId?: string | null;
}

export default function KiteConnectButton({ className }: { className?: string }) {
  const [status, setStatus] = useState<KiteStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/kite/status", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));

      // Treat any failure as "not configured" — this widget must never break
      // the page it is mounted on.
      setStatus({
        configured: Boolean(json?.configured) && res.ok,
        connected: Boolean(json?.connected) && res.ok,
        kiteUserId: typeof json?.kiteUserId === "string" ? json.kiteUserId : null,
      });
    } catch {
      setStatus({ configured: false, connected: false, kiteUserId: null });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Kite is a personal, owner-only broker link. Anyone who is not the owner
  // (or any deployment without broker keys) sees nothing at all — not a
  // placeholder, not an explanation. Rendering "keys not set" advertised a
  // feature that other accounts can never use.
  if (loading || !status?.configured) return null;

  if (!status.connected) {
    return (
      <button
        type="button"
        onClick={() => {
          window.location.href = "/api/kite/login";
        }}
        className={cn(
          "app-press app-focus flex cursor-pointer items-center gap-2 rounded-md border border-brand/40 bg-brand/10 px-3 py-2 text-sm font-medium text-brand hover:bg-brand/20",
          className
        )}
      >
        <Link2 className="size-4" />
        Connect Zerodha Kite
      </button>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 rounded-md border border-positive/30 bg-positive/10 px-3 py-2 text-sm",
        className
      )}
    >
      <span className="flex items-center gap-2 font-medium text-positive">
        <span className="size-2 rounded-full bg-positive" />
        Kite connected
        {status.kiteUserId ? (
          <span className="text-ink-secondary">({status.kiteUserId})</span>
        ) : null}
      </span>
      <span className="text-xs text-ink-faint">
        Session expires daily — reconnect each trading morning.
      </span>
    </div>
  );
}
