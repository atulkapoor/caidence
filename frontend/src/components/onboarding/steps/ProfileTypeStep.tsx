"use client";

import { Building2, Palette, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StepProps } from "../OnboardingWizard";

const PROFILE_TYPES = [
    {
        type: "agency",
        icon: Building2,
        title: "Agency",
        description: "Manage multiple brands and creator rosters",
    },
    {
        type: "brand",
        icon: Palette,
        title: "Brand",
        description: "Build your brand presence and reach your audience",
    },
    {
        type: "creator",
        icon: Sparkles,
        title: "Creator",
        description: "Showcase your talent and connect with brands",
    },
];

export function ProfileTypeStep({ onProfileTypeSelect, loading }: StepProps) {
    return (
        <div className="space-y-4">
            <p className="text-slate-500 font-medium mb-6">
                Choose the profile type that best describes you. This will personalize your onboarding experience.
            </p>
            <div className="grid gap-4">
                {PROFILE_TYPES.map(({ type, icon: Icon, title, description }) => (
                    <button
                        key={type}
                        onClick={() => onProfileTypeSelect?.(type)}
                        disabled={loading}
                        className={cn(
                            "w-full text-left rounded-2xl border-2 border-slate-200 p-6 flex items-center gap-5",
                            "hover:border-slate-900 hover:shadow-md transition-all duration-200",
                            "focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                        )}
                    >
                        <div className="flex-shrink-0 h-14 w-14 rounded-xl bg-slate-100 flex items-center justify-center">
                            <Icon className="w-7 h-7 text-slate-700" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-lg">{title}</h3>
                            <p className="text-slate-500 font-medium text-sm mt-0.5">{description}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
