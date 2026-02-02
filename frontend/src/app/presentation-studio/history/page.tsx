"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Presentation as PresentationIcon, Search, Calendar, ChevronRight, FileText, PieChart, Upload, Download } from "lucide-react";
import { fetchPresentations, Presentation } from "@/lib/api";
import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from 'next/dynamic';

// Dynamically import PDF component to avoid SSR issues
const PresentationPDFDownload = dynamic(() => import("@/components/content/PresentationPDF"), {
    ssr: false,
    loading: () => <span className="text-xs text-slate-400">Loading...</span>
});

export default function PresentationHistoryPage() {
    const [history, setHistory] = useState<Presentation[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const data = await fetchPresentations();
                setHistory(data);
            } catch (error) {
                console.error("Failed to load history", error);
            }
        };
        loadHistory();
    }, []);

    const filteredHistory = history.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getSourceIcon = (type: string) => {
        switch (type) {
            case 'upload': return <Upload className="w-4 h-4 text-orange-500" />;
            case 'data': return <PieChart className="w-4 h-4 text-blue-500" />;
            default: return <FileText className="w-4 h-4 text-slate-500" />;
        }
    };

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-slate-50/50 p-6 sm:p-8">
                <div className="max-w-5xl mx-auto space-y-8">

                    {/* Breadcrumbs */}
                    <nav className="flex items-center text-sm text-slate-500 mb-2 font-medium">
                        <Link href="/presentation-studio" className="hover:text-cyan-600 transition-colors flex items-center gap-1">
                            <PresentationIcon className="w-4 h-4" />
                            Studio
                        </Link>
                        <span className="mx-3 text-slate-300">/</span>
                        <span className="text-slate-900">History</span>
                    </nav>

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <h1 className="text-2xl font-bold text-slate-900">Presentation Decks</h1>
                            <p className="text-sm text-slate-500">Access and manage your generated presentation slides.</p>
                        </div>

                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search decks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none w-64 shadow-sm"
                            />
                        </div>
                    </div>

                    {/* List */}
                    <div className="space-y-4">
                        {filteredHistory.length === 0 ? (
                            <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 border-dashed">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <PresentationIcon className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">No presentations found</h3>
                                <p className="text-slate-500">Create your first deck in the Studio.</p>
                            </div>
                        ) : (
                            filteredHistory.map((item) => (
                                <Link
                                    href={`/presentation-studio/history/${item.id}`}
                                    key={item.id}
                                    className="block bg-white p-6 rounded-2xl border border-slate-200 hover:shadow-lg hover:border-cyan-200 transition-all group"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-cyan-50 transition-colors">
                                            <PresentationIcon className="w-8 h-8 text-slate-400 group-hover:text-cyan-600 transition-colors" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-lg font-bold text-slate-900 truncate group-hover:text-cyan-700 transition-colors">{item.title}</h3>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${item.source_type === 'upload' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                    'bg-blue-50 text-blue-600 border-blue-100'
                                                    }`}>
                                                    {item.source_type}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {new Date(item.created_at).toLocaleDateString()}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <FileText className="w-3.5 h-3.5" />
                                                    {item.slide_count} Slides
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    const blob = new Blob([JSON.stringify(item.slides_json, null, 2)], { type: 'application/json' });
                                                    const url = URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = `${item.title.replace(/\s+/g, '_').toLowerCase()}_slides.json`;
                                                    document.body.appendChild(a);
                                                    a.click();
                                                    document.body.removeChild(a);
                                                    URL.revokeObjectURL(url);
                                                }}
                                                className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors group/btn"
                                                title="Download JSON"
                                            >
                                                <Download className="w-5 h-5" />
                                            </button>
                                            <div
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                }}
                                                className="p-1"
                                            >
                                                <PresentationPDFDownload
                                                    data={{
                                                        title: item.title,
                                                        created_at: item.created_at,
                                                        slides: Array.isArray(item.slides_json)
                                                            ? (item.slides_json as { title?: string; content?: string }[]).map((slide, idx) => ({
                                                                title: slide.title || `Slide ${idx + 1}`,
                                                                content: slide.content || ""
                                                            }))
                                                            : [{ title: item.title, content: "Presentation content" }]
                                                    }}
                                                    fileName={`${item.title.replace(/\s+/g, '_').toLowerCase()}.pdf`}
                                                />
                                            </div>
                                            <div className="text-slate-300 group-hover:translate-x-1 transition-transform group-hover:text-cyan-500 pl-2">
                                                <ChevronRight className="w-6 h-6" />
                                            </div>
                                        </div>
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
