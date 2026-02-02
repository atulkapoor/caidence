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

const navigationGroups = [
    {
        title: "Platform",
        items: [
            { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "text-blue-600", bg: "bg-blue-50" },
            { name: "Campaigns", href: "/campaigns", icon: Map, color: "text-orange-600", bg: "bg-orange-50" },
            { name: "Workflows", href: "/workflow", icon: Workflow, color: "text-pink-600", bg: "bg-pink-50" },
        ]
    },
    {
        title: "Creative Studios",
        items: [
            { name: "Content", href: "/content-studio", icon: PenTool, color: "text-emerald-600", bg: "bg-emerald-50" },
            { name: "Design", href: "/design-studio", icon: ImageIcon, color: "text-rose-600", bg: "bg-rose-50" },
            { name: "Presentations", href: "/presentation-studio", icon: Presentation, color: "text-cyan-600", bg: "bg-cyan-50" },
        ]
    },
    {
        title: "Intelligence",
        items: [
            { name: "AI Agent", href: "/ai-agent", icon: Bot, color: "text-indigo-600", bg: "bg-indigo-50" },
            { name: "AI Chat", href: "/ai-chat", icon: MessageSquare, color: "text-teal-600", bg: "bg-teal-50" },
            { name: "Discovery", href: "/discovery", icon: Search, color: "text-pink-600", bg: "bg-pink-50" },
        ]
    },
    {
        title: "Growth & CRM",
        items: [
            { name: "CRM", href: "/crm", icon: User, color: "text-amber-600", bg: "bg-amber-50" },
            { name: "Marcom", href: "/marcom", icon: Megaphone, color: "text-green-600", bg: "bg-green-50" },
            { name: "Creators", href: "/creators", icon: Users, color: "text-pink-600", bg: "bg-pink-50" },
            { name: "Agency", href: "/agency", icon: Building2, color: "text-indigo-600", bg: "bg-indigo-50" },
        ]
    },
    {
        title: "System",
        items: [
            { name: "Analytics", href: "/analytics", icon: BarChart3, color: "text-violet-600", bg: "bg-violet-50" },
            { name: "Admin", href: "/admin", icon: Shield, color: "text-slate-600", bg: "bg-slate-100" },
            { name: "Settings", href: "/settings", icon: Settings, color: "text-slate-600", bg: "bg-slate-50" },
        ]
    }
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-full w-[260px] flex-col bg-white border-r border-slate-300">
            <Link href="/dashboard" className="flex h-16 items-center px-5 border-b border-slate-300 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2 font-bold text-xl text-slate-900">
                    <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                        C
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-lg text-slate-900 leading-none tracking-tight">C(AI)DENCE</span>
                        <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest mt-0.5">Intelligence</span>
                    </div>
                </div>
            </Link>

            <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
                <nav className="space-y-6 px-3">
                    {navigationGroups.map((group) => (
                        <div key={group.title}>
                            <h3 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                {group.title}
                            </h3>
                            <div className="space-y-0.5">
                                {group.items.map((item) => {
                                    // Normalize paths by removing trailing slashes for comparison
                                    const currentPath = pathname?.replace(/\/$/, "") || "";
                                    const itemPath = item.href.replace(/\/$/, "");
                                    const isActive = currentPath === itemPath || currentPath.startsWith(itemPath + "/");

                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={cn(
                                                "group flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                                                isActive
                                                    ? "bg-slate-100/80 text-slate-900 shadow-sm ring-1 ring-slate-200"
                                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                            )}>
                                            <item.icon className={cn("h-4.5 w-4.5 transition-colors", item.color)} />
                                            <span className="leading-none">{item.name}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>
            </div>

            {/* Pro Banner */}
            <div className="p-3 mt-auto border-t border-slate-100">
                <Link href="/settings?tab=profile">
                    <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
                        <div className="h-9 w-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                            AK
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">Atul Kapoor</p>
                            <p className="text-xs text-slate-500 truncate">atul@example.com</p>
                        </div>
                        <Settings className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                    </div>
                </Link>
            </div>
        </div>
    );
}
