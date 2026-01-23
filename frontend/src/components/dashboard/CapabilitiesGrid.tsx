import { Building, Cpu, Zap, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const capabilities = [
    {
        name: "Real Estate & Construction",
        icon: Building,
        color: "bg-blue-100 text-blue-600",
    },
    {
        name: "AI-Powered Intelligence",
        icon: Cpu,
        color: "bg-purple-100 text-purple-600",
    },
    {
        name: "Process Automation",
        icon: Zap,
        color: "bg-amber-100 text-amber-600",
    },
    {
        name: "Performance Optimization",
        icon: Activity,
        color: "bg-emerald-100 text-emerald-600",
    },
];

export function CapabilitiesGrid() {
    return (
        <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Advanced AI Capabilities</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {capabilities.map((item) => (
                    <div
                        key={item.name}
                        className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
                    >
                        <div className={cn("flex h-12 w-12 items-center justify-center rounded-full", item.color)}>
                            <item.icon className="h-6 w-6" />
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm">{item.name}</h3>
                    </div>
                ))}
            </div>
        </div>
    );
}
