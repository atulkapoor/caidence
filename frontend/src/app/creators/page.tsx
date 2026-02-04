"use client";

import { useState, useEffect, Suspense } from "react";
import { useTabState } from "@/hooks/useTabState";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Users, Plus, Search, Filter, MoreHorizontal, Link2, FileText, Instagram, Youtube } from "lucide-react";
import { fetchCreators, addCreator, deleteCreator, generateAffiliateCode, Creator } from "@/lib/api";
import { toast } from "sonner";

function CreatorsContent() {
    const [creators, setCreators] = useState<Creator[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useTabState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [newHandle, setNewHandle] = useState("");
    const [newPlatform, setNewPlatform] = useState("Instagram");
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await fetchCreators();
            setCreators(data);
        } catch (err) {
            console.error("API Fetch Error", err);
            // Fallback to mock data if API fails (for demo purposes)
            setCreators([
                { id: 1, handle: "@emma_styles", platform: "Instagram", name: "Emma Johnson (Mock)", category: "Fashion", tier: "Macro", follower_count: 850000, engagement_rate: 4.2, status: "active", affiliate_code: "EMMA2026" },
                { id: 2, handle: "@techguru_mike", platform: "YouTube", name: "Mike Chen", category: "Technology", tier: "Mega", follower_count: 2500000, engagement_rate: 3.8, status: "active", affiliate_code: "TECHGURU" },
                { id: 3, handle: "@fitlife_sarah", platform: "TikTok", name: "Sarah Williams", category: "Fitness", tier: "Micro", follower_count: 95000, engagement_rate: 7.1, status: "vetted" },
                { id: 4, handle: "@foodie_alex", platform: "Instagram", name: "Alex Rivera", category: "Food", tier: "Macro", follower_count: 620000, engagement_rate: 5.5, status: "active", affiliate_code: "FOODIE" },
                { id: 5, handle: "@travel_jen", platform: "YouTube", name: "Jennifer Lee", category: "Travel", tier: "Macro", follower_count: 780000, engagement_rate: 4.9, status: "past" },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCreator = async () => {
        if (!newHandle.trim()) return;
        setAdding(true);
        try {
            await addCreator(newHandle, newPlatform);
            setShowAddModal(false);
            setNewHandle("");
            toast.success("Creator added successfully!");
            await loadData();
        } catch (err) {
            console.error(err);
            toast.error("Failed to add creator");
            const mockCreator: any = {
                id: Date.now(),
                handle: newHandle,
                platform: newPlatform,
                name: "New Creator",
                category: "General",
                tier: "Micro",
                follower_count: 0,
                engagement_rate: 0,
                status: "vetted"
            };
            setCreators(prev => [mockCreator, ...prev]);
            setShowAddModal(false);
            setNewHandle("");
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to remove this creator?")) return;
        try {
            await deleteCreator(id);
            setCreators(prev => prev.filter(c => c.id !== id));
            toast.success("Creator removed");
        } catch (e) {
            console.error(e);
            toast.error("Failed to remove creator");
            setCreators(prev => prev.filter(c => c.id !== id));
        }
    };

    const handleGenerateCode = async (id: number) => {
        try {
            const res = await generateAffiliateCode(id);
            setCreators(prev => prev.map(c => c.id === id ? { ...c, affiliate_code: res.code } : c));
            toast.success("Affiliate code generated");
        } catch (e) {
            console.error(e);
            toast.error("Using mock code (API failed)");
            setCreators(prev => prev.map(c => c.id === id ? { ...c, affiliate_code: `CODE${id}` } : c));
        }
    }

    const filteredCreators = creators.filter(c => {
        const matchesTab = activeTab === "all" || (c.status || "active") === activeTab;
        const matchesSearch = (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || (c.handle || "").toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const formatFollowers = (count: number) => {
        if (!count) return "0";
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
        return count.toString();
    };

    const getPlatformIcon = (platform: string) => {
        switch (platform?.toLowerCase() || "") {
            case "instagram": return <Instagram className="w-4 h-4" />;
            case "youtube": return <Youtube className="w-4 h-4" />;
            default: return <Users className="w-4 h-4" />;
        }
    };

    const getTierColor = (tier: string) => {
        switch (tier?.toLowerCase() || "") {
            case "mega": return "bg-purple-100 text-purple-700";
            case "macro": return "bg-blue-100 text-blue-700";
            case "micro": return "bg-emerald-100 text-emerald-700";
            case "nano": return "bg-amber-100 text-amber-700";
            default: return "bg-slate-100 text-slate-700";
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-6 p-4">
                {/* Header */}
                <header className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900">Creator Roster</h1>
                        <p className="text-slate-500">Manage your talent partnerships and track performance.</p>
                    </div>
                    <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl font-bold hover:bg-slate-800 transition-colors">
                        <Plus className="w-4 h-4" />
                        Add Creator
                    </button>
                </header>

                {/* Add Creator Modal primitive */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-2xl w-96 shadow-xl space-y-4">
                            <h3 className="font-bold text-lg">Add New Creator</h3>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Handle</label>
                                <input
                                    autoFocus
                                    value={newHandle}
                                    onChange={(e) => setNewHandle(e.target.value)}
                                    placeholder="@handle"
                                    className="w-full border p-2 rounded-lg"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Platform</label>
                                <select
                                    className="w-full border p-2 rounded-lg bg-white"
                                    value={newPlatform}
                                    onChange={(e) => setNewPlatform(e.target.value)}
                                >
                                    <option value="Instagram">Instagram</option>
                                    <option value="TikTok">TikTok</option>
                                    <option value="YouTube">YouTube</option>
                                </select>
                            </div>
                            <div className="flex gap-2 justify-end pt-2">
                                <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-slate-500 font-bold">Cancel</button>
                                <button onClick={handleAddCreator} disabled={adding} className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold">
                                    {adding ? "Adding..." : "Add"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats Bar */}
                <div className="flex gap-4">
                    <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 flex items-center gap-3">
                        <Users className="w-5 h-5 text-slate-400" />
                        <span className="font-bold text-slate-900">{creators.length}</span>
                        <span className="text-slate-500 text-sm">Total</span>
                    </div>
                    <div className="bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-100 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="font-bold text-emerald-700">{creators.filter(c => c.status === "active").length}</span>
                        <span className="text-emerald-600 text-sm">Active</span>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 flex justify-between items-center">
                    <div className="flex gap-2">
                        {["all", "active", "vetted", "past"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-lg font-bold text-sm capitalize transition-colors ${activeTab === tab
                                    ? "bg-slate-900 text-white"
                                    : "text-slate-500 hover:bg-slate-100"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search creators..."
                                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 w-64 focus:outline-none focus:ring-2 focus:ring-slate-900"
                            />
                        </div>
                        <button className="px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">
                            <Filter className="w-4 h-4 text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs">
                            <tr>
                                <th className="px-6 py-4">Creator</th>
                                <th className="px-6 py-4">Platform</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Followers</th>
                                <th className="px-6 py-4">Engagement</th>
                                <th className="px-6 py-4">Tier</th>
                                <th className="px-6 py-4">Affiliate</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={8} className="p-8 text-center text-slate-400">Loading creators...</td></tr>
                            ) : filteredCreators.map((creator) => (
                                <tr key={creator.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                                {(creator.name || "?").charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900">{creator.name}</div>
                                                <div className="text-xs text-slate-500">{creator.handle}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            {getPlatformIcon(creator.platform)}
                                            {creator.platform}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{creator.category}</td>
                                    <td className="px-6 py-4 font-bold text-slate-900">{formatFollowers(creator.follower_count)}</td>
                                    <td className="px-6 py-4">
                                        <span className="text-emerald-600 font-bold">{creator.engagement_rate}%</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${getTierColor(creator.tier)}`}>
                                            {creator.tier}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {creator.affiliate_code ? (
                                            <span className="text-indigo-600 font-mono text-xs">{creator.affiliate_code}</span>
                                        ) : (
                                            <button onClick={() => handleGenerateCode(creator.id)} className="text-slate-400 hover:text-indigo-600 flex items-center gap-1 text-xs">
                                                <Link2 className="w-3 h-3" /> Generate
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleDelete(creator.id)} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors" title="Remove Creator">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default function CreatorsPage() {
    return (
        <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading creators...</div>}>
            <CreatorsContent />
        </Suspense>
    );
}
