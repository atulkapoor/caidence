import { Bot, Megaphone, PenTool, Youtube, Share2, FileBarChart, Calendar, BarChart3, Layout } from "lucide-react";
import Link from "next/link";

const tools = [
    { name: "AI Chat", icon: Bot, href: "/ai-chat", color: "bg-emerald-500" },
    { name: "Power BI to Presentation", icon: FileBarChart, href: "/presentation-studio", color: "bg-amber-500" },
    { name: "Workflow Builder", icon: Share2, href: "/workflow", color: "bg-purple-500" },
    { name: "Content Studio", icon: PenTool, href: "/content-studio", color: "bg-blue-500" },
    { name: "Design Studio", icon: Layout, href: "/design-studio", color: "bg-pink-500" },
    { name: "Campaign Planner", icon: Calendar, href: "/campaigns", color: "bg-orange-500" },
    { name: "Analytics", icon: BarChart3, href: "/analytics", color: "bg-rose-500" },
];

export function ToolsGrid() {
    return (
        <div className="py-2">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <span className="w-1.5 h-8 bg-emerald-500 rounded-full"></span>
                <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <span className="text-xs font-bold">⚡️</span>
                </span>
                AI-Powered Tools
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {tools.map((tool) => (
                    <Link
                        key={tool.name}
                        href={tool.href}
                        className="group flex flex-col items-center text-center p-8 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 hover:border-emerald-100"
                    >
                        <div className={`w-16 h-16 rounded-2xl ${tool.color} text-white flex items-center justify-center mb-6 shadow-lg shadow-black/5 group-hover:scale-110 transition-transform`}>
                            <tool.icon className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">{tool.name}</h3>
                        <p className="text-sm text-slate-500 font-medium group-hover:text-emerald-600 transition-colors">
                            Explore tool →
                        </p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
