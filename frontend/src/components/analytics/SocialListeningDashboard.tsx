"use client";

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { MessageSquare, ThumbsUp, TrendingUp, AlertTriangle, RefreshCcw, Twitter, Facebook, Globe, ShieldCheck, UserX, AlertOctagon } from "lucide-react";
import { CompetitorTrackerStub } from "./CompetitorTrackerStub";

// Mock Data for "Live Feed"
const MOCK_MENTIONS = [
    { id: 1, user: "@tech_guru", platform: "twitter", content: "Just tried the new AI features in C(AI)DENCE. Mind blowing! 🤯 #AI #Marketing", sentiment: "positive", time: "2m ago" },
    { id: 2, user: "@marketing_jane", platform: "linkedin", content: "Interesting fast-paced webinar on advanced campaign analytics.", sentiment: "neutral", time: "15m ago" },
    { id: 3, user: "@competitor_fan", platform: "twitter", content: "Honestly, the UI feels a bit sluggish on mobile compared to CompetitorX.", sentiment: "negative", time: "42m ago" },
    { id: 4, user: "@startup_daily", platform: "news", content: "C(AI)DENCE raises bar for automated content generation in latest release.", sentiment: "positive", time: "1h ago" },
    { id: 5, user: "@dev_mike", platform: "reddit", content: "Anyone waiting for the API documentation? It seems sparse.", sentiment: "negative", time: "2h ago" },
];

const WORD_CLOUD_WORDS = [
    { text: "AI", value: 64 },
    { text: "Innovation", value: 60 },
    { text: "Slow", value: 20 },
    { text: "Amazing", value: 50 },
    { text: "Price", value: 30 },
    { text: "UI/UX", value: 45 },
    { text: "Support", value: 25 },
    { text: "Bug", value: 15 },
    { text: "Fast", value: 55 },
    { text: "Marketing", value: 70 },
    { text: "Analytics", value: 40 },
    { text: "Automation", value: 65 },
];

const SENTIMENT_TREND_DATA = [
    { time: "09:00", positive: 45, negative: 12, neutral: 30 },
    { time: "10:00", positive: 52, negative: 8, neutral: 35 },
    { time: "11:00", positive: 48, negative: 15, neutral: 32 },
    { time: "12:00", positive: 60, negative: 10, neutral: 40 },
    { time: "13:00", positive: 75, negative: 5, neutral: 45 }, // Virus/Viral moment
    { time: "14:00", positive: 70, negative: 18, neutral: 42 },
    { time: "15:00", positive: 65, negative: 14, neutral: 38 },
];

