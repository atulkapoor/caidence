"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Bot,
    MessageSquare,
    Workflow,
    PenTool,
    Image as ImageIcon,
    Presentation,
    BarChart3,
    Settings,
    Zap,
    Megaphone,
    Map,
    Brain,
    User,
    Search,
    Building2,
    Users,
    Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, color: "text-blue-600", bg: "bg-blue-50", subtitle: "Command Center" },
    { name: "Agency", href: "/agency", icon: Building2, color: "text-indigo-600", bg: "bg-indigo-50", subtitle: "Brand Management" },
    { name: "Creators", href: "/creators", icon: Users, color: "text-pink-600", bg: "bg-pink-50", subtitle: "Talent Roster" },
    { name: "AI Agent", href: "/ai-agent", icon: Bot, color: "text-indigo-600", bg: "bg-indigo-50", subtitle: "Autonomous Marketing" },
    { name: "AI Chat", href: "/ai-chat", icon: MessageSquare, color: "text-teal-600", bg: "bg-teal-50", subtitle: "Assistant" },
    { name: "Workflow Builder", href: "/workflow", icon: Workflow, color: "text-pink-600", bg: "bg-pink-50", subtitle: "Automation" },
    { name: "Content Studio", href: "/content-studio", icon: PenTool, color: "text-emerald-600", bg: "bg-emerald-50", subtitle: "Creation" },
    { name: "Design Studio", href: "/design-studio", icon: ImageIcon, color: "text-rose-600", bg: "bg-rose-50", subtitle: "Graphics" },
    { name: "Presentation Studio", href: "/presentation-studio", icon: Presentation, color: "text-cyan-600", bg: "bg-cyan-50", subtitle: "Decks" },
    { name: "Marcom Hub", href: "/marcom", icon: Megaphone, color: "text-green-600", bg: "bg-green-50", subtitle: "Communications" },
    { name: "CRM", href: "/crm", icon: User, color: "text-amber-600", bg: "bg-amber-50", subtitle: "Relationships" },
    { name: "Campaign Planner", href: "/campaigns", icon: Map, color: "text-orange-600", bg: "bg-orange-50", subtitle: "Strategy" },
    { name: "Discovery Engine", href: "/discovery", icon: Search, color: "text-pink-600", bg: "bg-pink-50", subtitle: "Find Creators" },
    { name: "Analytics", href: "/analytics", icon: BarChart3, color: "text-violet-600", bg: "bg-violet-50", subtitle: "Insights" },
    { name: "Admin Panel", href: "/admin", icon: Shield, color: "text-slate-600", bg: "bg-slate-100", subtitle: "Platform Admin" },
    { name: "Settings", href: "/settings", icon: Settings, color: "text-slate-600", bg: "bg-slate-50", subtitle: "Configuration" },
    { name: "Profile", href: "/profile", icon: User, color: "text-blue-600", bg: "bg-blue-50", subtitle: "Account" },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-full w-[287px] flex-col bg-slate-50 border-r border-slate-200">
            <div className="flex h-16 items-center px-6 border-b border-slate-200">
                <div className="flex items-center gap-2 font-bold text-xl text-slate-900">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white">
                        C
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-xl text-slate-900 leading-none">C(AI)DENCE</span>
                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Intelligence Suite</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1 px-3">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "group flex items-start gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200 border-l-4",
                                    isActive
                                        ? "border-primary bg-slate-50/50"
                                        : "border-transparent hover:bg-slate-50"
                                )}>
                                <div className={cn("p-2 rounded-md shrink-0 transition-colors", isActive ? "bg-white shadow-sm" : item.bg)}>
                                    <item.icon className={cn("h-5 w-5", item.color)} />
                                </div>
                                <div className="flex flex-col">
                                    <span className={cn("leading-none mb-1", isActive ? "text-slate-900 font-bold" : "text-slate-700")}>
                                        {item.name}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-normal leading-none">
                                        {item.subtitle}
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Live Metrics */}
            <div className="px-6 py-4 border-t border-slate-200">
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4">Live Metrics</h4>
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-600 font-medium">Active Campaigns</span>
                            <span className="text-slate-900 font-bold">12/15</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 w-[80%] rounded-full shadow-[0_0_8px_rgba(37,99,235,0.4)]"></div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-600 font-medium">Content Created</span>
                            <span className="text-slate-900 font-bold">145</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-600 w-[65%] rounded-full shadow-[0_0_8px_rgba(147,51,234,0.4)]"></div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-600 font-medium">AI Workflows</span>
                            <span className="text-slate-900 font-bold">8</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 w-[40%] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pro Banner */}
            <div className="p-4 mt-auto">
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl p-4 relative overflow-hidden group cursor-pointer hover:shadow-lg hover:shadow-violet-500/20 transition-all duration-300">
                    <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all"></div>

                    <div className="relative z-10 flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Brain className="w-4 h-4 text-white" />
                                <h3 className="font-bold text-white text-sm">C(AI)DENCE Pro</h3>
                            </div>
                            <p className="text-white/80 text-[10px] font-medium mb-3">Advanced Intelligence</p>
                        </div>
                        <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                            <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
                        </div>
                    </div>

                    <div className="relative z-10">
                        <div className="h-1 w-full bg-black/20 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-300 w-[75%] rounded-full shadow-[0_0_10px_rgba(252,211,77,0.5)]"></div>
                        </div>
                        <p className="text-[10px] text-white/90 mt-2 font-medium">75% Usage This Month</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
