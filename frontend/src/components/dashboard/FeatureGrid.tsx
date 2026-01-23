import { Bot, Megaphone, PenTool, Youtube } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const features = [
    {
        name: "AI Agent",
        description: "Launch autonomous marketing campaigns",
        icon: Bot,
        href: "/ai-agent",
        gradient: "from-blue-600 to-indigo-600",
    },
    {
        name: "Marcom Hub",
        description: "Centralized marketing communications",
        icon: Megaphone,
        href: "/marcom",
        gradient: "from-purple-600 to-pink-600",
    },
    {
        name: "Content Studio",
        description: "Generate and edit marketing content",
        icon: PenTool,
        href: "/content-studio",
        gradient: "from-emerald-500 to-teal-600",
    },
    {
        name: "Video Studio",
        description: "Create AI-powered video content",
        icon: Youtube,
        href: "/video-studio",
        gradient: "from-orange-500 to-red-600",
    },
];

export function FeatureGrid() {
    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
            {features.map((feature) => (
                <Link
                    key={feature.name}
                    href={feature.href}
                    style={{
                        background: feature.name === "AI Agent"
                            ? "linear-gradient(to right, rgb(147, 51, 234), rgb(124, 58, 237), rgb(79, 70, 229))"
                            : feature.name === "Marcom Hub"
                                ? "linear-gradient(to right, rgb(22, 163, 74), rgb(5, 150, 105), rgb(13, 148, 136))"
                                : undefined
                    }}
                    className={cn(
                        "group relative flex flex-col justify-between overflow-hidden rounded-2xl p-6 shadow-2xl transition-all hover:scale-[1.02] hover:shadow-xl",
                        feature.name !== "AI Agent" && feature.name !== "Marcom Hub" ? "bg-card border border-border" : "border-0"
                    )}
                >
                    {/* Background decorations for non-gradient cards */}
                    {(feature.name !== "AI Agent" && feature.name !== "Marcom Hub") && (
                        <div className={cn("absolute right-0 top-0 h-24 w-24 translate-x-8 translate-y-[-8px] rounded-full bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity", feature.gradient)} />
                    )}

                    <div className="relative z-10">
                        <div className={cn(
                            "mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl shadow-lg",
                            feature.name === "AI Agent" || feature.name === "Marcom Hub"
                                ? "bg-white/20 text-white backdrop-blur-sm"
                                : cn("bg-gradient-to-br text-white", feature.gradient)
                        )}>
                            <feature.icon className="h-6 w-6" />
                        </div>

                        <h3 className={cn(
                            "mb-2 text-2xl font-black",
                            feature.name === "AI Agent" || feature.name === "Marcom Hub" ? "text-white" : "text-slate-900 group-hover:text-primary"
                        )}>
                            {feature.name}
                        </h3>
                        <p className={cn(
                            "text-sm font-medium mb-6",
                            feature.name === "AI Agent" || feature.name === "Marcom Hub" ? "text-white/90" : "text-muted-foreground"
                        )}>
                            {feature.description}
                        </p>
                    </div>

                    <div className="relative z-10">
                        <button className={cn(
                            "w-full rounded-lg py-2 text-sm font-bold transition-colors text-center",
                            feature.name === "AI Agent" || feature.name === "Marcom Hub"
                                ? "bg-white text-slate-900 hover:bg-white/90"
                                : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                        )}>
                            Start with {feature.name}
                        </button>
                    </div>
                </Link>
            ))}
        </div>
    );
}
