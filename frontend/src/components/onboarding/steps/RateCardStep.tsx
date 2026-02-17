"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StepProps } from "../OnboardingWizard";

const CURRENCIES = [
    { value: "USD", label: "USD — US Dollar" },
    { value: "EUR", label: "EUR — Euro" },
    { value: "GBP", label: "GBP — British Pound" },
    { value: "INR", label: "INR — Indian Rupee" },
];

const RATE_FIELDS = [
    { key: "instagram_post", label: "Instagram Post" },
    { key: "instagram_story", label: "Instagram Story" },
    { key: "instagram_reel", label: "Instagram Reel" },
    { key: "youtube_video", label: "YouTube Video" },
    { key: "youtube_short", label: "YouTube Short" },
    { key: "tiktok_video", label: "TikTok Video" },
];

const inputClass = cn(
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3",
    "text-slate-900 font-medium placeholder:text-slate-400",
    "focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent",
    "transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
);

type RateKey = typeof RATE_FIELDS[number]["key"];
type Rates = Record<RateKey, string>;

const initialRates: Rates = RATE_FIELDS.reduce((acc, { key }) => {
    acc[key] = "";
    return acc;
}, {} as Rates);

export function RateCardStep({ onNext, loading }: StepProps) {
    const [currency, setCurrency] = useState("USD");
    const [rates, setRates] = useState<Rates>(initialRates);

    const handleRateChange = (key: string, value: string) => {
        setRates((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericRates: Record<string, number | null> = {};
        for (const { key } of RATE_FIELDS) {
            numericRates[key] = rates[key] ? Number(rates[key]) : null;
        }
        onNext({
            currency,
            rates: numericRates,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Currency
                </label>
                <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className={cn(
                        "w-full rounded-xl border border-slate-200 bg-white px-4 py-3",
                        "text-slate-900 font-medium",
                        "focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent",
                        "transition-all",
                    )}
                >
                    {CURRENCIES.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>
            </div>

            <div>
                <p className="text-sm font-bold text-slate-700 mb-3">Rate per placement</p>
                <div className="space-y-3">
                    {RATE_FIELDS.map(({ key, label }) => (
                        <div key={key} className="flex items-center gap-4">
                            <label className="w-44 text-sm font-bold text-slate-600 flex-shrink-0">
                                {label}
                            </label>
                            <div className="flex-1 relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                                    {currency === "INR" ? "₹" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$"}
                                </span>
                                <input
                                    type="number"
                                    value={rates[key]}
                                    onChange={(e) => handleRateChange(key, e.target.value)}
                                    placeholder="0"
                                    min={0}
                                    className={cn(inputClass, "pl-8")}
                                />
                            </div>
                        </div>
                    ))}
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
