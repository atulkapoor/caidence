"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { History, Search, Filter, ArrowLeft, Linkedin, Twitter, FileText, Mail, Facebook, Instagram, PenTool, Calendar } from "lucide-react";
import { fetchContentGenerations, ContentGeneration } from "@/lib/api";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ContentHistoryPage() {
    const [history, setHistory] = useState<ContentGeneration[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const data = await fetchContentGenerations();
                setHistory(data);
            } catch (error) {
                console.error("Failed to load history", error);
            }
        };
        loadHistory();
    }, []);

    const platforms = ["LinkedIn", "Twitter", "Blog", "Email", "Facebook", "Instagram"];

    // Extract unique content types from history for the filter dropdown
    const contentTypes = Array.from(new Set(history.map(item => item.content_type).filter(Boolean)));

    const filteredHistory = history.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.result?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPlatform = selectedPlatform ? item.platform === selectedPlatform : true;

        let matchesType = true;
        if (selectedType) {
            matchesType = item.content_type === selectedType;
        }

        let matchesDate = true;
        if (dateRange.start) {
            matchesDate = new Date(item.created_at) >= new Date(dateRange.start);
        }
        if (dateRange.end && matchesDate) {
            // Set end date to end of day
            const endDate = new Date(dateRange.end);
            endDate.setHours(23, 59, 59, 999);
            matchesDate = new Date(item.created_at) <= endDate;
        }

        return matchesSearch && matchesPlatform && matchesType && matchesDate;
    });

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-slate-50/50 p-6 sm:p-8">
                <div className="max-w-7xl mx-auto space-y-8">

                    {/* Breadcrumbs */}
                    <nav className="flex items-center text-sm text-slate-500 mb-2 font-medium">
                        <Link href="/content-studio" className="hover:text-violet-600 transition-colors flex items-center gap-1">
                            <PenTool className="w-4 h-4" />
                            Studio
                        </Link>
                        <span className="mx-3 text-slate-300">/</span>
                        <span className="text-slate-900">History</span>
                    </nav>

                    {/* Header */}
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <h1 className="text-2xl font-bold text-slate-900">Content Library</h1>
                            <p className="text-sm text-slate-500">Manage and access all your generated content.</p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            {/* Search */}
                            <div className="relative w-full sm:w-auto">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search content..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none w-full sm:w-64 shadow-sm"
                                />
                            </div>

                            {/* Type Filter */}
                            <select
                                value={selectedType || ""}
                                onChange={(e) => setSelectedType(e.target.value || null)}
                                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-violet-500 w-full sm:w-auto shadow-sm"
                            >
                                <option value="">All Types</option>
                                {contentTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>

                            {/* Date Filter */}
                            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm w-full sm:w-auto">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                    className="text-xs font-medium text-slate-600 outline-none bg-transparent w-24"
                                    placeholder="Start"
                                />
                                <span className="text-slate-300">-</span>
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                    className="text-xs font-medium text-slate-600 outline-none bg-transparent w-24"
                                    placeholder="End"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Platform Filters */}
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                        <button
                            onClick={() => setSelectedPlatform(null)}
                            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${!selectedPlatform
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                        >
                            All Platforms
                        </button>
                        {platforms.map(p => (
                            <button
                                key={p}
                                onClick={() => setSelectedPlatform(p === selectedPlatform ? null : p)}
                                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${selectedPlatform === p
                                    ? 'bg-violet-600 text-white border-violet-600'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredHistory.length === 0 ? (
                            <div className="col-span-full py-20 text-center">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <History className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">No content found</h3>
                                <p className="text-slate-500">Try adjusting your search or filters.</p>
                                <button
                                    onClick={() => {
                                        setSearchQuery("");
                                        setSelectedPlatform(null);
                                        setSelectedType(null);
                                        setDateRange({ start: "", end: "" });
                                    }}
                                    className="mt-4 text-violet-600 font-bold text-sm hover:underline"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        ) : (
                            filteredHistory.map((item) => (
                                <Link href={`/content-studio/history/${item.id}`} key={item.id} className="group flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-violet-100/50 hover:border-violet-200 transition-all duration-300 transform hover:-translate-y-1">
                                    <div className="p-5 flex-1">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`p-2 rounded-xl ${item.platform === 'LinkedIn' ? 'bg-blue-50 text-blue-600' :
                                                item.platform === 'Twitter' ? 'bg-sky-50 text-sky-500' :
                                                    item.platform === 'Blog' ? 'bg-orange-50 text-orange-500' :
                                                        item.platform === 'Email' ? 'bg-purple-50 text-purple-500' :
                                                            item.platform === 'Facebook' ? 'bg-blue-50 text-blue-700' :
                                                                item.platform === 'Instagram' ? 'bg-pink-50 text-pink-600' :
                                                                    'bg-slate-50 text-slate-500'
                                                }`}>
                                                {item.platform === 'LinkedIn' ? <Linkedin className="w-5 h-5" /> :
                                                    item.platform === 'Twitter' ? <Twitter className="w-5 h-5" /> :
                                                        item.platform === 'Blog' ? <FileText className="w-5 h-5" /> :
                                                            item.platform === 'Email' ? <Mail className="w-5 h-5" /> :
                                                                item.platform === 'Facebook' ? <Facebook className="w-5 h-5" /> :
                                                                    item.platform === 'Instagram' ? <Instagram className="w-5 h-5" /> :
                                                                        <PenTool className="w-5 h-5" />}
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-1 rounded-md">{item.content_type}</span>
                                        </div>
                                        <h3 className="font-bold text-slate-900 mb-2 leading-tight group-hover:text-violet-700 transition-colors line-clamp-2">{item.title}</h3>
                                        <p className="text-xs text-slate-500 line-clamp-4 leading-relaxed font-medium">
                                            {item.result}
                                        </p>
                                    </div>
                                    <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-slate-400">{new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                        <span className="text-xs font-bold text-violet-600 opacity-0 group-hover:opacity-100 transition-opacity">View Details →</span>
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
