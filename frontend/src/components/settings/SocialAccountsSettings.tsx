"use client";

import { useEffect, useState } from "react";
import { listConnections, type SocialConnection } from "@/lib/api/social";
import { SocialConnectCard } from "@/components/onboarding/SocialConnectCard";
import { Loader2 } from "lucide-react";

const PLATFORMS = ["instagram", "youtube", "facebook", "linkedin", "whatsapp", "snapchat"] as const;

export default function SocialAccountsSettings() {
    const [connections, setConnections] = useState<SocialConnection[]>([]);
    const [loading, setLoading] = useState(true);

    const refresh = () => {
        setLoading(true);
        listConnections()
            .then(setConnections)
            .catch(() => setConnections([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        refresh();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="mb-4">
                <h3 className="font-bold text-slate-900">Connected Accounts</h3>
                <p className="text-sm text-slate-500 font-medium">Manage your social media connections for publishing and analytics.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PLATFORMS.map((platform) => (
                    <SocialConnectCard
                        key={platform}
                        platform={platform}
                        connection={connections.find((c) => c.platform === platform && c.is_active) ?? null}
                        onStatusChange={refresh}
                    />
                ))}
            </div>
        </div>
    );
}
