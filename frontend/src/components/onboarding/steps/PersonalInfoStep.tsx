"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StepProps } from "../OnboardingWizard";

const NICHES = [
    "Fashion",
    "Tech",
    "Fitness",
    "Beauty",
    "Gaming",
    "Food",
    "Travel",
    "Lifestyle",
    "Education",
    "Other",
];

const inputClass = cn(
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3",
    "text-slate-900 font-medium placeholder:text-slate-400",
    "focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent",
    "transition-all",
);

export function PersonalInfoStep({ onNext, loading, stepData }: StepProps) {
    const [displayName, setDisplayName] = useState("");
    const [bio, setBio] = useState("");
    const [location, setLocation] = useState("");
    const [niche, setNiche] = useState("");

    useEffect(() => {
        setDisplayName(String(stepData.display_name ?? ""));
        setBio(String(stepData.bio ?? ""));
        setLocation(String(stepData.location ?? ""));
        setNiche(String(stepData.niche ?? ""));
    }, [stepData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onNext({
            display_name: displayName,
            bio,
            location,
            niche,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Display Name <span className="text-red-400">*</span>
                </label>
                <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="@yourhandle or Your Name"
                    required
                    className={inputClass}
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Bio
                </label>
                <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell brands and your audience about yourself..."
                    rows={4}
                    className={cn(inputClass, "resize-none")}
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Location
                </label>
                <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="New York, NY"
                    className={inputClass}
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Niche / Category
                </label>
                <select
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    className={inputClass}
                >
                    <option value="">Select your niche</option>
                    {NICHES.map((n) => (
                        <option key={n} value={n}>{n}</option>
                    ))}
                </select>
            </div>

            <button
                type="submit"
                disabled={loading || !displayName}
                className="w-full mt-2 flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Continue
            </button>
        </form>
    );
}
