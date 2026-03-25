
"use client";

import { useEffect, useState } from "react";
import { getAnalysisHistoryAction, deleteAnalysisAction } from "@/lib/actions/analysis.actions";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, History, ArrowRight, BarChart2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";
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
    <div className="flex flex-col h-full bg-slate-900/40 border-l border-white/10 backdrop-blur-md">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-400" />
          <h2 className="font-semibold text-white">History</h2>
        </div>
        {selectedIds.length === 2 && (
          <Button 
            size="sm" 
            className="bg-indigo-600 hover:bg-indigo-500 h-8"
            onClick={() => router.push(`/analysis/compare?ids=${selectedIds.join(",")}`)}
          >
            Compare
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-400">Loading...</div>
          ) : history.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-300 italic">No history yet</div>
          ) : (
            history.map((item) => (
              <div 
                key={item.requestId}
                className={cn(
                  "group p-3 rounded-xl border transition-all cursor-pointer",
                  selectedIds.includes(item.requestId) 
                    ? "bg-indigo-500/10 border-indigo-500/50" 
                    : "bg-white/5 border-transparent hover:border-white/10"
                )}
                onClick={() => onSelect(item.requestId)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      checked={selectedIds.includes(item.requestId)}
                      onCheckedChange={(checked) => handleCheckboxChange(item.requestId, !!checked)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{item.symbol}</span>
                        <Badge variant="outline" className="text-[10px] h-4 bg-slate-800 border-white/10 uppercase">
                          {item.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 truncate max-w-[120px]">{item.companyName}</p>
                      <p className="text-[10px] text-gray-500 mt-1">
                        {format(new Date(item.createdAt), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => handleDelete(e, item.requestId)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
