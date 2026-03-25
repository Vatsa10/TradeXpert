
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
      <div className="p-6 border-b border-white/[0.05] bg-white/[0.02] backdrop-blur-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
              <History className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-widest">History</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{history.length} Reports Saved</p>
            </div>
          </div>
          {selectedIds.length === 2 && (
            <Button 
              size="sm" 
              className="bg-indigo-600 hover:bg-indigo-500 h-8 px-4 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/40 animate-in zoom-in"
              onClick={() => router.push(`/analysis/compare?ids=${selectedIds.join(",")}`)}
            >
              Compare (2)
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mb-2" />
              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Retrieving...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-white/[0.02] border border-white/[0.05] rounded-2xl flex items-center justify-center">
                <BarChart2 className="w-6 h-6 text-gray-700" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Intelligence Archive Empty</p>
                <p className="text-[10px] text-gray-600 uppercase font-bold tracking-wider leading-none">Your analysis reports will appear here</p>
              </div>
            </div>
          ) : (
            history.map((item) => (
              <div 
                key={item.requestId}
                className={cn(
                  "group relative p-4 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden",
                  selectedIds.includes(item.requestId) 
                    ? "bg-indigo-500/[0.08] border-indigo-500/40 shadow-xl" 
                    : "bg-white/[0.01] border-white/[0.03] hover:border-white/10 hover:bg-white/[0.03]"
                )}
                onClick={() => onSelect(item.requestId)}
              >
                {/* Visual Indicator of Select */}
                {selectedIds.includes(item.requestId) && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                )}

                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="pt-1">
                      <Checkbox 
                        checked={selectedIds.includes(item.requestId)}
                        onCheckedChange={(checked) => handleCheckboxChange(item.requestId, !!checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-full border-white/20 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white tracking-tight">{item.symbol}</span>
                        <Badge variant="outline" className={cn(
                          "text-[8px] h-4 px-1.5 font-black uppercase tracking-widest border-none",
                          item.status === "completed" ? "bg-indigo-500/10 text-indigo-400" : "bg-amber-500/10 text-amber-500"
                        )}>
                          {item.status}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase truncate max-w-[120px]">{item.companyName}</p>
                      <div className="flex items-center gap-1.5 pt-1">
                        <History className="w-3 h-3 text-gray-600" />
                        <span className="text-[9px] text-gray-600 font-black uppercase tracking-tighter">
                          {format(new Date(item.createdAt), "MMM d, h:mm a")}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <button 
                      onClick={(e) => handleDelete(e, item.requestId)}
                      className="opacity-0 group-hover:opacity-100 p-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all transform hover:scale-110"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <ArrowRight className="w-3 h-3 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity -rotate-45" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
