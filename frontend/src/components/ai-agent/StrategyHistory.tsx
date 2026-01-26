"use client";

import { useEffect, useState } from "react";
import { fetchStrategyHistory, deleteStrategy, Strategy } from "@/lib/api/agent";
import { Calendar, ChevronRight, FileText, Trash2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface StrategyHistoryProps {
    onSelect: (strategy: Strategy) => void;
}

export function StrategyHistory({ onSelect }: StrategyHistoryProps) {
    const [history, setHistory] = useState<Strategy[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const data = await fetchStrategyHistory();
            setHistory(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load history");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this strategy?")) return;

        try {
            await deleteStrategy(id);
            setHistory(history.filter(h => h.id !== id));
            toast.success("Strategy deleted");
        } catch (error) {
            toast.error("Failed to delete strategy");
        }
    };

    if (loading) {
        return (
            <div className="py-20 text-center">
                <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-500">Loading your strategies...</p>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No campaigns yet</h3>
                <p className="text-slate-500 mb-6 max-w-sm mx-auto">Generate your first AI marketing strategy to see it here.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4">
            {history.map((item) => (
                <div
                    key={item.id}
                    onClick={() => onSelect(item)}
                    className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex items-center justify-between"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            {item.title.charAt(0)}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">
                                {item.title}
                            </h3>
                            <div className="flex items-center gap-3 mt-1 text-xs font-medium text-slate-500">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(item.created_at).toLocaleDateString()}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span>
                                    {item.description}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={(e) => handleDelete(e, item.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Strategy"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                        <div className="w-px h-8 bg-slate-100"></div>
                        <button className="flex items-center gap-1 text-sm font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
                            View Strategy <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
