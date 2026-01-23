import { ArrowUpRight, ArrowDownRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsWidgetProps {
    title: string;
    value: string | number;
    change?: string;
    trend?: "up" | "down" | "neutral";
    icon?: React.ReactNode;
}

export function StatsWidget({ title, value, change, trend = "neutral", icon }: StatsWidgetProps) {
    return (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <button className="text-muted-foreground hover:text-white">
                    <MoreHorizontal className="h-4 w-4" />
                </button>
            </div>

            <div className="flex items-end justify-between">
                <div>
                    <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
                    {change && (
                        <div className="flex items-center gap-1 mt-1">
                            <span className={cn(
                                "flex items-center text-xs font-medium",
                                trend === "up" ? "text-emerald-500" : trend === "down" ? "text-red-500" : "text-gray-400"
                            )}>
                                {trend === "up" ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                                {change}
                            </span>
                            <span className="text-xs text-muted-foreground">vs last month</span>
                        </div>
                    )}
                </div>
                {icon && (
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
}
