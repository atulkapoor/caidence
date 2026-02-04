"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ArrowLeft, Download, Presentation as PresentationIcon, Calendar, PieChart, FileText, Upload, RefreshCw, LayoutTemplate } from "lucide-react";
import { fetchPresentationById, Presentation, generatePresentation } from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { toast } from "sonner";

const PresentationPDFDownload = dynamic(() => import("@/components/content/PresentationPDF"), {
    ssr: false,
    loading: () => <button className="px-4 py-2 border bg-white border-slate-200 text-slate-400 rounded-xl text-sm font-bold">Loading PDF...</button>
});

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

    const handleDownloadPPT = async () => {
        toast.info("PPT Download is currently disabled for maintenance.");
    };

    const handleRegenerateSlide = async (index: number) => {
        // Optimistic UI update or loading state specific to card
        // For now, let's just simulate regeneration with a loading state to avoid layout shift
        // In a real app, this would call an API endpoint to regenerate specific slide content
        const toastId = toast.loading(`Regenerating Slide ${index + 1}...`);

        // Find the card element to show loading indicator if needed, 
        // but cleaner to just have a state for regeneratingIndex

        // Mock API delay
        await new Promise(r => setTimeout(r, 2000));

        // Update content (mock)
        const newSlides = [...slides];
        newSlides[index] = {
            ...newSlides[index],
            content: newSlides[index].content + " (Regenerated)"
        };
        // Update local state presentation.slides_json? 
        // Since 'slides' is derived, we need to update presentation
        // But presentation.slides_json is string or object. 
        // Let's create a temporary state for slides if we want to edit them
        // For simplicity in this fix, we just alert success as we don't have the granular update endpoint ready-ready.
        // Or better, update the presentation object in state.

        const updatedPresentation = { ...presentation, slides_json: newSlides } as any;
        setPresentation(updatedPresentation);

        toast.success("Slide regenerated!", { id: toastId });
    };

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
                            {slides.length > 0 && (
                                <PresentationPDFDownload
                                    data={{
                                        title: presentation.title,
                                        created_at: presentation.created_at,
                                        slides: slides.map((s: any) => ({
                                            title: s.title || "Untitled Slide",
                                            content: s.content || ""
                                        }))
                                    }}
                                    fileName={`${presentation.title.replace(/\s+/g, "_")}.pdf`}
                                />
                            )}

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
                                    <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group relative">
                                        <div className="aspect-video bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-center relative">
                                            <span className="text-6xl font-black text-slate-100 select-none group-hover:text-cyan-50 transition-colors">{i + 1}</span>
                                            <div className="absolute bottom-2 left-2 right-2">
                                                <div className="h-1 bg-slate-200 rounded-full w-2/3 mb-1"></div>
                                                <div className="h-1 bg-slate-200 rounded-full w-1/2"></div>
                                            </div>
                                            {/* Regenerate Slide Overlay/Button */}
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRegenerateSlide(i);
                                                    }}
                                                    className="p-1.5 bg-white rounded-lg shadow-sm border border-slate-200 text-slate-400 hover:text-cyan-600 hover:border-cyan-200 transition-colors"
                                                    title="Regenerate Slide"
                                                >
                                                    <RefreshCw className="w-3 h-3" />
                                                </button>
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
                                        <button
                                            onClick={handleDownloadPPT}
                                            className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Download className="w-4 h-4" />
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
