"use client";

import { useState, Suspense, useEffect } from "react";
import { useTabState } from "@/hooks/useTabState";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BarChart3, TrendingUp, Users, MousePointer, ArrowUpRight, Radio, Search, Loader2 } from "lucide-react";
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { SocialListeningDashboard } from "@/components/analytics/SocialListeningDashboard";
import { toast } from "sonner";
import { getDashboardAnalytics, AnalyticsDashboardResponse } from "@/lib/api";

function AnalyticsContent() {
    const [activeTab, setActiveTab] = useTabState("overview");
    const [data, setData] = useState<AnalyticsDashboardResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const analytics = await getDashboardAnalytics();
                setData(analytics);
            } catch (error) {
                console.error("Failed to load analytics", error);
                toast.error("Failed to load analytics data");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        toast.success(`Date range updated: ${e.target.value}`);
    };

    const handleExport = () => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 2000)),
            {
                loading: 'Preparing export...',
                success: 'Analytics report downloaded!',
                error: 'Export failed'
            }
        );
    };

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
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                                        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                                            <div className="flex items-center justify-between mb-8">
                                                <h3 className="font-bold text-lg text-slate-900">Traffic Overview</h3>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={handleExport}
                                                        className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-lg transition-colors flex items-center gap-2"
                                                    >
                                                        <ArrowUpRight className="w-3 h-3" /> Export
                                                    </button>
                                                    <select
                                                        onChange={handleFilterChange}
                                                        className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 rounded-lg px-3 py-2 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                                                    >
                                                        <option>Last 12 Months</option>
                                                        <option>Last 30 Days</option>
                                                        <option>Last 7 Days</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="h-[350px] w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart
                                                        data={data.traffic_data}
                                                        margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                                        <XAxis
                                                            dataKey="name"
                                                            stroke="#94a3b8"
                                                            fontSize={12}
                                                            tickLine={false}
                                                            axisLine={false}
                                                            dy={10}
                                                        />
                                                        <YAxis
                                                            stroke="#94a3b8"
                                                            fontSize={12}
                                                            tickLine={false}
                                                            axisLine={false}
                                                            tickFormatter={(value) => `${value / 1000}k`}
                                                        />
                                                        <Tooltip
                                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                            cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                                                        />
                                                        <Line
                                                            type="monotone"
                                                            dataKey="value"
                                                            stroke="#10b981"
                                                            strokeWidth={4}
                                                            dot={false}
                                                            activeDot={{ r: 6, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm flex flex-col">
                                            <h3 className="font-bold text-lg text-slate-900 mb-8">Device Distribution</h3>
                                            <div className="h-[250px] w-full flex items-center justify-center relative">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={data.device_data}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={80}
                                                            outerRadius={100}
                                                            paddingAngle={5}
                                                            dataKey="value"
                                                            stroke="none"
                                                            cornerRadius={4}
                                                        >
                                                            {data.device_data.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                                {/* Center Content */}
                                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                    <span className="text-3xl font-black text-slate-900">4.5k</span>
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Users</span>
                                                </div>
                                            </div>
                                            <div className="mt-8 space-y-4 flex-1">
                                                {data.device_data.map((item, i) => (
                                                    <div key={i} className="flex justify-between text-sm items-center">
                                                        <span className="flex items-center gap-3 text-slate-600 font-medium">
                                                            <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: item.color }}></div>
                                                            {item.name}
                                                        </span>
                                                        <span className="font-bold text-slate-900">{item.value}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <SocialListeningDashboard />
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

export default function AnalyticsPage() {
    return (
        <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading analytics...</div>}>
            <AnalyticsContent />
        </Suspense>
    );
}
