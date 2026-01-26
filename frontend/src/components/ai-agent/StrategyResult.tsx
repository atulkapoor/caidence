"use client";

import { useState } from "react";
import { useTabState } from "@/hooks/useTabState";
import { Users, Share2, FileText, Lightbulb, ChevronRight, Save, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";

interface StrategyResultProps {
    strategy: any; // JSON object from backend
    projectId: number;
}

export function StrategyResult({ strategy, projectId }: StrategyResultProps) {
    const [activeTab, setActiveTab] = useTabState("audience");

    const tabs = [
        { id: "audience", label: "Target Audience", icon: Users },
        { id: "channels", label: "Key Channels", icon: Share2 },
        { id: "content", label: "Content Ideas", icon: FileText },
        { id: "recommendations", label: "Strategy", icon: Lightbulb },
    ];

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-8 text-white">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                            <Lightbulb className="w-3 h-3" /> AI Strategy Generated
                        </div>
                        <h2 className="text-3xl font-black mb-2">Your Marketing Campaign Strategy</h2>
                        <p className="text-indigo-100 max-w-xl">
                            Our AI agents have analyzed your objectives and formulated a comprehensive plan to maximize impact.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/dashboard">
                            <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold backdrop-blur-sm transition-colors flex items-center gap-2">
                                <LayoutDashboard className="w-4 h-4" />
                                Dashboard
                            </button>
                        </Link>
                        <button
                            onClick={() => toast.success("Project saved successfully!")}
                            className="px-4 py-2 bg-white text-indigo-600 hover:bg-indigo-50 rounded-xl text-sm font-bold shadow-lg transition-colors flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            Save Project
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex border-b border-slate-200">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all",
                            activeTab === tab.id
                                ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="p-8 min-h-[400px]">
                {/* 1. Target Audience */}
                {activeTab === "audience" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Target Personas</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {strategy.target_audience?.map((persona: any, i: number) => (
                                <div key={i} className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4 text-indigo-600">
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <h4 className="font-bold text-slate-900 text-lg mb-2">{persona.name}</h4>
                                    <p className="text-slate-600 text-sm leading-relaxed">{persona.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 2. Key Channels */}
                {activeTab === "channels" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Recommended Channels</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {strategy.key_channels?.map((channel: string, i: number) => (
                                <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-indigo-200 transition-colors group">
                                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        <Share2 className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold text-slate-900">{channel}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 3. Content Ideas */}
                {activeTab === "content" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Campaign Content Plan</h3>
                        <div className="overflow-hidden rounded-xl border border-slate-200">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs">
                                    <tr>
                                        <th className="px-6 py-4">Title</th>
                                        <th className="px-6 py-4">Format</th>
                                        <th className="px-6 py-4">Concept Description</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {strategy.content_ideas?.map((idea: any, i: number) => (
                                        <tr key={i} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 font-bold text-slate-900">{idea.title}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-bold uppercase tracking-wide">
                                                    {idea.format}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">{idea.description}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 4. Recommendations */}
                {activeTab === "recommendations" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Strategic Roadmap</h3>
                        <div className="space-y-4">
                            {strategy.strategic_recommendations?.map((rec: string, i: number) => (
                                <div key={i} className="flex gap-4 p-4 border border-slate-100 rounded-xl bg-slate-50/50">
                                    <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold">
                                        {i + 1}
                                    </div>
                                    <p className="text-slate-700 font-medium pt-1">{rec}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
