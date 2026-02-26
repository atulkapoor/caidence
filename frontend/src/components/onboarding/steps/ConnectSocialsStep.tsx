"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { listConnections, type SocialConnection } from "@/lib/api/social";
import { SocialConnectCard } from "@/components/onboarding/SocialConnectCard";
import type { StepProps } from "../OnboardingWizard";

const PLATFORMS = ["instagram", "youtube", "facebook", "linkedin", "whatsapp", "snapchat"];

export function ConnectSocialsStep({ onNext, loading }: StepProps) {
    const [connections, setConnections] = useState<SocialConnection[]>([]);
    const [fetching, setFetching] = useState(true);

    const fetchConnections = async () => {
        try {
            const data = await listConnections();
            setConnections(data);
        } catch {
            // Non-critical — continue silently
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        fetchConnections();
    }, []);

    const getConnection = (platform: string): SocialConnection | null => {
        return connections.find((c) => c.platform === platform) ?? null;
    };

    const handleContinue = () => {
        const connectionData = PLATFORMS.reduce<Record<string, boolean>>((acc, platform) => {
            acc[platform] = getConnection(platform)?.is_active ?? false;
            return acc;
        }, {});
        onNext({ connected_platforms: connectionData });
    };

    if (fetching) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-7 h-7 text-slate-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <p className="text-slate-500 font-medium">
                Connect your social media accounts to unlock analytics, content scheduling, and campaign tracking.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PLATFORMS.map((platform) => (
                    <SocialConnectCard
                        key={platform}
                        platform={platform}
                        connection={getConnection(platform)}
                        onStatusChange={fetchConnections}
                        buttonSize="compact"
                        redirectTo="/onboarding?step=connect_socials"
                    />
                ))}
            </div>

            <button
                onClick={handleContinue}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Continue
            </button>
        </div>
    );
}
