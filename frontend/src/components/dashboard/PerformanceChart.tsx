"use client";

import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart3, TrendingUp, Users, MousePointer } from "lucide-react";
import { PerformanceMetric } from "@/lib/api";

interface PerformanceChartProps {
    data: PerformanceMetric[];
    currentRange: string;
    onRangeChange: (range: string) => void;
}

export function PerformanceChart({ data, currentRange, onRangeChange }: PerformanceChartProps) {
    // Calculate summaries from data
    const totalCampaigns = data.reduce((acc, curr) => acc + curr.campaigns, 0);
    const totalEngagement = data.reduce((acc, curr) => acc + curr.engagement, 0);
    const totalContent = Math.round(totalEngagement / 3); // Mock logic for derived metric

    const ranges = [
        { label: '7 Days', value: '7d' },
        { label: '1 Month', value: '30d' },
        { label: '6 Months', value: '6m' },
        { label: 'Custom', value: 'custom' },
    ];

    return (
        <div className="rounded-2xl bg-white p-8 shadow-sm border border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-bold text-slate-900">Performance Overview</h3>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    {ranges.map((range) => (
                        <button
                            key={range.value}
                            onClick={() => onRangeChange(range.value)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${currentRange === range.value
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-blue-50 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center mb-3 shadow-lg shadow-blue-500/20">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <span className="text-3xl font-bold text-slate-900 mb-1">{totalCampaigns}</span>
                    <span className="text-sm font-medium text-slate-500">Total Campaigns</span>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/20">
                        <Users className="w-5 h-5" />
                    </div>
                    <span className="text-3xl font-bold text-slate-900 mb-1">{totalEngagement}</span>
                    <span className="text-sm font-medium text-slate-500">Total Engagement</span>
                </div>
                <div className="bg-purple-50 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center mb-3 shadow-lg shadow-purple-500/20">
                        <MousePointer className="w-5 h-5" />
                    </div>
                    <span className="text-3xl font-bold text-slate-900 mb-1">{totalContent}</span>
                    <span className="text-sm font-medium text-slate-500">Content Pieces</span>
                </div>
            </div>

            {/* Chart */}
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        barGap={8}
                    >
                        <XAxis
                            dataKey="name"
                            stroke="#94a3b8"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                            dy={10}
                        />
                        <Tooltip
                            cursor={{ fill: '#f1f5f9' }}
                            contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', borderColor: '#e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar
                            dataKey="campaigns"
                            fill="#3b82f6" // blue-500
                            name="Campaigns"
                            radius={[4, 4, 0, 0]}
                            barSize={32}
                        />
                        <Bar
                            dataKey="engagement"
                            fill="#10b981" // emerald-500
                            name="Engagement"
                            radius={[4, 4, 0, 0]}
                            barSize={32}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
