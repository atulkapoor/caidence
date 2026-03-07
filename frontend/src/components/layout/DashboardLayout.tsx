"use client";

import { ReactNode, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useRouter } from "next/navigation";
import { fetchCurrentUser } from "@/lib/api/auth";
import { clearAuthSession, maybeRefreshAuthSession } from "@/lib/api/core";

interface DashboardLayoutProps {
    children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        const validateSession = async () => {
            try {
                await fetchCurrentUser();
            } catch (error: any) {
                const msg = String(error?.message || "").toLowerCase();
                const inactive = msg.includes("inactive");
                clearAuthSession(inactive ? "inactive" : "expired");
                router.push(inactive ? "/login?reason=inactive" : "/login");
            }
        };

        validateSession();
        const interval = setInterval(validateSession, 60_000);

        const onActivity = () => {
            void maybeRefreshAuthSession();
        };
        window.addEventListener("click", onActivity);
        window.addEventListener("keydown", onActivity);

        return () => {
            clearInterval(interval);
            window.removeEventListener("click", onActivity);
            window.removeEventListener("keydown", onActivity);
        };
    }, [router]);

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <Topbar />
                <main className="flex-1 overflow-y-auto bg-slate-100 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
