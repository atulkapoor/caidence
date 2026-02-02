"use client";

import { useState, useEffect, Suspense } from "react";
import { useTabState } from "@/hooks/useTabState";
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { Plus, Search, Filter, Calendar as CalendarIcon, BarChart3, List, LayoutGrid, Check, X } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

import { AgentWizard } from "@/components/campaigns/AgentWizard";
import { CreateCampaignTab } from "@/components/campaigns/CreateCampaignTab"; // Keep static if frequently used or light
// import { AnalyticsTab } from "@/components/campaigns/AnalyticsTab";
import dynamic from "next/dynamic";
const AnalyticsTab = dynamic(() => import("@/components/campaigns/AnalyticsTab").then(mod => mod.AnalyticsTab), {
    loading: () => <div className="p-10 text-center text-slate-400">Loading Analytics Module...</div>,
    ssr: false
});
import { SocialCalendar } from "@/components/social/SocialCalendar";

function CampaignContent() {
    // Current valid tabs: "Campaign List", "Create Campaign", "Analytics", "Calendar"
    // Using simple string matching for state.
    const [activeTab, setActiveTab] = useTabState("Campaign List");
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);

    // Filters
    const [statusFilter, setStatusFilter] = useState<string>("free-all"); // "free-all" is logic for "All"
    const [searchQuery, setSearchQuery] = useState("");

    const searchParams = useSearchParams();
    const router = useRouter();

    // Check for edit param on load
    useEffect(() => {
        const editId = searchParams.get('edit');
        if (editId) {
            // Find campaign and open modal (simulated for now as we don't have full edit form)
            // In real app, we would fetch(id) and set form state.
            // For now, just opening the create modal with title pre-filled if found
            // setIsCreateModalOpen(true);
            // We'll leave this as a placeholder or specific alert for now until Edit Modal is fully built
        }
    }, [searchParams]);

    // Create Form State
    const [newCampaignTitle, setNewCampaignTitle] = useState("");
    const [newCampaignStatus, setNewCampaignStatus] = useState("draft");

    useEffect(() => {
        loadCampaigns();
    }, []);

    const loadCampaigns = async () => {
        setIsLoading(true);
        try {
            // @ts-ignore
            const { fetchCampaigns } = await import("@/lib/api");
            const data = await fetchCampaigns();
            const processed = data.map((c: any) => {
                let parsedChannels: string[] = [];
                try {
                    if (Array.isArray(c.channels)) {
                        parsedChannels = c.channels;
                    } else if (typeof c.channels === 'string') {
                        const trimmed = c.channels.trim();
                        if (trimmed.startsWith('[')) {
                            const parsed = JSON.parse(trimmed);
                            if (Array.isArray(parsed)) parsedChannels = parsed;
                        } else if (trimmed) {
                            parsedChannels = [trimmed];
                        }
                    }
                } catch (e) {
                    console.warn("Error parsing channels:", c.channels);
                }
                return { ...c, channels: parsedChannels };
            });
            setCampaigns(processed);
        } catch (error) {
            console.error("Failed to load campaigns", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateCampaign = async () => {
        if (!newCampaignTitle.trim()) return;

        try {
            // @ts-ignore
            const { createCampaign } = await import("@/lib/api");
            await createCampaign({
                title: newCampaignTitle,
                status: newCampaignStatus
            });
            await loadCampaigns();
            setIsCreateModalOpen(false);
            setNewCampaignTitle("");
        } catch (error) {
            console.error("Failed to create campaign", error);
            alert("Failed to create campaign. Please try again.");
        }
    };

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-slate-100 p-8">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20">
                                <LayoutGrid className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Campaign Planner</h1>
                                <p className="text-slate-600 text-sm font-medium">Strategic campaign management and scheduling</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                New Campaign Manually
                            </button>
                            <button
                                onClick={() => setIsAgentModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-[#5225a7] text-white font-bold text-sm rounded-xl hover:bg-[#431d8a] transition-colors shadow-sm shadow-primary/20"
                            >
                                <span className="text-lg">✨</span>
                                Use AI Agent
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex justify-center mb-10">
                        <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-300 inline-flex">
                            <button
                                onClick={() => setActiveTab("Campaign List")}
                                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "Campaign List"
                                    ? "bg-slate-900 text-white shadow-md"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                                    }`}
                            >
                                <List className="w-4 h-4" />
                                Campaigns
                            </button>
                            <button
                                onClick={() => setActiveTab("Calendar")}
                                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "Calendar"
                                    ? "bg-slate-900 text-white shadow-md"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                                    }`}
                            >
                                <CalendarIcon className="w-4 h-4" />
                                Calendar
                            </button>
                            <button
                                onClick={() => setActiveTab("Create Campaign")}
                                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "Create Campaign"
                                    ? "bg-slate-900 text-white shadow-md"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                                    }`}
                            >
                                <Plus className="w-4 h-4" />
                                Create New
                            </button>
                            <button
                                onClick={() => setActiveTab("Analytics")}
                                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "Analytics"
                                    ? "bg-slate-900 text-white shadow-md"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                                    }`}
                            >
                                <BarChart3 className="w-4 h-4" />
                                Analytics
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="animate-in fade-in duration-500">
                        {/* 1. Campaign List View */}
                        {activeTab === "Campaign List" && (
                            <div className="space-y-6">
                                {/* Filters */}
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="relative flex-1 max-w-md">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search campaigns..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                                        />
                                    </div>
                                    <div className="relative group">
                                        <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 min-w-[140px] justify-between">
                                            <span className="flex items-center gap-2"><Filter className="w-4 h-4" /> {statusFilter === "free-all" ? "All Status" : statusFilter}</span>
                                        </button>
                                        <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-xl z-20 hidden group-hover:block animate-in fade-in zoom-in-95 duration-200">
                                            {["All", "active", "draft", "paused", "completed"].map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => setStatusFilter(s === "All" ? "free-all" : s)}
                                                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm font-medium capitalize first:rounded-t-xl last:rounded-b-xl"
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Grid */}
                                {isLoading ? (
                                    <div className="flex justify-center py-20">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : campaigns.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                                        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                            <LayoutGrid className="h-8 w-8 text-slate-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-slate-900">No Campaigns Yet</h3>
                                        <p className="text-slate-500 text-sm mt-1 mb-6">Create your first campaign to get started.</p>
                                        <button
                                            onClick={() => setIsCreateModalOpen(true)}
                                            className="px-4 py-2 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                                        >
                                            Create Campaign
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {campaigns
                                            .filter(c => statusFilter === "free-all" || c.status === statusFilter)
                                            .filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
                                            .map((camp: any, idx: number) => (
                                                <CampaignCard key={idx} {...camp} />
                                            ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 2. Other Views */}
                        {activeTab === "Calendar" && <SocialCalendar campaigns={campaigns} />}
                        {activeTab === "Create Campaign" && <CreateCampaignTab />}
                        {activeTab === "Analytics" && <AnalyticsTab />}
                    </div>
                </div>

                {/* Create Campaign Modal */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h2 className="text-lg font-bold text-slate-900">New Campaign</h2>
                                <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                    ✕
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Campaign Title</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Summer Sale 2026"
                                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={newCampaignTitle}
                                        onChange={(e) => setNewCampaignTitle(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Status</label>
                                    <select
                                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={newCampaignStatus}
                                        onChange={(e) => setNewCampaignStatus(e.target.value)}
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="active">Active</option>
                                        <option value="paused">Paused</option>
                                    </select>
                                </div>
                            </div>
                            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
                                <button
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateCampaign}
                                    disabled={!newCampaignTitle.trim()}
                                    className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Create Campaign
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Agent Wizard Modal */}
                <AgentWizard
                    isOpen={isAgentModalOpen}
                    onClose={() => setIsAgentModalOpen(false)}
                    onSuccess={() => {
                        loadCampaigns();
                        setActiveTab("Campaign List");
                    }}
                />
            </div>
        </DashboardLayout>
    );
}

export default function CampaignPage() {
    return (
        <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading campaigns...</div>}>
            <CampaignContent />
        </Suspense>
    );
}
