"use client";

import { ShieldX } from "lucide-react";
import Link from "next/link";

export function AccessDenied() {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
                <div className="h-16 w-16 bg-red-50 text-red-400 rounded-2xl mx-auto flex items-center justify-center mb-6">
                    <ShieldX size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
                <p className="text-slate-500 font-medium mb-6">
                    You don&apos;t have permission to view this page. Contact your administrator to request access.
                </p>
                <Link
                    href="/dashboard"
                    className="inline-flex px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
                >
                    Back to Dashboard
                </Link>
            </div>
        </div>
    );
}
