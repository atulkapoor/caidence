import { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

interface ToolCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    category: string;
    color: string;
    onClick?: () => void;
}

// Map Tailwind color strings to actual CSS gradients
const gradientMap: Record<string, string> = {
    "from-blue-500 to-blue-600": "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    "from-emerald-500 to-teal-500": "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
    "from-violet-500 to-purple-500": "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
    "from-orange-500 to-amber-500": "linear-gradient(135deg, #f97316 0%, #f59e0b 100%)",
    "from-pink-500 to-rose-500": "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
    "from-cyan-500 to-blue-500": "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
    "from-indigo-500 to-blue-500": "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
};

export function ToolCard({ title, description, icon: Icon, category, color, onClick }: ToolCardProps) {
    const gradient = gradientMap[color] || "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)";
    
    return (
        <div
            onClick={onClick}
            className="group relative bg-white rounded-2xl p-6 border border-slate-200 hover:border-transparent hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
        >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300" style={{ background: gradient }} />

            <div className="relative flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ background: gradient }}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {category}
                    </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-primary transition-colors">
                    {title}
                </h3>

                <p className="text-sm text-slate-500 mb-6 flex-grow leading-relaxed">
                    {description}
                </p>

                <div className="flex items-center text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    Use Tool <ArrowRight className="w-4 h-4 ml-2" />
                </div>
            </div>
        </div>
    );
}
