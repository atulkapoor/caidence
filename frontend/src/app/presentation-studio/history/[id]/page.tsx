"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ArrowLeft, Download, Presentation as PresentationIcon, Calendar, PieChart, FileText, Upload, RefreshCw, LayoutTemplate } from "lucide-react";
import { fetchPresentationById, Presentation, generatePresentation } from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PageProps {
    params: { id: string };
}

export default function PresentationDetailPage({ params }: PageProps) {
    const router = useRouter();
    const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
    const [presentation, setPresentation] = useState<Presentation | null>(null);
    const [loading, setLoading] = useState(true);
    const [isRegenerating, setIsRegenerating] = useState(false);

    useEffect(() => {
        const unwrapparams = async () => {
            const p = await params;
            setResolvedParams(p);
        };
        unwrapparams();
    }, [params]);

    useEffect(() => {
        if (resolvedParams?.id) {
            loadPresentation(resolvedParams.id);
        }
    }, [resolvedParams]);

    const loadPresentation = async (id: string) => {
        try {
            const data = await fetchPresentationById(parseInt(id));
            setPresentation(data);
        } catch (error) {
            console.error("Failed to load presentation", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        if (presentation) {
            router.push(`/presentation-studio?edit=${presentation.id}`);
        }
    };

    if (!resolvedParams || loading) {
        return (
            <DashboardLayout>
                <div className="min-h-screen bg-slate-50/50 p-8 flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-2 border-cyan-600 border-t-transparent rounded-full"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (!presentation) {
        return (
            <DashboardLayout>
                <div className="min-h-screen bg-slate-50/50 p-8 flex flex-col items-center justify-center">
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Presentation Not Found</h2>
                    <Link href="/presentation-studio/history" className="text-cyan-600 font-bold hover:underline">Return to Library</Link>
                </div>
            </DashboardLayout>
        );
    }

    // Parse slides if string, else use as is
    let slides = [];
    try {
        slides = typeof presentation.slides_json === 'string'
            ? JSON.parse(presentation.slides_json)
            : presentation.slides_json || [];
    } catch (e) {
        slides = [];
    }

    // Mock slides if empty for visualization
    if (!slides || slides.length === 0) {
        slides = Array(presentation.slide_count || 5).fill(null).map((_, i) => ({
            title: `Slide ${i + 1}: Key Insights`,
            content: "Generated content placeholder..."
        }));
    }

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-slate-50/50 p-6 sm:p-8">
                <div className="max-w-7xl mx-auto">

                    {/* Breadcrumbs */}
                    <nav className="flex items-center text-sm text-slate-500 mb-8 font-medium">
                        <Link href="/presentation-studio" className="hover:text-cyan-600 transition-colors flex items-center gap-1">
                            <PresentationIcon className="w-4 h-4" />
                            Studio
                        </Link>
                        <span className="mx-3 text-slate-300">/</span>
                        <Link href="/presentation-studio/history" className="hover:text-cyan-600 transition-colors">
                            History
                        </Link>
                        <span className="mx-3 text-slate-300">/</span>
                        <span className="text-slate-900 truncate max-w-[200px]">{presentation.title}</span>
                    </nav>

                    {/* Header */}
                    <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Link href="/presentation-studio/history" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 shadow-sm group">
                                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                            </Link>
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-sm ${presentation.source_type === 'upload' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                                        }`}>
                                        {presentation.source_type}
                                    </span>
                                    <span className="text-slate-300 text-xs">•</span>
                                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(presentation.created_at).toLocaleString()}
                                    </span>
                                </div>
                                <h1 className="text-2xl font-bold text-slate-900 leading-tight">{presentation.title}</h1>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button className="flex items-center gap-2 px-4 py-2 border bg-white border-slate-200 text-slate-600 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all">
                                <Download className="w-4 h-4" />
                                Export PDF
                            </button>

                            <button
                                onClick={handleEdit}
                                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-cyan-200 hover:bg-cyan-700 hover:shadow-xl hover:shadow-cyan-200/50 transition-all transform active:scale-[0.98]"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Regenerate Deck
                            </button>
                        </div>
                    </div>

                    {/* Content Body */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Slides Grid */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="font-bold text-slate-900 flex items-center gap-2">
                                    <LayoutTemplate className="w-5 h-5 text-slate-400" />
                                    Slide Preview
                                </h2>
                                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{slides.length} Slides</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {slides.map((slide: Record<string, unknown>, i: number) => (
                                    <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group cursor-pointer">
                                        <div className="aspect-video bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-center relative">
                                            <span className="text-6xl font-black text-slate-100 select-none group-hover:text-cyan-50 transition-colors">{i + 1}</span>
                                            <div className="absolute bottom-2 left-2 right-2">
                                                <div className="h-1 bg-slate-200 rounded-full w-2/3 mb-1"></div>
                                                <div className="h-1 bg-slate-200 rounded-full w-1/2"></div>
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{(slide.title as string) || `Slide ${i + 1}`}</h4>
                                            <p className="text-xs text-slate-500 line-clamp-2 mt-1">{(slide.content as string)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Metadata Sidebar */}
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 sticky top-6">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-50">
                                    <FileText className="w-4 h-4 text-cyan-600" />
                                    Deck Info
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">Topic / Title</label>
                                        <div className="text-sm font-bold text-slate-900">
                                            {presentation.title}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">Source Type</label>
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            {presentation.source_type === 'upload' ? <Upload className="w-4 h-4" /> : <PieChart className="w-4 h-4" />}
                                            <span className="capitalize">{presentation.source_type}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">Total Slides</label>
                                        <div className="text-sm font-medium text-slate-600">
                                            {presentation.slide_count}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-50">
                                        <button className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-bold rounded-xl transition-colors">
                                            Download PowerPoint
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
}
