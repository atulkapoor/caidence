"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StepProps } from "../OnboardingWizard";

const INDUSTRIES = [
    "Advertising & Marketing",
    "Consumer Goods",
    "E-Commerce",
    "Entertainment & Media",
    "Fashion & Beauty",
    "Food & Beverage",
    "Health & Wellness",
    "Sports & Fitness",
    "Technology",
    "Travel & Hospitality",
    "Other",
];

const COMPANY_SIZES = [
    { value: "1-10", label: "1–10 employees" },
    { value: "11-50", label: "11–50 employees" },
    { value: "51-200", label: "51–200 employees" },
    { value: "200+", label: "200+ employees" },
];

const inputClass = cn(
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3",
    "text-slate-900 font-medium placeholder:text-slate-400",
    "focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent",
    "transition-all",
);

export function CompanyInfoStep({ onNext, loading, stepData }: StepProps) {
    const [companyName, setCompanyName] = useState("");
    const [legalEntityName, setLegalEntityName] = useState("");
    const [industry, setIndustry] = useState("");
    const [companySize, setCompanySize] = useState("");
    const [websiteUrl, setWebsiteUrl] = useState("");
    const [phone, setPhone] = useState("");
    const [websiteError, setWebsiteError] = useState("");

    const isValidWebsiteUrl = (value: string) => {
        if (!value.trim()) return true;
        try {
            const parsed = new URL(value);
            return (parsed.protocol === "http:" || parsed.protocol === "https:") && Boolean(parsed.hostname);
        } catch {
            return false;
        }
    };

    useEffect(() => {
        setCompanyName(String(stepData.company_name ?? ""));
        setLegalEntityName(String(stepData.legal_entity_name ?? ""));
        setIndustry(String(stepData.industry ?? ""));
        setCompanySize(String(stepData.company_size ?? ""));
        setWebsiteUrl(String(stepData.website_url ?? ""));
        setPhone(String(stepData.phone ?? ""));
    }, [stepData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!isValidWebsiteUrl(websiteUrl)) {
            setWebsiteError("Enter a valid URL like https://yourcompany.com");
            return;
        }

        setWebsiteError("");
        onNext({
            company_name: companyName,
            legal_entity_name: legalEntityName,
            industry,
            company_size: companySize,
            website_url: websiteUrl,
            phone,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Company Name <span className="text-red-400">*</span>
                </label>
                <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Acme Agency"
                    required
                    className={inputClass}
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Legal Entity Name
                </label>
                <input
                    type="text"
                    value={legalEntityName}
                    onChange={(e) => setLegalEntityName(e.target.value)}
                    placeholder="Acme Agency LLC"
                    className={inputClass}
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Industry
                </label>
                <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className={inputClass}
                >
                    <option value="">Select an industry</option>
                    {INDUSTRIES.map((ind) => (
                        <option key={ind} value={ind}>{ind}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Company Size
                </label>
                <div className="grid grid-cols-2 gap-3">
                    {COMPANY_SIZES.map(({ value, label }) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setCompanySize(value)}
                            className={cn(
                                "rounded-xl border px-4 py-3 text-sm font-bold transition-all text-left",
                                companySize === value
                                    ? "border-slate-900 bg-slate-900 text-white"
                                    : "border-slate-200 text-slate-600 hover:border-slate-400",
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Website URL
                </label>
                <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => {
                        setWebsiteUrl(e.target.value);
                        if (websiteError) setWebsiteError("");
                    }}
                    onBlur={() => {
                        if (!isValidWebsiteUrl(websiteUrl)) {
                            setWebsiteError("Enter a valid URL like https://yourcompany.com");
                        } else {
                            setWebsiteError("");
                        }
                    }}
                    placeholder="https://yourcompany.com"
                    aria-invalid={websiteError ? "true" : "false"}
                    className={inputClass}
                />
                {websiteError && (
                    <p className="mt-1 text-xs font-medium text-red-500">{websiteError}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Phone
                </label>
                <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="+1 (555) 000-0000"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className={inputClass}
                />
            </div>

            <button
                type="submit"
                disabled={loading || !companyName}
                className="w-full mt-2 flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Continue
            </button>
        </form>
    );
}
