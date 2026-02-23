"use client";

import { useEffect, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StepProps } from "../OnboardingWizard";

const inputClass = cn(
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3",
    "text-slate-900 font-medium placeholder:text-slate-400",
    "focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent",
    "transition-all",
);

export function BrandingStep({ onNext, loading, stepData }: StepProps) {
    const [primaryColor, setPrimaryColor] = useState("#0f172a");
    const [secondaryColor, setSecondaryColor] = useState("#64748b");
    const [headingFont, setHeadingFont] = useState("");
    const [bodyFont, setBodyFont] = useState("");

    useEffect(() => {
        setPrimaryColor(String(stepData.primary_color ?? "#0f172a"));
        setSecondaryColor(String(stepData.secondary_color ?? "#64748b"));
        setHeadingFont(String(stepData.heading_font ?? ""));
        setBodyFont(String(stepData.body_font ?? ""));
    }, [stepData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onNext({
            primary_color: primaryColor,
            secondary_color: secondaryColor,
            heading_font: headingFont,
            body_font: bodyFont,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
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
                        Secondary Color
                    </label>
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-2.5">
                        <input
                            type="color"
                            value={secondaryColor}
                            onChange={(e) => setSecondaryColor(e.target.value)}
                            className="h-8 w-8 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                        />
                        <span className="font-medium text-slate-700 text-sm uppercase tracking-wide">
                            {secondaryColor}
                        </span>
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Heading Font
                </label>
                <input
                    type="text"
                    value={headingFont}
                    onChange={(e) => setHeadingFont(e.target.value)}
                    placeholder="e.g. Inter, Playfair Display"
                    className={inputClass}
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Body Font
                </label>
                <input
                    type="text"
                    value={bodyFont}
                    onChange={(e) => setBodyFont(e.target.value)}
                    placeholder="e.g. Inter, DM Sans"
                    className={inputClass}
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Upload Logo
                </label>
                <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center hover:border-slate-400 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-600">Click to upload or drag and drop</p>
                    <p className="text-xs text-slate-400 mt-1 font-medium">PNG, JPG, SVG up to 5MB</p>
                    <input type="file" accept="image/*" className="sr-only" />
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Continue
            </button>
        </form>
    );
}
