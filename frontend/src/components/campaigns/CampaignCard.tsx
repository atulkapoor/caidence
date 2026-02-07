import { MoreHorizontal, BarChart2, Edit, Copy, Archive, Trash2, Info, LinkIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface CampaignCardProps {
    title: string;
    description: string;
    status: "active" | "paused" | "draft" | "completed";
    progress: number;
    budget: string;
    spent: string;
    channels: string[];
    id?: string | number;
    onDelete?: () => void;
    onDuplicate?: () => void;
    onArchive?: () => void;
}

export function CampaignCard({ title, description, status, progress, budget, spent, channels, id = "CAM-101", onDelete, onDuplicate, onArchive }: CampaignCardProps) {
    const statusColors = {
        active: "bg-emerald-100 text-emerald-700",
        paused: "bg-amber-100 text-amber-700",
        draft: "bg-slate-100 text-slate-700",
        completed: "bg-blue-100 text-blue-700"
    };

    const handleDuplicate = () => {
        if (onDuplicate) onDuplicate();
        else toast.info("Duplication not implemented yet.");
    };

    const handleArchive = () => {
        if (onArchive) onArchive();
        else toast.info("Archiving not implemented yet.");
    };

    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
            if (onDelete) onDelete();
            else toast.success(`Campaign "${title}" deleted.`);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-xl hover:border-blue-200 transition-all group relative">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <Link href={`/campaigns?edit=${id}`} className="group-hover:text-blue-600 transition-colors">
                        <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
                    </Link>
                    <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${statusColors[status]}`}>
                            {status}
                        </span>
                        <span className="text-xs text-slate-400 font-medium tracking-wide">ID: #{id}</span>
                    </div>
                </div>
                <div className="flex gap-1">
                    <Link
                        href={`/campaigns?edit=${id}`}
                        className="text-slate-400 hover:text-blue-600 p-2 hover:bg-slate-50 rounded-lg transition-colors"
                        title="Edit Campaign"
                    >
                        <Edit className="w-4 h-4" />
                    </Link>
                    {/* Actions Dropdown */}
                    <div className="relative group/menu">
                        <button className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                        <div className="absolute top-full right-0 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-xl z-20 hidden group-hover/menu:block animate-in fade-in zoom-in-95 duration-200">
                            <button
                                onClick={handleDuplicate}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 first:rounded-t-xl transition-colors"
                            >
                                <Copy className="w-4 h-4" /> Duplicate
                            </button>
                            <button
                                onClick={handleArchive}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                            >
                                <Archive className="w-4 h-4" /> Archive
                            </button>
                            <div className="border-t border-slate-100" />
                            <button
                                onClick={handleDelete}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 last:rounded-b-xl transition-colors"
                            >
                                <Trash2 className="w-4 h-4" /> Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <p className={`text-sm mb-6 bg-slate-50 p-3 rounded-lg border border-slate-100 line-clamp-2 leading-relaxed h-[66px] ${description ? 'text-slate-500' : 'text-slate-400 italic flex items-center justify-center'}`}>
                {description || "No description provided for this campaign."}
            </p>

            <div className="space-y-5">
                {/* Progress */}
                <div>
                    <div className="flex justify-between text-xs mb-2">
                        <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Usage</span>
                        <span className="text-slate-900 font-bold">{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-100">
                        <div
                            className="h-full bg-[#5225a7] rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(progress, 0)}%` }}
                        />
                    </div>
                </div>

                {/* Grid Divider */}
                <div className="border-t border-slate-100" />

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold mb-1 tracking-wider">Budget</div>
                        <div className="text-base font-bold text-slate-900">{budget}</div>
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold mb-1 tracking-wider">Spent</div>
                        <div className="text-base font-bold text-slate-900">{spent}</div>
                    </div>
                </div>

                {/* Footer with Channels */}
                <div className="flex justify-between items-end pt-2">
                    <div className="flex -space-x-2">
                        {channels.map((channel, i) => (
                            <div key={i} className="w-7 h-7 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center text-xs font-bold text-slate-600 relative z-0 hover:z-10 hover:scale-110 transition-transform cursor-help" title={channel}>
                                {channel[0]}
                            </div>
                        ))}
                        {channels.length > 3 && (
                            <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 z-0">
                                +{channels.length - 3}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => toast.info(`Campaign "${title}" — Status: ${status}, Budget: ${budget}, Progress: ${progress}%`)}
                            className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                            title="Campaign Info"
                        >
                            <Info className="w-4 h-4" />
                        </button>
                        <Link
                            href={`/campaigns?edit=${id}`}
                            className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                            title="Open Campaign"
                        >
                            <LinkIcon className="w-4 h-4" />
                        </Link>
                        <Link
                            href={`/analytics?campaign=${id}`}
                            className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-[#5225a7] hover:border-[#5225a7] hover:bg-white transition-colors flex items-center gap-2 text-xs font-bold group/btn"
                        >
                            <BarChart2 className="w-4 h-4" />
                            <span className="hidden group-hover/btn:inline-block">Analytics</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
