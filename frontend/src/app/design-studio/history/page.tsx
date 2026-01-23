"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Palette, Search, Filter, ArrowLeft, Download, Maximize2 } from "lucide-react";
import { fetchDesignAssets, DesignAsset } from "@/lib/api";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function DesignHistoryPage() {
    const [history, setHistory] = useState<DesignAsset[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStyle, setSelectedStyle] = useState<string | null>(null);

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const data = await fetchDesignAssets();
                setHistory(data);
            } catch (error) {
                console.error("Failed to load history", error);
            }
        };
        loadHistory();
    }, []);

    const styles = ["Photorealistic", "3D Render", "Minimalist", "Cyberpunk"];

    const filteredHistory = history.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.prompt.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStyle = selectedStyle ? item.style === selectedStyle : true;
        return matchesSearch && matchesStyle;
    });

    return (
        <DashboardLayout>
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <h1 className="text-2xl font-bold text-slate-900">Design Library</h1>
                            <p className="text-sm text-slate-500">Manage and access all your generated visuals.</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search visuals..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none w-64 shadow-sm"
                                />
                            </div>
                            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 shadow-sm transition-colors">
                                <Filter className="w-4 h-4" /> Filter
                            </button>
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
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredHistory.length === 0 ? (
                            <div className="col-span-full py-20 text-center">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Palette className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">No visuals found</h3>
                                <p className="text-slate-500">Try adjusting your search or filters.</p>
                            </div>
                        ) : (
                            filteredHistory.map((item) => (
                                <Link href={`/design-studio/history/${item.id}`} key={item.id} className="group cursor-pointer">
                                    <div className="aspect-square bg-white rounded-2xl border border-slate-200 p-2 shadow-sm hover:shadow-xl hover:scale-[1.02] hover:border-rose-200 transition-all relative overflow-hidden">
                                        <div className="w-full h-full rounded-xl overflow-hidden bg-slate-100 relative">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                                            {/* Overlay Actions */}
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <button className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-bold text-slate-900 hover:bg-white transition-colors flex items-center gap-2">
                                                    <Maximize2 className="w-3 h-3" /> View
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3 px-1">
                                        <h3 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-rose-600 transition-colors">{item.title}</h3>
                                        <p className="text-xs text-slate-500 line-clamp-1">{item.prompt}</p>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
}
