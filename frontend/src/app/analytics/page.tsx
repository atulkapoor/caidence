"use client";

import { useState, Suspense, useEffect } from "react";
import { useTabState } from "@/hooks/useTabState";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BarChart3, TrendingUp, Users, MousePointer, ArrowUpRight, Radio, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getDashboardAnalytics, AnalyticsDashboardResponse } from "@/lib/api";
import dynamic from "next/dynamic";
import { PermissionGate } from "@/components/rbac/PermissionGate";
import { AccessDenied } from "@/components/rbac/AccessDenied";

// Dynamic imports to prevent SSR issues with Recharts
const AnalyticsCharts = dynamic(() => import("@/components/analytics/AnalyticsCharts"), {
    ssr: false,
    loading: () => <div className="h-96 flex items-center justify-center bg-slate-50 rounded-2xl"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>
});

const SocialListeningDashboard = dynamic(() => import("@/components/analytics/SocialListeningDashboard").then(mod => mod.SocialListeningDashboard), {
    ssr: false,
    loading: () => <div className="h-96 flex items-center justify-center bg-slate-50 rounded-2xl"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>
});

function AnalyticsContent() {
    const [activeTab, setActiveTab] = useTabState("overview");
    const [data, setData] = useState<AnalyticsDashboardResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                console.log("Loading analytics dashboard...");
                const analytics = await getDashboardAnalytics();
                console.log("Analytics loaded:", analytics);
                setData(analytics);
                setError(null);
            } catch (error: any) {
                console.error("Failed to load analytics:", error);
                setError(error?.message || "Failed to load analytics");
                // Still set mock data on error
                setData({
                    overview: { total_reach: 1250000, engagement_rate: 4.2, conversions: 892, roi: 3.8 },
                    trends: [
                        { date: "Jan", value: 4000, engagement: 2400 },
                        { date: "Feb", value: 3500, engagement: 1398 },
                        { date: "Mar", value: 5200, engagement: 9800 },
                        { date: "Apr", value: 4800, engagement: 3908 },
                        { date: "May", value: 6100, engagement: 4800 },
                        { date: "Jun", value: 5400, engagement: 3800 },
                        { date: "Jul", value: 7200, engagement: 4300 }
                    ],
                    audience: [
                        { name: "Mobile", value: 52 },
                        { name: "Desktop", value: 35 },
                        { name: "Tablet", value: 13 }
                    ]
                });
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-slate-100 p-4 md:p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header with Tabs */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Analytics Suite</h1>
                            <p className="text-slate-600 font-medium">Real-time insights on campaign performance and brand sentiment.</p>
                        </div>

                        <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm inline-flex">
                            <button
                                onClick={() => setActiveTab("overview")}
                                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === "overview" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                    }`}
                            >
                                <BarChart3 className="w-4 h-4" />
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab("listening")}
                                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === "listening" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                    }`}
                            >
                                <Radio className="w-4 h-4" />
                                Social Listening
                            </button>
                        </div>
                    </div>

                    {activeTab === "overview" ? (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            {error && (
                                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg">
                                    <p className="font-medium">⚠️ API Error: {error}</p>
                                    <p className="text-sm text-amber-700 mt-1">Showing analytics with demo data</p>
                                </div>
                            )}
                            {loading ? (
                                <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-600" />
                                    <p className="font-medium">Loading real-time insights...</p>
                                </div>
                            ) : data && (
                                <>
                                    {/* KPI Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {[
                                            { title: "Total Reach", value: (data.overview.total_reach / 1000000).toFixed(1) + "M", change: "+12%", icon: Users, color: "text-blue-500" },
                                            { title: "Engagement Rate", value: data.overview.engagement_rate + "%", change: "+0.5%", icon: MousePointer, color: "text-purple-500" },
                                            { title: "Conversions", value: data.overview.conversions, change: "+18%", icon: TrendingUp, color: "text-emerald-500" },
                                            { title: "Campaign ROI", value: data.overview.roi.toFixed(1) + "x", change: "+5%", icon: BarChart3, color: "text-orange-500" },
                                        ].map((stat, i) => (
                                            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className={`p-3 bg-slate-50 rounded-xl ${stat.color}`}>
                                                        <stat.icon className="h-5 w-5" />
                                                    </div>
                                                    <span className="flex items-center text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                                                        {stat.change} <ArrowUpRight className="h-3 w-3 ml-0.5" />
                                                    </span>
                                                </div>
                                                <div className="text-3xl font-black text-slate-900 mb-1">{stat.value}</div>
                                                <div className="text-sm font-bold text-slate-500 uppercase tracking-wide">{stat.title}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Charts Section */}
                                    <AnalyticsCharts data={data} />
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="animate-in fade-in duration-500">
                            <SocialListeningDashboard />
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

export default function AnalyticsPage() {
    return (
        <PermissionGate require="analytics:read" fallback={<DashboardLayout><AccessDenied /></DashboardLayout>}>
            <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading analytics...</div>}>
                <AnalyticsContent />
            </Suspense>
        </PermissionGate>
    );
}
