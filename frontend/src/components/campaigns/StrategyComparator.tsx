import { X, Check, ArrowRight } from "lucide-react";
import { CampaignDraft } from "@/lib/api";

interface StrategyComparatorProps {
    planA: CampaignDraft;
    planB: CampaignDraft;
    onSelect: (plan: CampaignDraft) => void;
    onClose: () => void;
}

export function StrategyComparator({ planA, planB, onSelect, onClose }: StrategyComparatorProps) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                            ⚔️ Strategy Tie-Breaker
                        </h2>
                        <p className="text-slate-500 text-sm">Compare AI-generated strategies and choose the best fit.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Comparison Grid */}
                <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-8 relative">

                    {/* VS Badge */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center font-black text-slate-300 border border-slate-100 z-10 hidden md:flex">
                        VS
                    </div>

                    {/* Plan A (Standard) */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 rounded-t-xl" />
                        <div className="mb-4">
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-wide">Option A: Balanced</span>
                            <h3 className="text-xl font-bold text-slate-900 mt-2">{planA.title}</h3>
                        </div>

                        <div className="space-y-4 text-sm">
                            <p className="text-slate-600 leading-relaxed min-h-[60px]">{planA.description}</p>

                            <div className="p-4 bg-slate-50 rounded-lg">
                                <div className="text-xs text-slate-500 font-bold uppercase mb-1">Budget</div>
                                <div className="text-lg font-black text-slate-900">${parseInt(planA.budget).toLocaleString()}</div>
                            </div>

                            <div>
                                <div className="text-xs text-slate-500 font-bold uppercase mb-2">Channels</div>
                                <div className="flex flex-wrap gap-2">
                                    {planA.channels.map(ch => (
                                        <span key={ch} className="px-2 py-1 bg-white border border-slate-200 rounded-md text-slate-700 text-xs font-medium shadow-sm">
                                            {ch}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => onSelect(planA)}
                            className="w-full mt-6 py-3 bg-white border-2 border-slate-100 hover:border-blue-500 hover:text-blue-600 text-slate-600 font-bold rounded-xl transition-all flex items-center justify-center gap-2 group-hover:border-blue-500 group-hover:text-blue-600"
                        >
                            Select Plan A <Check className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    </div>

                    {/* Plan B (Aggressive/Alternative) */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-purple-500 rounded-t-xl" />
                        <div className="mb-4">
                            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-md uppercase tracking-wide">Option B: Aggressive</span>
                            <h3 className="text-xl font-bold text-slate-900 mt-2">{planB.title}</h3>
                        </div>

                        <div className="space-y-4 text-sm">
                            <p className="text-slate-600 leading-relaxed min-h-[60px]">{planB.description}</p>

                            <div className="p-4 bg-purple-50/50 rounded-lg border border-purple-100">
                                <div className="text-xs text-purple-600 font-bold uppercase mb-1">Budget (+50%)</div>
                                <div className="text-lg font-black text-purple-900">${parseInt(planB.budget).toLocaleString()}</div>
                            </div>

                            <div>
                                <div className="text-xs text-slate-500 font-bold uppercase mb-2">Channels</div>
                                <div className="flex flex-wrap gap-2">
                                    {planB.channels.map(ch => (
                                        <span key={ch} className="px-2 py-1 bg-white border border-slate-200 rounded-md text-slate-700 text-xs font-medium shadow-sm">
                                            {ch}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => onSelect(planB)}
                            className="w-full mt-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-200 hover:shadow-xl hover:scale-[1.02]"
                        >
                            Select Plan B <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
