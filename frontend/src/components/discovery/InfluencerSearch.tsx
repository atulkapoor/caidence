"use client";

import { useState, useEffect } from "react";
import { searchInfluencers, getInfluencerProfile, InfluencerProfile, SearchFilters } from "@/lib/api";
import { Search, Filter, Camera, Mic, MapPin, Instagram, Youtube, Linkedin, Video, Sparkles, X, ChevronDown, PlusCircle, Users, TrendingUp, Globe, Sliders, UserCheck, Copy, CheckCircle2 } from "lucide-react";
import { InfluencerProfileModal } from "./InfluencerProfileModal";
import { CampaignSelector } from "@/components/campaigns/CampaignSelector";
import { addInfluencerToCampaign } from "@/lib/api/campaigns";
import { toast } from "sonner";

// --- Advanced Filter Sidebar Component (Modash-inspired) ---
interface FilterSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    filters: SearchFilters;
    onFiltersChange: (filters: SearchFilters) => void;
}

function FilterSidebar({ isOpen, onClose, filters, onFiltersChange }: FilterSidebarProps) {
    const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);

    const platforms = ["Instagram", "TikTok", "YouTube", "LinkedIn", "Twitter"];
    const locations = [
        { label: "United States", value: "US" },
        { label: "United Kingdom", value: "UK" },
        { label: "Canada", value: "CA" },
        { label: "Australia", value: "AU" },
        { label: "Germany", value: "DE" },
        { label: "France", value: "FR" },
        { label: "India", value: "IN" },
    ];
    const niches = ["Fashion", "Tech", "Fitness", "Food", "Travel", "Beauty", "Gaming", "Finance", "Parenting", "Lifestyle"];

    const handleApply = () => {
        onFiltersChange(localFilters);
        onClose();
    };

    const handleReset = () => {
        setLocalFilters({});
        onFiltersChange({});
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Sidebar */}
            <div className="relative ml-auto w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">Advanced Filters</h2>
                        <p className="text-sm text-slate-500">Refine your influencer search</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Platform Selection */}
                    <div>
                        <label className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <Globe className="w-4 h-4" /> Platform
                        </label>
                        <div className="grid grid-cols-3 gap-2 mt-3">
                            {platforms.map(platform => (
                                <button
                                    key={platform}
                                    onClick={() => setLocalFilters(prev => ({
                                        ...prev,
                                        platform: prev.platform === platform ? undefined : platform
                                    }))}
                                    className={`px-3 py-2.5 rounded-xl text-sm font-bold border transition-all ${localFilters.platform === platform
                                            ? "bg-slate-900 text-white border-slate-900"
                                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                                        }`}
                                >
                                    {platform}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Follower Range */}
                    <div>
                        <label className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4" /> Follower Count
                        </label>
                        <div className="grid grid-cols-2 gap-3 mt-3">
                            {[
                                { label: "1K - 10K", min: 1000, max: 10000 },
                                { label: "10K - 100K", min: 10000, max: 100000 },
                                { label: "100K - 500K", min: 100000, max: 500000 },
                                { label: "500K - 1M", min: 500000, max: 1000000 },
                                { label: "1M - 5M", min: 1000000, max: 5000000 },
                                { label: "5M+", min: 5000000, max: undefined },
                            ].map(range => (
                                <button
                                    key={range.label}
                                    onClick={() => setLocalFilters(prev => ({
                                        ...prev,
                                        min_reach: prev.min_reach === range.min ? undefined : range.min
                                    }))}
                                    className={`px-3 py-2.5 rounded-xl text-sm font-bold border transition-all ${localFilters.min_reach === range.min
                                            ? "bg-indigo-600 text-white border-indigo-600"
                                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                                        }`}
                                >
                                    {range.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Engagement Rate */}
                    <div>
                        <label className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" /> Engagement Rate
                        </label>
                        <div className="grid grid-cols-3 gap-2 mt-3">
                            {[
                                { label: "> 1%", value: 1 },
                                { label: "> 3%", value: 3 },
                                { label: "> 5%", value: 5 },
                                { label: "> 8%", value: 8 },
                                { label: "> 10%", value: 10 },
                                { label: "> 15%", value: 15 },
                            ].map(opt => (
                                <button
                                    key={opt.label}
                                    onClick={() => setLocalFilters(prev => ({
                                        ...prev,
                                        engagement: prev.engagement === opt.value ? undefined : opt.value
                                    }))}
                                    className={`px-3 py-2.5 rounded-xl text-sm font-bold border transition-all ${localFilters.engagement === opt.value
                                            ? "bg-emerald-600 text-white border-emerald-600"
                                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> Audience Location
                        </label>
                        <div className="flex flex-wrap gap-2 mt-3">
                            {locations.map(loc => (
                                <button
                                    key={loc.value}
                                    onClick={() => setLocalFilters(prev => ({
                                        ...prev,
                                        geo: prev.geo === loc.value ? undefined : loc.value
                                    }))}
                                    className={`px-3 py-2 rounded-full text-sm font-bold border transition-all ${localFilters.geo === loc.value
                                            ? "bg-pink-600 text-white border-pink-600"
                                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                                        }`}
                                >
                                    {loc.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Niche/Category */}
                    <div>
                        <label className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" /> Niche / Category
                        </label>
                        <div className="flex flex-wrap gap-2 mt-3">
                            {niches.map(niche => (
                                <button
                                    key={niche}
                                    onClick={() => setLocalFilters(prev => ({
                                        ...prev,
                                        niche: prev.niche === niche ? undefined : niche
                                    }))}
                                    className={`px-3 py-2 rounded-full text-sm font-bold border transition-all ${localFilters.niche === niche
                                            ? "bg-purple-600 text-white border-purple-600"
                                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                                        }`}
                                >
                                    {niche}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6 flex gap-3">
                    <button
                        onClick={handleReset}
                        className="flex-1 py-3 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
                    >
                        Reset All
                    </button>
                    <button
                        onClick={handleApply}
                        className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- AI Search Suggestions (Modash-inspired) ---
const AI_SEARCH_SUGGESTIONS = [
    "Tech reviewers with energetic vibe and 100K+ followers",
    "Fashion influencers in NYC with high engagement",
    "Fitness creators who do home workouts",
    "Food bloggers focused on vegan recipes",
    "Travel vloggers with cinematic style content",
    "Gaming streamers with loyal communities",
];

export function InfluencerSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<InfluencerProfile[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [activeFilters, setActiveFilters] = useState<SearchFilters>({});
    const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

    // Auto-search when filters change
    useEffect(() => {
        if (Object.keys(activeFilters).length > 0 || query) {
            const performSearch = async () => {
                setLoading(true);
                try {
                    const data = await searchInfluencers(query, activeFilters);
                    setResults(data);
                    setHasSearched(true);
                } catch (err) {
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            };

            if (Object.keys(activeFilters).length > 0) {
                performSearch();
            }
        }
    }, [activeFilters]);

    const [selectedInfluencer, setSelectedInfluencer] = useState<string | null>(null);
    const [selectedProfile, setSelectedProfile] = useState<InfluencerProfile | null>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isCampaignSelectorOpen, setIsCampaignSelectorOpen] = useState(false);

    const handleViewProfile = async (handle: string) => {
        try {
            const profile = await getInfluencerProfile(handle);
            setSelectedProfile(profile);
            setIsProfileOpen(true);
        } catch (error) {
            toast.error("Failed to load profile");
        }
    };

    const handleAddToCampaign = (handle: string) => {
        setSelectedInfluencer(handle);
        setIsCampaignSelectorOpen(true);
    };

    const confirmAddToCampaign = async (campaignId: number) => {
        if (!selectedInfluencer) return;
        try {
            await addInfluencerToCampaign(campaignId, selectedInfluencer);
            toast.success(`Added ${selectedInfluencer} to campaign!`);
            setIsCampaignSelectorOpen(false);
            setSelectedInfluencer(null);
        } catch (e) {
            toast.error("Failed to add influencer");
        }
    };

    const handleSearch = async () => {
        if (!query.trim() && Object.keys(activeFilters).length === 0) return;
        setLoading(true);
        setHasSearched(false);
        try {
            const data = await searchInfluencers(query, activeFilters);
            setResults(data);
            setHasSearched(true);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleLookalikeSearch = async (handle: string) => {
        setQuery(`creators similar to ${handle}`);
        setLoading(true);
        try {
            // In production, this would call a specific lookalike API
            const data = await searchInfluencers(`similar to ${handle}`, activeFilters);
            setResults(data);
            setHasSearched(true);
            toast.success(`Finding creators similar to ${handle}`);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (handle: string) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(handle)) {
                newSet.delete(handle);
            } else {
                newSet.add(handle);
            }
            return newSet;
        });
    };

    const handleBulkAddToCampaign = () => {
        if (selectedItems.size === 0) {
            toast.error("Select at least one influencer");
            return;
        }
        // For bulk, we'd need a different flow - for now just show the count
        toast.info(`${selectedItems.size} influencers selected for campaign`);
        setIsCampaignSelectorOpen(true);
    };

    const activeFilterCount = Object.keys(activeFilters).filter(k => activeFilters[k as keyof SearchFilters] !== undefined).length;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Search Header */}
            <div className="bg-white p-10 rounded-3xl border border-slate-300 shadow-xl shadow-slate-200/40 text-center relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

                {/* Background decorative elements */}
                <div className="absolute top-10 left-10 w-24 h-24 bg-indigo-50 rounded-full blur-2xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="absolute bottom-10 right-10 w-32 h-32 bg-pink-50 rounded-full blur-3xl opacity-50 group-hover:opacity-75 transition-opacity"></div>

                <div className="relative z-10">
                    <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">
                        Find Your Perfect Voice
                    </h1>
                    <p className="text-slate-600 mb-8 max-w-xl mx-auto text-lg leading-relaxed">
                        Our AI analyzes <span className="font-bold text-indigo-600">visual styles</span>, <span className="font-bold text-pink-600">voice patterns</span>, and <span className="font-bold text-purple-600">audience demographics</span> to find creators that match your brand DNA.
                    </p>

                    {/* Main Search Bar */}
                    <div className="max-w-3xl mx-auto relative flex items-center mb-6">
                        <Search className="absolute left-6 w-6 h-6 text-slate-400" />
                        <input
                            className="w-full pl-16 pr-52 py-5 rounded-2xl border border-slate-200 shadow-sm text-lg font-medium focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                            placeholder="Try 'Tech reviewers with energetic vibe'..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <div className="absolute right-3 flex gap-2">
                            {/* AI Input Buttons */}
                            <button onClick={() => toast.info("Visual Search is coming soon!")} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Search by Inspiration Image">
                                <Camera className="w-5 h-5" />
                            </button>
                            <button onClick={() => toast.info("Voice Search is coming soon!")} className="p-3 text-slate-400 hover:text-pink-600 hover:bg-pink-50 rounded-xl transition-all" title="Search by Voice Tone">
                                <Mic className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setIsFilterSidebarOpen(true)}
                                className={`p-3 rounded-xl transition-all relative ${activeFilterCount > 0 ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                                title="Advanced Filters"
                            >
                                <Sliders className="w-5 h-5" />
                                {activeFilterCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>
                            <div className="w-px h-8 bg-slate-200 my-auto mx-1"></div>
                            <button
                                onClick={handleSearch}
                                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                            >
                                <Sparkles className="w-4 h-4" />
                                Search
                            </button>
                        </div>
                    </div>

                    {/* AI Search Suggestions (New - Modash inspired) */}
                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide self-center mr-2">Try:</span>
                        {AI_SEARCH_SUGGESTIONS.slice(0, 3).map((suggestion, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    setQuery(suggestion);
                                    handleSearch();
                                }}
                                className="px-3 py-1.5 text-sm text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-full border border-slate-200 hover:border-slate-300 transition-all truncate max-w-xs"
                            >
                                "{suggestion}"
                            </button>
                        ))}
                    </div>

                    {/* Quick Filter Pills */}
                    <div className="flex flex-wrap justify-center gap-3">
                        <span className="text-sm font-bold text-slate-400 py-1.5 uppercase tracking-wide text-[10px] self-center mr-2">Quick Filters:</span>
                        {[
                            { label: "> 100k Reach", key: 'min_reach', value: 100000 },
                            { label: "Instagram Only", key: 'platform', value: 'Instagram' },
                            { label: "TikTok Only", key: 'platform', value: 'TikTok' },
                            { label: "USA Audience", key: 'geo', value: 'US' },
                            { label: "High Engagement", key: 'engagement', value: 5 },
                        ].map(f => (
                            <button
                                key={f.label}
                                onClick={() => setActiveFilters(prev => {
                                    const newFilters = { ...prev };
                                    if (newFilters[f.key as keyof typeof newFilters] === f.value) {
                                        delete newFilters[f.key as keyof typeof newFilters];
                                    } else {
                                        (newFilters as any)[f.key] = f.value;
                                    }
                                    return newFilters;
                                })}
                                className={`px-4 py-1.5 rounded-full text-sm font-bold border transition-all ${activeFilters[f.key as keyof typeof activeFilters] === f.value
                                    ? "bg-slate-900 text-white border-slate-900"
                                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bulk Actions Bar (Shows when items selected) */}
            {selectedItems.size > 0 && (
                <div className="bg-indigo-600 text-white px-6 py-4 rounded-2xl flex items-center justify-between animate-in slide-in-from-bottom duration-300">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-bold">{selectedItems.size} creator{selectedItems.size > 1 ? 's' : ''} selected</span>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setSelectedItems(new Set())}
                            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-bold transition-all"
                        >
                            Clear Selection
                        </button>
                        <button
                            onClick={handleBulkAddToCampaign}
                            className="px-4 py-2 bg-white text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-all flex items-center gap-2"
                        >
                            <PlusCircle className="w-4 h-4" />
                            Add to Campaign
                        </button>
                    </div>
                </div>
            )}

            {/* Loading / Results Area */}
            <div className="min-h-[400px]">
                {loading && (
                    <div className="flex flex-col items-center justify-center pt-20 animate-in fade-in zoom-in duration-500">
                        <div className="relative w-24 h-24 mb-6">
                            <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-indigo-600 animate-pulse" />
                            </div>
                        </div>

                        <h3 className="text-xl font-black text-slate-900 mb-2">Analyzing Creator Network</h3>
                        <p className="text-slate-500">Scanning content vibes, engagement quality, and brand safety...</p>
                    </div>
                )}

                {!loading && hasSearched && results.length === 0 && (
                    <div className="flex flex-col items-center justify-center pt-20 text-center animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                            <Search className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No matches found</h3>
                        <p className="text-slate-500 max-w-md">We couldn't find any creators matching "{query}". Try broadening your search or using different keywords.</p>
                        <button
                            onClick={() => { setQuery(""); setHasSearched(false); setActiveFilters({}); }}
                            className="mt-6 text-indigo-600 font-bold hover:underline"
                        >
                            Clear Search
                        </button>
                    </div>
                )}

                {!loading && results.length > 0 && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-end px-2">
                            <h2 className="text-xl font-bold text-slate-900">
                                Found {results.length} Creator Matches
                            </h2>
                            <div className="text-sm text-slate-400 font-medium">Sorted by Relevance</div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {results.map((profile, i) => (
                                <div
                                    key={profile.handle}
                                    className={`bg-white rounded-3xl border overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full relative ${selectedItems.has(profile.handle) ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200'
                                        }`}
                                    style={{ animationDelay: `${i * 100}ms` }}
                                >
                                    {/* Selection Checkbox */}
                                    <button
                                        onClick={() => toggleSelection(profile.handle)}
                                        className={`absolute top-4 left-4 z-20 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedItems.has(profile.handle)
                                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                                : 'bg-white/80 border-white/80 hover:border-indigo-300 backdrop-blur-sm'
                                            }`}
                                    >
                                        {selectedItems.has(profile.handle) && <CheckCircle2 className="w-4 h-4" />}
                                    </button>

                                    {/* Header with Color Analysis */}
                                    <div className="h-28 relative overflow-hidden" style={{ backgroundColor: profile.avatar_color }}>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 shadow-lg text-slate-900 border border-white/50">
                                            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                            {profile.match_score}% Match
                                        </div>
                                    </div>

                                    <div className="p-6 relative flex-1 flex flex-col">
                                        {/* Avatar & Ident */}
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg -mt-16 bg-white flex items-center justify-center text-2xl font-black text-slate-300 relative z-10">
                                                {profile.handle.substring(1, 3).toUpperCase()}
                                                <div className="absolute bottom-[-6px] right-[-6px] w-8 h-8 rounded-full border-4 border-white bg-white flex items-center justify-center shadow-sm">
                                                    {profile.platform === 'Instagram' && <Instagram className="w-4 h-4 text-pink-600" />}
                                                    {profile.platform === 'TikTok' && <Video className="w-4 h-4 text-black" />}
                                                    {profile.platform === 'YouTube' && <Youtube className="w-4 h-4 text-red-600" />}
                                                    {profile.platform === 'LinkedIn' && <Linkedin className="w-4 h-4 text-blue-700" />}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-black text-slate-900 leading-tight">
                                                    {(profile.followers > 1000000)
                                                        ? (profile.followers / 1000000).toFixed(1) + 'M'
                                                        : (profile.followers / 1000).toFixed(0) + 'k'
                                                    }
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Followers</div>
                                            </div>
                                        </div>

                                        <div className="mb-6">
                                            <h3 className="text-lg font-bold text-slate-900 mb-1">{profile.handle}</h3>
                                            <p className="text-sm text-slate-500 font-medium line-clamp-2">
                                                Content primarily focused on {profile.image_recognition_tags.join(", ").toLowerCase()}.
                                            </p>
                                        </div>

                                        {/* AI Tags */}
                                        <div className="space-y-3 mb-6 flex-1">
                                            <div className="bg-slate-100 p-3 rounded-2xl border border-slate-200">
                                                <div className="text-[10px] uppercase font-bold text-slate-500 mb-2 flex items-center gap-1">
                                                    <Camera className="w-3 h-3" /> Visual Style
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {profile.content_style_match.map(tag => (
                                                        <span key={tag} className="text-xs font-bold text-slate-700 bg-white border border-slate-300 px-2 py-1 rounded-lg">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="bg-slate-100 p-3 rounded-2xl border border-slate-200">
                                                <div className="text-[10px] uppercase font-bold text-slate-500 mb-2 flex items-center gap-1">
                                                    <Mic className="w-3 h-3" /> Voice & Tone
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {profile.voice_analysis.slice(0, 3).map(tag => (
                                                        <span key={tag} className="text-xs font-bold text-slate-700 bg-white border border-slate-300 px-2 py-1 rounded-lg">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Metrics Grid */}
                                        <div className="grid grid-cols-2 gap-px bg-slate-100 border border-slate-100 rounded-xl overflow-hidden mb-6">
                                            <div className="bg-white p-3 text-center">
                                                <div className="text-lg font-black text-slate-900">{profile.engagement_rate}%</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase">Eng. Rate</div>
                                            </div>
                                            <div className="bg-white p-3 text-center">
                                                <div className="text-lg font-black text-slate-900">{profile.audience_demographics.split(',')[0]}</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase">Age Group</div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleViewProfile(profile.handle)}
                                                className="flex-1 py-3 bg-white border-2 border-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-all"
                                            >
                                                View Profile
                                            </button>
                                            <button
                                                onClick={() => handleLookalikeSearch(profile.handle)}
                                                className="flex items-center justify-center w-12 bg-purple-50 border-2 border-purple-100 text-purple-600 rounded-xl hover:bg-purple-100 hover:border-purple-200 transition-all"
                                                title="Find Similar Creators"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleAddToCampaign(profile.handle)}
                                                className="flex items-center justify-center w-12 bg-indigo-50 border-2 border-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-100 hover:border-indigo-200 transition-all font-bold"
                                                title="Add to Campaign"
                                            >
                                                <PlusCircle className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Filter Sidebar */}
            <FilterSidebar
                isOpen={isFilterSidebarOpen}
                onClose={() => setIsFilterSidebarOpen(false)}
                filters={activeFilters}
                onFiltersChange={setActiveFilters}
            />

            <CampaignSelector
                isOpen={isCampaignSelectorOpen}
                onClose={() => setIsCampaignSelectorOpen(false)}
                onSelect={confirmAddToCampaign}
                title={selectedItems.size > 1 ? `Add ${selectedItems.size} creators to Campaign` : `Add ${selectedInfluencer} to Campaign`}
            />

            <InfluencerProfileModal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                profile={selectedProfile}
            />
        </div>
    );
}
