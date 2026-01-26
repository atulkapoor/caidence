import { FileText, Image, Mail, Clock, MessageSquare } from "lucide-react";
import { type ActivityLog } from "@/lib/api";

interface RecentActivityProps {
    activities: ActivityLog[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
    const getIconForAction = (action: string) => {
        const lower = action.toLowerCase();
        if (lower.includes("email")) return { icon: Mail, color: "text-orange-600", bg: "bg-orange-100", type: "Email" };
        if (lower.includes("instagram") || lower.includes("image") || lower.includes("design")) return { icon: Image, color: "text-purple-600", bg: "bg-purple-100", type: "Design" };
        if (lower.includes("chat")) return { icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-100", type: "Chat" };
        if (lower.includes("workflow")) return { icon: Clock, color: "text-emerald-600", bg: "bg-emerald-100", type: "Workflow" };
        return { icon: FileText, color: "text-slate-600", bg: "bg-slate-100", type: "Content" };
    };

    if (activities.length === 0) {
        return (
            <div className="rounded-2xl bg-white p-8 shadow-sm border border-slate-100 h-full">
                <div className="flex items-center gap-2 mb-6">
                    <Clock className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
                </div>
                <div className="text-center text-slate-400 py-8 text-sm">
                    No recent activity found.
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl bg-white p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-6">
                <Clock className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
            </div>

            <div className="space-y-6">
                {activities.map((item, index) => {
                    const style = getIconForAction(item.action);
                    return (
                        <div key={item.id || index} className="flex items-start gap-4 group cursor-pointer">
                            <div className={`p-2.5 rounded-xl ${style.bg} ${style.color} group-hover:scale-110 transition-transform`}>
                                <style.icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-semibold text-slate-900 truncate pr-2">{item.action}</h4>
                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap">
                                        {style.type}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 font-medium">
                                    {new Date(item.timestamp).toLocaleString()}
                                </p>
                                <p className="text-xs text-slate-500 mt-1 line-clamp-1">{item.details}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
