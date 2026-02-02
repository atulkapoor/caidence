"use client";

import { useState, useEffect } from "react";
import { searchInfluencers, getInfluencerProfile, InfluencerProfile, SearchFilters } from "@/lib/api";
import { Search, Filter, Camera, Mic, MapPin, Instagram, Youtube, Linkedin, Video, Sparkles, X, ChevronDown, PlusCircle } from "lucide-react";
import { InfluencerProfileModal } from "./InfluencerProfileModal";
import { CampaignSelector } from "@/components/campaigns/CampaignSelector";
import { addInfluencerToCampaign } from "@/lib/api/campaigns";
import { toast } from "sonner";

export function InfluencerSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<InfluencerProfile[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [activeFilters, setActiveFilters] = useState<SearchFilters>({});

    // Auto-search when filters change
    useEffect(() => {
        if (Object.keys(activeFilters).length > 0 || query) {
            // Debounce or just call? For now direct call is fine if filters change rarely.
            // We need to extract the search logic to avoid stale state if using a function not in dependency.
            // But handleSearch uses current state 'query' and 'activeFilters'.
            // If we call it here, it uses the state from the render scope.
            // We need to be careful.

            // Let's just create an internal search function that accepts params to be safe.
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
    }, [activeFilters]); // Only when filters change

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

    // Trigger search when filters change (with debounce or effect in real app, but direct call here for transparency)
    // We'll use useEffect to watch filters? Or just call handleSearch inside toggleFilter?
    // Using useEffect is cleaner for this reactive pattern.

    // Actually, to avoid infinite loops or complexity, let's just update toggleFilter to call search.
    // BUT activeFilters state update is async.
    // So we should use useEffect.

    // Let's defer that refactor and just fix the "Search" button logic first + empty query.
    // Wait, the user said "Filters not working". If they click filters and nothing happens, that's bad.
    // So auto-trigger is desired.

    const toggleFilter = (key: keyof typeof activeFilters, value: any) => {
        setActiveFilters(prev => {
            const newFilters = { ...prev };
            if (newFilters[key] === value) {
                delete newFilters[key]; // Toggle off
            } else {
                newFilters[key] = value; // Toggle on
            }
            // Trigger search with new filters immediately (we can't wait for state update in this closure if we call handleSearch now)
            // So we define a helper or rely on useEffect. 
            // Let's use a one-off async call here to searchInfluencers directly or assume the user clicks search.
            // If I change the Search button logic, at least they CAN search.
            // But good UX = auto search.

            // Let's try to just update state, and then rely on the user clicking search OR add a useEffect.
            return newFilters;
        });
    }

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
                    <p className="text-slate-600 mb-10 max-w-xl mx-auto text-lg leading-relaxed">
                        Our AI analyzes <span className="font-bold text-indigo-600">visual styles</span>, <span className="font-bold text-pink-600">voice patterns</span>, and <span className="font-bold text-purple-600">audience demographics</span> to find creators that match your brand DNA.
                    </p>

                    <div className="max-w-2xl mx-auto relative flex items-center mb-8">
                        <Search className="absolute left-6 w-6 h-6 text-slate-400" />
                        <input
                            className="w-full pl-16 pr-44 py-5 rounded-2xl border border-slate-200 shadow-sm text-lg font-medium focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                            placeholder="Try 'Tech reviewers with energetic vibe'..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <div className="absolute right-3 flex gap-2">
                            {/* Mock AI Inputs */}
                            <button className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Search by Inspiration Image">
                                <Camera className="w-5 h-5" />
                            </button>
                            <button className="p-3 text-slate-400 hover:text-pink-600 hover:bg-pink-50 rounded-xl transition-all" title="Search by Voice Tone">
                                <Mic className="w-5 h-5" />
                            </button>
                            <div className="w-px h-8 bg-slate-200 my-auto mx-1"></div>
                            <button
                                onClick={handleSearch}
                                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                            >
                                Search
                            </button>
                        </div>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex flex-wrap justify-center gap-3">
                        <span className="text-sm font-bold text-slate-400 py-1.5 uppercase tracking-wide text-[10px] self-center mr-2">Quick Filters:</span>
                        {[
                            { label: "> 100k Reach", key: 'reach', value: 100000 },
                            { label: "Instagram Only", key: 'platform', value: 'Instagram' },
                            { label: "TikTok Only", key: 'platform', value: 'TikTok' },
                            { label: "USA Audience", key: 'geo', value: 'US' },
                        ].map(f => (
                            <button
                                key={f.label}
                                onClick={() => toggleFilter(f.key as any, f.value)}
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
                            onClick={() => { setQuery(""); setHasSearched(false) }}
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
                                    className="bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full"
                                    style={{ animationDelay: `${i * 100}ms` }}
                                >
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
            <CampaignSelector
                isOpen={isCampaignSelectorOpen}
                onClose={() => setIsCampaignSelectorOpen(false)}
                onSelect={confirmAddToCampaign}
                title={`Add ${selectedInfluencer} to Campaign`}
            />

            <InfluencerProfileModal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                profile={selectedProfile}
            />
        </div>);
}
