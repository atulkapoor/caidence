"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StepProps } from "../OnboardingWizard";

const inputClass = cn(
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3",
    "text-slate-900 font-medium placeholder:text-slate-400",
    "focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent",
    "transition-all",
);

const textareaClass = cn(inputClass, "resize-none");

export function BrandGuidelinesStep({ onNext, loading, stepData }: StepProps) {
    const [dos, setDos] = useState("");
    const [donts, setDonts] = useState("");
    const [approvedHashtags, setApprovedHashtags] = useState("");
    const [restrictedWords, setRestrictedWords] = useState("");
    const [toneGuidelines, setToneGuidelines] = useState("");

    useEffect(() => {
        setDos(String(stepData.dos ?? ""));
        setDonts(String(stepData.donts ?? ""));
        const hashtags = Array.isArray(stepData.approved_hashtags) ? stepData.approved_hashtags : [];
        const words = Array.isArray(stepData.restricted_words) ? stepData.restricted_words : [];
        setApprovedHashtags(hashtags.map((v) => String(v)).join(", "));
        setRestrictedWords(words.map((v) => String(v)).join(", "));
        setToneGuidelines(String(stepData.tone_guidelines ?? ""));
    }, [stepData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onNext({
            dos,
            donts,
            approved_hashtags: approvedHashtags
                ? approvedHashtags.split(",").map((s) => s.trim()).filter(Boolean)
                : [],
            restricted_words: restrictedWords
                ? restrictedWords.split(",").map((s) => s.trim()).filter(Boolean)
                : [],
            tone_guidelines: toneGuidelines,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Do&apos;s
                </label>
                <textarea
                    value={dos}
                    onChange={(e) => setDos(e.target.value)}
                    placeholder="Use high-quality images&#10;Tag our official account&#10;Share authentic experiences"
                    rows={4}
                    className={textareaClass}
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Don&apos;ts
                </label>
                <textarea
                    value={donts}
                    onChange={(e) => setDonts(e.target.value)}
                    placeholder="Do not mention competitors&#10;Avoid political topics&#10;Don&apos;t use stock photos"
                    rows={4}
                    className={textareaClass}
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Approved Hashtags
                </label>
                <input
                    type="text"
                    value={approvedHashtags}
                    onChange={(e) => setApprovedHashtags(e.target.value)}
                    placeholder="#YourBrand, #BrandCampaign, #YourSlogan"
                    className={inputClass}
                />
                <p className="text-xs text-slate-400 font-medium mt-1.5">Separate hashtags with commas</p>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Restricted Words
                </label>
                <input
                    type="text"
                    value={restrictedWords}
                    onChange={(e) => setRestrictedWords(e.target.value)}
                    placeholder="competitor, cheap, free trial"
                    className={inputClass}
                />
                <p className="text-xs text-slate-400 font-medium mt-1.5">Separate words with commas</p>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Tone Guidelines
                </label>
                <textarea
                    value={toneGuidelines}
                    onChange={(e) => setToneGuidelines(e.target.value)}
                    placeholder="Always be warm and approachable. Use inclusive language. Emphasize community and shared values..."
                    rows={4}
                    className={textareaClass}
                />
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
