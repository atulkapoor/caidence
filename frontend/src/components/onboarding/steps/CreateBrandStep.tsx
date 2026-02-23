"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StepProps } from "../OnboardingWizard";

const BRAND_CATEGORIES = [
    "Apparel & Fashion",
    "Beauty & Personal Care",
    "Consumer Electronics",
    "E-Commerce",
    "Food & Beverage",
    "Gaming",
    "Health & Fitness",
    "Home & Lifestyle",
    "Software & Technology",
    "Sports",
    "Travel & Tourism",
    "Other",
];

const inputClass = cn(
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3",
    "text-slate-900 font-medium placeholder:text-slate-400",
    "focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent",
    "transition-all",
);

export function CreateBrandStep({ onNext, loading, stepData }: StepProps) {
    const [brandName, setBrandName] = useState("");
    const [brandUrl, setBrandUrl] = useState("");
    const [targetAudience, setTargetAudience] = useState("");
    const [brandCategory, setBrandCategory] = useState("");

    useEffect(() => {
        setBrandName(String(stepData.brand_name ?? ""));
        setBrandUrl(String(stepData.brand_url ?? ""));
        setTargetAudience(String(stepData.target_audience ?? ""));
        setBrandCategory(String(stepData.brand_category ?? ""));
    }, [stepData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onNext({
            brand_name: brandName,
            brand_url: brandUrl,
            target_audience: targetAudience,
            brand_category: brandCategory,
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
                    placeholder="Awesome Brand"
                    required
                    className={inputClass}
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Brand URL
                </label>
                <input
                    type="url"
                    value={brandUrl}
                    onChange={(e) => setBrandUrl(e.target.value)}
                    placeholder="https://yourbrand.com"
                    className={inputClass}
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Target Audience
                </label>
                <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="e.g. Millennials aged 25–35 interested in fitness"
                    className={inputClass}
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Brand Category
                </label>
                <select
                    value={brandCategory}
                    onChange={(e) => setBrandCategory(e.target.value)}
                    className={inputClass}
                >
                    <option value="">Select a category</option>
                    {BRAND_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            <button
                type="submit"
                disabled={loading || !brandName}
                className="w-full mt-2 flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Brand
            </button>
        </form>
    );
}
