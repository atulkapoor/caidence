"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ArrowLeft, Copy, PenTool, Calendar, Trash2, Linkedin, Twitter, FileText, Mail, Facebook, Instagram, Share2 } from "lucide-react";
import { fetchContentGenerationById, ContentGeneration } from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PermissionGate } from "@/components/rbac/PermissionGate";
import { AccessDenied } from "@/components/rbac/AccessDenied";

interface PageProps {
    params: { id: string };
}

export default function ContentDetailPage({ params }: PageProps) {
    const router = useRouter();
    // Unwrap params compatible with Next.js 15+ (if params is a promise)
    // In Next 15, params is a Promise. We need to unwrap it.
    // However, since this is a client component, we can just use `use` or `useEffect` but `params` prop in Next 15 client components is still passed as a promise in some configs or as object in others depending on if it's async layout.
    // Let's assume it matches the type, but let's be safe and use `React.use()` if it was a promise, but here we can just treat it as object if we are not strict.
    // Wait, the error might be simply that `params` IS a promise and we are trying to access `.id` on it directly.
    // Let's use `use()` hook or just await it if we were server component.
    // Since we are "use client", we receive params.
    // In Next.js 15, params is a Promise.
    // We should unwrap it.

    const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
    const [content, setContent] = useState<ContentGeneration | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

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
            loadContent(resolvedParams.id);
        }
    }, [resolvedParams]);

    const loadContent = async (id: string) => {
        try {
            const data = await fetchContentGenerationById(parseInt(id));
            setContent(data);
        } catch (error) {
            console.error("Failed to load content", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (content?.result) {
            navigator.clipboard.writeText(content.result);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleEdit = () => {
        if (content) {
            // Encode data into query string to pass to studio
            // Note: In a real app we might use a store or just fetch by ID in studio, but this is quick.
            const query = new URLSearchParams({
                text: content.result || "", // Pass result as prompt or context? Maybe prompt.
                title: content.title,
                platform: content.platform,
                type: content.content_type,
                mode: "edit" // signal to studio
            }).toString();
            // We'll just pass the ID and let Studio fetch it? That's cleaner.
            // Let's try passing the ID.
            router.push(`/content-studio?edit=${content.id}`);
        }
    };

    if (!resolvedParams || loading) {
        return (
            <DashboardLayout>
                <div className="min-h-screen bg-slate-50/50 p-8 flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (!content) {
        return (
            <DashboardLayout>
                <div className="min-h-screen bg-slate-50/50 p-8 flex flex-col items-center justify-center">
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Content Not Found</h2>
                    <Link href="/content-studio/history" className="text-violet-600 font-bold hover:underline">Return to Library</Link>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <PermissionGate require="content:read" fallback={<AccessDenied />}>
                <div className="min-h-screen bg-slate-50/50 p-6 sm:p-8">
                    <div className="max-w-4xl mx-auto">

                        {/* Breadcrumbs */}
                        <nav className="flex items-center text-sm text-slate-500 mb-8 font-medium">
                            <Link href="/content-studio" className="hover:text-violet-600 transition-colors flex items-center gap-1">
                                <PenTool className="w-4 h-4" />
                                Studio
                            </Link>
                            <span className="mx-3 text-slate-300">/</span>
                            <Link href="/content-studio/history" className="hover:text-violet-600 transition-colors">
                                History
                            </Link>
                            <span className="mx-3 text-slate-300">/</span>
                            <span className="text-slate-900 truncate max-w-[200px]">{content.title}</span>
                        </nav>

                        {/* Header */}
                        <div className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <Link href="/content-studio/history" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 shadow-sm group">
                                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                                </Link>
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-sm ${content.platform === 'LinkedIn' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                            content.platform === 'Twitter' ? 'bg-sky-50 text-sky-500 border-sky-100' :
                                                content.platform === 'Blog' ? 'bg-orange-50 text-orange-500 border-orange-100' :
                                                    'bg-slate-50 text-slate-500 border-slate-100'
                                            }`}>
                                            {content.platform}
                                        </span>
                                        <span className="text-slate-300 text-xs">•</span>
                                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(content.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <h1 className="text-2xl font-bold text-slate-900 leading-tight">{content.title}</h1>
                                </div>
                            </div>

                            <div className="flex gap-2 self-end sm:self-auto">
                                {/* Copy Button */}
                                <button
                                    onClick={handleCopy}
                                    className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-bold transition-all shadow-sm ${copied
                                        ? 'bg-green-50 border-green-200 text-green-600'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                >
                                    <Copy className="w-4 h-4" />
                                    {copied ? 'Copied!' : 'Copy Text'}
                                </button>

                                {/* Edit in Studio */}
                                <button
                                    onClick={handleEdit}
                                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-violet-200 hover:bg-violet-700 hover:shadow-xl hover:shadow-violet-200/50 transition-all transform active:scale-[0.98]"
                                >
                                    <PenTool className="w-4 h-4" />
                                    Edit in Studio
                                </button>
                            </div>
                        </div>

                        {/* Content Body */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                            {/* Main Content */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ring-1 ring-slate-100">
                                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center backdrop-blur-sm">
                                        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                            Generated Content
                                        </h3>
                                        <div className="flex gap-2">
                                            <button className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                                                <Share2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-8 prose prose-slate max-w-none whitespace-pre-wrap font-medium text-slate-700 leading-relaxed text-base">
                                        {content.result}
                                    </div>
                                </div>
                            </div>

                            {/* Metadata Sidebar */}
                            <div className="space-y-6">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-50">
                                        <PenTool className="w-4 h-4 text-violet-500" />
                                        Configuration
                                    </h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">Original Prompt</label>
                                            <div className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed font-medium italic">
                                                &quot;{content.prompt}&quot;
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">Type</label>
                                                <div className="inline-flex items-center px-3 py-1.5 bg-violet-50 text-violet-700 rounded-lg text-xs font-bold border border-violet-100">
                                                    {content.content_type}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">Format</label>
                                                <div className="inline-flex items-center px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold border border-slate-100">
                                                    Text
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                    </div>
                </div>
            </PermissionGate>
        </DashboardLayout>
    );
}
