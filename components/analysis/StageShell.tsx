"use client";

import * as React from "react";
import { LoaderCircle, X } from "lucide-react";

import { ErrorState, Panel, Skeleton } from "@/components/system";

/** Shared frame for a completed agent stage. */
export function StageCard({
  icon,
  title,
  error,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <Panel
      className="app-enter"
      title={
        <span className="flex items-center gap-2">
          {icon}
          <span className="app-label">{title}</span>
        </span>
      }
    >
      <div className="space-y-4">
        {error && <ErrorState message={error} />}
        {children}
      </div>
    </Panel>
  );
}

/** Body text block with a micro-label, used by both agent cards. */
export function StageProse({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h4 className="app-label">{label}</h4>
      <p className="text-sm leading-relaxed whitespace-pre-wrap text-ink-secondary">{children}</p>
    </div>
  );
}

/** A stage that failed with nothing to render — the other cards keep going. */
export function StageErrorCard({ title, message }: { title: string; message: string }) {
  return (
    <Panel
      className="app-enter"
      title={
        <span className="flex items-center gap-2 text-negative">
          <X className="size-3.5" aria-hidden />
          <span className="app-label">{title}</span>
        </span>
      }
    >
      <ErrorState message={message} />
    </Panel>
  );
}

/** Placeholder shown while an agent is still running. */
export function StageSkeleton({ label }: { label: string }) {
  return (
    <Panel
      title={
        <span className="flex items-center gap-2">
          <LoaderCircle className="size-3.5 text-brand motion-safe:animate-spin" aria-hidden />
          <span className="app-label">{label}</span>
        </span>
      }
    >
      <div className="space-y-4" aria-hidden>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      </div>
    </Panel>
  );
}
