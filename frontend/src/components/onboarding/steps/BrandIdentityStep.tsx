"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StepProps } from "../OnboardingWizard";

const BRAND_VOICES = ["Formal", "Casual", "Playful", "Authoritative"];

const inputClass = cn(
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3",
    "text-slate-900 font-medium placeholder:text-slate-400",
    "focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent",
    "transition-all",
);

export function BrandIdentityStep({ onNext, loading, stepData }: StepProps) {
    const [brandName, setBrandName] = useState("");
    const [tagline, setTagline] = useState("");
    const [brandDescription, setBrandDescription] = useState("");
    const [brandVoice, setBrandVoice] = useState("");
    const [primaryColor, setPrimaryColor] = useState("#0f172a");
    const [logoUrl, setLogoUrl] = useState("");

    useEffect(() => {
        setBrandName(String(stepData.brand_name ?? ""));
        setTagline(String(stepData.tagline ?? ""));
        setBrandDescription(String(stepData.brand_description ?? ""));
        setBrandVoice(String(stepData.brand_voice ?? ""));
        setPrimaryColor(String(stepData.primary_color ?? "#0f172a"));
        setLogoUrl(String(stepData.logo_url ?? ""));
    }, [stepData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onNext({
            brand_name: brandName,
            tagline,
            brand_description: brandDescription,
            brand_voice: brandVoice,
            primary_color: primaryColor,
            logo_url: logoUrl,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Brand Name <span className="text-red-400">*</span>
                </label>
                <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="Your Brand Name"
                    required
                    className={inputClass}
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Tagline
                </label>
                <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="Just Do It"
                    className={inputClass}
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Brand Description
                </label>
                <textarea
                    value={brandDescription}
                    onChange={(e) => setBrandDescription(e.target.value)}
                    placeholder="Tell us what your brand is about..."
                    rows={4}
                    className={cn(inputClass, "resize-none")}
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Brand Voice
                </label>
                <div className="grid grid-cols-2 gap-3">
                    {BRAND_VOICES.map((voice) => (
                        <button
                            key={voice}
                            type="button"
                            onClick={() => setBrandVoice(voice)}
                            className={cn(
                                "rounded-xl border px-4 py-3 text-sm font-bold transition-all",
                                brandVoice === voice
                                    ? "border-slate-900 bg-slate-900 text-white"
                                    : "border-slate-200 text-slate-600 hover:border-slate-400",
                            )}
                        >
                            {voice}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Primary Color
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-2.5">
                    <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="h-8 w-8 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                    />
                    <span className="font-medium text-slate-700 text-sm uppercase tracking-wide">
                        {primaryColor}
                    </span>
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Logo URL
                </label>
                <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className={inputClass}
                />
            </div>

            <button
                type="submit"
                disabled={loading || !brandName}
                className="w-full mt-2 flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Continue
            </button>
        </form>
    );
}
