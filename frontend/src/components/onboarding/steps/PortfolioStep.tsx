"use client";

import { useEffect, useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StepProps } from "../OnboardingWizard";

interface PortfolioItem {
    title: string;
    url: string;
}

const inputClass = cn(
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3",
    "text-slate-900 font-medium placeholder:text-slate-400",
    "focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent",
    "transition-all",
);

export function PortfolioStep({ onNext, loading, stepData }: StepProps) {
    const [mediaKitUrl, setMediaKitUrl] = useState("");
    const [portfolioUrl, setPortfolioUrl] = useState("");
    const [items, setItems] = useState<PortfolioItem[]>([{ title: "", url: "" }]);

    useEffect(() => {
        setMediaKitUrl(String(stepData.media_kit_url ?? ""));
        setPortfolioUrl(String(stepData.portfolio_url ?? ""));
        const rawItems = Array.isArray(stepData.portfolio_items) ? stepData.portfolio_items : [];
        const normalized = rawItems
            .map((item) => {
                if (typeof item !== "object" || item === null) return null;
                const row = item as Record<string, unknown>;
                return {
                    title: String(row.title ?? ""),
                    url: String(row.url ?? ""),
                };
            })
            .filter(Boolean) as PortfolioItem[];
        setItems(normalized.length > 0 ? normalized : [{ title: "", url: "" }]);
    }, [stepData]);

    const handleItemChange = (index: number, field: keyof PortfolioItem, value: string) => {
        setItems((prev) =>
            prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
        );
    };

    const handleAddItem = () => {
        setItems((prev) => [...prev, { title: "", url: "" }]);
    };

    const handleRemoveItem = (index: number) => {
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validItems = items.filter((item) => item.title.trim() || item.url.trim());
        onNext({
            media_kit_url: mediaKitUrl,
            portfolio_url: portfolioUrl,
            portfolio_items: validItems,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Media Kit URL
                </label>
                <input
                    type="url"
                    value={mediaKitUrl}
                    onChange={(e) => setMediaKitUrl(e.target.value)}
                    placeholder="https://drive.google.com/your-media-kit"
                    className={inputClass}
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Portfolio URL
                </label>
                <input
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://yourportfolio.com"
                    className={inputClass}
                />
            </div>

            <div>
                <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-bold text-slate-700">
                        Portfolio Items
                    </label>
                    <button
                        type="button"
                        onClick={handleAddItem}
                        className="flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add item
                    </button>
                </div>

                <div className="space-y-3">
                    {items.map((item, index) => (
                        <div key={index} className="flex gap-3 items-start">
                            <div className="flex-1 grid grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    value={item.title}
                                    onChange={(e) => handleItemChange(index, "title", e.target.value)}
                                    placeholder="Campaign title"
                                    className={inputClass}
                                />
                                <input
                                    type="url"
                                    value={item.url}
                                    onChange={(e) => handleItemChange(index, "url", e.target.value)}
                                    placeholder="https://..."
                                    className={inputClass}
                                />
                            </div>
                            {items.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveItem(index)}
                                    className="mt-3 p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
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
