"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getOnboardingProgress, type OnboardingProgress } from "@/lib/api/onboarding";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { toast } from "sonner";

export default function OnboardingSettings() {
    const [progress, setProgress] = useState<OnboardingProgress | null>(null);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const data = await getOnboardingProgress();
            setProgress(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load onboarding data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
        );
    }

    if (!progress) {
        return <div className="text-sm text-slate-500">Onboarding data unavailable.</div>;
    }

    return (
        <div className="bg-slate-50 rounded-2xl border border-slate-200">
            <OnboardingWizard
                initialProgress={progress}
                mode="settings"
                onCompleted={load}
            />
        </div>
    );
}
