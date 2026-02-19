"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, LogOut, RefreshCw } from "lucide-react";
import { fetchCurrentUser } from "@/lib/api";

export default function PendingApprovalPage() {
    const router = useRouter();
    const [checking, setChecking] = useState(false);
    const [userName, setUserName] = useState("");

    useEffect(() => {
        const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) {
            router.replace("/login");
            return;
        }

        // Load cached user name
        try {
            const cached = localStorage.getItem("user");
            if (cached) {
                const user = JSON.parse(cached);
                setUserName(user.full_name || user.email || "");
            }
        } catch {
            // ignore
        }
    }, [router]);

    const handleCheckStatus = async () => {
        setChecking(true);
        try {
            const user = await fetchCurrentUser();
            localStorage.setItem("user", JSON.stringify(user));
            if (user.is_approved) {
                router.push("/dashboard");
            } else {
                setChecking(false);
            }
        } catch {
            setChecking(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center px-6">
            <div className="max-w-md w-full text-center">
                <div className="mx-auto mb-6 h-20 w-20 rounded-2xl bg-amber-50 flex items-center justify-center">
                    <Clock className="h-10 w-10 text-amber-500" />
                </div>

                <h1 className="text-3xl font-black text-slate-900 mb-3">
                    Pending Approval
                </h1>

                {userName && (
                    <p className="text-slate-600 font-semibold mb-2">
                        Hi {userName}!
                    </p>
                )}

                <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                    Your account has been created and your onboarding is complete.
                    An administrator needs to approve your account before you can
                    access the dashboard.
                </p>

                <div className="space-y-3">
                    <button
                        onClick={handleCheckStatus}
                        disabled={checking}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
                        {checking ? "Checking..." : "Check Approval Status"}
                    </button>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>

                <p className="mt-8 text-xs text-slate-400 font-medium">
                    You&apos;ll receive a notification once your account is approved.
                </p>
            </div>
        </div>
    );
}
