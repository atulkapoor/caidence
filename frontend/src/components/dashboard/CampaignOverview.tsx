import { Target } from "lucide-react";
import Link from "next/link";
import { CampaignSummary } from "@/lib/api";

interface CampaignOverviewProps {
    campaign: CampaignSummary | null | undefined;
}

export function CampaignOverview({ campaign }: CampaignOverviewProps) {
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
            {campaign ? (
                <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
                    <div className="flex items-center gap-3 mb-4">
                        <h4 className="text-xl font-bold text-slate-900">{campaign.title}</h4>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${campaign.status === 'active' ? 'bg-green-100 text-green-700' :
                                campaign.status === 'paused' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${campaign.status === 'active' ? 'bg-green-500' :
                                    campaign.status === 'paused' ? 'bg-orange-500' : 'bg-slate-500'
                                }`} />
                            {campaign.status}
                        </span>
                    </div>

                    <p className="text-slate-600 text-sm leading-relaxed mb-8 max-w-2xl line-clamp-3">
                        {campaign.description}
                    </p>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm font-medium">
                            <span className="text-slate-900 font-bold">Progress</span>
                            <span className="text-slate-900 font-bold">{campaign.progress}%</span>
                        </div>

                        <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-indigo-900 rounded-full transition-all duration-500"
                                style={{ width: `${campaign.progress}%` }}
                            />
                        </div>

                        <div className="flex items-center gap-6 mt-6 pt-6 border-t border-slate-200/50">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="font-bold text-slate-900">$</span>
                                <span className="text-slate-500 font-medium">{campaign.budget}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="font-bold text-slate-900">↗</span>
                                <span className="text-slate-500 font-medium">{campaign.channels} channels</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 text-slate-400 text-sm">
                    No active campaigns.
                    <Link href="/campaigns" className="ml-1 text-indigo-600 hover:underline">
                        Create one?
                    </Link>
                </div>
            )}
        </div>
    );
}