export function SocialListeningDashboard() {
    // Client-side only for Wordcloud to avoid hydration mismatched
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* KPI Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Brand Mentions</p>
                            <h3 className="text-3xl font-black text-slate-900 mt-2">1,248</h3>
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-4 text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        +24% vs last week
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Sentiment Score</p>
                            <h3 className="text-3xl font-black text-slate-900 mt-2">84<span className="text-base text-slate-400 font-medium">/100</span></h3>
                        </div>
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <ThumbsUp className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-4 text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Positive Outlook
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Viral Reach</p>
                            <h3 className="text-3xl font-black text-slate-900 mt-2">450k</h3>
                        </div>
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                            <Globe className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-4 text-xs font-bold text-slate-400 flex items-center gap-1">
                        <span>~ avg per post</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Crisis Alerts</p>
                            <h3 className="text-3xl font-black text-slate-900 mt-2">0</h3>
                        </div>
                        <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-4 text-xs font-bold text-slate-400 flex items-center gap-1">
                        <span>No active threats</span>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Sentiment Trend Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-6">Sentiment Trends (Last 24h)</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={SENTIMENT_TREND_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorPos" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorNeg" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="positive" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPos)" />
                                <Area type="monotone" dataKey="negative" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorNeg)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Topic Cloud */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-6">Trending Topics</h3>
                    <div className="h-[300px] flex flex-wrap content-start gap-3 p-4 overflow-y-auto">
                        {WORD_CLOUD_WORDS.map((word) => {
                            // Normalized size calculation (1 to 3 scale roughly)
                            const scale = 0.8 + (word.value / 100) * 1.5;
                            const opacity = 0.7 + (word.value / 100) * 0.3;

                            return (
                                <span
                                    key={word.text}
                                    style={{
                                        fontSize: `${Math.max(0.8, scale)}rem`,
                                        opacity,
                                    }}
                                    className={`px-3 py-1.5 rounded-full border transition-all hover:scale-105 hover:bg-slate-50 cursor-default ${word.value > 60
                                            ? 'bg-indigo-50 border-indigo-100 text-indigo-700 font-bold'
                                            : word.value > 40
                                                ? 'bg-slate-50 border-slate-100 text-slate-700 font-semibold'
                                                : 'border-transparent text-slate-500 font-medium'
                                        }`}
                                    title={`${word.value} mentions`}
                                >
                                    {word.text}
                                </span>
                            );
                        })}
                    </div>
                </div>


            </div>

            {/* Influencer Credibility Section (NEW) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <ShieldCheck className="w-32 h-32 text-indigo-600" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-indigo-600" />
                        Influencer Trust Scanner
                    </h3>

                    <div className="space-y-4">
                        <p className="text-sm text-slate-500">Real-time analysis of active campaign influencers.</p>

                        {/* Mock Influencer 1 */}
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center text-white font-bold text-xs">
                                    @sarah
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900 text-sm">@sarah_style</div>
                                    <div className="text-xs text-slate-500">Instagram</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-black text-emerald-600">92% Score</div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase">Low Risk</div>
                            </div>
                        </div>

                        {/* Mock Influencer 2 */}
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-bold text-xs">
                                    @max
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900 text-sm">@max_gains_99</div>
                                    <div className="text-xs text-slate-500">TikTok</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-black text-red-600 flex items-center gap-1">
                                    <AlertOctagon className="w-3 h-3" />
                                    42% Score
                                </div>
                                <div className="text-[10px] text-red-400 font-bold uppercase">High Bot Activity</div>
                            </div>
                        </div>

                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <UserX className="w-5 h-5 text-slate-500" />
                        Fake Follower Detection
                    </h3>
                    <div className="flex items-center justify-center h-[200px]">
                        <div className="text-center">
                            <div className="text-5xl font-black text-slate-900 mb-2">12.4%</div>
                            <div className="text-sm text-slate-500 font-medium">Average Fake Follower Rate</div>
                            <div className="text-xs text-emerald-600 font-bold mt-2 bg-emerald-50 inline-block px-2 py-1 rounded-full">
                                Better than industry avg (18%)
                            </div>
                        </div>
                    </div>
                </div>
                {/* Competitor Tracker (NEW) */}
                <CompetitorTrackerStub />

            </div>

            {/* Live Feed */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900">Live Mention Feed</h3>
                    <button className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700">
                        <RefreshCcw className="w-3 h-3" />
                        Auto-refreshing
                    </button>
                </div>
                <div className="divide-y divide-slate-100">
                    {MOCK_MENTIONS.map((mention) => (
                        <div key={mention.id} className="p-6 hover:bg-slate-50 transition-colors flex items-start gap-4">
                            <div className="shrink-0">
                                {mention.platform === 'twitter' && <div className="p-2 bg-sky-100 text-sky-600 rounded-full"><Twitter className="w-4 h-4" /></div>}
                                {mention.platform === 'linkedin' && <div className="p-2 bg-blue-100 text-blue-700 rounded-full"><Facebook className="w-4 h-4" /></div>}
                                {mention.platform === 'news' && <div className="p-2 bg-orange-100 text-orange-600 rounded-full"><Globe className="w-4 h-4" /></div>}
                                {mention.platform === 'reddit' && <div className="p-2 bg-red-100 text-red-600 rounded-full"><MessageSquare className="w-4 h-4" /></div>}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-900">{mention.user}</span>
                                        <span className="text-xs text-slate-500">• {mention.time}</span>
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${mention.sentiment === 'positive' ? 'bg-emerald-100 text-emerald-700' :
                                        mention.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                                            'bg-slate-100 text-slate-600'
                                        }`}>
                                        {mention.sentiment}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    {mention.content}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-4 bg-slate-50 text-center">
                    <button className="text-sm font-bold text-slate-500 hover:text-slate-900">View All 1,248 Mentions</button>
                </div>
            </div>
        </div >
    );
}
