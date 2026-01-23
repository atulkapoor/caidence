"use client";

import { Bell, Search, UserCircle, Rocket, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function Topbar() {
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem("token");
        router.push("/login");
    };

    return (
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
            <div>
                <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
                <p className="text-xs text-muted-foreground">AI Marketing Intelligence Suite</p>
            </div>

            <div className="flex items-center gap-4">
                <Link href="/ai-agent" className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300">
                    <Rocket className="w-4 h-4 fill-white/20" />
                    <span>Launch AI Agent</span>
                </Link>
                <div className="w-px h-8 bg-slate-200 hidden md:block" />
                <Link href="/settings?tab=notifications" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </Link>
                <Link href="/profile" className="flex items-center gap-2 pl-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-900 to-slate-700 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-slate-900/20">
                        AR
                    </div>
                </Link>
                <button
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Log Out"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
}
