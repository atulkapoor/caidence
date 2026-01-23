"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ActionCards } from "@/components/dashboard/ActionCards";
import { CapabilitiesGrid } from "@/components/dashboard/CapabilitiesGrid";
import { ToolsGrid } from "@/components/dashboard/ToolsGrid";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { CampaignOverview } from "@/components/dashboard/CampaignOverview";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { fetchDashboardStats, type DashboardStats } from "@/lib/api";

export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const data = await fetchDashboardStats();
                setStats(data);
            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-12 pb-12">
                {/* 0. Header Text */}
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">C(AI)DENCE</h1>
                    <p className="text-lg text-slate-600 font-medium">AI-powered marketing intelligence & automation suite</p>
                </div>

                {/* 1. Action Cards (Start Here / Marcom Hub) */}
                <ActionCards />

                {/* 2. Advanced AI Capabilities (Slim Row) */}
                <CapabilitiesGrid />

                {/* 3. AI-Powered Tools (Grid of 7) */}
                <ToolsGrid />

                {/* 4. Stats Row */}
                <StatsRow stats={stats} />

                {/* 5. Campaign & Activity & Performance Split */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column (2/3) */}
                    <div className="lg:col-span-2 space-y-8">
                        <CampaignOverview />
                        <PerformanceChart />
                    </div>
                    {/* Right Column (1/3) */}
                    <div className="lg:col-span-1 space-y-8">
                        <RecentActivity />
                        {/* AI Intelligence Promo Card */}
                        <div className="rounded-2xl bg-[#5225a7] p-8 text-white h-[200px] flex flex-col justify-between shadow-xl">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <span className="p-1 rounded bg-white/10">🧠</span>
                                        AI Intelligence
                                    </h3>
                                </div>
                            </div>
                            <div>
                                <div className="text-4xl font-bold mb-1">8</div>
                                <p className="text-white/80 text-sm font-medium">AI-generated assets per campaign</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-yellow-400">
                                <span>⚡️ Ready for automation</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
