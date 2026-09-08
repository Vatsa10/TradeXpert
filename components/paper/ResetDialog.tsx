"use client";

import { useState } from "react";
import { toast } from "sonner";

import { ActionButton } from "@/components/app/ActionButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ResetDialog({
  open,
  onOpenChange,
  onReset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReset: () => Promise<void> | void;
}) {
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    setResetting(true);
    try {
      const res = await fetch("/api/paper/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to reset account");

      toast.success("Paper account reset");
      onOpenChange(false);
      await onReset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset account");
    } finally {
      setResetting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-hairline bg-surface-overlay text-ink">
        <DialogHeader>
          <DialogTitle>Reset paper account?</DialogTitle>
          <DialogDescription className="text-ink-secondary">
            This clears all simulated positions and trade history and restores your starting
            capital. It cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <ActionButton variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </ActionButton>
          <ActionButton variant="danger" onClick={handleReset} loading={resetting}>
            Reset account
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
