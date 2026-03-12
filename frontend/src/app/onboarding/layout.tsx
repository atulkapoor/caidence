"use client";

import Link from "next/link";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
            {/* Minimal top bar — logo only, no sidebar */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center">
                    <Link href="/" className="flex items-center gap-2">
                        <img
                            src="/images/caidenz_logo.png"
                            alt="C(AI)DENCE"
                            className="h-24"
                        />
                    </Link>
                </div>
            </header>
            <main className="pt-16">
                {children}
            </main>
        </div>
    );
}
