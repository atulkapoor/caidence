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
import { getOnboardingProgress } from "@/lib/api/onboarding";
import Link from "next/link";
import { Rocket } from "lucide-react";

function DashboardContent() {
    const { industry } = usePreferences();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState("6m");
    const [showOnboardingBanner, setShowOnboardingBanner] = useState(false);

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

    useEffect(() => {
        getOnboardingProgress()
            .then((p) => { if (!p.is_complete) setShowOnboardingBanner(true); })
            .catch(() => {});
    }, []);

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
                {/* Onboarding completion banner */}
                {showOnboardingBanner && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                                <Rocket size={20} className="text-indigo-600" />
                            </div>
                            <div>
                                <p className="font-bold text-indigo-900">Complete your setup</p>
                                <p className="text-sm text-indigo-700 font-medium">Finish onboarding to unlock all features and connect your social accounts.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <button onClick={() => setShowOnboardingBanner(false)} className="text-sm font-bold text-indigo-400 hover:text-indigo-600 transition-colors">
                                Dismiss
                            </button>
                            <Link href="/onboarding" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors">
                                Continue Setup
                            </Link>
                        </div>
                    </div>
                )}

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
