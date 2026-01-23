"use client";

import { useState } from "react";
import { searchInfluencers, InfluencerProfile } from "@/lib/api";
import { Search, Filter, Camera, Mic, MapPin, Instagram, Youtube, Linkedin, Video, Sparkles } from "lucide-react";

export function InfluencerSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<InfluencerProfile[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        try {
            const data = await searchInfluencers(query);
            setResults(data);
            setHasSearched(true);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Search Header */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                <h1 className="text-3xl font-black text-slate-900 mb-2">Advanced Discovery Engine</h1>
                <p className="text-slate-500 mb-8 max-w-xl mx-auto">
                    Find creators using AI-powered <span className="font-bold text-indigo-600">Image Recognition</span>, <span className="font-bold text-pink-600">Voice Analysis</span>, and <span className="font-bold text-purple-600">Vibe Matching</span>.
                </p>

                <div className="max-w-2xl mx-auto relative flex items-center">
                    <Search className="absolute left-4 w-5 h-5 text-slate-400" />
                    <input
                        className="w-full pl-12 pr-64 py-4 rounded-xl border border-slate-200 shadow-sm text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="Try 'Tech reviewers with high energy' or 'Minimalist fashion'"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <div className="absolute right-3 flex gap-2">
                        <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Search by Image (Mock)">
                            <Camera className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors" title="Search by Audio (Mock)">
                            <Mic className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleSearch}
                            className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-800 transition-colors"
                        >
                            Search
                        </button>
                    </div>
                </div>

                {/* Quick Filters */}
                <div className="flex justify-center gap-4 mt-6 text-sm">
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 transition-colors text-slate-500 font-medium">
                        <Filter className="w-4 h-4" /> Filters
                    </button>
                    <button className="px-3 py-1.5 rounded-full bg-slate-50 text-slate-600 border border-slate-100 font-medium">&gt; 100k Reach</button>
                    <button className="px-3 py-1.5 rounded-full bg-slate-50 text-slate-600 border border-slate-100 font-medium">High Engagement</button>
                    <button className="px-3 py-1.5 rounded-full bg-slate-50 text-slate-600 border border-slate-100 font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> USA Only
                    </button>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="text-center py-20">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent mb-4"></div>
                    <p className="text-slate-500 font-medium animate-pulse">Analyzing content vibes and voice patterns...</p>
                </div>
            )}

            {/* Results Grid */}
            {!loading && results.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {results.map((profile) => (
                        <div key={profile.handle} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group">
                            {/* Header with Match Score */}
                            <div className="h-24 relative" style={{ backgroundColor: profile.avatar_color }}>
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow-sm text-slate-900">
                                    <Sparkles className="w-3 h-3 text-amber-500" />
                                    {profile.match_score}% Match
                                </div>
                            </div>

                            <div className="p-6 relative">
                                {/* Avatar */}
                                <div className="w-16 h-16 rounded-full border-4 border-white shadow-sm absolute -top-8 left-6 bg-white flex items-center justify-center text-xl font-bold text-slate-400">
                                    {profile.handle.substring(1, 3).toUpperCase()}
                                </div>

                                <div className="ml-24 mb-4">
                                    <h3 className="text-lg font-bold text-slate-900">{profile.handle}</h3>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-tighter">
                                        {profile.platform === 'Instagram' && <Instagram className="w-3 h-3" />}
                                        {profile.platform === 'TikTok' && <Video className="w-3 h-3" />}
                                        {profile.platform === 'YouTube' && <Youtube className="w-3 h-3" />}
                                        {profile.platform === 'LinkedIn' && <Linkedin className="w-3 h-3" />}
                                        {profile.followers.toLocaleString()} Followers
                                    </div>
                                </div>

                                {/* AI Analysis Tags */}
                                <div className="space-y-3 mb-6">
                                    <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                                        <div className="text-[10px] uppercase font-bold text-indigo-400 mb-1 flex items-center gap-1">
                                            <Camera className="w-3 h-3" /> Visual Style
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {profile.content_style_match.map(tag => (
                                                <span key={tag} className="text-xs font-bold text-indigo-700 bg-white px-2 py-0.5 rounded shadow-sm">
                                                    {tag}
                                                </span>
                                            ))}
                                            {profile.image_recognition_tags.slice(0, 2).map(tag => (
                                                <span key={tag} className="text-xs font-medium text-indigo-600 px-1">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-pink-50 p-3 rounded-xl border border-pink-100">
                                        <div className="text-[10px] uppercase font-bold text-pink-400 mb-1 flex items-center gap-1">
                                            <Mic className="w-3 h-3" /> Voice Analysis
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {profile.voice_analysis.map(tag => (
                                                <span key={tag} className="text-xs font-bold text-pink-700 bg-white px-2 py-0.5 rounded shadow-sm">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Stats Footer */}
                                <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
                                    <div>
                                        <div className="text-slate-400 text-xs font-medium">Engagement</div>
                                        <div className="font-bold text-slate-900">{profile.engagement_rate}%</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-slate-400 text-xs font-medium">Audience</div>
                                        <div className="font-bold text-slate-900">{profile.audience_demographics}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && hasSearched && results.length === 0 && (
                <div className="text-center py-20 text-slate-400">
                    No matching creators found. Try a different query.
                </div>
            )}
        </div>
    );
}
