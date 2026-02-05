"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Palette, Search, Filter, ArrowLeft, Download, Maximize2, Calendar, Trash2 } from "lucide-react";
import { fetchDesignAssets, DesignAsset, deleteDesign } from "@/lib/api";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { toast } from "sonner";

function DesignHistory() {
    const [history, setHistory] = useState<DesignAsset[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            setLoading(true);
            const data = await fetchDesignAssets();
            setHistory(data);
        } catch (error) {
            console.error("Failed to load history", error);
            toast.error("Failed to load design library");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.preventDefault();
        if (!confirm("Delete this design?")) return;
        try {
            await deleteDesign(id);
            setHistory(history.filter(h => h.id !== id));
            toast.success("Design deleted");
        } catch (error) {
            console.error("Failed to delete", error);
            toast.error("Failed to delete design");
        }
    };

    const styles = ["Photorealistic", "3D Render", "Minimalist", "Cyberpunk", "Abstract"];

    const filteredHistory = history.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.prompt.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStyle = selectedStyle ? (item.style || "").toLowerCase() === selectedStyle.toLowerCase() : true;
        return matchesSearch && matchesStyle;
    });

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 sm:p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Breadcrumbs */}
                <nav className="flex items-center text-sm text-slate-500 mb-2 font-medium">
                    <Link href="/design-studio" className="hover:text-rose-600 transition-colors flex items-center gap-1">
                        <Palette className="w-4 h-4" />
                        Studio
                    </Link>
                    <span className="mx-3 text-slate-300">/</span>
                    <span className="text-slate-900">History</span>
                </nav>

                {/* Header */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold text-slate-900">Design Library</h1>
                        <p className="text-sm text-slate-500">Manage and access all your generated visuals.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        {/* Search */}
                        <div className="relative w-full sm:w-auto">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search visuals..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none w-full sm:w-64 shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    <button
                        onClick={() => setSelectedStyle(null)}
                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${!selectedStyle
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                        All Styles
                    </button>
                    {styles.map(s => (
                        <button
                            key={s}
                            onClick={() => setSelectedStyle(s === selectedStyle ? null : s)}
                            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${selectedStyle === s
                                ? 'bg-rose-600 text-white border-rose-600'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="aspect-square bg-white rounded-2xl border border-slate-100 animate-pulse"></div>
                        ))}
                    </div>
                ) : filteredHistory.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-slate-200 border-dashed">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Palette className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No visuals found</h3>
                        <p className="text-slate-500">Generate some designs to see them here.</p>
                        <Link
                            href="/design-studio"
                            className="mt-4 inline-block text-rose-600 font-bold text-sm hover:underline"
                        >
                            Go to Studio
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredHistory.map((item) => (
                            <div key={item.id} className="group relative">
                                <div className="aspect-square bg-white rounded-2xl border border-slate-200 p-2 shadow-sm hover:shadow-xl hover:scale-[1.02] hover:border-rose-200 transition-all relative overflow-hidden">
                                    <div className="w-full h-full rounded-xl overflow-hidden bg-slate-100 relative group-inner">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" />

                                        {/* Overlay Actions */}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
                                            <a href={item.image_url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-bold text-slate-900 hover:bg-white transition-colors flex items-center gap-2 w-full justify-center">
                                                <Maximize2 className="w-3 h-3" /> View
                                            </a>
                                            <button
                                                onClick={(e) => handleDelete(e, item.id)}
                                                className="px-4 py-2 bg-rose-500/90 backdrop-blur-sm rounded-lg text-xs font-bold text-white hover:bg-rose-600 transition-colors flex items-center gap-2 w-full justify-center"
                                            >
                                                <Trash2 className="w-3 h-3" /> Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 px-1">
                                    <h3 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-rose-600 transition-colors">{item.title}</h3>
                                    <p className="text-xs text-slate-500 line-clamp-1">{item.prompt}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}

export default function DesignHistoryPage() {
    return (
        <Suspense fallback={<DashboardLayout><div>Loading...</div></DashboardLayout>}>
            <DashboardLayout>
                <DesignHistory />
            </DashboardLayout>
        </Suspense>
    );
}
