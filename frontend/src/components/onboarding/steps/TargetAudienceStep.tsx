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

const numberInputClass = cn(
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3",
    "text-slate-900 font-medium placeholder:text-slate-400",
    "focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent",
    "transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
);

export function TargetAudienceStep({ onNext, loading, stepData }: StepProps) {
    const [ageMin, setAgeMin] = useState("");
    const [ageMax, setAgeMax] = useState("");
    const [genderMale, setGenderMale] = useState("");
    const [genderFemale, setGenderFemale] = useState("");
    const [genderOther, setGenderOther] = useState("");
    const [primaryLocations, setPrimaryLocations] = useState("");
    const [keyInterests, setKeyInterests] = useState("");

    useEffect(() => {
        setAgeMin(stepData.age_range_min != null ? String(stepData.age_range_min) : "");
        setAgeMax(stepData.age_range_max != null ? String(stepData.age_range_max) : "");
        const split = (stepData.gender_split as Record<string, unknown> | undefined) || {};
        setGenderMale(split.male != null ? String(split.male) : "");
        setGenderFemale(split.female != null ? String(split.female) : "");
        setGenderOther(split.other != null ? String(split.other) : "");
        const locations = Array.isArray(stepData.primary_locations) ? stepData.primary_locations : [];
        const interests = Array.isArray(stepData.key_interests) ? stepData.key_interests : [];
        setPrimaryLocations(locations.map((v) => String(v)).join(", "));
        setKeyInterests(interests.map((v) => String(v)).join(", "));
    }, [stepData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onNext({
            age_range_min: ageMin ? Number(ageMin) : null,
            age_range_max: ageMax ? Number(ageMax) : null,
            gender_split: {
                male: genderMale ? Number(genderMale) : null,
                female: genderFemale ? Number(genderFemale) : null,
                other: genderOther ? Number(genderOther) : null,
            },
            primary_locations: primaryLocations
                ? primaryLocations.split(",").map((s) => s.trim()).filter(Boolean)
                : [],
            key_interests: keyInterests
                ? keyInterests.split(",").map((s) => s.trim()).filter(Boolean)
                : [],
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Age Range
                </label>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Min Age</label>
                        <input
                            type="number"
                            value={ageMin}
                            onChange={(e) => setAgeMin(e.target.value)}
                            placeholder="18"
                            min={0}
                            max={100}
                            className={numberInputClass}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Max Age</label>
                        <input
                            type="number"
                            value={ageMax}
                            onChange={(e) => setAgeMax(e.target.value)}
                            placeholder="35"
                            min={0}
                            max={100}
                            className={numberInputClass}
                        />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Gender Split (%)
                </label>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Male</label>
                        <input
                            type="number"
                            value={genderMale}
                            onChange={(e) => setGenderMale(e.target.value)}
                            placeholder="40"
                            min={0}
                            max={100}
                            className={numberInputClass}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Female</label>
                        <input
                            type="number"
                            value={genderFemale}
                            onChange={(e) => setGenderFemale(e.target.value)}
                            placeholder="55"
                            min={0}
                            max={100}
                            className={numberInputClass}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Other</label>
                        <input
                            type="number"
                            value={genderOther}
                            onChange={(e) => setGenderOther(e.target.value)}
                            placeholder="5"
                            min={0}
                            max={100}
                            className={numberInputClass}
                        />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Primary Locations
                </label>
                <input
                    type="text"
                    value={primaryLocations}
                    onChange={(e) => setPrimaryLocations(e.target.value)}
                    placeholder="United States, United Kingdom, Canada"
                    className={inputClass}
                />
                <p className="text-xs text-slate-400 font-medium mt-1.5">Separate locations with commas</p>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Key Interests
                </label>
                <input
                    type="text"
                    value={keyInterests}
                    onChange={(e) => setKeyInterests(e.target.value)}
                    placeholder="Fitness, Nutrition, Outdoor activities"
                    className={inputClass}
                />
                <p className="text-xs text-slate-400 font-medium mt-1.5">Separate interests with commas</p>
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
