import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
            {/* Left Column: Visuals */}
            <div className="hidden lg:flex flex-col bg-slate-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2874&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950/90"></div>

                <div className="relative z-10 flex-1 flex flex-col justify-between p-12">
                    <div>
                        <Link href="/" className="inline-block">
                            <h1 className="text-3xl font-black text-white tracking-tight">C(AI)DENCE</h1>
                        </Link>
                    </div>

                    <div className="space-y-6">
                        <blockquote className="text-2xl font-medium text-white leading-relaxed">
                            &quot;This platform has completely transformed how run our marketing. The AI agents feel like real team members.&quot;
                        </blockquote>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white">
                                JD
                            </div>
                            <div>
                                <div className="font-bold text-white">John Doe</div>
                                <div className="text-sm text-slate-400">CMO, TechGrowth Inc.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Form */}
            <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-24 bg-white relative">
                <Link
                    href="/"
                    className="absolute top-8 right-8 text-sm font-bold text-slate-500 hover:text-slate-900 flex items-center gap-2 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </Link>
                <div className="w-full max-w-md mx-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}
