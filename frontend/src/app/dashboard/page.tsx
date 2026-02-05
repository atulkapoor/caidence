"use client";

import { useEffect, useState, Suspense } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { usePreferences } from "@/context/PreferencesContext";
import { ActionCards } from "@/components/dashboard/ActionCards";
import { CapabilitiesGrid } from "@/components/dashboard/CapabilitiesGrid";
import { ToolsGrid } from "@/components/dashboard/ToolsGrid";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { CampaignOverview } from "@/components/dashboard/CampaignOverview";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { fetchDashboardStats, type DashboardData } from "@/lib/api";

function DashboardContent() {
    const { industry } = usePreferences();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState("6m");

    useEffect(() => {
        async function loadData() {
            try {
                const dashboardData = await fetchDashboardStats(range);
                setData(dashboardData);
            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [range]);

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-full">
                    <p className="text-slate-400 font-medium">Loading dashboard...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-12 pb-12">
                {/* 0. Header Text */}
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">C(AI)DENCE</h1>
                    <p className="text-lg text-slate-600 font-medium">AI-powered intelligence for <span className="text-indigo-600 font-bold">{industry || "Marketing"}</span></p>
                </div>

                {/* 1. Action Cards */}
                <ActionCards />

                {/* 2. Advanced AI Capabilities */}
                <CapabilitiesGrid />

                {/* 3. AI-Powered Tools */}
                <ToolsGrid />

                {/* 4. Stats Row */}
                <StatsRow stats={data?.stats || null} />

                {/* 5. Campaign & Activity & Performance Split */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column (2/3) */}
                    <div className="lg:col-span-2 space-y-8">
                        <CampaignOverview campaign={data?.featuredCampaign} />
                        <PerformanceChart
                            data={data?.performance || []}
                            currentRange={range}
                            onRangeChange={setRange}
                        />
                    </div>
                    {/* Right Column (1/3) */}
                    <div className="lg:col-span-1 space-y-8">
                        <RecentActivity activities={data?.activities || []} />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default function Dashboard() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <DashboardContent />
        </Suspense>
    );
}
