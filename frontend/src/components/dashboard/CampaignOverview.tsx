import { Target } from "lucide-react";
import Link from "next/link";

export function CampaignOverview() {
    return (
        <div className="rounded-2xl bg-white p-8 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-slate-900">Campaign Overview</h3>
                </div>
                <Link href="/campaigns" className="text-sm font-medium text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 bg-white shadow-sm transition-colors">
                    View All
                </Link>
            </div>

            {/* Featured Campaign */}
            <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                    <h4 className="text-xl font-bold text-slate-900">Snack Smart Revolution</h4>
                    <span className="px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        paused
                    </span>
                </div>

                <p className="text-slate-600 text-sm leading-relaxed mb-8 max-w-2xl">
                    AI-generated campaign based on the objective: &quot;Launch a new food brand in healthy snacking option&quot;. Targeting: Health-conscious consumers aged 25-40 who are looking for convenient, nutritious snacking options. This audience is likely to be busy professionals, young parents, and fitness enthusiasts who prioritize health and wellness in their lifestyle choices.
                </p>

                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-slate-900 font-bold">Progress</span>
                        <span className="text-slate-900 font-bold">35%</span>
                    </div>

                    <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-900 w-[35%] rounded-full" />
                    </div>

                    <div className="flex items-center gap-6 mt-6 pt-6 border-t border-slate-200/50">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="font-bold text-slate-900">$</span>
                            <span className="text-slate-500 font-medium">$Not set</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="font-bold text-slate-900">↗</span>
                            <span className="text-slate-500 font-medium">6 channels</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
