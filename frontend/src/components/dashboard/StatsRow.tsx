import { Target, Share2, PenTool, MessageSquare } from "lucide-react";
import { DashboardStats } from "@/lib/api";
import Link from "next/link";

interface StatsRowProps {
    stats: DashboardStats | null;
}

export function StatsRow({ stats }: StatsRowProps) {
    const displayStats = [
        {
            label: "ACTIVE CAMPAIGNS",
            value: stats?.active_campaigns || "0",
            trend: "+12% this month",
            trendUp: true,
            icon: Target,
            color: "text-blue-600",
            bg: "bg-blue-500",
            iconBg: "bg-blue-500",
            href: "/campaigns"
        },
        {
            label: "AI WORKFLOWS",
            value: stats?.ai_workflows || "0",
            trend: "Active this month",
            trendUp: true,
            icon: Share2,
            color: "text-purple-600",
            bg: "bg-purple-500",
            iconBg: "bg-purple-500",
            href: "/workflow"
        },
        {
            label: "CONTENT GENERATED",
            value: stats?.content_generated || "0",
            trend: "Updated this month",
            trendUp: true,
            icon: PenTool,
            color: "text-emerald-600",
            bg: "bg-emerald-500",
            iconBg: "bg-emerald-500",
            href: "/content-studio"
        },
        {
            label: "AI CONVERSATIONS",
            value: stats?.ai_conversations || "0",
            trend: "+89% this month",
            trendUp: true,
            icon: MessageSquare,
            color: "text-orange-600",
            bg: "bg-orange-500",
            iconBg: "bg-orange-500",
            href: "/ai-chat"
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {displayStats.map((stat) => (
                <Link
                    href={stat.href}
                    key={stat.label}
                    className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md block hover:-translate-y-1 duration-200"
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{stat.label}</p>
                            <h3 className="text-3xl font-bold text-slate-900">{stat.value}</h3>
                        </div>
                        <div className={`p-3 rounded-xl ${stat.iconBg} text-white shadow-lg shadow-black/5`}>
                            <stat.icon className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                        <span className={`text-sm font-bold ${stat.color}`}>
                            {stat.trendUp ? "↑" : "↓"}
                        </span>
                        <span className="text-sm font-medium text-slate-400">
                            {stat.trend}
                        </span>
                    </div>
                </Link>
            ))}
        </div>
    );
}
