"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Presentation, Upload, PieChart, ChevronRight, FileText, Zap } from "lucide-react";
import { fetchPresentations, generatePresentation, Presentation as PresentationType } from "@/lib/api";
import { useEffect, useState, Suspense } from "react";
import { useTabState } from "@/hooks/useTabState";
import Link from "next/link";
import { CollateralGenerator } from "@/components/content/CollateralGenerator";
import { toast } from "sonner";

function PresentationStudioContent() {
    const [activeTab, setActiveTab] = useTabState("presentations");
    const [recentPresentations, setRecentPresentations] = useState<PresentationType[]>([]);

    const loadPresentations = async () => {
        try {
            const data = await fetchPresentations();
            setRecentPresentations(data);
        } catch (error) {
            console.error("Failed to load presentations", error);
        }
    };

    useEffect(() => {
        loadPresentations();

        // Check for edit mode
        const params = new URLSearchParams(window.location.search);
        const editId = params.get('edit');
        if (editId) {
            window.history.replaceState({}, '', '/presentation-studio');
        }
    }, []);



    const handleGenerate = async () => {
        try {
            // Mocking 'file upload' by just calling generate directly for demo
            await generatePresentation({
                title: "New Annual Report",
                source_type: "upload"
            });
            await loadPresentations();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 text-cyan-600 text-xs font-bold uppercase tracking-wider">
                        <Zap className="w-3 h-3" />
                        Creative Studio
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                        Create High-Impact Content
                    </h1>
                    <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                        Generate professional presentations, flyers, and marketing collateral powered by AI.
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className="flex justify-center mb-8">
                    <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 inline-flex">
                        <button
                            onClick={() => setActiveTab("presentations")}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "presentations"
                                ? "bg-slate-900 text-white shadow-md"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                                }`}
                        >
                            <Presentation className="w-4 h-4" />
                            Presentation Decks
                        </button>
                        <button
                            onClick={() => setActiveTab("collateral")}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "collateral"
                                ? "bg-slate-900 text-white shadow-md"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                                }`}
                        >
                            <FileText className="w-4 h-4" />
                            Marketing Collateral
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="min-h-[600px]">
                    {activeTab === "presentations" ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-col items-center justify-center py-12 text-center space-y-8">
                                {/* Main Action Area */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                                    {/* Upload Option */}
                                    <div
                                        onClick={() => document.getElementById('report-upload')?.click()}
                                        className="bg-white p-8 rounded-3xl shadow-xl shadow-cyan-900/5 border border-slate-200 hover:border-cyan-400 hover:shadow-cyan-500/10 transition-all cursor-pointer group text-left relative">

                                        <input
                                            type="file"
                                            id="report-upload"
                                            accept=".pdf,.csv,.xlsx,.docx"
                                            className="hidden"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    const file = e.target.files[0];
                                                    toast.info(`Analyzing ${file.name}...`);
                                                    handleGenerate();
                                                }
                                            }}
                                        />

                                        <div className="w-14 h-14 bg-cyan-50 text-cyan-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                            <Upload className="w-7 h-7" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">Upload Report</h3>
                                        <p className="text-slate-500 text-sm mb-6">
                                            Drag & drop PDF, CSV, or Excel files. We&apos;ll analyze the content and structure a presentation.
                                        </p>
                                        <button
                                            className="w-full py-3 border-2 border-slate-100 text-slate-600 rounded-xl font-bold group-hover:bg-cyan-600 group-hover:border-cyan-600 group-hover:text-white transition-all"
                                        >
                                            Select File
                                        </button>
                                    </div>

                                    {/* Power BI Option */}
                                    <div className="bg-white p-8 rounded-3xl shadow-xl shadow-cyan-900/5 border border-slate-200 hover:border-cyan-400 hover:shadow-cyan-500/10 transition-all cursor-pointer group text-left relative overflow-hidden">
                                        <div className="absolute top-4 right-4 px-2 py-1 bg-slate-100 text-[10px] font-bold text-slate-500 rounded uppercase">Pro</div>
                                        <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                            <PieChart className="w-7 h-7" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">Connect Data</h3>
                                        <p className="text-slate-500 text-sm mb-6">
                                            Connect to Power BI, Salesforce, or HubSpot for live data visualization.
                                        </p>
                                        <button className="w-full py-3 border-2 border-slate-100 text-slate-600 rounded-xl font-bold group-hover:bg-cyan-600 group-hover:border-cyan-600 group-hover:text-white transition-all">
                                            Connect Source
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Decks */}
                            <div className="mt-12 pb-12 max-w-5xl mx-auto">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-xl font-bold text-slate-900">Recent Presentations</h2>
                                    <Link href="/presentation-studio/history" className="text-sm font-bold text-cyan-600 hover:text-cyan-700">View All</Link>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {recentPresentations.map((p) => (
                                        <div key={p.id} className="bg-white p-6 rounded-2xl border border-slate-200 hover:shadow-lg transition-all cursor-pointer group flex items-start gap-4">
                                            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                                                <Presentation className="w-6 h-6 text-slate-400 group-hover:text-cyan-600 transition-colors" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-slate-900 mb-1 group-hover:text-cyan-600 transition-colors">{p.title}</h3>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <span>{new Date(p.created_at).toLocaleDateString()}</span>
                                                    <span>•</span>
                                                    <span>{p.slide_count} Slides</span>
                                                </div>
                                            </div>
                                            <button className="p-2 text-slate-300 hover:text-cyan-600">
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <CollateralGenerator />
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

export default function PresentationStudioPage() {
    return (
        <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading studio...</div>}>
            <PresentationStudioContent />
        </Suspense>
    );
}
