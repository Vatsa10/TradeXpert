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
          "flex cursor-pointer items-center gap-2 rounded-lg border border-yellow-600/60 bg-yellow-500/10 px-3 py-2 text-sm font-medium text-yellow-500 transition-colors hover:bg-yellow-500/20",
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
        "flex flex-col gap-0.5 rounded-lg border border-emerald-800/60 bg-emerald-500/10 px-3 py-2 text-sm",
        className
      )}
    >
      <span className="flex items-center gap-2 font-medium text-emerald-400">
        <span className="size-2 rounded-full bg-emerald-400" />
        Kite connected
        {status.kiteUserId ? (
          <span className="text-gray-400">({status.kiteUserId})</span>
        ) : null}
      </span>
      <span className="text-xs text-gray-500">
        Session expires daily — reconnect each trading morning.
      </span>
    </div>
  );
}
