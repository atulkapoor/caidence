"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { History, Search, Filter, ArrowLeft, Linkedin, Twitter, FileText, Mail, Facebook, Instagram, PenTool, Calendar, Trash2, Eye } from "lucide-react";
import { fetchContentGenerations, ContentGeneration, deleteContent } from "@/lib/api";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { PermissionGate } from "@/components/rbac/PermissionGate";
import { AccessDenied } from "@/components/rbac/AccessDenied";

function ContentHistory() {
    const router = useRouter();
    const [history, setHistory] = useState<ContentGeneration[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [platformFilter, setPlatformFilter] = useState("all");

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            setLoading(true);
            const data = await fetchContentGenerations();
            setHistory(data);
        } catch (error) {
            console.error("Failed to load content history", error);
            toast.error("Failed to load history");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.preventDefault(); // Prevent navigation if button is inside link
        if (!confirm("Are you sure you want to delete this content?")) return;

        try {
            await deleteContent(id);
            setHistory(history.filter(h => h.id !== id));
            toast.success("Content deleted");
        } catch (error) {
            console.error("Failed to delete", error);
            toast.error("Failed to delete content");
        }
    };

    const getIconForPlatform = (platform: string) => {
        const p = platform.toLowerCase();
        if (p.includes("linkedin")) return <Linkedin className="w-5 h-5 text-[#0077b5]" />;
        if (p.includes("twitter") || p.includes("x")) return <Twitter className="w-5 h-5 text-black" />;
        if (p.includes("facebook")) return <Facebook className="w-5 h-5 text-[#1877F2]" />;
        if (p.includes("instagram")) return <Instagram className="w-5 h-5 text-[#E4405F]" />;
        if (p.includes("email") || p.includes("newsletter")) return <Mail className="w-5 h-5 text-slate-500" />;
        if (p.includes("blog")) return <FileText className="w-5 h-5 text-indigo-600" />;
        return <PenTool className="w-5 h-5 text-slate-400" />;
    };

    const filteredHistory = history.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.result.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPlatform = platformFilter === "all" || item.platform.toLowerCase() === platformFilter.toLowerCase();
        return matchesSearch && matchesPlatform;
    });

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 sm:p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Breadcrumbs */}
                <nav className="flex items-center text-sm text-slate-500 mb-2 font-medium">
                    <Link href="/content-studio" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
                        <PenTool className="w-4 h-4" />
                        Studio
                    </Link>
                    <span className="mx-3 text-slate-300">/</span>
                    <span className="text-slate-900">History</span>
                </nav>

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Generated Content</h1>
                        <p className="text-sm text-slate-500 mt-1">Archive of all your AI-written posts and articles.</p>
                    </div>
                    <Link href="/content-studio" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 transition-all flex items-center gap-2">
                        <PenTool className="w-4 h-4" />
                        Generate New
                    </Link>
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative flex-1 w-full">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search content..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                        />
                    </div>
                    <select
                        value={platformFilter}
                        onChange={(e) => setPlatformFilter(e.target.value)}
                        className="w-full sm:w-48 px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium text-slate-700"
                    >
                        <option value="all">All Platforms</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="twitter">Twitter</option>
                        <option value="blog">Blog</option>
                        <option value="email">Email</option>
                    </select>
                </div>

                {/* List */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-white rounded-2xl border border-slate-100 animate-pulse"></div>
                        ))}
                    </div>
                ) : filteredHistory.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <History className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No history found</h3>
                        <p className="text-slate-500 mb-6">Start generating content to see it here.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredHistory.map((item) => (
                            <Link key={item.id} href={`/content-studio?edit=${item.id}`} className="block group">
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex items-start gap-4 relative">
                                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                                        {getIconForPlatform(item.platform)}
                                    </div>
                                    <div className="flex-1 min-w-0 pr-12">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                                            <span className="bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                                                {item.content_type}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 line-clamp-2">{item.result}</p>
                                        <div className="flex items-center gap-4 mt-3 text-xs font-medium text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </span>
                                            {item.prompt && (
                                                <span className="truncate max-w-[200px]" title={item.prompt}>
                                                    Prompt: {item.prompt}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="absolute top-5 right-5 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => handleDelete(e, item.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <div className="p-2 text-indigo-600 bg-indigo-50 rounded-lg">
                                            <Eye className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ContentHistoryPage() {
    return (
        <Suspense fallback={<DashboardLayout><div>Loading...</div></DashboardLayout>}>
            <DashboardLayout>
                <PermissionGate require="content:read" fallback={<AccessDenied />}>
                    <ContentHistory />
                </PermissionGate>
            </DashboardLayout>
        </Suspense>
    );
}
