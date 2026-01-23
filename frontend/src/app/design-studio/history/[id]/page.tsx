"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ArrowLeft, Download, Palette, Calendar, Share2, Wand2, Maximize2 } from "lucide-react";
import { fetchDesignAssetById, DesignAsset } from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PageProps {
    params: { id: string };
}

export default function DesignDetailPage({ params }: PageProps) {
    const router = useRouter();
    const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
    const [asset, setAsset] = useState<DesignAsset | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Unwrap params
        const unwrapparams = async () => {
            const p = await params;
            setResolvedParams(p);
        };
        unwrapparams();
    }, [params]);

    useEffect(() => {
        if (resolvedParams?.id) {
            loadAsset(resolvedParams.id);
        }
    }, [resolvedParams]);

    const loadAsset = async (id: string) => {
        try {
            const data = await fetchDesignAssetById(parseInt(id));
            setAsset(data);
        } catch (error) {
            console.error("Failed to load asset", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemix = () => {
        if (asset) {
            // Navigate to studio with edit param
            router.push(`/design-studio?edit=${asset.id}`);
        }
    };

    if (!resolvedParams || loading) {
        return (
            <DashboardLayout>
                <div className="min-h-screen bg-slate-50/50 p-8 flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (!asset) {
        return (
            <DashboardLayout>
                <div className="min-h-screen bg-slate-50/50 p-8 flex flex-col items-center justify-center">
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Asset Not Found</h2>
                    <Link href="/design-studio/history" className="text-rose-600 font-bold hover:underline">Return to Library</Link>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-slate-50/50 p-6 sm:p-8">
                <div className="max-w-6xl mx-auto">

                    {/* Breadcrumbs */}
                    <nav className="flex items-center text-sm text-slate-500 mb-8 font-medium">
                        <Link href="/design-studio" className="hover:text-rose-600 transition-colors flex items-center gap-1">
                            <Palette className="w-4 h-4" />
                            Studio
                        </Link>
                        <span className="mx-3 text-slate-300">/</span>
                        <Link href="/design-studio/history" className="hover:text-rose-600 transition-colors">
                            History
                        </Link>
                        <span className="mx-3 text-slate-300">/</span>
                        <span className="text-slate-900 truncate max-w-[200px]">{asset.title}</span>
                    </nav>

                    {/* Header */}
                    <div className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Link href="/design-studio/history" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 shadow-sm group">
                                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                            </Link>
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-sm bg-rose-50 text-rose-600 border-rose-100">
                                        {asset.style}
                                    </span>
                                    <span className="text-slate-300 text-xs">•</span>
                                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(asset.created_at).toLocaleString()}
                                    </span>
                                </div>
                                <h1 className="text-2xl font-bold text-slate-900 leading-tight">{asset.title}</h1>
                            </div>
                        </div>

                        <div className="flex gap-2 self-end sm:self-auto">
                            <button className="flex items-center gap-2 px-4 py-2 border bg-white border-slate-200 text-slate-600 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all">
                                <Download className="w-4 h-4" />
                                Download
                            </button>

                            <button
                                onClick={handleRemix}
                                className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-200 hover:bg-rose-700 hover:shadow-xl hover:shadow-rose-200/50 transition-all transform active:scale-[0.98]"
                            >
                                <Wand2 className="w-4 h-4" />
                                Remix in Studio
                            </button>
                        </div>
                    </div>

                    {/* Content Body */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Main Image */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 overflow-hidden ring-1 ring-slate-100 relative group">
                                <div className="rounded-xl overflow-hidden bg-slate-100 aspect-video relative">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={asset.image_url} alt={asset.title} className="w-full h-full object-contain" />
                                </div>
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg backdrop-blur-sm">
                                        <Maximize2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Metadata Sidebar */}
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-50">
                                    <Palette className="w-4 h-4 text-rose-500" />
                                    Visual Details
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">Prompt</label>
                                        <div className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed font-medium italic">
                                            &quot;{asset.prompt}&quot;
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">Style</label>
                                            <div className="inline-flex items-center px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg text-xs font-bold border border-rose-100">
                                                {asset.style}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">Aspect Ratio</label>
                                            <div className="inline-flex items-center px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold border border-slate-100">
                                                {asset.aspect_ratio}
                                            </div>
                                        </div>
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
