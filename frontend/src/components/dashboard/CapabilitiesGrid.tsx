import { Building, Cpu, Zap, Activity, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePreferences } from "@/context/PreferencesContext";

const capabilities = [
    {
        name: "Real Estate & Construction",
        description: "Automated listing descriptions and property showcases.",
        icon: Building,
        color: "bg-blue-100 text-blue-600",
        href: "/content-studio?template=real-estate",
        borderColor: "hover:border-blue-200"
    },
    {
        name: "AI-Powered Intelligence",
        description: "Market trends and competitor analysis.",
        icon: Cpu,
        color: "bg-purple-100 text-purple-600",
        href: "/discovery",
        borderColor: "hover:border-purple-200"
    },
    {
        name: "Process Automation",
        description: "Streamline workflows and approval chains.",
        icon: Zap,
        color: "bg-amber-100 text-amber-600",
        href: "/workflow",
        borderColor: "hover:border-amber-200"
    },
    {
        name: "Performance Optimization",
        description: "Real-time campaign adjustments.",
        icon: Activity,
        color: "bg-emerald-100 text-emerald-600",
        href: "/analytics",
        borderColor: "hover:border-emerald-200"
    },
];

export function CapabilitiesGrid() {
    // Import inside component to avoid changing file top-level imports massively if not needed, 
    // but better to add import at top. Since I have to replace the whole function anyway...

    // NOTE: This tool call replaces the function, I need to add the import line separately or assume I can't.
    // I will use multi-replace or just replace the whole file content effectively if I could, but `replace_file_content` is chunk based.
    // I'll assume the import needs to be added.

    const { visibleCapabilities } = usePreferences();

    return (
        <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                Advanced AI Capabilities
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {capabilities.filter(item => visibleCapabilities[item.name as keyof typeof visibleCapabilities]).map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                            "group relative flex flex-col p-5 rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
                            item.borderColor
                        )}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110", item.color)}>
                                <item.icon className="h-6 w-6" />
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400">
                                <ArrowRight className="w-5 h-5" />
                            </div>
                        </div>

                        <h3 className="font-bold text-slate-900 text-lg mb-1 group-hover:text-indigo-700 transition-colors">
                            {item.name}
                        </h3>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                            {item.description}
                        </p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
