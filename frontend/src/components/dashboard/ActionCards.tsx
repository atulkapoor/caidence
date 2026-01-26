import { Bot, Megaphone, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";


export function ActionCards() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* AI Agent Card */}
            <Link
                href="/ai-agent"
                className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 p-10 shadow-xl transition-all hover:shadow-2xl hover:scale-[1.01]"
            >
                <div className="relative z-10 h-full flex flex-col justify-between">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-lg bg-white/10 backdrop-blur-md px-3 py-1 text-xs font-bold text-white uppercase tracking-wider">
                            Start Here
                        </div>
                        <div>
                            <h2 className="text-4xl font-black text-white mb-3">AI Agent</h2>
                            <p className="text-lg text-blue-100 font-medium max-w-sm">
                                Automated campaign creation with AI
                            </p>
                        </div>
                        <button className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-indigo-600 transition-colors hover:bg-blue-50">
                            <Bot className="w-5 h-5" />
                            Start with AI Agent
                            <ArrowRight className="w-4 h-4 ml-1" />
                        </button>
                    </div>
                </div>

                {/* Decorative Icon */}
                <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-20">
                    <Bot className="w-48 h-48 text-white" />
                </div>
            </Link>

            {/* Marcom Hub Card */}
            <Link
                href="/marcom"
                className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-10 shadow-xl transition-all hover:shadow-2xl hover:scale-[1.01]"
            >
                <div className="relative z-10 h-full flex flex-col justify-between">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-lg bg-white/10 backdrop-blur-md px-3 py-1 text-xs font-bold text-white uppercase tracking-wider">
                            <Megaphone className="w-3 h-3" />
                            Professional Writing
                        </div>
                        <div>
                            <h2 className="text-4xl font-black text-white mb-3">Marcom Hub</h2>
                            <p className="text-lg text-emerald-100 font-medium max-w-sm">
                                50+ AI writing tools for every marketing need
                            </p>
                        </div>
                        <button className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-teal-600 transition-colors hover:bg-emerald-50">
                            <Sparkles className="w-5 h-5" />
                            Start Writing
                            <ArrowRight className="w-4 h-4 ml-1" />
                        </button>
                    </div>
                </div>

                {/* Decorative Icon */}
                <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-20">
                    <Megaphone className="w-48 h-48 text-white" />
                </div>
            </Link>
        </div>
    );
}
