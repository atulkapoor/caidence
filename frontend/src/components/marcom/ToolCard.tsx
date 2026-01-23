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

export function ToolCard({ title, description, icon: Icon, category, color, onClick }: ToolCardProps) {
    return (
        <div
            onClick={onClick}
            className="group relative bg-white rounded-2xl p-6 border border-slate-200 hover:border-transparent hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

            <div className="relative flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-lg`}>
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
