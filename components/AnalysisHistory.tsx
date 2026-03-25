
"use client";

import { useEffect, useState } from "react";
import { getAnalysisHistoryAction, deleteAnalysisAction } from "@/lib/actions/analysis.actions";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, History, ArrowRight, BarChart2, Loader2 } from "lucide-react";
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
    <div className="flex flex-col h-full bg-transparent">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-white/[0.04] bg-white/[0.01]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="w-4 h-4 text-gray-700" />
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-widest">History</h2>
              <p className="text-[9px] text-gray-600 font-bold uppercase tracking-wider">{history.length} Reports</p>
            </div>
          </div>
          {selectedIds.length === 2 && (
            <Button 
              size="sm" 
              className="bg-white text-black hover:bg-white/90 h-7 px-3 rounded-md text-[9px] font-bold uppercase tracking-widest shadow-xl animate-in fade-in zoom-in"
              onClick={() => router.push(`/analysis/compare?ids=${selectedIds.join(",")}`)}
            >
              Compare
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-5 h-5 text-gray-800 animate-spin mb-2" />
              <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">Loading Archive</span>
            </div>
          ) : history.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="mx-auto w-10 h-10 bg-white/[0.01] border border-white/[0.03] rounded-xl flex items-center justify-center">
                <BarChart2 className="w-5 h-5 text-gray-800" />
              </div>
              <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest leading-none">Archive Empty</p>
            </div>
          ) : (
            history.map((item) => (
              <div 
                key={item.requestId}
                className={cn(
                  "group relative p-3 rounded-xl border transition-all duration-200 cursor-pointer",
                  selectedIds.includes(item.requestId) 
                    ? "bg-white/[0.03] border-indigo-500/30 shadow-sm" 
                    : "bg-white/[0.01] border-white/[0.02] hover:border-white/10 hover:bg-white/[0.02]"
                )}
                onClick={() => onSelect(item.requestId)}
              >
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      checked={selectedIds.includes(item.requestId)}
                      onCheckedChange={(checked) => handleCheckboxChange(item.requestId, !!checked)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-0.5 rounded-sm border-white/10 data-[state=checked]:bg-white data-[state=checked]:text-black h-3 w-3"
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white tracking-tight">{item.symbol}</span>
                        <span className={cn(
                          "text-[8px] px-1 font-bold uppercase tracking-widest",
                          item.status === "completed" ? "text-indigo-400" : "text-amber-500"
                        )}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-[9px] text-gray-600 font-medium uppercase truncate max-w-[120px]">{item.companyName}</p>
                      <span className="text-[8px] text-gray-700 font-bold uppercase tracking-tighter">
                        {format(new Date(item.createdAt), "MMM d, h:mm a")}
                      </span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={(e) => handleDelete(e, item.requestId)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-700 hover:text-rose-500 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
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
