"use client";

import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart3, TrendingUp, Users, MousePointer } from "lucide-react";

export function PerformanceChart() {
    const data = [
        { name: 'Jan', campaigns: 4, engagement: 12 },
        { name: 'Feb', campaigns: 6, engagement: 18 },
        { name: 'Mar', campaigns: 8, engagement: 24 },
        { name: 'Apr', campaigns: 5, engagement: 15 },
        { name: 'May', campaigns: 9, engagement: 32 },
        { name: 'Jun', campaigns: 7, engagement: 28 },
    ];

    return (
        <div className="rounded-2xl bg-white p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-8">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-bold text-slate-900">Performance Overview</h3>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-blue-50 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center mb-3 shadow-lg shadow-blue-500/20">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <span className="text-3xl font-bold text-slate-900 mb-1">1</span>
                    <span className="text-sm font-medium text-slate-500">Total Campaigns</span>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/20">
                        <Users className="w-5 h-5" />
                    </div>
                    <span className="text-3xl font-bold text-slate-900 mb-1">0</span>
                    <span className="text-sm font-medium text-slate-500">Total Engagement</span>
                </div>
                <div className="bg-purple-50 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center mb-3 shadow-lg shadow-purple-500/20">
                        <MousePointer className="w-5 h-5" />
                    </div>
                    <span className="text-3xl font-bold text-slate-900 mb-1">5</span>
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
