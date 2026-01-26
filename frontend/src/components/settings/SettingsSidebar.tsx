import { User, Shield, Bell, CreditCard, Building, AppWindow, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsSidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export function SettingsSidebar({ activeTab, onTabChange }: SettingsSidebarProps) {
    const menuItems = [
        {
            category: "Personal",
            items: [
                { id: "profile", label: "My Profile", icon: User },
                { id: "security", label: "Security & Login", icon: Shield },
                { id: "notifications", label: "Notifications", icon: Bell },
            ]
        },
        {
            category: "Workspace",
            items: [
                { id: "general", label: "General & Branding", icon: Building },
                { id: "members", label: "Team Members", icon: Users },
                { id: "billing", label: "Billing & Plans", icon: CreditCard },
                { id: "integrations", label: "Connected Apps", icon: AppWindow },
            ]
        }
    ];

    return (
        <nav className="w-64 shrink-0 space-y-8">
            {menuItems.map((group, idx) => (
                <div key={idx}>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-4">
                        {group.category}
                    </h4>
                    <div className="space-y-1">
                        {group.items.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => onTabChange(item.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-xl transition-all",
                                    activeTab === item.id
                                        ? "bg-slate-900 text-white shadow-md"
                                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                )}
                            >
                                <item.icon className={cn("w-4 h-4", activeTab === item.id ? "text-slate-300" : "text-slate-400")} />
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </nav>
    );
}
