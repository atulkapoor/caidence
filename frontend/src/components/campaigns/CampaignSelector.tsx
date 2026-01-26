import { useState, useEffect } from "react";
import { Campaign, fetchCampaigns } from "@/lib/api/campaigns";
import { Search, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CampaignSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (campaignId: number) => void;
    title?: string;
}

export function CampaignSelector({ isOpen, onClose, onSelect, title = "Select Campaign" }: CampaignSelectorProps) {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (isOpen) {
            loadCampaigns();
        }
    }, [isOpen]);

    const loadCampaigns = async () => {
        setLoading(true);
        try {
            const data = await fetchCampaigns();
            setCampaigns(data);
        } catch (e) {
            console.error("Failed to load campaigns", e);
        } finally {
            setLoading(false);
        }
    };

    const filtered = campaigns.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase()) &&
        c.status !== 'archived'
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-900">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 border-b border-slate-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Search campaigns..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="overflow-y-auto p-2 space-y-1 flex-1">
                    {loading ? (
                        <div className="py-8 text-center text-slate-400 text-sm">Loading campaigns...</div>
                    ) : filtered.length === 0 ? (
                        <div className="py-8 text-center text-slate-500 text-sm">No campaigns found.</div>
                    ) : (
                        filtered.map(campaign => (
                            <button
                                key={campaign.id}
                                onClick={() => onSelect(campaign.id)}
                                className="w-full text-left p-3 rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-between group"
                            >
                                <div>
                                    <div className="font-bold text-slate-900 group-hover:text-indigo-700">{campaign.title}</div>
                                    <div className="text-xs text-slate-500 font-medium capitalize flex items-center gap-2">
                                        <span className={cn(
                                            "w-2 h-2 rounded-full",
                                            campaign.status === 'active' ? "bg-green-500" : "bg-slate-300"
                                        )} />
                                        {campaign.status}
                                    </div>
                                </div>
                                <div className="p-2 rounded-full bg-white border border-slate-200 text-slate-300 group-hover:border-indigo-200 group-hover:text-indigo-600">
                                    <Check className="w-4 h-4" />
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
