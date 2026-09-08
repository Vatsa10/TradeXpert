
"use client";

import { useEffect, useState } from "react";
import { getAnalysisHistoryAction, deleteAnalysisAction } from "@/lib/actions/analysis.actions";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { BarChart2, History, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge, EmptyState, Skeleton } from "@/components/system";
import { useRouter } from "next/navigation";

interface HistoryItem {
  requestId: string;
  symbol: string;
  companyName: string;
  createdAt: string;
  status: string;
}

export default function AnalysisHistory({ 
  onSelect, 
  onCompare,
  selectedIds = [] 
}: { 
  onSelect: (id: string) => void;
  onCompare: (ids: string[]) => void;
  selectedIds?: string[];
}) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchHistory = async () => {
    try {
      const data = await getAnalysisHistoryAction();
      setHistory(data);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteAnalysisAction(id);
      setHistory(prev => prev.filter(item => item.requestId !== id));
      toast.success("Analysis deleted");
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const handleCheckboxChange = (id: string, checked: boolean) => {
    if (checked) {
      if (selectedIds.length >= 2) {
        toast.warning("You can only compare 2 stocks at a time");
        return;
      }
      onCompare([...selectedIds, id]);
    } else {
      onCompare(selectedIds.filter(i => i !== id));
    }
  };

  return (
    <div className="flex h-full flex-col bg-transparent">
      {/* Sidebar Header */}
      <div className="border-b border-hairline bg-surface-raised p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="size-4 text-ink-faint" />
            <div>
              <h2 className="app-label text-ink">History</h2>
              <p className="text-xs text-ink-faint tnum">{history.length} Reports</p>
            </div>
          </div>
          {selectedIds.length === 2 && (
            <Button
              size="sm"
              className="app-press app-focus h-8 rounded-md bg-brand px-4 text-xs font-semibold text-brand-ink hover:bg-brand-hover"
              onClick={() => router.push(`/analysis/compare?ids=${selectedIds.join(",")}`)}
            >
              Compare
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="custom-scrollbar flex-1">
        <div className="space-y-2 p-3">
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-[74px] w-full rounded-lg" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <EmptyState
              className="py-16"
              icon={<BarChart2 className="size-6" />}
              title="No history"
              description="Your analysis will appear here."
            />
          ) : (
            history.map((item, i) => (
              <div
                key={item.requestId}
                style={{ "--i": i } as React.CSSProperties}
                className={cn(
                  "app-enter app-press group relative cursor-pointer rounded-lg border p-3",
                  selectedIds.includes(item.requestId)
                    ? "border-brand/30 bg-brand/10"
                    : "border-hairline bg-surface-raised hover:border-hairline-strong"
                )}
                onClick={() => onSelect(item.requestId)}
              >
                <div className="relative z-10 flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedIds.includes(item.requestId)}
                      onCheckedChange={(checked) => handleCheckboxChange(item.requestId, !!checked)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-0.5 size-4 rounded-sm border-hairline-strong data-[state=checked]:border-brand data-[state=checked]:bg-brand"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-ink">{item.symbol}</span>
                        <Badge
                          tone={item.status === "completed" ? "info" : "warning"}
                          size="sm"
                          pill
                          uppercase
                        >
                          {item.status}
                        </Badge>
                      </div>
                      <p className="max-w-[140px] truncate text-xs text-ink-secondary">
                        {item.companyName}
                      </p>
                      <span className="text-[11px] text-ink-faint tnum">
                        {format(new Date(item.createdAt), "MMM d, h:mm a")}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDelete(e, item.requestId)}
                    aria-label={`Delete analysis for ${item.symbol}`}
                    className="app-focus app-press rounded-md p-1.5 text-ink-faint opacity-0 transition-opacity hover:bg-negative/10 hover:text-negative focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
