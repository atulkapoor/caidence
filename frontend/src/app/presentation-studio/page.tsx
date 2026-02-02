"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Presentation, Upload, PieChart, ChevronRight, FileText, Zap } from "lucide-react";
import { fetchPresentations, generatePresentation, Presentation as PresentationType } from "@/lib/api";
import { useEffect, useState, Suspense } from "react";
import { useTabState } from "@/hooks/useTabState";
import Link from "next/link";
import { CollateralGenerator } from "@/components/content/CollateralGenerator";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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



    const router = useRouter(); // Add useRouter

    const handleGenerate = async () => {
        try {
            // Mocking 'file upload' by just calling generate directly for demo
            const newPres = await generatePresentation({
                title: "New Annual Report",
                source_type: "upload"
            });
            toast.success("Presentation generated!");
            router.push(`/presentation-studio/history/${newPres.id}`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate presentation");
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8">
                {/* ... (Header Omitted) ... */}

                {/* Content Area */}
                <div className="min-h-[600px]">
                    {activeTab === "presentations" ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* ... (Upload Area Omitted) ... */}

                            {/* Recent Decks */}
                            <div className="mt-12 pb-12 max-w-5xl mx-auto">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-xl font-bold text-slate-900">Recent Presentations</h2>
                                    <Link href="/presentation-studio/history" className="text-sm font-bold text-cyan-600 hover:text-cyan-700">View All</Link>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {recentPresentations.map((p) => (
                                        <Link href={`/presentation-studio/history/${p.id}`} key={p.id}>
                                            <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:shadow-lg transition-all cursor-pointer group flex items-start gap-4">
                                                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                                                    <Presentation className="w-6 h-6 text-slate-400 group-hover:text-cyan-600 transition-colors" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-slate-900 mb-1 group-hover:text-cyan-600 transition-colors line-clamp-1">{p.title}</h3>
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
                                        </Link>
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
