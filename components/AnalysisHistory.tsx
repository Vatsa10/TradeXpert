
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
      <div className="p-5 border-b border-[#27272A] bg-[#111111]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="w-4 h-4 text-gray-500" />
            <div>
              <h2 className="text-sm font-medium text-white uppercase tracking-wider">History</h2>
              <p className="text-xs text-gray-500 font-medium">{history.length} Reports</p>
            </div>
          </div>
          {selectedIds.length === 2 && (
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-500 text-white h-8 px-4 rounded-lg text-xs font-semibold shadow-lg transition-all"
              onClick={() => router.push(`/analysis/compare?ids=${selectedIds.join(",")}`)}
            >
              Compare
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 custom-scrollbar">
        <div className="p-3 space-y-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-gray-600 animate-spin mb-3" />
              <span className="text-xs font-medium text-gray-600 uppercase tracking-widest">Loading...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-[#111111] border border-[#27272A] rounded-xl flex items-center justify-center">
                <BarChart2 className="w-6 h-6 text-gray-700" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">No History</p>
                <p className="text-xs text-gray-700">Your analysis will appear here</p>
              </div>
            </div>
          ) : (
            history.map((item) => (
              <div 
                key={item.requestId}
                className={cn(
                  "group relative p-3 rounded-xl border transition-all duration-200 cursor-pointer hover:bg-[#1A1A1A]",
                  selectedIds.includes(item.requestId) 
                    ? "bg-blue-500/10 border-blue-500/30" 
                    : "bg-[#111111] border-[#27272A] hover:border-[#3A3A3A]"
                )}
                onClick={() => onSelect(item.requestId)}
              >
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      checked={selectedIds.includes(item.requestId)}
                      onCheckedChange={(checked) => handleCheckboxChange(item.requestId, !!checked)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-0.5 rounded-sm border-gray-600 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 h-4 w-4"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{item.symbol}</span>
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 font-medium uppercase tracking-wider rounded-full",
                          item.status === "completed" ? "bg-blue-500/10 text-blue-400" : "bg-amber-500/10 text-amber-400"
                        )}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-medium truncate max-w-[140px]">{item.companyName}</p>
                      <span className="text-[10px] text-gray-600 font-medium uppercase tracking-tighter">
                        {format(new Date(item.createdAt), "MMM d, h:mm a")}
                      </span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={(e) => handleDelete(e, item.requestId)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
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
